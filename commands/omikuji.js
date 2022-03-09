module.exports = {
	data: {
    name: "omikuji",
    description: "🥠おみくじを引きます",
  },
	async execute(interaction) {
    const arr = ['大吉', '中吉', '小吉', '吉', '凶', '大凶'];
    const random = Math.floor(Math.random() * arr.length);
    const result = arr[random];
    const reply = ['あなたは', result, 'を引きました！'].join('');
   　await interaction.reply({
      embeds: [
        {
          title: 'おみくじの結果！',
          description: reply,
          color: 4817413,
          timestamp: new Date(),
        },
      ],
    });
	}
}
