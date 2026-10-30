// The v2 stage: a dark room with no walls. The MacBook (v1's rig, v2's
// timeline) floats over a glossy floor; a warm key light and a coloured rim
// light that follows the chapter colour; slow dust; and Ken's real work
// hanging in the fog as cards that drift round the laptop as you scroll.

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { MacbookLighting } from 'rigged-macbook-3d';
import { Rig } from '../Intro/MacScene.jsx';
import { SceneBoundary } from '../Intro/shared.jsx';
import { BEATS, POSES, ease, ramp, roomColor } from './timeline.js';

const INK = '#07070a';

const WORK = [
  { src: '/assets/hero/momentum.jpg', aspect: 0.57 },
  { src: '/assets/hero/fluid.jpg', aspect: 1 },
  { src: '/assets/hero/lebron.jpg', aspect: 1.6 },
  { src: '/assets/hero/truearte.jpg', aspect: 1 },
  { src: '/assets/hero/covid.jpg', aspect: 1 },
  { src: '/assets/hero/marriott.jpg', aspect: 0.8 },
  { src: '/assets/hero/stepsetgo.jpg', aspect: 1 },
  { src: '/assets/hero/orbie.jpg', aspect: 1.33 },
];

/* Hand-placed so every chapter angle frames two or three cards. */
const SLOTS = [
  [-4.2, 1.6, -4.4, 0.5],
  [4.2, 3.4, -4.4, -0.4],
  [-6.2, 1.2, 2.4, 1.1],
  [5.6, 1.4, 2.8, -1.0],
  [-1.6, 3.2, -6.2, 0.2],
  [2.8, 0.9, 5.6, -2.6],
  [-5.2, 3.6, 5.2, 2.2],
  [6.4, 2.8, -1.2, -1.5],
];

function WorkCard({ src, aspect, slot, index, still }) {
  const tex = useLoader(THREE.TextureLoader, src);
  tex.colorSpace = THREE.SRGBColorSpace;
  const ref = useRef(null);
  const mat = useRef(null);
  const world = useMemo(() => new THREE.Vector3(), []);
  const [x, y, z, rot] = slot;
  const h = 1.25;
  const w = h * aspect;
  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    if (!ref.current) return;
    ref.current.position.y = still ? y : y + Math.sin(t * 0.5 + index * 1.7) * 0.12;
    // Always face the camera (never show a mirrored back), with a slight
    // per-card tilt so they don't read as flat stickers.
    ref.current.quaternion.copy(camera.quaternion);
    ref.current.rotateZ(Math.sin(t * 0.3 + index) * 0.03 + rot * 0.04);
    // Fade out as a card nears the lens, so none ever fills the frame or
    // covers the copy; fully visible from ~7.5 units away.
    ref.current.getWorldPosition(world);
    const d = world.distanceTo(camera.position);
    const k = Math.min(1, Math.max(0, (d - 5) / 2.5));
    if (mat.current) mat.current.opacity = 0.9 * k * k;
    ref.current.visible = k > 0.01;
  });
  return (
    <mesh ref={ref} position={[x, y, z]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial ref={mat} map={tex} toneMapped={false} transparent opacity={0.9} depthWrite={false} />
    </mesh>
  );
}

/** Cards ring the laptop and turn slowly; scroll turns them further. */
function Gallery({ progressRef, still }) {
  const group = useRef(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const p = progressRef.current;
    // Idle drift only when motion is welcome; scroll still turns the ring.
    group.current.rotation.y = (still ? 0 : clock.elapsedTime * 0.02) + p * 1.4;
    // Cards clear out of the way before the camera dives into the screen.
    const clear = ease(ramp(p, BEATS.lid[0], BEATS.dive[0]));
    group.current.scale.setScalar(1 + clear * 0.8);
    group.current.visible = clear < 1;
  });
  return (
    <group ref={group}>
      {WORK.map((w, i) => (
        <WorkCard key={w.src} {...w} slot={SLOTS[i]} index={i} still={still} />
      ))}
    </group>
  );
}

function Dust({ count = 700, still }) {
  const ref = useRef(null);
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      a[i * 3] = (Math.random() - 0.5) * 22;
      a[i * 3 + 1] = Math.random() * 9 - 0.5;
      a[i * 3 + 2] = (Math.random() - 0.5) * 22;
    }
    return a;
  }, [count]);
  useFrame((_, dt) => {
    if (still) return;
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.012;
    ref.current.position.y = Math.sin(performance.now() * 0.00008) * 0.3;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#cfd6ff" transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/** Rim + fill lights and fog tint follow the chapter colour. */
function Lights({ progressRef }) {
  const rim = useRef(null);
  const under = useRef(null);
  const tint = useMemo(() => new THREE.Color(), []);
  useFrame(({ scene }) => {
    const p = progressRef.current;
    roomColor(p, tint);
    if (rim.current) rim.current.color.copy(tint);
    if (under.current) under.current.color.copy(tint);
    if (scene.fog) scene.fog.color.set(INK).lerp(tint, 0.06);
  });
  return (
    <>
      <ambientLight intensity={0.18} />
      {/* Warm "desk lamp" key from above-front. */}
      <spotLight position={[3.5, 7, 4]} angle={0.5} penumbra={0.9} intensity={60} color="#ffd9a8" distance={25} decay={1.6} />
      {/* Coloured rim from behind: the Dogstudio light. */}
      <spotLight ref={rim} position={[-4, 4, -6]} angle={0.7} penumbra={1} intensity={120} distance={30} decay={1.5} />
      <pointLight ref={under} position={[0, -0.6, 1.5]} intensity={6} distance={6} />
    </>
  );
}

export default function World({ progressRef, screenOnRef, swayRef, onReady, active = true, reduced = false }) {
  return (
    <Canvas
      camera={{ fov: 30, near: 0.05, far: 80, position: [0, 3, 12] }}
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'never'}
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
      <Dust still={reduced} />
      {/* A work image that fails to load drops the gallery, not the whole scene. */}
      <SceneBoundary>
        <Suspense fallback={null}>
          <Gallery progressRef={progressRef} still={reduced} />
        </Suspense>
      </SceneBoundary>
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
