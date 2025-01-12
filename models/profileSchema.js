const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    _id: { type: String }, //サーバーID
    pomodoro: { type: Boolean }, //ポモドーロタイマーの有効/無効
    pomodoro_category: { type: String }, //ポモドーロタイマーが使用するカテゴリーID
    pomodoro_workingTime: { type: Number }, //ポモドーロタイマーの活動時間(分)
    pomodoro_breakTime: { type: Number }, //ポモドーロタイマーの休憩時間(分)
  },
  { versionKey: false }
);

const model = mongoose.model("servers", profileSchema);

module.exports = model;
