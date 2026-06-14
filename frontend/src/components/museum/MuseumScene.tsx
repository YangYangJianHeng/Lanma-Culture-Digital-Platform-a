import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Text,
  OrbitControls,
  PerspectiveCamera,
  useTexture,
  Sky,
} from '@react-three/drei';
import * as THREE from 'three';

// ====== 类型定义 ======
interface Medal3D {
  id: number;
  name: string;
  year: number;
  thumbnail_url: string;
  color: string;
}

interface MuseumSceneProps {
  medals: Medal3D[];
  onSelectMedal: (medal: Medal3D) => void;
}

// ====== 色彩系统 ======
const C = {
  gold: '#d4af37',
  goldLight: '#f5e6b8',
  goldDark: '#b8941f',
  petal: '#f8f8f8',
  petalWarm: '#f0e0d0',
  base: '#c0c0c8',
  baseDark: '#a0a0a8',
  baseGold: '#b8a060',
  roofRing: '#e0d0a0',
  ground: '#d8d8d8',
  tower: '#b0b0b8',
  treeTrunk: '#6b4c3b',
  treeCrown: '#3c6b35',
  sky: '#87ceeb',
  mountain: '#7a8a6a',
  mountainShadow: '#5a6a4a',
  window: '#88bbdd',
  water: '#7fc8f8',
};

// ====== 天空与环境（含雾效） ======
function DayEnvironment() {
  const { scene, gl } = useThree();

  useEffect(() => {
    // 雾效
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.018);

    // 环境贴图
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#b0d0f0');
    grad.addColorStop(0.4, '#e0f0ff');
    grad.addColorStop(1, '#ffffff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const envMap = pmrem.fromEquirectangular(texture).texture;

    scene.environment = envMap;
    scene.background = new THREE.Color(C.sky);

    return () => {
      scene.fog = null;
      scene.environment = null;
      scene.background = null;
      texture.dispose();
      envMap.dispose();
      pmrem.dispose();
    };
  }, [scene, gl]);

  return (
    <Sky distance={450000} sunPosition={[10, 20, 5]} inclination={0.5} azimuth={0.25} />
  );
}

// ====== 山脉背景（兰州环山） ======
function Mountains() {
  const meshRef = useRef<THREE.Mesh>(null!);

  const geometry = useMemo(() => {
    const segments = 80;
    const width = 40;
    const depth = 4;
    const verts: number[] = [];
    const idxs: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const x = -width / 2 + u * width;
      const h =
        1.2 +
        Math.sin(u * 8.5) * 0.7 +
        Math.sin(u * 17.3) * 0.4 +
        Math.sin(u * 3.1 + 0.5) * 0.5 +
        Math.sin(u * 25.7) * 0.2;
      verts.push(x, 0, -depth);
      verts.push(x, Math.max(h, 0.3), -depth);
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      idxs.push(a, c, b);
      idxs.push(b, c, d);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idxs);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group position={[0, -0.6, -9]}>
      {/* 远山 */}
      <mesh ref={meshRef} geometry={geometry} position={[0, -0.3, 0]}>
        <meshStandardMaterial
          color={C.mountainShadow}
          roughness={0.9}
          flatShading
          fog
        />
      </mesh>
      {/* 近山 */}
      <mesh geometry={geometry} position={[0, 0, 0.8]} scale={[1.1, 0.6, 0.6]}>
        <meshStandardMaterial
          color={C.mountain}
          roughness={0.9}
          flatShading
          fog
        />
      </mesh>
    </group>
  );
}

