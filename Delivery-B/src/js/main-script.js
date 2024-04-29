import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
const BASE_HEIGHT = 3,
  BASE_LENGTH = 7.2,
  BASE_DEPTH = 2.4;
const TOWER_HEIGHT = 54.75,
  TOWER_WIDTH = 2.4;
const PORTA_LANCA_HEIGHT = 11.4,
  PORTA_LANCA_WIDTH = 1.8;
const LANCA_Y_BASELINE = 3.9;
const LANCA_LENGTH = 63,
  LANCA_DEPTH = PORTA_LANCA_WIDTH,
  LANCA_HEIGHT = 1.8;
const CONTRA_LANCA_LENGTH = 12,
  CONTRA_LANCA_DEPTH = PORTA_LANCA_WIDTH,
  CONTRA_LANCA_HEIGHT = 0.6;
const CONTRA_PESO_LENGTH = 3,
  CONTRA_PESO_HEIGHT = 3.3,
  CONTRA_PESO_DEPTH = 1.2;
const CONTRA_PESO_Y_BASELINE = -0.15,
  CONTRA_PESO_LEFT_MARGIN = 0.3;
const TOTAL_CRANE_HEIGHT = BASE_HEIGHT + TOWER_HEIGHT + PORTA_LANCA_HEIGHT;

var scene, renderer;

var cameras = [];
var activeCamera;

var tower, portaLanca, lanca, contraLanca, contraPeso;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
  "use strict";

  scene = new THREE.Scene();
  // TODO: use a light color as background
  scene.background = new THREE.Color(0x000000);

  scene.add(new THREE.AxesHelper(10));

  addCrane(scene);
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCameras() {
  "use strict";

  createPerspectiveCamera();
  createTopCamera();
  activeCamera = cameras[0];
}

function createPerspectiveCamera() {
  "use strict";
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    10,
    1000
  );
  camera.position.x = 0;
  camera.position.y = 70;
  camera.position.z = 50;
  camera.lookAt(0, TOTAL_CRANE_HEIGHT/2, 0);

  cameras.push(camera);
}

function createTopCamera() {
  "use strict";

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    10,
    1000
  );
  camera.position.x = 0;
  camera.position.y = TOTAL_CRANE_HEIGHT + 10;
  camera.position.z = 0;
  camera.lookAt(scene.position);

  cameras.push(camera);
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function addCrane(scene) {
  "use strict";

  addBase(scene);
  const baseTop = new THREE.Object3D();
  baseTop.position.set(0, BASE_HEIGHT / 2, 0);
  addTower(baseTop);
  scene.add(baseTop);

  const upperSection = new THREE.Object3D();
  upperSection.position.set(0, BASE_HEIGHT / 2 + TOWER_HEIGHT, 0);
  addUpperSection(upperSection);
  scene.add(upperSection);
}

function addBase(parent) {
  "use strict";

  const base = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: false,
  });
  const geometry = new THREE.BoxGeometry(BASE_LENGTH, BASE_HEIGHT, BASE_DEPTH);
  const mesh = new THREE.Mesh(geometry, material);

  base.add(mesh);
  base.position.set(0, 0, 0);

  parent.add(base);
}

function addTower(parent) {
  "use strict";

  tower = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    wireframe: false,
  });
  const geometry = new THREE.BoxGeometry(
    TOWER_WIDTH,
    TOWER_HEIGHT,
    TOWER_WIDTH
  );
  const mesh = new THREE.Mesh(geometry, material);

  tower.add(mesh);
  tower.position.set(0, TOWER_HEIGHT / 2, 0);

  parent.add(tower);
}

function addUpperSection(parent) {
  "use strict";
  addPortaLanca(parent);

  const lancaOffset = new THREE.Object3D();
  lancaOffset.position.set(PORTA_LANCA_WIDTH / 2, LANCA_Y_BASELINE, 0);
  addLanca(lancaOffset);
  parent.add(lancaOffset);

  const contraLancaOffset = new THREE.Object3D();
  contraLancaOffset.position.set(-PORTA_LANCA_WIDTH / 2, LANCA_Y_BASELINE, 0);
  addContraLanca(contraLancaOffset);
  parent.add(contraLancaOffset);

  const contraPesoOffset = new THREE.Object3D();
  contraPesoOffset.position.set(
    -(CONTRA_LANCA_LENGTH - CONTRA_PESO_LEFT_MARGIN - CONTRA_PESO_LENGTH / 2),
    LANCA_Y_BASELINE + CONTRA_LANCA_HEIGHT / 2 + CONTRA_PESO_Y_BASELINE,
    0
  );
  addContraPeso(contraPesoOffset);
  parent.add(contraPesoOffset);
}

