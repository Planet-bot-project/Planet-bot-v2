module.exports = {
  data: {
    name: "about",
    description: "📪このBOTの情報を表示します",
  },
	async execute(interaction) {
	  await interaction.reply({
      components: [
        {
          type: 1,
          components: [
            {
              style: 5,
              label: 'サポートサーバーへ参加する',
              url: 'https://discord.gg/uYYaVRuUuJ',
              disabled: false,
              type: 2,
            },
          ],
        },
      ],
      embeds: [
        {
          type: 'rich',
          title: 'Planet botについて',
          description: 'node.jsで作成された、適当なbotです。\n\n\nご不明な点は、以下のボタンから、サポートサーバーに参加して、お問い合わせください！',
          color: 0x498205,
          thumbnail: {
            url: 'attachment://logo.png',
          },
          footer: {
            text: 'This bot is made by Hoshimikan6490',
            icon_url: 'attachment://me.png',
          },
        },
      ],
      files: [
        {
          attachment: 'images/logo.png',
          name: 'logo.png',
        }, {
          attachment: 'images/me.png',
          name: 'me.png',
        },
      ],
    });
	}
}
