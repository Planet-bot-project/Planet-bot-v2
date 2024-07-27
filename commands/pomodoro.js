const { ApplicationCommandOptionType } = require("discord.js");

module.exports = {
  name: "pomodoro",
  description: "⏱ポモドーロタイマーを設定します！",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "mode",
      description: "ポモドーロタイマーを有効にするか無効にするか選んでください",
      required: true,
      choices: [
        { name: "ON(有効)", value: "on" },
        { name: "OFF(無効)", value: "off" },
      ],
    },
  ],

  run: async (client, interaction) => {
    try {
      let mode = interaction.options.getString("mode");

      if (mode == "on") {
      } else if (mode == "off") {
      }
    } catch (err) {
      const errorNotification = require("../errorNotification.js");
      errorNotification(client, interaction, err);
    }
  },
};
