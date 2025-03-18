const profileSchema = require("../models/profileSchema");

module.exports = async (client, reaction, user) => {
  //db取得
  profileSchema
    .findById(reaction.message.guild.id)
    .then((result) => {
      //該当するメッセージは転送
      // 参考：https://qiita.com/norikmb/items/4fb47ac52ae5bc1ca14d
    })
    .catch((err) => {});
};
