const {
  ApplicationCommandOptionType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const profileModel = require("../models/profileSchema");

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
          //チャンネルタイプ指定が出来るようにする
          //https://stackoverflow.com/questions/76114164
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
      let supportServerButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("サポートサーバーに参加する")
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.gg/uYYaVRuUuJ")
      );

      //時間かかる処理なので、defer
      await interaction.deferReply({ ephemeral: true });

      if (mode === "on") {
        let channel = interaction.options.getChannel("category");

        //チャンネル設定が

        //データベース設定
        profileModel
          .findById(interaction.guild.id)
          .catch((err) => {
            console.log(
              `データベース更新時にエラーが発生しました。(場所：pomodoro/on)\n${err}`
            );

            return interaction.reply({
              content:
                "データベース関連の処理でエラーが発生しました。\nしばらく時間を空けて再度お試しいただくか、サポートサーバーにてお問い合わせください。",
              ephemeral: true,
              components: [supportServerButton],
            });
          })
          .then((model) => {
            model.pomodoro = true;
            model.pomodoro_category = channel.id;
            model.save().then(async () => {
              return interaction.editReply({
                embeds: [
                  {
                    title: "✅ 設定を更新しました！",
                    color: 0x10ff00,
                  },
                ],
              });
            });
          });

        console.log("on");
      } else if (mode == "working_time") {
        let workTime = interaction.options.getInteger("working_minute");
        console.log("workingtime");
      } else if (mode == "breaking_time") {
        let breakTime = interaction.options.getInteger("breaking_minute");
        console.log("breaking time");
      } else if (mode == "off") {
        console.log("off");
      }
    } catch (err) {
      const errorNotification = require("../errorNotification.js");
      errorNotification(client, interaction, err);
    }
  },
};
