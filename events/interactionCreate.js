const { InteractionType } = require("discord.js");
const fs = require("fs");

module.exports = async (client, interaction) => {
  try {
    if (!interaction?.guild) {
      return interaction?.reply({
        content:
          "❌ このBOTはサーバー内でのみ動作します。\nお手数をおかけしますが、サーバー内でご利用ください。",
        ephemeral: true,
      });
    } else {
      if (interaction?.type == InteractionType.ApplicationCommand) {
        fs.readdir("./commands", (err, files) => {
          if (err) throw err;
          files.forEach(async (f) => {
            let props = require(`../commands/${f}`);
            if (interaction.commandName == props.name) {
              try {
                if (props && props.voiceChannel) {
                  if (!interaction?.member?.voice?.channelId)
                    return interaction
                      ?.reply({
                        content: "❌ ボイスチャンネルに参加してください。",
                        ephemeral: true,
                      })
                      .catch((err) => {});
                  var guild_me = interaction?.guild?.members?.cache?.get(
                    client?.user?.id
                  );
                  if (guild_me?.voice?.channelId) {
                    if (
                      guild_me?.voice?.channelId !==
                      interaction?.member?.voice?.channelId
                    ) {
                      return interaction
                        ?.reply({
                          content:
                            "❌ 私と同じボイスチャンネルに接続してください。",
                          ephemeral: true,
                        })
                        .catch((err) => {});
                    }
                  }

                  // 再生中かどうか調べる
                  const queue = client?.player?.getQueue(
                    interaction?.guild?.id
                  );
                  if (!queue || !queue?.playing)
                    return interaction
                      ?.reply({
                        content: "❌ 現在再生中の楽曲はありません。",
                        ephemeral: true,
                      })
                      .catch((err) => {});
                }
                return props.run(client, interaction);
              } catch (err) {
                return interaction?.reply({
                  content: `❌ 何らかのエラーが発生しました。`,
                  ephemeral: true,
                });
              }
            }
          });
        });
      }
    }
  } catch (err) {
    const errorNotification = require("../errorNotification.js");
    errorNotification(client, interaction, err);
  }
};
