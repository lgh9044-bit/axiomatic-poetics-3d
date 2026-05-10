import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * 공리적 시학 3D 시각화
 * 설계 철학: 외부의 로런츠 끌개를 차용하지 않고, 구절별 y·z·m·p·s·e·a 값이 직접
 * 공리적 끌개장, 독자 의미 배열 접힘, 귀환 매듭, 자유도 기반 튜브 반지름을 생성한다.
 */

const versePoints = [
  { id: 1, text: '그건 내게 없는 것이었다', y: 0.58, polarity: -1, m: 3, p: 0, s: 4, e: 5, a: 0, z: -2.63, label: '부재의 선언 (공리 세팅)' },
  { id: 2, text: '그것을 주어야 사랑이라고 한다', y: 0.75, polarity: -1, m: 2, p: 5, s: 1, e: 2, a: 1, z: -2.13, label: '모순의 발생' },
  { id: 3, text: '없는 것이어야 하고 네게 주어야 하는', y: 0.83, polarity: -1, m: 4, p: 5, s: 4, e: 3, a: 0, z: -3.50, label: '정동적 하강 가속' },
  { id: 4, text: '없는 것만 있다. 없는 것만 줄 수 있는', y: 0.75, polarity: -1, m: 4, p: 5, s: 5, e: 4, a: 0, z: -3.75, label: '리만 곡면 극점 (최대 모순)' },
  { id: 5, text: '바다처럼 흔한 것 (...) 안겨주는 것', y: 0.70, polarity: -1, m: 4, p: 4, s: 4, e: 2, a: 2, z: -3.50, label: '은유의 확장, 무거움' },
  { id: 6, text: '바다는 멀다', y: 0.63, polarity: -1, m: 3, p: 3, s: 3, e: 3, a: 2, z: -2.88, label: '소외와 거리감' },
  { id: 7, text: '사랑이라고 배운다면 참으로 난감한', y: 0.93, polarity: -1, m: 4, p: 4, s: 3, e: 3, a: 0, z: -3.25, label: '공리의 최대 현존 (y 최고)' },
  { id: 8, text: '보아도 보아도 바다뿐인 바다가', y: 0.58, polarity: -1, m: 3, p: 0, s: 4, e: 2, a: 0, z: -2.25, label: '반복에 의한 고립' },
  { id: 9, text: '그 바다를 보러 가자고 사랑이 있다', y: 0.83, polarity: 1, m: 3, p: 2, s: 1, e: 1, a: 2, z: 2.25, label: '유일한 양(+)의 궤적 도약' },
  { id: 10, text: '그 바다를 보러가서도 사랑이 있다', y: 0.83, polarity: 1, m: 2, p: 0, s: 4, e: 1, a: 1, z: 1.75, label: '긍정의 보류 및 하강 시작' },
  { id: 11, text: '사랑은 짐이다', y: 1.00, polarity: -1, m: 4, p: 0, s: 0, e: 0, a: 4, z: -2.50, label: '생략/비약에 의한 급락' },
  { id: 12, text: '아무렇게나 나뒹군다. 홀가분하지 않다', y: 0.85, polarity: -1, m: 3, p: 3, s: 5, e: 0, a: 0, z: -2.50, label: '지루한 부재의 확인' },
  { id: 13, text: '그것은 무겁다. 몹시도 무거운 바다', y: 0.80, polarity: -1, m: 4, p: 2, s: 3, e: 2, a: 0, z: -2.88, label: '정동의 최종적 가라앉음' },
  { id: 14, text: '사진 속에만 있다. 언제적 사진인가?', y: 0.48, polarity: -1, m: 4, p: 0, s: 2, e: 5, a: 5, z: -3.50, label: '매듭 교차점 & 거대한 침묵' },
];

const SCALE = { x: 1.22, y: 5.25, z: 1.28 };
const AXIOM_ATTRACTOR_IDS = [4, 7, 9, 11, 14];
const ATTRACTOR_KIND = {
  4: { kind: 'absence', name: '부재의 음의 끌개', color: 0x4f5bff },
  7: { kind: 'axiom', name: '공리 현존 끌개', color: 0xeafffb },
  9: { kind: 'possibility', name: '양의 가능성 끌개', color: 0xffb347 },
  11: { kind: 'burden', name: '짐/급락 끌개', color: 0x22386f },
  14: { kind: 'memory', name: '침묵 귀환 끌개', color: 0xc084fc },
};

