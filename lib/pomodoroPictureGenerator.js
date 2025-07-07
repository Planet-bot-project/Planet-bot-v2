async function generatePomodoroPicture(
  mode,
  level,
  workingTime,
  breakTime,
  longBreakTime
) {
  const { createCanvas } = require("canvas");
  const fs = require("fs");

  // タイマー設定
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext("2d");

  // 背景
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // フォントの共通設定
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // タイトル
  ctx.fillStyle = "#ccc";
  ctx.font = "120px sans-serif";
  ctx.fillText("POMODORO TIMER", canvas.width / 2, 60);

  // 円形の進捗バー（例として70%進行）
  const centerX = canvas.width / 2;
  const centerY = 500;
  const radius = 275;
  const progress = 0.7;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + progress * Math.PI * 2;

  // 円の背景
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 50;
  ctx.stroke();

  // 進行中の円
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 50;
  ctx.stroke();

  // 中央の時間表示
  ctx.fillStyle = "#fff";
  ctx.font = "120px sans-serif";
  ctx.fillText("14:53", centerX, centerY);

  // 下部ステータス
  ctx.font = "100px sans-serif";
  ctx.fillStyle = "#aaa";
  const bottomCenterY = 900;

  ctx.fillText("WORK", 300, bottomCenterY);
  ctx.fillText("BREAK", centerX, bottomCenterY);
  ctx.fillText("LONG BREAK", 1600, bottomCenterY);

  ctx.font = "130px sans-serif";
  ctx.fillStyle = "#eee";

  ctx.fillText("25:00", 300, bottomCenterY + 100);
  ctx.fillText("5:00", centerX, bottomCenterY + 100);
  ctx.fillText("15:00", 1600, bottomCenterY + 100);

  const buffer = canvas.toBuffer("image/png");
  const fs = require("fs");
  fs.writeFileSync("pomodoro.png", buffer);
  console.log("Pomodoro picture generated: pomodoro.png");
  // TODO: 引数の使用と、実装
}

module.exports = generatePomodoroPicture;
