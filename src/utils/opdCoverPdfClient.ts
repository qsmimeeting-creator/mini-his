import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  getOpdCoverLayoutSignature,
  normalizeOpdCoverLayout,
  type OpdCoverField,
  type OpdCoverLayout
} from "./opdCoverLayout";
import type { Patient } from "../types";

const TEMPLATE_URL = "/templates/OPDtemplate.pdf";
const REGULAR_FONT_URL = "/fonts/Sarabun-Regular.ttf";
const BOLD_FONT_URL = "/fonts/Sarabun-Bold.ttf";

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

const fetchAsset = async (url: string, label: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ไม่พบไฟล์${label}`);
  }
  return response.arrayBuffer();
};

export const buildOpdCoverPdfClient = async (patient: Partial<Patient>, requestedLayout?: unknown) => {
  const [templateBytes, regularFontBytes, boldFontBytes] = await Promise.all([
    fetchAsset(TEMPLATE_URL, "template OPD"),
    fetchAsset(REGULAR_FONT_URL, "ฟอนต์ Sarabun Regular"),
    fetchAsset(BOLD_FONT_URL, "ฟอนต์ Sarabun Bold")
  ]);

  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);
  const regularFont = await pdfDoc.embedFont(regularFontBytes);
  const boldFont = await pdfDoc.embedFont(boldFontBytes);
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
  const address = safeText(patient.addressLine1);
  const addressAdministrative = safeText(formatAdministrativeAddressLine(patient));

  drawField("hn", safeText(patient.hn));
  drawField("fullName", fullName);
  drawField("age", age);
  drawField("gender", formatGender(patient.gender));
  drawField("idNumber", safeText(patient.citizenId || patient.passportNo));
  drawField("birthDate", formatThaiDate(patient.birthDate));
  drawField("occupation", "-");
  drawField("address", address);
  drawField("addressAdministrative", addressAdministrative);
  drawField("phone", safeText(patient.phone));
  drawField("underlyingDisease", noDataAsNone(patient.underlyingDisease));
  drawField("drugAllergy", noDataAsNone(patient.drugAllergy));

  return {
    bytes: await pdfDoc.save(),
    layoutSignature: getOpdCoverLayoutSignature(coverLayout)
  };
};
