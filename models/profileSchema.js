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
          emoji: { type: String }, //スターボードの投票カウントをする絵文字の設定
          emojiAmount: { type: Number }, //スターボードに表示するスターの数
        },
      ],
      transportedMessages: [{ type: String }],
    },
    pomodoro: {
      defaultWorkTime: { type: Number, default: 25 }, //デフォルトの作業時間（分）
      defaultBreakTime: { type: Number, default: 5 }, //デフォルトの休憩時間（分）
      defaultLongBreakTime: { type: Number, default: 15 }, //デフォルトの長い休憩時間（分）
      voiceNotification: { type: Boolean, default: false }, //ボイス通知の有効/無効
    }
  },
  { versionKey: false }
);

const model = mongoose.model("servers", profileSchema);

module.exports = model;
