const { ApplicationCommandOptionType } = require("discord.js");
const { setTimeout } = require("node:timers/promises");
const yts = require("yt-search"); //yt-searchを読み込む

module.exports = {
  name: "yt_search",
  description: "🔍YouTubeの動画を検索します",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "keyword",
      description: "検索キーワード",
      required: true,
    },
  ],

  run: async (client, interaction) => {
    try {
      await interaction.deferReply();

      const keyword = interaction.options.getString("keyword");
      await yts({ query: keyword }, async function (err, result) {
        if (err) {
          console.log(`ytSearch ERROR: ${err}`);
          return interaction.editReply({
            content:
              "エラーが発生しました。時間を空けてもう一度お試しください。",
            ephemeral: true,
          });
        }

        await interaction.editReply({
          content: result.all[0].url,
          ephemeral: true,
        });
      });
    } catch (err) {
      const errorNotification = require("../functions.js");
      errorNotification(client, interaction, err);
    }
  },
};
