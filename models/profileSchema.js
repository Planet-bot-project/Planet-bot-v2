const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    _id: { type: String }, //サーバーID
    sticky: {
      status: { type: Boolean }, //スティッキーメッセージの有効/無効
      channels: [
        {
          _id: { type: String },
          stickyMessage: {
            oldMessageId: { type: String }, //送信済みメッセージのメッセージID
            message: {
              title: { type: String },
              body: { type: String },
              imageURL: { type: String },
            },
          },
        },
      ], //スティッキーメッセージのチャンネルIDとメッセージ
    },
    starboard: {
      status: { type: Boolean }, //スターボードの有効/無効
      board: [
        {
          _id: { type: String }, //スターボードのチャンネルID
          emojiID: { type: String }, //スターボードの投票カウントをする絵文字の設定
          emojiAmount: { type: Number }, //スターボードに表示するスターの数
          ignoreRoleID: { type: Number }, //無視するロールのID
        },
      ],
    },
  },
  { versionKey: false }
);

const model = mongoose.model("servers", profileSchema);

module.exports = model;
