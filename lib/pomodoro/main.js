// ポモドーロタイマーの機能
// VCにBOT以外誰も居なくなった場合は中止
// pomodoro.start(), pomodoro.status(), pomodoro.stop() で操作

const {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	entersState,
	VoiceConnectionStatus,
} = require('@discordjs/voice');
const voicevoxAudioController = require('./voicevoxAudioController.js');
const profileSchema = require('../../models/profileSchema.js');
const {
	AttachmentBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} = require('discord.js');
const generatePomodoroPicture = require('./pictureGenerator.js');

// guildごとにpomodoroStateをMapで管理
function init(client, guildId) {
	if (!client.pomodoroState.has(guildId)) {
		client.pomodoroState.set(guildId, {
			running: false,
			endTimestamp: null,
			remainingSeconds: 0,
			currentCycle: 0,
			timer: null,
			options: null,
			vcId: null,
			nextStatus: null,
			lastStatusMessageId: null,
		});
	}
}

function getPomodoroState(client, guildId) {
	if (!client.pomodoroState.has(guildId)) {
		init(client, guildId);
	}
	return client.pomodoroState.get(guildId);
}

function clearPomodoroState(client, guildId) {
	if (client.pomodoroState.has(guildId)) {
		const pomodoroState = client.pomodoroState.get(guildId);
		if (pomodoroState.timer) {
			clearInterval(pomodoroState.timer);
		}
		client.pomodoroState.delete(guildId);
		init(client, guildId); // 再初期化
	}
}

// 残り秒数を計算する関数
function calculateRemainingSeconds(endTimestamp) {
	if (!endTimestamp) return 0;
	const now = Date.now();
	const remaining = Math.max(0, Math.ceil((endTimestamp - now) / 1000));
	return remaining;
}

async function start(client, interaction, options) {
	const guildId = interaction.guildId;
	const pomodoroState = getPomodoroState(client, guildId);

	if (pomodoroState.running) {
		await interaction.reply('すでにポモドーロタイマーが動作中です。');
		return;
	}
	pomodoroState.running = true;
	pomodoroState.endTimestamp = null;
	pomodoroState.remainingSeconds = 0;
	pomodoroState.currentCycle = 0;
	pomodoroState.options = options;
	pomodoroState.vcId = interaction.member?.voice?.channelId ?? null;

	// オプションが未入力の場合はデフォルト値を設定
	try {
		const db = await profileSchema.findById(guildId);
		if (!pomodoroState.options.workTime) {
			pomodoroState.options.workTime = db.pomodoro.defaultWorkTime;
		}
		if (!pomodoroState.options.breakTime) {
			pomodoroState.options.breakTime = db.pomodoro.defaultBreakTime;
		}
		if (!pomodoroState.options.longBreakTime) {
			pomodoroState.options.longBreakTime = db.pomodoro.defaultLongBreakTime;
		}
		if (!pomodoroState.options.cycleCount) {
			pomodoroState.options.cycleCount = db.pomodoro.defaultCycleCount;
		}
		if (!pomodoroState.options.voiceNotification) {
			pomodoroState.options.voiceNotification =
				db.pomodoro.defaultVoiceNotification;
		}
		if (!pomodoroState.options.voiceNotificationVolume) {
			pomodoroState.options.voiceNotificationVolume =
				db.pomodoro.defaultVoiceNotificationVolume;
		}
	} catch (err) {
		console.error(
			'データベースからのポモドーロタイマーのデフォルト値取得に失敗:',
			err,
		);
	}

	const {
		workTime,
		breakTime,
		longBreakTime,
		cycleCount,
		voiceNotification,
		voiceNotificationVolume,
	} = pomodoroState.options;

	await interaction.reply(
		'ポモドーロタイマーを開始します！\n`/pomodoro stop`でキャンセルできます。',
	);

	while (pomodoroState.running) {
		pomodoroState.currentCycle++;
		// 作業時間
		const workEndTime = Date.now() + workTime * 60 * 1000;
		pomodoroState.endTimestamp = workEndTime;
		pomodoroState.remainingSeconds = calculateRemainingSeconds(workEndTime);
		pomodoroState.nextStatus =
			pomodoroState.currentCycle % cycleCount === 0 ? 'longBreak' : 'break';
		await sendPomodoroStatus(interaction, 'work', pomodoroState);
		if (voiceNotification)
			await notifyVoice(interaction, 'startWorking', voiceNotificationVolume);
		await waitOrCancel(workTime, client, interaction, pomodoroState);

		if (!pomodoroState.running) break;

		// 休憩時間
		if (pomodoroState.currentCycle % cycleCount === 0) {
			const longBreakEndTime = Date.now() + longBreakTime * 60 * 1000;
			pomodoroState.endTimestamp = longBreakEndTime;
			pomodoroState.remainingSeconds =
				calculateRemainingSeconds(longBreakEndTime);
			pomodoroState.nextStatus = 'work';
			await sendPomodoroStatus(interaction, 'longBreak', pomodoroState);
			if (voiceNotification)
				await notifyVoice(
					interaction,
					'startLongBreaking',
					voiceNotificationVolume,
				);
			await waitOrCancel(longBreakTime, client, interaction, pomodoroState);
		} else {
			const breakEndTime = Date.now() + breakTime * 60 * 1000;
			pomodoroState.endTimestamp = breakEndTime;
			pomodoroState.remainingSeconds = calculateRemainingSeconds(breakEndTime);
			pomodoroState.nextStatus = 'work';
			await sendPomodoroStatus(interaction, 'break', pomodoroState);
			if (voiceNotification)
				await notifyVoice(
					interaction,
					'startBreaking',
					voiceNotificationVolume,
				);
			await waitOrCancel(breakTime, client, interaction, pomodoroState);
		}
		if (!pomodoroState.running) break;
	}

	if (pomodoroState.running) {
		await interaction.channel.send(
			'ポモドーロタイマーが完了しました！お疲れ様でした！',
		);
		if (voiceNotification)
			await notifyVoice(interaction, 'stopPomodoro', voiceNotificationVolume);

		await clearPomodoroState(client, guildId);
	}
}

