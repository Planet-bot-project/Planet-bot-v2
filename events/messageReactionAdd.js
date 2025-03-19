const profileSchema = require("../models/profileSchema");
// twemoji-parserから判定用の正規表現を取得(gオプション付き)
const twemojiRegex = require("twemoji-parser/dist/lib/regex").default;

module.exports = async (client, reaction, user) => {
  //db取得して、該当するメッセージは転送
  profileSchema
    .findById(reaction.message.guild.id)
    .then((result) => {
      // ステータス確認
      if (!result.starboard.status) return;

      // 絵文字の種類を判定
      // カスタム絵文字は絵文字名とIDが別々で来るので、変換
      if (!reaction.emoji.name.match(twemojiRegex)) {
        reaction.emoji.name = `<:${reaction.emoji.name}:${reaction.emoji.id}>`;
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

            if (
              reactionCount >=
              result.starboard.board.find(
                (board) => board.emoji == reaction.emoji.name
              ).emojiAmount
            ) {
              // メッセージを転送する
              console.log("transporting...");
            }
          })
          .catch((err) => {
            console.log(`err: ${err}`);
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
