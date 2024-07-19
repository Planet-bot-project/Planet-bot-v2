const { SnowflakeUtil, ApplicationCommandOptionType } = require("discord.js");
const QRCode = require("qrcode");
const fs = require("fs");

module.exports = {
  name: "qr_code",
  description: "QRコードを作成します",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "keyword",
      description: "文字列かURL",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "hidden",
      description:
        "作成したqrコードを非公開で作成するかどうかを設定します。(デフォルト：公開)",
      required: false,
      choices: [
        { name: "非公開にする", value: "true" },
        { name: "公開にする", value: "false" },
      ],
    },
  ],

  run: async (client, interaction) => {
    try {
      let hiddenOption = interaction.options.getString("hidden");
      hiddenOption = hiddenOption == "true";

      await interaction.deferReply({ ephemeral: hiddenOption });

      let now = SnowflakeUtil.generate();
      let filePath = `./images/qr_code/${interaction.guild.id}.${now}.png`;

      const QRValue = interaction.options.getString("keyword");

      //splitでユーザーのメッセージを取得し、それを<snowflake>.pngへ出力する
      QRCode.toFile(filePath, QRValue);
      //出力されたqr.pngを添付ファイルとして、送信する
      setTimeout(async () => {
        await interaction.editReply({
          files: [filePath],
          ephemeral: hiddenOption,
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
