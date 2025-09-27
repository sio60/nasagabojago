const nblService = require('../services/nblService');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.setupSocketEvents();
  }

  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log(`클라이언트 연결됨: ${socket.id}`);

      // 1. 훈련 세션 시작
      socket.on('start-training', async (data) => {
        try {
          const { userId, trainingData } = data;
          const result = await nblService.startTrainingSession(userId, trainingData);
          
          socket.emit('training-started', {
            success: true,
            sessionId: result.sessionId,
            message: '훈련이 시작되었습니다.'
          });
          
          // 방에 조인 (실시간 업데이트용)
          socket.join(`session-${result.sessionId}`);
        } catch (error) {
          socket.emit('error', {
            success: false,
            message: error.message
          });
        }
      });

      // 2. 부력 조정 실시간 업데이트
      socket.on('buoyancy-update', async (data) => {
        try {
          const { sessionId, buoyancyData } = data;
          const result = await nblService.processBuoyancyAdjustment(sessionId, buoyancyData);
          
          // 해당 세션의 모든 클라이언트에게 실시간 업데이트 전송
          this.io.to(`session-${sessionId}`).emit('buoyancy-result', {
            success: true,
            data: result.buoyancyResult,
            phaseCompleted: result.phaseCompleted
          });
        } catch (error) {
          socket.emit('error', {
            success: false,
            message: error.message
          });
        }
      });

      // 3. 해치 진입 실시간 업데이트
      socket.on('hatch-update', async (data) => {
        try {
          const { sessionId, hatchData } = data;
          const result = await nblService.processHatchEntry(sessionId, hatchData);
          
          this.io.to(`session-${sessionId}`).emit('hatch-result', {
            success: true,
            data: result.forceResult,
            phaseCompleted: result.phaseCompleted
          });
        } catch (error) {
          socket.emit('error', {
            success: false,
            message: error.message
          });
        }
      });

      // 4. 외벽 수리 실시간 업데이트
      socket.on('repair-update', async (data) => {
        try {
          const { sessionId, repairData } = data;
          const result = await nblService.processRepair(sessionId, repairData);
          
          this.io.to(`session-${sessionId}`).emit('repair-result', {
            success: true,
            data: result.repairResult,
            phaseCompleted: result.phaseCompleted
          });
        } catch (error) {
          socket.emit('error', {
            success: false,
            message: error.message
          });
        }
      });

      // 5. 장비 설치 실시간 업데이트
      socket.on('installation-update', async (data) => {
        try {
          const { sessionId, installationData } = data;
          const result = await nblService.processInstallation(sessionId, installationData);
          
          this.io.to(`session-${sessionId}`).emit('installation-result', {
            success: true,
            data: result.installationResult,
            phaseCompleted: result.phaseCompleted
          });
        } catch (error) {
          socket.emit('error', {
            success: false,
            message: error.message
          });
        }
      });

      // 6. 훈련 완료
      socket.on('complete-training', async (data) => {
        try {
          const { sessionId } = data;
          const result = await nblService.completeTraining(sessionId);
          
          this.io.to(`session-${sessionId}`).emit('training-completed', {
            success: true,
            data: result,
            message: '훈련이 완료되었습니다!'
          });
          
          // 방에서 나가기
          socket.leave(`session-${sessionId}`);
        } catch (error) {
          socket.emit('error', {
            success: false,
            message: error.message
          });
        }
      });

      // 7. 연결 해제
      socket.on('disconnect', () => {
        console.log(`클라이언트 연결 해제: ${socket.id}`);
      });
    });
  }

  // 전체 브로드캐스트 (관리자용)
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  // 특정 세션에만 브로드캐스트
  broadcastToSession(sessionId, event, data) {
    this.io.to(`session-${sessionId}`).emit(event, data);
  }
}

module.exports = SocketHandler;