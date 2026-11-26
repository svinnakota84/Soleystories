import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  Download,
  Film,
  Music,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { CameraPreset, EpisodeData } from '../data/episodes';
import { KidsAudioEngine, type VoiceEngine } from '../three/audioEngine';
import { animateCharacter, buildBenny, buildMia, buildPip, type CharacterRig } from '../three/characters';
import { buildEpisodeTrain, type TrainAssembly } from '../three/trains';
import { buildSunnyMeadowWorld } from '../three/world';

export type VideoFormatMode = 'preview' | 'full5min' | 'short';
export type CharacterStageMode = 'auto' | 'baby' | 'big';

export interface RecordedClip {
  blob: Blob;
  filename: string;
  episode: EpisodeData;
  formatMode: VideoFormatMode;
  durationSec: number;
  createdAt: string;
}

interface Stage3DViewportProps {
  episode: EpisodeData;
  activeSceneIndex: number;
  onSceneIndexChange: (idx: number) => void;
  isPlaying: boolean;
  onTogglePlay: (playing?: boolean) => void;
  voiceEngine: VoiceEngine;
  onVoiceEngineChange: (engine: VoiceEngine) => void;
  formatMode: VideoFormatMode;
  onFormatModeChange: (mode: VideoFormatMode) => void;
  customBabyIntro?: string;
  recordRequestTick: number;
  onExportThumbnail: () => void;
  onRecordedClipReady: (clip: RecordedClip) => void;
}

const _pos = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _look = new THREE.Vector3();
const _camGoal = new THREE.Vector3();
const _targetGoal = new THREE.Vector3();
const _carSide = new THREE.Vector3();
const _carFwd = new THREE.Vector3();
const _localOff = new THREE.Vector3();
const _rideYaw = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 1, 0),
  -Math.PI * 0.44
);

