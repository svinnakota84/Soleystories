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
  mouth: THREE.Group;
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

function makeSkinMat(color: number): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.44,
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
    sheen: 0.58,
    sheenColor: new THREE.Color(0xffffff),
    sheenRoughness: 0.75,
  });
}

function makeShoeMat(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.36, metalness: 0.04 });
}

function createStripedHoodieTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (let y = 0; y < 256; y += 32) {
      ctx.fillStyle = (y / 32) % 2 === 0 ? '#2B7A4B' : '#FFFFFF';
      ctx.fillRect(0, y, 256, 32);
    }
    ctx.fillStyle = 'rgba(15, 23, 42, 0.04)';
    for (let i = 0; i < 800; i++) {
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

function createPixarEyePair(
  irisColor: number,
  browColor: number,
  lidMat: THREE.Material,
  eyeScale = 1.24,
  withLashes = false,
  eyeSpread = 0.114,
  eyeZ = 0.238
): {
  group: THREE.Group;
  leftEye: THREE.Group;
  rightEye: THREE.Group;
  eyelids: THREE.Group;
} {
  const group = new THREE.Group();
  const eyelids = new THREE.Group();
  eyelids.visible = false;

  const scleraMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
  });
  const irisMat = new THREE.MeshPhysicalMaterial({
    color: irisColor,
    roughness: 0.1,
    clearcoat: 0.9,
  });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0b0f19, roughness: 0.04 });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lashMat = new THREE.MeshStandardMaterial({ color: 0x1a110d, roughness: 0.5 });
  const browMat = makeClothMat(browColor, 0.72);

  const makeSingleEye = (xSign: number) => {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(xSign * eyeSpread, 0.032, eyeZ);

    const sclera = new THREE.Mesh(
      new THREE.SphereGeometry(0.066 * eyeScale, 24, 24),
      scleraMat
    );
    sclera.scale.set(1.02, 1.14, 0.56);
    eyeGroup.add(sclera);

    const iris = new THREE.Mesh(
      new THREE.SphereGeometry(0.049 * eyeScale, 22, 22),
      irisMat
    );
    iris.position.set(0, -0.002, 0.026 * eyeScale);
    iris.scale.set(1.0, 1.08, 0.52);
    eyeGroup.add(iris);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.028 * eyeScale, 16, 16),
      pupilMat
    );
    pupil.position.set(0, -0.002, 0.04 * eyeScale);
    pupil.scale.set(1, 1.05, 0.48);
    eyeGroup.add(pupil);

    const glint = new THREE.Mesh(
      new THREE.SphereGeometry(0.0135 * eyeScale, 10, 10),
      glintMat
    );
    glint.position.set(0.017 * eyeScale, 0.02 * eyeScale, 0.049 * eyeScale);
    eyeGroup.add(glint);

    const glint2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.0065 * eyeScale, 8, 8),
      glintMat
    );
    glint2.position.set(-0.013 * eyeScale, -0.013 * eyeScale, 0.048 * eyeScale);
    eyeGroup.add(glint2);

    // Upper eyelid liner for expressive Pixar framing
    const lash = new THREE.Mesh(
      new THREE.TorusGeometry(0.064 * eyeScale, withLashes ? 0.011 : 0.007, 8, 18, Math.PI * 0.85),
      lashMat
    );
    lash.position.set(0, 0.006 * eyeScale, 0.018 * eyeScale);
    lash.rotation.z = Math.PI * 0.075;
    eyeGroup.add(lash);

    if (withLashes) {
      const wingLash = new THREE.Mesh(new THREE.CapsuleGeometry(0.006, 0.026, 4, 8), lashMat);
      wingLash.position.set(xSign * 0.062 * eyeScale, 0.036 * eyeScale, 0.02);
      wingLash.rotation.z = -xSign * 0.9;
      eyeGroup.add(wingLash);
    }

    const brow = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.014, 0.064, 6, 10),
      browMat
    );
    brow.rotation.z = Math.PI / 2 - xSign * 0.16;
    brow.position.set(xSign * eyeSpread, 0.132, eyeZ + 0.012);
    group.add(brow);

    const blinkLid = new THREE.Mesh(
      new THREE.SphereGeometry(0.068 * eyeScale, 16, 12),
      lidMat
    );
    blinkLid.position.set(xSign * eyeSpread, 0.036, eyeZ + 0.012);
    blinkLid.scale.set(1.06, 0.88, 0.56);
    eyelids.add(blinkLid);

    return eyeGroup;
  };

  const leftEye = makeSingleEye(-1);
  const rightEye = makeSingleEye(1);
  group.add(leftEye, rightEye);

  return { group, leftEye, rightEye, eyelids };
}

