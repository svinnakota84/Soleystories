import * as THREE from 'three';
import type { CharacterAction } from '../data/episodes';

export interface CharacterRig {
  id: 'mia' | 'benny' | 'pip';
  root: THREE.Group;
  head: THREE.Group;
  torso: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftEye: THREE.Group;
  rightEye: THREE.Group;
  mouth: THREE.Mesh;
  babyOutfit?: THREE.Group;
  bigOutfit?: THREE.Group;
  tailPivot?: THREE.Group;
  leftEar?: THREE.Group;
  rightEar?: THREE.Group;
  eyelids?: THREE.Group;
  baseY: number;
  phaseOffset: number;
  textures: THREE.Texture[];
}

function applyAttachedCharacterFace(
  imagePath: string,
  crop: { cx: number; cy: number; sw: number; sh: number },
  head: THREE.Group,
  skinMat: THREE.MeshPhysicalMaterial,
  geoFaceGroup: THREE.Group,
  radius: number,
  texturesOut: THREE.Texture[]
): THREE.Group {
  const eyelids = new THREE.Group();
  eyelids.visible = false;
  [-0.088, 0.088].forEach((ex) => {
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(0.056, 12, 10),
      skinMat
    );
    lid.position.set(ex, 0.036, radius * 0.93);
    lid.scale.set(1.15, 0.6, 0.45);
    eyelids.add(lid);
  });
  head.add(eyelids);

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sx = (crop.cx - crop.sw / 2) * img.width;
    const sy = (crop.cy - crop.sh / 2) * img.height;
    const sw = crop.sw * img.width;
    const sh = crop.sh * img.height;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const d = imgData.data;

    // Sample warm cheek skin pixel to match 3D head & limbs seamlessly
    const sampleIdx = (Math.floor(size * 0.64) * size + Math.floor(size * 0.26)) * 4;
    const sr = d[sampleIdx];
    const sg = d[sampleIdx + 1];
    const sb = d[sampleIdx + 2];
    if (sr + sg + sb < 710) {
      skinMat.color.setRGB(sr / 255, sg / 255, sb / 255, THREE.SRGBColorSpace);
    }

    // Smooth radial vignette alpha so the Pixar face blends onto the 3D head sphere
    const half = size / 2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const dx = (x - half) / half;
        const dy = (y - half) / half;
        const rNorm = Math.sqrt(dx * dx * 1.05 + dy * dy * 0.92);
        let alpha = 1;
        if (rNorm > 0.64) {
          alpha = Math.max(0, 1 - (rNorm - 0.64) / 0.32);
        }
        // Strip pure white turnaround background near edges
        if (rNorm > 0.5 && d[idx] > 240 && d[idx + 1] > 240 && d[idx + 2] > 240) {
          alpha = 0;
        }
        d[idx + 3] = Math.round(d[idx + 3] * alpha);
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const faceTex = new THREE.CanvasTexture(canvas);
    faceTex.colorSpace = THREE.SRGBColorSpace;
    texturesOut.push(faceTex);

    const patchGeo = new THREE.SphereGeometry(
      radius,
      32,
      32,
      Math.PI * 0.5 - 0.64,
      1.28,
      Math.PI * 0.5 - 0.62,
      1.24
    );
    const patchMat = new THREE.MeshStandardMaterial({
      map: faceTex,
      transparent: true,
      roughness: 0.52,
      metalness: 0.0,
      depthWrite: false,
    });
    const facePatch = new THREE.Mesh(patchGeo, patchMat);
    facePatch.scale.set(1.035, 0.995, 0.975);
    head.add(facePatch);
    geoFaceGroup.visible = false;
  };
  img.src = imagePath;

  return eyelids;
}

function makeSkinMat(color: number): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.46,
    metalness: 0.0,
    sheen: 0.35,
    sheenColor: new THREE.Color(0xffedd5),
    sheenRoughness: 0.65,
  });
}

function makeClothMat(
  color: number,
  roughness = 0.78,
  map?: THREE.Texture
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: map ? 0xffffff : color,
    map: map ?? null,
    roughness,
    metalness: 0.0,
    sheen: 0.62,
    sheenColor: new THREE.Color(0xffffff),
    sheenRoughness: 0.75,
  });
}

function makeShoeMat(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.04 });
}

function createStripedHoodieTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (let y = 0; y < 256; y += 32) {
      ctx.fillStyle = (y / 32) % 2 === 0 ? '#57A76B' : '#EAE6DF';
      ctx.fillRect(0, y, 256, 32);
    }
    ctx.fillStyle = 'rgba(15, 23, 42, 0.04)';
    for (let i = 0; i < 900; i++) {
      ctx.fillRect((i * 37) % 256, (i * 53) % 256, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createDenimTexture(baseHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 400; i++) {
      ctx.fillRect((i * 19) % 128, (i * 29) % 128, 2, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createHeartTeeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    const x = 152;
    const y = 104;
    ctx.moveTo(x, y + 18);
    ctx.bezierCurveTo(x, y, x - 28, y, x - 28, y + 18);
    ctx.bezierCurveTo(x - 28, y + 36, x, y + 46, x, y + 56);
    ctx.bezierCurveTo(x, y + 46, x + 28, y + 36, x + 28, y + 18);
    ctx.bezierCurveTo(x + 28, y, x, y, x, y + 18);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createEyePair(
  irisColor: number,
  browColor: number,
  eyeScale = 1,
  withLashes = false,
  eyeSpread = 0.112,
  eyeZ = 0.242
): {
  group: THREE.Group;
  leftEye: THREE.Group;
  rightEye: THREE.Group;
} {
  const group = new THREE.Group();
  const scleraMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
  const irisMat = new THREE.MeshPhysicalMaterial({
    color: irisColor,
    roughness: 0.12,
    clearcoat: 0.85,
  });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.06 });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const browMat = makeClothMat(browColor, 0.72);

  const makeSingleEye = (xSign: number) => {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(xSign * eyeSpread, 0.03, eyeZ);

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.058 * eyeScale, 20, 20), scleraMat);
    sclera.scale.set(1.0, 1.15, 0.58);
    eyeGroup.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.04 * eyeScale, 18, 18), irisMat);
    iris.position.set(0, 0, 0.024);
    iris.scale.set(1.0, 1.1, 0.55);
    eyeGroup.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.023 * eyeScale, 14, 14), pupilMat);
    pupil.position.set(0, 0, 0.036);
    pupil.scale.set(1, 1, 0.5);
    eyeGroup.add(pupil);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.011 * eyeScale, 10, 10), glintMat);
    glint.position.set(0.014, 0.017, 0.045);
    eyeGroup.add(glint);

    const glint2 = new THREE.Mesh(new THREE.SphereGeometry(0.0055 * eyeScale, 8, 8), glintMat);
    glint2.position.set(-0.011, -0.011, 0.044);
    eyeGroup.add(glint2);

    if (withLashes) {
      const lash = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.075, 4, 8), browMat);
      lash.position.set(xSign * 0.006, 0.056 * eyeScale, 0.018);
      lash.rotation.z = Math.PI / 2 - xSign * 0.2;
      eyeGroup.add(lash);
    }

    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.058, 6, 8), browMat);
    brow.rotation.z = Math.PI / 2 - xSign * 0.14;
    brow.position.set(xSign * eyeSpread, 0.118, eyeZ + 0.006);
    group.add(brow);

    return eyeGroup;
  };

  const leftEye = makeSingleEye(-1);
  const rightEye = makeSingleEye(1);
  group.add(leftEye, rightEye);

  return { group, leftEye, rightEye };
}

function addCheeksAndSmile(
  head: THREE.Group,
  cheekColor: number,
  toothGap = false,
  faceZ = 0.244
): THREE.Mesh {
  const cheekMat = new THREE.MeshStandardMaterial({
    color: cheekColor,
    roughness: 0.75,
    transparent: true,
    opacity: 0.52,
  });
  const cL = new THREE.Mesh(new THREE.SphereGeometry(0.056, 14, 14), cheekMat);
  cL.position.set(-0.155, -0.045, faceZ - 0.032);
  cL.scale.set(1.28, 0.85, 0.42);
  const cR = cL.clone();
  cR.position.x = 0.155;
  head.add(cL, cR);

  const mouthGroupMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.45 });
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.068, 0.018, 12, 22, Math.PI),
    mouthGroupMat
  );
  mouth.position.set(0, -0.075, faceZ);
  mouth.rotation.x = Math.PI;
  head.add(mouth);

  // Inner tongue warmth
  const tongue = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.5 })
  );
  tongue.position.set(0, -0.105, faceZ - 0.008);
  tongue.scale.set(1.2, 0.55, 0.6);
  head.add(tongue);

  if (toothGap) {
    const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.18 });
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.012), toothMat);
    t1.position.set(-0.022, -0.088, faceZ + 0.006);
    const t2 = t1.clone();
    t2.position.x = 0.022;
    head.add(t1, t2);
  }

  return mouth;
}

