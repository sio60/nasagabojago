// Joi 검증 스키마

const Joi = require('joi');

// 1. 부력 조정 데이터 검증
const buoyancyValidation = Joi.object({
  userWeight: Joi.number().min(30).max(200).required(),
  suitWeight: Joi.number().min(100).max(300).required(),
  additionalWeight: Joi.number().min(0).max(50).required(),
  adjustmentTime: Joi.number().min(0).max(300000).optional()
});

// 2. 해치 진입 데이터 검증
const hatchValidation = Joi.object({
  currentForce: Joi.number().min(0).max(200).required(),
  holdTime: Joi.number().min(0).max(10000).required(),
  currentAttempts: Joi.number().min(1).max(10).required()
});

// 3. 외벽 수리 데이터 검증
const repairValidation = Joi.object({
  screwTorque: Joi.number().min(0).max(50).required(),
  completedScrews: Joi.number().min(0).max(8).required(),
  screwCount: Joi.number().valid(8).required(),
  repairTime: Joi.number().min(0).max(300000).optional()
});

// 4. 장비 설치 데이터 검증
const installationValidation = Joi.object({
  positionError: Joi.number().min(0).max(100).required(),
  angleError: Joi.number().min(0).max(180).required(),
  stabilityTime: Joi.number().min(0).max(10000).required()
});

// 5. 훈련 시작 데이터 검증
const startTrainingValidation = Joi.object({
  userId: Joi.string().required(),
  trainingData: Joi.object({
    userWeight: Joi.number().min(30).max(200).required(),
    userHeight: Joi.number().min(100).max(250).required(),
    experienceLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').required()
  }).optional()
});

// 6. 추 무게 데이터 검증
const weightValidation = Joi.object({
  weightDistribution: Joi.object({
    chest: Joi.number().min(0).max(20).required(),
    belt: Joi.number().min(0).max(15).required(),
    ankles: Joi.number().min(0).max(15).required()
  }).required(),
  totalWeightsUsed: Joi.number().min(0).max(50).required()
});

// 검증 미들웨어 함수
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: '데이터 검증 실패',
        details: error.details[0].message
      });
    }
    
    next();
  };
};

// 세션 ID 검증
const validateSessionId = (req, res, next) => {
  const { sessionId } = req.params;
  
  if (!sessionId || sessionId.length < 10) {
    return res.status(400).json({
      success: false,
      message: '유효하지 않은 세션 ID입니다.'
    });
  }
  
  next();
};

// 사용자 ID 검증
const validateUserId = (req, res, next) => {
  const { userId } = req.params;
  
  if (!userId || userId.length < 5) {
    return res.status(400).json({
      success: false,
      message: '유효하지 않은 사용자 ID입니다.'
    });
  }
  
  next();
};

module.exports = {
  validate,
  validateSessionId,
  validateUserId,
  buoyancyValidation,
  hatchValidation,
  repairValidation,
  installationValidation,
  startTrainingValidation,
  weightValidation
};