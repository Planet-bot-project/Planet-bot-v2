async function generatePomodoroPicture(
  mode,
  level,
  workingTime,
  breakTime,
  longBreakTime
) {
  const { createCanvas } = require("canvas");
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext("2d");

  // 背景
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // テキストの共通設定
  const baseFont = "70px sans-serif";
  const boldFont = "bold 80px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "white";

  // モードに応じた太字設定
  const workFont = mode == "work" ? boldFont : baseFont;
  const breakFont = mode == "break" ? boldFont : baseFont;
  const longBreakFont = mode == "longBreak" ? boldFont : baseFont;

  // 上部テキスト描画
    ctx.font = workFont;
  ctx.fillText(`作業時間：${workingTime}分`, canvas.width * 0.15, 150);
  ctx.font = breakFont;
  ctx.fillText(`休憩時間：${breakTime}分`, canvas.width * 0.45, 150);
  ctx.font = longBreakFont;
  ctx.fillText(`長めの休憩時間：${longBreakTime}分`, canvas.width * 0.8, 150);

  // 中央の円の描画
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 + 100;
  const outerRadius = 400;
  const innerRadius = 300;
  // 黒い円の描画
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
  ctx.fillStyle = "black";
  ctx.fill();
  // 内側の白い円の描画
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
  ctx.fillStyle = "white";
  ctx.fill();
  // 内部の塗り潰し設定
  const fillAngles = {
    1: 0.25,
    2: 0.5,
    3: 0.75,
    4: 1.0,
  };
  const fillRatio = fillAngles[level] ?? 0;
  if (fillRatio > 0) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(
      centerX,
      centerY,
      innerRadius,
      -Math.PI / 2,
      -Math.PI / 2 + 2 * Math.PI * fillRatio
    );
    ctx.closePath();
    ctx.fillStyle = "#222"; // 濃い灰色で塗り
    ctx.fill();
  }

  // 中央の時間表示
  ctx.fillStyle = "white";
  ctx.font = "bold 130px sans-serif";
  ctx.fillText("00 : 00", centerX, centerY + 30);

  const buffer = canvas.toBuffer("image/png");
  const fs = require("fs");
  fs.writeFileSync("pomodoro.png", buffer);
  console.log("Pomodoro picture generated: pomodoro.png");
  // TODO: 微調整と実装
}

module.exports = generatePomodoroPicture;
