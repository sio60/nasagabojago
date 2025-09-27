import React, { Suspense, useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  useAnimations,
  Stars,
  Environment,
  Lightformer,
  Html,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

const EARTH_TARGET_DIAMETER = 800.0;         
const EARTH_SPIN_SPEED = 0.12;              
const EARTH_ABS_POS = new THREE.Vector3(0, 500, 0); 

const EARTH_TILT_DEG = -45;
const EARTH_TILT_AXIS = "z"; 

const CUPOLA_ROT_YAW_DEG = 90;
const CUPOLA_ROT_PITCH_DEG = 0;
const CUPOLA_ROT_ROLL_DEG = 0;
const toRad = (d) => THREE.MathUtils.degToRad(d);

function LoaderOverlay() {
  const { progress, active } = useProgress();
  if (!active) return null;
  return (
    <Html center style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
      {Math.round(progress)}%
    </Html>
  );
}

function adjustCupolaMaterials(root) {
  const GLASS_HINT = /(glass|window|pane|viewport)/i;
  const tune = (m) => {
    if (!m || m.userData?._patched) return;
    m.transparent = true;
    m.opacity = 0.12;
    m.depthWrite = false;
    m.side = THREE.DoubleSide;
    m.color?.set?.("#dfe9ff");
    m.userData._patched = true;
  };
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    o.frustumCulled = false;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (GLASS_HINT.test(o.name) || mats.some((mm) => GLASS_HINT.test(mm?.name || ""))) {
      mats.forEach(tune);
      o.material = mats.length === 1 ? mats[0] : mats;
    }
  });
}

function CupolaModel({ onReady }) {
  const cupolaURL = `${import.meta.env.BASE_URL}cupola.glb`;
  const { scene } = useGLTF(cupolaURL);
  const groupRef = useRef();

  adjustCupolaMaterials(scene);

  useEffect(() => {
    if (groupRef.current) onReady?.(groupRef.current);
  }, [onReady]);

  useEffect(() => {
    const onKey = (e) => {
      if (!groupRef.current) return;
      const g = groupRef.current;
      if (e.code === "F4") g.rotation.y = (g.rotation.y + Math.PI) % (Math.PI * 2);
      if (e.code === "F1") {
        scene.traverse((o) => {
          if (!o.isMesh) return;
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          if (/(glass|window|pane|viewport)/i.test(o.name) || mats.some((mm) => /(glass|window|pane|viewport)/i.test(mm?.name || ""))) {
            o.visible = !o.visible;
          }
        });
      }
      if (e.code === "F2") g.visible = !g.visible;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scene]);

  return (
    <group
      ref={groupRef}
      rotation={[
        toRad(CUPOLA_ROT_PITCH_DEG),
        toRad(CUPOLA_ROT_YAW_DEG),
        toRad(CUPOLA_ROT_ROLL_DEG),
      ]}
    >
      <primitive object={scene} scale={2} />
    </group>
  );
}

function Earth({ position }) {
  const root = useRef();
  const earthURL = `${import.meta.env.BASE_URL}earth.glb`;
  const { scene, animations } = useGLTF(earthURL);

  const model = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  useEffect(() => {
    if (!root.current) return;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = EARTH_TARGET_DIAMETER / maxDim;
    root.current.scale.setScalar(s);
  }, [model]);

  const { actions } = useAnimations(animations, model);
  useEffect(() => {
    const list = Object.values(actions || {});
    if (list.length) {
      list.forEach((a) => a.reset().setLoop(THREE.LoopRepeat, Infinity).play());
    }
  }, [actions]);

  useFrame((_, dt) => {
    if (!actions || Object.keys(actions).length === 0) {
      if (root.current) root.current.rotation.y += EARTH_SPIN_SPEED * dt;
    }
  });

  useEffect(() => {
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;
    });
  }, [model]);

  return (
    <group ref={root} position={position.toArray()}>
      <group
        rotation={[
          EARTH_TILT_AXIS === "x" ? THREE.MathUtils.degToRad(EARTH_TILT_DEG) : 0,
          EARTH_TILT_AXIS === "y" ? THREE.MathUtils.degToRad(EARTH_TILT_DEG) : 0,
          EARTH_TILT_AXIS === "z" ? THREE.MathUtils.degToRad(EARTH_TILT_DEG) : 0,
        ]}
      >
        <primitive object={model} />
      </group>
    </group>
  );
}

export default function CupolaScene() {
  const controls = useRef();
  const [target] = useState(() => new THREE.Vector3(0, 0, 0));
  const [earthPos] = useState(() => EARTH_ABS_POS.clone());

  useEffect(() => {
    if (controls.current) {
      controls.current.target.copy(target);
      controls.current.update();
    }
  }, [target]);

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

        <Environment preset="studio" background={false} intensity={0.25}>
          <Lightformer form="rect" intensity={1.2} color="#aecdff" scale={[1.6, 0.5, 1]} position={[0, 1.0, 0]} />
          <Lightformer form="rect" intensity={0.9} color="#cfe0ff" scale={[1.2, 0.35, 1]} position={[0.9, 0.7, 0]} rotation={[0, -Math.PI / 6, 0]} />
          <Lightformer form="rect" intensity={0.9} color="#cfe0ff" scale={[1.2, 0.35, 1]} position={[-0.9, 0.7, 0]} rotation={[0, Math.PI / 6, 0]} />
          <Lightformer form="rect" intensity={0.9} color="#cfe0ff" scale={[1.2, 0.35, 1]} position={[0, 0.7, 0.9]} rotation={[0, Math.PI / 2 - Math.PI / 6, 0]} />
          <Lightformer form="rect" intensity={0.9} color="#cfe0ff" scale={[1.2, 0.35, 1]} position={[0, 0.7, -0.9]} rotation={[0, -Math.PI / 2 + Math.PI / 6, 0]} />
        </Environment>

        <Suspense fallback={<LoaderOverlay />}>
          <CupolaModel onReady={() => {}} />
          <Earth position={earthPos} />
        </Suspense>

        <OrbitControls ref={controls} />
      </Canvas>
    </div>
  );
}