const state = {
  selected: versePoints[0],
  time: 0,
  showTrajectory: true,
  showAttractors: true,
  showFolds: true,
  showKnot: true,
  showLabels: true,
  showPlane: true,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070f);
scene.fog = new THREE.FogExp2(0x05070f, 0.028);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4.5, 8.3, 17.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('canvas-root').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(7.8, 3.6, -1.6);
controls.maxDistance = 44;
controls.minDistance = 7;

const groupTrajectory = new THREE.Group();
const groupAttractors = new THREE.Group();
const groupFolds = new THREE.Group();
const groupKnot = new THREE.Group();
const groupLabels = new THREE.Group();
const groupPlane = new THREE.Group();
scene.add(groupTrajectory, groupAttractors, groupFolds, groupKnot, groupLabels, groupPlane);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clickable = [];
const foldBeads = [];
let returnKnotCurve = null;

initLights();
createStars();
createAxisSystem();
createZZeroPlane();
const positions = versePoints.map(toPosition);
const attractors = buildAxiomaticAttractors(versePoints);
createVariableRadiusTrajectory(versePoints);
createVerseNodes(versePoints);
createLabels(versePoints);
createAttractors(attractors);
createReaderFoldLines(attractors);
createReturnKnot(positions[13], positions[0], attractors);
createLegendTable();
updateInfoPanel(versePoints[0]);
bindUi();
animate();

function initLights() {
  const ambient = new THREE.AmbientLight(0x9fb6ff, 0.55);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 1.45);
  key.position.set(6, 12, 8);
  scene.add(key);
  const rim = new THREE.PointLight(0x72f7ff, 1.4, 35);
  rim.position.set(-4, 6, -10);
  scene.add(rim);
  const warm = new THREE.PointLight(0xffb347, 1.1, 22);
  warm.position.set(10, 4, 4);
  scene.add(warm);
}

