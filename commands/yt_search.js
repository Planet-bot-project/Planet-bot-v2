const { ApplicationCommandOptionType } = require("discord.js");
const wait = require("node:timers/promises").setTimeout;
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

      const AKB = interaction.options.getString("keyword");
      yts(AKB, async function (err, R) {
        //検索
        const videos = R.videos;
        await wait(1000);
        await interaction.editReply({
          content: videos[0].url,
          ephemeral: true,
        });
      });
    } catch (err) {
      const errorNotification = require("../functions.js");
      errorNotification(client, interaction, err);
    }
  },
};
