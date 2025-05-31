import * as THREE from 'three';

// -- Splash and Game Over UI Elements --
const container = document.getElementById('threejs-canvas-container');
const resultDiv = document.getElementById('result-string');

// Create splash screen
const splashDiv = document.createElement('div');
splashDiv.id = 'splash-screen';
splashDiv.style.position = 'absolute';
splashDiv.style.top = 0;
splashDiv.style.left = 0;
splashDiv.style.width = '100%';
splashDiv.style.height = '100%';
splashDiv.style.background = 'rgba(24,26,32,0.93)';
splashDiv.style.display = 'flex';
splashDiv.style.flexDirection = 'column';
splashDiv.style.justifyContent = 'center';
splashDiv.style.alignItems = 'center';
splashDiv.style.zIndex = 20;
splashDiv.innerHTML = `
  <div style="font-size:2.5em;font-weight:bold;margin-bottom:0.6em;letter-spacing:0.05em;">Viewpoint</div>
  <div style="font-size:1.3em;margin-bottom:2em;color:#c9deff;">Guess the viewpoint!<br>Click your guess on the right, based on the left view.<br>5 rounds. Good luck!</div>
  <button id="start-game-btn" style="padding:0.7em 2.5em;font-size:1.3em;border-radius:1.2em;border:none;background:#375afe;color:#fff;font-weight:bold;cursor:pointer;box-shadow:0 2px 8px #0007;">Start</button>
`;
container.appendChild(splashDiv);

// Create game over screen
const gameOverDiv = document.createElement('div');
gameOverDiv.id = 'gameover-screen';
gameOverDiv.style.position = 'absolute';
gameOverDiv.style.top = 0;
gameOverDiv.style.left = 0;
gameOverDiv.style.width = '100%';
gameOverDiv.style.height = '100%';
gameOverDiv.style.background = 'rgba(24,26,32,0.96)';
gameOverDiv.style.display = 'none';
gameOverDiv.style.flexDirection = 'column';
gameOverDiv.style.justifyContent = 'center';
gameOverDiv.style.alignItems = 'center';
gameOverDiv.style.zIndex = 21;
gameOverDiv.innerHTML = `
  <div style="font-size:2.3em;font-weight:bold;margin-bottom:0.6em;letter-spacing:0.04em;">Game Over</div>
  <div id="final-score" style="font-size:1.4em;margin-bottom:1.3em;color:#ffecbc;"></div>
  <button id="restart-game-btn" style="padding:0.6em 2em;font-size:1.15em;border-radius:1.2em;border:none;background:#375afe;color:#fff;font-weight:bold;cursor:pointer;box-shadow:0 2px 8px #0007;">Play Again</button>
`;
container.appendChild(gameOverDiv);

function showSplash() {
  splashDiv.style.display = 'flex';
  gameOverDiv.style.display = 'none';
  resultDiv.textContent = '';
  // Hide titles and result box
  document.querySelector('.header').style.display = 'none';
  document.querySelector('.instructions-row').style.display = 'none';
  resultDiv.style.display = 'none';
}
function hideSplash() {
  splashDiv.style.display = 'none';
  // Show titles and result box
  document.querySelector('.header').style.display = '';
  document.querySelector('.instructions-row').style.display = '';
  resultDiv.style.display = '';
}
function showGameOver(total, perRound) {
  gameOverDiv.style.display = 'flex';
  splashDiv.style.display = 'none';
  // Hide titles and result box
  document.querySelector('.header').style.display = 'none';
  document.querySelector('.instructions-row').style.display = 'none';
  resultDiv.style.display = 'none';

  let roundsHtml = perRound.map((d, i) => {
    const rating = getRating(d);
    return `<div style="margin-bottom:0.14em;">Round ${i + 1}: <span style="color:#ffe477">${d.toFixed(2)} m</span> <span style="color:#b7caff;font-size:1em;">${rating}</span></div>`;
  }).join('');

  // Compare and update best score
  let best = getBestScore();
  let isNewBest = false;
  if (best === null || total < best) {
    setBestScore(total);
    best = total;
    isNewBest = true;
  }

  document.getElementById('final-score').innerHTML = `
    <div style="margin-bottom:0.4em;">
      Your total distance: <b style="color:#fff">${total.toFixed(2)}m</b>
      <br>
      ${isNewBest
        ? `<span style="color:#28ff88;font-weight:bold;">New Best Score!</span>`
        : `<span style="color:#bbb;">Best: ${best.toFixed(2)}m</span>`
      }
    </div>
    ${roundsHtml}
  `;
}
function hideGameOver() {
  gameOverDiv.style.display = 'none';
  // Show titles and result box
  document.querySelector('.header').style.display = '';
  document.querySelector('.instructions-row').style.display = '';
  resultDiv.style.display = '';
}

