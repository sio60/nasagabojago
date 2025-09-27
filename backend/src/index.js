// 기본 Express 서버 설정

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

// 내부 모듈 import
const connectDB = require('./config/database');
const routes = require('./routes');
const SocketHandler = require('./websocket/socketHandler');
const errorHandler = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// 데이터베이스 연결
connectDB();

// 미들웨어 설정
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 라우트 설정
app.use('/api', routes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Cat Joe: Hidden Stars 백엔드 서버',
    version: '1.0.0',
    endpoints: {
      api: '/api',
      health: '/health',
      nbl: '/api/nbl'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// WebSocket 핸들러 초기화
new SocketHandler(io);

// 에러 핸들링
app.use(errorHandler);

// 404 핸들링 (마지막에 모든 라우트 처리)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 엔드포인트를 찾을 수 없습니다.',
    path: req.path,
    method: req.method
  });
});

// 서버 시작
server.listen(PORT, () => {
  logger.info('Cat Joe: Hidden Stars 백엔드 서버 시작!');
  logger.info(`포트: ${PORT}`);
  logger.info(`환경: ${process.env.NODE_ENV}`);
  logger.info(`API: http://localhost:${PORT}`);
  logger.info(`⚡ WebSocket: ws://localhost:${PORT}`);
});

module.exports = { app, server, io };