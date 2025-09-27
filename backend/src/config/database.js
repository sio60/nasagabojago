// MongoDb 연결 설정

const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB 연결 성공: ${conn.connection.host}`);
    logger.info('MongoDB 데이터베이스 연결 성공');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    logger.error('MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

module.exports = connectDB;