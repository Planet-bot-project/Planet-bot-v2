const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
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
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  run: async (client, interaction) => {
    try {
      let mode = interaction.options.getSubcommand();
      let supportServerButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("サポートサーバーに参加する")
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.gg/uYYaVRuUuJ")
      );

      //時間かかる処理なので、defer
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      if (mode === "on") {
        let channel = interaction.options.getChannel("category");

        //データベース設定
        profileModel
          .findById(interaction.guild.id)
          .catch((err) => {
            console.log(
              `データベース更新時にエラーが発生しました。(場所：pomodoro/on)\n${err}`
            );

            return interaction.reply({
              content:
                "データベース関連の処理でエラーが発生しました。\nしばらく時間を空けて再度お試しいただくか、サポートサーバーにてお問い合わせください。",
              flags: MessageFlags.Ephemeral,
              components: [supportServerButton],
            });
          })
          .then((model) => {
            // TODO: ポモドロはDBを使わない予定。そのため、この処理は削除する
            model.pomodoro = true;
            model.pomodoro_category = channel.id;
            model.save().then(async () => {
              return interaction.editReply({
                embeds: [
                  {
                    title: "✅ ポモドーロタイマーを有効にしました！",
                    description: `作成された「ロビー」というVCに参加すると、操作パネルが有効になり、ポモドーロタイマーを使用できるようになります。

                    ※ カテゴリー名やチャンネル名などは変更しても問題ありません。
                    ※ 別のチャンネルに変更する場合は再設定が必要です。`,
                    color: 0x10ff00,
                  },
                ],
              });
            });
          });
      } else if (mode == "off") {
        //データベース設定
        profileModel
          .findById(interaction.guild.id)
          .catch((err) => {
            console.log(
              `データベース更新時にエラーが発生しました。(場所：pomodoro/on)\n${err}`
            );

            return interaction.reply({
              content:
                "データベース関連の処理でエラーが発生しました。\nしばらく時間を空けて再度お試しいただくか、サポートサーバーにてお問い合わせください。",
              flags: MessageFlags.Ephemeral,
              components: [supportServerButton],
            });
          })
          .then((model) => {
            // TODO: ポモドロはDBを使わない予定。そのため、この処理は削除する
            model.pomodoro = false;
            model.pomodoro_category = null;
            model.save().then(async () => {
              return interaction.editReply({
                embeds: [
                  {
                    title: "✅ ポモドーロタイマーを無効にしました！",
                    color: 0x10ff00,
                  },
                ],
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
