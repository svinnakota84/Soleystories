import * as THREE from 'three';

export interface TrainAssembly {
  units: THREE.Group[]; // [engine, passengerCar, ...]
  passengerCar: THREE.Group;
  wheels: THREE.Object3D[];
  specialSpinners: THREE.Object3D[];
  steamPuffs: { mesh: THREE.Mesh; life: number; speed: number; driftX: number }[];
  steamOriginLocal: THREE.Vector3;
  steamColor: number;
  dispose: () => void;
}

function makeWoodMat(color: number, roughness = 0.5, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function createWoodGrainTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#E1BE96';
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = 'rgba(146, 84, 34, 0.18)';
    ctx.lineWidth = 2;
    for (let y = 6; y < 128; y += 9) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(85, y + 3, 170, y - 3, 256, y);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCarLabelTexture(bgHex: string, title: string, sub = ''): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';
    ctx.font = '800 26px sans-serif';
    ctx.fillText(title, 128, sub ? 58 : 74);
    if (sub) {
      ctx.font = '800 32px sans-serif';
      ctx.fillText(sub, 128, 98);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addWheelsToUnit(
  unit: THREE.Group,
  wheelZOffsets: number[],
  wheelColor: number | number[],
  wheelsOut: THREE.Object3D[],
  iceCubeMode = false,
  starHubs = false
) {
  const hubMat = makeWoodMat(starHubs ? 0xfacc15 : 0xe2e8f0, 0.22, 0.65);

  wheelZOffsets.forEach((zOff, idx) => {
    const col = Array.isArray(wheelColor) ? wheelColor[idx % wheelColor.length] : wheelColor;
    const wheelMat = iceCubeMode
      ? new THREE.MeshPhysicalMaterial({
          color: 0xbae6fd,
          roughness: 0.12,
          metalness: 0.05,
          transparent: true,
          opacity: 0.82,
        })
      : makeWoodMat(col, 0.4, 0.08);
    [-0.68, 0.68].forEach((xOff) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(xOff, 0.34, zOff);

      const geom = iceCubeMode
        ? new THREE.BoxGeometry(0.18, 0.56, 0.56)
        : new THREE.CylinderGeometry(0.32, 0.32, 0.16, 22);
      const wheel = new THREE.Mesh(geom, wheelMat);
      if (!iceCubeMode) wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      wheelGroup.add(wheel);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.19, starHubs ? 5 : 14),
        hubMat
      );
      hub.rotation.z = Math.PI / 2;
      wheelGroup.add(hub);

      unit.add(wheelGroup);
      wheelsOut.push(wheelGroup);
    });
  });
}

function addSmokeboxFace(engine: THREE.Group, faceZ = 1.38, yPos = 0.92) {
  const faceMat = makeWoodMat(0xfde68a, 0.58);
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 24), faceMat);
  disk.rotation.x = Math.PI / 2;
  disk.position.set(0, yPos, faceZ);
  engine.add(disk);

  const scleraMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const cheekMat = new THREE.MeshStandardMaterial({
    color: 0xfb7185,
    roughness: 0.7,
    transparent: true,
    opacity: 0.7,
  });

  [-0.14, 0.14].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), scleraMat);
    eye.position.set(ex, yPos + 0.09, faceZ + 0.03);
    eye.scale.set(1, 1.1, 0.5);
    engine.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 14), pupilMat);
    pupil.position.set(ex, yPos + 0.09, faceZ + 0.055);
    pupil.scale.set(1, 1, 0.5);
    engine.add(pupil);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 10), glintMat);
    glint.position.set(ex + 0.02, yPos + 0.11, faceZ + 0.072);
    engine.add(glint);

    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), cheekMat);
    cheek.position.set(ex * 1.65, yPos - 0.04, faceZ + 0.03);
    cheek.scale.set(1.2, 0.8, 0.4);
    engine.add(cheek);
  });

  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.11, 0.024, 10, 20, Math.PI),
    makeWoodMat(0xbe123c, 0.4)
  );
  smile.position.set(0, yPos - 0.07, faceZ + 0.045);
  smile.rotation.x = Math.PI;
  engine.add(smile);
}

