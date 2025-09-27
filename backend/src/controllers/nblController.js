// src/controllers/nblController.js
const nblService = require('../services/nblService');

class NBLController {
  // 0. 시스템 상태 확인
  async getSystemStatus(req, res) {
    try {
      res.json({
        success: true,
        message: 'NBL 시스템이 정상 작동 중입니다.',
        timestamp: new Date().toISOString(),
        system: {
          status: 'operational',
          version: '1.0.0',
          modules: {
            buoyancy: 'ready',
            hatch: 'ready',
            repair: 'ready',
            installation: 'ready'
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 1. 훈련 세션 시작
  async startTraining(req, res) {
    try {
      const { userId, trainingData } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '사용자 ID가 필요합니다.'
        });
      }
      
      const result = await nblService.startTrainingSession(userId, trainingData);
      
      res.status(201).json({
        success: true,
        message: 'NBL 훈련 세션이 시작되었습니다.',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 2. 부력 조정
  async adjustBuoyancy(req, res) {
    try {
      const { sessionId } = req.params;
      const buoyancyData = req.body;
      
      const result = await nblService.processBuoyancyAdjustment(sessionId, buoyancyData);
      
      res.json({
        success: true,
        message: '부력 조정이 처리되었습니다.',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 3. 해치 진입
  async enterHatch(req, res) {
    try {
      const { sessionId } = req.params;
      const hatchData = req.body;
      
      const result = await nblService.processHatchEntry(sessionId, hatchData);
      
      res.json({
        success: true,
        message: '해치 진입이 처리되었습니다.',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 4. 외벽 수리
  async repairWall(req, res) {
    try {
      const { sessionId } = req.params;
      const repairData = req.body;
      
      const result = await nblService.processRepair(sessionId, repairData);
      
      res.json({
        success: true,
        message: '외벽 수리가 처리되었습니다.',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 5. 장비 설치
  async installEquipment(req, res) {
    try {
      const { sessionId } = req.params;
      const installationData = req.body;
      
      const result = await nblService.processInstallation(sessionId, installationData);
      
      res.json({
        success: true,
        message: '장비 설치가 처리되었습니다.',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 6. 훈련 완료
  async completeTraining(req, res) {
    try {
      const { sessionId } = req.params;
      
      const result = await nblService.completeTraining(sessionId);
      
      res.json({
        success: true,
        message: 'NBL 훈련이 완료되었습니다.',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 7. 훈련 세션 조회
  async getSession(req, res) {
    try {
      const { sessionId } = req.params;
      
      const result = await nblService.getTrainingSession(sessionId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 8. 훈련 기록 조회
  async getTrainingHistory(req, res) {
    try {
      const { userId } = req.params;
      
      const result = await nblService.getUserTrainingHistory(userId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new NBLController();

