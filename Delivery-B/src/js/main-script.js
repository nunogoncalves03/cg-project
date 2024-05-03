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
const CABLE_RADIUS = 0.1,
  CABLE_LENGTH = 24;
const CLAW_BASE_WIDTH = 2,
  CLAW_BASE_HEIGHT = 0.6;
const CLAW_ARM_LENGTH = 0.45,
  CLAW_ARM_HEIGHT = 2;
const CONTRA_LANCA_LENGTH = 12,
  CONTRA_LANCA_DEPTH = PORTA_LANCA_WIDTH,
  CONTRA_LANCA_HEIGHT = 0.6;
const CONTRA_PESO_LENGTH = 3,
  CONTRA_PESO_HEIGHT = 3.3,
  CONTRA_PESO_DEPTH = 1.2;
const CONTRA_PESO_Y_BASELINE = -0.15,
  CONTRA_PESO_LEFT_MARGIN = 0.5,
  CONTRA_PESO_X_DISTANCE =
    PORTA_LANCA_WIDTH / 2 +
    CONTRA_LANCA_LENGTH -
    CONTRA_PESO_LEFT_MARGIN -
    CONTRA_PESO_LENGTH / 2;

const TOTAL_CRANE_HEIGHT = BASE_HEIGHT + TOWER_HEIGHT + PORTA_LANCA_HEIGHT;
const PORTA_LANCA_UPPER_HEIGHT = PORTA_LANCA_HEIGHT - LANCA_Y_BASELINE;

const TIRANTE_RADIUS = 0.1;

const TIRANTE_FRENTE_X_DISTANCE = PORTA_LANCA_WIDTH / 2 + 30;
const TIRANTE_FRENTE_HEIGHT = PORTA_LANCA_UPPER_HEIGHT - LANCA_HEIGHT;
const TIRANTE_FRENTE_LENGTH = Math.sqrt(
  Math.pow(TIRANTE_FRENTE_X_DISTANCE, 2) + Math.pow(TIRANTE_FRENTE_HEIGHT, 2)
);
const TIRANTE_FRENTE_Z_ANGLE = Math.atan(
  TIRANTE_FRENTE_X_DISTANCE / TIRANTE_FRENTE_HEIGHT
);

const TIRANTE_TRAS_X_DISTANCE = CONTRA_PESO_X_DISTANCE;
const TIRANTE_TRAS_HEIGHT = PORTA_LANCA_UPPER_HEIGHT - CONTRA_LANCA_HEIGHT;
const TIRANTE_TRAS_LENGTH = Math.sqrt(
  Math.pow(TIRANTE_TRAS_X_DISTANCE, 2) + Math.pow(TIRANTE_TRAS_HEIGHT, 2)
);
const TIRANTE_TRAS_Z_ANGLE = -Math.atan(
  TIRANTE_TRAS_X_DISTANCE / TIRANTE_TRAS_HEIGHT
);

const DEFAULT_WIREFRAME = false;

var scene, renderer;

var cameras = [];
var activeCamera;

var upperGroup, cartGroup, cables, clawGroup, clawArms;

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

  createFrontCamera();
  createSideCamera();
  createTopCamera();
  createOrthogonalCamera();
  createPerspectiveCamera();
  createMobileCamera();

  // Start in the perspective camera
  activeCamera = cameras[4];
}

function createPerspectiveCamera() {
  "use strict";
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.x = 20;
  camera.position.y = 70;
  camera.position.z = 75;
  camera.lookAt(0, TOTAL_CRANE_HEIGHT / 2, 0);

  cameras.push(camera);
}

function createTopCamera() {
  "use strict";

  const aspectRatio = window.innerWidth / window.innerHeight;
  const cameraWidth = 150;
  const halfCameraHeight = cameraWidth / aspectRatio / 2;

  const camera = new THREE.OrthographicCamera(
    -halfCameraHeight * aspectRatio,
    halfCameraHeight * aspectRatio,
    halfCameraHeight,
    -halfCameraHeight,
    0.1,
    1000
  );
  camera.position.x = 0;
  camera.position.y = TOTAL_CRANE_HEIGHT + 10;
  camera.position.z = 0;
  camera.lookAt(scene.position);

  cameras.push(camera);
}