function addPixarSmile(
  head: THREE.Group,
  cheekColor: number,
  faceZ = 0.244,
  isPuppy = false
): THREE.Group {
  const cheekMat = new THREE.MeshStandardMaterial({
    color: cheekColor,
    roughness: 0.78,
    transparent: true,
    opacity: 0.42,
  });
  const cL = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 14), cheekMat);
  cL.position.set(-0.152, -0.052, faceZ - 0.032);
  cL.scale.set(1.25, 0.82, 0.42);
  const cR = cL.clone();
  cR.position.x = 0.152;
  head.add(cL, cR);

  // Joyful D-shaped Pixar open smile
  const mouthGroup = new THREE.Group();
  mouthGroup.position.set(0, isPuppy ? -0.105 : -0.095, faceZ);

  const cavity = new THREE.Mesh(
    new THREE.SphereGeometry(isPuppy ? 0.068 : 0.064, 16, 14),
    new THREE.MeshStandardMaterial({ color: 0x6b1220, roughness: 0.4 })
  );
  cavity.scale.set(1.32, 0.72, 0.42);
  mouthGroup.add(cavity);

  if (!isPuppy) {
    const teeth = new THREE.Mesh(
      new THREE.BoxGeometry(0.102, 0.022, 0.024),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.16 })
    );
    teeth.position.set(0, 0.024, 0.016);
    mouthGroup.add(teeth);
  }

  const tongue = new THREE.Mesh(
    new THREE.SphereGeometry(isPuppy ? 0.044 : 0.038, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.45 })
  );
  tongue.position.set(0, isPuppy ? -0.036 : -0.022, isPuppy ? 0.032 : 0.018);
  tongue.scale.set(1.0, isPuppy ? 1.25 : 0.58, 0.68);
  if (isPuppy) tongue.rotation.x = 0.45;
  mouthGroup.add(tongue);

  head.add(mouthGroup);
  return mouthGroup;
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

  const skinMat = makeSkinMat(0xc67c4e);
  const yellowOverallTex = createDenimTexture('#F5B81D');
  const orangeDressTex = createDenimTexture('#F97316');
  textures.push(yellowOverallTex, orangeDressTex);

  const dungareeMat = makeClothMat(0xf5b81d, 0.68, yellowOverallTex);
  const babyDressMat = makeClothMat(0xf97316, 0.7, orangeDressTex);
  const babyYellowTee = makeClothMat(0xfde047, 0.72);
  const whiteMat = makeClothMat(0xffffff, 0.72);
  const redShoeMat = makeShoeMat(0xdc2626);
  const soleWhiteMat = makeShoeMat(0xf8fafc);
  const hairMat = makeClothMat(0x26150d, 0.88);
  const brownButtonMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.4,
    metalness: 0.1,
  });

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

  const torso = new THREE.Group();
  torso.position.y = 0.68;

  // Big Mia: Crisp white tee + yellow overalls with brown buttons (matches image_af1869e5.png)
  const bigOutfit = new THREE.Group();
  const bodyTee = new THREE.Mesh(new THREE.CapsuleGeometry(0.185, 0.24, 12, 20), whiteMat);
  bodyTee.scale.set(1.04, 1.0, 0.88);
  bodyTee.castShadow = true;
  bigOutfit.add(bodyTee);

  const bib = new THREE.Mesh(new THREE.CapsuleGeometry(0.175, 0.16, 10, 18), dungareeMat);
  bib.position.set(0, -0.09, 0.015);
  bib.scale.set(1.06, 1.0, 0.88);
  bib.castShadow = true;
  bigOutfit.add(bib);

  [-0.092, 0.092].forEach((sx) => {
    const strap = new THREE.Mesh(new THREE.CapsuleGeometry(0.026, 0.22, 6, 10), dungareeMat);
    strap.position.set(sx, 0.11, 0.125);
    bigOutfit.add(strap);
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.016, 14), brownButtonMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(sx, 0.025, 0.168);
    bigOutfit.add(btn);
  });

  // Baby Mia outfit (Scene 1 Playground: orange pinafore dress over yellow tee)
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

  const makeArm = (xSign: number) => {
    const arm = new THREE.Group();
    arm.position.set(xSign * 0.225, 0.84, 0);
    const sleeve = new THREE.Mesh(new THREE.SphereGeometry(0.078, 14, 14), whiteMat);
    sleeve.scale.set(1.0, 0.92, 0.95);
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

  // Full 3D Pixar Head + Big Glossy Eyes + Fluffy Curly Puffs + Yellow Ties
  const head = new THREE.Group();
  head.position.y = 1.15;

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.278, 32, 32), skinMat);
  skull.scale.set(1.04, 0.99, 0.96);
  skull.castShadow = true;
  head.add(skull);

  [-0.27, 0.27].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.056, 12, 12), skinMat);
    ear.position.set(ex, -0.015, -0.01);
    ear.scale.set(0.55, 1.0, 0.75);
    head.add(ear);
  });

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 14), skinMat);
  nose.position.set(0, -0.022, 0.268);
  nose.scale.set(1.18, 0.88, 0.95);
  head.add(nose);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.292, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat
  );
  hairCap.position.y = 0.024;
  hairCap.rotation.x = -0.25;
  head.add(hairCap);

  // Soft baby curls around hairline
  for (let h = -3; h <= 3; h++) {
    const bangCurl = new THREE.Mesh(new THREE.SphereGeometry(0.044, 10, 10), hairMat);
    bangCurl.position.set(h * 0.068, 0.215 - Math.abs(h) * 0.016, 0.195 - Math.abs(h) * 0.025);
    head.add(bangCurl);
  }

  // Big voluminous curly afro puffs with bright yellow hair ties
  [-1, 1].forEach((side) => {
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.024, 10, 18), babyYellowTee);
    tie.position.set(side * 0.225, 0.235, -0.02);
    tie.rotation.y = side * 0.9;
    tie.rotation.x = 0.4;
    head.add(tie);

    const puffGroup = new THREE.Group();
    puffGroup.position.set(side * 0.295, 0.325, -0.035);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), hairMat);
    puffGroup.add(core);
    for (let c = 0; c < 18; c++) {
      const phi = Math.acos(1 - (2 * (c + 0.5)) / 18);
      const theta = Math.PI * (1 + Math.sqrt(5)) * c;
      const curl = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 10), hairMat);
      curl.position.set(
        Math.sin(phi) * Math.cos(theta) * 0.12,
        Math.cos(phi) * 0.12,
        Math.sin(phi) * Math.sin(theta) * 0.12
      );
      curl.castShadow = true;
      puffGroup.add(curl);
    }
    head.add(puffGroup);
  });

  const eyes = createPixarEyePair(0x4a2511, 0x26150d, skinMat, 1.24, true, 0.114, 0.242);
  head.add(eyes.group, eyes.eyelids);
  const mouth = addPixarSmile(head, 0xf43f5e, 0.246, false);
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
    eyelids: eyes.eyelids,
    baseY: 0,
    phaseOffset: 0,
    textures,
  };
}

