module.exports = {
  name: "ping",
  description: "🏓Ping値を計測します！",

  run: async (client, interaction) => {
    try {
      let sent = await interaction.reply({
        content: "🔄️　計測中…",
        fetchReply: true,
      });

      interaction.editReply(
        `# Ping計測結果
        - WebsocketのPing: \`${Math.abs(client.ws.ping)}ms\`.
        - APIのLatency: \`${
          sent.createdTimestamp - interaction.createdTimestamp
        }ms\`.`
      );
    } catch (err) {
      const errorNotification = require("../functions.js");
      errorNotification(client, interaction, err);
    }
  },
};
