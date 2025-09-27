// src/routes/index.js
const express = require('express');
const nblRoutes = require('./nblRoutes');
// const userRoutes = require('./userRoutes');     // 나중에 추가
// const nasaRoutes = require('./nasaRoutes');     // 나중에 추가
// const cupolaRoutes = require('./cupolaRoutes'); // 나중에 추가

const router = express.Router();

// API 라우트 등록
router.use('/nbl', nblRoutes);
// router.use('/users', userRoutes);     // 나중에 추가
// router.use('/nasa', nasaRoutes);      // 나중에 추가
// router.use('/cupola', cupolaRoutes);  // 나중에 추가

// API 상태 확인
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Cat Joe NBL API 서버가 정상 작동 중입니다.',
    timestamp: new Date().toISOString(),
    endpoints: {
      nbl: '/api/nbl',
      health: '/health'
    }
  });
});

module.exports = router;

