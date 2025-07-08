/*
 * Pomodoroタイマーの画像を生成する関数
 * 引数の意味：
 * - mode: "work", "break", "longBreak" のいずれか
 * - nowTimeProgress: 現在の進捗(秒)
 * - workingTime: 作業時間（分）
 * - breakTime: 休憩時間（分）
 * - longBreakTime: 長休憩時間（分）
 */

async function generatePomodoroPicture(
  mode,
  nowTimeProgress,
  workingTime,
  breakTime,
  longBreakTime
) {
  // 全引数が必須
  if (
    !mode ||
    (!nowTimeProgress && nowTimeProgress != 0) ||
    !workingTime ||
    !breakTime ||
    !longBreakTime
  ) {
    console.log(
      "Error: All arguments (mode, nowTimeProgress, workingTime, breakTime, longBreakTime) are required."
    );
    return;
  }

  const { createCanvas, registerFont } = require("canvas");

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
    ctx.fillStyle = "#fff";
    registerFont("./assets/fonts/notoSansJP-bold.ttf", {
      family: "NotoSansJP",
    });
    ctx.font = "120px NotoSansJP";
    ctx.fillText("ポモドーロタイマー", canvas.width / 2, 60);

    // 円形の進捗バー
    const centerX = canvas.width / 2;
    const centerY = 500;
    const radius = 275;
    const startAngle = -Math.PI / 2;
    let progress;
    if (mode == "work") {
      progress = nowTimeProgress / (workingTime * 60);
    } else if (mode == "break") {
      progress = nowTimeProgress / (breakTime * 60);
    } else if (mode == "longBreak") {
      progress = nowTimeProgress / (longBreakTime * 60);
    }

    const endAngle = startAngle + progress * Math.PI * 2;

    // 円の背景
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 50;
    ctx.stroke();

    // 進行中の円
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 50;
    ctx.stroke();

    // 中央の時間表示
    ctx.fillStyle = "#fff";
    ctx.font = "140px NotoSansJP";
    ctx.fillText(
      `${String(Math.floor(nowTimeProgress / 60)).padStart(2, "0")}:${String(
        nowTimeProgress % 60
      ).padStart(2, "0")}`,
      centerX,
      centerY
    );

    // 下部ステータス
    ctx.font = "100px NotoSansJP";
    const whiteFont = "#fff";
    const grayFont = "#555";
    const bottomCenterY = 900;

    ctx.fillStyle = mode == "work" ? whiteFont : grayFont;
    ctx.fillText("作業時間", 300, bottomCenterY);
    ctx.fillStyle = mode == "break" ? whiteFont : grayFont;
    ctx.fillText("休憩時間", centerX, bottomCenterY);
    ctx.fillStyle = mode == "longBreak" ? whiteFont : grayFont;
    ctx.fillText("長休憩時間", 1600, bottomCenterY);

    ctx.font = "130px NotoSansJP";

    ctx.fillStyle = mode == "work" ? whiteFont : grayFont;
    ctx.fillText(`${workingTime}:00`, 300, bottomCenterY + 100);
    ctx.fillStyle = mode == "break" ? whiteFont : grayFont;
    ctx.fillText(`${breakTime}:00`, centerX, bottomCenterY + 100);
    ctx.fillStyle = mode == "longBreak" ? whiteFont : grayFont;
    ctx.fillText(`${longBreakTime}:00`, 1600, bottomCenterY + 100);

    // クレジット表記
    ctx.font = "25px NotoSansJP";
    ctx.fillStyle = "#777";
    ctx.fillText("Created by Planet-Bot-Project", canvas.width - 180, 20);

    const buffer = canvas.toBuffer("image/png");
    return buffer; // 生成した画像を返す
  } catch (error) {
    return error;
  }
  // TODO: 実装
}

module.exports = generatePomodoroPicture;
