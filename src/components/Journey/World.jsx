// The v5 stage. Same MacBook rig as every intro; what changed is the light.
// Ken's Mac is Space Grey, so it must read Space Grey in every chapter: the
// key light is neutral, the chapter colour lives in the DOM room glow behind
// the canvas, and only a faint rim picks up a little of it for depth.

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MacbookLighting } from 'rigged-macbook-3d';
import { Rig } from '../Intro/MacScene.jsx';
import { BEATS, POSES, roomColor } from '../Intro3/timeline.js';

const INK = '#07070a';
const NEUTRAL = new THREE.Color('#dfe3ea');
const RIM_TINT = 0.18; // how much chapter colour the rim borrows (0..1)

function Lights({ progressRef }) {
  const rim = useRef(null);
  const tint = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    roomColor(progressRef.current, tint);
    if (rim.current) rim.current.color.copy(NEUTRAL).lerp(tint, RIM_TINT);
  });
  return (
    <>
      <ambientLight intensity={0.22} />
      {/* Soft fill from above so the lid reads Space Grey, not black, from overhead. */}
      <hemisphereLight args={['#e9edf3', '#1a1c20', 1.1]} />
      <spotLight position={[3.5, 7, 4]} angle={0.5} penumbra={0.9} intensity={52} color="#f2f4f8" distance={25} decay={1.6} />
      <spotLight ref={rim} position={[-4, 4, -6]} angle={0.7} penumbra={1} intensity={34} distance={30} decay={1.5} />
    </>
  );
}

/**
 * Reports where the laptop's top edge is on screen (CSS px from the top of
 * the viewport) so DOM text can keep an even gap above it while the camera
 * moves. The lid's hinge runs along the laptop's back edge, which is its
 * visual top from overhead and from the front, so that point is projected.
 */
function TopAnchor({ anchorRef }) {
  const { scene, camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  const hinge = useRef(null);
  useFrame(() => {
    if (!hinge.current) hinge.current = scene.getObjectByName('LidPivot') ?? null;
    if (!hinge.current) return;
    hinge.current.getWorldPosition(v).project(camera);
    anchorRef.current = (1 - (v.y * 0.5 + 0.5)) * size.height;
  });
  return null;
}

/**
 * Reports where the lid's middle (the Apple logo) is on screen, and how wide
 * the lid is there, in CSS px, so a DOM element can land exactly on the logo.
 */
function LogoAnchor({ logoRef }) {
  const { scene, camera, size } = useThree();
  const tmp = useMemo(() => ({ box: new THREE.Box3(), c: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3() }), []);
  const lid = useRef(null);
  useFrame(() => {
    if (!lid.current) lid.current = scene.getObjectByName('Lid') ?? null;
    if (!lid.current) return;
    const { box, c, a, b } = tmp;
    box.setFromObject(lid.current);
    box.getCenter(c);
    a.set(box.min.x, c.y, c.z).project(camera);
    b.set(box.max.x, c.y, c.z).project(camera);
    c.project(camera);
    logoRef.current = {
      x: (c.x * 0.5 + 0.5) * size.width,
      y: (1 - (c.y * 0.5 + 0.5)) * size.height,
      lidW: Math.abs(b.x - a.x) * 0.5 * size.width,
    };
  });
  return null;
}

/** `poses` lets a journey choose where the camera starts (e.g. overhead). */
export default function World({ progressRef, screenOnRef, swayRef, onReady, live = false, active = true, poses = POSES, fog = true, anchorRef, logoRef }) {
  return (
    <Canvas
      camera={{ fov: 30, near: 0.05, far: 80, position: [0, 3, 12] }}
      dpr={[1, 1.75]}
      frameloop={active && live ? 'always' : 'demand'}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
        if (fog) scene.fog = new THREE.Fog(INK, 12, 30);
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Lights progressRef={progressRef} />
      <MacbookLighting preset="studio-dark" />
      {anchorRef && <TopAnchor anchorRef={anchorRef} />}
      {logoRef && <LogoAnchor logoRef={logoRef} />}
      <Suspense fallback={null}>
        <Rig progressRef={progressRef} screenOnRef={screenOnRef} onReady={onReady} beats={BEATS} poses={poses} sway={swayRef} />
      </Suspense>
    </Canvas>
  );
}
