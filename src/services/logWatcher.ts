import * as fs from "fs";
import * as path from "path";
import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";

dotenv.config();

// ✅ Notion クライアントの初期化
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const sessionsDB = process.env.NOTION_SESSIONS_DB_ID!;
const deathsDB = process.env.NOTION_DEATHS_DB_ID!;
const logFilePath = process.env.LATEST_LOG_PATH || "latest.log";

// プレイヤーステータス管理
let playerSessions: Record<string, { joinTime?: string; leaveTime?: string }> = {};

// 🔍 タイムスタンプを取得する関数
const extractTimestamp = (logLine: string): string | null => {
  const match = logLine.match(/\[(\d{2}:\d{2}:\d{2})\]/);
  return match ? match[1] : null;
};

// 📌 現在の日付を取得
const getCurrentDate = (): string => {
  const now = new Date();
  return now.toISOString().split("T")[0]; // YYYY-MM-DD 形式
};

// 📝 NotionDB にセッションデータを保存
const saveSessionToNotion = async (player: string, joinTime?: string, leaveTime?: string) => {
  try {
    const formatISO = (time: string) => {
      return `2025-02-24T${time}.000Z`; // `:00.000Z` → `.000Z` に修正
    };

    const properties: Record<string, any> = {
      Player: { title: [{ type: "text", text: { content: player } }] },
    };

    if (joinTime) {
      properties["JoinTime"] = { date: { start: formatISO(joinTime) } };
    }
    if (leaveTime) {
      properties["LeaveTime"] = { date: { start: formatISO(leaveTime) } };
    }

    await notion.pages.create({
      parent: { database_id: sessionsDB },
      properties,
    });

    console.log(`✅ Notionにセッションを保存: ${player} (${joinTime} - ${leaveTime})`);
  } catch (error) {
    console.error("❌ Notionへの保存エラー:", error);
  }
};


// 💀 NotionDB に死亡データを保存
const saveDeathToNotion = async (player: string, cause: string, timestamp: string) => {
  try {
    // `YYYY-MM-DDTHH:mm:ss.000Z` のフォーマットを生成
    const formatISO = (date: string, time: string) => `${date}T${time}.000Z`;

    const properties: Record<string, any> = {
      "Player": { title: [{ text: { content: player } }] },
      "Cause": { rich_text: [{ text: { content: cause } }] },
      "Timestamp": { date: { start: formatISO(getCurrentDate(), timestamp) } }, // 修正
    };

    await notion.pages.create({
      parent: { database_id: deathsDB },
      properties,
    });

    console.log(`💀 Notionに死亡ログを保存: ${player} (${cause} at ${timestamp})`);
  } catch (error: any) {
    console.error("❌ Notionへの保存エラー:", error.message || error);
  }
};

// 🔎 ログを解析する関数
const parseLogLine = (line: string) => {
  const timestamp = extractTimestamp(line);
  if (!timestamp) return;

  // 🎮 ログイン
  let match = line.match(/\[Server thread\/INFO\] \[net\.minecraft\.server\.MinecraftServer\]: ([\w\d_-]+) joined the game/);
  if (match) {
    const player = match[1];
    console.log(`🎮 ${player} がログイン (${timestamp})`);
    playerSessions[player] = { joinTime: timestamp };
    return;
  }

  // 🚪 ログアウト
  match = line.match(/\[Server thread\/INFO\] \[net\.minecraft\.server\.MinecraftServer\]: ([\w\d_-]+) left the game/);
  if (match) {
    const player = match[1];
    console.log(`🚪 ${player} がログアウト (${timestamp})`);
    if (playerSessions[player]?.joinTime) {
      saveSessionToNotion(player, playerSessions[player].joinTime, timestamp);
    }
    delete playerSessions[player];
    return;
  }

  // 💀 死亡ログ
  match = line.match(/\[Server thread\/INFO\] \[net\.minecraft\.server\.network\.ServerGamePacketListenerImpl\]: ([\w\d_-]+) (?:was|died|fell|burned|tried|suffocated|was slain by|was shot by) (.+)/);
  if (match) {
    const player = match[1];
    const cause = match[2];
    console.log(`💀 ${player} が死亡: ${cause} (${timestamp})`);
    saveDeathToNotion(player, cause, timestamp);
    return;
  }
};

// 🕵️‍♂️ ログファイルの変更を監視
export const watchLogFile = () => {
  console.log(`🔍 ログファイル監視開始: ${logFilePath}`);

  let lastSize = fs.existsSync(logFilePath) ? fs.statSync(logFilePath).size : 0;

  fs.watch(logFilePath, (eventType) => {
    if (eventType === "change") {
      fs.stat(logFilePath, (err, stats) => {
        if (err) {
          console.error("❌ ログファイルのサイズ取得エラー:", err);
          return;
        }

        if (stats.size > lastSize) {
          const stream = fs.createReadStream(logFilePath, { encoding: "utf8", start: lastSize });
          let buffer = "";

          stream.on("data", (chunk) => {
            buffer += chunk;
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() || ""; // 途中の行を保持

            lines.forEach(parseLogLine);
          });

          stream.on("end", () => {
            lastSize = stats.size; // 更新
          });
        }
      });
    }
  });
};
