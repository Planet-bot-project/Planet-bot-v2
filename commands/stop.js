module.exports = {
  name: "stop",
  description: "⛔BOTを停止します！（BOT作成者限定機能）",

  run: async (client, interaction) => {
    try {
      if (interaction.user.id === "728495196303523900") {
        await interaction.reply({
          embeds: [
            {
              title: "⛔停止しています…",
              color: 0xff0000,
              timestamp: new Date(),
            },
          ],
        });
        process.exit();
      } else {
        await interaction.reply({
          embeds: [
            {
              title: "🚫エラー！！",
              description:
                "権限が不足しています。\nこのコマンドは、BOTの作成者のみの機能です。",
              color: 0xff0000,
              timestamp: new Date(),
            },
          ],
          ephemeral: true,
        });
      }
    } catch (err) {
      const errorNotification = require("../functions.js");
      errorNotification(client, interaction, err);
    }
  },
};
