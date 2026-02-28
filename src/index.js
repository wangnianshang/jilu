const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { initDb } = require('./db');
const recordsRouter = require('./routes/records');

const app = express();
const PORT = process.env.PORT || 3001;

// 确保上传目录存在
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置Multer用于图片上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB限制
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('只能上传图片文件'));
  }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(uploadsDir));

// API路由
app.use('/api/records', recordsRouter);

// 图片上传API
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.json({ code: 400, message: '请选择图片文件' });
    }

    res.json({
      code: 200,
      message: '上传成功',
      data: { filename: req.file.filename }
    });
  } catch (error) {
    console.error('上传失败:', error);
    res.json({ code: 500, message: '上传失败' });
  }
});

// 启动服务
async function startServer() {
  await initDb();

  app.listen(PORT, '0.0.0.0', () => {
    const localIP = require('os').networkInterfaces();
    let ip = 'localhost';
    for (const name of Object.keys(localIP)) {
      for (const iface of localIP[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ip = iface.address;
          break;
        }
      }
      if (ip !== 'localhost') break;
    }
    console.log(`服务已启动: http://localhost:${PORT}`);
    console.log(`局域网访问: http://${ip}:${PORT}`);
  });
}

startServer();
