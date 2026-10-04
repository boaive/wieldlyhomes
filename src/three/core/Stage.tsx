import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type LazyExoticComponent } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  BackSide,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Vector3,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { scroll, useStage } from '../../state/stage';
import { stillCamera } from '../../lib/device';
import { clamp, damp } from '../../lib/math';
import { boundaryVeil, director, neighbours, sceneFor } from './director';
import { copyLook, makeLook, makePose, mixLook, type FrameCtx, type Look, type Pose, type SceneDef, type SceneId } from './types';

export interface SceneEntry {
  def: SceneDef;
  Component: LazyExoticComponent<ComponentType> | ComponentType;
}

const _dir = new Vector3();
const _right = new Vector3();
const _up = new Vector3();

/** Compiles a freshly mounted (still hidden) scene so its first visible frame does not hitch. */
function Warm({ target, onDone }: { target: React.RefObject<Group | null>; onDone?: () => void }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (target.current) gl.compile(target.current, camera, scene);
      onDone?.();
    }, 30);
    return () => window.clearTimeout(id);
  }, [gl, camera, scene, target, onDone]);
  return null;
}

function SceneMount({ entry, onWarm }: { entry: SceneEntry; onWarm?: () => void }) {
  const ref = useRef<Group>(null);
  const { Component, def } = entry;
  useFrame(() => {
    if (ref.current) ref.current.visible = director.scene === def.id;
  });
  return (
    <group ref={ref} visible={false}>
      <Suspense fallback={null}>
        <Component />
        <Warm target={ref} onDone={onWarm} />
      </Suspense>
    </group>
  );
}

/**
 * The stage owns everything global to the experience: which scenes are
 * mounted, the camera rig, the light rig, fog and the dip-to-dark veil.
 * Scenes only supply geometry plus a `pose` and `look` for each frame.
 */