// ポモドーロタイマーの状況送信
async function sendPomodoroStatus(interaction, status, pomodoroState) {
	const { workTime, breakTime, longBreakTime } = pomodoroState.options;

	const img = new AttachmentBuilder()
		.setName('pomodoro.png')
		.setFile(await generatePomodoroPicture(status, pomodoroState));
	const embed = new EmbedBuilder()
		.setImage('attachment://pomodoro.png')
		.setColor(0x00ff00)
		.setFooter({
			text: '※画像は更新ボタンを押すと更新されます',
		})
		.setTimestamp();

	// 次のステータスの時間を取得
	let nextStatus;
	switch (pomodoroState.nextStatus) {
		case 'work':
			nextStatus = '作業時間';
			break;
		case 'break':
			nextStatus = '休憩時間';
			break;
		case 'longBreak':
			nextStatus = '長めの休憩時間';
			break;
	}
	const remainingSeconds = pomodoroState.remainingSeconds;
	const nowUnixTimeStamp = Math.floor(Date.now() / 1000);
	const nextStatusTimestamp = nowUnixTimeStamp + remainingSeconds;

	let messageContent;
	if (status === 'work') {
		messageContent = `作業時間 ${workTime}分 開始しました！ (${pomodoroState.currentCycle}サイクル目)\n 次のステータス: ${nextStatus} (<t:${nextStatusTimestamp}:R>)`;
	} else if (status === 'break') {
		messageContent = `休憩時間 ${breakTime}分 開始しました！\n 次のステータス: ${nextStatus} (<t:${nextStatusTimestamp}:R>)`;
	} else if (status === 'longBreak') {
		messageContent = `長めの休憩時間 ${longBreakTime}分 開始しました！\n 次のステータス: ${nextStatus} (<t:${nextStatusTimestamp}:R>)`;
	}

	const button = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId('pomodoro_update')
			.setStyle(ButtonStyle.Success)
			.setLabel('更新'),
		new ButtonBuilder()
			.setCustomId('pomodoro_stop')
			.setStyle(ButtonStyle.Danger)
			.setLabel('ポモドーロタイマーを終了する'),
	);

	const newStatus = await interaction.channel.send({
		content: messageContent,
		embeds: [embed],
		files: [img],
		components: [button],
	});

	// 前のステータスメッセージがあり、消せそうなら消す
	if (pomodoroState.lastStatusMessageId) {
		try {
			const lastMessage = await interaction.channel.messages.fetch(
				pomodoroState.lastStatusMessageId,
			);
			if (lastMessage) {
				await lastMessage.delete();
			}
		} catch (err) {
			// 古いメッセージが見つからなかったり削除できない場合は、そのままにする
			void err;
		}
	}
	// 新しいステータスメッセージのIDを保存
	pomodoroState.lastStatusMessageId = newStatus.id || null;
}