function addPortaLanca(parent) {
  "use strict";

  portaLanca = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: false,
  });
  const geometry = new THREE.BoxGeometry(
    PORTA_LANCA_WIDTH,
    PORTA_LANCA_HEIGHT,
    PORTA_LANCA_WIDTH
  );
  const mesh = new THREE.Mesh(geometry, material);

  portaLanca.add(mesh);
  portaLanca.position.set(0, PORTA_LANCA_HEIGHT / 2, 0);

  parent.add(portaLanca);
}

function addLanca(parent) {
  "use strict";

  lanca = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: false,
  });
  const geometry = new THREE.BoxGeometry(
    LANCA_LENGTH,
    LANCA_HEIGHT,
    LANCA_DEPTH
  );
  const mesh = new THREE.Mesh(geometry, material);

  lanca.add(mesh);
  lanca.position.set(LANCA_LENGTH / 2, LANCA_HEIGHT / 2, 0);

  parent.add(lanca);
}

function addContraLanca(parent) {
  "use strict";

  contraLanca = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({
    color: 0xbd36c7,
    wireframe: false,
  });
  const geometry = new THREE.BoxGeometry(
    CONTRA_LANCA_LENGTH,
    CONTRA_LANCA_HEIGHT,
    CONTRA_LANCA_DEPTH
  );
  const mesh = new THREE.Mesh(geometry, material);

  contraLanca.add(mesh);
  contraLanca.position.set(
    -CONTRA_LANCA_LENGTH / 2,
    CONTRA_LANCA_HEIGHT / 2,
    0
  );

  parent.add(contraLanca);
}

function addContraPeso(parent) {
  "use strict";

  contraPeso = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({
    color: 0xbbbbbb,
    wireframe: false,
  });
  const geometry = new THREE.BoxGeometry(
    CONTRA_PESO_LENGTH,
    CONTRA_PESO_HEIGHT,
    CONTRA_PESO_DEPTH
  );
  const mesh = new THREE.Mesh(geometry, material);

  contraPeso.add(mesh);
  contraPeso.position.set(0, 0, 0);

  parent.add(contraPeso);
}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions() {
  "use strict";
}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions() {
  "use strict";
}

////////////
/* UPDATE */
////////////
function update() {
  "use strict";
}

/////////////
/* DISPLAY */
/////////////
function render() {
  "use strict";
  renderer.render(scene, activeCamera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
  "use strict";
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  createScene();
  createCameras();

  render();

  window.addEventListener("keydown", onKeyDown);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
  "use strict";

  render();

  requestAnimationFrame(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {
  "use strict";
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
  "use strict";

  const camera = activeCamera;
  const x = camera.position.x;
  const y = camera.position.y;
  const z = camera.position.z;

  switch (e.key) {
    case "1":
    case "2":
      activeCamera = cameras[Number(e.key) - 1];
      break;
    case "q":
      camera.position.x -= 1;
      break;
    case "e":
      camera.position.x += 1;
      break;
    case "w":
      camera.position.z -= 1; // Decrease the camera's z-coordinate to zoom in
      break;
    case "s":
      camera.position.z += 1; // Increase the camera's z-coordinate to zoom out
      break;
    case "ArrowDown":
      camera.position.y -= 1;
      break;
    case "ArrowUp":
      camera.position.y += 1;
      break;
    case "a":
      camera.position.x = x * Math.cos(0.1) - z * Math.sin(0.1);
      camera.position.z = x * Math.sin(0.1) + z * Math.cos(0.1);
      camera.lookAt(0, TOTAL_CRANE_HEIGHT/2, 0);
      break;
    case "d":
      camera.position.x = x * Math.cos(-0.1) - z * Math.sin(-0.1);
      camera.position.z = x * Math.sin(-0.1) + z * Math.cos(-0.1);
      camera.lookAt(0, TOTAL_CRANE_HEIGHT/2, 0);
      break;
  }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {
  "use strict";
}

init();
animate();
