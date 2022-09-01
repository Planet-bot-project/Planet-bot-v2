const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
  data: {
    name: "yt_search",
    description: "🔍YouTubeの動画を検索します",
    options: [{
      type: ApplicationCommandOptionType.String,
      name: "keyword",
      description: "検索キーワード",
      required: true,
    }]
  },
	async execute(interaction) {
    const wait = require('node:timers/promises').setTimeout;
    await interaction.deferReply();
    const yts = require( 'yt-search' );//yt-searchを読み込む
    const AKB = interaction.options.getString('keyword')
    yts( AKB, async function ( err, R ) {//検索
      const videos = R.videos;
      await wait(1000);
      await interaction.editReply({
        content: videos[ 0 ].url,
        ephemeral: true
      })
    })
  }
}