function createFrontCamera() {
  "use strict";

  const aspectRatio = window.innerWidth / window.innerHeight;
  const cameraWidth = 150;
  const halfCameraHeight = cameraWidth / aspectRatio / 2;

  const camera = new THREE.OrthographicCamera(
    -halfCameraHeight * aspectRatio,
    halfCameraHeight * aspectRatio,
    halfCameraHeight,
    -halfCameraHeight,
    0.1,
    1000
  );
  camera.position.x = LANCA_LENGTH + PORTA_LANCA_WIDTH / 2 + 1;
  camera.position.y = TOTAL_CRANE_HEIGHT / 2;
  camera.position.z = 0;
  camera.lookAt(0, TOTAL_CRANE_HEIGHT / 2, 0);

  cameras.push(camera);
}

function createSideCamera() {
  "use strict";

  const aspectRatio = window.innerWidth / window.innerHeight;
  const cameraWidth = 150;
  const halfCameraHeight = cameraWidth / aspectRatio / 2;

  const camera = new THREE.OrthographicCamera(
    -halfCameraHeight * aspectRatio,
    halfCameraHeight * aspectRatio,
    halfCameraHeight,
    -halfCameraHeight,
    0.1,
    1000
  );
  camera.position.x = 0;
  camera.position.y = TOTAL_CRANE_HEIGHT / 2;
  camera.position.z = LANCA_LENGTH + PORTA_LANCA_WIDTH / 2 + 1;
  camera.lookAt(0, TOTAL_CRANE_HEIGHT / 2, 0);

  cameras.push(camera);
}

function createOrthogonalCamera() {
  "use strict";

  const aspectRatio = window.innerWidth / window.innerHeight;
  const cameraWidth = 150;
  const halfCameraHeight = cameraWidth / aspectRatio / 2;

  const camera = new THREE.OrthographicCamera(
    -halfCameraHeight * aspectRatio,
    halfCameraHeight * aspectRatio,
    halfCameraHeight + 20,
    -halfCameraHeight + 20,
    0.1,
    1000
  );
  camera.position.x = 70;
  camera.position.y = TOTAL_CRANE_HEIGHT + 10;
  camera.position.z = 70;
  camera.lookAt(scene.position);

  cameras.push(camera);
}

function createMobileCamera() {
  "use strict";

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  clawGroup.add(camera);

  camera.position.x = 0;
  camera.position.y = -CLAW_BASE_HEIGHT / 2;
  camera.position.z = 0;

  const vector = new THREE.Vector3();
  clawGroup.getWorldPosition(vector);
  camera.lookAt(vector.x, 0, vector.z);

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
    wireframe: DEFAULT_WIREFRAME,
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
    wireframe: DEFAULT_WIREFRAME,
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

  addTirantesFrente(upperGroup);

  addTirantesTras(upperGroup);

  addCabin(upperGroup);

  addCartGroup(upperGroup);

  parent.add(upperGroup);
}

function addPortaLanca(parent) {
  "use strict";

  const portaLanca = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: DEFAULT_WIREFRAME,
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
    wireframe: DEFAULT_WIREFRAME,
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
    wireframe: DEFAULT_WIREFRAME,
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

  addClawCables(cartGroup);

  addClawGroup(cartGroup);

  parent.add(cartGroup);
}

