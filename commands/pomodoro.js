const { ApplicationCommandOptionType } = require("discord.js");

module.exports = {
  name: "pomodoro",
  description: "⏱ポモドーロタイマーを設定します！",
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "on",
      description: "ポモドーロタイマーを有効にします。",
      options: [
        {
          type: ApplicationCommandOptionType.Channel,
          name: "category",
          description:
            "タイマーを使用するカテゴリーを設定してください。設定しない場合は入力しないでください。",
          required: false,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.SubcommandGroup,
      name: "settings",
      description: "ポモドーロタイマーの設定を変更します。",
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "working_time",
          description:
            "ポモドーロタイマーの活動時間の長さを設定します。単位は分です。",
          options: [
            {
              type: ApplicationCommandOptionType.Integer,
              name: "working_minute",
              description: "単位は分です。",
              required: true,
            },
          ],
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "breaking_time",
          description:
            "ポモドーロタイマーの休憩時間の長さを設定します。単位は分です。",
          options: [
            {
              type: ApplicationCommandOptionType.Integer,
              name: "breaking_minute",
              description: "単位は分です。",
              required: true,
            },
          ],
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "off",
      description: "ポモドーロタイマーを無効にします。",
    },
  ],

  run: async (client, interaction) => {
    try {
      let mode = interaction.options.getSubcommand();
      if (mode === "on") {
      } else if (mode == "working_time") {
      } else if (mode == "breaking_time") {
      } else if (mode == "off") {
      }
    } catch (err) {
      const errorNotification = require("../errorNotification.js");
      errorNotification(client, interaction, err);
    }
  },
};
