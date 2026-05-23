import express from "express";
import { normalizeThaiIdCardData } from "./src/utils/thaiIdCard";
import { readThaiIdCardFromWorker } from "./src/server/thaiIdCardReader";
import type { ThaiIdCardReadResponse } from "./src/types";

const PORT = Number(process.env.THAI_ID_CARD_READER_PORT || 32123);
const HOST = "127.0.0.1";
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

const allowedOrigins = (process.env.THAI_ID_CARD_ALLOWED_ORIGINS || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const allAllowedOrigins = [...DEFAULT_ALLOWED_ORIGINS, ...allowedOrigins];

const isOriginAllowed = (origin?: string) => {
  if (!origin) return true;
  return allAllowedOrigins.includes(origin);
};

const setCorsHeaders = (req: express.Request, res: express.Response) => {
  const origin = req.headers.origin;
  if (typeof origin === "string" && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const app = express();

app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
  setCorsHeaders(req, res);

  if (!isOriginAllowed(req.headers.origin as string | undefined)) {
    res.status(403).json({
      ok: false,
      code: "FORBIDDEN_ORIGIN",
      message: "ไม่อนุญาตให้เว็บไซต์นี้เรียกใช้งานโปรแกรมอ่านบัตร"
    });
    return;
  }

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "thai-id-card-reader",
    host: HOST,
    port: PORT
  });
});

app.post("/api/thai-id-card/read", async (_req, res) => {
  const workerResponse = await readThaiIdCardFromWorker();
  if (!workerResponse.ok || !workerResponse.data) {
    const statusCode = workerResponse.code === "READ_TIMEOUT"
      ? 408
      : workerResponse.code === "NO_READER"
        ? 503
        : 500;
    const response: ThaiIdCardReadResponse = {
      ok: false,
      code: workerResponse.code || "READER_ERROR",
      message: workerResponse.message || "อ่านข้อมูลจากบัตรประชาชนไม่สำเร็จ"
    };
    res.status(statusCode).json(response);
    return;
  }

  const data = await normalizeThaiIdCardData(workerResponse.data);
  if (!data.citizenId || !data.firstName || !data.lastName || !data.birthDate) {
    const response: ThaiIdCardReadResponse = {
      ok: false,
      code: "INVALID_CARD",
      message: "ข้อมูลจากบัตรประชาชนไม่ครบถ้วน กรุณาลองอ่านบัตรอีกครั้ง"
    };
    res.status(422).json(response);
    return;
  }

  const response: ThaiIdCardReadResponse = { ok: true, data };
  res.json(response);
});

app.listen(PORT, HOST, () => {
  console.log(`Thai ID card reader service running on http://${HOST}:${PORT}`);
  console.log(`Allowed origins: ${allAllowedOrigins.join(", ") || "(none)"}`);
});