function addCart(parent) {
  "use strict";

  const cart = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    wireframe: DEFAULT_WIREFRAME,
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
    wireframe: DEFAULT_WIREFRAME,
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

function addClawCables(parent) {
  "use strict";

  const cable = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: DEFAULT_WIREFRAME,
  });

  const geometry = new THREE.CylinderGeometry(
    CABLE_RADIUS,
    CABLE_RADIUS,
    CABLE_LENGTH,
    64,
    64
  );
  const mesh = new THREE.Mesh(geometry, material);

  cable.add(mesh);
  cable.position.set(0, -CABLE_LENGTH / 2 - CART_HEIGHT / 2, 0);

  cable.userData.length = geometry.parameters.height;

  const cable2 = cable.clone();
  cable2.position.setX(((-4 / 5) * CART_LENGTH) / 2 + CABLE_RADIUS);
  cable.position.setX(((4 / 5) * CART_LENGTH) / 2 - CABLE_RADIUS);

  cables = [cable, cable2];

  parent.add(cable);
  parent.add(cable2);
}

function addClawGroup(parent) {
  "use strict";

  clawGroup = new THREE.Object3D();
  clawGroup.position.set(
    0,
    -CART_HEIGHT / 2 - cables[0].userData.length - CLAW_BASE_HEIGHT / 2,
    0
  );

  addClawBase(clawGroup);
  addClawArms(clawGroup);

  parent.add(clawGroup);
}

function addClawBase(parent) {
  "use strict";

  const clawBase = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({
    color: 0xbd36c7,
    wireframe: DEFAULT_WIREFRAME,
  });
  const geometry = new THREE.BoxGeometry(
    CLAW_BASE_WIDTH,
    CLAW_BASE_HEIGHT,
    CLAW_BASE_WIDTH
  );
  const mesh = new THREE.Mesh(geometry, material);

  clawBase.add(mesh);
  clawBase.position.set(0, 0, 0);

  parent.add(clawBase);
}

function addClawArms(parent) {
  "use strict";

  const clawArm = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: DEFAULT_WIREFRAME,
  });

  const geometry = new THREE.CylinderGeometry(
    CLAW_ARM_LENGTH / 2 / Math.cos(Math.PI / 4),
    0,
    CLAW_ARM_HEIGHT,
    3,
    1
  );
  const mesh = new THREE.Mesh(geometry, material);

  clawArm.add(mesh);
  clawArm.position.set(0, -CLAW_BASE_HEIGHT / 2 - CLAW_ARM_HEIGHT / 2, 0);

  clawArm.userData.angle = clawArm.rotation.z;

  const clawArm2 = clawArm.clone();
  const clawArm3 = clawArm.clone();
  const clawArm4 = clawArm.clone();

  clawArm.position.setX(CLAW_BASE_WIDTH / 2 - CLAW_ARM_LENGTH / 2);
  clawArm.position.setZ(CLAW_BASE_WIDTH / 2 - CLAW_ARM_LENGTH / 2);
  clawArm.rotation.y = Math.PI / 4;
  clawArm2.position.setX(-CLAW_BASE_WIDTH / 2 + CLAW_ARM_LENGTH / 2);
  clawArm2.position.setZ(CLAW_BASE_WIDTH / 2 - CLAW_ARM_LENGTH / 2);
  clawArm2.rotation.y = -Math.PI / 4;
  clawArm3.position.setX(-CLAW_BASE_WIDTH / 2 + CLAW_ARM_LENGTH / 2);
  clawArm3.position.setZ(-CLAW_BASE_WIDTH / 2 + CLAW_ARM_LENGTH / 2);
  clawArm3.rotation.y = -3 * (Math.PI / 4);
  clawArm4.position.setX(CLAW_BASE_WIDTH / 2 - CLAW_ARM_LENGTH / 2);
  clawArm4.position.setZ(-CLAW_BASE_WIDTH / 2 + CLAW_ARM_LENGTH / 2);
  clawArm4.rotation.y = 3 * (Math.PI / 4);

  clawArms = [clawArm, clawArm2, clawArm3, clawArm4];

  parent.add(clawArm);
  parent.add(clawArm2);
  parent.add(clawArm3);
  parent.add(clawArm4);
}

