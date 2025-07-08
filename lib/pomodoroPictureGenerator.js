/*
 * Pomodoroタイマーの画像を生成する関数
 * 引数の意味：
 * - mode: 現在のモード（"work", "break", "longBreak"）
 * - progress: 進行状況（0.0から1.0の範囲）
 * - workingTime: 作業時間（分）
 * - breakTime: 休憩時間（分）
 * - longBreakTime: 長い休憩時間（分）
 * - TimeProgress: 現在の時間進行状況（例："25:00"）
 */

async function generatePomodoroPicture(
  mode,
  progress,
  workingTime,
  breakTime,
  longBreakTime,
  TimeProgress
) {
  // 全引数が必須
  if (!mode || !progress || !workingTime || !breakTime || !longBreakTime) {
    console.log(
      "Error: All arguments (mode, progress, workingTime, breakTime, longBreakTime) are required."
    );
    return;
  }

  const { createCanvas, registerFont } = require("canvas");
  const fs = require("fs");

  try {
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
    registerFont("./assets/fonts/notoSansJP.ttf", { family: "NotoSansJP" });
    registerFont("./assets/fonts/notoSansJP-bold.ttf", {
      family: "NotoSansJP-bold",
    });
    ctx.font = "120px NotoSansJP-bold";
    ctx.fillText("ポモドーロタイマー", canvas.width / 2, 60);

    // 円形の進捗バー（例として70%進行）
    const centerX = canvas.width / 2;
    const centerY = 500;
    const radius = 275;
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
    ctx.font = "120px NotoSansJP";
    ctx.fillText(TimeProgress, centerX, centerY);

    // 下部ステータス
    const defaultFont = "100px NotoSansJP";
    const defaultBoldFont = "100px NotoSansJP-bold";
    ctx.fillStyle = "#aaa";
    const bottomCenterY = 900;

    ctx.font = mode == "work" ? defaultBoldFont : defaultFont;
    ctx.fillText("作業時間", 300, bottomCenterY);
    ctx.font = mode == "break" ? defaultBoldFont : defaultFont;
    ctx.fillText("休憩時間", centerX, bottomCenterY);
    ctx.font = mode == "longBreak" ? defaultBoldFont : defaultFont;
    ctx.fillText("長休憩時間", 1600, bottomCenterY);

    const defaultLargeFont = "130px NotoSansJP";
    const defaultLargeBoldFont = "130px NotoSansJP-bold";
    ctx.fillStyle = "#eee";

    ctx.font = mode == "work" ? defaultLargeBoldFont : defaultLargeFont;
    ctx.fillText(`${workingTime}:00`, 300, bottomCenterY + 100);
    ctx.font = mode == "break" ? defaultLargeBoldFont : defaultLargeFont;
    ctx.fillText(`${breakTime}:00`, centerX, bottomCenterY + 100);
    ctx.font = mode == "longBreak" ? defaultLargeBoldFont : defaultLargeFont;
    ctx.fillText(`${longBreakTime}:00`, 1600, bottomCenterY + 100);

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync("pomodoro.png", buffer);
    console.log("Pomodoro picture generated: pomodoro.png");
  } catch (error) {
    console.error("Error generating Pomodoro picture:", error);
    throw error; // エラーを再スローして呼び出し元に通知
  }
  // TODO: 実装
}

module.exports = generatePomodoroPicture;
