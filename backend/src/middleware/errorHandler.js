// 에러 핸들링 미들웨어

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 로그 출력
  console.error(err);

  // MongoDB 중복 키 에러
  if (err.code === 11000) {
    const message = '중복된 데이터입니다.';
    error = { message, statusCode: 400 };
  }

  // MongoDB 유효성 검사 에러
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT 에러
  if (err.name === 'JsonWebTokenError') {
    const message = '유효하지 않은 토큰입니다.';
    error = { message, statusCode: 401 };
  }

  // JWT 만료 에러
  if (err.name === 'TokenExpiredError') {
    const message = '토큰이 만료되었습니다.';
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || '서버 에러가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;