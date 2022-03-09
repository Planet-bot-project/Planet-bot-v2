module.exports = {
  data: {
    name: "help",
    description: "❔全コマンドのヘルプを表示します",
    options: [{
      type: "STRING",
      name: "commands",
      description: "詳細を表示するコマンドを指定します",
      required: true,
      choices: [
        { name: "ping", value: "ping" },
        { name: "botadmin", value: "botadmin" },
        { name: "me", value: "me"},
        { name: "omikuji", value: "omikuji"},
        { name: "tc_create", value: "tc_create"},
        { name: "COMMAND_LIST", value: "COMMAND_LIST"}
      ]
    }],
  },
  async execute(interaction) {
    if (interaction.options.getString('commands') === 'ping') {
      await interaction.reply({
        embeds: [
          {
            title: 'Pingコマンドのヘルプ',
            description: 'BOTとDiscordとの接続状況を表示します。\nこの値が小さいほど、安定して通信できているということです。',
            color: 4303284,
            thumbnail: {
              url: 'attachment://logo.png',
            },
            timestamp: new Date(),
          },
        ],
        files: [
          {
            attachment: 'images/logo.png',
            name: 'logo.png',
          },
        ],
      });
    } else if (interaction.options.getString('commands') === 'botadmin') {
      await interaction.reply({
        embeds: [
          {
            title: 'Botadminコマンドのヘルプ',
            description: 'このBOTの管理者についてを表示します。',
            color: 4303284,
            thumbnail: {
              url: 'attachment://logo.png',
            },
            timestamp: new Date(),
          },
        ],
        files: [
          {
            attachment: 'images/logo.png',
            name: 'logo.png',
          },
        ],
      });
    } else if (interaction.options.getString('commands') === 'me') {
      await interaction.reply({
        embeds: [
          {
            title: 'Meコマンドのヘルプ',
            description: 'あなたをメンションします。',
            color: 4303284,
            thumbnail: {
              url: 'attachment://logo.png',
            },
            timestamp: new Date(),
          },
        ],
        files: [
          {
            attachment: 'images/logo.png',
            name: 'logo.png',
          },
        ],
      });
    } else if (interaction.options.getString('commands') === 'omikuji') {
      await interaction.reply({
        embeds: [
          {
            title: 'Omikujiコマンドのヘルプ',
            description: 'おみくじの結果を表示します。',
            color: 4303284,
            thumbnail: {
              url: 'attachment://logo.png',
            },
            timestamp: new Date(),
          },
        ],
        files: [
          {
            attachment: 'images/logo.png',
            name: 'logo.png',
          },
        ],
      });
    } else if (interaction.options.getString('commands') === 'tc_create') {
      await interaction.reply({
        embeds: [
          {
            title: 'Tc_createコマンドのヘルプ',
            description: 'テキストチャンネルを作成します。\n```diff\n- 要チャンネル管理権限！！ -\n```',
            color: 4303284,
            thumbnail: {
              url: 'attachment://logo.png',
            },
            timestamp: new Date(),
          },
        ],
        files: [
          {
            attachment: 'images/logo.png',
            name: 'logo.png',
          },
        ],
      });
    } else if (interaction.options.getString('commands') === 'COMMAND_LIST') {
      await interaction.reply({
        embeds: [
          {
            title: 'コマンドリスト',
            description: '`p!ping`でPINGを見てみよう！\n\n`p!botadmin`でこのBOTの管理者のメンションをするよ\n\n`p!me`であなたにメンションするよ\n\n`p!omikuji`でおみくじを引けるよ\n\n`p!tc_create <チャンネル名>`でテキストチャンネルを作成するよ\n　※要、チャンネル管理権限\n\n`p!stop`でBOTを停止するよ(__**BOT管理者限定機能**__)',
            color: 4303284,
            thumbnail: {
              url: 'attachment://logo.png',
            },
            timestamp: new Date(),
          },
        ],
        files: [
          {
            attachment: 'images/logo.png',
            name: 'logo.png',
          },
        ],
      });
	  }
  }
}