function createStars() {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  for (let i = 0; i < 850; i++) {
    vertices.push(
      (Math.random() - 0.5) * 70,
      Math.random() * 34 - 7,
      (Math.random() - 0.5) * 70
    );
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const material = new THREE.PointsMaterial({ color: 0x9db8ff, size: 0.025, transparent: true, opacity: 0.48 });
  scene.add(new THREE.Points(geometry, material));
}

function toPosition(v) {
  return new THREE.Vector3(
    (v.id - 1) * SCALE.x,
    v.y * SCALE.y,
    v.z * SCALE.z
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function colorByZ(z) {
  if (z > 0.2) return new THREE.Color(0xffb347);
  if (z < -0.2) return new THREE.Color(0x5865ff);
  return new THREE.Color(0xb8c7d9);
}

function readerFreedom(v) {
  const raw = 1.2 * (1 - v.y) + 0.18 * v.e + 0.16 * v.a + 0.12 * v.s - 0.14 * v.p;
  return Math.max(0, raw);
}

function tubeRadius(v) {
  return clamp(0.07 + readerFreedom(v) * 0.048, 0.07, 0.38);
}

function deltaAround(points, i) {
  const prev = points[i - 1];
  const curr = points[i];
  const next = points[i + 1];
  let d = 0;
  if (prev) d += Math.abs(curr.z - prev.z) + Math.abs(curr.y - prev.y) * 3.0;
  if (next) d += Math.abs(next.z - curr.z) + Math.abs(next.y - curr.y) * 3.0;
  return d;
}

function attractorStrength(points, i) {
  const v = points[i];
  return Math.abs(v.z) + 0.4 * v.m + 0.3 * v.p + 0.5 * v.s + 0.6 * v.e + 0.5 * v.a + deltaAround(points, i);
}

function buildAxiomaticAttractors(points) {
  return AXIOM_ATTRACTOR_IDS.map((id) => {
    const index = points.findIndex((p) => p.id === id);
    const verse = points[index];
    const position = toPosition(verse);
    const profile = ATTRACTOR_KIND[id];
    const baseStrength = attractorStrength(points, index);
    const directionBias = verse.z > 0 ? 1 : -1;
    return {
      id,
      verse,
      position,
      strength: baseStrength * 0.22,
      radius: clamp(0.28 + baseStrength * 0.022, 0.34, 0.72),
      directionBias,
      ...profile,
    };
  });
}

function attractorField(pos, attractorList) {
  const field = new THREE.Vector3(0, 0, 0);
  for (const a of attractorList) {
    const dir = a.position.clone().sub(pos);
    const distSq = dir.lengthSq() + 0.72;
    const force = a.strength / distSq;
    dir.normalize().multiplyScalar(force);

    if (a.kind === 'possibility') dir.z += 0.018 * a.strength;
    if (a.kind === 'absence') dir.z -= 0.014 * a.strength;
    if (a.kind === 'memory') {
      const start = positions[0];
      const towardStart = start.clone().sub(pos).normalize().multiplyScalar(0.035 * a.strength);
      dir.add(towardStart);
    }
    field.add(dir);
  }
  const pullToTextBand = new THREE.Vector3(0, 0, -0.006 * pos.z);
  field.add(pullToTextBand);
  return field.length() > 0 ? field.normalize() : field;
}

function createVariableRadiusTrajectory(points) {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const p0 = toPosition(a);
    const p1 = toPosition(b);
    const mid = p0.clone().lerp(p1, 0.5);
    const curvature = new THREE.Vector3(0, Math.sin(i * 1.37) * 0.18, (b.z - a.z) * 0.18);
    const curve = new THREE.CatmullRomCurve3([p0, mid.add(curvature), p1]);
    const radius = (tubeRadius(a) + tubeRadius(b)) / 2;
    const geometry = new THREE.TubeGeometry(curve, 36, radius, 18, false);
    const colorA = colorByZ(a.z);
    const colorB = colorByZ(b.z);
    const material = new THREE.MeshStandardMaterial({
      color: colorA.lerp(colorB, 0.5),
      emissive: colorA.clone().multiplyScalar(0.32),
      roughness: 0.34,
      metalness: 0.12,
      transparent: true,
      opacity: 0.84,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { type: 'trajectorySegment', from: a.id, to: b.id, freedom: (readerFreedom(a) + readerFreedom(b)) / 2 };
    groupTrajectory.add(mesh);
  }
}

function createVerseNodes(points) {
  points.forEach((v) => {
    const freedom = readerFreedom(v);
    const geometry = new THREE.SphereGeometry(clamp(0.16 + freedom * 0.065, 0.16, 0.42), 32, 16);
    const color = colorByZ(v.z);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color.clone().multiplyScalar(v.z > 0 ? 0.7 : 0.45),
      roughness: 0.22,
      metalness: 0.18,
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(toPosition(v));
    sphere.userData = { type: 'verse', verse: v };
    clickable.push(sphere);
    groupTrajectory.add(sphere);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(clamp(0.28 + Math.abs(v.z) * 0.025, 0.28, 0.48), 32, 16),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, depthWrite: false })
    );
    halo.position.copy(sphere.position);
    groupTrajectory.add(halo);
  });
}

function createLabels(points) {
  points.forEach((v) => {
    const label = makeTextSprite(`${v.id}. ${v.label}`, {
      fontSize: 44,
      textColor: v.z > 0 ? '#ffd89a' : '#d8ddff',
      backgroundColor: 'rgba(5, 8, 18, 0.72)',
    });
    label.position.copy(toPosition(v)).add(new THREE.Vector3(0.05, 0.42, 0.02));
    label.scale.set(1.35, 0.37, 1);
    groupLabels.add(label);
  });
}

function makeTextSprite(message, options = {}) {
  const fontSize = options.fontSize || 42;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const padding = 24;
  context.font = `${fontSize}px Noto Serif KR, serif`;
  const textWidth = context.measureText(message).width;
  canvas.width = Math.ceil(textWidth + padding * 2);
  canvas.height = fontSize + padding * 2;
  context.font = `${fontSize}px Noto Serif KR, serif`;
  context.fillStyle = options.backgroundColor || 'rgba(0,0,0,0.55)';
  roundRect(context, 0, 0, canvas.width, canvas.height, 20);
  context.fill();
  context.fillStyle = options.textColor || '#ffffff';
  context.textBaseline = 'middle';
  context.fillText(message, padding, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.userData = { type: 'label', message };
  return sprite;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function createAttractors(attractorList) {
  attractorList.forEach((a) => {
    const color = new THREE.Color(a.color);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(a.radius, 48, 24),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color.clone().multiplyScalar(0.85),
        transparent: true,
        opacity: 0.86,
        roughness: 0.18,
        metalness: 0.2,
      })
    );
    core.position.copy(a.position);
    core.userData = { type: 'attractor', attractor: a, verse: a.verse };
    clickable.push(core);
    groupAttractors.add(core);

    for (let r = 1; r <= 3; r++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(a.radius * (1.5 + r * 0.75), 0.012, 12, 96),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12 / r, depthWrite: false })
      );
      ring.position.copy(a.position);
      ring.rotation.x = Math.PI / 2 + r * 0.18;
      ring.rotation.y = r * 0.31;
      ring.userData = { rotateSpeed: 0.0015 * (r + 1) };
      groupAttractors.add(ring);
    }

    const label = makeTextSprite(`${a.id}. ${a.name}`, {
      fontSize: 42,
      textColor: '#ffffff',
      backgroundColor: 'rgba(16, 9, 36, 0.76)',
    });
    label.position.copy(a.position).add(new THREE.Vector3(0.15, 0.75, 0));
    label.scale.set(1.2, 0.34, 1);
    groupAttractors.add(label);
  });
}

