const { SlashCommandBuilder, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("starboard")
    .setDescription("スターボード機能を設定します")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("on")
        .setDescription("スターボード機能を有効化します")
        .addChannelOption((option) =>
          option
            .setName("send_channel")
            .setDescription(
              "絵文字の数が指定の数に達した場合にメッセージを転送する先のチャンネルを指定してください"
            )
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("emoji")
            .setDescription("カウント対象の絵文字を入力してください")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("emoji_count") // ここを修正
            .setDescription(
              "メッセージについた絵文字の数がこの数を超えたときに、メッセージを転送する閾値を入力してください"
            )
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("ignore_role") // ここを修正
            .setDescription(
              "スターボードの絵文字数から無視するロールを設定します(任意)"
            )
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("off").setDescription("スターボード機能をオフにします")
    ),

  run: async (client, interaction) => {
    await interaction.reply("test");
  },
};
