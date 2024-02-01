const { SnowflakeUtil, ApplicationCommandOptionType } = require("discord.js");
const QRCode = require("qrcode");
const fs = require("fs");

module.exports = {
  name: "qr_code",
  description: "🔧QRコードを作成します",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "keyword",
      description: "文字列かURL",
      required: true,
    },
  ],

  run: async (client, interaction) => {
    try {
      await interaction.deferReply();

      let now = SnowflakeUtil.generate();
      let filePath = `./images/qr_code/${interaction.guild.id}.${now}.png`;

      const QRValue = interaction.options.getString("keyword");
      //splitでユーザーのメッセージを取得し、それをqr.pngへ出力する
      QRCode.toFile(filePath, QRValue);
      //出力されたqr.pngを添付ファイルとして、送信する
      setTimeout(async () => {
        await interaction.editReply({
          files: [filePath],
        });
        fs.unlink(filePath, (err) => {
          if (err) throw err;
        });
      }, 1000);
    } catch (err) {
      const errorNotification = require("../functions.js");
      errorNotification(client, interaction, err);
    }
  },
};
