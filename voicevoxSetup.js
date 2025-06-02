const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const cheerio = require("cheerio");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const AdmZip = require("adm-zip");

const LIB_DIR = path.join(__dirname, "lib", "voicevox");

async function ensureDir(dir) {
  try {
    await fsp.mkdir(dir, { recursive: true });
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }
}

async function remove(targetPath) {
  try {
    const stat = await fsp.stat(targetPath);
    if (stat.isDirectory()) {
      const files = await fsp.readdir(targetPath);
      await Promise.all(
        files.map((file) => remove(path.join(targetPath, file)))
      );
      await fsp.rmdir(targetPath);
    } else {
      await fsp.unlink(targetPath);
    }
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}

async function move(src, dest, overwrite = true) {
  try {
    if (overwrite) {
      await remove(dest);
    }
    await fsp.rename(src, dest);
  } catch (e) {
    if (e.code === "EXDEV") {
      // Cross-device move fallback
      await fsp.copyFile(src, dest);
      await fsp.unlink(src);
    } else {
      throw e;
    }
  }
}

async function getLatestVoiceVoxZipUrl() {
  // 最新リリースページへリダイレクト
  const res = await fetch(
    "https://github.com/VOICEVOX/voicevox/releases/latest",
    { redirect: "manual" }
  );
  const latestUrl = res.headers.get("location") || res.url;
  const htmlRes = await fetch(latestUrl);
  const html = await htmlRes.text();
  const $ = cheerio.load(html);
  let zipUrl = null;
  $('a[href$=".zip"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("voicevox-windows-cpu-")) {
      zipUrl = href;
      return false;
    }
  });
  return zipUrl;
}

async function downloadFile(url, dest) {
  // 既にファイルが存在する場合はダウンロードしない
  if (fs.existsSync(dest)) {
    console.log(
      `既にファイルが存在するためダウンロードをスキップします: ${dest}`
    );
    return new Promise((resolve) => resolve());
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ダウンロード失敗: ${res.statusText}`);
  const fileStream = fs.createWriteStream(dest);
  return new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
}

async function extractAndClean(zipPath, extractDir) {
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractDir, true);

  // VOICEVOX/vv-engine のパス
  const voicevoxDir = path.join(extractDir, "VOICEVOX");
  const vvEngineDir = path.join(voicevoxDir, "vv-engine");

  // vv-engineの中身をvoicevox直下に移動
  try {
    const vvEngineItems = await fsp.readdir(vvEngineDir);
    for (const item of vvEngineItems) {
      await move(
        path.join(vvEngineDir, item),
        path.join(extractDir, item),
        true
      );
    }
  } catch (e) {
    throw new Error("VOICEVOX/vv-engine フォルダが見つかりませんでした");
  }

  // VOICEVOXフォルダごと削除（vv-engineも含めて不要ファイルを消す）
  await remove(voicevoxDir);

  // lib/voicevox直下にvv-engine以外のファイル・フォルダがあれば削除（念のため）
  const items = await fsp.readdir(extractDir);
  for (const item of items) {
    if (item === "." || item === "..") continue;
    const itemPath = path.join(extractDir, item);
    // vv-engineフォルダは既に消えているはずですが、念のため
    if (item === "vv-engine") {
      await remove(itemPath);
    }
  }
}

async function setupVoicevox() {
  await ensureDir(LIB_DIR);
  console.log("==============================================");
  console.log("VOICEVOXセットアップ処理を開始します。");
  console.log("この処理は一度VOICEVOXをダウンロードする必要があるため、");
  console.log("数分以上時間がかかる場合があります。しばらくお待ちください。");
  console.log("==============================================");
  const zipUrl = await getLatestVoiceVoxZipUrl();
  if (!zipUrl)
    throw new Error("voicevox-windows-cpu-*.zipが見つかりませんでした");
  const zipName = path.basename(zipUrl);
  const zipPath = path.join(LIB_DIR, zipName);

  console.log("ダウンロード開始:", zipUrl);
  await downloadFile(zipUrl, zipPath);
  console.log("ダウンロード完了:", zipPath);

  await extractAndClean(zipPath, LIB_DIR);
  await remove(zipPath);
  console.log("セットアップ完了");
}

setupVoicevox().catch((e) => {
  console.error("エラー:", e);
  process.exit(1);
});