export const Stage3DViewport: React.FC<Stage3DViewportProps> = ({
  episode,
  activeSceneIndex,
  onSceneIndexChange,
  isPlaying,
  onTogglePlay,
  voiceEngine,
  onVoiceEngineChange,
  formatMode,
  onFormatModeChange,
  customBabyIntro = '',
  recordRequestTick,
  onExportThumbnail,
  onRecordedClipReady,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<KidsAudioEngine | null>(null);

  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('characters');
  const [stageMode, setStageMode] = useState<CharacterStageMode>('auto');
  const [muted, setMuted] = useState(false);
  const [cinemaFraming, setCinemaFraming] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [loopBeat, setLoopBeat] = useState(1);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  const episodeRef = useRef(episode);
  const sceneIdxRef = useRef(activeSceneIndex);
  const isPlayingRef = useRef(isPlaying);
  const camPresetRef = useRef<CameraPreset>(cameraPreset);
  const stageModeRef = useRef<CharacterStageMode>(stageMode);
  const userControllingRef = useRef(false);
  const transitionActiveRef = useRef(false);
  const voiceEngineRef = useRef<VoiceEngine>(voiceEngine);
  const formatModeRef = useRef<VideoFormatMode>(formatMode);
  const loopBeatRef = useRef(loopBeat);
  const recordSecondsRef = useRef(recordSeconds);
  const customBabyIntroRef = useRef(customBabyIntro);
  const sparkleBurstRef = useRef(0);
  const prevBabyStageRef = useRef(true);

  episodeRef.current = episode;
  sceneIdxRef.current = activeSceneIndex;
  isPlayingRef.current = isPlaying;
  camPresetRef.current = cameraPreset;
  stageModeRef.current = stageMode;
  voiceEngineRef.current = voiceEngine;
  formatModeRef.current = formatMode;
  loopBeatRef.current = loopBeat;
  recordSecondsRef.current = recordSeconds;
  customBabyIntroRef.current = customBabyIntro;

  const trainRef = useRef<TrainAssembly | null>(null);
  const sceneThreeRef = useRef<THREE.Scene | null>(null);
  const worldRef = useRef<ReturnType<typeof buildSunnyMeadowWorld> | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const isSoftwareGlRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    audioRef.current = new KidsAudioEngine();

    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();
    isSoftwareGlRef.current = isSoftwareGl;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
    } catch {
      setWebglError('3D WebGL preview is unavailable on this browser.');
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1.25 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, Math.max(container.clientHeight, 1));
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError('3D graphics context paused. Restoring...');
    };
    const handleContextRestored = () => {
      setWebglError(null);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    sceneThreeRef.current = scene;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      160
    );
    camera.position.set(0, 2.2, 8.2);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minDistance = 2.4;
    controls.maxDistance = 34;
    controls.target.set(0, 0.85, 2.5);
    controls.addEventListener('start', () => {
      userControllingRef.current = true;
      transitionActiveRef.current = false;
    });

    const hemiLight = new THREE.HemisphereLight(0xfde68a, 0x4ade80, 0.92);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffe9c2, 2.25);
    keyLight.position.set(14, 15, 11);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 55;
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xfef08a, 1.05);
    rimLight.position.set(-9, 7.5, -11);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xfff1f2, 0.45);
    fillLight.position.set(0, 3, 10);
    scene.add(fillLight);

    const maxAniso = isSoftwareGl ? 1 : renderer.capabilities.getMaxAnisotropy();
    const world = buildSunnyMeadowWorld(scene, isSoftwareGl, maxAniso);
    worldRef.current = world;

    const benny = buildBenny();
    benny.root.position.set(-1.12, 0.09, 3.05);
    benny.baseY = 0.09;

    const pip = buildPip();
    pip.root.position.set(0.04, 0.09, 3.4);
    pip.baseY = 0.09;

    const mia = buildMia();
    mia.root.position.set(1.12, 0.09, 2.98);
    mia.baseY = 0.09;

    const characters: CharacterRig[] = [mia, benny, pip];
    characters.forEach((c) => scene.add(c.root));

    const initialTrain = buildEpisodeTrain(episodeRef.current.id, isSoftwareGl);
    initialTrain.units.forEach((u) => scene.add(u));
    trainRef.current = initialTrain;

    let composer: EffectComposer | null = null;
    if (!isSoftwareGl) {
      const w = container.clientWidth;
      const h = Math.max(container.clientHeight, 1);
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.26, 0.48, 0.88);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
      composerRef.current = composer;
      renderer.compile(scene, camera);
    }

    const clock = new THREE.Clock();
    let trackProgress = 0.15;
    let frameId = 0;
    let steamSpawnTimer = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const puffGeo = new THREE.SphereGeometry(0.18, 10, 10);

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.08);
      const elapsed = clock.getElapsedTime();
      const ep = episodeRef.current;
      const sceneData = ep.scenes[sceneIdxRef.current] || ep.scenes[0];

      const speedMult = isPlayingRef.current ? sceneData.trainSpeed : 0.45;
      trackProgress = (trackProgress + delta * 0.048 * speedMult) % 1;

      const train = trainRef.current;
      if (train) {
        train.units.forEach((unit, idx) => {
          const spacing = idx === 0 ? 0 : 0.025 + idx * 0.036;
          const uT = (trackProgress - spacing + 1) % 1;
          world.trackCurve.getPointAt(uT, _pos);
          world.trackCurve.getTangentAt(uT, _tan);
          unit.position.set(_pos.x, 0.08 + Math.sin(elapsed * 8 + idx) * 0.014, _pos.z);
          _look.copy(_pos).add(_tan);
          _look.y = unit.position.y;
          unit.lookAt(_look);
        });

        train.wheels.forEach((w) => {
          w.rotation.x += delta * 5.2 * speedMult;
        });
        train.specialSpinners.forEach((sp) => {
          sp.rotation.y += delta * 2.4;
        });

        steamSpawnTimer += delta * speedMult;
        if (steamSpawnTimer > 0.22 && train.units[0]) {
          steamSpawnTimer = 0;
          const puffMat = new THREE.MeshStandardMaterial({
            color: train.steamColor,
            roughness: 0.9,
            transparent: true,
            opacity: 0.85,
          });
          const puff = new THREE.Mesh(puffGeo, puffMat);
          const worldOrigin = train.steamOriginLocal.clone().applyMatrix4(train.units[0].matrixWorld);
          puff.position.copy(worldOrigin);
          scene.add(puff);
          train.steamPuffs.push({
            mesh: puff,
            life: 0,
            speed: 1.2 + Math.random() * 0.4,
            driftX: (Math.random() - 0.5) * 0.5,
          });
        }

        for (let i = train.steamPuffs.length - 1; i >= 0; i--) {
          const p = train.steamPuffs[i];
          p.life += delta;
          p.mesh.position.y += delta * p.speed;
          p.mesh.position.x += delta * p.driftX;
          const s = 1 + p.life * 2.2;
          p.mesh.scale.setScalar(s);
          const mat = p.mesh.material as THREE.MeshStandardMaterial;
          mat.opacity = Math.max(0, 0.82 - p.life * 0.68);
          if (p.life > 1.25) {
            scene.remove(p.mesh);
            mat.dispose();
            train.steamPuffs.splice(i, 1);
          }
        }
      }

      const isBabyNow =
        stageModeRef.current === 'baby' ||
        (stageModeRef.current === 'auto' && sceneIdxRef.current === 0);

      if (prevBabyStageRef.current && !isBabyNow) {
        sparkleBurstRef.current = 1.0;
        if (isPlayingRef.current) {
          audioRef.current?.playSparkle();
        }
      }
      prevBabyStageRef.current = isBabyNow;

      const passengerCar = train?.passengerCar ?? null;
      const isRidingTrain = !isBabyNow && Boolean(passengerCar);

      const activeSpeakerId = isPlayingRef.current ? sceneData.speaker.toLowerCase() : '';
      characters.forEach((rig) => {
        if (isRidingTrain && passengerCar) {
          if (rig.id === 'mia') {
            _localOff.set(-0.06, 0.54, -0.45);
          } else if (rig.id === 'benny') {
            _localOff.set(-0.06, 0.56, 0.0);
          } else {
            _localOff.set(-0.18, 0.82, 0.46);
          }
          _localOff.applyQuaternion(passengerCar.quaternion).add(passengerCar.position);
          rig.root.position.set(_localOff.x, _localOff.y, _localOff.z);
          rig.baseY = _localOff.y;
          rig.root.quaternion.copy(passengerCar.quaternion).multiply(_rideYaw);
        } else {
          if (rig.id === 'benny') {
            rig.root.position.set(-1.12, 0.09, 3.05);
          } else if (rig.id === 'pip') {
            rig.root.position.set(0.04, 0.09, 3.4);
          } else {
            rig.root.position.set(1.12, 0.09, 2.98);
          }
          rig.baseY = 0.09;
          rig.root.quaternion.identity();
        }

        const isSpeaking = activeSpeakerId === rig.id;
        animateCharacter(
          rig,
          elapsed,
          isPlayingRef.current ? sceneData.characterAction : 'wave',
          isBabyNow,
          isSpeaking,
          isRidingTrain
        );
      });

      world.clouds.forEach((c, idx) => {
        c.position.x += delta * (0.28 + idx * 0.04);
        if (c.position.x > 28) c.position.x = -28;
      });

      world.butterflies.forEach((bGroup, idx) => {
        const angle = elapsed * 0.55 + idx * 1.57;
        const radius = 2.9 + (idx % 2) * 0.8;
        bGroup.position.set(
          Math.cos(angle) * radius,
          1.45 + Math.sin(elapsed * 2.4 + idx) * 0.35,
          2.8 + Math.sin(angle) * 1.9
        );
        bGroup.rotation.y = -angle;
        const flap = Math.sin(elapsed * 14 + idx) * 0.68;
        if (bGroup.children[0]) bGroup.children[0].rotation.y = flap;
        if (bGroup.children[1]) bGroup.children[1].rotation.y = -flap;
      });

      world.swingSeats.forEach((seat, idx) => {
        seat.rotation.x = Math.sin(elapsed * 1.45 + idx * 0.9) * 0.15;
      });

      sparkleBurstRef.current = Math.max(0, sparkleBurstRef.current - delta * 0.9);
      const sparkleScale = 1 + sparkleBurstRef.current * 0.65;
      world.sparkleGroup.scale.setScalar(sparkleScale);
      world.sparkleGroup.rotation.y = elapsed * (0.3 + sparkleBurstRef.current * 1.8);

      const preset = camPresetRef.current;
      const isTrackingTrain = isRidingTrain && (preset === 'characters' || preset === 'train');
      if (!userControllingRef.current || transitionActiveRef.current) {
        const distBoost = formatModeRef.current === 'short' ? 3.1 : 0;
        if (preset === 'wide') {
          _camGoal.set(0, 6.2, 18.2 + distBoost);
          _targetGoal.set(0, 1.2, 2.6);
        } else if (isTrackingTrain && passengerCar) {
          _carSide.set(-1, 0, 0).applyQuaternion(passengerCar.quaternion).normalize();
          _carFwd.set(0, 0, 1).applyQuaternion(passengerCar.quaternion).normalize();
          if (preset === 'characters') {
            _camGoal
              .copy(passengerCar.position)
              .addScaledVector(_carSide, 3.85 + distBoost * 0.6)
              .addScaledVector(_carFwd, 1.35);
            _camGoal.y = 1.85;
            _targetGoal.copy(passengerCar.position).addScaledVector(_carFwd, 0.42);
            _targetGoal.y = 1.08;
          } else {
            _camGoal
              .copy(passengerCar.position)
              .addScaledVector(_carSide, 4.95 + distBoost * 0.7)
              .addScaledVector(_carFwd, 2.35);
            _camGoal.y = 2.05;
            _targetGoal.copy(passengerCar.position).addScaledVector(_carFwd, 1.15);
            _targetGoal.y = 1.0;
          }
        } else if (preset === 'characters') {
          const speakerOffset =
            activeSpeakerId === 'benny'
              ? -0.75
              : activeSpeakerId === 'mia'
              ? 0.75
              : 0;
          const zoomIn =
            activeSpeakerId && activeSpeakerId !== 'narrator' ? -0.85 : 0;
          _camGoal.set(
            speakerOffset * 0.65,
            isBabyNow ? 1.8 : 2.15,
            (isBabyNow ? 7.8 : 8.6) + zoomIn + distBoost * 0.75
          );
          _targetGoal.set(speakerOffset * 0.75, isBabyNow ? 0.68 : 0.9, 2.3);
        } else if (preset === 'train' && train && train.units[0]) {
          const engPos = train.units[0].position;
          _camGoal.set(engPos.x * 0.65 + 3.6, 3.3, engPos.z + 7.2 + distBoost * 0.55);
          _targetGoal.set(engPos.x, 0.95, engPos.z);
        } else {
          const ang = elapsed * 0.25;
          _camGoal.set(Math.sin(ang) * (15.5 + distBoost), 5.6, Math.cos(ang) * (15.5 + distBoost));
          _targetGoal.set(0, 1.0, 1.5);
        }

        const dampRate = preset === 'train' || preset === 'orbit' || isTrackingTrain ? 3.4 : 3.8;
        const cinematicDrift = isPlayingRef.current ? Math.sin(elapsed * 0.55) * 0.14 : 0;
        camera.position.x = THREE.MathUtils.damp(
          camera.position.x,
          _camGoal.x + cinematicDrift,
          dampRate,
          delta
        );
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoal.y, dampRate, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoal.z, dampRate, delta);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetGoal.x, dampRate, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetGoal.y, dampRate, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetGoal.z, dampRate, delta);

        if (
          transitionActiveRef.current &&
          !isTrackingTrain &&
          preset !== 'train' &&
          preset !== 'orbit' &&
          camera.position.distanceTo(_camGoal) < 0.08
        ) {
          transitionActiveRef.current = false;
        }
      }

      controls.update();
      if (composer && !isSoftwareGl) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(container.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer?.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.dispose();
      composer?.dispose();
      composerRef.current = null;
      puffGeo.dispose();
      characters.forEach((rig) => {
        rig.textures.forEach((t) => t.dispose());
        rig.root.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material?.dispose();
            }
          }
        });
      });
      trainRef.current?.dispose();
      world.dispose();
      renderer.dispose();
      audioRef.current?.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Resize WebGL renderer cleanly when toggling between 16:9 and 9:16 Shorts format
  useEffect(() => {
    const container = mountRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!container || !renderer || !camera) return;
    const id = window.setTimeout(() => {
      const w = container.clientWidth;
      const h = Math.max(container.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composerRef.current?.setSize(w, h);
    }, 60);
    return () => window.clearTimeout(id);
  }, [formatMode]);

  useEffect(() => {
    const scene = sceneThreeRef.current;
    const world = worldRef.current;
    if (!scene || !world) return;

    const variantId = episode.trainVariant ?? (((episode.id - 1) % 10) + 1);
    world.setSkyMood(variantId);

    if (trainRef.current) {
      trainRef.current.units.forEach((u) => scene.remove(u));
      trainRef.current.steamPuffs.forEach((p) => {
        scene.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
      });
      trainRef.current.dispose();
    }

    const nextTrain = buildEpisodeTrain(variantId, isSoftwareGlRef.current);
    nextTrain.units.forEach((u) => scene.add(u));
    trainRef.current = nextTrain;
  }, [episode.id, episode.trainVariant]);

  useEffect(() => {
    const scene = episode.scenes[activeSceneIndex];
    if (scene) {
      setCameraPreset(scene.cameraPreset);
      userControllingRef.current = false;
      transitionActiveRef.current = true;
    }
  }, [activeSceneIndex, episode.id]);

  // Playback director supporting 40s preview, 45s 9:16 Short, and 300s (5-minute) Full Cut
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlaying) {
      audio.stopMusic();
      audio.stopVoice();
      return;
    }

    const variantId = episode.trainVariant ?? (((episode.id - 1) % 10) + 1);
    audio.startMusic(variantId);
    audio.playWhistle();
    const currentScene = episode.scenes[activeSceneIndex];
    if (currentScene) {
      const customIntro = customBabyIntroRef.current.trim();
      const baseNarration =
        activeSceneIndex === 0 && customIntro.length > 0 ? customIntro : currentScene.narration;

      const lineToSpeak =
        loopBeat === 7 && activeSceneIndex === episode.scenes.length - 1
          ? `Thank you for riding along with Mia, Benny, and Pip! Subscribe to RadiantSparkGlobal for our next StorySprout Studio adventure aboard the ${episode.trainName}!`
          : baseNarration;

      void audio.speakLine(lineToSpeak, currentScene.speaker, voiceEngineRef.current).then((res) => {
        if (res.error && voiceEngineRef.current !== 'browser') {
          setStatusNotice(`Voice notice: ${res.error} (using built-in voice).`);
        } else {
          setStatusNotice(null);
        }
      });
    }

    const totalLoops = formatMode === 'full5min' ? 7 : 1; // ~7.5 rounds x 40s = ~300s (5 minutes!)
    const sceneDur =
      formatMode === 'full5min' && loopBeat === 7 && activeSceneIndex === 3
        ? 20
        : currentScene?.durationSec ?? 10;

    const timer = window.setTimeout(() => {
      if (activeSceneIndex < episode.scenes.length - 1) {
        onSceneIndexChange(activeSceneIndex + 1);
      } else if (loopBeat < totalLoops) {
        setLoopBeat((b) => b + 1);
        onSceneIndexChange(0);
      } else {
        audio.playSparkle();
        setLoopBeat(1);
        onTogglePlay(false);
        if (recorderRef.current && recorderRef.current.state === 'recording') {
          recorderRef.current.stop();
        }
      }
    }, sceneDur * 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isPlaying, activeSceneIndex, episode.id, loopBeat, formatMode]);

  useEffect(() => {
    if (!isRecording) {
      setRecordSeconds(0);
      return;
    }
    const id = window.setInterval(() => {
      setRecordSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRecording]);

  const triggerElevenLabsSfx = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setStatusNotice('Generating ElevenLabs background music & train ambience...');
    try {
      const res = await fetch('/api/elevenlabs/sfx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Cheerful playful wooden toy train chugging with bright xylophone melody for kids episode ${episode.trainName}`,
          durationSeconds: 12,
        }),
      });
      const data = (await res.json()) as { audioBase64?: string; error?: string };
      if (!res.ok || !data.audioBase64) {
        throw new Error(data.error || 'ElevenLabs Sound API error');
      }
      await audio.playBase64IntoMix(data.audioBase64, false, 0.55);
      setStatusNotice('ElevenLabs background track mixed into 3D stage audio.');
    } catch (err: unknown) {
      setStatusNotice(
        err instanceof Error
          ? `${err.message} Built-in kids marimba & train audio remains active.`
          : 'Built-in kids marimba & train audio active.'
      );
    }
  };

  const startOrStopRecording = () => {
    if (isRecording && recorderRef.current) {
      recorderRef.current.stop();
      return;
    }

    const renderer = rendererRef.current;
    const audio = audioRef.current;
    if (!renderer || !audio) return;

    const canvasStream = renderer.domElement.captureStream(30);
    const audioStream = audio.getRecordingStream();
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...(audioStream ? audioStream.getAudioTracks() : []),
    ]);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';

    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 8_000_000,
      audioBitsPerSecond: 192_000,
    });
    recordedChunksRef.current = [];

    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) recordedChunksRef.current.push(ev.data);
    };

    recorder.onstop = () => {
      const dur = recordSecondsRef.current;
      setIsRecording(false);
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const safeName = episodeRef.current.trainName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const suffix =
        formatModeRef.current === 'short'
          ? 'short_9x16'
          : formatModeRef.current === 'full5min'
          ? '5min_full'
          : 'preview';
      const filename = `ep${String(episodeRef.current.id).padStart(2, '0')}_${safeName}_${suffix}.webm`;

      onRecordedClipReady({
        blob,
        filename,
        episode: episodeRef.current,
        formatMode: formatModeRef.current,
        durationSec: Math.max(dur, 1),
        createdAt: new Date().toLocaleTimeString(),
      });
    };

    recorderRef.current = recorder;
    recorder.start(250);
    setIsRecording(true);
    setLoopBeat(1);
    onSceneIndexChange(0);
    onTogglePlay(true);
  };

  const prevTickRef = useRef(recordRequestTick);
  useEffect(() => {
    if (recordRequestTick !== prevTickRef.current) {
      prevTickRef.current = recordRequestTick;
      startOrStopRecording();
    }
  }, [recordRequestTick]);

  const currentScene = episode.scenes[activeSceneIndex] || episode.scenes[0];
  const isBabyStageActive =
    stageMode === 'baby' || (stageMode === 'auto' && activeSceneIndex === 0);
  const displayNarration =
    activeSceneIndex === 0 && customBabyIntro.trim().length > 0
      ? customBabyIntro.trim()
      : currentScene.narration;

  const selectPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    userControllingRef.current = false;
    transitionActiveRef.current = true;
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audioRef.current?.setMuted(next);
  };

  const isShort = formatMode === 'short';

  return (
    <div className="space-y-3">
      {/* Format Mode, Stage Growth & Voice Agent Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            {(
              [
                ['full5min', '5-Min Full Video (16:9)'],
                ['short', 'YouTube Short (9:16)'],
                ['preview', '40s Quick Preview (16:9)'],
              ] as [VideoFormatMode, string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => onFormatModeChange(mode)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  formatMode === mode
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            {(
              [
                ['auto', 'Auto: Baby → Train'],
                ['baby', 'Baby Playground'],
                ['big', 'Riding Train'],
              ] as [CharacterStageMode, string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setStageMode(mode)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  stageMode === mode
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Voice:</span>
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            {(
              [
                ['elevenlabs', 'ElevenLabs'],
                ['gemini', 'Gemini TTS'],
                ['browser', 'Built-in'],
              ] as [VoiceEngine, string][]
            ).map(([eng, label]) => (
              <button
                key={eng}
                type="button"
                onClick={() => onVoiceEngineChange(eng)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  voiceEngine === eng
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={triggerElevenLabsSfx}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
          >
            <Music className="h-3.5 w-3.5 text-teal-600" />
            <span>Music Bed</span>
          </button>

          {!isShort && (
            <button
              type="button"
              onClick={() => setCinemaFraming((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer ${
                cinemaFraming
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Clapperboard className="h-3.5 w-3.5" />
              <span>Cinematic Bars</span>
            </button>
          )}
        </div>
      </div>

      {statusNotice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          {statusNotice}
        </div>
      )}

      {/* 3D Canvas Container (switches cleanly to 9:16 vertical center frame for Shorts) */}
      <div
        className={`relative mx-auto rounded-2xl overflow-hidden border border-slate-200 bg-sky-100 shadow-sm transition-all ${
          isShort ? 'w-full max-w-[380px] h-[640px]' : 'w-full h-[540px] lg:h-[620px]'
        }`}
      >
        <div ref={mountRef} className="w-full h-full" />

        {!isShort && cinemaFraming && (
          <>
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-5 bg-slate-950/85" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-5 bg-slate-950/85" />
          </>
        )}

        {webglError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 p-6 text-center">
            <div className="max-w-md space-y-2">
              <p className="font-display text-lg font-semibold text-slate-900">{webglError}</p>
              <p className="text-sm text-slate-600">
                Try reloading the preview or creating a new episode below.
              </p>
            </div>
          </div>
        )}

        {/* Top-left episode & scene badge */}
        <div className="pointer-events-none absolute top-6 left-4 right-4 flex items-start justify-between gap-3">
          <div className="pointer-events-auto max-w-md rounded-xl border border-slate-200/90 bg-white/95 px-3.5 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 tabular-nums">
              <span>Ep {String(episode.id).padStart(2, '0')}</span>
              <span aria-hidden="true">·</span>
              <span className={isBabyStageActive ? 'text-amber-700 font-semibold' : 'text-teal-700 font-semibold'}>
                {isBabyStageActive ? 'Baby Playground' : 'Riding Train · Big Kids'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {formatMode === 'full5min'
                  ? `5m Cut (Round ${loopBeat}/7)`
                  : formatMode === 'short'
                  ? '9:16 Short'
                  : `Scene ${currentScene.sceneNumber}/${episode.scenes.length}`}
              </span>
            </div>
            <p className="mt-0.5 font-display text-sm font-semibold text-slate-900 truncate">
              {currentScene.title}
            </p>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            {isRecording && (
              <div className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm tabular-nums">
                <Film className="h-3.5 w-3.5" />
                <span>
                  {String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:
                  {String(recordSeconds % 60).padStart(2, '0')}
                  {formatMode === 'full5min' ? ' / 05:00' : ''}
                </span>
              </div>
            )}
            {!isShort && (
              <button
                type="button"
                onClick={onExportThumbnail}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-teal-600" />
                <span>Thumbnail</span>
              </button>
            )}
          </div>
        </div>

        {/* Kids Interactive Prompt & @RadiantSparkGlobal Callout */}
        {!dockCollapsed && (
          <div className="pointer-events-none absolute bottom-24 left-1/2 w-[min(680px,92%)] -translate-x-1/2">
            <div className="rounded-xl border border-slate-200/90 bg-white/95 px-4 py-2.5 shadow-sm text-center">
              <div className="text-xs font-semibold text-teal-700">
                {formatMode === 'full5min' && loopBeat === 7 && activeSceneIndex === 3
                  ? 'StorySprout Studio · @RadiantSparkGlobal'
                  : currentScene.onScreenPrompt}
              </div>
              <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-800">
                <span className="font-semibold text-slate-900">{currentScene.speaker}:</span>{' '}
                {displayNarration}
              </p>
            </div>
          </div>
        )}

        {/* Collapsible Unified Bottom Control Dock */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-[min(860px,94%)] transition-transform duration-200 ${
            dockCollapsed ? 'bottom-3 translate-y-[calc(100%-34px)]' : 'bottom-4 translate-y-0'
          }`}
        >
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setDockCollapsed((v) => !v)}
              className="flex items-center gap-1 rounded-t-lg border border-b-0 border-slate-200 bg-white/95 px-3 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              {dockCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              <span>{dockCollapsed ? 'Show Controls' : 'Hide Controls'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onTogglePlay()}
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoopBeat(1);
                  onSceneIndexChange(0);
                  onTogglePlay(true);
                }}
                aria-label="Restart episode"
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              {!isShort && (
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                  {episode.scenes.map((sc, idx) => (
                    <button
                      key={sc.sceneNumber}
                      type="button"
                      onClick={() => onSceneIndexChange(idx)}
                      className={`rounded-md px-2 py-1 text-xs font-medium tabular-nums whitespace-nowrap shrink-0 cursor-pointer ${
                        idx === activeSceneIndex
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Sc {sc.sceneNumber}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!isShort && (
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                <Camera className="mx-1 h-3.5 w-3.5 text-slate-500" />
                {(
                  [
                    ['characters', 'Playground'],
                    ['train', 'Train'],
                    ['wide', 'Full Park'],
                    ['orbit', 'Orbit'],
                  ] as [CameraPreset, string][]
                ).map(([presetKey, label]) => (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => selectPreset(presetKey)}
                    className={`rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      cameraPreset === presetKey
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => audioRef.current?.playWhistle()}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Whistle
              </button>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? 'Unmute audio' : 'Mute audio'}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={startOrStopRecording}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <Film className="h-3.5 w-3.5" />
                <span>{isRecording ? 'Stop & Save' : 'Record'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
