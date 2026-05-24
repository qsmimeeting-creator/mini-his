# Mini HIS Thai ID Card Reader Service

Version: `1.0.1`

ชุดนี้ใช้สำหรับคอมพิวเตอร์ที่ต้องอ่านบัตรประชาชนไทยให้เว็บ Mini HIS ที่เปิดจาก Vercel:

`https://mini-his.vercel.app`

## สิ่งที่ต้องมีในเครื่อง

- Windows
- Node.js
- Driver ของ smart card reader
- Windows Smart Card service เปิดใช้งานอยู่
- Visual Studio C++ Build Tools สำหรับ native dependency

## วิธีติดตั้ง

1. คัดลอกโฟลเดอร์ `reader-service` ไปไว้ในเครื่องที่ต้องอ่านบัตร
2. ดับเบิลคลิก `install.bat`
3. ดับเบิลคลิก `start.bat`
4. เปิดเว็บ `https://mini-his.vercel.app/registration`
5. กดปุ่ม `อ่านบัตรประชาชน`

## ทดสอบว่า service เปิดอยู่

เปิด browser ในเครื่องเดียวกัน:

`http://127.0.0.1:32123/api/health`

ถ้าทำงานถูกต้องจะเห็นค่า `ok: true`

หรือดับเบิลคลิก:

`check.bat`

## แก้ปัญหา EADDRINUSE / เปิดซ้ำ

ถ้าเห็นข้อความประมาณนี้:

`Error: listen EADDRINUSE: address already in use 127.0.0.1:32123`

หมายความว่า port ของ reader service ถูกใช้งานอยู่แล้ว ส่วนใหญ่เกิดจากเปิด `start.bat` หรือ `npm run reader` ซ้ำ

ให้ทำตามลำดับนี้:

1. ดับเบิลคลิก `check.bat`
2. ถ้าเห็นว่า service ทำงานอยู่แล้ว ให้ปิดหน้าต่างที่เปิดซ้ำ และกลับไปใช้งานเว็บได้เลย
3. ถ้ายังอ่านบัตรไม่ได้ ให้ดับเบิลคลิก `stop.bat`
4. เปิด `start.bat` ใหม่อีกครั้ง

ถ้า port ถูกโปรแกรมอื่นใช้งานอยู่จริง ให้เปลี่ยนค่า `THAI_ID_CARD_READER_PORT` แล้วต้อง build/ตั้งค่าเว็บให้เรียก port ใหม่ด้วย

## ตั้งค่าเพิ่มเติม

ถ้าใช้ custom domain ให้แก้ `start.bat` หรือเปิด PowerShell แล้วตั้งค่า:

```powershell
$env:THAI_ID_CARD_ALLOWED_ORIGINS="https://mini-his.vercel.app,https://your-domain.example"
npm.cmd run reader
```

ถ้าต้องเปลี่ยน port:

```powershell
$env:THAI_ID_CARD_READER_PORT="32123"
npm.cmd run reader
```

## หมายเหตุ

- service นี้ bind เฉพาะ `127.0.0.1` เพื่อให้เว็บอ่านบัตรจากเครื่องตัวเองเท่านั้น
- เครื่องอื่นใน LAN จะเรียกอ่านบัตรข้ามเครื่องไม่ได้
- ถ้าเว็บแจ้งว่าไม่พบโปรแกรมอ่านบัตร ให้ตรวจว่า `start.bat` ยังเปิดอยู่
