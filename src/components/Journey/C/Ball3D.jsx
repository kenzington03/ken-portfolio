// The basketball, in 3D: a real sphere with pebbled leather and sunk
// channels (maps from the scratch texture script, made for three.js's sphere
// UVs), lit from the upper left like the drawing of Ken. The Cast places it
// and says how far it has rolled (its turn is the ground covered over its
// radius, about the axis across its travel); this draws a frame only when
// something changed. Without WebGL, the photo of the ball stands in.

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Ball3D({ apiRef, className, fallbackClassName }) {
  const canvasRef = useRef(null);
  const [flat, setFlat] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      setFlat(true);
      return undefined;
    }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    // The sphere exactly fills the canvas.
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;

    let dirty = true;
    const loader = new THREE.TextureLoader();
    const map = loader.load('/assets/hero/art/ball-color.jpg', () => {
      dirty = true;
    });
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    const normalMap = loader.load('/assets/hero/art/ball-normal.jpg', () => {
      dirty = true;
    });
    const mat = new THREE.MeshStandardMaterial({ map, normalMap, roughness: 0.8, metalness: 0 });
    mat.normalScale.set(0.85, 0.85);
    const geo = new THREE.SphereGeometry(1, 72, 54);
    const ball = new THREE.Mesh(geo, mat);
    // Turned so the channels read as a real ball's do, not head on.
    ball.rotation.set(0.35, 1.25, 0.3);
    const roll = new THREE.Group();
    roll.add(ball);
    scene.add(roll);

    // Soft daylight from the upper left, a warm bounce from the floor.
    scene.add(new THREE.HemisphereLight(0xfff4e8, 0x4a3426, 0.95));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-2.2, 2.6, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffe4c8, 0.35);
    fill.position.set(2.6, -1, 1.5);
    scene.add(fill);

    const state = { size: 80, rz: 0, rx: 0 };
    let size = 0;
    apiRef.current = {
      /** size in CSS px; rz, rx: turns (radians) about the screen's z and x. */
      set(sz, rz, rx = 0) {
        if (sz === state.size && rz === state.rz && rx === state.rx) return;
        state.size = sz;
        state.rz = rz;
        state.rx = rx;
        dirty = true;
      },
    };

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!dirty) return;
      dirty = false;
      const px = Math.max(8, Math.round(state.size));
      if (px !== size) {
        size = px;
        renderer.setSize(px, px, false);
      }
      roll.rotation.set(state.rx, 0, state.rz);
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      apiRef.current = null;
      geo.dispose();
      mat.dispose();
      map.dispose();
      normalMap.dispose();
      renderer.dispose();
    };
  }, [apiRef]);

  if (flat) return <img className={fallbackClassName} src="/assets/hero/art/ball-real.webp" alt="" draggable={false} />;
  return <canvas ref={canvasRef} className={className} />;
}
