const fs = require("fs");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildVoiceStates,
	],
	partials: [
		Partials.Message,
		Partials.Channel,
		Partials.Reaction,
		Partials.User,
	],
});
const mongoose = require("mongoose");
const express = require("express");
const app = express();
require("dotenv").config({ quiet: true });
const { spawn } = require("child_process");

//機密情報取得
const discord_token = process.env.discord_bot_token;
const mongodb_TOKEN = process.env.mongodb_token;
const PORT = 8000;

///////////////////////////////////////////////////
fs.readdir("./events", (_err, files) => {
	files.forEach((file) => {
		if (!file.endsWith(".js")) return;
		const event = require(`./events/${file}`);
		let eventName = file.split(".")[0];
		console.log(`クライアントイベントの読み込みが完了: ${eventName}`);

		// 既存のリスナーを削除してから追加
		client.removeAllListeners(eventName);
		client.on(eventName, event.bind(null, client));

		delete require.cache[require.resolve(`./events/${file}`)];
	});
});

client.commands = [];
fs.readdir("./commands", (err, files) => {
	if (err) throw err;
	files.forEach(async (f) => {
		try {
			if (f.endsWith(".js")) {
				let props = require(`./commands/${f}`);
				let propsJson = props.data.toJSON();
				client.commands.push(propsJson);
				console.log(`コマンドの読み込みが完了: ${propsJson.name}`);
			}
		} catch (err) {
			console.log(err);
		}
	});
});

if (discord_token) {
	client.login(discord_token).catch((err) => {
		console.log(
			"プロジェクトに入力したボットのトークンが間違っているか、ボットのINTENTSがオフになっています!"
		);
	});
} else {
	setTimeout(() => {
		console.log(
			"ボットのトークンをプロジェクト内の.envファイルに設定してください!"
		);
	}, 2000);
}

if (mongodb_TOKEN) {
	//mongooseについて
	mongoose.set("strictQuery", false);
	mongoose
		.connect(mongodb_TOKEN, { dbName: "serverDB" })
		.then(() => {
			console.log("データベースに接続したんだゾ");
		})
		.catch((err) => {
			console.log(err);
		});
} else {
	setTimeout(() => {
		console.log(
			"mongodbのトークンをプロジェクト内の.envファイルに設定してください!"
		);
	}, 2000);
}

app.get("/", (request, response) => {
	response?.sendStatus(200);
});
app.listen(PORT, function () {
	console.log(`[NodeJS] Application Listening on Port ${PORT}`);
});

// Voicevoxの起動
let cpuThreads =
	process.env.voicevox_cpu_threads || require("os").cpus().length; // 環境変数から取得、デフォルトはCPUコア数
//voicevoxエンジンが存在するか確認
if (!fs.existsSync(`${__dirname}/lib/pomodoro/voicevox/run.exe`))
	throw new Error(
		"VOICEVOXの実行ファイルが見つかりません。voicevoxSetup.jsを実行してセットアップしてください。"
	);
const voicevoxProcess = spawn(
	`${__dirname}/lib/pomodoro/voicevox/run.exe`,
	[`--cpu_num_threads=${cpuThreads}`],
	{
		stdio: "inherit",
	}
);

voicevoxProcess.on("error", (err) => {
	console.error("Voicevoxの起動に失敗しました:", err);
});
