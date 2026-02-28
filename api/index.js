const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { initDb, getDb } = require('../src/db');
const recordsRouter = require('../src/routes/records');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/records', recordsRouter);

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('只能上传图片文件'));
  }
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ code: 400, message: '请选择图片文件' });
    }
    const supabase = getDb();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `${uniqueSuffix}${ext}`;
    const filePath = filename;
    const { error: uploadError } = await supabase
      .storage
      .from(bucket)
      .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });
    if (uploadError) throw uploadError;
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    res.json({
      code: 200,
      message: '上传成功',
      data: { filename: publicUrlData.publicUrl }
    });
  } catch (error) {
    res.json({ code: 500, message: '上传失败' });
  }
});

let initialized = false;
module.exports = async (req, res) => {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
  return app(req, res);
};
