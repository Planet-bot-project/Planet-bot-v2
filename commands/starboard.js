const {
  SlashCommandBuilder,
  ChannelType,
  PermissionsBitField,
  Utils,
  MessageFlags,
} = require("discord.js");

async function checkInput(sendChannel, emoji, emojiCount) {
  let err = [];

  // sendChannelのチェック
  // チャンネルが存在するか確認
  try {
    if (!sendChannel) {
      err.push("channelNotFound");
    }

    // ボットがそのチャンネルでメッセージを送信する権限があるか確認
    let myPermissions = sendChannel.permissionsFor(
      sendChannel.guild.members.me
    );
    if (!myPermissions.has(PermissionsBitField.Flags.ViewChannel)) {
      err.push("doNotHaveViewChannel");
    }
    if (!myPermissions.has(PermissionsBitField.Flags.ReadMessageHistory)) {
      err.push("doNotHaveViewMessageHistory");
    }
  } catch (err) {
    err.push("canNotGetChannelInfo");
  }
  // emojiのチェック
  try {
    const isDefaultEmoji = Utils.parseEmoji(emoji).id === null;
    const isCustomEmoji = sendChannel.guild.emojis.cache.some(
      (e) => e.toString() === emoji
    );

    if (!isDefaultEmoji && !isCustomEmoji) {
      err.push("invalidEmoji");
    }
  } catch (error) {
    err.push("invalidEmoji");
  }
  // emojiCountのチェック
  try {
    if (typeof emojiCount != "number") {
      err.push("invalidEmojiCount");
    } else {
      if (emojiCount > 1) {
        err.push("invalidEmojiCount");
      }
    }
  } catch (err) {
    err.push("invalidEmojiCount");
  }

  return err;
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
    } else if (subcommand == "off") {
    }
    await interaction.reply("test");
  },
};