function addRoundedSneaker(
  leg: THREE.Group,
  yOffset: number,
  upperMat: THREE.Material,
  soleMat: THREE.Material,
  whiteCap: boolean
) {
  const shoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.11, 8, 14), upperMat);
  shoe.rotation.x = Math.PI / 2;
  shoe.scale.set(1.0, 1.0, 0.82);
  shoe.position.set(0, yOffset, 0.035);
  shoe.castShadow = true;
  leg.add(shoe);

  const sole = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.115, 6, 12), soleMat);
  sole.rotation.x = Math.PI / 2;
  sole.scale.set(1.0, 1.0, 0.35);
  sole.position.set(0, yOffset - 0.034, 0.035);
  leg.add(sole);

  if (whiteCap) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), soleMat);
    cap.position.set(0, yOffset - 0.008, 0.115);
    cap.scale.set(0.95, 0.68, 0.85);
    leg.add(cap);
  }
}

export function buildMia(): CharacterRig {
  const root = new THREE.Group();
  const textures: THREE.Texture[] = [];

  const skinMat = makeSkinMat(0xc4804b);
  const yellowDenimTex = createDenimTexture('#F3C444');
  const orangeDressTex = createDenimTexture('#F97316');
  const teeTex = createHeartTeeTexture();
  textures.push(yellowDenimTex, orangeDressTex, teeTex);

  const dungareeMat = makeClothMat(0xf3c444, 0.72, yellowDenimTex);
  const babyDressMat = makeClothMat(0xf97316, 0.72, orangeDressTex);
  const babyYellowTee = makeClothMat(0xfde047, 0.75);
  const heartTeeMat = makeClothMat(0xffffff, 0.76, teeTex);
  const whiteMat = makeClothMat(0xffffff, 0.76);
  const redShoeMat = makeShoeMat(0xdc2626);
  const soleWhiteMat = makeShoeMat(0xf8fafc);
  const hairMat = makeClothMat(0x231610, 0.92);
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.7 });

  // Legs (smooth bare baby calves or Big Mia yellow dungaree pants)
  const makeLeg = (x: number) => {
    const leg = new THREE.Group();
    leg.position.set(x, 0.42, 0);

    const bigPant = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.22, 10, 16), dungareeMat);
    bigPant.position.y = -0.17;
    bigPant.castShadow = true;
    leg.add(bigPant);

    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.022, 8, 18), dungareeMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -0.31;
    leg.add(cuff);

    addRoundedSneaker(leg, -0.365, redShoeMat, soleWhiteMat, true);
    return leg;
  };
  const leftLeg = makeLeg(-0.115);
  const rightLeg = makeLeg(0.115);
  root.add(leftLeg, rightLeg);

  // Torso with dual outfits (Baby Mia orange pinafore + yellow tee vs Big Mia yellow dungarees + heart tee)
  const torso = new THREE.Group();
  torso.position.y = 0.68;

  // Big Mia outfit (matches image_c52b83de.png)
  const bigOutfit = new THREE.Group();
  const bodyTee = new THREE.Mesh(new THREE.CapsuleGeometry(0.185, 0.24, 12, 20), heartTeeMat);
  bodyTee.scale.set(1.04, 1.0, 0.88);
  bodyTee.castShadow = true;
  bigOutfit.add(bodyTee);

  const bib = new THREE.Mesh(new THREE.CapsuleGeometry(0.175, 0.16, 10, 18), dungareeMat);
  bib.position.set(0, -0.09, 0.01);
  bib.scale.set(1.06, 1.0, 0.86);
  bib.castShadow = true;
  bigOutfit.add(bib);

  [-0.095, 0.095].forEach((sx) => {
    const strap = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.22, 6, 10), dungareeMat);
    strap.position.set(sx, 0.11, 0.12);
    bigOutfit.add(strap);
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.015, 12), goldMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(sx, 0.02, 0.165);
    bigOutfit.add(btn);
  });

  // Baby Mia outfit (matches FTGtiB-hXD4 frame 3: orange pinafore dress over yellow tee!)
  const babyOutfit = new THREE.Group();
  const babyTee = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.22, 12, 20), babyYellowTee);
  babyTee.scale.set(1.02, 1.0, 0.88);
  babyOutfit.add(babyTee);

  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.36, 22), babyDressMat);
  skirt.position.set(0, -0.14, 0);
  skirt.castShadow = true;
  babyOutfit.add(skirt);

  const dressBib = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.12, 8, 16), babyDressMat);
  dressBib.position.set(0, 0.02, 0.02);
  dressBib.scale.set(1.0, 1.0, 0.84);
  babyOutfit.add(dressBib);
  babyOutfit.visible = false;

  torso.add(bigOutfit, babyOutfit);
  root.add(torso);

  // Arms
  const makeArm = (xSign: number) => {
    const arm = new THREE.Group();
    arm.position.set(xSign * 0.225, 0.84, 0);
    const sleeve = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), whiteMat);
    sleeve.scale.set(1.0, 0.9, 0.95);
    arm.add(sleeve);

    const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.21, 8, 12), skinMat);
    limb.position.set(xSign * 0.045, -0.145, 0);
    limb.rotation.z = xSign * 0.2;
    limb.castShadow = true;
    arm.add(limb);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.056, 14, 14), skinMat);
    hand.position.set(xSign * 0.075, -0.28, 0.01);
    arm.add(hand);
    return arm;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);
  root.add(leftArm, rightArm);

  // Head + Fluffy Multi-Curl Hair Puffs
  const head = new THREE.Group();
  head.position.y = 1.15;

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.272, 32, 32), skinMat);
  skull.scale.set(1.03, 0.99, 0.96);
  skull.castShadow = true;
  head.add(skull);

  // Cute ears
  [-0.265, 0.265].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), skinMat);
    ear.position.set(ex, -0.01, -0.01);
    ear.scale.set(0.55, 1.0, 0.75);
    head.add(ear);
  });

  const geoFaceGroup = new THREE.Group();
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 14), skinMat);
  nose.position.set(0, -0.018, 0.265);
  nose.scale.set(1.15, 0.9, 0.95);
  geoFaceGroup.add(nose);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.282, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hairMat
  );
  hairCap.position.y = 0.02;
  hairCap.rotation.x = -0.24;
  head.add(hairCap);

  // Voluminous multi-curl afro puffs
  [-1, 1].forEach((side) => {
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 10, 18), babyYellowTee);
    tie.position.set(side * 0.22, 0.23, -0.02);
    tie.rotation.y = side * 0.9;
    tie.rotation.x = 0.4;
    head.add(tie);

    const puffGroup = new THREE.Group();
    puffGroup.position.set(side * 0.28, 0.31, -0.04);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), hairMat);
    puffGroup.add(core);
    for (let c = 0; c < 14; c++) {
      const phi = Math.acos(1 - (2 * (c + 0.5)) / 14);
      const theta = Math.PI * (1 + Math.sqrt(5)) * c;
      const curl = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 10), hairMat);
      curl.position.set(
        Math.sin(phi) * Math.cos(theta) * 0.11,
        Math.cos(phi) * 0.11,
        Math.sin(phi) * Math.sin(theta) * 0.11
      );
      curl.castShadow = true;
      puffGroup.add(curl);
    }
    head.add(puffGroup);
  });

  const eyes = createEyePair(0x5b3a1d, 0x231610, 1.04, true);
  geoFaceGroup.add(eyes.group);
  const mouth = addCheeksAndSmile(geoFaceGroup, 0xf43f5e, true);
  head.add(geoFaceGroup);

  const eyelids = applyAttachedCharacterFace(
    '/src/assets/images/char_mia_turnaround_1795554181285.jpg',
    { cx: 0.146, cy: 0.285, sw: 0.082, sh: 0.146 },
    head,
    skinMat,
    geoFaceGroup,
    0.276,
    textures
  );
  root.add(head);

  return {
    id: 'mia',
    root,
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    leftEye: eyes.leftEye,
    rightEye: eyes.rightEye,
    mouth,
    babyOutfit,
    bigOutfit,
    eyelids,
    baseY: 0,
    phaseOffset: 0,
    textures,
  };
}

