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
    // TODO: このコマンドは、/settingsコマンドに移行する
    .setName("pomodoro")
    .setDescription("⏱ポモドーロタイマーを設定します！")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("on")
        .setDescription("ポモドーロタイマーを有効にします。")
        .addChannelOption((option) =>
          option
            .setName("category")
            .setDescription("タイマーを使用するカテゴリーを設定してください。")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("off")
        .setDescription("ポモドーロタイマーを無効にします。")
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
