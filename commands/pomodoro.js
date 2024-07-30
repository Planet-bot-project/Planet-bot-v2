const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits
} = require("discord.js");
const profileModel = require("../models/profileSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pomodoro")
    .setDescription("⏱ポモドーロタイマーを設定します！")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("on")
        .setDescription("ポモドーロタイマーを有効にします。")
        .addChannelOption((option) =>
          option
            .setName("category")
            .setDescription(
              "タイマーを使用するカテゴリーを設定してください。"
            )
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
      await interaction.deferReply({ ephemeral: true });

      if (mode === "on") {
        let channel = interaction.options.getChannel("category");

        //チャンネル設定が

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
              ephemeral: true,
              components: [supportServerButton],
            });
          })
          .then((model) => {
            model.pomodoro = true;
            model.pomodoro_category = channel.id;
            model.save().then(async () => {
              return interaction.editReply({
                embeds: [
                  {
                    title: "✅ 設定を更新しました！",
                    color: 0x10ff00,
                  },
                ],
              });
            });
          });

        console.log("on");
      } else if (mode == "off") {
        console.log("off");
      }
    } catch (err) {
      const errorNotification = require("../errorNotification.js");
      errorNotification(client, interaction, err);
    }
  },
};
