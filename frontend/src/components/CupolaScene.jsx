import React, { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stars, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

function CupolaModel() {
  const { scene } = useGLTF("/cupola.glb");
  scene.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return <primitive object={scene} scale={2} />;
}


function CupolaInteriorSoftGlow() {
  return (
    <group>
      <ambientLight intensity={0.15} color="#ffffff" />

      <Environment preset="studio" background={false} intensity={0.25}>
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#aecdff"
          scale={[1.6, 0.5, 1]}
          position={[0, 1.0, 0]}
          rotation={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#cfe0ff"
          scale={[1.2, 0.35, 1]}
          position={[0.9, 0.7, 0]}
          rotation={[0, -Math.PI / 6, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#cfe0ff"
          scale={[1.2, 0.35, 1]}
          position={[-0.9, 0.7, 0]}
          rotation={[0, Math.PI / 6, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#cfe0ff"
          scale={[1.2, 0.35, 1]}
          position={[0, 0.7, 0.9]}
          rotation={[0, Math.PI / 2 - Math.PI / 6, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#cfe0ff"
          scale={[1.2, 0.35, 1]}
          position={[0, 0.7, -0.9]}
          rotation={[0, -Math.PI / 2 + Math.PI / 6, 0]}
        />
      </Environment>

      <pointLight position={[0, 0.8, 0]} intensity={3} distance={3.5} decay={2} color="#ffffff" />
    </group>
  );
}

function Earth() {
  const ref = useRef();
  const { scene } = useGLTF("/earthlike.glb");
  const position = useMemo(() => new THREE.Vector3(0, 1, 0).multiplyScalar(300), []);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += 0.01 * delta;
  });
  scene.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return <primitive ref={ref} object={scene} position={position} scale={100} />;
}

export default function CupolaScene() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 60 }}
        onCreated={({ gl }) => {
          gl.setClearColor("#000000", 1);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.NoToneMapping; 
          gl.physicallyCorrectLights = true;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Stars radius={400} depth={80} count={10000} factor={10} saturation={0} fade speed={6} />

        <ambientLight intensity={0.6} color="#ffffff" />
        <hemisphereLight args={["#ffffff", "#666699", 0.6]} />
        <directionalLight position={[30, 40, 20]} intensity={2.2} color="#fffbe6" castShadow />
        <pointLight position={[-12, -4, -8]} intensity={10} distance={100} decay={2} color="#88bbff" />

        <Suspense fallback={null}>
          <CupolaModel />
          <CupolaInteriorSoftGlow />
          <Earth />
        </Suspense>

        <OrbitControls />
      </Canvas>
    </div>
  );
}
