const { ActivityType } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const token = process.env.token;

module.exports = async (client) => {
  const rest = new REST({ version: "10" }).setToken(token);
  (async () => {
    try {
      await rest.put(Routes.applicationCommands(client.user.id), {
        body: await client.commands,
      });
      console.log("スラッシュコマンドの再読み込みに成功しました。");
    } catch (err) {
      console.log(
        `❌ スラッシュコマンドの再読み込み時にエラーが発生しました。：\n${err}`
      );
    }
  })();

  console.log(`${client.user.username}への接続に成功しました。`);

  setInterval(() => {
    client.user.setActivity({
      name: `所属サーバー数は${
        client.guilds.cache.size
      }｜このサーバーが利用しているシャードは${
        Number(client?.shard?.ids) + 1 ? Number(client?.shard?.ids) + 1 : "1"
      }`,
      type: ActivityType.Listening,
    });
  }, 10000);
};
