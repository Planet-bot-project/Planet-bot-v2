module.exports = {
  data: {
    name: "ping",
    description: "🏓Ping値を計測します！",
  },
  async execute(interaction) {
    await interaction.reply({
      embeds: [
        {
          title: '🏓Ping!!',
          description: `Pingは${Date.now() - interaction.createdTimestamp}msです。`,
          color: 15132165,
          timestamp: new Date(),
        },
      ],
    });
  }
}
