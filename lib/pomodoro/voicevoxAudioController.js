const fetch = (...args) =>
	import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
require('dotenv').config({ quiet: true });

async function create(audioType, speakerId) {
	const uri = process.env.voicevox_api_uri || 'http://localhost:50021';

	// 音声タイプの検証とファイルパスと話す内容の指定
	if (!audioType || !speakerId)
		throw new Error('audioTypeとspeakerIdは必須です');

	let filePath, text;
	if (audioType === 'startWorking') {
		filePath = `../../assets/audio/${speakerId}/startWorking.wav`;
		text = '作業時間が始まります。集中して取り組んでください。';
	} else if (audioType === 'startBreaking') {
		filePath = `../../assets/audio/${speakerId}/startBreaking.wav`;
		text = '休憩時間が始まります。リラックスして休んでください。';
	} else if (audioType === 'startLongBreaking') {
		filePath = `../../assets/audio/${speakerId}/startLongBreaking.wav`;
		text = '長めの休憩時間が始まります。しっかりとリフレッシュしてください。';
	} else if (audioType === 'stopPomodoro') {
		filePath = `../../assets/audio/${speakerId}/stopPomodoro.wav`;
		text = 'ポモドーロタイマーが完了しました。お疲れ様でした！';
	} else {
		throw new Error('Invalid audio type');
	}

	// ディレクトリの確認。なければ作成
	if (!fs.existsSync(`../../assets/audio/${speakerId}`))
		fs.mkdirSync(`../../assets/audio/${speakerId}`, { recursive: true });

	// audio_query
	const audioQueryRes = await fetch(
		`${uri}/audio_query?text=${encodeURI(text)}&speaker=${speakerId}`,
		{ method: 'POST' },
	);
	const audioQuery = await audioQueryRes.json();

	// synthesis
	const voiceDataRes = await fetch(`${uri}/synthesis?speaker=${speakerId}`, {
		method: 'POST',
		body: JSON.stringify(audioQuery),
		headers: { accept: 'audio/wav', 'Content-Type': 'application/json' },
	});
	const arrayBuffer = await voiceDataRes.arrayBuffer();

	// Bufferに変換して書き出す
	fs.writeFileSync(filePath, Buffer.from(arrayBuffer), 'binary');

	// 音声リストの更新
	await sync();
}

async function get(audioType, speakerId) {
	// 音声タイプの検証とファイルパスの指定
	if (!audioType || !speakerId)
		throw new Error('audioTypeとspeakerIdは必須です');
	let filePath;
	if (audioType === 'startWorking') {
		filePath = `../../assets/audio/${speakerId}/startWorking.wav`;
	} else if (audioType === 'startBreaking') {
		filePath = `../../assets/audio/${speakerId}/startBreaking.wav`;
	} else if (audioType === 'startLongBreaking') {
		filePath = `../../assets/audio/${speakerId}/startLongBreaking.wav`;
	} else if (audioType === 'stopPomodoro') {
		filePath = `../../assets/audio/${speakerId}/stopPomodoro.wav`;
	} else {
		throw new Error('Invalid audio type');
	}
	// ファイルの存在確認
	if (!fs.existsSync(filePath)) await create(audioType, speakerId); // 存在しない場合は作成

	// filePathを返す
	return filePath;
}

async function getSpeakerName(speakerId) {
	const uri = process.env.voicevox_api_uri || 'http://localhost:50021';
	const speakersRes = await fetch(`${uri}/speakers`, { method: 'GET' });
	const speakers = await speakersRes.json();
	let speakerName = null;
	for (const character of speakers) {
		const style = character.styles.find(
			(style) => style.id === Number(speakerId),
		);
		if (style) {
			speakerName = `${character.name}_${style.name}`;
		}
	}
	return speakerName ? speakerName : `Unknown Speaker (id:${speakerId})`;
}

async function sync() {
	// ./audioフォルダ内の音声ファイルをvoiceList_format.json形式で保存
	const voiceList = {};

	// ディレクトリ情報を収集
	const speakerDirs = fs
		.readdirSync('../../assets/audio', { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);

	// 音声ファイル情報を収集
	for (const speakerId of speakerDirs) {
		const speakerPath = `../../assets/audio/${speakerId}`;
		const speakerName = await getSpeakerName(speakerId); // スピーカー名を取得する関数を実装する必要があります
		voiceList[speakerId] = {
			name: speakerName,
			audio: {},
		};
		const files = fs.readdirSync(speakerPath);
		files.forEach((file) => {
			if (file.endsWith('.wav')) {
				if (file === 'startWorking.wav') {
					voiceList[speakerId].audio.startWorking =
						`${speakerPath}/startWorking.wav`;
				} else if (file === 'startBreaking.wav') {
					voiceList[speakerId].audio.startBreaking =
						`${speakerPath}/startBreaking.wav`;
				} else if (file === 'startLongBreaking.wav') {
					voiceList[speakerId].audio.startLongBreaking =
						`${speakerPath}/startLongBreaking.wav`;
				}
			}
		});
	}

	fs.writeFileSync(
		'../../assets/audio/voiceList.json',
		JSON.stringify(voiceList),
	);
}

async function list() {
	// 一覧を更新
	await sync();

	// ../../assets/audio/voiceList.jsonから音声ファイルの一覧を取得
	const voiceList = JSON.parse(
		fs.readFileSync('../../assets/audio/voiceList.json', 'utf8'),
	);
	// nameだけを配列で返す
	return Object.values(voiceList).map((item) => item.name);
}

async function reset() {
	// ./audioフォルダ内の音声ファイルを全て削除
	const audioFiles = fs
		.readdirSync('../../assets/audio')
		.filter((file) => file.endsWith('.wav'));
	audioFiles.forEach((file) => {
		fs.unlinkSync(`../../assets/audio/${file}`);
	});

	// 一覧を更新
	await sync();
}

module.exports = { create, get, sync, list, reset };
