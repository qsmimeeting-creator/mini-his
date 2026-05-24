import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { normalizeThaiIdCardData } from "./src/utils/thaiIdCard";
import { readThaiIdCardFromWorker } from "./src/server/thaiIdCardReader";
import { buildOpdCoverPdf } from "./src/server/opdCoverPdf";
import type { Patient, ThaiIdCardReadResponse } from "./src/types";

const normalizeRemoteAddress = (address?: string) =>
  (address || "").replace(/^::ffff:/, "");

const isLocalRequest = (req: express.Request) => {
  const remoteAddress = normalizeRemoteAddress(req.socket.remoteAddress);
  return ["127.0.0.1", "::1", "localhost"].includes(remoteAddress);
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "1mb" }));

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/opd-cover/print", async (req, res) => {
    if (!isLocalRequest(req)) {
      res.status(403).json({
        ok: false,
        message: "อนุญาตให้สร้างหน้าปก OPD จากเครื่อง localhost เท่านั้น"
      });
      return;
    }

    try {
      const patient = (req.body?.patient || {}) as Partial<Patient>;
      if (!patient.hn) {
        res.status(400).json({
          ok: false,
          message: "ไม่พบข้อมูล HN สำหรับสร้างหน้าปก OPD"
        });
        return;
      }

      const layoutSource = req.body?.layout ? "request" : "default";
      const { bytes: pdfBytes, layoutSignature } = await buildOpdCoverPdf(patient, req.body?.layout);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="opd-cover-${patient.hn}.pdf"`);
      res.setHeader("X-OPD-Cover-Layout-Source", layoutSource);
      res.setHeader("X-OPD-Cover-Layout-Signature", layoutSignature);
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("OPD cover PDF error:", error);
      res.status(500).json({
        ok: false,
        message: "ไม่สามารถสร้างไฟล์หน้าปก OPD ได้"
      });
    }
  });

  app.post("/api/thai-id-card/read", async (req, res) => {
    if (!isLocalRequest(req)) {
      const response: ThaiIdCardReadResponse = {
        ok: false,
        code: "FORBIDDEN",
        message: "อนุญาตให้อ่านบัตรจากเครื่อง localhost เท่านั้น"
      };
      res.status(403).json(response);
      return;
    }

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
