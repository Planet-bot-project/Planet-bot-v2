const fetch = (...args) =>
	import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cheerio = require('cheerio');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const AdmZip = require('adm-zip');

const execAsync = promisify(exec);

// Constants
const LIB_DIR = path.join(__dirname, 'lib', 'pomodoro', 'voicevox');
const VOICEVOX_ENGINE_PATH = path.join(
	LIB_DIR,
	process.platform === 'win32' ? 'run.exe' : 'run',
);
const VOICEVOX_MANIFEST_PATH = path.join(LIB_DIR, 'engine_manifest.json');
const GITHUB_RELEASES_URL =
	'https://github.com/VOICEVOX/voicevox/releases/latest';

const PLATFORM_CONFIG = {
	win32: {
		fileExtension: '.zip',
		filePattern: 'voicevox-windows-cpu-',
		executableName: 'run.exe',
	},
	linux: {
		fileExtension: '.tar.gz',
		filePattern: 'voicevox-linux-cpu-x64-',
		executableName: 'run',
	},
};

async function ensureDir(dir) {
	try {
		await fsp.mkdir(dir, { recursive: true });
	} catch (e) {
		if (e.code !== 'EEXIST') throw e;
	}
}

async function remove(targetPath) {
	try {
		const stat = await fsp.stat(targetPath);
		if (stat.isDirectory()) {
			const files = await fsp.readdir(targetPath);
			await Promise.all(
				files.map((file) => remove(path.join(targetPath, file))),
			);
			await fsp.rmdir(targetPath);
		} else {
			await fsp.unlink(targetPath);
		}
	} catch (e) {
		if (e.code !== 'ENOENT') throw e;
	}
}

async function move(src, dest, overwrite = true) {
	try {
		if (overwrite) {
			await remove(dest);
		}
		await fsp.rename(src, dest);
	} catch (e) {
		if (e.code === 'EXDEV') {
			// Cross-device move fallback
			await fsp.copyFile(src, dest);
			await fsp.unlink(src);
		} else {
			throw e;
		}
	}
}

async function getLatestVoiceVoxUrl() {
	const platform = process.platform;
	const config = PLATFORM_CONFIG[platform];

	if (!config) {
		return null;
	}

	// 最新リリースページへリダイレクト
	const res = await fetch(GITHUB_RELEASES_URL, { redirect: 'manual' });
	const latestUrl = res.headers.get('location') || res.url;
	const htmlRes = await fetch(latestUrl);
	const html = await htmlRes.text();
	const $ = cheerio.load(html);

	let downloadUrl = null;
	$(`a[href$="${config.fileExtension}"]`).each((_, el) => {
		const href = $(el).attr('href');
		if (href && href.includes(config.filePattern)) {
			downloadUrl = href;
			return false;
		}
	});

	return downloadUrl;
}

function extractVersionFromUrl(url) {
	const match = url.match(/voicevox-(?:windows|linux)-cpu-([\d.]+)/);
	return match ? match[1].replace(/\.$/, '') : null;
}

function getLocalVersion() {
	if (!fs.existsSync(VOICEVOX_MANIFEST_PATH)) {
		return null;
	}
	try {
		const manifest = JSON.parse(
			fs.readFileSync(VOICEVOX_MANIFEST_PATH, 'utf-8'),
		);
		return manifest.version;
	} catch (error) {
		console.warn(
			'マニフェストファイルの読み込みに失敗しました:',
			error.message,
		);
		return null;
	}
}

function shouldSkipDownload(url) {
	if (!fs.existsSync(VOICEVOX_ENGINE_PATH)) {
		return false;
	}

	const localVersion = getLocalVersion();
	const latestVersion = extractVersionFromUrl(url);

	return localVersion && latestVersion && localVersion === latestVersion;
}

