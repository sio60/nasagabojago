// src/services/nblService.js
const TrainingSession = require('../models/TrainingSession');
const User = require('../models/User');
const { 
  calculateBuoyancy, 
  calculateForce, 
  calculateTorque, 
  calculateInstallation,
  calculateOverallScore 
} = require('../utils/physicsCalculations');

class NBLService {
  // 1. 훈련 세션 시작
  async startTrainingSession(userId, trainingData = {}) {
    try {
      // 사용자 정보 조회 또는 생성
      let user = await User.findOne({ userId });
      if (!user) {
        user = new User({
          userId,
          username: trainingData.username || `User_${userId}`,
          weight: trainingData.userWeight || 70,
          height: trainingData.userHeight || 175,
          experienceLevel: trainingData.experienceLevel || 'beginner'
        });
        await user.save();
      }

      // 세션 ID 생성
      const sessionId = `nbl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 새로운 훈련 세션 생성
      const session = new TrainingSession({
        sessionId,
        userId,
        trainingType: 'nbl',
        startTime: new Date(),
        status: 'active',
        phaseData: {
          currentPhase: 1,
          phaseScores: [0, 0, 0, 0],
          phaseCompleted: [false, false, false, false]
        },
        performanceMetrics: {
          startTime: Date.now(),
          totalTime: 0,
          attempts: 0
        }
      });

      await session.save();

      return {
        sessionId,
        userId,
        message: 'NBL 훈련 세션이 시작되었습니다.',
        phaseData: session.phaseData,
        userData: {
          weight: user.weight,
          height: user.height,
          experienceLevel: user.experienceLevel
        }
      };
    } catch (error) {
      throw new Error(`훈련 세션 시작 실패: ${error.message}`);
    }
  }

  // 2. 부력 조정 처리
  async processBuoyancyAdjustment(sessionId, buoyancyData) {
    try {
      const { userWeight, suitWeight, additionalWeight, adjustmentTime } = buoyancyData;
      
      // 물리 계산
      const result = calculateBuoyancy(userWeight, suitWeight, additionalWeight);
      
      // 세션 업데이트
      const session = await TrainingSession.findOne({ sessionId });
      if (!session) {
        throw new Error('훈련 세션을 찾을 수 없습니다.');
      }
      
      session.phaseData.phaseScores[0] = result.buoyancyScore;
      session.phaseData.phaseCompleted[0] = result.buoyancyStatus === 'neutral';
      session.performanceMetrics.totalTime += adjustmentTime || 0;
      
      await session.save();
      
      return {
        success: true,
        buoyancyResult: result,
        phaseCompleted: result.buoyancyStatus === 'neutral'
      };
    } catch (error) {
      throw new Error(`부력 조정 처리 실패: ${error.message}`);
    }
  }

  // 3. 해치 진입 처리
  async processHatchEntry(sessionId, hatchData) {
    try {
      const { currentForce, holdTime, currentAttempts } = hatchData;
      
      // 힘 계산
      const result = calculateForce(currentForce);
      
      // 세션 업데이트
      const session = await TrainingSession.findOne({ sessionId });
      if (!session) {
        throw new Error('훈련 세션을 찾을 수 없습니다.');
      }
      
      session.phaseData.phaseScores[1] = result.forceScore;
      session.phaseData.phaseCompleted[1] = result.isOptimal;
      session.performanceMetrics.attempts += currentAttempts || 1;
      
      await session.save();
      
      return {
        success: true,
        forceResult: result,
        phaseCompleted: result.isOptimal
      };
    } catch (error) {
      throw new Error(`해치 진입 처리 실패: ${error.message}`);
    }
  }

  // 4. 외벽 수리 처리
  async processRepair(sessionId, repairData) {
    try {
      const { screwTorque, completedScrews, screwCount, repairTime } = repairData;
      
      // 토크 계산
      const result = calculateTorque(screwTorque);
      
      // 진행률 계산
      const repairProgress = (completedScrews / screwCount) * 100;
      const repairScore = result.torqueScore * (repairProgress / 100);
      
      // 세션 업데이트
      const session = await TrainingSession.findOne({ sessionId });
      if (!session) {
        throw new Error('훈련 세션을 찾을 수 없습니다.');
      }
      
      session.phaseData.phaseScores[2] = Math.round(repairScore);
      session.phaseData.phaseCompleted[2] = completedScrews >= screwCount;
      session.performanceMetrics.totalTime += repairTime || 0;
      
      await session.save();
      
      return {
        success: true,
        repairResult: {
          ...result,
          repairProgress: Math.round(repairProgress),
          repairScore: Math.round(repairScore)
        },
        phaseCompleted: completedScrews >= screwCount
      };
    } catch (error) {
      throw new Error(`외벽 수리 처리 실패: ${error.message}`);
    }
  }

  // 5. 장비 설치 처리
  async processInstallation(sessionId, installationData) {
    try {
      const { positionError, angleError, stabilityTime } = installationData;
      
      // 설치 계산
      const result = calculateInstallation(positionError, angleError);
      
      // 세션 업데이트
      const session = await TrainingSession.findOne({ sessionId });
      if (!session) {
        throw new Error('훈련 세션을 찾을 수 없습니다.');
      }
      
      session.phaseData.phaseScores[3] = result.installationScore;
      session.phaseData.phaseCompleted[3] = result.isPrecise;
      
      await session.save();
      
      return {
        success: true,
        installationResult: result,
        phaseCompleted: result.isPrecise
      };
    } catch (error) {
      throw new Error(`장비 설치 처리 실패: ${error.message}`);
    }
  }

  // 6. 훈련 완료 처리
  async completeTraining(sessionId) {
    try {
      const session = await TrainingSession.findOne({ sessionId });
      if (!session) {
        throw new Error('훈련 세션을 찾을 수 없습니다.');
      }
      
      // 전체 점수 계산
      const phaseScores = {
        buoyancyScore: session.phaseData.phaseScores[0],
        forceScore: session.phaseData.phaseScores[1],
        repairScore: session.phaseData.phaseScores[2],
        installationScore: session.phaseData.phaseScores[3]
      };
      
      const overallResult = calculateOverallScore(phaseScores);
      
      // 세션 완료
      session.overallScore = overallResult.overallScore;
      session.grade = overallResult.grade;
      session.endTime = new Date();
      session.status = 'completed';
      session.performanceMetrics.totalTime = Date.now() - session.performanceMetrics.startTime;
      
      await session.save();
      
      return {
        success: true,
        overallScore: overallResult.overallScore,
        grade: overallResult.grade,
        phaseScores: session.phaseData.phaseScores,
        totalTime: session.performanceMetrics.totalTime
      };
    } catch (error) {
      throw new Error(`훈련 완료 처리 실패: ${error.message}`);
    }
  }

  // 7. 훈련 세션 조회
  async getTrainingSession(sessionId) {
    try {
      const session = await TrainingSession.findOne({ sessionId });
      if (!session) {
        throw new Error('훈련 세션을 찾을 수 없습니다.');
      }
      
      return { success: true, session };
    } catch (error) {
      throw new Error(`훈련 세션 조회 실패: ${error.message}`);
    }
  }

  // 8. 사용자 훈련 기록 조회
  async getUserTrainingHistory(userId) {
    try {
      const sessions = await TrainingSession.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10);
      
      return { success: true, sessions };
    } catch (error) {
      throw new Error(`훈련 기록 조회 실패: ${error.message}`);
    }
  }
}

module.exports = new NBLService();