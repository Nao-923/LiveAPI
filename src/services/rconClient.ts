// src/rconClient.ts
import { Rcon } from "rcon-client";
import { RCON_CONFIG } from "../config";

export class RconClient {
  private client: Rcon;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Rcon({
      host: RCON_CONFIG.host,
      port: RCON_CONFIG.port,
      password: RCON_CONFIG.password
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      console.log(`Connecting to RCON: ${RCON_CONFIG.host}:${RCON_CONFIG.port}`);
      try {
        await this.client.connect();
        this.isConnected = true;
        console.log("RCON connected!");
      } catch (error) {
        console.error("RCON connection error:", error);
      }
    }
  }

  async sendCommand(command: string): Promise<string> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
  
      // コマンドの `/` を削除
      const sanitizedCommand = command.trim().replace(/^\//, "");
  
      console.log(`Sending command: "${sanitizedCommand}"`);
  
      const response = await this.client.send(sanitizedCommand);
      console.log(`Raw RCON response: ${response}`);
  
      return String(response); // 型を string に統一
    } catch (error) {
      console.error("RCON error:", error);
      return "RCON error";
    }
  }
  
  
  

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      this.client.end();
      this.isConnected = false;
      console.log("RCON connection closed.");
    }
  }
}
