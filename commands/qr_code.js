const {
  SnowflakeUtil,
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");
const QRCode = require("qrcode");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("qr_code")
    .setDescription("QRコードを作成します")
    .addStringOption((option) =>
      option.setName("keyword").setDescription("文字列かURL").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("hidden")
        .setDescription(
          "作成したQRコードをチャンネル内で、非公開で作成する場合は設定してください。"
        )
        .setRequired(false)
        .addChoices({ name: "非公開にする", value: "true" })
    ),

  run: async (client, interaction) => {
    try {
      let hiddenOption = interaction.options.getString("hidden");
      hiddenOption = hiddenOption == "true";

      await interaction.deferReply({
        flags: hiddenOption ? MessageFlags.Ephemeral : 0,
      });

      let now = SnowflakeUtil.generate();
      let filePath = `./images/qr_code/${interaction.guild.id}.${now}.png`;

      const QRValue = interaction.options.getString("keyword");

      //splitでユーザーのメッセージを取得し、それを<snowflake>.pngへ出力する
      QRCode.toFile(filePath, QRValue);
      //出力されたqr.pngを添付ファイルとして、送信する
      setTimeout(async () => {
        await interaction.editReply({
          files: [filePath],
          flags: hiddenOption ? MessageFlags.Ephemeral : 0,
        });
        fs.unlink(filePath, (err) => {
          if (err) throw err;
        });
      }, 1000);
    } catch (err) {
      const errorNotification = require("../errorNotification.js");
      errorNotification(client, interaction, err);
    }
  },
};