// ====== 地面（石板拼花纹理） ======
function TileGround() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // 底色
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 32;
    const gap = 2;

    for (let y = 0; y < 512; y += tileSize) {
      for (let x = 0; x < 512; x += tileSize) {
        const offset = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0 ? 0 : tileSize / 2;
        const px = x + offset;
        // 每块石板的随机色差
        const bright = 200 + Math.floor(Math.random() * 30);
        const gray = Math.floor(Math.random() * 10);
        ctx.fillStyle = `rgb(${bright}, ${bright - gray}, ${bright - gray - 5})`;
        ctx.fillRect(px + gap, y + gap, tileSize - gap * 2, tileSize - gap * 2);
      }
    }

    // 偏移行
    for (let y = tileSize / 2; y < 512; y += tileSize) {
      for (let x = tileSize / 2; x < 512; x += tileSize) {
        const bright = 200 + Math.floor(Math.random() * 30);
        const gray = Math.floor(Math.random() * 10);
        ctx.fillStyle = `rgb(${bright}, ${bright - gray}, ${bright - gray - 5})`;
        ctx.fillRect(x + gap, y + gap, tileSize - gap * 2, tileSize - gap * 2);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(12, 14);
    tex.anisotropy = 4;
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.62, -1]} receiveShadow>
      <planeGeometry args={[22, 26]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.85}
        metalness={0.05}
        envMapIntensity={0.15}
      />
    </mesh>
  );
}

