function errorNotification(client, interaction, e) {
  const { EmbedBuilder } = require("discord.js");
  const consoleChannel = process.env.console_channel;
  const adminUserID = process.env.admin_user;

  let embed = new EmbedBuilder()
    .setColor(0xffa954)
    .setTimestamp()
    .addFields([
      { name: "コマンド", value: `${interaction?.commandName}` },
      { name: "エラー", value: `${e}` },
      {
        name: "ユーザー",
        value: `${interaction?.user?.tag} \`(${interaction?.user?.id})\``,
        inline: true,
      },
      {
        name: "サーバー",
        value: `${interaction?.guild?.name} \`(${interaction?.guild?.id})\``,
        inline: true,
      },
      {
        name: "時間",
        value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
        inline: true,
      },
      {
        name: "コマンドが使用されたチャンネル",
        value: `${interaction?.channel?.name} \`(${interaction?.channel?.id})\``,
        inline: true,
      },
      {
        name: "ユーザーが接続していたボイスチャンネル",
        value: `${interaction?.member?.voice?.channel?.name} \`(${interaction?.member?.voice?.channel?.id})\``,
        inline: true,
      },
    ]);
  client.channels.cache
    .get(consoleChannel)
    ?.send({ content: `<@${adminUserID}>`, embeds: [embed] })
    .catch((err) => {});

  return;
}

module.exports = errorNotification;
