const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    _id: { type: String }, //サーバーID
    sticky: {
      status: { type: Boolean }, //スティッキーメッセージの有効/無効
      channels: [
        {
          channelID: { type: String },
          stickyMessage: { type: String },
        },
      ], //スティッキーメッセージのチャンネルIDとメッセージ
    },
    starboard: {
      status: { type: Boolean }, //スターボードの有効/無効
      boardInfo: [
        {
          channelID: { type: String }, //スターボードのチャンネルID
          emojiID: { type: String }, //スターボードの投票カウントをする絵文字の設定
          emojiCount: { type: Number }, //スターボードに表示するスターの数
        },
      ],
    },
  },
  { versionKey: false }
);

const model = mongoose.model("servers", profileSchema);

module.exports = model;