// ====== 喷泉 ======
function Fountain({ pos }: { pos: [number, number, number] }) {
  const particlesRef = useRef<THREE.Points>(null!);
  const count = 150;
  const { positions, velocities } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const v = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.1 + Math.random() * 0.15;
      p[i * 3] = Math.cos(angle) * r;
      p[i * 3 + 1] = Math.random() * 0.1;
      p[i * 3 + 2] = Math.sin(angle) * r;
      v[i] = 0.4 + Math.random() * 0.8;
    }
    return { positions: p, velocities: v };
  }, []);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += velocities[i] * delta * 0.4;
      const spread = 0.3 + pos[i * 3 + 1] * 0.15;
      pos[i * 3] += (Math.random() - 0.5) * delta * 0.3;
      pos[i * 3 + 2] += (Math.random() - 0.5) * delta * 0.3;
      if (pos[i * 3 + 1] > 0.8 + Math.random() * 0.4) {
        const angle = Math.random() * Math.PI * 2;
        const r = 0.1 + Math.random() * 0.1;
        pos[i * 3] = Math.cos(angle) * r;
        pos[i * 3 + 1] = 0;
        pos[i * 3 + 2] = Math.sin(angle) * r;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group position={pos}>
      {/* 底座 */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[1.0, 1.1, 0.12, 28]} />
        <meshStandardMaterial color="#b8b8c0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[0.85, 0.95, 0.06, 28]} />
        <meshStandardMaterial color="#d0d0d8" roughness={0.5} />
      </mesh>
      {/* 主柱 */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.7, 12]} />
        <meshStandardMaterial color="#a0a0a8" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* 上盘 */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.35, 0.28, 0.05, 20]} />
        <meshStandardMaterial color="#c0c0c8" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* 水粒子 */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          color={C.water}
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// ====== 玫瑰花瓣 ======
function RosePetal({ angleOffset, isLeftSide }: { angleOffset: number; isLeftSide: boolean }) {
  const geometry = useMemo(() => {
    const outerR = 5.0;
    const innerR = 0.7;
    const outerH = 0.6;
    const tipH = 3.0;
    const baseHalfAngle = Math.PI / 13;
    const radialSegs = 16;
    const tangSegs = 4;
    const verts: number[] = [];
    const idxs: number[] = [];

    for (let i = 0; i <= radialSegs; i++) {
      const u = i / radialSegs;
      const radius = outerR + (innerR - outerR) * u;
      const halfAng = baseHalfAngle * (1 - u) ** 0.65;
      const h = outerH + (tipH - outerH) * u ** 0.5 + Math.sin(u * Math.PI * 0.65) * 0.25;
      for (let j = 0; j <= tangSegs; j++) {
        const v = j / tangSegs;
        const angle = angleOffset + (v - 0.5) * 2 * halfAng;
        const edgeCurve = 1 - 0.15 * Math.pow(Math.sin(v * Math.PI), 2);
        const x = radius * Math.sin(angle);
        const z = radius * Math.cos(angle);
        const y = h * edgeCurve;
        verts.push(x, y, z);
      }
    }
    const cpr = tangSegs + 1;
    for (let i = 0; i < radialSegs; i++) {
      for (let j = 0; j < tangSegs; j++) {
        const a = i * cpr + j;
        const b = i * cpr + j + 1;
        const c = (i + 1) * cpr + j;
        const d = (i + 1) * cpr + j + 1;
        if (isLeftSide) {
          idxs.push(c, a, b, c, b, d);
        } else {
          idxs.push(a, c, b);
          idxs.push(b, c, d);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idxs);
    geo.computeVertexNormals();
    return geo;
  }, [angleOffset, isLeftSide]);

  return (
    <mesh geometry={geometry} castShadow>
      <meshPhysicalMaterial
        color={C.petal}
        roughness={0.3}
        metalness={0.0}
        clearcoat={0.3}
        clearcoatRoughness={0.2}
        envMapIntensity={0.6}
        sheen={0.2}
        sheenRoughness={0.5}
        transparent
        opacity={0.95}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ====== 座椅台阶 ======
function SeatingSteps() {
  const steps = 12;
  const innerRadius = 4.2;
  const outerRadius = 4.8;
  const heightStep = 0.12;
  return (
    <group position={[0, 0.55, 0]}>
      {Array.from({ length: steps }).map((_, i) => {
        const r = innerRadius + (outerRadius - innerRadius) * (i / steps);
        return (
          <mesh key={i} position={[0, i * heightStep, 0]}>
            <cylinderGeometry args={[r, r, heightStep, 48]} />
            <meshStandardMaterial color="#b0b0b8" roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

// ====== 入口门洞 ======
function EntranceDoor() {
  return (
    <group position={[0, 0.3, -5.55]}>
      {/* 入口玻璃 */}
      <mesh position={[0, 1.2, 0.05]}>
        <planeGeometry args={[3.2, 2.6]} />
        <meshPhysicalMaterial
          color="#88ccff"
          transparent
          opacity={0.2}
          roughness={0.1}
          metalness={0.0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ====== 体育场玻璃幕墙 ======
function StadiumWindows() {
  return (
    <group position={[0, 0.6, -5]}>
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const x = Math.sin(angle) * 5.0;
        const z = Math.cos(angle) * 5.0;
        // 只在正面半圈放窗户（背面是入口）
        if (z < -0.5) return null;
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
            <mesh position={[0, 0.3, 0]}>
              <planeGeometry args={[0.25, 0.35]} />
              <meshPhysicalMaterial
                color="#99ddff"
                transparent
                opacity={0.15 + Math.random() * 0.15}
                roughness={0.05}
                metalness={0.0}
              />
            </mesh>
            <mesh position={[0, 0.7, 0]}>
              <planeGeometry args={[0.25, 0.35]} />
              <meshPhysicalMaterial
                color="#99ddff"
                transparent
                opacity={0.15 + Math.random() * 0.15}
                roughness={0.05}
                metalness={0.0}
              />
            </mesh>
            <mesh position={[0, 1.1, 0]}>
              <planeGeometry args={[0.25, 0.35]} />
              <meshPhysicalMaterial
                color="#99ddff"
                transparent
                opacity={0.15 + Math.random() * 0.15}
                roughness={0.05}
                metalness={0.0}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ====== 立体字牌 ======
function StadiumSign() {
  const textRef = useRef<any>(null!);
  useFrame(({ clock }) => {
    if (textRef.current) {
      const p = 0.02 * Math.sin(clock.getElapsedTime() * 0.4);
      textRef.current.position.z = p;
    }
  });

  return (
    <group position={[0, 2.4, -5.55]} rotation={[0, Math.PI, 0]}>
      {/* 金属背板（金色系有厚度） */}
      <mesh position={[0, 0, -0.06]} receiveShadow>
        <boxGeometry args={[4.2, 0.7, 0.08]} />
        <meshStandardMaterial color={C.goldDark} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* 背板边框 */}
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[4.08, 0.58, 0.02]} />
        <meshStandardMaterial color={C.baseGold} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* 暖色发光底板 */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[4.0, 0.5]} />
        <meshStandardMaterial
          color={C.gold}
          emissive={C.gold}
          emissiveIntensity={0.12}
          transparent
          opacity={0.2}
        />
      </mesh>
      {/* 螺钉装饰（金色） */}
      {[
        [-1.9, -0.25, 0],
        [1.9, -0.25, 0],
        [-1.9, 0.25, 0],
        [1.9, 0.25, 0],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], p[1], 0.01] as any}>
          <circleGeometry args={[0.03, 8]} />
          <meshStandardMaterial color={C.gold} metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      {/* 文字阴影层 */}
      <Text
        position={[0.015, -0.008, 0.025]}
        fontSize={0.32}
        color={C.goldDark}
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
        letterSpacing={0.18}
      >
        兰州奥体中心
      </Text>
      {/* 文字主体（金色） */}
      <group ref={textRef}>
        <Text
          position={[0, 0, 0.03]}
          fontSize={0.32}
          color={C.goldLight}
          anchorX="center"
          anchorY="middle"
          fontWeight={700}
          letterSpacing={0.18}
          outlineWidth={0.025}
          outlineColor={C.goldDark}
        >
          兰州奥体中心
        </Text>
      </group>
      {/* 顶部金色 LED 灯带 */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={i} position={[-1.9 + i * 0.2, 0.28, 0.01]}>
          <circleGeometry args={[0.015, 6]} />
          <meshBasicMaterial
            color={C.gold}
            transparent
            opacity={0.25 + Math.sin(i * 1.5) * 0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

// ====== 玫瑰体育场 ======
function RoseStadium() {
  const glowRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (glowRef.current) {
      const i = 0.6 + Math.sin(clock.getElapsedTime() * 0.8) * 0.1;
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = i;
    }
  });

  return (
    <group position={[0, -0.6, -5]}>
      {/* 地基平台 */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[5.8, 6.2, 0.3, 48]} />
        <meshStandardMaterial color="#d0d0d8" roughness={0.7} />
      </mesh>

      {/* 基座外壳 */}
      <mesh position={[0, 0.3, 0]} receiveShadow>
        <cylinderGeometry args={[5.2, 5.6, 0.8, 48]} />
        <meshStandardMaterial color="#c0c0c8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.8, 0]} receiveShadow>
        <cylinderGeometry args={[4.8, 5.2, 0.6, 48]} />
        <meshStandardMaterial color="#b0b0b8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.3, 0]} receiveShadow>
        <cylinderGeometry args={[4.5, 4.8, 0.5, 48]} />
        <meshStandardMaterial color={C.baseGold} roughness={0.5} metalness={0.3} />
      </mesh>

      {/* 玻璃幕墙 */}
      <StadiumWindows />

      {/* 内部座椅台阶 */}
      <SeatingSteps />

      {/* 入口门洞 */}
      <EntranceDoor />

      {/* 竖向装饰肋 */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        return (
          <mesh
            key={`rib-${i}`}
            position={[Math.sin(angle) * 5.1, 0.7, Math.cos(angle) * 5.1]}
            castShadow
          >
            <boxGeometry args={[0.06, 1.4, 0.4]} />
            <meshStandardMaterial color={C.baseGold} metalness={0.4} roughness={0.4} />
          </mesh>
        );
      })}

      {/* 环梁 */}
      <mesh position={[0, 0.6, 0]}>
        <torusGeometry args={[5.1, 0.08, 8, 48]} />
        <meshStandardMaterial color={C.goldDark} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <torusGeometry args={[4.6, 0.1, 8, 48]} />
        <meshStandardMaterial color={C.gold} metalness={0.6} roughness={0.2} />
      </mesh>

      {/* 玫瑰花瓣屋顶 */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return <RosePetal key={`petal-${i}`} angleOffset={angle} isLeftSide={false} />;
      })}

      {/* 中心装饰 */}
      <mesh ref={glowRef} position={[0, 3.4, 0]}>
        <torusGeometry args={[0.7, 0.12, 12, 24]} />
        <meshStandardMaterial
          color="#d0c080"
          metalness={0.5}
          roughness={0.3}
          emissive="#d0c080"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh position={[0, 3.35, 0]}>
        <circleGeometry args={[0.55, 24]} />
        <meshStandardMaterial color="#e0d080" side={THREE.DoubleSide} />
      </mesh>

      {/* 立体发光字牌 */}
      <StadiumSign />
    </group>
  );
}

// ====== 灯柱 ======
function LightTower({ pos, rotY = 0 }: { pos: [number, number, number]; rotY?: number }) {
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 5, 8]} />
        <meshStandardMaterial color={C.tower} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-0.6, 4.8, 0]}>
        <boxGeometry args={[1.2, 0.04, 0.04]} />
        <meshStandardMaterial color={C.tower} metalness={0.5} roughness={0.5} />
      </mesh>
      {[-0.3, 0, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 4.7, 0]}>
          <boxGeometry args={[0.1, 0.06, 0.08]} />
          <meshStandardMaterial color="#dddddd" />
        </mesh>
      ))}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.3, 0.2, 0.3]} />
        <meshStandardMaterial color={C.tower} roughness={0.8} />
      </mesh>
    </group>
  );
}

