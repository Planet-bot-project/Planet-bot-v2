const { ApplicationCommandOptionType } = require("discord.js");

module.exports = {
  name: "create",
  description:
    "🧰カテゴリー・テキストチャンネル・ボイスチャンネルを作成します！（チャンネル管理権限必須）",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "type",
      description: "何を作るか指定します",
      required: true,
      choices: [
        { name: "カテゴリー", value: "category" },
        { name: "テキストチャンネル", value: "text_channel" },
        { name: "ボイスチャンネル", value: "voice_channel" },
      ],
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "name",
      value: "name",
      description: "名前を指定します",
      required: true,
    },
  ],

  run: async (client, interaction) => {
    try {
      const c_name = interaction.options.getString("name");
      if (!interaction.memberPermissions.has("MANAGE_CHANNELS")) {
        await interaction.reply({
          embeds: [
            {
              title: "🚫エラー！！",
              description:
                "権限エラーです。\nあなたはこのサーバーのチャンネル管理権限を持っていません。",
              color: 0xff0000,
              timestamp: new Date(),
            },
          ],
          ephemeral: true,
        });
      } else {
        if (interaction.options.getString("type") === "category") {
          interaction.guild.channels.create({
            name: c_name,
            type: 4,
          });
          await interaction.reply({
            embeds: [
              {
                title: "🟢完了",
                description: `「📦${c_name}」カテゴリーを作成しました。`,
                color: 0x00ff00,
                timestamp: new Date(),
              },
            ],
          });
        } else if (interaction.options.getString("type") === "text_channel") {
          interaction.guild.channels
            .create({
              name: c_name,
              type: 0,
              parent: interaction.channel.parent,
            })
            .then(async (channels) => {
              const c_id = channels.id;
              await interaction.reply({
                embeds: [
                  {
                    title: "🟢完了",
                    description: `🔤<#${c_id}> を作成しました。`,
                    color: 0x00ff00,
                    timestamp: new Date(),
                  },
                ],
              });
            });
        } else if (interaction.options.getString("type") === "voice_channel") {
          interaction.guild.channels
            .create({
              name: c_name,
              type: 2,
              parent: interaction.channel.parent,
            })
            .then(async (channels) => {
              const c_id = channels.id;
              await interaction.reply({
                embeds: [
                  {
                    title: "🟢完了",
                    description: `🗣<#${c_id}> を作成しました。`,
                    color: 0x00ff00,
                    timestamp: new Date(),
                  },
                ],
              });
            });
        }
      }
    } catch (err) {
      const errorNotification = require("../functions.js");
      errorNotification(client, interaction, err);
    }
  },
};
