module.exports = {
  data: {
    name: "member-role",
    description: "🔒📋【サポ鯖限定】 welcome board作成",
  },
	async execute(interaction) {
    if (interaction.user.id == '728495196303523900') {
      if (interaction.guild.id === '889474199704436776') {
        const Discord = require("discord.js");
        const tic1 = new Discord.MessageButton()
          .setCustomId("join")
          .setStyle("SUCCESS")
          .setLabel("参加する");
        interaction.reply({
          embeds: [
            {
              title: '📖利用規約📖',
              description: '①__**すべての人に敬意をもって接しましょう**__。ハラスメントや糾弾、セクシズム（性差別）、レイシズム（人種差別）、ヘイトスピーチは一切認められていません。\n②__**スパム行為や、宣伝行為（サーバーへの招待、広告掲載など）は禁止**__です。他のメンバーへのDM送信による場合も含みます。\n③__**閲覧注意（NSFW）コンテンツやわいせつなコンテンツは禁止**__されています。これには裸体・性行為・ハードな暴力シーンなどを描いた文章・画像・リンク、そのほか見た人を不快にさせる露骨なコンテンツが含まれます。\n④スタッフは、__ユーザーの個人間の問題に一切関与しません__。該当の当事者間での対応をお願いします。\nルール違反行為や、安全を脅かされるように感じる場面を見かけたら、スタッフにご報告ください。',
              color: 0x498205,
              thumbnail: {
                url: 'attachment://logo.png',
              },
              footer: {
                text: '↓このボタンをおして、参加しましょう！↓',
                icon_url: 'attachment://me.png',
              },
            },
          ],
          files: [
            {
              attachment: 'images/logo.png',
              name: 'logo.png',
            },
            {
              attachment: 'images/me.png',
              name: 'me.png',
            },
          ],
          components: [new Discord.MessageActionRow().addComponents(tic1)]
        });
      } else {
        interaction.reply({
          embeds: [
            {
              title: '🚫エラー！！',
              description: 'ここはサポートサーバーではありません。恥ずかしいと思うので、スポイラーにしておきましたｗ',
              color: 0xFF0000,
            }
          ],
          ephemeral: true
        })
      }
    } else {
      interaction.reply({
        embeds: [
          {
            title: '🚫エラー！！',
            description: '権限が不足しています。このコマンドはBOTAdmin限定機能です。',
            color: 0xFF0000,
          }
        ],
        ephemeral: true
      })
    }
  }
}