// ====== 树木 ======
function Tree({ pos, scale = 1 }: { pos: [number, number, number]; scale?: number }) {
  return (
    <group position={pos} scale={scale}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 0.6, 6]} />
        <meshStandardMaterial color={C.treeTrunk} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.3, 7, 5]} />
        <meshStandardMaterial color={C.treeCrown} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.24, 7, 5]} />
        <meshStandardMaterial color={C.treeCrown} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.18, 7, 5]} />
        <meshStandardMaterial color={C.treeCrown} roughness={0.8} />
      </mesh>
    </group>
  );
}

// ====== 灌木 ======
function Bush({ pos, scale = 1 }: { pos: [number, number, number]; scale?: number }) {
  return (
    <group position={pos} scale={scale}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <sphereGeometry args={[0.15, 6, 5]} />
        <meshStandardMaterial color="#4a7a42" roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 0.1, 0.05]}>
        <sphereGeometry args={[0.1, 6, 5]} />
        <meshStandardMaterial color="#4a7a42" roughness={0.9} />
      </mesh>
      <mesh position={[-0.08, 0.08, -0.05]}>
        <sphereGeometry args={[0.08, 6, 5]} />
        <meshStandardMaterial color="#4a7a42" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ====== 奖牌展示 ======
function MedalDisplay({
  medal,
  position,
  index,
  isSelected,
  onClick,
}: {
  medal: Medal3D;
  position: [number, number, number];
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const medalRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const [textureError, setTextureError] = useState(false);

  let texture: THREE.Texture | null = null;
  try {
    texture = useTexture(medal.thumbnail_url);
  } catch {
    // 纹理加载失败使用纯色
  }

  const faceMaterial = useMemo(() => {
    if (texture && !textureError) {
      return new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.1,
        roughness: 0.4,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: medal.color,
      metalness: 0.7,
      roughness: 0.2,
    });
  }, [texture, textureError, medal.color]);

  const sideMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: C.gold,
        metalness: 0.9,
        roughness: 0.2,
      }),
    []
  );

  const backMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: C.goldDark,
        metalness: 0.8,
        roughness: 0.3,
      }),
    []
  );

  useFrame(() => {
    if (medalRef.current) {
      medalRef.current.rotation.y += 0.008;
      const target = hovered || isSelected ? 1.1 : 1;
      medalRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
    }
  });

  return (
    <group position={position}>
      {/* 选中时的射灯 */}
      {isSelected && (
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 0.05, 16]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.4} />
        </mesh>
      )}

      {/* 底座 */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[1.0, 0.08, 0.7]} />
        <meshStandardMaterial color="#555555" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.16, 0]}>
        <boxGeometry args={[0.9, 0.04, 0.6]} />
        <meshStandardMaterial color="#777777" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* 立柱 */}
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.16, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* 奖牌组 */}
      <group ref={medalRef} position={[0, 0.5, 0]}>
        {/* 绶带 */}
        <mesh position={[0, 0.42, 0]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.02, 0.25, 0.01]} />
          <meshStandardMaterial color={medal.color} />
        </mesh>

        {/* 外环 */}
        <mesh
          onClick={onClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <torusGeometry args={[0.4, 0.07, 16, 32]} />
          <meshStandardMaterial
            color={C.gold}
            metalness={0.9}
            roughness={0.1}
            envMapIntensity={2.0}
          />
        </mesh>

        {/* 奖牌主体 */}
        <mesh
          onClick={onClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          material={[faceMaterial, sideMaterial, backMaterial]}
        >
          <cylinderGeometry args={[0.33, 0.33, 0.03, 32]} />
        </mesh>

        <Text
          position={[0, 0, 0.02]}
          fontSize={0.14}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight={700}
        >
          {medal.year.toString()}
        </Text>
      </group>

      <Text
        position={[0, -0.42, 0]}
        fontSize={0.12}
        color="#555555"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.2}
      >
        {medal.name}
      </Text>
    </group>
  );
}