export function buildBenny(): CharacterRig {
  const root = new THREE.Group();
  const textures: THREE.Texture[] = [];

  const skinMat = makeSkinMat(0xfad2b4);
  const stripeTex = createStripedHoodieTexture();
  const denimTex = createDenimTexture('#3B699E');
  textures.push(stripeTex, denimTex);

  const hoodieStriped = makeClothMat(0xffffff, 0.82, stripeTex);
  const babyGreenTee = makeClothMat(0x52b749, 0.76);
  const hoodieGreen = makeClothMat(0x57a76b, 0.82);
  const hoodieCream = makeClothMat(0xeae6df, 0.82);
  const jeansMat = makeClothMat(0x3b699e, 0.78, denimTex);
  const blueShoe = makeShoeMat(0x2b6cb0);
  const tanSole = makeShoeMat(0xc58b4e);
  const whiteSole = makeShoeMat(0xf8fafc);
  const hairMat = makeClothMat(0xd49b54, 0.8);

  // Legs
  const makeLeg = (x: number) => {
    const leg = new THREE.Group();
    leg.position.set(x, 0.38, 0);

    const jean = new THREE.Mesh(new THREE.CapsuleGeometry(0.086, 0.2, 10, 16), jeansMat);
    jean.position.y = -0.15;
    jean.castShadow = true;
    leg.add(jean);

    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.022, 8, 16), jeansMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -0.27;
    leg.add(cuff);

    addRoundedSneaker(leg, -0.325, blueShoe, tanSole, false);
    return leg;
  };
  const leftLeg = makeLeg(-0.11);
  const rightLeg = makeLeg(0.11);
  root.add(leftLeg, rightLeg);

  // Torso (Baby Benny bright green tee vs Big Benny green-striped bear hoodie!)
  const torso = new THREE.Group();
  torso.position.y = 0.61;

  const bigOutfit = new THREE.Group();
  const hoodieBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.205, 0.22, 12, 20), hoodieStriped);
  hoodieBody.scale.set(1.05, 1.0, 0.92);
  hoodieBody.castShadow = true;
  bigOutfit.add(hoodieBody);

  const pocket = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.08, 8, 12), hoodieGreen);
  pocket.rotation.z = Math.PI / 2;
  pocket.scale.set(0.65, 1.0, 0.5);
  pocket.position.set(0, -0.09, 0.165);
  bigOutfit.add(pocket);

  const babyOutfit = new THREE.Group();
  const babyBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.185, 0.22, 12, 20), babyGreenTee);
  babyBody.scale.set(1.03, 1.0, 0.88);
  babyBody.castShadow = true;
  babyOutfit.add(babyBody);
  babyOutfit.visible = false;

  torso.add(bigOutfit, babyOutfit);
  root.add(torso);

  // Arms
  const makeArm = (xSign: number) => {
    const arm = new THREE.Group();
    arm.position.set(xSign * 0.235, 0.77, 0);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.19, 8, 14), hoodieStriped);
    sleeve.position.set(xSign * 0.04, -0.125, 0);
    sleeve.rotation.z = xSign * 0.22;
    sleeve.castShadow = true;
    arm.add(sleeve);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 14), skinMat);
    hand.position.set(xSign * 0.075, -0.25, 0.01);
    arm.add(hand);
    return arm;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);
  root.add(leftArm, rightArm);

  // Head + Layered Tousled Blonde Curls + Optional Bear-Ear Hood (for Big Benny!)
  const head = new THREE.Group();
  head.position.y = 1.04;

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.26, 32, 32), skinMat);
  skull.scale.set(1.03, 0.99, 0.96);
  skull.castShadow = true;
  head.add(skull);

  [-0.255, 0.255].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 12), skinMat);
    ear.position.set(ex, -0.01, -0.01);
    ear.scale.set(0.55, 1.0, 0.75);
    head.add(ear);
  });

  const geoFaceGroup = new THREE.Group();
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 12), skinMat);
  nose.position.set(0, -0.015, 0.254);
  geoFaceGroup.add(nose);

  // Soft golden tousled curls (NO pointy cones!)
  const hairBackCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.272, 22, 22, 0, Math.PI * 2, 0, Math.PI * 0.6),
    hairMat
  );
  hairBackCap.position.y = 0.025;
  hairBackCap.rotation.x = -0.35;
  head.add(hairBackCap);

  const lockGeo = new THREE.CapsuleGeometry(0.056, 0.085, 6, 12);
  for (let i = 0; i < 16; i++) {
    const row = Math.floor(i / 5);
    const col = (i % 5) - 2;
    const curl = new THREE.Mesh(lockGeo, hairMat);
    curl.position.set(
      col * 0.085 + (row % 2) * 0.03,
      0.22 - row * 0.055,
      0.11 - row * 0.085
    );
    curl.rotation.set(0.55 - row * 0.3, col * 0.2, -col * 0.32);
    curl.castShadow = true;
    head.add(curl);
  }

  // Bear-ear hood collar on back (Big Benny signature!)
  const hoodCollar = new THREE.Group();
  const hoodShell = new THREE.Mesh(
    new THREE.SphereGeometry(0.292, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.68),
    hoodieStriped
  );
  hoodShell.rotation.x = -0.45;
  hoodShell.position.set(0, 0.01, -0.045);
  hoodCollar.add(hoodShell);

  [-0.21, 0.21].forEach((ex) => {
    const bearEar = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), hoodieGreen);
    bearEar.position.set(ex, 0.25, -0.03);
    bearEar.scale.set(1.0, 1.0, 0.72);
    hoodCollar.add(bearEar);
    const innerEar = new THREE.Mesh(new THREE.SphereGeometry(0.044, 12, 12), hoodieCream);
    innerEar.position.set(ex, 0.25, 0.015);
    innerEar.scale.set(1.0, 1.0, 0.6);
    hoodCollar.add(innerEar);
  });
  head.add(hoodCollar);

  // Subtle white sole accent available
  void whiteSole;

  const eyes = createEyePair(0x0ea5e9, 0xb47b39, 1.08, false, 0.11, 0.236);
  geoFaceGroup.add(eyes.group);
  const mouth = addCheeksAndSmile(geoFaceGroup, 0xfb7185, false, 0.238);
  head.add(geoFaceGroup);

  const eyelids = applyAttachedCharacterFace(
    '/src/assets/images/char_benny_turnaround_1795554180598.jpg',
    { cx: 0.155, cy: 0.265, sw: 0.076, sh: 0.135 },
    head,
    skinMat,
    geoFaceGroup,
    0.264,
    textures
  );
  root.add(head);

  return {
    id: 'benny',
    root,
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    leftEye: eyes.leftEye,
    rightEye: eyes.rightEye,
    mouth,
    babyOutfit,
    bigOutfit,
    eyelids,
    baseY: 0,
    phaseOffset: 1.7,
    textures,
  };
}