async function downloadFile(url, dest) {
	if (shouldSkipDownload(url)) {
		console.warn(
			`既に最新バージョンのVOICEVOXが存在します。ダウンロードをスキップします。 (version: ${getLocalVersion()})`,
		);
		process.exit(1);
	}

	// 既存のVOICEVOXファイルをクリーンアップ
	console.info('既存のVOICEVOXファイルをクリーンアップ中...');
	const items = await fsp.readdir(LIB_DIR);
	for (const item of items) {
		await remove(path.join(LIB_DIR, item));
	}
	console.info('lib/pomodoro/voicevoxの古いデータのクリーンアップ完了');

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`ダウンロード失敗: ${res.statusText}`);
	}

	const fileStream = fs.createWriteStream(dest);
	return new Promise((resolve, reject) => {
		res.body.pipe(fileStream);
		res.body.on('error', reject);
		fileStream.on('finish', resolve);
	});
}

async function makeExecutable(filePath) {
	if (process.platform !== 'linux') {
		return;
	}

	try {
		await execAsync(`chmod +x "${filePath}"`);
		console.info(`実行権限を付与しました: ${filePath}`);
	} catch (err) {
		throw new Error(`実行権限の付与に失敗しました: ${err}`);
	}
}

function getVoicevoxExecutablePath() {
	const platform = process.platform;
	const config = PLATFORM_CONFIG[platform];

	if (!config) {
		return null;
	}

	const executablePath = path.join(LIB_DIR, config.executableName);

	if (fs.existsSync(executablePath)) {
		console.info(`実行ファイルが見つかりました: ${executablePath}`);
		return executablePath;
	}

	console.info(`実行ファイルが見つかりません: ${executablePath}`);
	return null;
}

async function extractAndClean(zipPath, extractDir) {
	const zip = new AdmZip(zipPath);
	zip.extractAllTo(extractDir, true);

	// VOICEVOX/vv-engine のパス
	const voicevoxDir = path.join(extractDir, 'VOICEVOX');
	const vvEngineDir = path.join(voicevoxDir, 'vv-engine');

	// vv-engineの中身をvoicevox直下に移動
	try {
		const vvEngineItems = await fsp.readdir(vvEngineDir);
		for (const item of vvEngineItems) {
			await move(
				path.join(vvEngineDir, item),
				path.join(extractDir, item),
				true,
			);
		}
	} catch (err) {
		throw new Error(
			`VOICEVOX/vv-engine フォルダが見つかりませんでした\n${err}`,
		);
	}

	// VOICEVOXフォルダごと削除（vv-engineも含めて不要ファイルを消す）
	await remove(voicevoxDir);

	// lib/voicevox直下にvv-engine以外のファイル・フォルダがあれば削除（念のため）
	const items = await fsp.readdir(extractDir);
	for (const item of items) {
		if (item === '.' || item === '..') continue;
		const itemPath = path.join(extractDir, item);
		// vv-engineフォルダは既に消えているはずですが、念のため
		if (item === 'vv-engine') {
			await remove(itemPath);
		}
	}
}

