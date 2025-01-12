const {
  InteractionType,
  ApplicationCommandType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  MessageFlags,
} = require("discord.js");
const fs = require("fs");
const profileModel = require("../models/profileSchema.js");

module.exports = async (client, interaction) => {
  try {
    if (!interaction?.guild) {
      return interaction?.reply({
        content:
          "❌ このBOTはサーバー内でのみ動作します。\nお手数をおかけしますが、サーバー内でご利用ください。",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      if (interaction?.type == InteractionType.ApplicationCommand) {
        fs.readdir("./commands", (err, files) => {
          if (err) throw err;
          files.forEach(async (f) => {
            let props = require(`../commands/${f}`);
            let propsJson = props.data.toJSON();

            //propsJsonがundefinedだった場合は、スラッシュコマンドとして、タイプを1にする
            if (propsJson.type == undefined) {
              propsJson.type = ApplicationCommandType.ChatInput;
            }

            if (
              interaction.commandName == propsJson.name &&
              interaction.commandType == propsJson.type
            ) {
              try {
                return props.run(client, interaction);
              } catch (err) {
                return interaction?.reply({
                  content: `❌ 何らかのエラーが発生しました。`,
                  flags: MessageFlags.Ephemeral,
                });
              }
            }
          });
        });
      }

      if (interaction?.type == InteractionType.MessageComponent) {
        //VC接続不要処理
        switch (interaction?.customId) {
          case "server_register": {
            let modal = new ModalBuilder()
              .setTitle("登録するサーバーのサーバーIDを入力してください。")
              .setCustomId("ask_register_id");
            let TextInput = new TextInputBuilder()
              .setLabel("サーバーID")
              .setCustomId("register_id")
              .setStyle(TextInputStyle.Short)
              .setMaxLength(20) //snowflakeの文字数的に700年後まで使えれば大丈夫だろうという事で20文字以内
              .setMinLength(15)
              .setRequired(true);
            let ActionRow = new ActionRowBuilder().addComponents(TextInput);
            modal.addComponents(ActionRow);
            return interaction.showModal(modal);
          }
          case "server_unregister": {
            let modal = new ModalBuilder()
              .setTitle("登録解除するサーバーのサーバーIDを入力してください。")
              .setCustomId("ask_unregister_id");
            let TextInput = new TextInputBuilder()
              .setLabel("サーバーID")
              .setCustomId("unregister_id")
              .setStyle(TextInputStyle.Short)
              .setMaxLength(20) //snowflakeの文字数的に700年後まで使えれば大丈夫だろうという事で20文字以内
              .setMinLength(15)
              .setRequired(true);
            let ActionRow = new ActionRowBuilder().addComponents(TextInput);
            modal.addComponents(ActionRow);
            return interaction.showModal(modal);
          }
          case "debug": {
            let modal = new ModalBuilder()
              .setTitle("デバッグするサーバーIDを入力してください。")
              .setCustomId("ask_server_id");
            let TextInput = new TextInputBuilder()
              .setLabel("サーバーID")
              .setCustomId("server_id")
              .setStyle(TextInputStyle.Short)
              .setMaxLength(20) //snowflakeの文字数的に700年後まで使えれば大丈夫だろうという事で20文字以内
              .setMinLength(15)
              .setRequired(false);
            let ActionRow = new ActionRowBuilder().addComponents(TextInput);
            modal.addComponents(ActionRow);
            return interaction.showModal(modal);
          }
          case "data_control": {
            let modal = new ModalBuilder()
              .setTitle("変数名と操作を指定")
              .setCustomId("data_control_form");
            let TextInput1 = new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setLabel("変数名")
                .setCustomId("variable_name")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(30) //snowflakeの文字数的に700年後まで使えれば大丈夫だろうという事で20文字以内
                .setMinLength(1)
                .setRequired(true)
            );
            let TextInput2 = new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setLabel("変数内容")
                .setCustomId("variable_value")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(30) //snowflakeの文字数的に700年後まで使えれば大丈夫だろうという事で20文字以内
                .setMinLength(1)
                .setRequired(false)
            );
            let TextInput3 = new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setLabel("「追加」か「削除」")
                .setCustomId("how_to_variable")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(2) //snowflakeの文字数的に700年後まで使えれば大丈夫だろうという事で20文字以内
                .setMinLength(0)
                .setRequired(true)
            );
            modal.addComponents(TextInput1);
            modal.addComponents(TextInput2);
            modal.addComponents(TextInput3);
            return interaction.showModal(modal);
          }
        }
      }

      if (interaction?.type == InteractionType.ModalSubmit) {
        switch (interaction?.customId) {
          case "ask_register_id": {
            let id = interaction.fields.getTextInputValue("register_id");
            const profileData = await profileModel.findOne({
              _id: id,
            });
            if (!profileData) {
              const profile = await profileModel.create({
                _id: id,
                pomodoro: false,
                pomodoro_category: null,
                pomodoro_worktime: 10,
                pomodoro_breaktime: 5,
              });
              profile
                .save()
                .catch(async (err) => {
                  console.log(err);
                  await interaction.reply(
                    "❌ エラーが発生しました。コンソールを確認してください。"
                  );
                })
                .then(async () => {
                  await interaction.reply("✅　登録しました。");
                });
            } else {
              await interaction.reply({
                content: "❌ そのサーバーは既に登録済みです。",
              });
            }
            return;
          }
          case "ask_unregister_id": {
            let id = interaction.fields.getTextInputValue("unregister_id");
            const profileData = await profileModel.findOne({
              _id: id,
            });
            if (profileData) {
              profileModel
                .deleteOne({ _id: id })
                .then(async function () {
                  await interaction.reply("✅　登録を解除しました。");
                })
                .catch(async (err) => {
                  console.log(err);
                  await interaction.reply(
                    "❌ エラーが発生しました。コンソールを確認してください。"
                  );
                });
            } else {
              await interaction.reply({
                content: "❌ そのサーバーは既に登録解除済みです。",
                flags: MessageFlags.Ephemeral,
              });
            }
            return;
          }
          case "ask_server_id": {
            const server = interaction.fields.getTextInputValue("server_id");
            if (server) {
              let guild;
              guild = client.guilds.cache.get(server);
              if (!guild)
                await interaction
                  .reply({
                    content: "❌ このBOTはそのサーバーに所属していません。",
                    flags: MessageFlags.Ephemeral,
                  })
                  .catch((err) => {});

              const embed = new EmbedBuilder()
                .setTitle(`ℹ️　サーバー「${guild.name}」の情報`)
                .setDescription(
                  `> **サーバーID:** \`${guild.id}\`\n> **メンバー数:** \`${guild.memberCount}\`\n> **チャンネル数:** \`${guild.channels.cache.size}\`\n> **ロール数:** \`${guild.roles.cache.size}\`\n> **絵文字数:** \`${guild.emojis.cache.size}\`\n> **サーバーブースト:** \`${guild.premiumSubscriptionCount}\`\n> **サーバーブーストのレベル:** \`${guild.premiumTier}\``
                )
                .setColor(4303284)
                .setThumbnail(guild.iconURL())
                .setTimestamp();
              await interaction
                .reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
                .catch((err) => {});
            } else {
              let guilds = client.guilds.cache.map((g) => {
                return {
                  name: g.name,
                  id: g.id,
                  memberCount: g.memberCount,
                };
              });
              //sort from largest to smallest
              guilds = guilds
                .flat()
                .sort((a, b) => b.memberCount - a.memberCount);

              //page system
              let page = 0;
              const maxPage = Math.ceil(guilds.length / 10) - 1;
              const embed = new EmbedBuilder()
                .setTitle(`${guilds.length}サーバーに所属中`)
                .setDescription(
                  guilds
                    .slice(page * 10, page * 10 + 10)
                    .map(
                      (g) =>
                        `> **${g.name}** \`(${g.id})\` - \`${g.memberCount}\` 名のメンバー`
                    )
                    .join("\n")
                )
                .setColor(4303284)
                .setTimestamp();
              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("prev")
                  .setLabel("戻る")
                  .setStyle(ButtonStyle.Primary)
                  .setDisabled(page == 0 ? true : false),
                new ButtonBuilder()
                  .setCustomId("next")
                  .setLabel("次へ")
                  .setStyle(ButtonStyle.Primary)
                  .setDisabled(page == maxPage ? true : false)
              );
              const msg = await interaction
                .reply({
                  embeds: [embed],
                  components: [row],
                  fetchReply: true,
                  flags: MessageFlags.Ephemeral,
                })
                .catch((err) => {});
              const filter = (i) => i.user.id == interaction.user.id;
              const collector = msg.createMessageComponentCollector({
                filter,
                time: 600000,
              });
              collector.on("collect", async (i) => {
                if (i.customId == "prev") {
                  page--;
                  embed.setDescription(
                    guilds
                      .slice(page * 10, page * 10 + 10)
                      .map(
                        (g) =>
                          `> **${g.name}** \`(${g.id})\` - \`${g.memberCount}\` 名のメンバー`
                      )
                      .join("\n")
                  );
                  row.components[0].setDisabled(page == 0 ? true : false);
                  row.components[1].setDisabled(page == maxPage ? true : false);
                  await i
                    .update({ embeds: [embed], components: [row] })
                    .catch((err) => {});
                } else if (i.customId == "next") {
                  page++;
                  embed.setDescription(
                    guilds
                      .slice(page * 10, page * 10 + 10)
                      .map(
                        (g) =>
                          `> **${g.name}** \`(${g.id})\` - \`${g.memberCount}\` 名のメンバー`
                      )
                      .join("\n")
                  );
                  row.components[0].setDisabled(page == 0 ? true : false);
                  row.components[1].setDisabled(page == maxPage ? true : false);
                  await i
                    .update({ embeds: [embed], components: [row] })
                    .catch((err) => {});
                }
              });

              collector.on("end", async () => {
                row.components[0].setDisabled(true);
                row.components[1].setDisabled(true);
                await msg
                  .edit({ embeds: [embed], components: [row] })
                  .catch((err) => {});
              });
            }
            return;
          }
          case "data_control_form": {
            let variable_name =
              interaction.fields.getTextInputValue("variable_name");
            let variable_value =
              interaction.fields.getTextInputValue("variable_value");
            let how_to =
              interaction.fields.getTextInputValue("how_to_variable");

            if (how_to == "追加") {
              if (variable_value == "false" || variable_value == "true") {
                console.log("Boolean");
                variable_value = variable_value == "true";
              } else if (!variable_value) {
                console.log("no data");
                variable_value = "";
              } else {
                console.log("other data");
              }

              let new_data = { [variable_name]: variable_value };
              let all_guild_id = [];

              await profileModel.find({}).then(async (all_data) => {
                for (let data of all_data) {
                  all_guild_id.push(data._id);
                }

                for (let guild_id of all_guild_id) {
                  let doc = await profileModel.findOneAndUpdate(
                    { _id: guild_id },
                    new_data,
                    { new: true }
                  );

                  console.log(`updated to: ${doc}`);
                }

                return interaction.reply("done");
              });
            } else if (how_to == "削除") {
              let all_guild_id = [];

              await profileModel.find({}).then(async (all_data) => {
                for (let data of all_data) {
                  all_guild_id.push(data._id);
                }

                for (let guild_id of all_guild_id) {
                  await profileModel.findOne({ _id: guild_id }).then((data) => {
                    data[variable_name] = undefined;

                    data.save().then(() => {
                      console.log(`updated!`);
                    });
                  });
                }

                return interaction.reply("done");
              });
            } else {
              await interaction.reply(
                "❌ how_toに予期せぬ値が入力されました。再度お試しください。"
              );
            }
            return;
          }
        }
      }
    }
  } catch (err) {
    const errorNotification = require("../errorNotification.js");
    errorNotification(client, interaction, err);
  }
};
