'use client';

import { useEffect, useRef } from 'react';

function createSweepTexture(THREE) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  if (ctx.createConicGradient) {
    const grad = ctx.createConicGradient(0, cx, cy);
    grad.addColorStop(0, 'rgba(45,212,191,0.55)');
    grad.addColorStop(0.12, 'rgba(45,212,191,0.15)');
    grad.addColorStop(0.2, 'rgba(45,212,191,0)');
    grad.addColorStop(1, 'rgba(45,212,191,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  } else {
    const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
    radial.addColorStop(0, 'rgba(45,212,191,0.3)');
    radial.addColorStop(1, 'rgba(45,212,191,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function RadarScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;

    // Loaded dynamically so nothing three.js-related ever runs during SSR.
    import('three').then((THREE) => {
      if (cancelled) return;
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 3.4, 6.8);
      camera.lookAt(0, 0.2, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const group = new THREE.Group();
      scene.add(group);

      // Concentric radar rings
      const ringMat = new THREE.LineBasicMaterial({
        color: 0x2dd4bf,
        transparent: true,
        opacity: 0.22,
      });
      [1.4, 2.2, 3.0].forEach((r) => {
        const ringGeo = new THREE.RingGeometry(r - 0.01, r, 64);
        const edges = new THREE.EdgesGeometry(ringGeo);
        const ring = new THREE.LineSegments(edges, ringMat);
        ring.rotation.x = -Math.PI / 2;
        group.add(ring);
      });

      // Rotating sweep
      const sweepTexture = createSweepTexture(THREE);
      const sweepGeo = new THREE.CircleGeometry(3.0, 64);
      const sweepMat = new THREE.MeshBasicMaterial({
        map: sweepTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sweep = new THREE.Mesh(sweepGeo, sweepMat);
      sweep.rotation.x = -Math.PI / 2;
      group.add(sweep);

      // Scanning core
      const coreGeo = new THREE.IcosahedronGeometry(0.85, 1);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x2dd4bf,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.y = 0.9;
      group.add(core);

      // Detected clause blips
      const blipColors = [0x2dd4bf, 0xf5a623, 0xf2545b, 0x34d399, 0x2dd4bf];
      const blips = [];
      blipColors.forEach((color, i) => {
        const geo = new THREE.SphereGeometry(0.06, 12, 12);
        const mat = new THREE.MeshBasicMaterial({ color });
        const blip = new THREE.Mesh(geo, mat);
        const angle = (i / blipColors.length) * Math.PI * 2;
        const radius = 1.1 + Math.random() * 1.7;
        blip.position.set(Math.cos(angle) * radius, 0.05, Math.sin(angle) * radius);
        blip.userData = {
          angle,
          radius,
          speed: 0.15 + Math.random() * 0.15,
          phase: Math.random() * Math.PI * 2,
        };
        group.add(blip);
        blips.push(blip);
      });

      let frameId;

      function animate() {
        const t = performance.now() * 0.001;
        sweep.rotation.z = t * 0.9;
        core.rotation.y = t * 0.4;
        core.rotation.x = t * 0.15;
        group.rotation.y = Math.sin(t * 0.1) * 0.15;

        blips.forEach((blip) => {
          const { angle, radius, speed, phase } = blip.userData;
          const a = angle + t * speed;
          blip.position.x = Math.cos(a) * radius;
          blip.position.z = Math.sin(a) * radius;
          blip.position.y = 0.05 + Math.sin(t * 1.5 + phase) * 0.08;
        });

        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      }
      animate();

      function handleResize() {
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
      window.addEventListener('resize', handleResize);

      cleanup = () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', handleResize);
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        scene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
          }
        });
        renderer.dispose();
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" aria-hidden="true" />;
}
