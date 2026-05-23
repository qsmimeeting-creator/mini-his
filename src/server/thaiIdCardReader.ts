import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import type { ThaiIdCardRawData } from "../utils/thaiIdCard";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ThaiIdCardWorkerResponse {
  ok: boolean;
  data?: ThaiIdCardRawData;
  code?: string;
  message?: string;
}

const THAI_ID_CARD_WORKER_PATH = path.join(__dirname, "thaiIdCardReaderWorker.cjs");

export const readThaiIdCardFromWorker = () =>
  new Promise<ThaiIdCardWorkerResponse>((resolve) => {
    const child = spawn(process.execPath, [THAI_ID_CARD_WORKER_PATH], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        THAI_ID_CARD_READ_TIMEOUT_MS: process.env.THAI_ID_CARD_READ_TIMEOUT_MS || "15000"
      },
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      resolve({
        ok: false,
        code: "READER_ERROR",
        message: error.message || "ไม่สามารถเริ่มกระบวนการอ่านบัตรได้"
      });
    });

    child.on("close", () => {
      try {
        const parsed = JSON.parse(stdout.trim()) as ThaiIdCardWorkerResponse;
        resolve(parsed);
      } catch (error) {
        console.error("Thai ID card reader worker error:", stderr || error);
        resolve({
          ok: false,
          code: "READER_ERROR",
          message: "อ่านข้อมูลจากบัตรประชาชนไม่สำเร็จ"
        });
      }
    });
  });