// Pip: Adorable Fluffy Golden Puppy from FTGtiB-hXD4!
export function buildPip(): CharacterRig {
  const root = new THREE.Group();
  const textures: THREE.Texture[] = [];

  const furGold = makeClothMat(0xeab364, 0.88);
  const furCream = makeClothMat(0xfef3c7, 0.88);
  const furEar = makeClothMat(0xd99442, 0.88);
  const collarMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.4 });
  const tagMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.65 });
  const noseMat = new THREE.MeshPhysicalMaterial({ color: 0x1e293b, roughness: 0.15, clearcoat: 0.9 });

  const torso = new THREE.Group();
  torso.position.y = 0.36;

  // Chubby puppy body + cream belly chest tuft
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.185, 0.22, 12, 20), furGold);
  body.rotation.x = Math.PI * 0.32;
  body.castShadow = true;
  torso.add(body);

  const chestFluff = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), furCream);
  chestFluff.position.set(0, 0.04, 0.14);
  chestFluff.scale.set(0.95, 1.05, 0.7);
  torso.add(chestFluff);

  // Teal puppy collar + golden star tag
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.028, 10, 22), collarMat);
  collar.rotation.x = Math.PI / 2 - 0.25;
  collar.position.set(0, 0.17, 0.09);
  torso.add(collar);

  const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.015, 14), tagMat);
  tag.rotation.x = Math.PI / 2;
  tag.position.set(0, 0.12, 0.24);
  torso.add(tag);

  // Fluffy wagging tail!
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.04, -0.22);
  const tailMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.18, 8, 12), furGold);
  tailMesh.position.set(0, 0.11, -0.07);
  tailMesh.rotation.x = -0.65;
  tailPivot.add(tailMesh);
  torso.add(tailPivot);

  root.add(torso);

  // 4 cute rounded puppy paws
  const makePaw = (x: number, y: number, z: number) => {
    const leg = new THREE.Group();
    leg.position.set(x, y, z);
    const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.13, 8, 12), furGold);
    limb.position.y = -0.09;
    limb.castShadow = true;
    leg.add(limb);

    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.068, 14, 14), furCream);
    paw.position.set(0, -0.17, 0.028);
    paw.scale.set(1.0, 0.72, 1.25);
    leg.add(paw);
    return leg;
  };
  const leftArm = makePaw(-0.12, 0.26, 0.12);
  const rightArm = makePaw(0.12, 0.26, 0.12);
  const leftLeg = makePaw(-0.12, 0.24, -0.13);
  const rightLeg = makePaw(0.12, 0.24, -0.13);
  root.add(leftArm, rightArm, leftLeg, rightLeg);

  // Oversized Pixar Puppy Head
  const head = new THREE.Group();
  head.position.set(0, 0.68, 0.16);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.24, 28, 28), furGold);
  skull.scale.set(1.06, 0.98, 0.98);
  skull.castShadow = true;
  head.add(skull);

  // Cream puppy muzzle
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 18), furCream);
  muzzle.position.set(0, -0.055, 0.19);
  muzzle.scale.set(1.22, 0.88, 0.95);
  head.add(muzzle);

  // Glossy black puppy nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.044, 14, 14), noseMat);
  nose.position.set(0, -0.015, 0.29);
  nose.scale.set(1.25, 0.85, 0.9);
  head.add(nose);

  // Cute fluffy top tuft
  const tuft = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.06, 6, 10), furGold);
  tuft.position.set(0, 0.23, 0.06);
  tuft.rotation.x = 0.4;
  head.add(tuft);

  // Floppy velvety puppy ears!
  const makeEar = (side: number) => {
    const earGroup = new THREE.Group();
    earGroup.position.set(side * 0.21, 0.11, 0.01);
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.16, 8, 14), furEar);
    ear.position.set(side * 0.045, -0.11, 0.02);
    ear.rotation.z = side * 0.34;
    ear.scale.set(0.85, 1.0, 0.55);
    ear.castShadow = true;
    earGroup.add(ear);
    return earGroup;
  };
  const leftEar = makeEar(-1);
  const rightEar = makeEar(1);
  head.add(leftEar, rightEar);

  const eyes = createEyePair(0x78350f, 0xb45309, 1.06, false, 0.105, 0.21);
  head.add(eyes.group);
  const mouth = addCheeksAndSmile(head, 0xfb7185, false, 0.268);
  root.add(head);

  return {
    id: 'pip',
    root,
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    leftEye: eyes.leftEye,
    rightEye: eyes.rightEye,
    mouth,
    tailPivot,
    leftEar,
    rightEar,
    baseY: 0,
    phaseOffset: 3.1,
    textures,
  };
}