// VC監視付きの待機
function waitOrCancel(minutes, client, interaction, pomodoroState) {
	const interval = 1000; // 1秒ごとにチェック
	let disconnectedElapsed = 0;
	const disconnectedLimit = 60 * 60 * 1000; // 1時間

	return new Promise((resolve) => {
		pomodoroState.timer = setInterval(async () => {
			// 残り秒数を更新（endTimestampから計算）
			pomodoroState.remainingSeconds = calculateRemainingSeconds(
				pomodoroState.endTimestamp,
			);

			// 時間が終了したかチェック
			if (pomodoroState.remainingSeconds <= 0) {
				clearInterval(pomodoroState.timer);
				resolve();
				return;
			}

			// VC監視
			if (pomodoroState.vcId) {
				const channel = await client.channels.fetch(pomodoroState.vcId);
				if (channel && channel.members) {
					// BOT以外が居るか
					const nonBotMembers = channel.members.filter((m) => !m.user.bot);
					if (nonBotMembers.size === 0) {
						disconnectedElapsed += interval;
						if (disconnectedElapsed >= disconnectedLimit) {
							await interaction.channel.send(
								'VCに誰も1時間戻らなかったため、ポモドーロタイマーを中止しました。',
							);
							await clearPomodoroState(client, interaction.guildId);
							resolve();
							return;
						}
						// 1時間未満なら一度だけ通知
						if (disconnectedElapsed === interval) {
							await interaction.channel.send(
								'VCに誰もいなくなりました。1時間以内に誰かが戻らない場合、タイマーは自動で中止されます。',
							);
						}
					} else {
						// 誰か戻ってきたらリセット
						disconnectedElapsed = 0;
					}
				}
			}

			// 強制停止された場合
			if (!pomodoroState.running) {
				clearInterval(pomodoroState.timer);
				resolve();
			}
		}, interval);
	});
}

// 状況確認
async function status(client, interaction) {
	const guildId = interaction.guildId;
	const pomodoroState = getPomodoroState(client, guildId);

	if (!pomodoroState.running) {
		await interaction.reply('ポモドーロタイマーは動作していません。');
		return;
	}

	// リアルタイムで残り時間を計算
	const currentRemainingSeconds = calculateRemainingSeconds(
		pomodoroState.endTimestamp,
	);
	const remaining =
		typeof currentRemainingSeconds === 'number'
			? `${String(Math.floor(currentRemainingSeconds / 60)).padStart(
					2,
					'0',
				)}:${String(currentRemainingSeconds % 60).padStart(2, '0')}`
			: '取得不可';
	await interaction.reply(
		`現在のサイクル: ${pomodoroState.currentCycle}\n` +
			`状態: ${pomodoroState.running ? '稼働中' : '停止中'}\n` +
			`残り時間: ${remaining}`,
	);
}

// 強制終了
async function stop(client, interaction) {
	const guildId = interaction.guild.id;
	const pomodoroState = getPomodoroState(client, guildId);

	if (!pomodoroState.running) {
		await interaction.reply('ポモドーロタイマーは動作していません。');
		return;
	}

	await clearPomodoroState(client, guildId);
	return interaction.reply('ポモドーロタイマーを強制終了しました。');
}

// ボイス通知
async function notifyVoice(interaction, notifyType, voiceNotificationVolume) {
	// VC取得
	const channel = interaction.member?.voice?.channel;
	if (!channel) return;

	// 一時wavファイル名
	const wavPath = await voicevoxAudioController.get(
		notifyType,
		3, // voicevoxSpeakerId (3 = ずんだもん)
	);

	// 音量調整付きリソース作成
	const resource = createAudioResource(wavPath, {
		inlineVolume: true, // 音量調整を有効化
	});
	resource.volume.setVolume(voiceNotificationVolume / 100 || 0.5);

	// VC接続
	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
		selfDeaf: true,
	});

	try {
		await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
		const player = createAudioPlayer();
		player.play(resource);
		connection.subscribe(player);

		// 再生終了まで待機
		await new Promise((resolve) => {
			player.on('idle', resolve);
			player.on('error', resolve);
		});
	} catch (err) {
		// エラー時は何もしない
		void err;
	}

	// 切断・ファイル削除
	connection.destroy();
}

module.exports = {
	init,
	getPomodoroState,
	start,
	status,
	stop,
};
