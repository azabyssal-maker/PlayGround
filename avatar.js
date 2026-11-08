import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.querySelector('#avatarCanvas');
const wrap = document.querySelector('#character');
const status = document.querySelector('#avatarStatus');
const fallback = document.querySelector('#avatarFallback');

if (canvas && wrap && status) {
  let renderer;
  let frameId;

  const setStatus = (message) => {
    if (wrap.classList.contains('is-speaking') && message.includes('待机')) {
      status.textContent = 'Mori 正在回复…';
      status.dataset.state = 'speaking';
      return;
    }
    status.textContent = message;
    status.dataset.state = message.includes('失败') ? 'error' : 'ready';
  };

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
    scene.add(new THREE.HemisphereLight(0xe9e5ff, 0x7d6680, 2.1));

    const keyLight = new THREE.DirectionalLight(0xfff3e8, 3.2);
    keyLight.position.set(-3, 5, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xc8c3ff, 1.6);
    fillLight.position.set(4, 2, -3);
    scene.add(fillLight);

    const loader = new GLTFLoader();
    loader.load(
      './public/models/mori.glb',
      ({ scene: model, animations }) => {
        scene.add(model);
        model.updateWorldMatrix(true, true);

        const bounds = new THREE.Box3().setFromObject(model);
        if (bounds.isEmpty()) throw new Error('模型没有可显示的几何体');
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        model.position.sub(center);
        model.rotation.y = 0.12;

        const mixer = new THREE.AnimationMixer(model);
        const usableClips = animations.filter((clip) => clip.duration > 0);
        const idleClip = usableClips.find((clip) => /idle|stand|breath/i.test(clip.name)) || usableClips[0];
        if (idleClip) {
          mixer.clipAction(idleClip).setLoop(THREE.LoopRepeat, Infinity).reset().play();
        }

        let headBone;
        model.traverse((object) => {
          if (object.isBone && /head/i.test(object.name) && !headBone) headBone = object;
        });
        if (!headBone) {
          model.traverse((object) => {
            if (object.isBone && /neck/i.test(object.name) && !headBone) headBone = object;
          });
        }

        const fitCamera = () => {
          const width = Math.max(1, canvas.clientWidth);
          const height = Math.max(1, canvas.clientHeight);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();

          const verticalDistance = size.y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
          const horizontalDistance = size.x / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
          const distance = Math.max(verticalDistance, horizontalDistance, size.z) * 1.19;
          camera.position.set(distance * 0.045, size.y * 0.035, distance);
          camera.near = Math.max(size.y / 1000, 0.001);
          camera.far = Math.max(distance * 20, 100);
          camera.lookAt(0, 0, 0);
          camera.updateProjectionMatrix();
        };

        fitCamera();
        const resizeObserver = new ResizeObserver(fitCamera);
        resizeObserver.observe(wrap);

        const clock = new THREE.Clock();
        let previousHeadNod = 0;
        let elapsed = 0;
        const render = () => {
          frameId = requestAnimationFrame(render);
          const delta = Math.min(clock.getDelta(), 0.05);
          const reduceMotion = document.documentElement.classList.contains('reduce-motion');
          if (!reduceMotion) elapsed += delta;
          if (headBone && previousHeadNod) headBone.rotation.x -= previousHeadNod;
          mixer.update(reduceMotion ? 0 : delta);
          previousHeadNod = 0;
          if (!reduceMotion && wrap.classList.contains('is-speaking') && headBone) {
            previousHeadNod = Math.sin(elapsed * 12) * 0.045;
            headBone.rotation.x += previousHeadNod;
          }
          renderer.render(scene, camera);
        };

        wrap.classList.add('model-ready');
        fallback.hidden = true;
        setStatus(idleClip ? '3D 形象 · 动画待机' : '3D 形象已就绪');
        render();
      },
      undefined,
      (error) => {
        console.error('Mori 3D model failed to load:', error);
        fallback.hidden = false;
        canvas.hidden = true;
        setStatus('3D 加载失败 · 显示备用形象');
      },
    );
  } catch (error) {
    console.error('Mori 3D renderer could not start:', error);
    fallback.hidden = false;
    canvas.hidden = true;
    setStatus('3D 加载失败 · 显示备用形象');
  }

  window.addEventListener('pagehide', () => {
    if (frameId) cancelAnimationFrame(frameId);
    renderer?.dispose();
  }, { once: true });
}
