module.exports = {
  data: {
    name: "create",
    description: "🧰カテゴリー・テキストチャンネル・ボイスチャンネルを作成します！（チャンネル管理権限必須）",
    options: [
      {
        type: "STRING",
        name: "type",
        description: "何を作るか指定します",
        required: true,
        choices: [
          { name: "カテゴリー", value: "category" },
          { name: "テキストチャンネル", value: "text_channel" },
          { name: "ボイスチャンネル", value: "voice_channel"},
        ]
      },
      {
        type: "STRING",
        name: "name",
        value: "name",
        description: "名前を指定します",
        required: true
      }
    ]
  },
  async execute(interaction) {
    const c_name = interaction.options.getString('name')
    if (!interaction.memberPermissions.has("MANAGE_CHANNELS")) {
      await interaction.reply({
        embeds: [
          {
            title: '🚫エラー！！',
            description: '権限エラーです。\nあなたはこのサーバーのチャンネル管理権限を持っていません。',
            color: 0xFF0000,
            timestamp: new Date()
          },
        ],
        ephemeral: true
      });
    } else {
      if (interaction.options.getString('type') === 'category') {
        interaction.guild.channels.create(c_name,{type: 'GUILD_CATEGORY'});
        await interaction.reply({
          embeds: [
            {
              title: '🟢完了',
              description: `「📦${c_name}」カテゴリーを作成しました。`,
              color: 0x00FF00,
              timestamp: new Date()
            }
          ]
        });
      } else if (interaction.options.getString('type') === 'text_channel') {
        interaction.guild.channels.create(c_name,{
          type: 'TEXT',parent: interaction.channel.parent
        }).then(async channels => {
          const c_id = channels.id
          await interaction.reply({
            embeds: [
              {
                title: '🟢完了',
                description: `🔤<#${c_id}> を作成しました。`,
                color: 0x00FF00,
                timestamp: new Date()
              }
            ]
          });
        });
      } else if (interaction.options.getString('type') === 'voice_channel') {
        interaction.guild.channels.create(c_name,{
          type: 'GUILD_VOICE', parent: interaction.channel.parent
        }).then(async channels => {
          const c_id = channels.id
          await interaction.reply({
            embeds: [
              {
                title: '🟢完了',
                description: `🗣<#${c_id}> を作成しました。`,
                color: 0x00FF00,
                timestamp: new Date()
              }
            ]
          });
        });
      }
    }
  }
}
