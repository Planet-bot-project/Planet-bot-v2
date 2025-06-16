const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const fs = require("fs");
require("dotenv").config();

async function getAudioFromVoicevox(text, filename) {
  const uri = process.env.voicevox_api_uri || "http://localhost:50021";

  // audio_query
  const audioQueryRes = await fetch(
    `${uri}/audio_query?text=${encodeURI(text)}&speaker=1`,
    { method: "POST" }
  );
  const audioQuery = await audioQueryRes.json();

  // synthesis
  const voiceDataRes = await fetch(`${uri}/synthesis?speaker=1`, {
    method: "POST",
    body: JSON.stringify(audioQuery),
    headers: { accept: "audio/wav", "Content-Type": "application/json" },
  });
  const arrayBuffer = await voiceDataRes.arrayBuffer();

  // Bufferに変換して書き出す
  fs.writeFileSync(filename, Buffer.from(arrayBuffer), "binary");
}

module.exports = getAudioFromVoicevox;