export function Stage({ scenes, veil }: { scenes: Record<SceneId, SceneEntry>; veil: React.RefObject<HTMLDivElement | null> }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const size = useThree((s) => s.size);
  const setDpr = useThree((s) => s.setDpr);
  const tier = useStage((s) => s.tier);
  const reducedMotion = useStage((s) => s.reducedMotion);
  const reduced = reducedMotion || stillCamera;
  const markLoaded = useStage((s) => s.markLoaded);

  const [mounted, setMounted] = useState<SceneId[]>(['factory']);
  const mountedKey = useRef('factory');

  const hemi = useRef<HemisphereLight>(null);
  const key = useRef<DirectionalLight>(null);
  const fill = useRef<DirectionalLight>(null);
  const lampA = useRef<PointLight>(null);
  const lampB = useRef<PointLight>(null);
  const backdrop = useRef<Mesh>(null);

  const rig = useMemo(
    () => ({
      pose: makePose(),
      target: makePose(),
      look: makeLook(),
      targetLook: makeLook(),
      first: true,
      shiftX: 0,
      shiftY: 0,
      appliedShift: [NaN, NaN, 0, 0] as [number, number, number, number],
      pointer: { x: 0, y: 0, sx: 0, sy: 0 },
      frames: 0,
      slow: 0,
      fade: 0,
      dpr: 1,
      shadowSize: 0,
    }),
    [],
  );

  const backdropMat = useMemo(
    () => new MeshBasicMaterial({ color: '#0b1720', side: BackSide, fog: false, depthWrite: false, toneMapped: false }),
    [],
  );

  // Image-based fill light from a neutral studio room — no network fetch.
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    scene.fog = new Fog(new Color('#0b1720'), 30, 140);
    room.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        (m.material as MeshBasicMaterial).dispose();
      }
    });
    pmrem.dispose();
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);

  useEffect(() => {
    rig.dpr = gl.getPixelRatio();
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      rig.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      rig.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [gl, rig]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const chapter = scroll.chapter;
    const p = scroll.p[chapter];
    const id = sceneFor(chapter, p);
    const def = scenes[id].def;
    const aspect = size.width / size.height;
    const compact = size.width <= 700 || aspect < 1;
    const ctx: FrameCtx = { chapter, p, time: state.clock.elapsedTime, aspect, compact, mid: !compact && size.width < 1100, tier };

    director.time = ctx.time;
    director.compact = ctx.compact;

    // Keep the active scene and the scenes of the adjacent chapters mounted.
    const [prev, next] = neighbours(chapter);
    const wanted = new Set<SceneId>([id]);
    if (prev) wanted.add(sceneFor(prev, 1));
    if (next) wanted.add(sceneFor(next, 0));
    if (chapter === 'journey') {
      wanted.add('config');
      wanted.add('route');
    }
    const wantedKey = [...wanted].sort().join('|');
    if (wantedKey !== mountedKey.current) {
      mountedKey.current = wantedKey;
      setMounted([...wanted]);
    }

    def.pose(ctx, rig.target);
    def.look(ctx, rig.targetLook);

    const cut = rig.first || id !== director.scene;
    director.scene = id;
    rig.first = false;

    const { pose, target } = rig;
    let follow = cut || reduced ? 1 : 1 - Math.exp(-4.2 * dt);
    if (reducedMotion && !stillCamera && !cut) {
      // Reduced motion: no camera travel. Dip to dark, change the view, fade back.
      const moved = pose.pos.distanceToSquared(target.pos) > 0.2 || pose.look.distanceToSquared(target.look) > 0.2;
      if (moved) {
        rig.fade = Math.min(1, rig.fade + dt * 6);
        follow = rig.fade >= 1 ? 1 : 0;
      } else {
        rig.fade = Math.max(0, rig.fade - dt * 3);
      }
    }
    pose.pos.lerp(target.pos, follow);
    pose.look.lerp(target.look, follow);
    pose.fov += (target.fov - pose.fov) * follow;
    rig.shiftX += (target.shiftX - rig.shiftX) * follow;
    rig.shiftY += (target.shiftY - rig.shiftY) * follow;
    if (cut) copyLook(rig.look, rig.targetLook);
    else mixLook(rig.look, rig.look, rig.targetLook, reduced ? 1 : 1 - Math.exp(-3 * dt));

    applyCamera(camera, pose, target, rig, aspect, size.width, size.height, ctx.time, reduced, dt);
    applyLook(rig.look);

    // Dip to dark across scene changes.
    if (veil.current) {
      const v = Math.max(boundaryVeil(), def.veil?.(ctx) ?? 0, rig.fade);
      veil.current.style.opacity = v < 0.004 ? '0' : v.toFixed(3);
    }

    // Loader milestone + adaptive resolution.
    rig.frames++;
    if (rig.frames === 4) markLoaded('frame');
    if (rig.frames > 120) {
      rig.slow = damp(rig.slow, rawDt > 1 / 34 ? 1 : 0, 1.2, dt);
      if (rig.slow > 0.8 && rig.dpr > 1) {
        rig.dpr = Math.max(1, rig.dpr - 0.25);
        setDpr(rig.dpr);
        rig.slow = 0;
        rig.frames = 60;
      }
    }
  });

  function applyLook(l: Look) {
    const fog = scene.fog as Fog | null;
    if (fog) {
      fog.color.copy(l.bg);
      fog.near = l.fogNear;
      fog.far = l.fogFar;
    }
    backdropMat.color.copy(l.bg);
    if (backdrop.current) backdrop.current.position.copy(camera.position);
    scene.environmentIntensity = l.env;
    gl.toneMappingExposure = l.exposure;

    if (hemi.current) {
      hemi.current.color.copy(l.sky);
      hemi.current.groundColor.copy(l.ground);
      hemi.current.intensity = l.hemi;
    }
    if (key.current) {
      const k = key.current;
      k.color.copy(l.keyColor);
      k.intensity = l.key;
      k.position.copy(l.focus).addScaledVector(l.keyDir, 80);
      k.target.position.copy(l.focus);
      k.target.updateMatrixWorld();
      if (Math.abs(rig.shadowSize - l.shadow) > 0.25) {
        rig.shadowSize = l.shadow;
        const c = k.shadow.camera;
        c.left = -l.shadow;
        c.right = l.shadow;
        c.top = l.shadow;
        c.bottom = -l.shadow;
        c.updateProjectionMatrix();
      }
    }
    if (fill.current) {
      fill.current.color.copy(l.fillColor);
      fill.current.intensity = l.fill;
      fill.current.position.copy(l.focus).addScaledVector(l.fillDir, 60);
      fill.current.target.position.copy(l.focus);
      fill.current.target.updateMatrixWorld();
    }
    for (const [ref, lamp] of [
      [lampA, l.lampA],
      [lampB, l.lampB],
    ] as const) {
      if (!ref.current) continue;
      ref.current.position.copy(lamp.pos);
      ref.current.color.copy(lamp.color);
      ref.current.intensity = lamp.intensity;
      ref.current.distance = lamp.distance;
    }
  }

  const shadowMap = tier === 'high' ? 2048 : 1024;
  // The first scene to finish compiling completes the loader's "scene" milestone.
  const onWarm = useCallback(() => markLoaded('scene'), [markLoaded]);

  return (
    <>
      <mesh ref={backdrop} material={backdropMat} renderOrder={-1000} frustumCulled={false}>
        <sphereGeometry args={[500, 16, 12]} />
      </mesh>
      <hemisphereLight ref={hemi} />
      <directionalLight
        ref={key}
        castShadow={tier !== 'low'}
        shadow-mapSize={[shadowMap, shadowMap]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
        shadow-radius={3}
        shadow-camera-near={10}
        shadow-camera-far={170}
      />
      <directionalLight ref={fill} />
      <pointLight ref={lampA} decay={1.6} />
      <pointLight ref={lampB} decay={1.6} />
      {mounted.map((id) => (
        <SceneMount key={id} entry={scenes[id]} onWarm={onWarm} />
      ))}
    </>
  );
}