function createReaderFoldLines(attractorList) {
  for (let seed = 1; seed <= 13; seed++) {
    const start = new THREE.Vector3(
      -0.8 + seeded(seed, 0) * 2.0,
      1.0 + seeded(seed, 1) * 3.8,
      -6.6 + seeded(seed, 2) * 10.2
    );
    const linePoints = generateReaderFoldLine(seed, start, attractorList, 125);
    const curve = new THREE.CatmullRomCurve3(linePoints);
    const geometry = new THREE.TubeGeometry(curve, 120, 0.025 + seeded(seed, 3) * 0.025, 8, false);
    const hue = seed % 3 === 0 ? 0xffd166 : seed % 3 === 1 ? 0x7ef7d7 : 0xff6ac1;
    const material = new THREE.MeshBasicMaterial({ color: hue, transparent: true, opacity: 0.32, depthWrite: false });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { type: 'foldLine', seed, curve };
    groupFolds.add(mesh);

    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 16, 8),
      new THREE.MeshBasicMaterial({ color: hue, transparent: true, opacity: 0.9 })
    );
    bead.userData = { curve, seed, speed: 0.04 + seeded(seed, 4) * 0.035 };
    foldBeads.push(bead);
    groupFolds.add(bead);
  }
}

function generateReaderFoldLine(seed, start, attractorList, steps = 90) {
  const result = [];
  let pos = start.clone();
  for (let t = 0; t < steps; t++) {
    const field = attractorField(pos, attractorList);
    const n = seededNoiseVector(seed, t, 0.095);
    const textDrift = new THREE.Vector3(0.105, Math.sin(t * 0.09 + seed) * 0.018, 0);
    pos = pos.clone().add(field.multiplyScalar(0.115)).add(n).add(textDrift);
    pos.y = clamp(pos.y, 0.6, 6.5);
    pos.z = clamp(pos.z, -6.2, 4.2);
    result.push(pos.clone());
  }
  return result;
}