export function buildBenny(): CharacterRig {
  const root = new THREE.Group();
  const textures: THREE.Texture[] = [];

  const skinMat = makeSkinMat(0xf8cbb0);
  const stripeTex = createStripedHoodieTexture();
  const denimTex = createDenimTexture('#3B699E');
  textures.push(stripeTex, denimTex);

  const hoodieStriped = makeClothMat(0xffffff, 0.8, stripeTex);
  const babyGreenTee = makeClothMat(0x2b7a4b, 0.76);
  const hoodieGreen = makeClothMat(0x2b7a4b, 0.8);
  const whiteMat = makeClothMat(0xffffff, 0.76);
  const jeansMat = makeClothMat(0x3b699e, 0.78, denimTex);
  const blueShoe = makeShoeMat(0x2563eb);
  const tanSole = makeShoeMat(0xc58b4e);
  // Rich warm auburn-ginger tousled hair matching image_af1869e5.png!
  const hairMat = makeClothMat(0xb85b25, 0.78);
  const hairHighlightMat = makeClothMat(0xd47835, 0.76);

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

  const torso = new THREE.Group();
  torso.position.y = 0.61;

  // Big Benny: Forest-green & white horizontal striped hoodie + white drawstrings!
  const bigOutfit = new THREE.Group();
  const hoodieBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.205, 0.22, 12, 20), hoodieStriped);
  hoodieBody.scale.set(1.05, 1.0, 0.92);
  hoodieBody.castShadow = true;
  bigOutfit.add(hoodieBody);

  // Relaxed hood folded cleanly behind collar (leaves auburn hair fully visible!)
  const collarHood = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.058, 10, 20), hoodieGreen);
  collarHood.rotation.x = Math.PI / 2 + 0.28;
  collarHood.position.set(0, 0.16, -0.045);
  bigOutfit.add(collarHood);

  [-0.045, 0.045].forEach((dx) => {
    const string = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.11, 6, 8), whiteMat);
    string.position.set(dx, 0.07, 0.188);
    string.rotation.z = dx * 1.4;
    bigOutfit.add(string);
  });

  // Baby Benny outfit (Scene 1 Playground: bright green tee)
  const babyOutfit = new THREE.Group();
  const babyBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.185, 0.22, 12, 20), babyGreenTee);
  babyBody.scale.set(1.03, 1.0, 0.88);
  babyBody.castShadow = true;
  babyOutfit.add(babyBody);
  babyOutfit.visible = false;

  torso.add(bigOutfit, babyOutfit);
  root.add(torso);

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

  // Full 3D Pixar Head + Big Blue Glossy Eyes + Fluffy Tousled Honey-Auburn Hair
  const head = new THREE.Group();
  head.position.y = 1.04;

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.268, 32, 32), skinMat);
  skull.scale.set(1.04, 0.99, 0.96);
  skull.castShadow = true;
  head.add(skull);

  [-0.262, 0.262].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.054, 12, 12), skinMat);
    ear.position.set(ex, -0.015, -0.01);
    ear.scale.set(0.55, 1.0, 0.75);
    head.add(ear);
  });

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), skinMat);
  nose.position.set(0, -0.018, 0.258);
  nose.scale.set(1.12, 0.88, 0.95);
  head.add(nose);

  const hairBackCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 22, 22, 0, Math.PI * 2, 0, Math.PI * 0.6),
    hairMat
  );
  hairBackCap.position.y = 0.028;
  hairBackCap.rotation.x = -0.34;
  head.add(hairBackCap);

  const lockGeo = new THREE.CapsuleGeometry(0.058, 0.095, 6, 12);
  for (let i = 0; i < 20; i++) {
    const row = Math.floor(i / 5);
    const col = (i % 5) - 2;
    const curl = new THREE.Mesh(lockGeo, i % 3 === 0 ? hairHighlightMat : hairMat);
    curl.position.set(
      col * 0.088 + (row % 2) * 0.032,
      0.24 - row * 0.052,
      0.13 - row * 0.082
    );
    curl.rotation.set(0.62 - row * 0.28, col * 0.22, -col * 0.36);
    curl.castShadow = true;
    head.add(curl);
  }

  const eyes = createPixarEyePair(0x0284c7, 0x9a4a1c, skinMat, 1.24, false, 0.112, 0.236);
  head.add(eyes.group, eyes.eyelids);
  const mouth = addPixarSmile(head, 0xfb7185, 0.24, false);
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
    eyelids: eyes.eyelids,
    baseY: 0,
    phaseOffset: 1.7,
    textures,
  };
}

