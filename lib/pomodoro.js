// ポモドーロタイマーの機能
// VCにBOT以外誰も居なくなった場合は中止
// pomodoro.start(), pomodoro.status(), pomodoro.stop() で操作

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  VoiceConnectionStatus,
} = require("@discordjs/voice");
const fs = require("fs");
const path = require("path");
const profileSchema = require("../models/profileSchema");

// guildごとにpomodoroStateをMapで管理
function init(client, guildId) {
  if (!client.pomodoroState.has(guildId)) {
    client.pomodoroState.set(guildId, {
      running: false,
      currentCycle: 0,
      isCancelled: false,
      timer: null,
      options: null,
      interaction: null,
      client: null,
      vcId: null,
    });
  }
}

function getPomodoroState(client, guildId) {
  if (!client.pomodoroState) {
    client.pomodoroState = new Map();
  }
  if (!client.pomodoroState.has(guildId)) {
    init(client, guildId);
  }
  return client.pomodoroState.get(guildId);
}

async function start(client, interaction, options) {
  const guildId = interaction.guildId;
  const pomodoroState = getPomodoroState(client, guildId);

  if (pomodoroState.running) {
    await interaction.reply("すでにポモドーロタイマーが動作中です。");
    return;
  }
  pomodoroState.running = true;
  pomodoroState.currentCycle = 0;
  pomodoroState.isCancelled = false;
  pomodoroState.options = options;
  pomodoroState.interaction = interaction;
  pomodoroState.client = client;
  pomodoroState.vcId = interaction.member?.voice?.channelId ?? null;

  let { workTime, breakTime, longBreakTime, voiceNotification } = options;
  const cyclesBeforeLongBreak = 4;

  // オプションが未入力の場合はデフォルト値を設定
  try {
    const db = await profileSchema.findById(guildId);
    if (!workTime) {
      workTime = db.pomodoro.defaultWorkTime;
    }
    if (!breakTime) {
      breakTime = db.pomodoro.defaultBreakTime;
    }
    if (!longBreakTime) {
      longBreakTime = db.pomodoro.defaultLongBreakTime; // デフォルト値を15分に設定
    }
    if (!voiceNotification) {
      voiceNotification = db.pomodoro.defaultVoiceNotification; // デフォルト値をfalseに設定
    }
  } catch (err) {
    console.error(
      "データベースからのポモドーロタイマーのデフォルト値取得に失敗:",
      err
    );
  }

  // キャンセル用のコレクター
  const filter = (i) =>
    i.user.id === interaction.user.id && i.customId === "cancel_pomodoro";
  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    time: 1000 * 60 * 60 * 24,
  });

  collector.on("collect", (i) => {
    pomodoroState.isCancelled = true;
    i.reply({
      content: "ポモドーロタイマーをキャンセルしました。",
      ephemeral: true,
    });
    collector.stop();
  });

  await interaction.reply(
    "ポモドーロタイマーを開始します！\n`/cancel`ボタンでキャンセルできます。"
  );

  while (!pomodoroState.isCancelled) {
    pomodoroState.currentCycle++;
    // 作業時間
    await interaction.followUp(
      `作業時間 ${workTime}分 開始！ (${pomodoroState.currentCycle}サイクル目)`
    );
    if (voiceNotification)
      await notifyVoice(client, interaction, "作業時間開始！");

    await waitOrCancel(workTime, client, interaction, pomodoroState);

    if (pomodoroState.isCancelled) break;

    // 休憩時間
    if (pomodoroState.currentCycle % cyclesBeforeLongBreak === 0) {
      await interaction.followUp(`長めの休憩 ${longBreakTime}分 開始！`);
      if (voiceNotification)
        await notifyVoice(client, interaction, "長めの休憩開始！");
      await waitOrCancel(longBreakTime, client, interaction, pomodoroState);
    } else {
      await interaction.followUp(`休憩時間 ${breakTime}分 開始！`);
      if (voiceNotification)
        await notifyVoice(client, interaction, "休憩時間開始！");
      await waitOrCancel(breakTime, client, interaction, pomodoroState);
    }
    if (pomodoroState.isCancelled) break;
  }

  if (!pomodoroState.isCancelled) {
    await interaction.followUp(
      "ポモドーロタイマーが完了しました！お疲れ様でした！"
    );
    if (voiceNotification)
      await notifyVoice(client, interaction, "ポモドーロタイマー完了！");
  }
  pomodoroState.running = false;
  pomodoroState.timer = null;
}

// VC監視付きの待機
async function waitOrCancel(minutes, client, interaction, pomodoroState) {
  const ms = minutes * 60 * 1000;
  let elapsed = 0;
  const interval = 5000; // 5秒ごとにVCチェック
  let disconnectedElapsed = 0;
  const disconnectedLimit = 60 * 60 * 1000; // 1時間

  return new Promise((resolve) => {
    pomodoroState.timer = setInterval(async () => {
      elapsed += interval;

      // VC監視
      if (pomodoroState.vcId) {
        const channel = await client.channels.fetch(pomodoroState.vcId);
        if (channel && channel.members) {
          // BOT以外が居るか
          const nonBotMembers = channel.members.filter((m) => !m.user.bot);
          if (nonBotMembers.size === 0) {
            disconnectedElapsed += interval;
            if (disconnectedElapsed >= disconnectedLimit) {
              pomodoroState.isCancelled = true;
              await interaction.followUp(
                "VCに誰も1時間戻らなかったため、ポモドーロタイマーを中止しました。"
              );
              clearInterval(pomodoroState.timer);
              resolve();
              return;
            }
            // 1時間未満なら一度だけ通知
            if (disconnectedElapsed === interval) {
              await interaction.followUp(
                "VCに誰もいなくなりました。1時間以内に誰かが戻らない場合、タイマーは自動で中止されます。"
              );
            }
          } else {
            // 誰か戻ってきたらリセット
            disconnectedElapsed = 0;
          }
        }
      }
      if (pomodoroState.isCancelled || elapsed >= ms) {
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
    await interaction.reply("ポモドーロタイマーは動作していません。");
    return;
  }
  await interaction.reply(
    `現在のサイクル: ${pomodoroState.currentCycle}\n` +
      `状態: ${pomodoroState.isCancelled ? "キャンセル済み" : "稼働中"}`
  );
}

// 強制終了
async function stop(client, interaction) {
  const guildId = interaction.guild.id;
  const pomodoroState = getPomodoroState(client, guildId);

  if (!pomodoroState.running) {
    await interaction.reply("ポモドーロタイマーは動作していません。");
    return;
  }
  pomodoroState.isCancelled = true;
  if (pomodoroState.timer) clearInterval(pomodoroState.timer);
  pomodoroState.running = false;
  await interaction.reply("ポモドーロタイマーを強制終了しました。");
}

// ボイス通知（Open JTalkでTTS生成しVCで再生）
async function notifyVoice(client, interaction, message) {
  // VC取得
  const channel = interaction.member?.voice?.channel;
  if (!channel) return;

  // 一時wavファイル名
  const wavPath = path.join(__dirname, `notify_${Date.now()}.wav`);

  // VC接続
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: false,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
    const player = createAudioPlayer();
    const resource = createAudioResource(wavPath);
    player.play(resource);
    connection.subscribe(player);

    // 再生終了まで待機
    await new Promise((resolve) => {
      player.on("idle", resolve);
      player.on("error", resolve);
    });
  } catch (e) {
    // エラー時は何もしない
  }

  // 切断・ファイル削除
  connection.destroy();
  fs.unlink(wavPath, () => {});
}

module.exports = {
  init,
  start,
  status,
  stop,
};