document.getElementById('start-game-btn').onclick = () => {
  startGame();
};
document.getElementById('restart-game-btn').onclick = () => {
  startGame();
};

// -- Best score helpers --
function getBestScore() {
  const val = localStorage.getItem('viewpoint_best_total_distance');
  return val === null ? null : parseFloat(val);
}
function setBestScore(val) {
  localStorage.setItem('viewpoint_best_total_distance', val.toFixed(2));
}

// -- 3D Setup --
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202040);

const groundSize = 40;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setScissorTest(true);
container.appendChild(renderer.domElement);

const orthoCamera = new THREE.OrthographicCamera(-groundSize/2, groundSize/2, groundSize/2, -groundSize/2, 0.1, 100);
orthoCamera.position.set(0, 30, 0);
orthoCamera.lookAt(0, 0, 0);
orthoCamera.up.set(0, 0, -1);
orthoCamera.layers.enable(0);
orthoCamera.layers.enable(1);

function randomOnGround() {
  const margin = 2.0;
  const x = (Math.random() - 0.5) * (groundSize - margin * 2);
  const z = (Math.random() - 0.5) * (groundSize - margin * 2);
  return { x, z };
}

function randomColor() { return new THREE.Color(Math.random(), Math.random(), Math.random()); }

function createRandomPrimitive() {
  const type = Math.floor(Math.random() * 3);
  let mesh, height = 1;
  const material = new THREE.MeshStandardMaterial({ color: randomColor() });
  switch (type) {
    case 0: height = 1; mesh = new THREE.Mesh(new THREE.BoxGeometry(1, height, 1), material); break;
    case 1: height = 1.4; mesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16), material); break;
    case 2: height = 1.2; mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, height, 16), material); break;
  }
  const margin = 1.5;
  const x = (Math.random() - 0.5) * (groundSize - margin * 2);
  const z = (Math.random() - 0.5) * (groundSize - margin * 2);
  mesh.position.set(x, height / 2, z);
  mesh.rotation.y = Math.random() * Math.PI * 2;
  return mesh;
}

// -- Generate and store all primitives
let primitives = [];
function setupPrimitives() {
  // Remove existing
  primitives.forEach(p => scene.remove(p));
  primitives = [];
  for (let i = 0; i < 20; i++) {
    const primitive = createRandomPrimitive();
    primitives.push(primitive);
    scene.add(primitive);
  }
}

// -- Camera placement helper: ensure at least 3 primitives are visible
function positionCameraToSeePrimitives(camera, numPrimitives = 3) {
  let attempt = 0, maxAttempts = 30;
  let found = false;
  let camInfo;
  while (attempt < maxAttempts && !found) {
    camInfo = randomCamera();
    camera.position.copy(camInfo.position);
    camera.lookAt(camInfo.target);
    camera.aspect = 16/9;
    camera.updateProjectionMatrix();

    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    const frustum = new THREE.Frustum();
    const camViewProjection = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(camViewProjection);

    let visibleCount = 0;
    for (let i = 0; i < primitives.length; i++) {
      const mesh = primitives[i];
      mesh.geometry.computeBoundingSphere();
      const center = mesh.geometry.boundingSphere.center.clone().applyMatrix4(mesh.matrixWorld);
      const radius = mesh.geometry.boundingSphere.radius * mesh.scale.x;
      if (frustum.intersectsSphere(new THREE.Sphere(center, radius))) {
        visibleCount++;
        if (visibleCount >= numPrimitives) break;
      }
    }
    if (visibleCount >= numPrimitives) {
      found = true;
      break;
    }
    attempt++;
  }
  return camInfo;
}

function randomCamera() {
  const {x, z} = randomOnGround();
  const y = 1.3;
  const theta = Math.random() * Math.PI * 2;
  return {
    position: new THREE.Vector3(x, y, z),
    target: new THREE.Vector3(x + Math.sin(theta), y, z + Math.cos(theta)),
  };
}

// -- Game state
let camInfo = null;
const perspCamera = new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000);
// Only render default layer for perspective camera
perspCamera.layers.enable(0);
perspCamera.layers.disable(1);

// -- Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x888888));

// -- Ground
const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x444455 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

// -- Sprite markers for guess and true location
let guessUrl = new URL('./assets/guess.png', import.meta.url);
const guessTexture = new THREE.TextureLoader().load(guessUrl);
const guessSpriteMaterial = new THREE.SpriteMaterial({ map: guessTexture, depthTest: false, depthWrite: false });
const guessSprite = new THREE.Sprite(guessSpriteMaterial);
guessSprite.visible = false;
guessSprite.scale.set(2, 2, 1);
guessSprite.center.set(0.5, 0); // Pivot at bottom center
guessSprite.layers.set(1);
scene.add(guessSprite);

