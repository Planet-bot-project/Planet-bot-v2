const {
  SlashCommandBuilder,
  ChannelType,
  PermissionsBitField,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
// twemoji-parserから判定用の正規表現を取得(gオプション付き)
const twemojiRegex = require("twemoji-parser/dist/lib/regex").default;
const profileSchema = require("../models/profileSchema.js");

async function checkInput(sendChannel, emoji, emojiCount) {
  let errList = [];

  // sendChannelのチェック
  // チャンネルが存在するか確認
  try {
    if (!sendChannel) {
      errList.push("channelNotFound");
    }

    // ボットがそのチャンネルでメッセージを送信する権限があるか確認
    let myPermissions = sendChannel.permissionsFor(
      sendChannel.guild.members.me
    );
    if (!myPermissions.has(PermissionsBitField.Flags.ViewChannel)) {
      errList.push("doNotHaveViewChannel");
    }
    if (!myPermissions.has(PermissionsBitField.Flags.ReadMessageHistory)) {
      errList.push("doNotHaveViewMessageHistory");
    }
  } catch (err) {
    errList.push("canNotGetChannelInfo");
  }
  // emojiのチェック
  try {
    const isDefaultEmoji = emoji.match(twemojiRegex) != null;
    const isCustomEmoji = sendChannel.guild.emojis.cache.some(
      (e) => e.toString() === emoji
    );

    if (!isDefaultEmoji && !isCustomEmoji) {
      errList.push("invalidEmoji");
    }
  } catch (err) {
    errList.push("invalidEmoji");
  }
  // emojiCountのチェック
  try {
    if (typeof emojiCount != "number") {
      errList.push("invalidEmojiCount");
    } else {
      if (emojiCount < 1) {
        errList.push("invalidEmojiCount");
      }
    }
  } catch (err) {
    errList.push("invalidEmojiCount");
  }

  return errList;
}

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
            .setName("emoji_count")
            .setDescription(
              "メッセージについた絵文字の数がこの数を超えたときに、メッセージを転送する閾値を入力してください"
            )
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("ignore_role")
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
    let subcommand = await interaction.options.getSubcommand();

    if (subcommand == "on") {
      let sendChannel = interaction.options.getChannel("send_channel");
      let emoji = interaction.options.getString("emoji");
      let emojiCount = interaction.options.getInteger("emoji_count");
      let ignoreRole = interaction.options.getRole("ignore_role");

      // 入力内容の確認
      let errList = checkInput(sendChannel, emoji, emojiCount);
      if (
        (await errList).includes("channelNotFound") ||
        (await errList).includes("doNotHaveViewChannel") ||
        (await errList).includes("doNotHaveViewMessageHistory") ||
        (await errList).includes("canNotGetChannelInfo")
      ) {
        return interaction.reply({
          content: `誤ったチャンネル情報を確認しました。正しくチャンネルを指定しており、BOTにチャンネルの閲覧権限とメッセージ履歴の閲覧権限がある事を確認してください。\n-# support info: ${(
            await errList
          ).join(" and ")}`,
          flags: MessageFlags.Ephemeral,
        });
      } else if ((await errList).includes("invalidEmoji")) {
        return interaction.reply({
          content: `誤った絵文字情報を確認しました。正しく絵文字が指定されているか確認してください。なお、他サーバーのカスタム絵文字は使用できません。\n-# support info: ${(
            await errList
          ).join(" and ")}`,
          flags: MessageFlags.Ephemeral,
        });
      } else if ((await errList).includes("invalidEmojiCount")) {
        return interaction.reply({
          content: `誤った絵文字数を確認しました。1以上の自然数を半角数字で入力してください。\n-# support info: ${(
            await errList
          ).join(" and ")}`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // 絵文字IDの取得
      let pursedEmoji;
      if (emoji.match(twemojiRegex)) {
        // unicode絵文字の場合
        pursedEmoji = emoji.match(twemojiRegex)[0];
      } else {
        // カスタム絵文字の場合
        const customEmojiRegex = /<a?:\w+:(\d+)>/;
        emojiId = emoji.match(customEmojiRegex)[1];
        pursedEmoji = interaction.guild.emojis.cache?.find(
          (GuildEmoji) => GuildEmoji.id == emojiId
        );

        if (pursedEmoji == undefined)
          return interaction.reply({
            content:
              "確認出来ない絵文字が入力されました。絵文字が正しく入力されているか確認してください。",
            flags: MessageFlags.Ephemeral,
          });
      }

      // db登録
      profileSchema
        .findById(interaction.guild.id)
        .then(async (result) => {
          result.starboard.status = true;
          result.starboard.board.push({
            _id: sendChannel.id,
            emoji: pursedEmoji,
            emojiAmount: emojiCount,
            ignoreRoleID: ignoreRole.id,
          });

          // TODO: 多重登録防止の仕組み
          await result
            .save()
            .then(async () => {
              return interaction.reply({
                content: `✅ スターボードの設定が完了しました。${pursedEmoji}が${emojiCount}個以上付いたメッセージは${sendChannel}に転送されます。`,
              });
            })
            .catch((err) => {
              const errorNotification = require("../lib/errorNotification.js");
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
                  "スターボード作成時に、DB更新エラーが発生しました。お手数ですが、BOTを一度サーバーからkickしていただき、再招待をお願い致します。",
                components: [button],
                flags: MessageFlags.Ephemeral,
              });
            });
        })
        .catch((err) => {
          const errorNotification = require("../lib/errorNotification.js");
          errorNotification(client, interaction, err);
        });
    } else if (subcommand == "off") {
      await interaction.reply("test");
    }
  },
};
