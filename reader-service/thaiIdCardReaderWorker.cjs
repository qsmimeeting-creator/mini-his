console.log = (...args) => console.error(...args);

const finish = (payload, exitCode) => {
  process.stdout.write(JSON.stringify(payload));
  process.exit(exitCode);
};

const classifyError = (error) => {
  const message = String(error && (error.message || error) ? error.message || error : 'Unable to read Thai ID card');
  const lower = message.toLowerCase();

  if (lower.includes('cannot find module') || lower.includes('visual studio') || lower.includes('node-gyp')) {
    return {
      code: 'READER_ERROR',
      message: 'ไม่สามารถเริ่มเครื่องอ่านบัตรได้ กรุณาติดตั้ง PC/SC driver และ Visual Studio C++ Build Tools'
    };
  }

  if (lower.includes('pcsc') || lower.includes('scard') || lower.includes('service')) {
    return {
      code: 'NO_READER',
      message: 'ไม่พบเครื่องอ่านบัตร หรือบริการ Smart Card ยังไม่พร้อมใช้งาน'
    };
  }

  return {
    code: 'READER_ERROR',
    message: 'อ่านข้อมูลจากบัตรประชาชนไม่สำเร็จ'
  };
};

process.on('uncaughtException', (error) => {
  const classified = classifyError(error);
  finish({ ok: false, ...classified }, 1);
});

process.on('unhandledRejection', (error) => {
  const classified = classifyError(error);
  finish({ ok: false, ...classified }, 1);
});

try {
  const ThaiIDCardReaderModule = require('thai-id-card-reader');
  const ThaiIDCardReader = ThaiIDCardReaderModule.default || ThaiIDCardReaderModule;
  const reader = new ThaiIDCardReader();
  const timeoutMs = Number(process.env.THAI_ID_CARD_READ_TIMEOUT_MS || 15000);
  let completed = false;

  const done = (payload, exitCode) => {
    if (completed) return;
    completed = true;
    finish(payload, exitCode);
  };

  reader.setInsertCardDelay(Number(process.env.THAI_ID_CARD_INSERT_DELAY_MS || 1000));
  reader.setReadTimeout(Number(process.env.THAI_ID_CARD_APDU_TIMEOUT_MS || 5000));

  reader.onReadComplete((data) => {
    const { photoAsBase64Uri, cardIssuer, issueDate, expireDate, ...safeData } = data || {};
    done({ ok: true, data: safeData }, 0);
  });

  reader.onReadError((error) => {
    const classified = classifyError(error);
    done({ ok: false, ...classified }, 1);
  });

  reader.init();

  setTimeout(() => {
    done({
      ok: false,
      code: 'READ_TIMEOUT',
      message: 'ไม่พบข้อมูลจากบัตร กรุณาตรวจสอบเครื่องอ่านและเสียบบัตรประชาชน'
    }, 1);
  }, timeoutMs);
} catch (error) {
  const classified = classifyError(error);
  finish({ ok: false, ...classified }, 1);
}
