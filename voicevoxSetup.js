const fetch = (...args) =>
	import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cheerio = require('cheerio');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const AdmZip = require('adm-zip');

const LIB_DIR = path.join(__dirname, 'lib', 'pomodoro', 'voicevox');

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
	// 最新リリースページへリダイレクト
	const res = await fetch(
		'https://github.com/VOICEVOX/voicevox/releases/latest',
		{ redirect: 'manual' },
	);
	const latestUrl = res.headers.get('location') || res.url;
	const htmlRes = await fetch(latestUrl);
	const html = await htmlRes.text();
	const $ = cheerio.load(html);
	let downloadUrl = null;

	const platform = process.platform;

	if (platform === 'win32') {
		// Windows用のzipファイルを検索
		$('a[href$=".zip"]').each((_, el) => {
			const href = $(el).attr('href');
			if (href && href.includes('voicevox-windows-cpu-')) {
				downloadUrl = href;
				return false;
			}
		});
	} else if (platform === 'linux') {
		// Linux用のtar.gzファイルを検索
		$('a[href$=".tar.gz"]').each((_, el) => {
			const href = $(el).attr('href');
			if (href && href.includes('voicevox-linux-cpu-x64-')) {
				downloadUrl = href;
				return false;
			}
		});
	}

	return downloadUrl;
}

async function downloadFile(url, dest) {
	// 既にファイルが存在する場合はダウンロードしない
	if (fs.existsSync(dest)) {
		console.log(
			`既にファイルが存在するためダウンロードをスキップします: ${dest}`,
		);
		return new Promise((resolve) => resolve());
	}
	const res = await fetch(url);
	if (!res.ok) throw new Error(`ダウンロード失敗: ${res.statusText}`);
	const fileStream = fs.createWriteStream(dest);
	return new Promise((resolve, reject) => {
		res.body.pipe(fileStream);
		res.body.on('error', reject);
		fileStream.on('finish', resolve);
	});
}

async function makeExecutable(filePath) {
	if (process.platform !== 'linux') return;

	const { exec } = require('child_process');
	const { promisify } = require('util');
	const execAsync = promisify(exec);

	try {
		await execAsync(`chmod +x "${filePath}"`);
		console.log(`実行権限を付与しました: ${filePath}`);
	} catch (e) {
		console.error(`実行権限の付与に失敗しました: ${e.message}`);
		throw e;
	}
}

function getVoicevoxExecutablePath() {
	const platform = process.platform;

	if (platform === 'win32') {
		const windowsPath = path.join(LIB_DIR, 'run.exe');
		if (fs.existsSync(windowsPath)) {
			return windowsPath;
		}
		return null;
	} else if (platform === 'linux') {
		// Linux用実行ファイルを検索
		try {
			// 実行可能ファイルを検索
			const runExe = path.join(LIB_DIR, 'run');

			if (fs.existsSync(runExe)) {
				console.log(`runファイルが見つかりました: ${runExe}`);

				return runExe;
			} else {
				console.log(`runファイルが見つかりません: ${runExe}`);
			}
		} catch (e) {
			console.error(`Linux用実行ファイルの検索中にエラー: ${e.message}`);
		}
		return null;
	}

	return null;
}

// この関数をエクスポートして外部から使用可能にする
module.exports = {
	getVoicevoxExecutablePath,
	setupVoicevox,
};

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
		console.log(err);
		throw new Error('VOICEVOX/vv-engine フォルダが見つかりませんでした');
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
	const { exec } = require('child_process');
	const { promisify } = require('util');
	const execAsync = promisify(exec);

	try {
		// tar.gzファイルを解凍
		await execAsync(`tar -xzf "${tarGzPath}" -C "${extractDir}"`);
		console.log(`tar.gzファイルを解凍しました: ${tarGzPath}`);

		// 解凍されたディレクトリを確認
		const items = await fsp.readdir(extractDir);
		console.log('解凍後のディレクトリ内容:', items);

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
			console.log(`VOICEVOXディレクトリが見つかりました: ${voicevoxPath}`);

			// VOICEVOX/vv-engine のパス
			const vvEngineDir = path.join(voicevoxPath, 'vv-engine');

			if (fs.existsSync(vvEngineDir)) {
				console.log(`vv-engineディレクトリが見つかりました: ${vvEngineDir}`);

				// vv-engineの中身をvoicevox直下に移動
				const vvEngineItems = await fsp.readdir(vvEngineDir);
				for (const item of vvEngineItems) {
					await move(
						path.join(vvEngineDir, item),
						path.join(extractDir, item),
						true,
					);
				}
				console.log('vv-engineの内容を移動しました');
			} else {
				// vv-engineがない場合は、VOICEVOXディレクトリの中身をそのまま移動
				console.log(
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
			console.log('VOICEVOXディレクトリを削除しました');
		} else {
			// VOICEVOXディレクトリが見つからない場合は、最初に見つかったディレクトリの中身を移動
			const extractedDir = items.find((item) => {
				const itemPath = path.join(extractDir, item);
				return fs.statSync(itemPath).isDirectory();
			});

			if (extractedDir) {
				console.log(`解凍されたディレクトリを処理します: ${extractedDir}`);
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
			console.log(`runファイルに実行権限を付与しました: ${runPath}`);
		}
	} catch (err) {
		console.error(`tar.gz解凍エラー: ${err.message}`);
		throw err;
	}
}

async function setupVoicevox() {
	await ensureDir(LIB_DIR);
	console.log('==============================================');
	console.log('VOICEVOXセットアップ処理を開始します。');
	console.log('この処理は一度VOICEVOXをダウンロードする必要があるため、');
	console.log('数分以上時間がかかる場合があります。しばらくお待ちください。');
	console.log('==============================================');

	const platform = process.platform;
	console.log(`検出されたプラットフォーム: ${platform}`);

	if (platform !== 'win32' && platform !== 'linux') {
		throw new Error(`サポートされていないプラットフォーム: ${platform}`);
	}

	const downloadUrl = await getLatestVoiceVoxUrl();
	if (!downloadUrl) {
		const expectedFile =
			platform === 'win32'
				? 'voicevox-windows-cpu-*.zip'
				: 'voicevox-linux-cpu-x64-*.tar.gz';
		throw new Error(`${expectedFile}が見つかりませんでした`);
	}

	const fileName = path.basename(downloadUrl);
	const filePath = path.join(LIB_DIR, fileName);

	console.log('ダウンロード開始:', downloadUrl);
	await downloadFile(downloadUrl, filePath);
	console.log('ダウンロード完了:', filePath);

	if (platform === 'win32') {
		// Windows: zipファイルを展開
		await extractAndClean(filePath, LIB_DIR);
		await remove(filePath);
		console.log('セットアップ完了');
	} else if (platform === 'linux') {
		// Linux: tar.gzファイルを展開
		await extractTarGz(filePath, LIB_DIR);
		await remove(filePath);
		console.log('セットアップ完了');
		const runPath = path.join(LIB_DIR, 'run');
		console.log(`VOICEVOXは以下のパスにあります: ${runPath}`);
		console.log('使用時は直接このrunファイルを実行してください。');
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
