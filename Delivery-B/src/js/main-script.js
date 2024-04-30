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
  BASE_DEPTH = 4.4;
const TOWER_HEIGHT = 54.75,
  TOWER_WIDTH = 2.4;
const PORTA_LANCA_HEIGHT = 11.4,
  PORTA_LANCA_WIDTH = 1.8;
const CABIN_LENGTH = 2.4,
  CABIN_HEIGHT = 2.4,
  CABIN_DEPTH = 1.8;
const CABIN_Y_BASELINE = -0.3;
const LANCA_Y_BASELINE = 3.9;
const LANCA_LENGTH = 63,
  LANCA_DEPTH = PORTA_LANCA_WIDTH,
  LANCA_HEIGHT = 1.8;
const CART_LENGTH = 2,
  CART_HEIGHT = 0.9,
  CART_DEPTH = 1.8;
const CART_RANGE_MIN = CABIN_LENGTH + CART_LENGTH / 2,
  CART_RANGE_MAX = LANCA_LENGTH + PORTA_LANCA_WIDTH / 2 - CART_LENGTH / 2;
const CONTRA_LANCA_LENGTH = 12,
  CONTRA_LANCA_DEPTH = PORTA_LANCA_WIDTH,
  CONTRA_LANCA_HEIGHT = 0.6;
const CONTRA_PESO_LENGTH = 3,
  CONTRA_PESO_HEIGHT = 3.3,
  CONTRA_PESO_DEPTH = 1.2;
const CONTRA_PESO_Y_BASELINE = -0.15,
  CONTRA_PESO_LEFT_MARGIN = 0.5;
const TOTAL_CRANE_HEIGHT = BASE_HEIGHT + TOWER_HEIGHT + PORTA_LANCA_HEIGHT;

var scene, renderer;

var cameras = [];
var activeCamera;

var upperGroup, cartGroup;

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
  camera.lookAt(0, TOTAL_CRANE_HEIGHT / 2, 0);

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
function addCrane(parent) {
  "use strict";

  addBase(parent);

  addTower(parent);

  addUpperGroup(parent);
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

  const tower = new THREE.Object3D();

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
  tower.position.set(0, TOWER_HEIGHT / 2 + BASE_HEIGHT / 2, 0);

  parent.add(tower);
}

function addUpperGroup(parent) {
  "use strict";

  upperGroup = new THREE.Object3D();
  upperGroup.position.set(
    0,
    BASE_HEIGHT / 2 + TOWER_HEIGHT + LANCA_Y_BASELINE,
    0
  );

  addPortaLanca(upperGroup);

  addLanca(upperGroup);

  addContraLanca(upperGroup);

  addContraPeso(upperGroup);

  addCabin(upperGroup);

  addCartGroup(upperGroup);

  parent.add(upperGroup);
}

function addPortaLanca(parent) {
  "use strict";

  const portaLanca = new THREE.Object3D();

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
  portaLanca.position.set(0, PORTA_LANCA_HEIGHT / 2 - LANCA_Y_BASELINE, 0);

  parent.add(portaLanca);
}

function addCabin(parent) {
  "use strict";

  const cabin = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({
    color: 0xebba34,
    wireframe: false,
  });
  const geometry = new THREE.BoxGeometry(
    CABIN_LENGTH,
    CABIN_HEIGHT,
    CABIN_DEPTH
  );
  const mesh = new THREE.Mesh(geometry, material);

  cabin.add(mesh);
  cabin.position.set(
    (TOWER_WIDTH - PORTA_LANCA_WIDTH) / 2,
    CABIN_Y_BASELINE - CABIN_HEIGHT / 2,
    PORTA_LANCA_WIDTH
  );

  parent.add(cabin);
}

function addLanca(parent) {
  "use strict";

  const lanca = new THREE.Object3D();

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
  lanca.position.set(
    PORTA_LANCA_WIDTH / 2 + LANCA_LENGTH / 2,
    LANCA_HEIGHT / 2,
    0
  );

  parent.add(lanca);
}

function addCartGroup(parent) {
  "use strict";

  cartGroup = new THREE.Object3D();
  cartGroup.position.set(
    (CART_RANGE_MIN + CART_RANGE_MAX) / 2,
    -CART_HEIGHT / 2,
    0
  );

  addCart(cartGroup);

  parent.add(cartGroup);
}

function addCart(parent) {
  "use strict";

  const cart = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    wireframe: false,
  });
  const geometry = new THREE.BoxGeometry(CART_LENGTH, CART_HEIGHT, CART_DEPTH);
  const mesh = new THREE.Mesh(geometry, material);

  cart.add(mesh);
  cart.position.set(0, 0, 0);

  parent.add(cart);
}

function addContraLanca(parent) {
  "use strict";

  const contraLanca = new THREE.Object3D();

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
    -PORTA_LANCA_WIDTH / 2 - CONTRA_LANCA_LENGTH / 2,
    CONTRA_LANCA_HEIGHT / 2,
    0
  );

  parent.add(contraLanca);
}

function addContraPeso(parent) {
  "use strict";

  const contraPeso = new THREE.Object3D();

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
  contraPeso.position.set(
    -(
      PORTA_LANCA_WIDTH / 2 +
      CONTRA_LANCA_LENGTH -
      CONTRA_PESO_LEFT_MARGIN -
      CONTRA_PESO_LENGTH / 2
    ),
    CONTRA_LANCA_HEIGHT / 2 + CONTRA_PESO_Y_BASELINE,
    0
  );

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
      camera.lookAt(0, TOTAL_CRANE_HEIGHT / 2, 0);
      break;
    case "d":
      camera.position.x = x * Math.cos(-0.1) - z * Math.sin(-0.1);
      camera.position.z = x * Math.sin(-0.1) + z * Math.cos(-0.1);
      camera.lookAt(0, TOTAL_CRANE_HEIGHT / 2, 0);
      break;
    case "z":
      upperGroup.rotation.y += 0.05;
      break;
    case "x":
      upperGroup.rotation.y -= 0.05;
      break;
    case "c":
      if (cartGroup.position.x - 0.4 > CART_RANGE_MIN) {
        cartGroup.position.x -= 0.4;
      }
      break;
    case "v":
      if (cartGroup.position.x + 0.4 < CART_RANGE_MAX) {
        cartGroup.position.x += 0.4;
      }
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
