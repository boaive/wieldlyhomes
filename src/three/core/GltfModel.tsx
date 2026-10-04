import { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import type { Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Loads a .glb / .gltf and renders it with shadows enabled. Lazy-loaded by ModelSlot. */
export default function GltfModel({ src }: { src: string }) {
  const gltf = useLoader(GLTFLoader, src);
  const object = useMemo(() => gltf.scene.clone(true), [gltf]);

  useEffect(() => {
    object.traverse((o) => {
      const mesh = o as Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [object]);

  return <primitive object={object} />;
}
