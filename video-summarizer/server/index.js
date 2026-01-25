const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const transcribeRoutes = require('./routes/transcribe');

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 임시 폴더 생성
const tempDir = process.env.TEMP_DIR || './temp';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 라우트 설정
app.use('/api', transcribeRoutes);

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '영상 요약 서버가 실행 중입니다.' });
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);
  res.status(500).json({
    success: false,
    error: '서버 오류가 발생했습니다.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🎬 영상 요약 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📍 헬스 체크: http://localhost:${PORT}/health`);
});

module.exports = app;
