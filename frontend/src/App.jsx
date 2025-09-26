import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Environment, PointerLockControls, Caustics } from "@react-three/drei";
import { EffectComposer, GodRays, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const URL = "/models/pool.glb";
const FLOOR_NAME = "__POOL_INTERIOR_FLOOR__";
const WATER_NAME = "__POOL_SURFACE__";

/** WASD + Shift + Space */
function useKeys() {
  const keys = useRef({
    w: false, a: false, s: false, d: false, shift: false, " ": false
  });
  useEffect(() => {
    const down = (e) => {
      const k = e.key.length === 1 ? e.key : e.key.toLowerCase();
      if (k in keys.current) keys.current[k] = true;
    };
    const up = (e) => {
      const k = e.key.length === 1 ? e.key : e.key.toLowerCase();
      if (k in keys.current) keys.current[k] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);
  return keys;
}

/** GLTF 내부 바닥 y 추정 */
function findInteriorFloorY(root, approxTopY, center) {
  const ray = new THREE.Raycaster();
  ray.set(new THREE.Vector3(center.x, approxTopY + 2, center.z), new THREE.Vector3(0, -1, 0));
  const hits = ray.intersectObjects(root.children, true);
  for (const h of hits) {
    if (h.face && h.face.normal && h.face.normal.y > 0.8) return h.point.y;
  }
  return center.y - 0.5;
}

function Scene() {
  const { camera, scene } = useThree();
  const keys = useKeys();

  const poolRoot = useRef(new THREE.Group());
  const poolBounds = useRef(new THREE.Box3());
  const poolCenter = useRef(new THREE.Vector3());
  const poolSize = useRef(new THREE.Vector3());

  const innerBox = useRef(new THREE.Box3());
  const bottomY = useRef(0);
  const surfaceY = useRef(0);

  const v = useRef(new THREE.Vector3()); // 수평 속도
  const vy = useRef(0);                  // 수직 속도
  const y0Ref = useRef(null);            // 중성부력 기준
  const tmp = new THREE.Vector3();

  // 헤드밥(위아래 바운스) 상태
  const bobPhase = useRef(0);
  const prevBob = useRef(0);
  const spaceCooldown = useRef(0);       // Space 점프 쿨다운(초)

  const sun = useRef();
  const dlight = useRef();

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(URL, (gltf) => {
      poolRoot.current.add(gltf.scene);
      scene.add(poolRoot.current);

      const box = new THREE.Box3().setFromObject(poolRoot.current);
      poolBounds.current.copy(box);
      poolCenter.current.copy(box.getCenter(new THREE.Vector3()));
      poolSize.current.copy(box.getSize(new THREE.Vector3()));

      const approxTopY = box.max.y - poolSize.current.y * 0.02;
      surfaceY.current = approxTopY - poolSize.current.y * 0.006;

      const floorY = findInteriorFloorY(poolRoot.current, approxTopY, poolCenter.current);

      const width = poolSize.current.x * 0.95;
      const depth = poolSize.current.z * 0.95;

      const water = new THREE.Mesh(
        new THREE.PlaneGeometry(width, depth),
        new THREE.MeshPhysicalMaterial({
          color: 0x6ec6ff,
          transparent: true,
          opacity: 0.58,
          roughness: 0.15,
          transmission: 0.55,
          thickness: 2,
          side: THREE.DoubleSide,
        })
      );
      water.rotation.x = -Math.PI / 2;
      water.position.set(poolCenter.current.x, surfaceY.current, poolCenter.current.z);
      water.name = WATER_NAME;
      scene.add(water);

      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 0.98, depth * 0.98),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(poolCenter.current.x, floorY + 0.01, poolCenter.current.z);
      floor.receiveShadow = true;
      floor.name = FLOOR_NAME;
      scene.add(floor);

      bottomY.current = floor.position.y;

      const shrink = Math.min(poolSize.current.x, poolSize.current.z) * 0.06;
      innerBox.current.set(
        new THREE.Vector3(poolBounds.current.min.x + shrink, bottomY.current, poolBounds.current.min.z + shrink),
        new THREE.Vector3(poolBounds.current.max.x - shrink, surfaceY.current, poolBounds.current.max.z - shrink)
      );
      // 시작 카메라 위치는 현 위치를 그대로 사용
    });

    const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    sunMesh.visible = false;
    sun.current = sunMesh;
    scene.add(sunMesh);

    const dl = new THREE.DirectionalLight(0xaad6ff, 0.7);
    dl.position.set(3, 6, 1).normalize();
    dlight.current = dl;
    scene.add(dl);

    return () => {
      sun.current && scene.remove(sun.current);
      dlight.current && scene.remove(dlight.current);
    };
  }, [camera, scene]);

  const P = useMemo(
    () => ({
      airSpeed: 2.8,
      waterSpeed: 1.2,
      dragAir: 0.88,
      dragWater: 0.75,

      // 중성부력(이차 방정식): y'' = -ω^2(y-y0) - 2ζω y'
      omega: 2.2,
      zeta: 0.85,
      y0Offset: 0.85,   // 바닥에서 띄울 기준
      y0Lerp: 2.0,      // y0 수렴 속도

      // 잔물결(외력)
      rippleAmp: 0.08,
      rippleFreq: 1.1,

      // Space(킥) 파라미터
      jumpImpulse: 1.8,   // 순간 상승 속도 가산
      jumpCooldown: 0.35, // 초

      // 헤드밥(바운스)
      bobAmpWater: 0.08,
      bobAmpAir: 0.03,
      bobFreqBase: 4.0,   // 기본 주파수(이동 속도와 곱)
      wallPad: 0.25,
    }),
    []
  );

  useFrame((state, dt) => {
    if (innerBox.current.isEmpty()) return;
    const t = state.clock.elapsedTime;

    // 장면 톤
    if (camera.position.y < surfaceY.current) {
      scene.fog = new THREE.FogExp2(0x7dc9ff, 0.018);
      scene.background = new THREE.Color(0x9ed5ff);
    } else {
      scene.fog = null;
      scene.background = new THREE.Color("#0f1216");
    }

    // 이동 벡터
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).negate();

    const inWater = camera.position.y <= surfaceY.current - 0.01;
    const speed = inWater ? P.waterSpeed : P.airSpeed;

    tmp.set(0, 0, 0);
    if (keys.current.w) tmp.add(forward);
    if (keys.current.s) tmp.sub(forward);
    if (keys.current.a) tmp.sub(right);
    if (keys.current.d) tmp.add(right);
    const hasMove = tmp.lengthSq() > 0;
    if (hasMove) tmp.normalize().multiplyScalar(speed);

    v.current.x += (tmp.x - v.current.x) * 0.15;
    v.current.z += (tmp.z - v.current.z) * 0.15;
    v.current.multiplyScalar(Math.pow(inWater ? P.dragWater : P.dragAir, Math.max(1, dt * 60)));

    const boost = keys.current.shift ? 1.6 : 1;
    camera.position.x += v.current.x * dt * boost;
    camera.position.z += v.current.z * dt * boost;

    // Space 점프(물속에서만): 짧은 부력 킥
    if (spaceCooldown.current > 0) spaceCooldown.current -= dt;
    if (inWater && keys.current[" "] && spaceCooldown.current <= 0) {
      vy.current += P.jumpImpulse;
      spaceCooldown.current = P.jumpCooldown;
    }

    // 중성부력(이차 방정식)
    const targetY0 = bottomY.current + P.y0Offset;
    if (inWater) {
      if (y0Ref.current === null) y0Ref.current = camera.position.y;
      const lerpK = 1 - Math.exp(-P.y0Lerp * dt);
      y0Ref.current = THREE.MathUtils.lerp(y0Ref.current, targetY0, lerpK);

      const dy = camera.position.y - y0Ref.current;
      const acc = -(P.omega * P.omega) * dy - (2 * P.zeta * P.omega) * vy.current;
      const ripple = P.rippleAmp * Math.sin(t * P.rippleFreq);
      vy.current += (acc + ripple) * dt;
      camera.position.y += vy.current * dt;
    } else {
      y0Ref.current = null;
      vy.current *= 0.85;
    }

    // 헤드밥(이동 시 상하 바운스) — 드리프트 방지용 보정
    const horizSpeed = Math.hypot(v.current.x, v.current.z) * boost; // 현재 수평 속도
    const amp = inWater ? P.bobAmpWater : P.bobAmpAir;
    const freq = P.bobFreqBase * (0.5 + Math.min(1.5, horizSpeed)); // 속도에 비례
    bobPhase.current += freq * dt;
    const bobNow = hasMove ? amp * Math.sin(bobPhase.current) : 0;
    const bobDelta = bobNow - prevBob.current;
    camera.position.y += bobDelta;
    prevBob.current = bobNow;

    // 내부 박스 클램프
    const pad = P.wallPad;
    const minX = innerBox.current.min.x + pad;
    const maxX = innerBox.current.max.x - pad;
    const minZ = innerBox.current.min.z + pad;
    const maxZ = innerBox.current.max.z - pad;
    const minY = bottomY.current + 0.55;
    const maxY = surfaceY.current - 0.12;

    if (camera.position.y < minY) {
      camera.position.y = minY;
      vy.current = 0;
      prevBob.current = 0; // 바닥 닿았을 때 밥 오프셋 리셋
    }

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, minX, maxX);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, minZ, maxZ);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, minY, maxY);
  });

  return (
    <>
      <ambientLight intensity={0.25} color={0x88bbff} />
      <Environment preset="city" />
      <PointerLockControls />
      {!innerBox.current.isEmpty() && (
        <Caustics
          frames={120}
          causticsOnly={false}
          backside={false}
          color="#a8d7ff"
          intensity={0.6}
          ior={1.333}
          lightSource={sun}
          worldRadius={2}
          resolution={1024}
        >
          <group>
            {scene.getObjectByName(FLOOR_NAME) && (
              <primitive object={scene.getObjectByName(FLOOR_NAME)} />
            )}
          </group>
        </Caustics>
      )}
      <EffectComposer multisampling={2}>
        {sun.current && (
          <GodRays
            sun={sun}
            density={0.85}
            decay={0.95}
            weight={0.3}
            exposure={0.4}
            clampMax={1}
            samples={60}
          />
        )}
        <Bloom intensity={0.15} luminanceThreshold={0.8} luminanceSmoothing={0.2} />
      </EffectComposer>
    </>
  );
}

export default function App() {
  return (
    <Canvas style={{ width: "100vw", height: "100vh" }} camera={{ fov: 70 }}>
      <color attach="background" args={["#0f1216"]} />
      <Scene />
    </Canvas>
  );
}
