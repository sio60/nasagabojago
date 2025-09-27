// NBL 라우터

const express = require('express');
const nblController = require('../controllers/nblController');

const router = express.Router();

// NBL 시스템 상태 확인
router.get('/status', nblController.getSystemStatus);

// NBL 훈련 라우트
router.post('/start', nblController.startTraining);
router.get('/session/:sessionId', nblController.getSession);
router.get('/history/:userId', nblController.getTrainingHistory);
router.post('/session/:sessionId/complete', nblController.completeTraining);

// NBL 훈련 단계별 라우트
router.post('/session/:sessionId/buoyancy', nblController.adjustBuoyancy);
router.post('/session/:sessionId/hatch', nblController.enterHatch);
router.post('/session/:sessionId/repair', nblController.repairWall);
router.post('/session/:sessionId/install', nblController.installEquipment);

module.exports = router;