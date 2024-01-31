const { SnowflakeUtil, ApplicationCommandOptionType } = require("discord.js");
const wait = require("node:timers/promises").setTimeout;
const QRCode = require("qrcode");

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

      const QRValue = interaction.options.getString("keyword");
      //splitでユーザーのメッセージを取得し、それをqr.pngへ出力する
      QRCode.toFile(
        `./images/qr_code/${interaction.guild.id}.${now}.png`,
        QRValue
      );
      //出力されたqr.pngを添付ファイルとして、送信する
      await wait(1000);
      await interaction.editReply({
        files: [`./images/qr_code/${interaction.guild.id}.${now}.png`],
      });
    } catch (err) {
      const errorNotification = require("../functions.js");
      errorNotification(client, interaction, err);
    }
  },
};
