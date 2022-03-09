module.exports = {
  data: {
    name: "botadmin",
    description: "🤖このBOTの管理者をご紹介します！",
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
          title: 'このBOTの管理者👇',
          description: `<@728495196303523900>が管理しております。\nお問い合わせは__**サポートサーバー**__までどうぞ！`,
          color: 3823616,
          timestamp: new Date(),
        },
      ],
    });
  }
}
