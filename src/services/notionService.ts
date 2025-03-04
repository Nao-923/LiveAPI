import { Client } from "@notionhq/client";
import { QueryDatabaseResponse, PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import * as dotenv from "dotenv";

dotenv.config();

// ✅ Notion クライアントの初期化
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const sessionsDB = process.env.NOTION_SESSIONS_DB_ID!;
const deathsDB = process.env.NOTION_DEATHS_DB_ID!;

/**
 * 🎮 セッションデータを取得 (プレイヤー参加履歴)
 */
export const getUserLogs = async () => {
  try {
    const response = (await notion.databases.query({ database_id: sessionsDB })) as QueryDatabaseResponse;

    return response.results.map((page) => {
      if (!("properties" in page)) return null; // propertiesが存在しない場合はスキップ
      const properties = (page as PageObjectResponse).properties;

      return {
        id: page.id,
        player:
          properties?.Player?.type === "title" && properties.Player.title.length > 0
            ? properties.Player.title[0].plain_text || "Unknown"
            : "Unknown",
        joinTime: properties?.JoinTime?.type === "date" ? properties.JoinTime.date?.start || null : null,
        leaveTime: properties?.LeaveTime?.type === "date" ? properties.LeaveTime.date?.start || null : null,
      };
    }).filter(Boolean); // `null` を除去
  } catch (error) {
    console.error("❌ Notionのセッションデータ取得エラー:", error);
    return [];
  }
};

/**
 * 💀 死亡ログデータを取得
 */
export const getDeathLogs = async () => {
  try {
    const response = (await notion.databases.query({ database_id: deathsDB })) as QueryDatabaseResponse;

    return response.results.map((page) => {
      if (!("properties" in page)) return null; // propertiesが存在しない場合はスキップ
      const properties = (page as PageObjectResponse).properties;

      return {
        id: page.id,
        player:
          properties?.Player?.type === "title" && properties.Player.title.length > 0
            ? properties.Player.title[0].plain_text || "Unknown"
            : "Unknown",
        cause:
          properties?.Cause?.type === "rich_text" && properties.Cause.rich_text.length > 0
            ? properties.Cause.rich_text[0].plain_text || "Unknown"
            : "Unknown",
        timestamp: properties?.Timestamp?.type === "date" ? properties.Timestamp.date?.start || null : null,
      };
    }).filter(Boolean); // `null` を除去
  } catch (error) {
    console.error("❌ Notionの死亡データ取得エラー:", error);
    return [];
  }
};
