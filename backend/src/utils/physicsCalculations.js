// NBL 물리 계산 유틸리티

// 1. 부력 조정 계산
const calculateBuoyancy = (userWeight, suitWeight, additionalWeight) => {
  const totalWeight = userWeight + suitWeight + additionalWeight;
  const targetWeight = 230.0; // 목표 무게 (kg)
  const buoyancyError = Math.abs(totalWeight - targetWeight);
  const buoyancyTolerance = 0.1; // 허용 오차 (kg)
  
  let buoyancyStatus;
  if (buoyancyError <= buoyancyTolerance) {
    buoyancyStatus = 'neutral';
  } else if (totalWeight > targetWeight) {
    buoyancyStatus = 'sinking';
  } else {
    buoyancyStatus = 'floating';
  }
  
  const buoyancyScore = Math.max(0, 100 - (buoyancyError * 100));
  
  return {
    totalWeight,
    buoyancyError,
    buoyancyStatus,
    buoyancyScore: Math.round(buoyancyScore)
  };
};

// 2. 해치 진입 힘 계산
const calculateForce = (currentForce, optimalForceMin = 30, optimalForceMax = 60) => {
  let forceScore = 0;
  
  if (currentForce >= optimalForceMin && currentForce <= optimalForceMax) {
    forceScore = 100;
  } else if (currentForce < optimalForceMin) {
    forceScore = Math.max(0, (currentForce / optimalForceMin) * 50);
  } else {
    forceScore = Math.max(0, 100 - ((currentForce - optimalForceMax) * 2));
  }
  
  return {
    currentForce,
    forceScore: Math.round(forceScore),
    isOptimal: currentForce >= optimalForceMin && currentForce <= optimalForceMax
  };
};

// 3. 외벽 수리 토크 계산
const calculateTorque = (screwTorque, targetTorque = 3.0, holdWindow = 1500) => {
  const torqueError = Math.abs(screwTorque - targetTorque);
  const torqueScore = Math.max(0, 100 - (torqueError * 20));
  
  return {
    screwTorque,
    torqueError,
    torqueScore: Math.round(torqueScore),
    isInRange: torqueError <= 0.5
  };
};

// 4. 장비 설치 정밀도 계산
const calculateInstallation = (positionError, angleError, positionTolerance = 10, angleTolerance = 5) => {
  const positionScore = Math.max(0, 100 - (positionError / positionTolerance) * 100);
  const angleScore = Math.max(0, 100 - (angleError / angleTolerance) * 100);
  const installationScore = (positionScore + angleScore) / 2;
  
  return {
    positionError,
    angleError,
    positionScore: Math.round(positionScore),
    angleScore: Math.round(angleScore),
    installationScore: Math.round(installationScore),
    isPrecise: positionError <= positionTolerance && angleError <= angleTolerance
  };
};

// 5. 전체 점수 계산
const calculateOverallScore = (phaseScores) => {
  const { buoyancyScore, forceScore, repairScore, installationScore } = phaseScores;
  const overallScore = (buoyancyScore + forceScore + repairScore + installationScore) / 4;
  
  let grade;
  if (overallScore >= 95) grade = 'A+';
  else if (overallScore >= 90) grade = 'A';
  else if (overallScore >= 80) grade = 'B';
  else if (overallScore >= 70) grade = 'C';
  else if (overallScore >= 60) grade = 'D';
  else grade = 'F';
  
  return {
    overallScore: Math.round(overallScore),
    grade
  };
};

module.exports = {
  calculateBuoyancy,
  calculateForce,
  calculateTorque,
  calculateInstallation,
  calculateOverallScore
};