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
              let playlistDescription = [];
              let videosDescription = [];

              //プレイリストのデータ取得
              if (playlistResult.results != 0) {
                for (let i = 0; i < 5; i++) {
                  let playlistString = `${i + 1}. **[\`${
                    playlistResult.items[i].name
                  }\`](${playlistResult.items[i].url})**(${
                    playlistResult.items[i]?.length
                  }曲)｜作者： \`${playlistResult.items[i].owner.name}\``;
                  playlistDescription.push(playlistString);
                }
              } else {
                playlistDescription = ["見つかりませんでした"];
              }

              //動画のデータ取得
              if (videoResult.results != 0) {
                for (let i = 0; i < 5; i++) {
                  let videoString = `${i + 1}. **[\`${
                    videoResult.items[i].name
                  }\`](${videoResult.items[i].url})**｜\`[${
                    videoResult.items[i].duration
                  }]\`｜作者： \`${videoResult.items[i].author.name}\``;
                  videosDescription.push(videoString);
                }
              } else {
                videosDescription = ["見つかりませんでした。"];
              }

              return interaction.editReply({
                embeds: [
                  {
                    title: `「${keyword}」の検索結果`,
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
