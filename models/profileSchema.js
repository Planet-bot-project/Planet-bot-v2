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
      channelID: { type: String }, //スターボードのチャンネルID
      emojiID: { type: String }, //スターボードの投票カウントをする絵文字の設定
      emojiCount: { type: Number }, //スターボードに表示するスターの数
    },
    // TODO: schemaを修正
    pomodoro: { type: Boolean }, //ポモドーロタイマーの有効/無効
    pomodoro_category: { type: String }, //ポモドーロタイマーが使用するカテゴリーID
    pomodoro_workingTime: { type: Number }, //ポモドーロタイマーの活動時間(分)
    pomodoro_breakTime: { type: Number }, //ポモドーロタイマーの休憩時間(分)
  },
  { versionKey: false }
);

const model = mongoose.model("servers", profileSchema);

module.exports = model;