let cameraUrl = new URL('./assets/camera.png', import.meta.url);
const cameraTexture = new THREE.TextureLoader().load(cameraUrl);
const cameraSpriteMaterial = new THREE.SpriteMaterial({ map: cameraTexture, depthTest: false, depthWrite: false });
const cameraSprite = new THREE.Sprite(cameraSpriteMaterial);
cameraSprite.visible = false;
cameraSprite.scale.set(2, 2, 1);
cameraSprite.layers.set(1);
scene.add(cameraSprite);

// -- Dotted line and distance label
let distanceLine = null;
let distanceLabelDiv = null;

// -- Score/rating helper
function getRating(dist) {
  if (dist < 1) return "Spot on!";
  if (dist < 3) return "Very close!";
  if (dist < 5) return "Close!";
  if (dist < 10) return "Not bad.";
  if (dist < 20) return "A bit off!";
  return "Way off!";
}

function showScore(dist) {
  // Remove previous line and label if any
  if (distanceLine) {
    scene.remove(distanceLine);
    distanceLine.geometry.dispose();
    distanceLine.material.dispose();
    distanceLine = null;
  }
  if (distanceLabelDiv) {
    distanceLabelDiv.remove();
    distanceLabelDiv = null;
  }

  const rating = getRating(dist);
  resultDiv.textContent = `${rating}`;

  // Draw dotted line and label if more than 1m off
  if (dist >= 1) {
    const guessPos = guessSprite.position.clone();
    const answerPos = cameraSprite.position.clone();
    guessPos.y = 2.0;
    answerPos.y = 2.0;
    const points = [guessPos, answerPos];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineDashedMaterial({
      color: 0xffcc44,
      dashSize: 0.5,
      gapSize: 0.25,
      linewidth: 2
    });

    distanceLine = new THREE.Line(geometry, material);
    distanceLine.computeLineDistances();
    distanceLine.layers.set(1);
    scene.add(distanceLine);

    distanceLabelDiv = document.createElement('div');
    distanceLabelDiv.textContent = `${dist.toFixed(2)} m`;
    distanceLabelDiv.style.position = 'absolute';
    distanceLabelDiv.style.padding = '4px 12px';
    distanceLabelDiv.style.background = '#23263ad8';
    distanceLabelDiv.style.color = '#ffdd77';
    distanceLabelDiv.style.fontSize = '1.2em';
    distanceLabelDiv.style.fontWeight = 'bold';
    distanceLabelDiv.style.borderRadius = '1em';
    distanceLabelDiv.style.pointerEvents = 'none';
    distanceLabelDiv.style.transform = 'translate(-50%, -50%)';
    distanceLabelDiv.style.zIndex = '12';

    const mid = guessPos.clone().lerp(answerPos, 0.5);
    function updateLabelPosition() {
      const v = viewports.ortho;
      const width = v.w;
      const height = v.h;
      const px = v.x + ((mid.x + groundSize/2) / groundSize) * width;
      const py = v.y + ((-mid.z + groundSize/2) / groundSize) * height;
      distanceLabelDiv.style.left = `${px}px`;
      distanceLabelDiv.style.top = `${py}px`;
    }
    updateLabelPosition();
    container.appendChild(distanceLabelDiv);

    function animateLabel() {
      if (!distanceLabelDiv) return;
      updateLabelPosition();
      requestAnimationFrame(animateLabel);
    }
    animateLabel();
  }
}

// -- Layout constants
const VIEWPORT_MARGIN = 20;
const VIEWPORT_GUTTER = 20;

function updateRendererSizeAndViewports() {
  const containerRect = container.getBoundingClientRect();
  const availW = containerRect.width;
  const availH = containerRect.height;

  const sByHeight = availH;
  const sByWidth = (availW - VIEWPORT_GUTTER) / (1 + 16/9);

  const s = Math.floor(Math.min(sByHeight, sByWidth));

  const perspW = Math.floor(s * 16 / 9);
  const perspH = s;
  const orthoW = s;
  const orthoH = s;

  const totalW = perspW + VIEWPORT_GUTTER + orthoW;
  const totalH = s;

  renderer.setSize(totalW, totalH, false);

  renderer.domElement.style.width = `${totalW}px`;
  renderer.domElement.style.height = `${totalH}px`;
  renderer.domElement.style.position = 'relative';
  renderer.domElement.style.left = '0px';
  renderer.domElement.style.top = '0px';
  renderer.domElement.style.display = 'block';

  return {
    persp: { x: 0, y: 0, w: perspW, h: perspH },
    ortho: { x: perspW + VIEWPORT_GUTTER, y: 0, w: orthoW, h: orthoH },
    totalW,
    totalH,
    margin: VIEWPORT_MARGIN,
    gutter: VIEWPORT_GUTTER,
    s
  };
}