function seeded(seed, salt = 0) {
  const x = Math.sin(seed * 127.1 + salt * 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function seededNoiseVector(seed, t, amp) {
  return new THREE.Vector3(
    (seeded(seed + t, 7) - 0.5) * amp,
    (seeded(seed + t, 11) - 0.5) * amp * 0.72,
    (seeded(seed + t, 19) - 0.5) * amp * 1.25
  );
}

function createReturnKnot(endPoint, startPoint, attractorList) {
  const knotPoints = generateReturnKnot(endPoint, startPoint, attractorList, 110, 34);
  returnKnotCurve = new THREE.CatmullRomCurve3(knotPoints, true, 'catmullrom', 0.35);
  const geometry = new THREE.TubeGeometry(returnKnotCurve, 180, 0.075, 14, true);
  const material = new THREE.MeshStandardMaterial({
    color: 0xd8b4fe,
    emissive: 0x7e22ce,
    roughness: 0.24,
    metalness: 0.15,
    transparent: true,
    opacity: 0.78,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = { type: 'returnKnot' };
  groupKnot.add(mesh);

  const bead = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 24, 12),
    new THREE.MeshBasicMaterial({ color: 0xfde68a })
  );
  bead.userData = { type: 'returnBead' };
  groupKnot.add(bead);
}

function interpolateArc(a, b, segments, lift = 2.4) {
  const result = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = a.clone().lerp(b, t);
    p.y += Math.sin(Math.PI * t) * lift;
    p.z += Math.sin(Math.PI * t) * -1.2;
    p.x += Math.sin(Math.PI * t) * -2.6;
    result.push(p);
  }
  return result;
}

function generateReturnKnot(endPoint, startPoint, attractorList, segments = 80, iterations = 24) {
  let curve = interpolateArc(endPoint, startPoint, segments, 2.7);
  for (let k = 0; k < iterations; k++) {
    curve = curve.map((p, idx) => {
      if (idx === 0 || idx === curve.length - 1) return p;
      const t = idx / (curve.length - 1);
      const field = attractorField(p, attractorList);
      const memoryBias = Math.sin(Math.PI * t);
      const crossingBias = new THREE.Vector3(Math.sin(t * Math.PI * 2) * 0.012, 0, Math.cos(t * Math.PI * 2) * 0.018);
      return p.clone().add(field.multiplyScalar(0.058 * memoryBias)).add(crossingBias);
    });
  }
  return curve;
}

function createZZeroPlane() {
  const planeGeometry = new THREE.PlaneGeometry(19.5, 7.2, 28, 10);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0x8ad5ff,
    transparent: true,
    opacity: 0.085,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.position.set(7.9, 3.1, 0);
  groupPlane.add(plane);

  const grid = new THREE.GridHelper(19.5, 28, 0x60d5ff, 0x233957);
  grid.position.set(7.9, -0.02, 0);
  grid.rotation.x = Math.PI / 2;
  grid.material.transparent = true;
  grid.material.opacity = 0.24;
  groupPlane.add(grid);

  const label = makeTextSprite('z = 0 정동 기준면: 위는 양의 발현, 아래/뒤는 음의 침잠', {
    fontSize: 44,
    textColor: '#bdefff',
    backgroundColor: 'rgba(5, 24, 38, 0.70)',
  });
  label.position.set(7.9, 6.4, 0.08);
  label.scale.set(2.3, 0.5, 1);
  groupPlane.add(label);
}

function createAxisSystem() {
  const materialX = new THREE.LineBasicMaterial({ color: 0xf2f2f2, transparent: true, opacity: 0.32 });
  const materialY = new THREE.LineBasicMaterial({ color: 0x78f4d1, transparent: true, opacity: 0.42 });
  const materialZPositive = new THREE.LineBasicMaterial({ color: 0xffbd59, transparent: true, opacity: 0.5 });
  const materialZNegative = new THREE.LineBasicMaterial({ color: 0x5865ff, transparent: true, opacity: 0.5 });

  addLine(new THREE.Vector3(-0.4, 0, 0), new THREE.Vector3(16.4, 0, 0), materialX, scene);
  addLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 6.2, 0), materialY, scene);
  addLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 4.2), materialZPositive, scene);
  addLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -6.2), materialZNegative, scene);

  const xLabel = makeTextSprite('x: 구절 순서 1 → 14', { fontSize: 44, textColor: '#ffffff', backgroundColor: 'rgba(10,10,18,0.65)' });
  xLabel.position.set(15.6, 0.35, 0); xLabel.scale.set(1.45, 0.36, 1); scene.add(xLabel);
  const yLabel = makeTextSprite('y: 공리/현존성', { fontSize: 44, textColor: '#9fffe4', backgroundColor: 'rgba(10,26,22,0.65)' });
  yLabel.position.set(0.6, 6.35, 0); yLabel.scale.set(1.25, 0.34, 1); scene.add(yLabel);
  const zLabel = makeTextSprite('z: 정동 심도 ±', { fontSize: 44, textColor: '#ffd89a', backgroundColor: 'rgba(32,20,8,0.65)' });
  zLabel.position.set(0.6, 0.7, 3.8); zLabel.scale.set(1.12, 0.32, 1); scene.add(zLabel);
}

function addLine(a, b, material, target) {
  const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
  target.add(new THREE.Line(geometry, material));
}

