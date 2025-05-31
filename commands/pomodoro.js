const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");
require("dotenv").config();
const profileModel = require("../models/profileSchema");

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
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("break_time")
            .setDescription("休憩する時間を設定してください。(単位: 分)")
            .setMinValue(1)
            .setRequired(true)
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
              "音声通知を有効にするかどうか。デフォルトは無効です。"
            )
            .setRequired(false)
        )
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
    ),

  run: async (client, interaction) => {
    try {
      let mode = interaction.options.getSubcommand();
      mode != "start"
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
      } else if (mode === "setting") {
        if (modeType == "default_work_time") {
        } else if (modeType == "default_break_time") {
        } else if (modeType == "default_long_break_time") {
        }
      }
    } catch (err) {
      const errorNotification = require("../lib/errorNotification.js");
      errorNotification(client, interaction, err);
    }
  },
};
