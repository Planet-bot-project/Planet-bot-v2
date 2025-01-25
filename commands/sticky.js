const { SlashCommandBuilder, MessageFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sticky")
    .setDescription("ピン留めメッセージを作成/削除します")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("on")
        .setDescription("このチャンネルでピン留めを有効にします")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("off")
        .setDescription("このチャンネルで有効なピン留めを削除します")
    ),

  run: async (client, interaction) => {
    try {
      let subcommand = await interaction.options.getSubcommand();

      if (subcommand == "on") {
        // TODO: モーダルを表示して入力を受け付ける
      } else if (subcommand == "off") {
        // TODO: DBを更新して、ピン止め用メッセージを消せたら消す。
      } else {
        await interaction.reply({
          content:
            "意図していないサブコマンドが使用されました。お手数ですがサポートサーバーまでお問い合わせください。",
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (err) {
      const errorNotification = require("../errorNotification.js");
      errorNotification(client, interaction, err);
    }
  },
};