function createLegendTable() {
  const tbody = document.querySelector('#verse-table tbody');
  const rows = versePoints.map((v) => {
    const f = readerFreedom(v);
    return `<tr data-id="${v.id}">
      <td>${v.id}</td>
      <td>${v.text}</td>
      <td>${v.y.toFixed(2)}</td>
      <td class="${v.z > 0 ? 'positive' : 'negative'}">${v.z > 0 ? '+' : ''}${v.z.toFixed(2)}</td>
      <td>${f.toFixed(2)}</td>
      <td>${v.label}</td>
    </tr>`;
  }).join('');
  tbody.innerHTML = rows;
  tbody.querySelectorAll('tr').forEach((tr) => {
    tr.addEventListener('click', () => {
      const verse = versePoints.find((v) => v.id === Number(tr.dataset.id));
      selectVerse(verse);
    });
  });
}

function updateInfoPanel(v) {
  const f = readerFreedom(v);
  const radius = tubeRadius(v);
  document.getElementById('verse-title').textContent = `${v.id}. ${v.label}`;
  document.getElementById('verse-text').textContent = v.text;
  document.getElementById('verse-detail').innerHTML = `
    <div class="metric"><span>현존성 y</span><strong>${v.y.toFixed(2)}</strong></div>
    <div class="metric"><span>정동 심도 z</span><strong class="${v.z > 0 ? 'positive' : 'negative'}">${v.z > 0 ? '+' : ''}${v.z.toFixed(2)}</strong></div>
    <div class="metric"><span>독자 자유도 F</span><strong>${f.toFixed(2)}</strong></div>
    <div class="metric"><span>튜브 반지름</span><strong>${radius.toFixed(2)}</strong></div>
    <div class="metric"><span>m/p/s/e/a</span><strong>${v.m}/${v.p}/${v.s}/${v.e}/${v.a}</strong></div>
    <div class="metric"><span>극성</span><strong>${v.polarity > 0 ? '양(+)' : '음(-)'}</strong></div>
  `;
  document.querySelectorAll('#verse-table tr').forEach((tr) => tr.classList.toggle('active', Number(tr.dataset.id) === v.id));
}

function selectVerse(v) {
  state.selected = v;
  updateInfoPanel(v);
  const p = toPosition(v);
  controls.target.copy(p);
  camera.position.lerp(new THREE.Vector3(p.x + 3.4, p.y + 2.2, p.z + 7.8), 0.42);
}

function bindUi() {
  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('click', onClick);

  const toggles = [
    ['toggle-trajectory', 'showTrajectory', groupTrajectory],
    ['toggle-attractors', 'showAttractors', groupAttractors],
    ['toggle-folds', 'showFolds', groupFolds],
    ['toggle-knot', 'showKnot', groupKnot],
    ['toggle-labels', 'showLabels', groupLabels],
    ['toggle-plane', 'showPlane', groupPlane],
  ];

  toggles.forEach(([id, key, group]) => {
    const el = document.getElementById(id);
    el.checked = state[key];
    el.addEventListener('change', () => {
      state[key] = el.checked;
      group.visible = state[key];
    });
  });

  document.getElementById('reset-camera').addEventListener('click', () => {
    camera.position.set(4.5, 8.3, 17.5);
    controls.target.set(7.8, 3.6, -1.6);
  });
}

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onClick() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickable, false);
  if (hits.length > 0) {
    const obj = hits[0].object;
    if (obj.userData.verse) selectVerse(obj.userData.verse);
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  state.time += 0.016;
  controls.update();

  groupAttractors.children.forEach((obj) => {
    if (obj.userData.rotateSpeed) {
      obj.rotation.z += obj.userData.rotateSpeed;
      obj.rotation.y += obj.userData.rotateSpeed * 0.55;
    }
  });

  foldBeads.forEach((bead) => {
    const t = (state.time * bead.userData.speed + seeded(bead.userData.seed, 12)) % 1;
    bead.position.copy(bead.userData.curve.getPointAt(t));
  });

  if (returnKnotCurve) {
    const returnBead = groupKnot.children.find((c) => c.userData.type === 'returnBead');
    if (returnBead) returnBead.position.copy(returnKnotCurve.getPointAt((state.time * 0.045) % 1));
  }

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickable, false);
  document.body.classList.toggle('is-hovering', hits.length > 0);

  renderer.render(scene, camera);
}