function addCouplers(unit: THREE.Group, frontZ: number, backZ: number) {
  const magnetMat = makeWoodMat(0x475569, 0.25, 0.85);
  const cFront = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 14), magnetMat);
  cFront.rotation.x = Math.PI / 2;
  cFront.position.set(0, 0.42, frontZ);
  unit.add(cFront);

  const cBack = cFront.clone();
  cBack.position.set(0, 0.42, backZ);
  unit.add(cBack);
}

function buildStandardEngine(
  bodyColor: number,
  trimColor: number,
  wheelColor: number | number[],
  wheelsOut: THREE.Object3D[],
  texturesOut: THREE.Texture[],
  iceCubeMode = false,
  boilerLabel?: string
): THREE.Group {
  const engine = new THREE.Group();
  const woodTex = createWoodGrainTexture();
  texturesOut.push(woodTex);
  const woodChassisMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.58 });

  // Natural wood-grain chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.22, 2.55), woodChassisMat);
  chassis.position.set(0, 0.44, 0);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  engine.add(chassis);

  // Peach bumper deck
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(1.22, 0.08, 2.6),
    makeWoodMat(trimColor, 0.48)
  );
  deck.position.set(0, 0.56, 0);
  engine.add(deck);

  // Slatted Cowcatcher
  const cow = new THREE.Mesh(
    new THREE.ConeGeometry(0.58, 0.46, 4),
    makeWoodMat(bodyColor, 0.48)
  );
  cow.rotation.y = Math.PI / 4;
  cow.rotation.x = Math.PI / 2;
  cow.scale.set(1.1, 0.65, 0.5);
  cow.position.set(0, 0.34, 1.38);
  engine.add(cow);

  [-0.22, 0, 0.22].forEach((sx) => {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.08), woodChassisMat);
    slat.position.set(sx, 0.33, 1.48);
    slat.rotation.x = -0.35;
    engine.add(slat);
  });

  // Boiler + optional painted name plaque
  const boiler = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 1.5, 24),
    makeWoodMat(bodyColor, 0.44)
  );
  boiler.rotation.x = Math.PI / 2;
  boiler.position.set(0, 0.94, 0.55);
  boiler.castShadow = true;
  engine.add(boiler);

  if (boilerLabel) {
    const labelTex = createCarLabelTexture('#86EFAC', 'CHOO-CHOO', boilerLabel);
    texturesOut.push(labelTex);
    const labelMat = new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.45 });
    [-0.47, 0.47].forEach((lx) => {
      const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.42, 1.15), labelMat);
      plaque.position.set(lx, 0.94, 0.5);
      engine.add(plaque);
    });
  }

  // Flared Smokestack
  const stack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.14, 0.52, 18),
    makeWoodMat(0x93c5fd, 0.4)
  );
  stack.position.set(0, 1.52, 0.95);
  stack.castShadow = true;
  engine.add(stack);

  // Steam Dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.21, 16, 16),
    makeWoodMat(0xfde047, 0.36, 0.12)
  );
  dome.position.set(0, 1.36, 0.35);
  engine.add(dome);

  // Cab + Roof + Windows
  const cab = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.96, 1.02),
    makeWoodMat(bodyColor, 0.48)
  );
  cab.position.set(0, 1.04, -0.68);
  cab.castShadow = true;
  engine.add(cab);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.26, 0.14, 1.18),
    makeWoodMat(trimColor, 0.46)
  );
  roof.position.set(0, 1.56, -0.68);
  roof.castShadow = true;
  engine.add(roof);

  const winMat = makeWoodMat(0xfffbeb, 0.2, 0.15);
  [-0.57, 0.57].forEach((wx) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.52), winMat);
    win.position.set(wx, 1.14, -0.68);
    engine.add(win);
  });

  addSmokeboxFace(engine, 1.32, 0.94);
  addWheelsToUnit(engine, [0.85, 0.05, -0.78], wheelColor, wheelsOut, iceCubeMode);
  addCouplers(engine, 1.32, -1.32);
  return engine;
}