async function extractTarGz(tarGzPath, extractDir) {
	try {
		// tar.gzファイルを解凍
		await execAsync(`tar -xzf "${tarGzPath}" -C "${extractDir}"`);
		console.info(`tar.gzファイルを解凍しました: ${tarGzPath}`);

		// 解凍されたディレクトリを確認
		const items = await fsp.readdir(extractDir);
		console.info('解凍後のディレクトリ内容:', items);

		// VOICEVOXディレクトリを探す
		const voicevoxDir = items.find((item) => {
			const itemPath = path.join(extractDir, item);
			return (
				fs.statSync(itemPath).isDirectory() &&
				(item === 'VOICEVOX' || item.toLowerCase().includes('voicevox'))
			);
		});

		if (voicevoxDir) {
			const voicevoxPath = path.join(extractDir, voicevoxDir);
			console.info(`VOICEVOXディレクトリが見つかりました: ${voicevoxPath}`);

			// VOICEVOX/vv-engine のパス
			const vvEngineDir = path.join(voicevoxPath, 'vv-engine');

			if (fs.existsSync(vvEngineDir)) {
				console.info(`vv-engineディレクトリが見つかりました: ${vvEngineDir}`);

				// vv-engineの中身をvoicevox直下に移動
				const vvEngineItems = await fsp.readdir(vvEngineDir);
				for (const item of vvEngineItems) {
					await move(
						path.join(vvEngineDir, item),
						path.join(extractDir, item),
						true,
					);
				}
				console.info('vv-engineの内容を移動しました');
			} else {
				// vv-engineがない場合は、VOICEVOXディレクトリの中身をそのまま移動
				console.info(
					'vv-engineが見つからないため、VOICEVOXディレクトリの中身を移動します',
				);
				const voicevoxItems = await fsp.readdir(voicevoxPath);
				for (const item of voicevoxItems) {
					await move(
						path.join(voicevoxPath, item),
						path.join(extractDir, item),
						true,
					);
				}
			}

			// VOICEVOXフォルダを削除
			await remove(voicevoxPath);
			console.info('VOICEVOXディレクトリを削除しました');
		} else {
			// VOICEVOXディレクトリが見つからない場合は、最初に見つかったディレクトリの中身を移動
			const extractedDir = items.find((item) => {
				const itemPath = path.join(extractDir, item);
				return fs.statSync(itemPath).isDirectory();
			});

			if (extractedDir) {
				console.info(`解凍されたディレクトリを処理します: ${extractedDir}`);
				const sourcePath = path.join(extractDir, extractedDir);
				const sourceItems = await fsp.readdir(sourcePath);

				// 解凍されたディレクトリの中身を上の階層に移動
				for (const item of sourceItems) {
					await move(
						path.join(sourcePath, item),
						path.join(extractDir, item),
						true,
					);
				}

				// 空になったディレクトリを削除
				await remove(sourcePath);
			}
		}

		// runファイルに実行権限を付与
		const runPath = path.join(extractDir, 'run');
		if (fs.existsSync(runPath)) {
			await makeExecutable(runPath);
			console.info(`runファイルに実行権限を付与しました: ${runPath}`);
		}
	} catch (err) {
		throw new Error(`tar.gz解凍エラー: ${err}`);
	}
}

function logSetupHeader(platform) {
	console.info('==============================================');
	console.info('VOICEVOXセットアップ処理を開始します。');
	console.info('この処理は一度VOICEVOXをダウンロードする必要があるため、');
	console.info('数分以上時間がかかる場合があります。しばらくお待ちください。');
	console.info('==============================================');
	console.info(`検出されたプラットフォーム: ${platform}`);
}

async function setupVoicevox() {
	// lib/voicevoxディレクトリが無ければ作成
	await ensureDir(LIB_DIR);

	const platform = process.platform;
	if (!PLATFORM_CONFIG[platform]) {
		throw new Error(`サポートされていないプラットフォーム: ${platform}`);
	}

	logSetupHeader(platform);

	const downloadUrl = await getLatestVoiceVoxUrl();
	if (!downloadUrl) {
		const config = PLATFORM_CONFIG[platform];
		const expectedPattern = `${config.filePattern}*${config.fileExtension}`;
		throw new Error(`${expectedPattern}が見つかりませんでした`);
	}

	const fileName = path.basename(downloadUrl);
	const filePath = path.join(LIB_DIR, fileName);

	console.info('ダウンロード開始:', downloadUrl);
	await downloadFile(downloadUrl, filePath);
	console.info('ダウンロード完了:', filePath);

	if (platform === 'win32') {
		// Windows: zipファイルを展開
		await extractAndClean(filePath, LIB_DIR);
		await remove(filePath);
		console.info('セットアップ完了');
	} else if (platform === 'linux') {
		// Linux: tar.gzファイルを展開
		await extractTarGz(filePath, LIB_DIR);
		await remove(filePath);
		console.info('セットアップ完了');
		const runPath = path.join(LIB_DIR, 'run');
		console.info(`VOICEVOXは以下のパスにあります: ${runPath}`);
		console.info('使用時は直接このrunファイルを実行してください。');
	}
}

// この関数をエクスポートして外部から使用可能にする
module.exports = {
	getVoicevoxExecutablePath,
	setupVoicevox,
};

// 直接実行された場合のみセットアップを実行
if (require.main === module) {
	setupVoicevox().catch((e) => {
		console.error('エラー:', e);
		process.exit(1);
	});
}
