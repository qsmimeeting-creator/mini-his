import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  getOpdCoverLayoutSignature,
  normalizeOpdCoverLayout,
  type OpdCoverField,
  type OpdCoverLayout
} from "../utils/opdCoverLayout";
import type { Patient } from "../types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

const OPD_TEMPLATE_CANDIDATES = [
  path.join(process.cwd(), "public", "templates", "OPDtemplate.pdf"),
  path.join(process.cwd(), "dist", "templates", "OPDtemplate.pdf"),
  path.join(PROJECT_ROOT, "public", "templates", "OPDtemplate.pdf")
];

const THAI_REGULAR_FONT_CANDIDATES = [
  path.join(process.cwd(), "public", "fonts", "Sarabun-Regular.ttf"),
  path.join(process.cwd(), "dist", "fonts", "Sarabun-Regular.ttf"),
  path.join(PROJECT_ROOT, "public", "fonts", "Sarabun-Regular.ttf"),
  "C:\\Windows\\Fonts\\tahoma.ttf",
  "C:\\Windows\\Fonts\\THSarabunNew.ttf"
];

const THAI_BOLD_FONT_CANDIDATES = [
  path.join(process.cwd(), "public", "fonts", "Sarabun-Bold.ttf"),
  path.join(process.cwd(), "dist", "fonts", "Sarabun-Bold.ttf"),
  path.join(PROJECT_ROOT, "public", "fonts", "Sarabun-Bold.ttf"),
  "C:\\Windows\\Fonts\\tahomabd.ttf",
  "C:\\Windows\\Fonts\\THSarabunNew Bold.ttf"
];

const firstExistingPath = (candidates: string[]) =>
  candidates.find(candidate => existsSync(candidate));

const safeText = (value?: string | number | null) => {
  const text = String(value ?? "").trim();
  return text || "-";
};

const noDataAsNone = (value?: string | number | null) => {
  const text = safeText(value);
  return text === "-" ? "ไม่มี" : text;
};

const formatThaiDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
};

const calculateAge = (birthDate?: string) => {
  if (!birthDate) return "-";
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return "-";

  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months--;
  if (months < 0) {
    years--;
    months += 12;
  }

  return `${Math.max(years, 0)} ปี ${Math.max(months, 0)} เดือน`;
};

const formatGender = (gender?: string) => {
  if (gender === "male") return "ชาย";
  if (gender === "female") return "หญิง";
  return safeText(gender);
};

const formatAddressLine = (patient: Partial<Patient>) => {
  const addressLine = safeText(patient.addressLine1);
  return addressLine === "-" ? "" : addressLine;
};

const formatAdministrativeAddressLine = (patient: Partial<Patient>) =>
  [
    patient.subDistrict ? `แขวง/ตำบล ${patient.subDistrict}` : "",
    patient.district ? `เขต/อำเภอ ${patient.district}` : "",
    patient.province ? `จังหวัด ${patient.province}` : "",
    patient.postalCode ? `รหัสไปรษณีย์ ${patient.postalCode}` : ""
  ].filter(Boolean).join(" ");

const wrapText = (text: string, font: PDFFont, size: number, maxWidth: number) => {
  const lines: string[] = [];

  text.split(/\r?\n/).forEach(paragraph => {
    const words = paragraph.split(/[^\S\r\n]+/).filter(Boolean);
    let current = "";

    words.forEach(word => {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        return;
      }
      if (current) lines.push(current);
      current = word;
    });

    if (current) lines.push(current);
  });

  return lines.length ? lines : ["-"];
};

export const buildOpdCoverPdf = async (patient: Partial<Patient>, requestedLayout?: unknown) => {
  const templatePath = firstExistingPath(OPD_TEMPLATE_CANDIDATES);
  const regularFontPath = firstExistingPath(THAI_REGULAR_FONT_CANDIDATES);
  const boldFontPath = firstExistingPath(THAI_BOLD_FONT_CANDIDATES) || regularFontPath;

  if (!templatePath) {
    throw new Error("OPD template file not found");
  }
  if (!regularFontPath || !boldFontPath) {
    throw new Error("Thai font file not found");
  }

  const pdfDoc = await PDFDocument.load(await readFile(templatePath));
  pdfDoc.registerFontkit(fontkit);
  const regularFont = await pdfDoc.embedFont(await readFile(regularFontPath));
  const boldFont = await pdfDoc.embedFont(await readFile(boldFontPath));
  const page = pdfDoc.getPage(0);
  const color = rgb(0, 0, 0);
  const coverLayout: OpdCoverLayout = normalizeOpdCoverLayout(requestedLayout);

  const drawField = (field: OpdCoverField, text: string) => {
    const layout = coverLayout[field];
    const font = layout.fontWeight === "regular" ? regularFont : boldFont;
    const lineHeight = layout.lineHeight ?? layout.size + 4;
    const lines = wrapText(safeText(text), font, layout.size, layout.maxWidth);
    lines.forEach((line, index) => {
      page.drawText(line, {
        x: layout.x,
        y: layout.y - (index * lineHeight),
        size: layout.size,
        font,
        color
      });
    });
  };

  const fullName = safeText(patient.name || `${patient.title || ""} ${patient.firstName || ""} ${patient.lastName || ""}`);
  const age = patient.age ? `${patient.age} ปี` : calculateAge(patient.birthDate);
  const idNumber = safeText(patient.citizenId || patient.passportNo);
  const address = safeText(formatAddressLine(patient));
  const addressAdministrative = safeText(formatAdministrativeAddressLine(patient));

  drawField("hn", safeText(patient.hn));
  drawField("fullName", fullName);
  drawField("age", age);
  drawField("gender", formatGender(patient.gender));
  drawField("idNumber", idNumber);
  drawField("birthDate", formatThaiDate(patient.birthDate));
  drawField("occupation", "-");
  drawField("address", address);
  drawField("addressAdministrative", addressAdministrative);
  drawField("phone", safeText(patient.phone));
  drawField("underlyingDisease", noDataAsNone(patient.underlyingDisease));
  drawField("drugAllergy", noDataAsNone(patient.drugAllergy));

  return {
    bytes: await pdfDoc.save(),
    layout: coverLayout,
    layoutSignature: getOpdCoverLayoutSignature(coverLayout)
  };
};
