import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, useGLTF } from '@react-three/drei';
import { Macbook, MacbookLighting } from 'rigged-macbook-3d';
import * as THREE from 'three';
import { loadScreenAssets, paintWelcome } from '../WelcomeScreen/screenArt.js';
import { BEATS, ease, ramp } from './introTimeline.js';

export const MODEL_SRC = '/models/macbook-rigged.glb';
useGLTF.preload(MODEL_SRC);

const FOV = 30;
const UP = new THREE.Vector3(0, 1, 0);

/* Orbit poses around a look-at target. "hero" = closed laptop at a 3/4
   angle, parked low so its lid peeks in under the hero and it is fully in
   view after the first scroll; "front" = square-on and centred,
   the pose the screen dive starts from. */
const HERO = { yaw: 0.62, pitch: 0.36, radius: 14, target: new THREE.Vector3(0, 1.75, 0) };
const FRONT = { yaw: 0, pitch: 0.12, radius: 9.4, target: new THREE.Vector3(0, 0.3, 0) };

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Welcome-screen art as a texture, the exact pixels the DOM welcome paints.
 * `null` while loading, `false` if the art failed (the scene carries on bare).
 */
function useWelcomeTexture() {
  const [texture, setTexture] = useState(null);
  useEffect(() => {
    let cancelled = false;
    let tex = null;
    loadScreenAssets()
      .then((assets) => {
        if (cancelled) return;
        tex = new THREE.CanvasTexture(paintWelcome(document.createElement('canvas'), assets, 2));
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        setTexture(tex);
      })
      .catch(() => {
        if (!cancelled) setTexture(false);
      });
    return () => {
      cancelled = true;
      tex?.dispose();
    };
  }, []);
  return texture;
}

/* Local-space anchors of the panel, scanned once per geometry (the vertex
   data never changes; only the mesh's world matrix does). */
const localFrames = new WeakMap();
function screenLocalFrame(geometry) {
  const cached = localFrames.get(geometry);
  if (cached) return cached;
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  const box = new THREE.Box3();
  for (let i = 0; i < pos.count; i += 1) box.expandByPoint(v.fromBufferAttribute(pos, i));
  // The panel is a tilted plane in its local space: it spans X fully and runs
  // along a line in Y/Z. Find which Z the top edge sits at.
  let zAtTop = box.max.z;
  let bestY = -Infinity;
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i);
    if (v.y > bestY) {
      bestY = v.y;
      zAtTop = v.z;
    }
  }
  const c = box.getCenter(new THREE.Vector3());
  const zTop = zAtTop > c.z ? box.max.z : box.min.z;
  const frame = {
    center: c,
    right: new THREE.Vector3(box.max.x, c.y, c.z),
    up: new THREE.Vector3(c.x, box.max.y, zTop),
  };
  localFrames.set(geometry, frame);
  return frame;
}

/** Screen panel's world-space frame: centre, unit right/up/normal, half extents. */
function measureScreen(mesh, towards) {
  const local = screenLocalFrame(mesh.geometry);
  const mw = mesh.matrixWorld;
  const center = local.center.clone().applyMatrix4(mw);
  const right = local.right.clone().applyMatrix4(mw).sub(center);
  const up = local.up.clone().applyMatrix4(mw).sub(center);
  const halfW = right.length();
  const halfH = up.length();
  right.normalize();
  up.normalize();
  const normal = new THREE.Vector3().crossVectors(right, up).normalize();
  if (normal.dot(towards.clone().sub(center)) < 0) normal.negate();
  return { center, up, normal, halfW, halfH };
}

/* Map the panel's UV island to the full texture, whatever range it was
   authored in, so the welcome art fills the glass edge to edge. */
function fitTextureToUVs(texture, mesh) {
  const uv = mesh.geometry.attributes.uv;
  if (!uv) return;
  let uMin = Infinity;
  let uMax = -Infinity;
  let vMin = Infinity;
  let vMax = -Infinity;
  for (let i = 0; i < uv.count; i += 1) {
    const u = uv.getX(i);
    const w = uv.getY(i);
    uMin = Math.min(uMin, u);
    uMax = Math.max(uMax, u);
    vMin = Math.min(vMin, w);
    vMax = Math.max(vMax, w);
  }
  const ru = 1 / (uMax - uMin || 1);
  const rv = 1 / (vMax - vMin || 1);
  texture.repeat.set(ru, rv);
  texture.offset.set(-uMin * ru, -vMin * rv);
  texture.needsUpdate = true;
}

