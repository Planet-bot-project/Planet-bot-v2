const { REST, Routes, ActivityType } = require("discord.js");
const os = require("node:os");
const discord_token = process.env.discord_token;
const profileModel = require("../models/profileSchema");
const consoleChannel = process.env.console_channel;
const adminUserID = process.env.admin_user;

module.exports = async (client) => {
  //discord botへのコマンドの設定
  const rest = new REST({ version: "10" }).setToken(discord_token);
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

  //カスタマイズアクティビティを設定
  setInterval(() => {
    client.user.setActivity(
      `所属サーバー数は、${client.guilds.cache.size}｜Ping値は、${
        client.ws.ping
      }ms｜${
        os.type().includes("Windows") ? "開発環境" : "本番環境"
      }で起動中です`,
      { type: ActivityType.Listening }
    );
  }, 10000);

  //登録外のサーバーがあれば、自動登録する
  client.guilds.cache.forEach(async (guild) => {
    await profileModel.findById(guild.id).then(async (model) => {
      if (!model) {
        const profile = await profileModel.create({
          _id: guild.id,
          sticky: {
            status: false,
            stickyMessage: {
              id: "",
              content: "",
            },
            stickyImageURL: "",
          },
          starboard: {
            status: false,
            boardInfo: [
              {
                channelID: "",
                emojiID: "",
                emojiCount: 0,
              },
            ],
          },
        });
        profile
          .save()
          .then(() => {
            console.log(`未登録のサーバーID「${guild.id}」を新規登録しました`);
          })
          .catch((err) => {
            console.log(err);
            return client.channels.cache
              .get(consoleChannel)
              ?.send({ content: `<@${adminUserID}>`, embeds: [embed] })
              .catch((err) => {});
          });
      }
    });
  });

  //登録済みのサーバーの中で、退出済みの物があれば削除する
  let allGuildID = [];
  await profileModel.find().then(async (allData) => {
    for (let data of allData) {
      allGuildID.push(data._id);
    }

    for (let guildID of allGuildID) {
      let guild = client.guilds.cache.get(guildID);

      if (!guild) {
        await profileModel
          .deleteOne({ _id: guildID })
          .then(() => {
            return console.log(
              "退出済みのサーバーを発見したため、DBから削除しました。"
            );
          })
          .catch((err) => {
            console.log(err);
            return console.log(
              "退出済みのサーバー発見し、DBから削除しようとしましたが、エラーが発生しました。"
            );
          });
      }
    }
  });

  client.channels.cache
    .get(consoleChannel)
    .send(
      `${
        os.type().includes("Windows") ? "開発環境" : "本番環境"
      }で起動しました！`
    );
};
