const {
  SlashCommandBuilder,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
require("dotenv").config({ quiet: true });
const pomodoro = require("../lib/pomodoro.js");
const profileSchema = require("../models/profileSchema.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pomodoro")
    .setDescription("⏱ポモドーロタイマーを管理します！")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("start")
        .setDescription("ポモドーロタイマーを開始します。")
        .addIntegerOption((option) =>
          option
            .setName("work_time")
            .setDescription("集中する時間を設定してください。(単位: 分)")
            .setMinValue(1)
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName("break_time")
            .setDescription("休憩する時間を設定してください。(単位: 分)")
            .setMinValue(1)
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName("long_break_time")
            .setDescription("長めの休憩時間を設定してください。(単位: 分)")
            .setMinValue(1)
            .setRequired(false)
        )
        .addBooleanOption((option) =>
          option
            .setName("voice_notification")
            .setDescription(
              "音声通知を有効にする場合はtrueを指定してください。デフォルトは無効(false)です。"
            )
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName("voice_notification_volume")
            .setDescription("音声通知の音量を設定してください。(1～100%)")
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription("ポモドーロタイマーの状況を確認します。")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stop")
        .setDescription("ポモドーロタイマーを強制終了します。")
    )
    .addSubcommandGroup((subcommands) =>
      subcommands
        .setName("settings")
        .setDescription("ポモドーロタイマーのデフォルト設定を変更します。")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("show")
            .setDescription(
              "現在のポモドーロタイマーのデフォルト設定を表示します。"
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("default_work_time")
            .setDescription("ポモドーロの作業時間を設定します。")
            .addIntegerOption((option) =>
              option
                .setName("default_work_time")
                .setDescription("作業時間を設定してください。(単位: 分)")
                .setMinValue(1)
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("default_break_time")
            .setDescription("ポモドーロの休憩時間を設定します。")
            .addIntegerOption((option) =>
              option
                .setName("default_break_time")
                .setDescription("休憩時間を設定してください。(単位: 分)")
                .setMinValue(1)
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("default_long_break_time")
            .setDescription("ポモドーロの長めの休憩時間を設定します。")
            .addIntegerOption((option) =>
              option
                .setName("default_long_break_time")
                .setDescription("長めの休憩時間を設定してください。(単位: 分)")
                .setMinValue(1)
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("default_voice_notification")
            .setDescription(
              "ポモドーロの音声通知をデフォルトで有効にするか設定します。"
            )
            .addBooleanOption((option) =>
              option
                .setName("default_voice_notification")
                .setDescription(
                  "音声通知をデフォルトで有効にする場合はtrueを指定してください。デフォルトは無効(false)です。"
                )
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("default_vc_notification_volume")
            .setDescription("音声通知をする際の音量を設定します。")
            .addIntegerOption((option) =>
              option
                .setName("default_vc_notification_volume")
                .setDescription("音声通知の音量を設定してください。(1～100%)")
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)
            )
        )
    ),

  run: async (client, interaction) => {
    try {
      let mode = interaction.options.getSubcommand();
      mode != "start" && mode != "status" && mode != "stop"
        ? (mode = interaction.options.getSubcommandGroup())
        : null;
      let modeType = interaction.options.getSubcommand();

      if (mode == "start") {
        let workTime = interaction.options.getInteger("work_time");
        let breakTime = interaction.options.getInteger("break_time");
        let longBreakTime = interaction.options.getInteger("long_break_time");
        let voiceNotification =
          interaction.options.getBoolean("voice_notification");
        let voiceNotificationVolume = interaction.options.getInteger(
          "voice_notification_volume"
        );

        // ユーザーのVCを取得
        if (!interaction?.member?.voice?.channelId)
          return interaction
            ?.reply({
              content: "❌ ボイスチャンネルに参加してください。",
              flags: MessageFlags.Ephemeral,
            })
            .catch((err) => {});
        let guild_me = interaction?.guild?.members?.cache?.get(
          client?.user?.id
        );
        if (guild_me?.voice?.channelId) {
          if (
            guild_me?.voice?.channelId !== interaction?.member?.voice?.channelId
          ) {
            return interaction
              ?.reply({
                content: "❌ 私と同じボイスチャンネルに接続してください。",
                flags: MessageFlags.Ephemeral,
              })
              .catch((err) => {});
          }
        }

        // ポモドーロタイマー開始
        await pomodoro.start(client, interaction, {
          workTime,
          breakTime,
          longBreakTime,
          voiceNotification,
          voiceNotificationVolume,
        });
      } else if (mode === "status") {
        await pomodoro.status(client, interaction);
      } else if (mode === "stop") {
        await pomodoro.stop(client, interaction);
      } else if (mode === "settings") {
        profileSchema.findById(interaction.guild.id).then(async (data) => {
          // showコマンドだけ別処理
          if (modeType == "show") {
            let embed = new EmbedBuilder()
              .setTitle("ポモドーロタイマーのデフォルト設定")
              .setDescription(
                `- 作業時間: ${data.pomodoro.defaultWorkTime}分
- 休憩時間: ${data.pomodoro.defaultBreakTime}分
- 長めの休憩時間: ${data.pomodoro.defaultLongBreakTime}分
- 音声通知: ${data.pomodoro.defaultVoiceNotification ? "有効" : "無効"}
- 音声通知の音量: ${data.pomodoro.defaultVoiceNotificationVolume}%`
              )
              .setTimestamp();
            return interaction.reply({ embeds: [embed] });
          }

          if (modeType == "default_work_time") {
            data.pomodoro.defaultWorkTime =
              interaction.options.getInteger("default_work_time");
          } else if (modeType == "default_break_time") {
            data.pomodoro.defaultBreakTime =
              interaction.options.getInteger("default_break_time");
          } else if (modeType == "default_long_break_time") {
            data.pomodoro.defaultLongBreakTime = interaction.options.getInteger(
              "default_long_break_time"
            );
          } else if (modeType == "default_voice_notification") {
            data.pomodoro.defaultVoiceNotification =
              interaction.options.getBoolean("default_voice_notification");
          } else if (modeType == "default_vc_notification_volume") {
            data.pomodoro.defaultVoiceNotificationVolume =
              interaction.options.getInteger("default_vc_notification_volume");
          }

          data.save().then(() => {
            // データベースの更新が成功した場合
            return interaction.reply({
              content: `✅ ポモドーロタイマーのデフォルト設定を更新しました。現在の設定は次の通りです。
- 作業時間: ${data.pomodoro.defaultWorkTime}分
- 休憩時間: ${data.pomodoro.defaultBreakTime}分
- 長めの休憩時間: ${data.pomodoro.defaultLongBreakTime}分
- 音声通知: ${data.pomodoro.defaultVoiceNotification ? "有効" : "無効"}
- 音声通知の音量: ${data.pomodoro.defaultVoiceNotificationVolume}%`,
            });
          });
        });
      }
    } catch (err) {
      const errorNotification = require("../lib/errorNotification.js");
      errorNotification(client, interaction, err);
    }
  },
};
