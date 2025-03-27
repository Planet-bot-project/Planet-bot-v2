const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const profileSchema = require("../models/profileSchema");
const messageTransport = require("../lib/messageTransport.js");
// twemoji-parserから判定用の正規表現を取得(gオプション付き)
const twemojiRegex = require("twemoji-parser/dist/lib/regex").default;

module.exports = async (client, reaction, user) => {
  // botのリアクションは無視
  if (user.bot) return;

  //db取得して、該当するメッセージは転送
  profileSchema
    .findById(reaction.message.guild.id)
    .then((result) => {
      // ステータス確認
      if (!result.starboard.status) return;
      // 既に送信済みか確認
      if (result.starboard.transportedMessages.includes(reaction.message?.id))
        return;

      // 絵文字の種類を判定
      // カスタム絵文字は絵文字名とIDが別々で来るので、変換
      if (!reaction.emoji.name.match(twemojiRegex)) {
        reaction.emoji.name = reaction.emoji.animated
          ? `<a:${reaction.emoji.name}:${reaction.emoji.id}>`
          : `<:${reaction.emoji.name}:${reaction.emoji.id}>`;
      }

      // 該当する絵文字か判定
      let emojis = result.starboard.board.map((board) => board.emoji);
      if (emojis.includes(reaction.emoji.name)) {
        // 該当する絵文字の場合、絵文字数を確認する
        reaction.message
          .fetch()
          .then(async (message) => {
            const reactionCount = message.reactions.cache.get(
              // カスタム絵文字の場合は絵文字ID、unicode絵文字の場合はその絵文字を検索する必要があるのでこの記法
              reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name
            ).count;

            let boardInfo = result.starboard.board.find(
              (board) => board.emoji == reaction.emoji.name
            );
            if (reactionCount >= boardInfo.emojiAmount) {
              // メッセージを転送する
              await messageTransport(client, message, boardInfo._id);

              // 転送したメッセージIDを保存
              result.starboard.transportedMessages.push(message.id);
              result.save().catch((err) => {
                console.log(err);
              });
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    })
    .catch((err) => {
      console.log(err);

      let button = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("再招待はこちらから")
          .setStyle(ButtonStyle.Link)
          .setURL(
            "https://discord.com/api/oauth2/authorize?client_id=949289830481821776&permissions=8&scope=bot%20applications.commands"
          )
      );
      return reaction.message.reply({
        content:
          "メッセージリアクション受信時に、DB取得エラーが発生しました。お手数ですが、BOTを一度サーバーからkickしていただき、再招待をお願い致します。",
        components: [button],
        flags: MessageFlags.Ephemeral,
      });
    });
};
