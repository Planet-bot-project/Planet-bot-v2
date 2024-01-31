const { ApplicationCommandOptionType } = require("discord.js");

module.exports = {
  name: "help",
  description: "❔全コマンドのヘルプを表示します",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "commands",
      description: "詳細を表示するコマンドを指定します",
      required: true,
      choices: [
        { name: "about", value: "about" },
        { name: "botadmin", value: "botadmin" },
        { name: "omikuji", value: "omikuji" },
        { name: "ping", value: "ping" },
        { name: "qr_code", value: "qr_code" },
        { name: "tc_create", value: "tc_create" },
        { name: "yt_search", value: "yt_search" },
        { name: "command_list", value: "command_list" },
      ],
    },
  ],

  run: async (client, interaction) => {
    try {
      if (interaction.options.getString("commands") === "about") {
        await interaction.reply({
          embeds: [
            {
              title: "Aboutコマンドのヘルプ",
              description: "このBOTに関する情報を表示します",
              color: 4303284,
              thumbnail: {
                url: "attachment://logo.png",
              },
              timestamp: new Date(),
            },
          ],
          files: [
            {
              attachment: "images/logo.png",
              name: "logo.png",
            },
          ],
        });
      } else if (interaction.options.getString("commands") === "botadmin") {
        await interaction.reply({
          embeds: [
            {
              title: "Botadminコマンドのヘルプ",
              description: "このBOTの管理者についてを表示します。",
              color: 4303284,
              thumbnail: {
                url: "attachment://logo.png",
              },
              timestamp: new Date(),
            },
          ],
          files: [
            {
              attachment: "images/logo.png",
              name: "logo.png",
            },
          ],
        });
      } else if (interaction.options.getString("commands") === "omikuji") {
        await interaction.reply({
          embeds: [
            {
              title: "Omikujiコマンドのヘルプ",
              description: "おみくじの結果を表示します。",
              color: 4303284,
              thumbnail: {
                url: "attachment://logo.png",
              },
              timestamp: new Date(),
            },
          ],
          files: [
            {
              attachment: "images/logo.png",
              name: "logo.png",
            },
          ],
        });
      } else if (interaction.options.getString("commands") === "ping") {
        await interaction.reply({
          embeds: [
            {
              title: "Pingコマンドのヘルプ",
              description: "Pingを測定します",
              color: 4303284,
              thumbnail: {
                url: "attachment://logo.png",
              },
              timestamp: new Date(),
            },
          ],
          files: [
            {
              attachment: "images/logo.png",
              name: "logo.png",
            },
          ],
        });
      } else if (interaction.options.getString("commands") === "qr_code") {
        await interaction.reply({
          embeds: [
            {
              title: "Qr_codeコマンドのヘルプ",
              description:
                "入力された文字列やURLのQRコードを作成します。\n　※QRコードは(株)デンソーウェーブの登録商標です。",
              color: 4303284,
              thumbnail: {
                url: "attachment://logo.png",
              },
              timestamp: new Date(),
            },
          ],
          files: [
            {
              attachment: "images/logo.png",
              name: "logo.png",
            },
          ],
        });
      } else if (interaction.options.getString("commands") === "tc_create") {
        await interaction.reply({
          embeds: [
            {
              title: "Tc_createコマンドのヘルプ",
              description:
                "・カテゴリーチャンネル\n・テキストチャンネル\n・ボイスチャンネル\nを作成します。\n```diff\n- 要チャンネル管理権限！！ -\n```",
              color: 4303284,
              thumbnail: {
                url: "attachment://logo.png",
              },
              timestamp: new Date(),
            },
          ],
          files: [
            {
              attachment: "images/logo.png",
              name: "logo.png",
            },
          ],
        });
      } else if (interaction.options.getString("commands") === "yt_search") {
        await interaction.reply({
          embeds: [
            {
              title: "Yt_searchコマンドのヘルプ",
              description: "Youtubeの動画を検索します。",
              color: 4303284,
              thumbnail: {
                url: "attachment://logo.png",
              },
              timestamp: new Date(),
            },
          ],
          files: [
            {
              attachment: "images/logo.png",
              name: "logo.png",
            },
          ],
        });
      } else if (interaction.options.getString("commands") === "command_list") {
        await interaction.reply({
          embeds: [
            {
              title: "コマンドリスト",
              description:
                "`/ping`でPINGを見てみよう！\n\n`/botadmin`でこのBOTの管理者のメンションをするよ\n\n`/me`であなたにメンションするよ\n\n`/help`でこれを表示するよ\n\n`/omikuji`でおみくじを引けるよ\n\n`/tc_create <何を作るか選択> <チャンネル名>`でチャンネルを作成するよ\n　※要、チャンネル管理権限\n\n`/yt_search <キーワード>` でそのキーワードに関連した動画URLを投稿するよ\n\n`/qr_code <文字列かURL>`でその文字列を読み取れるQRコードを作成するよ\n　※QRコードは(株)デンソーウェーブの登録商標です。\n\n`/stop`でBOTを停止するよ(__**BOT管理者限定機能**__)",
              color: 4303284,
              thumbnail: {
                url: "attachment://logo.png",
              },
              timestamp: new Date(),
            },
          ],
          files: [
            {
              attachment: "images/logo.png",
              name: "logo.png",
            },
          ],
        });
      }
    } catch (err) {
      const errorNotification = require("../functions.js");
      errorNotification(client, interaction, err);
    }
  },
};
