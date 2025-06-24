const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");
require("dotenv").config();
const pomodoro = require("../lib/pomodoro.js");

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
        .setName("setting")
        .setDescription("ポモドーロタイマーのデフォルト設定を変更します。")
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
            .setName("default_voice_notification_volume")
            .setDescription("音声通知をする際の音量を設定します。")
            .addIntegerOption((option) =>
              option
                .setName("default_voice_notification_volume")
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
      let supportServerButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("サポートサーバーに参加する")
          .setStyle(ButtonStyle.Link)
          .setURL(process.env.discord_bot_support)
      );

      if (mode == "start") {
        let workTime = interaction.options.getInteger("work_time");
        let breakTime = interaction.options.getInteger("break_time");
        let longBreakTime =
          interaction.options.getInteger("long_break_time") ?? 15;
        let voiceNotification =
          interaction.options.getBoolean("voice_notification") ?? false;

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
        });
      } else if (mode === "status") {
        await pomodoro.status(client, interaction);
      } else if (mode === "stop") {
        await pomodoro.stop(client, interaction);
      } else if (mode === "setting") {
        if (modeType == "default_work_time") {
          // 設定処理（未実装）
        } else if (modeType == "default_break_time") {
          // 設定処理（未実装）
        } else if (modeType == "default_long_break_time") {
          // 設定処理（未実装）
        } else if (modeType == "default_voice_notification") {
          // 設定処理（未実装）
        } else if (modeType == "default_voice_notification_volume") {
          // 設定処理（未実装）
        }
      }
    } catch (err) {
      const errorNotification = require("../lib/errorNotification.js");
      errorNotification(client, interaction, err);
    }
  },
};