function applyCamera(
  camera: PerspectiveCamera,
  pose: Pose,
  target: Pose,
  rig: { shiftX: number; shiftY: number; appliedShift: [number, number, number, number]; pointer: { x: number; y: number; sx: number; sy: number } },
  aspect: number,
  width: number,
  height: number,
  time: number,
  reduced: boolean,
  dt: number,
) {
  // Narrow viewports see less horizontally — back the camera off along its axis.
  const pull = target.fit > 0 ? Math.pow(clamp(1.6 / aspect, 1, 3.6), 0.6 * target.fit) : 1;
  _dir.subVectors(pose.pos, pose.look).multiplyScalar(pull);
  camera.position.copy(pose.look).add(_dir);
  camera.lookAt(pose.look);

  if (!reduced && target.sway > 0) {
    rig.pointer.sx = damp(rig.pointer.sx, rig.pointer.x, 2.2, dt);
    rig.pointer.sy = damp(rig.pointer.sy, rig.pointer.y, 2.2, dt);
    const s = target.sway;
    _right.setFromMatrixColumn(camera.matrixWorld, 0);
    _up.setFromMatrixColumn(camera.matrixWorld, 1);
    camera.position
      .addScaledVector(_right, (Math.sin(time * 0.23) * 0.5 + rig.pointer.sx * 1.4) * s)
      .addScaledVector(_up, (Math.sin(time * 0.17 + 1.3) * 0.3 + rig.pointer.sy * 0.7) * s);
    camera.lookAt(pose.look);
  }

  let dirty = false;
  if (Math.abs(camera.fov - pose.fov) > 0.01) {
    camera.fov = pose.fov;
    dirty = true;
  }

  const a = rig.appliedShift;
  if (Math.abs(a[0] - rig.shiftX) > 0.0005 || Math.abs(a[1] - rig.shiftY) > 0.0005 || a[2] !== width || a[3] !== height) {
    a[0] = rig.shiftX;
    a[1] = rig.shiftY;
    a[2] = width;
    a[3] = height;
    if (Math.abs(rig.shiftX) < 0.0005 && Math.abs(rig.shiftY) < 0.0005) camera.clearViewOffset();
    else camera.setViewOffset(width, height, -rig.shiftX * width, rig.shiftY * height, width, height);
    dirty = false;
  }
  if (dirty) camera.updateProjectionMatrix();
}