function buildOpenCar(
  carColor: number,
  wheelColor: number | number[],
  wheelsOut: THREE.Object3D[],
  texturesOut: THREE.Texture[],
  iceCubeMode = false,
  sideLabel?: { bg: string; title: string; sub: string }
): THREE.Group {
  const car = new THREE.Group();
  const woodTex = createWoodGrainTexture();
  texturesOut.push(woodTex);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.06, 0.2, 1.75),
    new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.62 })
  );
  base.position.set(0, 0.42, 0);
  base.castShadow = true;
  car.add(base);

  const wallMat = makeWoodMat(carColor, 0.46);
  let sideMat: THREE.Material = wallMat;
  if (sideLabel) {
    const labelTex = createCarLabelTexture(sideLabel.bg, sideLabel.title, sideLabel.sub);
    texturesOut.push(labelTex);
    sideMat = new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.48 });
  }

  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.52, 1.66), sideMat);
  sideL.position.set(-0.46, 0.76, 0);
  sideL.castShadow = true;
  const sideR = sideL.clone();
  sideR.position.x = 0.46;

  const frontW = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.52, 0.1), wallMat);
  frontW.position.set(0, 0.76, 0.78);
  const backW = frontW.clone();
  backW.position.z = -0.78;

  car.add(sideL, sideR, frontW, backW);
  addWheelsToUnit(car, [0.48, -0.48], wheelColor, wheelsOut, iceCubeMode);
  addCouplers(car, 0.92, -0.92);
  return car;
}

function buildCookiePassengerCar(
  wheelsOut: THREE.Object3D[],
  texturesOut: THREE.Texture[]
): THREE.Group {
  const car = new THREE.Group();
  const woodTex = createWoodGrainTexture();
  texturesOut.push(woodTex);

  const biscuitMat = new THREE.MeshStandardMaterial({ color: 0xe39e44, roughness: 0.78 });
  const crustMat = new THREE.MeshStandardMaterial({ color: 0xc97b28, roughness: 0.72 });
  const velvetRed = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.65 });
  const chocoChipMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.55 });

  // Wooden chassis & platform
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.38, 0.22, 2.05),
    new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.6 })
  );
  base.position.set(0, 0.42, 0);
  base.castShadow = true;
  car.add(base);

  // Red plush bench inside
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.18, 1.55), velvetRed);
  bench.position.set(0, 0.56, 0);
  car.add(bench);

  [-0.44, 0, 0.44].forEach((bz) => {
    const cushion = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), velvetRed);
    cushion.position.set(0.38, 0.88, bz);
    cushion.scale.set(0.62, 1.25, 0.96);
    car.add(cushion);
  });

  // Golden biscuit side walls + scalloped cookie rim + chocolate dots
  [-0.64, 0.64].forEach((sx) => {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.56, 1.92), biscuitMat);
    sideWall.position.set(sx, 0.78, 0);
    sideWall.castShadow = true;
    car.add(sideWall);

    for (let z = -0.82; z <= 0.82; z += 0.27) {
      const scallop = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), crustMat);
      scallop.position.set(sx, 1.07, z);
      scallop.scale.set(0.7, 0.72, 1.05);
      car.add(scallop);

      const chip = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), chocoChipMat);
      chip.position.set(sx + (sx > 0 ? 0.065 : -0.065), 0.76 + (Math.round(z * 10) % 2) * 0.08, z);
      car.add(chip);
    }
  });

  const frontWall = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.56, 0.14), biscuitMat);
  frontWall.position.set(0, 0.78, 0.92);
  const backWall = frontWall.clone();
  backWall.position.z = -0.92;
  car.add(frontWall, backWall);

  for (let x = -0.52; x <= 0.52; x += 0.26) {
    const fScallop = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), crustMat);
    fScallop.position.set(x, 1.07, 0.92);
    fScallop.scale.set(1.0, 0.72, 0.7);
    const bScallop = fScallop.clone();
    bScallop.position.z = -0.92;
    car.add(fScallop, bScallop);
  }

  addWheelsToUnit(car, [0.56, -0.56], 0xdc2626, wheelsOut, false, true);
  addCouplers(car, 1.06, -1.06);
  return car;
}

