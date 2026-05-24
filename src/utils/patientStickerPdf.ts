import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Patient } from "../types";

const MM_TO_PT = 72 / 25.4;
const STICKER_WIDTH = 70 * MM_TO_PT;
const STICKER_HEIGHT = 35 * MM_TO_PT;
const HORIZONTAL_PADDING = 8;
const VERTICAL_PADDING = 8;
const LINE_GAP = 3;
const FONT_URL = "/fonts/Sarabun-Bold.ttf";

const fitFontSize = (font: PDFFont, text: string, maxWidth: number, initialSize: number, minSize: number) => {
  let size = initialSize;
  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.5;
  }
  return size;
};

const getDisplayName = (patient: Patient) =>
  (patient.name || `${patient.title || ""} ${patient.firstName || ""} ${patient.lastName || ""}`).replace(/\s+/g, " ").trim() || "-";

const centeredX = (font: PDFFont, text: string, size: number) =>
  Math.max((STICKER_WIDTH - font.widthOfTextAtSize(text, size)) / 2, HORIZONTAL_PADDING / 2);

export const buildPatientStickerPdf = async (patient: Patient) => {
  const hnText = `HN. ${patient.hn || "-"}`;
  const nameText = getDisplayName(patient);
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontResponse = await fetch(FONT_URL);
  if (!fontResponse.ok) {
    throw new Error("ไม่พบไฟล์ฟอนต์สำหรับสร้างสติ๊กเกอร์");
  }

  const boldFont = await pdfDoc.embedFont(await fontResponse.arrayBuffer());
  const page = pdfDoc.addPage([STICKER_WIDTH, STICKER_HEIGHT]);
  const maxWidth = STICKER_WIDTH - (HORIZONTAL_PADDING * 2);
  const maxHeight = STICKER_HEIGHT - (VERTICAL_PADDING * 2);

  let hnSize = fitFontSize(boldFont, hnText, maxWidth, 22, 10);
  let nameSize = fitFontSize(boldFont, nameText, maxWidth, 18, 4);
  let totalHeight = boldFont.heightAtSize(hnSize) + LINE_GAP + boldFont.heightAtSize(nameSize);

  while (totalHeight > maxHeight && nameSize > 4) {
    nameSize -= 0.5;
    totalHeight = boldFont.heightAtSize(hnSize) + LINE_GAP + boldFont.heightAtSize(nameSize);
  }

  while (totalHeight > maxHeight && hnSize > 10) {
    hnSize -= 0.5;
    totalHeight = boldFont.heightAtSize(hnSize) + LINE_GAP + boldFont.heightAtSize(nameSize);
  }

  const blockBottom = Math.max((STICKER_HEIGHT - totalHeight) / 2, VERTICAL_PADDING / 2);
  const nameY = blockBottom;
  const hnY = nameY + boldFont.heightAtSize(nameSize) + LINE_GAP;

  page.drawText(hnText, {
    x: centeredX(boldFont, hnText, hnSize),
    y: hnY,
    size: hnSize,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  page.drawText(nameText, {
    x: centeredX(boldFont, nameText, nameSize),
    y: nameY,
    size: nameSize,
    font: boldFont,
    color: rgb(0, 0, 0)
  });

  return pdfDoc.save();
};
