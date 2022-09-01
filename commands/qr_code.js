const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
  data: {
    name: "qr_code",
    description: "🔧QRコードを作成します",
    options: [{
      type: ApplicationCommandOptionType.String,
      name: "keyword",
      description: "文字列かURL",
      required: true
    }]
  },
	async execute(interaction) {
    const wait = require('node:timers/promises').setTimeout;
    await interaction.deferReply();
    const QRCode = require('qrcode');
    const QRValue = interaction.options.getString('keyword');
    //splitでユーザーのメッセージを取得し、それをqr.pngへ出力する
    QRCode.toFile("./images/qr_code.png", QRValue);
    //出力されたqr.pngを添付ファイルとして、送信する
    await wait(1000);
    await interaction.editReply({
      files: ["./images/qr_code.png"]
    })
  }
}