export function buildEpisodeTrain(episodeId: number, isSoftwareGl = false): TrainAssembly {
  const units: THREE.Group[] = [];
  const wheels: THREE.Object3D[] = [];
  const specialSpinners: THREE.Object3D[] = [];
  const steamPuffs: { mesh: THREE.Mesh; life: number; speed: number; driftX: number }[] = [];
  const textures: THREE.Texture[] = [];
  const steamOriginLocal = new THREE.Vector3(0, 1.85, 0.95);
  let steamColor = 0xffffff;

  // Episode-specific Engine + Hero Passenger Cookie Car + Snack Cars
  if (episodeId === 1) {
    // Ep 1: Royal Blue, Gold & Crimson Lantern Snack Train + Scalloped Cookie Passenger Car!
    const engine = buildStandardEngine(
      0x2563eb,
      0xf59e0b,
      0xdc2626,
      wheels,
      textures,
      false,
      'SNACK TRAIN'
    );
    units.push(engine);

    const cookieCar = buildCookiePassengerCar(wheels, textures);
    units.push(cookieCar);

    const car2 = buildOpenCar(0xd8b4fe, 0xdc2626, wheels, textures, false, {
      bg: '#D8B4FE',
      title: 'SNACK CAR',
      sub: '2',
    });
    for (let i = 0; i < 4; i++) {
      const cracker = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.24, 0.08),
        makeWoodMat(i % 2 === 0 ? 0xfbbf24 : 0xf59e0b, 0.68)
      );
      cracker.position.set(i % 2 === 0 ? -0.18 : 0.18, 0.97, i < 2 ? 0.24 : -0.24);
      car2.add(cracker);
    }
    units.push(car2);

    const car3 = buildOpenCar(0xfdba74, 0xdc2626, wheels, textures, false, {
      bg: '#FDBA74',
      title: 'FRUIT CAR',
      sub: '3',
    });
    [0xef4444, 0xfacc15, 0x22c55e].forEach((c, idx) => {
      const treat = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 14), makeWoodMat(c, 0.42));
      treat.position.set((idx - 1) * 0.22, 0.95, idx % 2 === 0 ? 0.2 : -0.2);
      car3.add(treat);
    });
    units.push(car3);
  } else if (episodeId === 2) {
    // Ep 2: Rainbow Veggie Express (5 cars: Red, Orange, Yellow, Green, Purple)
    units.push(buildStandardEngine(0x38bdf8, 0xfef08a, 0xf43f5e, wheels, textures));
    const rainbowSpecs = [
      { color: 0xef4444, veggieColor: 0xdc2626, shape: 'sphere' },
      { color: 0xf97316, veggieColor: 0xea580c, shape: 'cone' },
      { color: 0xfacc15, veggieColor: 0xfde047, shape: 'cylinder' },
      { color: 0x22c55e, veggieColor: 0x15803d, shape: 'tree' },
      { color: 0xa855f7, veggieColor: 0x7e22ce, shape: 'eggplant' },
    ];
    rainbowSpecs.forEach((spec) => {
      const car = buildOpenCar(spec.color, spec.color, wheels, textures);
      for (let k = -1; k <= 1; k += 2) {
        let veg: THREE.Mesh;
        if (spec.shape === 'cone') {
          veg = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 12), makeWoodMat(spec.veggieColor, 0.45));
        } else if (spec.shape === 'cylinder') {
          veg = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.22, 8, 12), makeWoodMat(spec.veggieColor, 0.4));
        } else if (spec.shape === 'tree') {
          veg = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22), makeWoodMat(spec.veggieColor, 0.7));
        } else {
          veg = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 14), makeWoodMat(spec.veggieColor, 0.35));
        }
        veg.position.set(k * 0.16, 0.96, k * 0.2);
        car.add(veg);
      }
      units.push(car);
    });
  } else if (episodeId === 3) {
    // Ep 3: Shape-Shifter Train (Conductor hat + Circle, Square, Triangle cars)
    const engine = buildStandardEngine(0x60a5fa, 0xfbbf24, 0x3b82f6, wheels, textures);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 22), makeWoodMat(0x1d4ed8, 0.45));
    brim.position.set(0, 1.65, -0.68);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.34, 22), makeWoodMat(0x1e40af, 0.45));
    crown.position.set(0, 1.84, -0.68);
    engine.add(brim, crown);
    units.push(engine);

    const shapeCars = [
      { color: 0xf97316, type: 'circle' },
      { color: 0x3b82f6, type: 'square' },
      { color: 0x22c55e, type: 'triangle' },
    ];
    shapeCars.forEach((sc) => {
      const car = buildOpenCar(sc.color, sc.color, wheels, textures);
      let shapeMesh: THREE.Mesh;
      if (sc.type === 'circle') {
        shapeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 22, 22), makeWoodMat(sc.color, 0.35));
      } else if (sc.type === 'square') {
        shapeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62), makeWoodMat(sc.color, 0.35));
      } else {
        shapeMesh = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.72, 3), makeWoodMat(sc.color, 0.35));
      }
      shapeMesh.position.set(0, 1.24, 0);
      shapeMesh.castShadow = true;
      car.add(shapeMesh);
      specialSpinners.push(shapeMesh);
      units.push(car);
    });
  } else if (episodeId === 4) {
    // Ep 4: Smoothie Blender Train (Giant Blender Jar Engine)
    const engine = buildStandardEngine(0xf472b6, 0xfbbf24, 0xec4899, wheels, textures);
    const jarMat = new THREE.MeshPhysicalMaterial({
      color: 0xfce7f3,
      roughness: 0.1,
      metalness: 0.05,
      transparent: true,
      opacity: isSoftwareGl ? 0.55 : 0.45,
    });
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.42, 1.05, 22), jarMat);
    jar.position.set(0, 1.65, 0.45);
    engine.add(jar);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.14, 22), makeWoodMat(0xec4899, 0.35));
    lid.position.set(0, 2.2, 0.45);
    engine.add(lid);

    const fruitCluster = new THREE.Group();
    fruitCluster.position.set(0, 1.55, 0.45);
    [0xef4444, 0xfacc15, 0x6366f1, 0xf97316].forEach((fc, idx) => {
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), makeWoodMat(fc, 0.3));
      const ang = (idx / 4) * Math.PI * 2;
      berry.position.set(Math.cos(ang) * 0.2, (idx % 2) * 0.18, Math.sin(ang) * 0.2);
      fruitCluster.add(berry);
    });
    engine.add(fruitCluster);
    specialSpinners.push(fruitCluster);
    steamOriginLocal.set(0, 2.4, 0.45);
    steamColor = 0xfbcfe8;
    units.push(engine);

    [0xf43f5e, 0xfacc15, 0x8b5cf6].forEach((c) => {
      const car = buildOpenCar(c, c, wheels, textures);
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), makeWoodMat(c, 0.32));
      fruit.position.set(0, 1.04, 0);
      car.add(fruit);
      units.push(car);
    });
  } else if (episodeId === 5) {
    // Ep 5: Picnic Train (Straw Hat + Unfolding Checkered Blanket Car)
    const engine = buildStandardEngine(0xfbbf24, 0xef4444, 0xf59e0b, wheels, textures);
    const strawMat = makeWoodMat(0xfde047, 0.75);
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.06, 26), strawMat);
    hatBrim.position.set(0, 1.66, -0.68);
    const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.48, 0.3, 22), strawMat);
    hatTop.position.set(0, 1.82, -0.68);
    const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.08, 22), makeWoodMat(0xef4444, 0.5));
    ribbon.position.set(0, 1.72, -0.68);
    engine.add(hatBrim, hatTop, ribbon);
    units.push(engine);

    const blanketCar = buildOpenCar(0xf8fafc, 0xef4444, wheels, textures);
    const redCheck = makeWoodMat(0xef4444, 0.7);
    const whiteCheck = makeWoodMat(0xffffff, 0.7);
    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        const tile = new THREE.Mesh(
          new THREE.BoxGeometry(0.48, 0.05, 0.42),
          (r + c) % 2 === 0 ? redCheck : whiteCheck
        );
        tile.position.set(r * 0.48, 1.05, c * 0.42);
        blanketCar.add(tile);
      }
    }
    units.push(blanketCar);

    const basketCar = buildOpenCar(0xfdba74, 0xf59e0b, wheels, textures);
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.42, 0.9), makeWoodMat(0xb45309, 0.8));
    basket.position.set(0, 1.05, 0);
    basketCar.add(basket);
    units.push(basketCar);
  } else if (episodeId === 6) {
    // Ep 6: Bedtime Train (Nightcap + Lavender Steam + Star/Moon Cars)
    const engine = buildStandardEngine(0x818cf8, 0xc4b5fd, 0xa78bfa, wheels, textures);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.78, 18), makeWoodMat(0x4f46e5, 0.72));
    cap.position.set(-0.08, 1.92, -0.72);
    cap.rotation.z = 0.35;
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), makeWoodMat(0xfef08a, 0.6));
    pom.position.set(-0.26, 2.26, -0.72);
    engine.add(cap, pom);
    steamColor = 0xd8b4fe;
    units.push(engine);

    [0x6366f1, 0x8b5cf6, 0x312e81].forEach((c, idx) => {
      const car = buildOpenCar(c, 0xfde047, wheels, textures);
      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.32),
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xfacc15,
          emissiveIntensity: 0.45,
          roughness: 0.25,
        })
      );
      star.position.set(0, 1.2 + idx * 0.04, 0);
      car.add(star);
      specialSpinners.push(star);
      units.push(car);
    });
  } else if (episodeId === 7) {
    // Ep 7: Birthday Train (Party Hat + 6 Cupcake Cars)
    const engine = buildStandardEngine(0xf472b6, 0xfacc15, 0xec4899, wheels, textures);
    const partyHat = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.72, 18), makeWoodMat(0x38bdf8, 0.4));
    partyHat.position.set(0, 1.95, -0.68);
    const topBall = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), makeWoodMat(0xfacc15, 0.4));
    topBall.position.set(0, 2.32, -0.68);
    engine.add(partyHat, topBall);
    units.push(engine);

    const frostingColors = [0xf472b6, 0x60a5fa, 0xfbbf24, 0x4ade80, 0xc084fc, 0xfb7185];
    frostingColors.forEach((fc) => {
      const car = buildOpenCar(0xfef3c7, fc, wheels, textures);
      const wrapper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.25, 0.34, 18),
        makeWoodMat(0xf59e0b, 0.65)
      );
      wrapper.position.set(0, 1.0, 0);
      car.add(wrapper);

      const frosting = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), makeWoodMat(fc, 0.45));
      frosting.position.set(0, 1.22, 0);
      frosting.scale.set(1, 0.72, 1);
      car.add(frosting);

      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 10), makeWoodMat(0xffffff, 0.3));
      candle.position.set(0, 1.54, 0);
      car.add(candle);

      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.14, 10),
        new THREE.MeshBasicMaterial({ color: 0xfde047 })
      );
      flame.position.set(0, 1.76, 0);
      car.add(flame);

      units.push(car);
    });
  } else if (episodeId === 8) {
    // Ep 8: Dino Train (T-Rex Head Engine + Dino Egg Cars)
    const engine = buildStandardEngine(0x22c55e, 0xf97316, 0x16a34a, wheels, textures);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.56, 0.72), makeWoodMat(0x16a34a, 0.55));
    snout.position.set(0, 1.05, 1.48);
    engine.add(snout);
    for (let s = 0; s < 3; s++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.28, 6), makeWoodMat(0xf97316, 0.5));
      spike.position.set(0, 1.46, 0.7 - s * 0.45);
      engine.add(spike);
    }
    units.push(engine);

    [0xfef08a, 0xbae6fd, 0xfecdd3].forEach((eggCol, idx) => {
      const car = buildOpenCar(idx % 2 === 0 ? 0x4ade80 : 0xfb923c, 0x16a34a, wheels, textures);
      const egg = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 18), makeWoodMat(eggCol, 0.45));
      egg.scale.set(0.88, 1.25, 0.88);
      egg.position.set(0, 1.15, 0);
      car.add(egg);
      units.push(car);
    });
  } else if (episodeId === 9) {
    // Ep 9: Ice Pop Train (Giant Rainbow Ice Pop Engine + Ice Cube Wheels)
    const engine = buildStandardEngine(0x22d3ee, 0xf43f5e, 0xbae6fd, wheels, textures, true);
    const popColors = [0xf43f5e, 0xfacc15, 0x22d3ee];
    popColors.forEach((pc, idx) => {
      const layer = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.24, 1.2), makeWoodMat(pc, 0.25));
      layer.position.set(0, 1.52 + idx * 0.24, 0.35);
      engine.add(layer);
    });
    steamColor = 0xe0f2fe;
    units.push(engine);

    [0xf43f5e, 0xfbbf24, 0x38bdf8].forEach((c) => {
      const car = buildOpenCar(0xe0f2fe, 0xbae6fd, wheels, textures, true);
      const pop = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.35, 8, 14), makeWoodMat(c, 0.22));
      pop.position.set(0, 1.2, 0);
      car.add(pop);
      units.push(car);
    });
  } else {
    // Ep 10: Friendship Feast Train (Grand Dining Engine + Extending Banquet Tables)
    const engine = buildStandardEngine(0xf59e0b, 0x14b8a6, 0xfbbf24, wheels, textures);
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.08, 10, 20), makeWoodMat(0xfde047, 0.25, 0.6));
    crown.rotation.x = Math.PI / 2;
    crown.position.set(0, 1.66, -0.68);
    engine.add(crown);
    units.push(engine);

    const cookieCar = buildCookiePassengerCar(wheels, textures);
    units.push(cookieCar);

    [0x14b8a6, 0xf472b6].forEach((c, idx) => {
      const car = buildOpenCar(c, 0xfbbf24, wheels, textures);
      const table = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.08, 1.2), makeWoodMat(0xffffff, 0.4));
      table.position.set(0, 1.08, 0);
      car.add(table);
      const platter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.26, 0.14, 18),
        makeWoodMat(idx === 0 ? 0xef4444 : 0xfacc15, 0.35)
      );
      platter.position.set(0, 1.18, 0);
      car.add(platter);
      units.push(car);
    });
  }

  return {
    units,
    passengerCar: units[1] || units[0],
    wheels,
    specialSpinners,
    steamPuffs,
    steamOriginLocal,
    steamColor,
    dispose: () => {
      textures.forEach((t) => t.dispose());
      units.forEach((unit) => {
        unit.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });
      });
    },
  };
}
