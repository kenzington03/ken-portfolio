// The v3 stage: the same dark room and MacBook rig as v2, minus the floating
// work cards and dust. Ken's face and words own the hero now; the work lives
// inside the Mac. Lights and fog still follow the chapter colour.

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MacbookLighting } from 'rigged-macbook-3d';
import { Rig } from '../Intro/MacScene.jsx';
import { BEATS, POSES, roomColor } from './timeline.js';

const INK = '#07070a';

function Lights({ progressRef }) {
  const rim = useRef(null);
  const under = useRef(null);
  const tint = useMemo(() => new THREE.Color(), []);
  useFrame(({ scene }) => {
    roomColor(progressRef.current, tint);
    if (rim.current) rim.current.color.copy(tint);
    if (under.current) under.current.color.copy(tint);
    if (scene.fog) scene.fog.color.set(INK).lerp(tint, 0.06);
  });
  return (
    <>
      <ambientLight intensity={0.18} />
      <spotLight position={[3.5, 7, 4]} angle={0.5} penumbra={0.9} intensity={60} color="#ffd9a8" distance={25} decay={1.6} />
      <spotLight ref={rim} position={[-4, 4, -6]} angle={0.7} penumbra={1} intensity={120} distance={30} decay={1.5} />
      <pointLight ref={under} position={[0, -0.6, 1.5]} intensity={6} distance={6} />
    </>
  );
}

/** `live` = the visitor is near the Mac section; otherwise render on demand only. */
export default function World({ progressRef, screenOnRef, swayRef, onReady, live = false, active = true }) {
  return (
    <Canvas
      camera={{ fov: 30, near: 0.05, far: 80, position: [0, 3, 12] }}
      dpr={[1, 1.75]}
      frameloop={active && live ? 'always' : 'demand'}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        scene.fog = new THREE.Fog(INK, 10, 26);
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Lights progressRef={progressRef} />
      <MacbookLighting preset="studio-dark" />
      <Suspense fallback={null}>
        <Rig
          progressRef={progressRef}
          screenOnRef={screenOnRef}
          onReady={onReady}
          beats={BEATS}
          poses={POSES}
          sway={swayRef}
        />
      </Suspense>
    </Canvas>
  );
}
