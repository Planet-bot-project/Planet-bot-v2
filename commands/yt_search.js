const { ApplicationCommandOptionType } = require("discord.js");
const ytsr = require("@distube/ytsr");

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

      ytsr(keyword, { type: "playlist", safeSearch: true, limit: 5 }).then(
        (playlistResult) => {
          ytsr(keyword, { type: "video", safeSearch: true, limit: 5 }).then(
            (videoResult) => {
              if (!playlistResult) playlistResult = "見つかりませんでした。";
              if (!videoResult) videoResult = "見つかりませんでした。";

              let playlistDescription = [];
              let videosDescription = [];
              for (let i = 0; i < 5; i++) {
                let playlistString = `[**${i}**] **[\`${playlistResult.items[i].name}\`](${playlistResult.items[i].url})**(${playlistResult.items[i]?.videoCount}曲)｜[\`${playlistResult.items[i].duration}.\`]｜by \`${playlistResult.items[i].author.name}\``;
                playlistDescription.push(playlistString);

                let videoString = `[**${i}**] **[\`スーパーカリフラジリスティックエクスピアリドーシャス\`](https://youtube.com/watch?v=8TghOw3v61k)**｜[\`30:56\`]｜by \`スーパーカリフラジリスティックエクスピアリドーシャス\``;
                videosDescription.push(videoString);
              }

              return interaction.editReply({
                embeds: [
                  {
                    title: `${keyword}の検索結果`,
                    fields: [
                      {
                        name: "プレイリスト",
                        value: playlistDescription.join("\n"),
                      },
                      {
                        name: "動画",
                        value: videosDescription.join("\n"),
                      },
                    ],
                  },
                ],
              });
            }
          );
        }
      );
    } catch (err) {
      const errorNotification = require("../errorNotification.js");
      errorNotification(client, interaction, err);
    }
  },
};