// ====== 主场景 ======
const MuseumScene: React.FC<MuseumSceneProps> = ({ medals, onSelectMedal }) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const medalPositions = useMemo(() => {
    const maxPerRow = 5;
    const positions: [number, number, number][] = [];
    medals.forEach((_, i) => {
      const col = i % maxPerRow;
      const row = Math.floor(i / maxPerRow);
      const rowCount = Math.min(maxPerRow, medals.length - row * maxPerRow);
      const offsetX = ((rowCount - 1) * 1.3) / 2;
      const z = row * 2.2 + 0.8;
      positions.push([col * 1.3 - offsetX, -0.55, z + 2]);
    });
    return positions;
  }, [medals]);

  const handleSelect = (medal: Medal3D) => {
    const newId = selectedId === medal.id ? null : medal.id;
    setSelectedId(newId);
    onSelectMedal(medal);
  };

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)' }}>
      <Suspense fallback={null}>
        <Canvas
          onCreated={({ gl }) => {
            gl.setClearColor(C.sky);
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.0;
          }}
        >
          <PerspectiveCamera makeDefault position={[0, 3, 9]} fov={45} />

          <DayEnvironment />

          {/* 方向光（投射阴影） */}
          <directionalLight
            position={[10, 20, 5]}
            intensity={1.2}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-12}
            shadow-camera-right={12}
            shadow-camera-top={12}
            shadow-camera-bottom={-12}
            shadow-camera-near={0.5}
            shadow-camera-far={40}
          />
          <directionalLight position={[-5, 5, -3]} intensity={0.4} color="#e0e0ff" />
          <ambientLight intensity={0.5} color="#ffffff" />
          <hemisphereLight args={['#ffffff', '#888888', 0.4]} />

          {/* 地面 */}
          <TileGround />

          {/* 山脉背景 */}
          <Mountains />

          {/* 体育场 */}
          <RoseStadium />

          {/* 喷泉 */}
          <Fountain pos={[0, -0.6, -0.5]} />

          {/* 灯柱 */}
          <LightTower pos={[-7, -0.6, 2]} rotY={0.3} />
          <LightTower pos={[7, -0.6, 2]} rotY={-0.3} />
          <LightTower pos={[-7, -0.6, -3]} rotY={0.6} />
          <LightTower pos={[7, -0.6, -3]} rotY={-0.6} />

          {/* 树木 */}
          <Tree pos={[-6, -0.6, 3.5]} />
          <Tree pos={[6, -0.6, 3.5]} />
          <Tree pos={[-6.5, -0.6, 0]} />
          <Tree pos={[6.5, -0.6, 0]} />
          <Tree pos={[-6, -0.6, -3.5]} scale={0.8} />
          <Tree pos={[6, -0.6, -3.5]} scale={0.8} />
          <Tree pos={[-8, -0.6, -6]} scale={0.9} />
          <Tree pos={[8, -0.6, -6]} scale={0.9} />

          {/* 灌木 */}
          <Bush pos={[-5.5, -0.6, 4.2]} scale={0.8} />
          <Bush pos={[5.5, -0.6, 4.2]} scale={0.8} />
          <Bush pos={[-7, -0.6, -0.8]} scale={0.7} />
          <Bush pos={[7, -0.6, -0.8]} scale={0.7} />
          <Bush pos={[-5, -0.6, -5.5]} scale={0.9} />
          <Bush pos={[5, -0.6, -5.5]} scale={0.9} />

          {/* 奖牌 */}
          {medals.map((medal, i) => (
            <MedalDisplay
              key={medal.id}
              medal={medal}
              position={medalPositions[i] || [0, -0.55, 3]}
              index={i}
              isSelected={medal.id === selectedId}
              onClick={() => handleSelect(medal)}
            />
          ))}

          <OrbitControls
            enableZoom
            enablePan
            maxPolarAngle={Math.PI / 2.3}
            minDistance={2}
            maxDistance={25}
            autoRotate
            autoRotateSpeed={0.1}
            target={[0, 0.4, -1]}
          />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default MuseumScene;