function addContraPeso(parent) {
  "use strict";

  const contraPeso = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({
    color: 0xbbbbbb,
    wireframe: DEFAULT_WIREFRAME,
  });
  const geometry = new THREE.BoxGeometry(
    CONTRA_PESO_LENGTH,
    CONTRA_PESO_HEIGHT,
    CONTRA_PESO_DEPTH
  );
  const mesh = new THREE.Mesh(geometry, material);

  contraPeso.add(mesh);
  contraPeso.position.set(
    -CONTRA_PESO_X_DISTANCE,
    CONTRA_LANCA_HEIGHT / 2 + CONTRA_PESO_Y_BASELINE,
    0
  );

  parent.add(contraPeso);
}

function addTirantesFrente(parent) {
  "use strict";

  const tiranteFrente = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    wireframe: DEFAULT_WIREFRAME,
  });

  const geometry = new THREE.CylinderGeometry(
    TIRANTE_RADIUS,
    TIRANTE_RADIUS,
    TIRANTE_FRENTE_LENGTH,
    64,
    64
  );
  const mesh = new THREE.Mesh(geometry, material);

  tiranteFrente.add(mesh);
  tiranteFrente.position.set(
    TIRANTE_FRENTE_LENGTH / 2,
    TIRANTE_FRENTE_HEIGHT / 2 + LANCA_HEIGHT - TIRANTE_RADIUS,
    0
  );
  tiranteFrente.rotation.z = TIRANTE_FRENTE_Z_ANGLE;

  const tiranteFrente2 = tiranteFrente.clone();
  tiranteFrente2.position.setZ(-PORTA_LANCA_WIDTH / 2 + TIRANTE_RADIUS + 0.01);
  tiranteFrente.position.setZ(PORTA_LANCA_WIDTH / 2 - TIRANTE_RADIUS - 0.01);

  parent.add(tiranteFrente);
  parent.add(tiranteFrente2);
}

function addTirantesTras(parent) {
  "use strict";

  const tiranteTras = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    wireframe: DEFAULT_WIREFRAME,
  });

  const geometry = new THREE.CylinderGeometry(
    TIRANTE_RADIUS,
    TIRANTE_RADIUS,
    TIRANTE_TRAS_LENGTH,
    64,
    64
  );
  const mesh = new THREE.Mesh(geometry, material);

  tiranteTras.add(mesh);
  tiranteTras.position.set(
    -TIRANTE_TRAS_LENGTH / 2 + PORTA_LANCA_WIDTH / 2,
    TIRANTE_TRAS_HEIGHT / 2 + CONTRA_LANCA_HEIGHT - TIRANTE_RADIUS,
    0
  );
  tiranteTras.rotation.z = TIRANTE_TRAS_Z_ANGLE;

  const tiranteTras2 = tiranteTras.clone();
  tiranteTras2.position.setZ(-PORTA_LANCA_WIDTH / 2 + TIRANTE_RADIUS + 0.01);
  tiranteTras.position.setZ(PORTA_LANCA_WIDTH / 2 - TIRANTE_RADIUS - 0.01);

  parent.add(tiranteTras);
  parent.add(tiranteTras2);
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
    case "3":
    case "4":
    case "5":
    case "6":
      activeCamera = cameras[Number(e.key) - 1];
      break;
    case "g":
      scene.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.material.wireframe = !child.material.wireframe;
        }
      });
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
    case "b":
    case "n":
      const DELTA = 0.4;

      const currentLength = cables[0].userData.length;

      if (
        (e.key == "b" && currentLength <= 4 * DELTA) ||
        (e.key == "n" && currentLength + DELTA > TOWER_HEIGHT)
      )
        return;

      const newHeight = currentLength - (e.key == "b" ? DELTA : -DELTA);
      const factor = newHeight / CABLE_LENGTH;

      cables.forEach((cable) => {
        cable.position.y += e.key == "b" ? DELTA / 2 : -DELTA / 2;
        cable.scale.y = factor;
        cable.userData.length = newHeight;
      });

      clawGroup.position.y += e.key == "b" ? DELTA : -DELTA;
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
