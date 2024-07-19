const { EmbedBuilder } = require("discord.js");
const pagination = require("../pagination.js");

module.exports = {
  name: "test",
  description: "pagenation test",

  run: async (client, interaction) => {
    try {
      const embeds = [];
      for (var i = 0; i < 4; i++) {
        embeds.push(new EmbedBuilder().setDescription(`page: ${i + 1}`));
      }

      await pagination(interaction, embeds);
    } catch (err) {
      const errorNotification = require("../errorNotification.js");
      errorNotification(client, interaction, err);
    }
  },
};
