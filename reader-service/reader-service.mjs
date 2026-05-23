import express from "express";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { searchAddressBySubDistrict } from "thai-address-universal";

const PORT = Number(process.env.THAI_ID_CARD_READER_PORT || 32123);
const HOST = "127.0.0.1";
const WORKER_PATH = fileURLToPath(new URL("./thaiIdCardReaderWorker.cjs", import.meta.url));

const DEFAULT_ALLOWED_ORIGINS = [
  "https://mini-his.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

const allowedOrigins = (process.env.THAI_ID_CARD_ALLOWED_ORIGINS || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const allAllowedOrigins = Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...allowedOrigins]));

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  return allAllowedOrigins.includes(origin);
};

const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  if (typeof origin === "string" && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const THAI_ADMIN_PREFIXES = /^(ตำบล|ต\.|แขวง|อำเภอ|อ\.|เขต|จังหวัด|จ\.)/;

const cleanText = (value) =>
  (value || "").replace(/#/g, " ").replace(/\s+/g, " ").trim();

const normalizeAddressToken = (value) =>
  cleanText(value).replace(THAI_ADMIN_PREFIXES, "").trim();

const normalizeBirthDate = (value) => {
  const cleaned = cleanText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  if (/^\d{8}$/.test(cleaned)) {
    let year = Number(cleaned.slice(0, 4));
    if (year > 2400) year -= 543;
    return `${year.toString().padStart(4, "0")}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  }

  return "";
};

const mapGender = (value) => {
  const normalized = cleanText(value).toLowerCase();
  if (["male", "m", "1", "ชาย"].includes(normalized)) return "male";
  if (["female", "f", "2", "หญิง"].includes(normalized)) return "female";
  return "";
};

const extractAddressPart = (address, pattern) => {
  const match = address.match(pattern);
  return match?.[1] ? normalizeAddressToken(match[1]) : undefined;
};

const parseThaiIdCardAddress = async (rawAddress) => {
  const address = cleanText(rawAddress);
  if (!address) return {};

  const subDistrict = extractAddressPart(address, /(?:ตำบล|ต\.|แขวง)\s*([^\s]+)/);
  const district = extractAddressPart(address, /(?:อำเภอ|อ\.|เขต)\s*([^\s]+)/);
  const province = extractAddressPart(address, /(?:จังหวัด|จ\.)\s*([^\s]+)/);
  const subDistrictIndex = address.search(/(?:ตำบล|ต\.|แขวง)/);
  const addressLine1 = cleanText(subDistrictIndex >= 0 ? address.slice(0, subDistrictIndex) : address);

  let officialAddress = {};
  if (subDistrict) {
    try {
      const results = await searchAddressBySubDistrict(subDistrict);
      const exactMatches = results.filter((item) => {
        const itemSubDistrict = normalizeAddressToken(item.sub_district);
        const itemDistrict = normalizeAddressToken(item.district);
        const itemProvince = normalizeAddressToken(item.province);

        return (
          itemSubDistrict === subDistrict &&
          (!district || itemDistrict === district) &&
          (!province || itemProvince === province)
        );
      });

      if (exactMatches.length === 1) {
        const match = exactMatches[0];
        officialAddress = {
          subDistrict: match.sub_district,
          district: match.district,
          province: match.province,
          postalCode: String(match.postal_code || "")
        };
      }
    } catch (error) {
      console.error("Error matching Thai ID card address:", error);
    }
  }

  return {
    addressLine1,
    subDistrict: officialAddress.subDistrict || subDistrict,
    district: officialAddress.district || district,
    province: officialAddress.province || province,
    postalCode: officialAddress.postalCode || ""
  };
};

const normalizeThaiIdCardData = async (raw) => {
  const address = await parseThaiIdCardAddress(raw.address);

  return {
    citizenId: cleanText(raw.citizenID || raw.citizenId).replace(/\D/g, ""),
    title: cleanText(raw.titleTH),
    firstName: cleanText(raw.firstNameTH),
    lastName: cleanText(raw.lastNameTH),
    titleEn: cleanText(raw.titleEN),
    firstNameEn: cleanText(raw.firstNameEN),
    lastNameEn: cleanText(raw.lastNameEN),
    birthDate: normalizeBirthDate(raw.dateOfBirth || raw.birthday),
    gender: mapGender(raw.gender),
    nationality: "ไทย",
    ...address
  };
};

const readThaiIdCardFromWorker = () =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [WORKER_PATH], {
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
        resolve(JSON.parse(stdout.trim()));
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

const app = express();

app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
  setCorsHeaders(req, res);

  if (!isOriginAllowed(req.headers.origin)) {
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
    port: PORT,
    allowedOrigins: allAllowedOrigins
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
    res.status(statusCode).json({
      ok: false,
      code: workerResponse.code || "READER_ERROR",
      message: workerResponse.message || "อ่านข้อมูลจากบัตรประชาชนไม่สำเร็จ"
    });
    return;
  }

  const data = await normalizeThaiIdCardData(workerResponse.data);
  if (!data.citizenId || !data.firstName || !data.lastName || !data.birthDate) {
    res.status(422).json({
      ok: false,
      code: "INVALID_CARD",
      message: "ข้อมูลจากบัตรประชาชนไม่ครบถ้วน กรุณาลองอ่านบัตรอีกครั้ง"
    });
    return;
  }

  res.json({ ok: true, data });
});

app.listen(PORT, HOST, () => {
  console.log(`Thai ID card reader service running on http://${HOST}:${PORT}`);
  console.log(`Allowed origins: ${allAllowedOrigins.join(", ") || "(none)"}`);
});
