import * as THREE from 'three';

export interface WorldEnvironment {
  trackCurve: THREE.CatmullRomCurve3;
  clouds: THREE.Group[];
  sparkleGroup: THREE.Group;
  butterflies: THREE.Group[];
  swingSeats: THREE.Group[];
  setSkyMood: (episodeId: number) => void;
  dispose: () => void;
}

function createSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 176;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0F766E';
    ctx.fillRect(0, 0, 512, 176);
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 496, 160);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STORYSPROUT STUDIO', 256, 68);

    ctx.fillStyle = '#FDE047';
    ctx.font = '700 26px sans-serif';
    ctx.fillText('@RadiantSparkGlobal', 256, 124);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPuzzleMatTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const colors = ['#FDE68A', '#93C5FD', '#86EFAC', '#FDA4AF'];
    const grid = 4;
    const size = 512 / grid;
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        ctx.fillStyle = colors[(r + c * 2) % colors.length];
        ctx.fillRect(c * size, r * size, size, size);
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 4;
        ctx.strokeRect(c * size + 2, r * size + 2, size - 4, size - 4);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRainbowSlideTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const bands = ['#EF4444', '#FB923C', '#FACC15', '#4ADE80', '#38BDF8'];
    const w = 256 / bands.length;
    bands.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect(i * w, 0, w + 1, 64);
    });
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildSunnyMeadowWorld(
  scene: THREE.Scene,
  isSoftwareGl: boolean,
  maxAnisotropy = 4
): WorldEnvironment {
  const disposables: { dispose: () => void }[] = [];

  // 0. Gradient Sky Dome + Golden-Hour Sun Glow (matches FTGtiB-hXD4 sunlight)
  const skyGeo = new THREE.SphereGeometry(85, 32, 20);
  const skyUniforms = {
    topColor: { value: new THREE.Color(0x38bdf8) },
    bottomColor: { value: new THREE.Color(0xfef9c3) },
  };
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPos;
      void main() {
        float h = clamp(normalize(vWorldPos).y * 1.4 + 0.15, 0.0, 1.0);
        gl_FragColor = vec4(mix(bottomColor, topColor, pow(h, 0.72)), 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);
  disposables.push(skyGeo, skyMat);

  const sunGeo = new THREE.CircleGeometry(4.5, 32);
  const sunMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.78,
  });
  const sunDisc = new THREE.Mesh(sunGeo, sunMat);
  sunDisc.position.set(22, 20, -34);
  scene.add(sunDisc);
  disposables.push(sunGeo, sunMat);

  // 1. Lush Park Grass Ground + Warm Dirt Patch Under Swing
  const groundGeo = new THREE.CircleGeometry(95, 64);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x65c466,
    roughness: 0.94,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  disposables.push(groundGeo, groundMat);

  // Rolling distant green hills
  const hillGeo = new THREE.SphereGeometry(15, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.9 });
  disposables.push(hillGeo, hillMat);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const dist = 36 + (i % 3) * 7;
    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.position.set(Math.cos(angle) * dist, -1.6, Math.sin(angle) * dist);
    hill.scale.set(1.4 + (i % 2) * 0.45, 0.42 + (i % 3) * 0.14, 1.15);
    hill.receiveShadow = true;
    scene.add(hill);
  }

  // 2. White Picket Fence Perimeter (matches FTGtiB-hXD4 playground park)
  const picketCount = 84;
  const picketGeo = new THREE.BoxGeometry(0.24, 1.15, 0.08);
  const picketMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55 });
  const pickets = new THREE.InstancedMesh(picketGeo, picketMat, picketCount);
  pickets.castShadow = !isSoftwareGl;
  pickets.receiveShadow = true;
  const dummy = new THREE.Object3D();
  const fenceRadius = 18.6;
  for (let i = 0; i < picketCount; i++) {
    const a = (i / picketCount) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * fenceRadius, 0.56, Math.sin(a) * fenceRadius);
    dummy.rotation.set(0, -a + Math.PI / 2, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    pickets.setMatrixAt(i, dummy.matrix);
  }
  pickets.computeBoundingSphere();
  scene.add(pickets);

  const fenceRailGeo = new THREE.TorusGeometry(fenceRadius, 0.06, 8, 96);
  const fenceRailTop = new THREE.Mesh(fenceRailGeo, picketMat);
  fenceRailTop.rotation.x = Math.PI / 2;
  fenceRailTop.position.y = 0.85;
  const fenceRailLow = fenceRailTop.clone();
  fenceRailLow.position.y = 0.35;
  scene.add(fenceRailTop, fenceRailLow);
  disposables.push(picketGeo, picketMat, fenceRailGeo);

  // 3. Winding Catmull-Rom Railway Track Loop (gliding cleanly in front & around park)
  const trackCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-12.5, 0.06, 6.2),
      new THREE.Vector3(0, 0.06, 8.6),
      new THREE.Vector3(12.5, 0.06, 5.8),
      new THREE.Vector3(15.5, 0.06, -3.2),
      new THREE.Vector3(9.5, 0.06, -11.2),
      new THREE.Vector3(0, 0.06, -13.2),
      new THREE.Vector3(-10, 0.06, -10.5),
      new THREE.Vector3(-15.2, 0.06, -2.5),
    ],
    true
  );

  const bedGeo = new THREE.TubeGeometry(trackCurve, 140, 1.08, 8, true);
  const bedMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.95 });
  const bedMesh = new THREE.Mesh(bedGeo, bedMat);
  bedMesh.scale.set(1, 0.08, 1);
  bedMesh.position.y = 0.03;
  bedMesh.receiveShadow = true;
  scene.add(bedMesh);
  disposables.push(bedGeo, bedMat);

  const sleeperCount = 96;
  const sleeperGeo = new THREE.BoxGeometry(1.48, 0.08, 0.24);
  const sleeperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
  const sleepers = new THREE.InstancedMesh(sleeperGeo, sleeperMat, sleeperCount);
  sleepers.receiveShadow = true;
  for (let i = 0; i < sleeperCount; i++) {
    const t = i / sleeperCount;
    const pt = trackCurve.getPointAt(t);
    const tangent = trackCurve.getTangentAt(t);
    dummy.position.set(pt.x, 0.07, pt.z);
    dummy.lookAt(pt.x + tangent.x, 0.07, pt.z + tangent.z);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    sleepers.setMatrixAt(i, dummy.matrix);
  }
  sleepers.computeBoundingSphere();
  scene.add(sleepers);
  disposables.push(sleeperGeo, sleeperMat);

  [-0.45, 0.45].forEach((offset) => {
    const railPts: THREE.Vector3[] = [];
    for (let i = 0; i < 80; i++) {
      const t = i / 80;
      const pt = trackCurve.getPointAt(t);
      const tan = trackCurve.getTangentAt(t);
      const normal = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      railPts.push(pt.clone().addScaledVector(normal, offset).setY(0.13));
    }
    const railCurve = new THREE.CatmullRomCurve3(railPts, true);
    const railGeo = new THREE.TubeGeometry(railCurve, 120, 0.046, 8, true);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.24, metalness: 0.78 });
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.castShadow = !isSoftwareGl;
    scene.add(rail);
    disposables.push(railGeo, railMat);
  });

  // Pastel Stone Tunnel Arch on back stretch
  const tunnelGeo = new THREE.TorusGeometry(2.35, 0.78, 14, 24, Math.PI);
  const tunnelMat = new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.8 });
  const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
  tunnel.position.set(0, 0, -13.2);
  tunnel.scale.set(1.1, 1.15, 2.4);
  tunnel.castShadow = !isSoftwareGl;
  tunnel.receiveShadow = true;
  scene.add(tunnel);
  disposables.push(tunnelGeo, tunnelMat);

  // 4. Colorful Foam Puzzle-Tile Playmat (matches FTGtiB-hXD4 play area)
  const matTex = createPuzzleMatTexture();
  matTex.anisotropy = maxAnisotropy;
  const playmatGeo = new THREE.BoxGeometry(5.6, 0.09, 3.8);
  const playmatMat = new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.84 });
  const playmat = new THREE.Mesh(playmatGeo, playmatMat);
  playmat.position.set(0, 0.045, 3.05);
  playmat.receiveShadow = true;
  scene.add(playmat);
  disposables.push(matTex, playmatGeo, playmatMat);

  // 5. Signature Rainbow Slide Playground Structure (directly behind playmat, matches FTGtiB-hXD4!)
  const slideGroup = new THREE.Group();
  slideGroup.position.set(0.1, 0, -0.35);

  const purplePostMat = new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 0.45 });
  const yellowBarMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
  const redRailMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.42 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 });
  const rainbowTex = createRainbowSlideTexture();
  rainbowTex.anisotropy = maxAnisotropy;
  const rainbowMat = new THREE.MeshStandardMaterial({ map: rainbowTex, roughness: 0.3 });
  disposables.push(purplePostMat, yellowBarMat, redRailMat, capMat, rainbowTex, rainbowMat);

  const postGeo = new THREE.CylinderGeometry(0.14, 0.14, 3.2, 14);
  const capGeo = new THREE.SphereGeometry(0.22, 14, 14);
  const deckGeo = new THREE.BoxGeometry(1.9, 0.14, 1.6);
  const deck = new THREE.Mesh(deckGeo, purplePostMat);
  deck.position.set(0, 1.75, -0.3);
  deck.castShadow = !isSoftwareGl;
  deck.receiveShadow = true;
  slideGroup.add(deck);
  disposables.push(postGeo, capGeo, deckGeo);

  [
    [-0.9, 0.4],
    [0.9, 0.4],
    [-0.9, -1.0],
    [0.9, -1.0],
  ].forEach(([px, pz]) => {
    const post = new THREE.Mesh(postGeo, purplePostMat);
    post.position.set(px, 1.6, pz);
    post.castShadow = !isSoftwareGl;
    slideGroup.add(post);

    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(px, 3.22, pz);
    cap.scale.set(1.15, 0.65, 1.15);
    slideGroup.add(cap);
  });

  // Yellow safety railings on platform sides
  const railBarGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.35, 10);
  disposables.push(railBarGeo);
  [-0.9, 0.9].forEach((rx) => {
    const topBar = new THREE.Mesh(railBarGeo, yellowBarMat);
    topBar.rotation.x = Math.PI / 2;
    topBar.position.set(rx, 2.45, -0.3);
    slideGroup.add(topBar);
    for (let s = -2; s <= 2; s++) {
      const rung = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.68, 8),
        yellowBarMat
      );
      rung.position.set(rx, 2.1, -0.3 + s * 0.25);
      slideGroup.add(rung);
    }
  });

  // Curved Rainbow Slide Chute extending toward the colorful puzzle playmat
  const chuteCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.78, 0.42),
    new THREE.Vector3(0, 1.35, 1.05),
    new THREE.Vector3(0, 0.58, 1.85),
    new THREE.Vector3(0, 0.22, 2.45),
  ]);
  const chuteShape = new THREE.Shape();
  chuteShape.moveTo(-0.72, -0.05);
  chuteShape.lineTo(0.72, -0.05);
  chuteShape.lineTo(0.72, 0.05);
  chuteShape.lineTo(-0.72, 0.05);
  chuteShape.closePath();

  const chutePts = chuteCurve.getPoints(18);
  for (let i = 0; i < chutePts.length - 1; i++) {
    const a = chutePts[i];
    const b = chutePts[i + 1];
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const len = a.distanceTo(b) + 0.08;
    const seg = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.09, len), rainbowMat);
    seg.position.copy(mid);
    seg.lookAt(b);
    seg.castShadow = !isSoftwareGl;
    seg.receiveShadow = true;
    slideGroup.add(seg);
  }

  [-0.76, 0.76].forEach((sideX) => {
    const sideCurve = new THREE.CatmullRomCurve3(
      chutePts.map((p) => new THREE.Vector3(sideX, p.y + 0.14, p.z))
    );
    const sideGeo = new THREE.TubeGeometry(sideCurve, 22, 0.11, 10, false);
    const sideMesh = new THREE.Mesh(sideGeo, redRailMat);
    sideMesh.castShadow = !isSoftwareGl;
    slideGroup.add(sideMesh);
    disposables.push(sideGeo);
  });

  scene.add(slideGroup);

  // 6. Swing Set on Left Side of Park (matches FTGtiB-hXD4 left background)
  const swingSet = new THREE.Group();
  swingSet.position.set(-4.9, 0, 0.4);
  swingSet.rotation.y = 0.22;

  const swingTopGeo = new THREE.CylinderGeometry(0.11, 0.11, 4.2, 12);
  const swingTop = new THREE.Mesh(swingTopGeo, yellowBarMat);
  swingTop.rotation.z = Math.PI / 2;
  swingTop.position.set(0, 2.75, 0);
  swingTop.castShadow = !isSoftwareGl;
  swingSet.add(swingTop);

  const legGeo = new THREE.CylinderGeometry(0.09, 0.09, 3.05, 10);
  disposables.push(swingTopGeo, legGeo);
  [-1.95, 1.95].forEach((sx) => {
    [-0.25, 0.25].forEach((sz, idx) => {
      const leg = new THREE.Mesh(legGeo, purplePostMat);
      leg.position.set(sx, 1.4, sz * 3.1);
      leg.rotation.x = idx === 0 ? -0.28 : 0.28;
      leg.castShadow = !isSoftwareGl;
      swingSet.add(leg);
    });
  });

  const swingSeats: THREE.Group[] = [];
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.7 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.45 });
  disposables.push(ropeMat, seatMat);

  [-0.75, 0.75].forEach((sx) => {
    const pivot = new THREE.Group();
    pivot.position.set(sx, 2.75, 0);
    [-0.22, 0.22].forEach((rx) => {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.9, 8), ropeMat);
      rope.position.set(rx, -0.95, 0);
      pivot.add(rope);
    });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.07, 0.26), seatMat);
    seat.position.set(0, -1.9, 0);
    seat.castShadow = !isSoftwareGl;
    pivot.add(seat);
    swingSet.add(pivot);
    swingSeats.push(pivot);
  });
  scene.add(swingSet);

  // 7. Radiant Spark Playground Sign Board (right side, clear of Rainbow Slide)
  const postMat = new THREE.MeshStandardMaterial({ color: 0xfb923c, roughness: 0.55 });
  const signPostGeo = new THREE.CylinderGeometry(0.09, 0.11, 2.2, 12);
  const signGeo = new THREE.BoxGeometry(2.9, 0.9, 0.14);
  const signTex = createSignTexture();
  signTex.anisotropy = maxAnisotropy;
  const signFrontMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.35 });
  const signSideMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.45 });
  disposables.push(postMat, signPostGeo, signGeo, signTex, signFrontMat, signSideMat);

  const signGroup = new THREE.Group();
  signGroup.position.set(4.8, 0, 1.35);
  signGroup.rotation.y = -0.35;
  [-1.1, 1.1].forEach((px) => {
    const post = new THREE.Mesh(signPostGeo, postMat);
    post.position.set(px, 1.1, 0);
    post.castShadow = !isSoftwareGl;
    signGroup.add(post);
  });
  const archSign = new THREE.Mesh(signGeo, [
    signSideMat,
    signSideMat,
    signSideMat,
    signSideMat,
    signFrontMat,
    signFrontMat,
  ]);
  archSign.position.set(0, 2.15, 0);
  archSign.castShadow = !isSoftwareGl;
  signGroup.add(archSign);
  scene.add(signGroup);

  // 8. Multi-Sphere Lush Pixar Storybook Trees + Park Wildflowers
  const treeCount = 24;
  const trunkGeo = new THREE.CylinderGeometry(0.26, 0.38, 1.7, 12);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.88 });
  const puffGeo = new THREE.SphereGeometry(1.05, 18, 16);
  const puffMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.76 });
  disposables.push(trunkGeo, trunkMat, puffGeo, puffMat);

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const canopies = new THREE.InstancedMesh(puffGeo, puffMat, treeCount * 3);
  trunks.castShadow = !isSoftwareGl;
  canopies.castShadow = !isSoftwareGl;

  const tintColor = new THREE.Color();
  for (let i = 0; i < treeCount; i++) {
    const angle = (i / treeCount) * Math.PI * 2 + 0.14;
    const radius = 21.5 + (i % 4) * 3.4;
    const tx = Math.cos(angle) * radius;
    const tz = Math.sin(angle) * radius;
    const sc = 0.9 + (i % 4) * 0.16;

    dummy.position.set(tx, 0.85 * sc, tz);
    dummy.rotation.set(0, i, 0);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);

    const offsets = [
      [0, 2.25 * sc, 0, 1.2],
      [-0.65 * sc, 1.9 * sc, 0.4 * sc, 0.92],
      [0.62 * sc, 1.95 * sc, -0.35 * sc, 0.96],
    ];
    offsets.forEach(([ox, oy, oz, os], k) => {
      const idx = i * 3 + k;
      dummy.position.set(tx + ox, oy, tz + oz);
      dummy.scale.setScalar(sc * os);
      dummy.updateMatrix();
      canopies.setMatrixAt(idx, dummy.matrix);
      tintColor.setHSL(0.32 + ((i + k) % 3) * 0.028, 0.64, 0.48 + (k % 2) * 0.07);
      canopies.setColorAt(idx, tintColor);
    });
  }
  trunks.computeBoundingSphere();
  canopies.computeBoundingSphere();
  scene.add(trunks, canopies);

  // Park Daisies & Wildflowers
  const flowerCount = 70;
  const flowerGeo = new THREE.ConeGeometry(0.15, 0.16, 6);
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const flowers = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
  const flowerPalette = [0xffffff, 0xfde047, 0xf472b6, 0x38bdf8, 0xfb923c];
  for (let i = 0; i < flowerCount; i++) {
    const a = i * 2.39996;
    const r = 4.6 + (i % 14) * 0.95;
    dummy.position.set(Math.cos(a) * r, 0.08, Math.sin(a) * r);
    dummy.rotation.set(Math.PI, a, 0);
    dummy.scale.setScalar(0.85 + (i % 3) * 0.22);
    dummy.updateMatrix();
    flowers.setMatrixAt(i, dummy.matrix);
    tintColor.setHex(flowerPalette[i % flowerPalette.length]);
    flowers.setColorAt(i, tintColor);
  }
  flowers.computeBoundingSphere();
  scene.add(flowers);
  disposables.push(flowerGeo, flowerMat);

  // 9. Fluffy Drifting Clouds
  const clouds: THREE.Group[] = [];
  const cloudGeo = new THREE.SphereGeometry(1.2, 16, 14);
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92 });
  disposables.push(cloudGeo, cloudMat);

  for (let i = 0; i < 7; i++) {
    const cGroup = new THREE.Group();
    const p1 = new THREE.Mesh(cloudGeo, cloudMat);
    const p2 = new THREE.Mesh(cloudGeo, cloudMat);
    p2.position.set(1.15, -0.18, 0);
    p2.scale.setScalar(0.78);
    const p3 = new THREE.Mesh(cloudGeo, cloudMat);
    p3.position.set(-1.15, -0.2, 0.1);
    p3.scale.setScalar(0.74);
    cGroup.add(p1, p2, p3);
    cGroup.position.set(-22 + i * 7.5, 11.5 + (i % 3) * 1.8, -16 - (i % 2) * 8);
    scene.add(cGroup);
    clouds.push(cGroup);
  }

  // 10. Floating Sparkles & Butterflies
  const sparkleGroup = new THREE.Group();
  const starGeo = new THREE.OctahedronGeometry(0.11);
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xfacc15,
    emissiveIntensity: 0.4,
    roughness: 0.25,
  });
  disposables.push(starGeo, starMat);
  for (let i = 0; i < 12; i++) {
    const s = new THREE.Mesh(starGeo, starMat);
    s.position.set(
      Math.cos(i * 0.52) * 3.4,
      1.85 + (i % 3) * 0.55,
      2.9 + Math.sin(i * 0.52) * 1.6
    );
    sparkleGroup.add(s);
  }
  scene.add(sparkleGroup);

  const butterflies: THREE.Group[] = [];
  const wingGeo = new THREE.CircleGeometry(0.13, 10);
  const wingColors = [0xf472b6, 0xfacc15, 0x38bdf8, 0xc084fc];
  disposables.push(wingGeo);
  for (let b = 0; b < 4; b++) {
    const bGroup = new THREE.Group();
    const wMat = new THREE.MeshStandardMaterial({
      color: wingColors[b % wingColors.length],
      side: THREE.DoubleSide,
      roughness: 0.45,
    });
    disposables.push(wMat);
    const wL = new THREE.Mesh(wingGeo, wMat);
    wL.position.x = -0.09;
    const wR = new THREE.Mesh(wingGeo, wMat);
    wR.position.x = 0.09;
    bGroup.add(wL, wR);
    bGroup.position.set(-2 + b * 1.4, 1.8, 3.2);
    scene.add(bGroup);
    butterflies.push(bGroup);
  }

  // 11. Cinematic Golden-Hour Dust Motes
  const moteCount = 90;
  const motePositions = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    motePositions[i * 3] = (Math.sin(i * 1.7) * 0.5 + (i % 7) / 7 - 0.5) * 18;
    motePositions[i * 3 + 1] = 0.6 + ((i * 13) % 29) * 0.18;
    motePositions[i * 3 + 2] = (Math.cos(i * 2.1) * 0.5 + (i % 5) / 5 - 0.5) * 14;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  const moteMat = new THREE.PointsMaterial({
    color: 0xfef08a,
    size: 0.14,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  sparkleGroup.add(motes);
  disposables.push(moteGeo, moteMat);

  const setSkyMood = (episodeId: number) => {
    const isBedtime = episodeId === 6;
    const isLanternGolden = episodeId === 12;
    if (isBedtime) {
      skyUniforms.topColor.value.setHex(0x1e1b4b);
      skyUniforms.bottomColor.value.setHex(0x4338ca);
      sunDisc.visible = false;
      scene.background = new THREE.Color(0x1e1b4b);
      scene.fog = new THREE.FogExp2(0x1e1b4b, 0.013);
    } else if (isLanternGolden) {
      skyUniforms.topColor.value.setHex(0x312e81);
      skyUniforms.bottomColor.value.setHex(0xfb923c);
      sunDisc.visible = true;
      scene.background = new THREE.Color(0xfdba74);
      scene.fog = new THREE.FogExp2(0xfdba74, 0.0085);
    } else {
      skyUniforms.topColor.value.setHex(0x2563eb);
      skyUniforms.bottomColor.value.setHex(0xfef3c7);
      sunDisc.visible = true;
      scene.background = new THREE.Color(0xe0f2fe);
      scene.fog = new THREE.FogExp2(0xe0f2fe, 0.0062);
    }
  };

  setSkyMood(1);

  return {
    trackCurve,
    clouds,
    sparkleGroup,
    butterflies,
    swingSeats,
    setSkyMood,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
