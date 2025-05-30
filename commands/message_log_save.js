const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  MessageFlags,
} = require("discord.js");
const discordTranscripts = require("discord-html-transcripts");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("message_log_save")
    .setDescription("📝メッセージログを保存します！")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

  run: async (client, interaction) => {
    try {
      await interaction.reply(
        "メッセージ履歴を取得しています...\n※これには数分かかる場合があります。"
      );

      // botの権限チェック
      if (
        !interaction.channel
          .permissionsFor(client.user.id)
          .has(
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory
          )
      ) {
        return interaction.editReply(
          "このチャンネルでメッセージログを保存する権限がありません。"
        );
      }

      const attachment = await discordTranscripts.createTranscript(
        interaction.channel,
        {
          limit: -1,
          filename: `${interaction.channel.name}.html`,
        }
      );

      const cancel = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("cancel")
          .setLabel("閉じる")
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({
        content: "",
        embeds: [
          {
            title: "📤｜出力しました",
            description:
              "__**必ず、ご自身のデバイスにダウンロードしてください！**__",
            color: 0x20ff20,
          },
        ],
        files: [attachment],
        components: [cancel],
      });
    } catch (err) {
      console.error(err);
      const errorNotification = require("../lib/errorNotification.js");
      errorNotification(client, interaction, err);
    }
  },
};
