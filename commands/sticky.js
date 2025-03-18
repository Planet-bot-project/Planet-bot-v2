const {
  SlashCommandBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const profileSchema = require("../models/profileSchema.js");

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
        .setName("clear")
        .setDescription("このチャンネルで有効なピン留めを削除・無効化します。")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("off")
        .setDescription(
          "このサーバーの全てのチャンネルで有効なピン留めを削除・無効化します"
        )
    ),

  run: async (client, interaction) => {
    try {
      let subcommand = await interaction.options.getSubcommand();

      if (subcommand == "on") {
        profileSchema
          .findById(interaction.guild.id)
          .then(async (result) => {
            if (
              result.sticky.channels.find(
                (c) => c._id == interaction.channel.id
              )
            )
              return interaction.reply({
                content:
                  "このチャンネルで既にピン留めが有効になっています。\n一度`/sticky clear`を実行してピン留めを解除してから再度お試しください。",
                flags: MessageFlags.Ephemeral,
              });

            // モーダルの表示
            let modal = new ModalBuilder()
              .setCustomId("sticky")
              .setTitle("ピン留めの内容を設定");
            let titleInput = new TextInputBuilder()
              .setCustomId("stickyTitle")
              .setLabel(
                "ピン留めするメッセージのタイトルを入力してください。(任意)"
              )
              .setPlaceholder("ここにメッセージを入力")
              .setStyle(TextInputStyle.Short)
              .setMinLength(0)
              .setMaxLength(256)
              .setRequired(false);
            let bodyInput = new TextInputBuilder()
              .setCustomId("stickyBody")
              .setLabel("ピン留めをするメッセージを入力してください。(必須)")
              .setPlaceholder("ここにメッセージを入力")
              .setStyle(TextInputStyle.Paragraph)
              .setMinLength(1)
              .setMaxLength(400)
              .setRequired(true);
            let imageURLInput = new TextInputBuilder()
              .setCustomId("stickyImageURL")
              .setLabel(
                "ピン留めする画像がある場合はそのURLを入力してください。(任意)"
              )
              .setPlaceholder("ここに画像のURLを入力してください。")
              .setStyle(TextInputStyle.Short)
              .setRequired(false);

            let actionRow = new ActionRowBuilder().addComponents(titleInput);
            modal.addComponents(actionRow);
            actionRow = new ActionRowBuilder().addComponents(bodyInput);
            modal.addComponents(actionRow);
            actionRow = new ActionRowBuilder().addComponents(imageURLInput);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);
          })
          .catch((err) => {
            const errorNotification = require("../errorNotification.js");
            errorNotification(client, interaction, err);
          });
      } else if (subcommand == "clear") {
        profileSchema
          .findById(interaction.guild.id)
          .then(async (result) => {
            // 古いメッセージを削除出来そうならする
            try {
              const stickyChannel = result.sticky.channels.find(
                (c) => c._id == interaction.channel.id
              );
              const oldMessage = await interaction.channel.messages.fetch(
                stickyChannel.stickyMessage.oldMessageId
              );
              if (oldMessage) {
                await oldMessage.delete();
              }
            } catch (err) {
              // 古いメッセージが見つからなかったり削除できない場合は、そのままメッセージ送信
            }

            // このチャンネルのデータを削除
            result.sticky.channels.filter(
              (c) => c._id !== interaction.channel.id
            );
            // 全てのチャンネルで無効化しているならoffに
            if (!result.sticky.channels.length) result.sticky.status = false;

            // 保存する
            await result
              .save()
              .then(async () => {
                return interaction.reply({
                  content:
                    "✅ このチャンネルで有効な固定メッセージの削除に成功しました。",
                  flags: MessageFlags.Ephemeral,
                });
              })
              .catch((err) => {
                const errorNotification = require("../errorNotification.js");
                errorNotification(client, interaction, err);

                let button = new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setLabel("再招待はこちらから")
                    .setStyle(ButtonStyle.Link)
                    .setURL(
                      "https://discord.com/api/oauth2/authorize?client_id=949289830481821776&permissions=8&scope=bot%20applications.commands"
                    )
                );
                return interaction.reply({
                  content:
                    "ピン留め作成時に、DB更新エラーが発生しました。お手数ですが、BOTを一度サーバーからkickしていただき、再招待をお願い致します。",
                  components: [button],
                  flags: MessageFlags.Ephemeral,
                });
              });
          })
          .catch((err) => {
            const errorNotification = require("../errorNotification.js");
            errorNotification(client, interaction, err);

            let button = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel("再招待はこちらから")
                .setStyle(ButtonStyle.Link)
                .setURL(
                  "https://discord.com/api/oauth2/authorize?client_id=949289830481821776&permissions=8&scope=bot%20applications.commands"
                )
            );
            return interaction.reply({
              content:
                "ピン留め作成時に、DB更新エラーが発生しました。お手数ですが、BOTを一度サーバーからkickしていただき、再招待をお願い致します。",
              components: [button],
              flags: MessageFlags.Ephemeral,
            });
          });
      } else if (subcommand == "off") {
        profileSchema
          .findById(interaction.guild.id)
          .then(async (result) => {
            // このチャンネルのデータを削除
            result.sticky.status = false;
            result.sticky.channels = [];

            // 保存する
            await result
              .save()
              .then(() => {
                return interaction.reply({
                  content:
                    "全チャンネルで有効な固定メッセージの削除に成功しました。\nなお、このコマンドを使用した場合はメッセージの自動削除が行われませんので、不要な場合はご自身で削除してください。",
                  flags: MessageFlags.Ephemeral,
                });
              })
              .catch((err) => {
                const errorNotification = require("../errorNotification.js");
                errorNotification(client, interaction, err);

                let button = new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setLabel("再招待はこちらから")
                    .setStyle(ButtonStyle.Link)
                    .setURL(
                      "https://discord.com/api/oauth2/authorize?client_id=949289830481821776&permissions=8&scope=bot%20applications.commands"
                    )
                );
                return interaction.reply({
                  content:
                    "ピン留め作成時に、DB更新エラーが発生しました。お手数ですが、BOTを一度サーバーからkickしていただき、再招待をお願い致します。",
                  components: [button],
                  flags: MessageFlags.Ephemeral,
                });
              });
          })
          .catch((err) => {
            const errorNotification = require("../errorNotification.js");
            errorNotification(client, interaction, err);

            let button = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel("再招待はこちらから")
                .setStyle(ButtonStyle.Link)
                .setURL(
                  "https://discord.com/api/oauth2/authorize?client_id=949289830481821776&permissions=8&scope=bot%20applications.commands"
                )
            );
            return interaction.reply({
              content:
                "ピン留め作成時に、DB更新エラーが発生しました。お手数ですが、BOTを一度サーバーからkickしていただき、再招待をお願い致します。",
              components: [button],
              flags: MessageFlags.Ephemeral,
            });
          });
      } else {
        await interaction.reply({
          content:
            "意図していないサブコマンドを検知しました。お手数ですがサポートサーバーまでお問い合わせください。",
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (err) {
      const errorNotification = require("../errorNotification.js");
      errorNotification(client, interaction, err);
    }
  },
};
