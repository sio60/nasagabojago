import React, { useEffect, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Caustics } from "@react-three/drei";
import { EffectComposer, GodRays, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const URL = "/models/pool.glb";

function fit(camera, controls, object, margin = 1.2) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z) * margin;
  const fitH = maxSize / (2 * Math.tan((Math.PI * camera.fov) / 360));
  const fitW = fitH / camera.aspect;
  const distance = Math.max(fitH, fitW);
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = distance * 100;
  camera.position.copy(center.clone().add(new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(distance)));
  camera.lookAt(center);
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
}

function Scene() {
  const { camera, scene } = useThree();
  const controls = useRef();
  const root = useRef(new THREE.Group());

  const sun = useRef();         
  const dir = useRef();        
  const waterLevelRef = useRef(0);
  const bottomRef = useRef(0);
  const centerRef = useRef(new THREE.Vector3());
  const poolSizeRef = useRef(new THREE.Vector3());

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(URL, (gltf) => {
      root.current.add(gltf.scene);
      scene.add(root.current);
      fit(camera, controls.current, root.current, 1.2);

      const box = new THREE.Box3().setFromObject(root.current);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      poolSizeRef.current.copy(size);
      centerRef.current.copy(center);

      const width = size.x * 0.95;
      const depth = size.z * 0.95;
      const topY = box.max.y - size.y * 0.02;
      const bottomY = box.min.y + size.y * 0.02;
      bottomRef.current = bottomY;

      const gap = size.y * 0.006;
      const surfaceY = topY - gap;
      waterLevelRef.current = surfaceY;

      const waterGeo = new THREE.PlaneGeometry(width, depth);
      const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x6ec6ff,
        transparent: true,
        opacity: 0.58,
        roughness: 0.15,
        transmission: 0.55,
        thickness: 2,
        side: THREE.DoubleSide
      });
      const water = new THREE.Mesh(waterGeo, waterMat);
      water.rotation.x = -Math.PI / 2;
      water.position.set(center.x, surfaceY, center.z);
      scene.add(water);

      const floorGeo = new THREE.PlaneGeometry(width * 0.98, depth * 0.98);
      const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(center.x, bottomY + 0.002, center.z); 
      floor.receiveShadow = true;
      floor.name = "caustics-floor";
      scene.add(floor);
    });

    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    sunMesh.visible = false; 
    sun.current = sunMesh;
    scene.add(sunMesh);

    const dLight = new THREE.DirectionalLight(0xaad6ff, 0.7);
    dir.current = dLight;
    dLight.position.set(3, 6, 1).normalize();
    dLight.castShadow = false;
    scene.add(dLight);

    return () => {
      scene.remove(root.current);
      root.current.clear();
      if (sun.current) scene.remove(sun.current);
      if (dir.current) scene.remove(dir.current);
    };
  }, [camera, scene]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const surface = waterLevelRef.current;
    const center = centerRef.current;
    const size = poolSizeRef.current;

    const sway = Math.sin(t * 0.3) * 0.6;
    if (sun.current) {
      sun.current.position.set(center.x - size.x * 0.3, surface + 1.5, center.z + size.z * 0.2 + sway);
    }
    if (dir.current) {
      dir.current.position.set( -1.2, 1.8, 0.8 ).normalize();
    }

    if (camera.position.y < surface) {
      scene.fog = new THREE.FogExp2(0x7dc9ff, 0.018);
      scene.background = new THREE.Color(0x9ed5ff);
    } else {
      scene.fog = null;
      scene.background = new THREE.Color("#0f1216");
    }
  });

  return (
    <>
      <ambientLight intensity={0.25} color={0x88bbff} />
      <Environment preset="city" />
      <OrbitControls ref={controls} enableDamping />

      {bottomRef.current !== 0 && (
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
            {scene.getObjectByName("caustics-floor") && (
              <primitive object={scene.getObjectByName("caustics-floor")} />
            )}
          </group>
        </Caustics>
      )}

      <EffectComposer multisampling={2}>
        {sun.current && <GodRays sun={sun} density={0.85} decay={0.95} weight={0.3} exposure={0.4} clampMax={1} samples={60} />}
        <Bloom intensity={0.15} luminanceThreshold={0.8} luminanceSmoothing={0.2} />
      </EffectComposer>
    </>
  );
}

export default function App() {
  return (
    <Canvas
      style={{ width: "100vw", height: "100vh" }}
      camera={{ position: [4, 3, 6], fov: 45 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#0f1216"]} />
      <Scene />
    </Canvas>
  );
}
