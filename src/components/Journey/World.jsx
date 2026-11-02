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
 * moves. The whole laptop's box is projected and its highest corner taken,
 * so it holds from any side (the hinge is the top from the front, the
 * bottom from behind).
 */
function TopAnchor({ anchorRef }) {
  const { scene, camera, size } = useThree();
  const tmp = useMemo(() => ({ box: new THREE.Box3(), v: new THREE.Vector3() }), []);
  const body = useRef(null);
  useFrame(() => {
    if (!body.current) body.current = scene.getObjectByName('LidPivot')?.parent ?? null;
    if (!body.current) return;
    const { box, v } = tmp;
    box.setFromObject(body.current);
    let top = Infinity;
    for (let i = 0; i < 8; i += 1) {
      v.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera);
      top = Math.min(top, (1 - (v.y * 0.5 + 0.5)) * size.height);
    }
    anchorRef.current = top;
  });
  return null;
}

/**
 * Reports how the lid's logo sits on screen, so a DOM logo can match it
 * exactly: its centre (the middle of the lid), and where one world unit
 * along the lid's width (x) and depth (z) lands on screen there, in CSS px.
 * The lid's width (world units) sizes the logo.
 */
function LogoAnchor({ logoRef, poses }) {
  const { scene, camera, size } = useThree();
  const tmp = useMemo(() => ({ box: new THREE.Box3(), c: new THREE.Vector3(), p: new THREE.Vector3() }), []);
  const lid = useRef(null);
  useFrame(() => {
    if (!lid.current) lid.current = scene.getObjectByName('Lid') ?? null;
    if (!lid.current) return;
    const { box, c, p } = tmp;
    box.setFromObject(lid.current);
    box.getCenter(c);
    // A pose that starts close on the lid's logo (`onLid`) is aimed at it:
    // the same point this reports as the logo, followed every frame (the
    // pose only counts while the lid is shut, before it opens).
    if (poses?.hero?.onLid) {
      poses.hero.target.set(c.x, c.y, c.z + 0.0059 * (box.max.x - box.min.x));
      // A pose that ends on the laptop (`fromLid`, an offset) stays aimed
      // past the same point, so the camera pulls straight back along one
      // line and the logo glides steadily to where it rests.
      const o = poses.front?.fromLid;
      if (o) poses.front.target.set(poses.hero.target.x + o[0], poses.hero.target.y + o[1], poses.hero.target.z + o[2]);
    }
    const toScreen = (v) => [(v.x * 0.5 + 0.5) * size.width, (1 - (v.y * 0.5 + 0.5)) * size.height];
    const D = 0.05;
    const [cx, cy] = toScreen(p.copy(c).project(camera));
    const [xx, xy] = toScreen(p.copy(c).setX(c.x + D).project(camera));
    const [zx, zy] = toScreen(p.copy(c).setZ(c.z + D).project(camera));
    logoRef.current = {
      x: cx,
      y: cy,
      ex: [(xx - cx) / D, (xy - cy) / D],
      ez: [(zx - cx) / D, (zy - cy) / D],
      lidW: box.max.x - box.min.x,
    };
  });
  return null;
}

/** `poses` lets a journey choose where the camera starts (e.g. overhead). */
export default function World({ progressRef, screenOnRef, swayRef, onReady, live = false, active = true, poses = POSES, beats = BEATS, fog = true, anchorRef, logoRef }) {
  return (
    <Canvas
      camera={{ fov: 30, near: 0.05, far: 80, position: [0, 3, 12] }}
      // 1.5x is indistinguishable on a moving, softly lit laptop and costs a
      // quarter less to draw than 1.75x (it matters on integrated graphics).
      dpr={[1, 1.5]}
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
      {logoRef && <LogoAnchor logoRef={logoRef} poses={poses} />}
      <Suspense fallback={null}>
        <Rig progressRef={progressRef} screenOnRef={screenOnRef} onReady={onReady} beats={beats} poses={poses} sway={swayRef} />
      </Suspense>
    </Canvas>
  );
}