// Pip: Fluffy Golden Puppy with brown collar, gold paw tag & happy panting smile (image_af1869e5.png)
export function buildPip(): CharacterRig {
  const root = new THREE.Group();
  const textures: THREE.Texture[] = [];

  const furGold = makeClothMat(0xf3be6b, 0.88);
  const furCream = makeClothMat(0xfef3c7, 0.88);
  const furEar = makeClothMat(0xd98a38, 0.88);
  const collarMat = new THREE.MeshStandardMaterial({ color: 0x6b3a1d, roughness: 0.42 });
  const tagMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.22, metalness: 0.72 });
  const noseMat = new THREE.MeshPhysicalMaterial({ color: 0x1e293b, roughness: 0.14, clearcoat: 0.92 });

  const torso = new THREE.Group();
  torso.position.y = 0.36;

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.185, 0.22, 12, 20), furGold);
  body.rotation.x = Math.PI * 0.32;
  body.castShadow = true;
  torso.add(body);

  const chestFluff = new THREE.Mesh(new THREE.SphereGeometry(0.155, 16, 16), furCream);
  chestFluff.position.set(0, 0.04, 0.145);
  chestFluff.scale.set(0.98, 1.08, 0.72);
  torso.add(chestFluff);

  // Brown leather collar + round gold paw-print tag
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.028, 10, 22), collarMat);
  collar.rotation.x = Math.PI / 2 - 0.25;
  collar.position.set(0, 0.17, 0.09);
  torso.add(collar);

  const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.016, 16), tagMat);
  tag.rotation.x = Math.PI / 2;
  tag.position.set(0, 0.115, 0.245);
  torso.add(tag);

  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.04, -0.22);
  const tailMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.18, 8, 12), furGold);
  tailMesh.position.set(0, 0.11, -0.07);
  tailMesh.rotation.x = -0.65;
  tailPivot.add(tailMesh);
  torso.add(tailPivot);

  root.add(torso);

  const makePaw = (x: number, y: number, z: number) => {
    const leg = new THREE.Group();
    leg.position.set(x, y, z);
    const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.13, 8, 12), furGold);
    limb.position.y = -0.09;
    limb.castShadow = true;
    leg.add(limb);

    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 14), furCream);
    paw.position.set(0, -0.17, 0.03);
    paw.scale.set(1.0, 0.72, 1.25);
    leg.add(paw);
    return leg;
  };
  const leftArm = makePaw(-0.12, 0.26, 0.12);
  const rightArm = makePaw(0.12, 0.26, 0.12);
  const leftLeg = makePaw(-0.12, 0.24, -0.13);
  const rightLeg = makePaw(0.12, 0.24, -0.13);
  root.add(leftArm, rightArm, leftLeg, rightLeg);

  const head = new THREE.Group();
  head.position.set(0, 0.68, 0.16);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.245, 28, 28), furGold);
  skull.scale.set(1.08, 0.98, 0.98);
  skull.castShadow = true;
  head.add(skull);

  // Fluffy cheek tufts
  [-0.21, 0.21].forEach((cx) => {
    const tuftCheek = new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 12), furCream);
    tuftCheek.position.set(cx, -0.06, 0.05);
    tuftCheek.scale.set(0.95, 0.85, 0.85);
    head.add(tuftCheek);
  });

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.118, 18, 18), furCream);
  muzzle.position.set(0, -0.058, 0.192);
  muzzle.scale.set(1.24, 0.88, 0.95);
  head.add(muzzle);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.046, 14, 14), noseMat);
  nose.position.set(0, -0.014, 0.294);
  nose.scale.set(1.28, 0.85, 0.9);
  head.add(nose);

  const tuft = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.065, 6, 10), furGold);
  tuft.position.set(0, 0.235, 0.06);
  tuft.rotation.x = 0.4;
  head.add(tuft);

  const makeEar = (side: number) => {
    const earGroup = new THREE.Group();
    earGroup.position.set(side * 0.215, 0.115, 0.01);
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.17, 8, 14), furEar);
    ear.position.set(side * 0.05, -0.115, 0.02);
    ear.rotation.z = side * 0.36;
    ear.scale.set(0.88, 1.0, 0.56);
    ear.castShadow = true;
    earGroup.add(ear);
    return earGroup;
  };
  const leftEar = makeEar(-1);
  const rightEar = makeEar(1);
  head.add(leftEar, rightEar);

  const eyes = createPixarEyePair(0x4a2511, 0xb45309, furGold, 1.18, false, 0.106, 0.212);
  head.add(eyes.group, eyes.eyelids);
  const mouth = addPixarSmile(head, 0xfb7185, 0.264, true);
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
    eyelids: eyes.eyelids,
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
  isSpeaking: boolean,
  isRidingTrain = false
) {
  const t = elapsed + rig.phaseOffset;

  if (rig.babyOutfit && rig.bigOutfit) {
    rig.babyOutfit.visible = isBabyStage;
    rig.bigOutfit.visible = !isBabyStage;
  }

  const targetScale = rig.id === 'pip'
    ? (isRidingTrain ? 0.62 : isBabyStage ? 0.84 : 0.96)
    : isRidingTrain
    ? 0.62
    : isBabyStage
    ? 0.68
    : 1.0;
  const targetHeadScale = rig.id === 'pip' ? 1.08 : isBabyStage ? 1.22 : 1.05;
  rig.root.scale.setScalar(THREE.MathUtils.lerp(rig.root.scale.x, targetScale, 0.1));
  rig.head.scale.setScalar(THREE.MathUtils.lerp(rig.head.scale.x, targetHeadScale, 0.1));

  const blinkPhase = (elapsed * 0.55 + rig.phaseOffset) % 4.2;
  const isBlinking = blinkPhase > 4.05;
  const eyeScaleY = isBlinking ? 0.12 : 1;
  rig.leftEye.scale.y = eyeScaleY;
  rig.rightEye.scale.y = eyeScaleY;
  if (rig.eyelids) {
    rig.eyelids.visible = isBlinking;
  }

  rig.mouth.scale.y = isSpeaking ? 0.9 + Math.abs(Math.sin(elapsed * 15)) * 0.55 : 1;

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

  if (isRidingTrain) {
    // Cozy seated/leaning pose inside the open train car (matching image_af1869e5.png)
    const gentleRideBob = Math.sin(elapsed * 6.5 + rig.phaseOffset) * 0.025;
    if (rig.id === 'pip') {
      rig.root.position.y = rig.baseY + gentleRideBob;
      rig.head.rotation.z = Math.sin(t * 2.4) * 0.09;
      rig.leftArm.rotation.x = -0.55;
      rig.rightArm.rotation.x = -0.55;
      return;
    }

    rig.root.position.y = rig.baseY + gentleRideBob;
    rig.leftLeg.rotation.x = -1.25;
    rig.rightLeg.rotation.x = -1.25;

    if (rig.id === 'mia') {
      // Mia pointing happily to the left-upward & resting other hand on cookie rim
      rig.leftArm.rotation.z = -1.82 + Math.sin(t * 4.5) * 0.12;
      rig.leftArm.rotation.x = -0.35;
      rig.rightArm.rotation.x = -0.58;
      rig.head.rotation.y = -0.22;
      rig.head.rotation.z = Math.sin(t * 2.2) * 0.06;
    } else {
      // Benny leaning excitedly with both hands resting on the scalloped cookie rim
      rig.leftArm.rotation.x = -0.72;
      rig.rightArm.rotation.x = -0.72;
      rig.head.rotation.y = 0.04;
      rig.head.rotation.z = Math.sin(t * 2.6) * 0.07;
    }
    return;
  }

  if (rig.id === 'pip') {
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
