import { buildOpdCoverPdf } from "../../src/server/opdCoverPdf";
import type { Patient } from "../../src/types";

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (statusCode: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
  send: (body: unknown) => void;
};

type OpdCoverRequestBody = {
  patient?: Partial<Patient>;
  layout?: unknown;
};

const getBody = (body: unknown): OpdCoverRequestBody => {
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as OpdCoverRequestBody;
    } catch {
      return {};
    }
  }

  return body && typeof body === "object" ? body as OpdCoverRequestBody : {};
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({
      ok: false,
      message: "Method not allowed"
    });
    return;
  }

  try {
    const body = getBody(req.body);
    const patient = body.patient || {};
    if (!patient.hn) {
      res.status(400).json({
        ok: false,
        message: "ไม่พบข้อมูล HN สำหรับสร้างหน้าปก OPD"
      });
      return;
    }

    const layoutSource = body.layout ? "request" : "default";
    const { bytes: pdfBytes, layoutSignature } = await buildOpdCoverPdf(patient, body.layout);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="opd-cover-${patient.hn}.pdf"`);
    res.setHeader("X-OPD-Cover-Layout-Source", layoutSource);
    res.setHeader("X-OPD-Cover-Layout-Signature", layoutSignature);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("OPD cover PDF error:", error);
    res.status(500).json({
      ok: false,
      message: error instanceof Error
        ? `ไม่สามารถสร้างไฟล์หน้าปก OPD ได้ (${error.message})`
        : "ไม่สามารถสร้างไฟล์หน้าปก OPD ได้"
    });
  }
}