/**
 * Camera + MacBook rig. `beats` and `poses` default to the v1 intro; the v2
 * hero passes its own timeline and camera poses.
 */
export function Rig({ progressRef, screenOnRef, onReady, beats = BEATS, poses = { hero: HERO, front: FRONT }, sway }) {
  const { camera, size } = useThree();
  const group = useRef(null);
  const screenMesh = useRef(null);
  const [floorY, setFloorY] = useState(null);
  const texture = useWelcomeTexture();
  const tmp = useMemo(
    () => ({ orbit: new THREE.Vector3(), look: new THREE.Vector3(), up: new THREE.Vector3(), end: new THREE.Vector3() }),
    [],
  );

  useEffect(() => {
    if (texture && screenMesh.current) fitTextureToUVs(texture, screenMesh.current);
  }, [texture, floorY]);

  useEffect(() => {
    if (texture !== null && floorY !== null) onReady?.();
  }, [texture, floorY, onReady]);

  const handleLoad = () => {
    const g = group.current;
    if (!g) return;
    g.updateMatrixWorld(true);
    let found = null;
    g.traverse((o) => {
      if (o.name === 'Screen' && o.isMesh) found = o;
    });
    screenMesh.current = found;
    setFloorY(new THREE.Box3().setFromObject(g).min.y);
  };

  const frameDriver = () => {
    const p = progressRef.current;
    const open = ease(ramp(p, ...beats.lid));
    const bright = screenOnRef.current ? ease(ramp(p, ...beats.wake)) : 0;
    return { open, brightness: bright };
  };

  useFrame(() => {
    const p = progressRef.current;
    const aspect = size.width / size.height;
    // Keep the whole laptop in frame on narrow windows.
    const fit = Math.max(1, 1.55 / aspect);

    const o = ease(ramp(p, ...beats.orbit));
    const { hero, front } = poses;
    // Optional pointer sway (v2): a small yaw/pitch offset that fades out
    // before the dive so the handoff still lands pixel-exact.
    const sw = sway?.current;
    const swayK = sw ? 1 - ease(ramp(p, beats.dive[0] - 0.1, beats.dive[0])) : 0;
    const yaw = lerp(hero.yaw, front.yaw, o) + (sw ? sw.x * swayK : 0);
    const pitch = lerp(hero.pitch, front.pitch, o) + (sw ? sw.y * swayK : 0);
    const radius = lerp(hero.radius, front.radius, o) * fit;
    const target = tmp.look.copy(hero.target).lerp(front.target, o);
    tmp.orbit.set(
      target.x + radius * Math.sin(yaw) * Math.cos(pitch),
      target.y + radius * Math.sin(pitch),
      target.z + radius * Math.cos(yaw) * Math.cos(pitch),
    );

    const d = ease(ramp(p, ...beats.dive));
    if (d > 0 && screenMesh.current) {
      const s = measureScreen(screenMesh.current, tmp.orbit);
      // Distance at which the glass exactly COVERS the viewport, the same
      // fit the DOM welcome screen uses, so the handoff lands pixel-for-pixel.
      const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      const dist = Math.min(s.halfH / tanV, s.halfW / (tanV * aspect)) * 0.998;
      tmp.end.copy(s.center).addScaledVector(s.normal, dist);
      camera.position.copy(tmp.orbit).lerp(tmp.end, d);
      tmp.up.copy(UP).lerp(s.up, d).normalize();
      camera.up.copy(tmp.up);
      camera.lookAt(target.lerp(s.center, d));
    } else {
      camera.position.copy(tmp.orbit);
      camera.up.copy(UP);
      camera.lookAt(target);
    }
  });

  return (
    <>
      <Macbook
        ref={group}
        modelSrc={MODEL_SRC}
        screen={texture || undefined}
        autoPlay={false}
        frameDriver={frameDriver}
        onLoad={handleLoad}
      />
      {floorY !== null && (
        <ContactShadows
          position={[0, floorY - 0.005, 0]}
          opacity={0.55}
          scale={9}
          blur={2.6}
          far={1.6}
          resolution={512}
          color="#000000"
          frames={1}
        />
      )}
    </>
  );
}

export default function MacScene({ progressRef, screenOnRef, onReady, active = true }) {
  return (
    <Canvas
      camera={{ fov: FOV, near: 0.05, far: 100, position: [0, 3, 12] }}
      dpr={[1, 2]}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <MacbookLighting preset="studio-dark" />
      <Suspense fallback={null}>
        <Rig progressRef={progressRef} screenOnRef={screenOnRef} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