export function animateCharacter(
  rig: CharacterRig,
  elapsed: number,
  action: CharacterAction,
  isBabyStage: boolean,
  isSpeaking: boolean
) {
  const t = elapsed + rig.phaseOffset;

  // Toggle Baby Playground outfits (FTGtiB-hXD4) vs Big Characters outfits (image_c52b83de.png)
  if (rig.babyOutfit && rig.bigOutfit) {
    rig.babyOutfit.visible = isBabyStage;
    rig.bigOutfit.visible = !isBabyStage;
  }

  // Smooth Pixar scale transition from Baby Stage to Big Stage
  const targetScale = rig.id === 'pip' ? (isBabyStage ? 0.84 : 1.0) : isBabyStage ? 0.68 : 1.0;
  const targetHeadScale = rig.id === 'pip' ? 1.04 : isBabyStage ? 1.24 : 1.0;
  rig.root.scale.setScalar(THREE.MathUtils.lerp(rig.root.scale.x, targetScale, 0.09));
  rig.head.scale.setScalar(THREE.MathUtils.lerp(rig.head.scale.x, targetHeadScale, 0.09));

  // Eye blink (both geometric eyes and projected Pixar face eyelids)
  const blinkPhase = (elapsed * 0.55 + rig.phaseOffset) % 4.2;
  const isBlinking = blinkPhase > 4.05;
  const eyeScaleY = isBlinking ? 0.12 : 1;
  rig.leftEye.scale.y = eyeScaleY;
  rig.rightEye.scale.y = eyeScaleY;
  if (rig.eyelids) {
    rig.eyelids.visible = isBlinking;
  }

  // Lip-sync bounce while speaking
  rig.mouth.scale.y = isSpeaking ? 0.85 + Math.abs(Math.sin(elapsed * 15)) * 0.95 : 1;

  // Puppy tail wag + floppy ear bounce for Pip!
  if (rig.tailPivot) {
    rig.tailPivot.rotation.y = Math.sin(elapsed * 14) * 0.65;
  }
  if (rig.leftEar && rig.rightEar) {
    const earBounce = Math.abs(Math.sin(t * 4.5)) * 0.22;
    rig.leftEar.rotation.z = earBounce;
    rig.rightEar.rotation.z = -earBounce;
  }

  rig.head.rotation.set(isSpeaking ? Math.sin(elapsed * 10) * 0.06 : 0, 0, 0);
  rig.leftLeg.rotation.set(0, 0, 0);
  rig.rightLeg.rotation.set(0, 0, 0);
  rig.leftArm.rotation.set(0, 0, 0);
  rig.rightArm.rotation.set(0, 0, 0);
  rig.root.rotation.z = 0;

  if (rig.id === 'pip') {
    // Joyful puppy bounce/panting animation
    const bounce = Math.abs(Math.sin(t * 4.8));
    rig.root.position.y = rig.baseY + bounce * (action === 'hop' || action === 'dance' ? 0.2 : 0.08);
    rig.head.rotation.z = Math.sin(t * 2.6) * 0.12;
    rig.head.rotation.x = -0.06 + Math.sin(t * 5) * 0.06;
    rig.leftArm.rotation.x = -bounce * 0.35;
    rig.rightArm.rotation.x = -bounce * 0.35;
    return;
  }

  if (action === 'wave') {
    rig.root.position.y = rig.baseY + Math.abs(Math.sin(t * 3.5)) * 0.045;
    rig.head.rotation.z = Math.sin(t * 2.5) * 0.09;
    rig.rightArm.rotation.z = -2.35 + Math.sin(t * 7.5) * 0.38;
    rig.leftArm.rotation.z = 0.25 + Math.sin(t * 3) * 0.1;
  } else if (action === 'clap') {
    rig.root.position.y = rig.baseY + Math.abs(Math.sin(t * 5)) * 0.07;
    rig.head.rotation.x = Math.sin(t * 5) * 0.08;
    const clapAngle = 0.5 + Math.abs(Math.sin(t * 8)) * 0.65;
    rig.leftArm.rotation.z = 0.65;
    rig.rightArm.rotation.z = -0.65;
    rig.leftArm.rotation.y = clapAngle;
    rig.rightArm.rotation.y = -clapAngle;
  } else if (action === 'hop') {
    const hop = Math.max(0, Math.sin(t * 5.2));
    rig.root.position.y = rig.baseY + hop * 0.24;
    rig.leftArm.rotation.z = 0.6 + hop * 1.1;
    rig.rightArm.rotation.z = -0.6 - hop * 1.1;
    rig.leftLeg.rotation.x = hop * 0.35;
    rig.rightLeg.rotation.x = -hop * 0.25;
  } else {
    rig.root.position.y = rig.baseY + Math.abs(Math.sin(t * 6)) * 0.12;
    rig.root.rotation.z = Math.sin(t * 3) * 0.07;
    rig.head.rotation.z = -Math.sin(t * 3) * 0.11;
    rig.leftArm.rotation.z = 0.9 + Math.sin(t * 6) * 0.72;
    rig.rightArm.rotation.z = -0.9 + Math.sin(t * 6) * 0.72;
    rig.leftLeg.rotation.x = Math.sin(t * 6) * 0.26;
    rig.rightLeg.rotation.x = -Math.sin(t * 6) * 0.26;
  }
}
