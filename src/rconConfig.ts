// src/config.ts
import dotenv from "dotenv";

// .envファイルの読み込み
dotenv.config();

export const RCON_CONFIG = {
  host: process.env.RCON_HOST || "localhost",
  port: Number(process.env.RCON_PORT) || 25575,
  password: process.env.RCON_PASSWORD || "Fnet-923"
};
export const SERVER_CONFIG = {
    port: Number(process.env.API_PORT) || 3005
  };