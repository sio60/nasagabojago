// 로깅 시스템

const fs = require('fs');
const path = require('path');

// logs 폴더가 없으면 생성
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[INFO] ${timestamp} - ${message}`;
    console.log(logMessage);
    
    if (data) {
      console.log('Data:', data);
    }
    
    // 파일에 로그 저장
    fs.appendFileSync(path.join(logsDir, 'app.log'), logMessage + '\n');
  },

  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[ERROR] ${timestamp} - ${message}`;
    console.error(logMessage);
    
    if (error) {
      console.error('Error:', error);
    }
    
    // 에러 로그 파일에 저장
    fs.appendFileSync(path.join(logsDir, 'error.log'), logMessage + '\n');
  },

  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[WARN] ${timestamp} - ${message}`;
    console.warn(logMessage);
    
    if (data) {
      console.warn('Data:', data);
    }
    
    fs.appendFileSync(path.join(logsDir, 'app.log'), logMessage + '\n');
  }
};

module.exports = { logger };