// -- Game logic state --
let acceptingGuesses = false;
let gameState = 'splash'; // 'splash' | 'playing' | 'gameover'
let rounds = 5;
let currentRound = 0;
let roundDistances = [];

// -- Game control functions --
function startGame() {
  setupPrimitives();
  hideSplash();
  hideGameOver();
  resultDiv.textContent = '';
  guessSprite.visible = false;
  cameraSprite.visible = false;
  if (distanceLine) {
    scene.remove(distanceLine);
    distanceLine.geometry.dispose();
    distanceLine.material.dispose();
    distanceLine = null;
  }
  if (distanceLabelDiv) {
    distanceLabelDiv.remove();
    distanceLabelDiv = null;
  }
  currentRound = 0;
  roundDistances = [];
  gameState = 'playing';
  nextRound();
}

function nextRound() {
  if (currentRound >= rounds) {
    endGame();
    return;
  }
  // Reset
  guessSprite.visible = false;
  cameraSprite.visible = false;
  if (distanceLine) {
    scene.remove(distanceLine);
    distanceLine.geometry.dispose();
    distanceLine.material.dispose();
    distanceLine = null;
  }
  if (distanceLabelDiv) {
    distanceLabelDiv.remove();
    distanceLabelDiv = null;
  }
  resultDiv.textContent = `Round ${currentRound + 1} of ${rounds}`;
  resultDiv.style.display = '';
  // Place new camera
  camInfo = positionCameraToSeePrimitives(perspCamera, 3);
  perspCamera.position.copy(camInfo.position);
  perspCamera.lookAt(camInfo.target);
  acceptingGuesses = true;
}

function endGame() {
  gameState = 'gameover';
  acceptingGuesses = false;
  const total = roundDistances.reduce((a, b) => a + b, 0);
  showGameOver(total, roundDistances);
}

// -- Animation loop
let viewports = updateRendererSizeAndViewports();
function animate() {
  viewports = updateRendererSizeAndViewports();

  // Perspective camera: left
  renderer.setViewport(viewports.persp.x, viewports.persp.y, viewports.persp.w, viewports.persp.h);
  renderer.setScissor(viewports.persp.x, viewports.persp.y, viewports.persp.w, viewports.persp.h);
  perspCamera.aspect = viewports.persp.w / viewports.persp.h;
  perspCamera.updateProjectionMatrix();
  renderer.autoClear = true;
  perspCamera.layers.set(0);
  renderer.render(scene, perspCamera);

  // Ortho camera: right
  renderer.setViewport(viewports.ortho.x, viewports.ortho.y, viewports.ortho.w, viewports.ortho.h);
  renderer.setScissor(viewports.ortho.x, viewports.ortho.y, viewports.ortho.w, viewports.ortho.h);
  const orthoHalf = groundSize / 2;
  orthoCamera.left = -orthoHalf;
  orthoCamera.right = orthoHalf;
  orthoCamera.top = orthoHalf;
  orthoCamera.bottom = -orthoHalf;
  orthoCamera.aspect = 1;
  orthoCamera.updateProjectionMatrix();
  orthoCamera.layers.enable(0);
  orthoCamera.layers.enable(1);
  renderer.autoClear = false;
  renderer.render(scene, orthoCamera);

  requestAnimationFrame(animate);
}
animate();
window.addEventListener('resize', animate);

// -- Mouse click handling for guesses
renderer.domElement.addEventListener('click', e => {
  if (!acceptingGuesses || gameState !== 'playing') return;

  // Adjust mouse position for renderer's offset
  const rect = renderer.domElement.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const v = viewports.ortho;
  if (
    mouseX >= v.x && mouseX < v.x + v.w &&
    mouseY >= v.y && mouseY < v.y + v.h
  ) {
    acceptingGuesses = false;

    // Convert mouse to NDC in ortho viewport
    const ndcX = ((mouseX - v.x) / v.w) * 2 - 1;
    const ndcY = ((mouseY - v.y) / v.h) * 2 - 1;

    // Map NDC to world coordinates using ortho camera
    const worldX = ndcX * (groundSize/2);
    const worldZ = ndcY * (groundSize/2);

    // Place guess sprite
    guessSprite.position.set(worldX, 2.0, worldZ);
    guessSprite.visible = true;

    // Place camera sprite
    cameraSprite.position.copy(camInfo.position);
    cameraSprite.position.y = 2.0;
    cameraSprite.visible = true;

    // Score (Euclidean distance on XZ plane)
    const dx = worldX - camInfo.position.x;
    const dz = worldZ - camInfo.position.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    showScore(dist);

    roundDistances.push(dist);

    setTimeout(() => {
      currentRound++;
      nextRound();
    }, 2000);
  }
});

// -- Start with splash
showSplash();