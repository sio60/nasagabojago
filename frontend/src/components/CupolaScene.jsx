import React, { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

function StarDome({ radius = 2000 }) {
  const matRef = useRef();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDensity: { value: 0.992 }, 
      uBrightness: { value: 2.8 },  
      uTwinkle: { value: 1.0 },    
      uScale: { value: 100.0 },    
    }),
    []
  );

  useFrame((_, dt) => {
    if (matRef.current) matRef.current.uniforms.uTime.value += dt;
  });

  return (
    <mesh renderOrder={-10000}>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        side={THREE.BackSide}
        depthTest={false}
        depthWrite={false}
        transparent={false}
        uniforms={uniforms}
        vertexShader={/* glsl */`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */`
          varying vec2 vUv;
          uniform float uTime;
          uniform float uDensity;
          uniform float uBrightness;
          uniform float uTwinkle;
          uniform float uScale;

          // 해시
          float hash(vec2 p){
            p = vec2(dot(p, vec2(127.1, 311.7)),
                     dot(p, vec2(269.5, 183.3)));
            return fract(sin(p.x + p.y) * 43758.5453123);
          }

          void main() {
            // 구 표면을 그대로 UV로 쓰되 타일링
            vec2 uv = vUv * uScale;
            vec2 gv = fract(uv) - 0.5;     // 셀 내 좌표(-0.5~0.5)
            vec2 id = floor(uv);           // 셀 ID

            float n = hash(id);
            float hasStar = step(uDensity, n); // 확률로 별 배치

            // 별 형태(점광)
            // 크기를 살짝 키워서 더 잘 보이게(원래 0.25 기준을 0.30로)
            float d = length(gv);
            float star = smoothstep(0.30, 0.0, d);

            // 반짝임
            float tw = 0.5 + 0.5 * sin(uTime * (2.0 + n * 6.0) + n * 10.0);

            // 미세한 색 편차(백색에 가까운 청백)
            // 완전 흰색보다 살짝 푸른 기를 주면 더 잘 보임
            vec3 tint = mix(vec3(0.85, 0.9, 1.0), vec3(1.0), n);

            float glow = star * hasStar * (1.0 + uTwinkle * tw);
            vec3 col = tint * uBrightness * glow;

            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
}

function CupolaModel() {
  const { scene } = useGLTF("/cupola.glb");
  return <primitive object={scene} scale={2} />;
}

function Earth() {
  const ref = useRef();
  const { scene } = useGLTF("/earthlike.glb");

  const position = useMemo(() => {
    const dir = new THREE.Vector3(0, 1, 0);
    return dir.multiplyScalar(300);
  }, []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += 0.01 * delta;
  });

  return <primitive ref={ref} object={scene} position={position} scale={100} />;
}

export default function CupolaScene() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        onCreated={({ gl }) => {
          gl.setClearColor("#000000", 1);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1; 
          gl.physicallyCorrectLights = true;
        }}
      >
        <StarDome radius={2000} />

        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[0, 1, 0]} intensity={0.7} distance={15} decay={2} />
        <pointLight position={[0, -1, 0]} intensity={0.5} distance={12} decay={2} color="#aaddff" />

        <Suspense fallback={null}>
          <CupolaModel />
          <Earth />
          <Environment preset="sunset" background={false} />
        </Suspense>

        <OrbitControls />
      </Canvas>
    </div>
  );
}
