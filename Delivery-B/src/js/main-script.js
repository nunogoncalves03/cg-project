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
const CART_RANGE_MIN = CABIN_LENGTH + CART_LENGTH + 5,
  CART_RANGE_MAX = LANCA_LENGTH + PORTA_LANCA_WIDTH / 2 - CART_LENGTH / 2;

const CABLE_RADIUS = 0.1,
  CABLE_LENGTH = 24;

const CLAW_BASE_WIDTH = 2,
  CLAW_BASE_HEIGHT = 0.6;
const CLAW_ARM_WIDTH = 0.5,
  CLAW_ARM_RADIUS = 2.8,
  CLAW_ARM_INITIAL_ANGLE = Math.PI / 4;
const CLAW_ANGLE_RANGE_MIN = 0,
  CLAW_ANGLE_RANGE_MAX = (3 * Math.PI) / 8;
const CLAW_COLLISION_SPHERE_RADIUS = 4;

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

const CONTAINER_ELEMENTS_THICKNESS = 0.5;
const CONTAINER_BASE_LENGTH = 20;
const CONTAINER_BASE_DEPTH = 10;
const CONTAINER_WALL_HEIGHT = 6;

const LOAD_CUBE_SIZE = 3;
const LOAD_RADIUS = 2;
const LOAD_TUBE_RADIUS = 0.2;

const LOAD_MIN_COUNT = 5;
const LOAD_MAX_COUNT = 20;

// Animation speeds
const UPPER_GROUP_ROTATION_SPEED = 0.65;
const CART_MOVEMENT_SPEED = 8;
const CLAW_RAISE_SPEED = 8;
const CLAW_ARM_ROTATION_SPEED = CLAW_ANGLE_RANGE_MAX;

const DEFAULT_WIREFRAME = false;

var scene, renderer;

var cameras = [];
var activeCamera;

var upperGroup, cartGroup, cables, clawGroup, clawArms, container;
var materials = [];

var loadObjects = [];
var clawCollisionSphere;

var keyToHUDElementMap = new Map();

var movementKeysMap = new Map();
var cameraKeysMap = new Map();

const clock = new THREE.Clock();
var deltaTime;

var heldObject = null;

/**
 * empty
 * grasping
 * raising
 * rotating
 * aligning
 * lowering
 * placing
 * returning
 */
var clawState = "empty";

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
  "use strict";

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb8d3d9);

  addFloor(scene);
  addCrane(scene);
  addContainer(scene);
  addLoads(scene);
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
  camera.position.z = 120;
  camera.lookAt(0, TOTAL_CRANE_HEIGHT / 2, 0);

  cameras.push(camera);
}

function createTopCamera() {
  "use strict";

  const aspectRatio = window.innerWidth / window.innerHeight;
  const cameraWidth = 260;
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
  const cameraWidth = 240;
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
function createMeshBasicMaterial(options) {
  "use strict";

  const material = new THREE.MeshBasicMaterial(options);
  materials.push(material);

  return material;
}

function addFloor(parent) {
  "use strict";

  const material = createMeshBasicMaterial({
    color: 0x808080,
    side: THREE.DoubleSide,
    wireframe: DEFAULT_WIREFRAME,
  });
  const geometry = new THREE.BoxGeometry(
    (LANCA_LENGTH + PORTA_LANCA_WIDTH) * 5,
    (LANCA_LENGTH + PORTA_LANCA_WIDTH) * 5,
    10,
    3,
    3
  );

  const floor = new THREE.Mesh(geometry, material);

  floor.position.y -= 5;
  floor.rotation.x = Math.PI / 2;

  parent.add(floor);
}

function addCrane(parent) {
  "use strict";

  addBase(parent);

  addTower(parent);

  addUpperGroup(parent);
}

function addBase(parent) {
  "use strict";

  const material = createMeshBasicMaterial({
    color: 0x00ff00,
    wireframe: DEFAULT_WIREFRAME,
  });
  const geometry = new THREE.BoxGeometry(BASE_LENGTH, BASE_HEIGHT, BASE_DEPTH);

  const base = new THREE.Mesh(geometry, material);

  base.position.set(0, 0, 0);

  parent.add(base);
}

function addTower(parent) {
  "use strict";

  const material = createMeshBasicMaterial({
    color: 0x0000ff,
    wireframe: DEFAULT_WIREFRAME,
  });
  const geometry = new THREE.BoxGeometry(
    TOWER_WIDTH,
    TOWER_HEIGHT,
    TOWER_WIDTH
  );

  const tower = new THREE.Mesh(geometry, material);

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

  const material = createMeshBasicMaterial({
    color: 0x00ff00,
    wireframe: DEFAULT_WIREFRAME,
  });
  const geometry = new THREE.BoxGeometry(
    PORTA_LANCA_WIDTH,
    PORTA_LANCA_HEIGHT,
    PORTA_LANCA_WIDTH
  );

  const portaLanca = new THREE.Mesh(geometry, material);

  portaLanca.position.set(0, PORTA_LANCA_HEIGHT / 2 - LANCA_Y_BASELINE, 0);

  parent.add(portaLanca);
}

function addCabin(parent) {
  "use strict";

  const material = createMeshBasicMaterial({
    color: 0xebba34,
    wireframe: DEFAULT_WIREFRAME,
  });
  const geometry = new THREE.BoxGeometry(
    CABIN_LENGTH,
    CABIN_HEIGHT,
    CABIN_DEPTH
  );

  const cabin = new THREE.Mesh(geometry, material);

  cabin.position.set(
    (TOWER_WIDTH - PORTA_LANCA_WIDTH) / 2,
    CABIN_Y_BASELINE - CABIN_HEIGHT / 2,
    PORTA_LANCA_WIDTH
  );

  parent.add(cabin);
}

function addLanca(parent) {
  "use strict";

  const material = createMeshBasicMaterial({
    color: 0xff0000,
    wireframe: DEFAULT_WIREFRAME,
  });
  const geometry = new THREE.BoxGeometry(
    LANCA_LENGTH,
    LANCA_HEIGHT,
    LANCA_DEPTH
  );

  const lanca = new THREE.Mesh(geometry, material);

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

  const material = createMeshBasicMaterial({
    color: 0x0000ff,
    wireframe: DEFAULT_WIREFRAME,
  });
  const geometry = new THREE.BoxGeometry(CART_LENGTH, CART_HEIGHT, CART_DEPTH);

  const cart = new THREE.Mesh(geometry, material);

  cart.position.set(0, 0, 0);

  parent.add(cart);
}

function addContraLanca(parent) {
  "use strict";

  const material = createMeshBasicMaterial({
    color: 0xbd36c7,
    wireframe: DEFAULT_WIREFRAME,
  });
  const geometry = new THREE.BoxGeometry(
    CONTRA_LANCA_LENGTH,
    CONTRA_LANCA_HEIGHT,
    CONTRA_LANCA_DEPTH
  );

  const contraLanca = new THREE.Mesh(geometry, material);

  contraLanca.position.set(
    -PORTA_LANCA_WIDTH / 2 - CONTRA_LANCA_LENGTH / 2,
    CONTRA_LANCA_HEIGHT / 2,
    0
  );

  parent.add(contraLanca);
}

function addClawCables(parent) {
  "use strict";

  const material = createMeshBasicMaterial({
    color: 0x00ff00,
    wireframe: DEFAULT_WIREFRAME,
  });
  const geometry = new THREE.CylinderGeometry(
    CABLE_RADIUS,
    CABLE_RADIUS,
    CABLE_LENGTH,
    16,
    16
  );

  const cable = new THREE.Mesh(geometry, material);

  cable.position.set(0, -CABLE_LENGTH / 2 - CART_HEIGHT / 2, 0);

  cable.userData.length = geometry.parameters.height;

  const cable2 = cable.clone();
  cable2.material = material.clone();
  materials.push(cable2.material);

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

  const material = createMeshBasicMaterial({
    color: 0xbd36c7,
    wireframe: DEFAULT_WIREFRAME,
  });
  const geometry = new THREE.BoxGeometry(
    CLAW_BASE_WIDTH,
    CLAW_BASE_HEIGHT,
    CLAW_BASE_WIDTH
  );

  const clawBase = new THREE.Mesh(geometry, material);

  clawBase.position.set(0, 0, 0);

  parent.add(clawBase);
}

function addClawArms(parent) {
  "use strict";

  const material = createMeshBasicMaterial({
    color: 0xff0000,
    wireframe: DEFAULT_WIREFRAME,
    side: THREE.DoubleSide,
  });
  const geometry = new THREE.CylinderGeometry(
    CLAW_ARM_RADIUS,
    CLAW_ARM_RADIUS,
    CLAW_ARM_WIDTH,
    16,
    1,
    true,
    0,
    Math.PI / 3
  );

  const clawArm = new THREE.Mesh(geometry, material);

  clawArm.position.set(0, -CLAW_ARM_RADIUS, 0);
  clawArm.rotation.x = -Math.PI / 2; // Place the claw arm vertically

  const clawArm2 = clawArm.clone();
  clawArm2.material = material.clone();
  materials.push(clawArm2.material);
  const clawArm3 = clawArm.clone();
  clawArm3.material = material.clone();
  materials.push(clawArm3.material);
  const clawArm4 = clawArm.clone();
  clawArm4.material = material.clone();
  materials.push(clawArm4.material);

  // Rotate each arm to the correct orientation
  clawArm2.rotation.z = -Math.PI / 2;
  clawArm3.rotation.z = Math.PI;
  clawArm4.rotation.z = Math.PI / 2;

  // Create a rotation axis for each arm, which will be the reference for its
  // opening and closing
  const rotAxis = new THREE.Object3D();
  rotAxis.position.set(CLAW_BASE_WIDTH / 2, -CLAW_BASE_HEIGHT / 2, 0);
  rotAxis.add(clawArm);
  rotAxis.rotation.z = -CLAW_ARM_INITIAL_ANGLE;
  // Function that will be used to rotate the arm around the according axis
  rotAxis.userData.rotate = (angle) => (rotAxis.rotation.z -= angle);

  const rotAxis2 = new THREE.Object3D();
  rotAxis2.position.set(0, -CLAW_BASE_HEIGHT / 2, CLAW_BASE_WIDTH / 2);
  rotAxis2.add(clawArm2);
  rotAxis2.rotation.x = CLAW_ARM_INITIAL_ANGLE;
  rotAxis2.userData.rotate = (angle) => (rotAxis2.rotation.x += angle);

  const rotAxis3 = new THREE.Object3D();
  rotAxis3.position.set(-CLAW_BASE_WIDTH / 2, -CLAW_BASE_HEIGHT / 2, 0);
  rotAxis3.add(clawArm3);
  rotAxis3.rotation.z = CLAW_ARM_INITIAL_ANGLE;
  rotAxis3.userData.rotate = (angle) => (rotAxis3.rotation.z += angle);

  const rotAxis4 = new THREE.Object3D();
  rotAxis4.position.set(0, -CLAW_BASE_HEIGHT / 2, -CLAW_BASE_WIDTH / 2);
  rotAxis4.add(clawArm4);
  rotAxis4.rotation.x = -CLAW_ARM_INITIAL_ANGLE;
  rotAxis4.userData.rotate = (angle) => (rotAxis4.rotation.x -= angle);

  clawArms = [rotAxis, rotAxis2, rotAxis3, rotAxis4];

  parent.add(rotAxis);
  parent.add(rotAxis2);
  parent.add(rotAxis3);
  parent.add(rotAxis4);
}

function addContraPeso(parent) {
  "use strict";

  const material = createMeshBasicMaterial({
    color: 0xbbbbbb,
    wireframe: DEFAULT_WIREFRAME,
  });
  const geometry = new THREE.BoxGeometry(
    CONTRA_PESO_LENGTH,
    CONTRA_PESO_HEIGHT,
    CONTRA_PESO_DEPTH
  );

  const contraPeso = new THREE.Mesh(geometry, material);

  contraPeso.position.set(
    -CONTRA_PESO_X_DISTANCE,
    CONTRA_LANCA_HEIGHT / 2 + CONTRA_PESO_Y_BASELINE,
    0
  );

  parent.add(contraPeso);
}

function addTirantesFrente(parent) {
  "use strict";

  const material = createMeshBasicMaterial({
    color: 0x0000ff,
    wireframe: DEFAULT_WIREFRAME,
  });
  const geometry = new THREE.CylinderGeometry(
    TIRANTE_RADIUS,
    TIRANTE_RADIUS,
    TIRANTE_FRENTE_LENGTH,
    16,
    16
  );

  const tiranteFrente = new THREE.Mesh(geometry, material);

  tiranteFrente.position.set(
    TIRANTE_FRENTE_LENGTH / 2,
    TIRANTE_FRENTE_HEIGHT / 2 + LANCA_HEIGHT - TIRANTE_RADIUS,
    0
  );
  tiranteFrente.rotation.z = TIRANTE_FRENTE_Z_ANGLE;

  const tiranteFrente2 = tiranteFrente.clone();
  tiranteFrente2.material = material.clone();
  materials.push(tiranteFrente2.material);

  tiranteFrente2.position.setZ(-PORTA_LANCA_WIDTH / 2 + TIRANTE_RADIUS + 0.01);
  tiranteFrente.position.setZ(PORTA_LANCA_WIDTH / 2 - TIRANTE_RADIUS - 0.01);

  parent.add(tiranteFrente);
  parent.add(tiranteFrente2);
}

function addTirantesTras(parent) {
  "use strict";

  const material = createMeshBasicMaterial({
    color: 0x0000ff,
    wireframe: DEFAULT_WIREFRAME,
  });

  const geometry = new THREE.CylinderGeometry(
    TIRANTE_RADIUS,
    TIRANTE_RADIUS,
    TIRANTE_TRAS_LENGTH,
    16,
    16
  );

  const tiranteTras = new THREE.Mesh(geometry, material);

  tiranteTras.position.set(
    -TIRANTE_TRAS_LENGTH / 2 + PORTA_LANCA_WIDTH / 2,
    TIRANTE_TRAS_HEIGHT / 2 + CONTRA_LANCA_HEIGHT - TIRANTE_RADIUS,
    0
  );
  tiranteTras.rotation.z = TIRANTE_TRAS_Z_ANGLE;

  const tiranteTras2 = tiranteTras.clone();
  tiranteTras2.material = material.clone();
  materials.push(tiranteTras2.material);

  tiranteTras2.position.setZ(-PORTA_LANCA_WIDTH / 2 + TIRANTE_RADIUS + 0.01);
  tiranteTras.position.setZ(PORTA_LANCA_WIDTH / 2 - TIRANTE_RADIUS - 0.01);

  parent.add(tiranteTras);
  parent.add(tiranteTras2);
}

function addContainer(parent) {
  "use strict";

  container = new THREE.Object3D();
  container.position.set(CART_RANGE_MIN + CONTAINER_BASE_LENGTH / 2, 0, 0);

  const baseMaterial = createMeshBasicMaterial({
    color: 0x546966,
    wireframe: DEFAULT_WIREFRAME,
  });
  const baseGeometry = new THREE.BoxGeometry(
    CONTAINER_BASE_LENGTH,
    CONTAINER_ELEMENTS_THICKNESS,
    CONTAINER_BASE_DEPTH
  );

  const base = new THREE.Mesh(baseGeometry, baseMaterial);

  base.position.set(0, CONTAINER_ELEMENTS_THICKNESS / 2, 0);

  // Create the long side walls
  const longWallGeometry = new THREE.BoxGeometry(
    CONTAINER_BASE_LENGTH,
    CONTAINER_WALL_HEIGHT,
    CONTAINER_ELEMENTS_THICKNESS
  );
  const wallMaterial = createMeshBasicMaterial({
    color: 0x166960,
    wireframe: DEFAULT_WIREFRAME,
  });

  const wall1 = new THREE.Mesh(longWallGeometry, wallMaterial);
  wall1.position.set(
    0,
    CONTAINER_ELEMENTS_THICKNESS / 2 + CONTAINER_WALL_HEIGHT / 2,
    0
  );

  const wall2 = wall1.clone();
  wall2.material = wallMaterial.clone();
  materials.push(wall2.material);

  wall1.position.setZ(
    -CONTAINER_BASE_DEPTH / 2 + CONTAINER_ELEMENTS_THICKNESS / 2
  );
  wall2.position.setZ(
    CONTAINER_BASE_DEPTH / 2 - CONTAINER_ELEMENTS_THICKNESS / 2
  );

  base.add(wall1);
  base.add(wall2);

  // Create the short side walls
  const shortWallGeometry = new THREE.BoxGeometry(
    CONTAINER_ELEMENTS_THICKNESS,
    CONTAINER_WALL_HEIGHT,
    CONTAINER_BASE_DEPTH
  );
  const wall3 = new THREE.Mesh(shortWallGeometry, wallMaterial.clone());
  materials.push(wall3.material);
  wall3.position.set(
    0,
    CONTAINER_ELEMENTS_THICKNESS / 2 + CONTAINER_WALL_HEIGHT / 2,
    0
  );

  const wall4 = wall3.clone();
  wall4.material = wallMaterial.clone();
  materials.push(wall4.material);

  wall3.position.setX(
    -CONTAINER_BASE_LENGTH / 2 + CONTAINER_ELEMENTS_THICKNESS / 2
  );
  wall4.position.setX(
    CONTAINER_BASE_LENGTH / 2 - CONTAINER_ELEMENTS_THICKNESS / 2
  );

  base.add(wall3);
  base.add(wall4);

  container.add(base);

  parent.add(container);

  container.userData.collisionBox = new THREE.Box3().setFromObject(container);
}

function addLoads(parent) {
  const choices = [];

  let geometry = new THREE.BoxGeometry(
    LOAD_CUBE_SIZE,
    LOAD_CUBE_SIZE,
    LOAD_CUBE_SIZE
  );
  let material = createMeshBasicMaterial({ color: 0x461787 });
  choices.push({ geometry, material });

  geometry = new THREE.DodecahedronGeometry(LOAD_RADIUS);
  material = createMeshBasicMaterial({ color: 0x461787 });
  choices.push({ geometry, material });

  geometry = new THREE.IcosahedronGeometry(LOAD_RADIUS - 0.2);
  material = createMeshBasicMaterial({ color: 0x461787 });
  choices.push({ geometry, material });

  geometry = new THREE.TorusGeometry(LOAD_RADIUS - 0.5, LOAD_TUBE_RADIUS);
  material = createMeshBasicMaterial({ color: 0x461787 });
  choices.push({ geometry, material });

  geometry = new THREE.TorusKnotGeometry(
    LOAD_RADIUS - 0.7,
    LOAD_TUBE_RADIUS - 0.05
  );
  material = createMeshBasicMaterial({ color: 0x461787 });
  choices.push({ geometry, material });

  // Randomly generate a number of loads
  const loadCount =
    LOAD_MIN_COUNT +
    Math.round(Math.random() * (LOAD_MAX_COUNT - LOAD_MIN_COUNT));

  for (let i = 0; i < loadCount; i++) {
    const choice = choices[i % choices.length];
    const load = new THREE.Mesh(
      choice.geometry.clone(),
      choice.material.clone()
    );
    materials.push(load.material);
    generateLoadPosition(load);
    parent.add(load);
  }
}

function generateLoadPosition(loadObject) {
  "use strict";

  let x, y, z, angle, distance, height, width, box, sphere;
  box = new THREE.Box3().setFromObject(loadObject);
  height = box.max.y - box.min.y;
  width = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);

  do {
    angle = Math.random() * 2 * Math.PI;
    distance = Math.random() * (CART_RANGE_MAX - CART_RANGE_MIN - width);
    x = Math.cos(angle) * (distance + CART_RANGE_MIN);
    z = Math.sin(angle) * (distance + CART_RANGE_MIN);
    y = height / 2;

    loadObject.position.set(x, y, z);
    sphere = new THREE.Sphere(loadObject.position, Math.max(width, height) / 2);
  } while (existsLoadCollision(sphere));

  loadObject.userData.collisionSphere = sphere;
  loadObject.userData.height = height;
  loadObject.userData.xSpan = box.max.x - box.min.x;
  loadObjects.push(loadObject);
}

function existsLoadCollision(sphere) {
  "use strict";

  const sphere_ = new THREE.Sphere().set(
    sphere.center,
    sphere.radius + CLAW_COLLISION_SPHERE_RADIUS
  );

  if (checkBoxSphereIntersection(container.userData.collisionBox, sphere_))
    return true;

  for (const loadObject of loadObjects) {
    if (checkSphereIntersections(sphere_, loadObject.userData.collisionSphere))
      return true;
  }

  return false;
}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions() {
  "use strict";

  const clawPos = new THREE.Vector3();
  clawGroup.getWorldPosition(clawPos);
  clawCollisionSphere = new THREE.Sphere(
    new THREE.Vector3(clawPos.x, clawPos.y + CLAW_BASE_HEIGHT / 2, clawPos.z),
    CLAW_COLLISION_SPHERE_RADIUS
  );

  for (const loadObject of loadObjects) {
    if (
      checkSphereIntersections(
        clawCollisionSphere,
        loadObject.userData.collisionSphere
      )
    ) {
      loadObjects.splice(loadObjects.indexOf(loadObject), 1);
      return loadObject;
    }
  }

  return null;
}

function checkSphereIntersections(sphere1, sphere2) {
  "use strict";

  let distance = new THREE.Vector3();

  distance.subVectors(sphere1.center, sphere2.center);

  if (distance.length() <= sphere1.radius + sphere2.radius) {
    return true;
  }

  return false;
}

function checkBoxSphereIntersection(box, sphere) {
  "use strict";

  const boxCenter = new THREE.Vector3();
  box.getCenter(boxCenter);

  // Calculate the vector from the sphere center to the box center
  const sphereToBox = new THREE.Vector3().copy(boxCenter).sub(sphere.center);

  // If the distance is less than or equal to the sphere radius, the sphere intersects the box
  if (sphereToBox.length() <= sphere.radius) {
    return true;
  }

  // Otherwise, find the closest point on the surface of the sphere to the box center
  const closestSpherePoint = new THREE.Vector3()
    .copy(sphereToBox)
    .normalize()
    .multiplyScalar(sphere.radius)
    .add(sphere.center);

  if (
    box.min.y <= closestSpherePoint.y &&
    box.max.y >= closestSpherePoint.y &&
    box.min.x <= closestSpherePoint.x &&
    box.max.x >= closestSpherePoint.x &&
    box.min.z <= closestSpherePoint.z &&
    box.max.z >= closestSpherePoint.z
  ) {
    return true;
  }

  return false;
}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function raiseLoad() {
  "use strict";

  var clawPos = new THREE.Vector3();
  clawGroup.getWorldPosition(clawPos);

  const targetPos = new THREE.Vector3(
    clawGroup.x,
    TOWER_HEIGHT / 2,
    clawGroup.z
  );

  return moveClaw(CLAW_RAISE_SPEED, targetPos.y);
}

function rotateLoad() {
  "use strict";

  let currentAngle = upperGroup.rotation.y % (2 * Math.PI);
  if (currentAngle < 0) currentAngle += 2 * Math.PI;

  // Determine if the rotation should be clockwise or counterclockwise
  // (which is the shortest path to the target angle)
  const rotationSpeed =
    currentAngle > Math.PI
      ? UPPER_GROUP_ROTATION_SPEED
      : -UPPER_GROUP_ROTATION_SPEED;

  return rotateUpperGroup(rotationSpeed, true);
}

function alignLoad() {
  "use strict";

  const containerPos = new THREE.Vector3();
  container.getWorldPosition(containerPos);
  let targetX = containerPos.x;

  const movementSpeed =
    cartGroup.position.x < targetX ? CART_MOVEMENT_SPEED : -CART_MOVEMENT_SPEED;

  return moveCart(movementSpeed, targetX);
}

function lowerLoad() {
  "use strict";

  var clawPos = new THREE.Vector3();
  clawGroup.getWorldPosition(clawPos);

  const targetPos = new THREE.Vector3(
    clawGroup.x,
    CONTAINER_ELEMENTS_THICKNESS +
      CONTAINER_WALL_HEIGHT +
      -heldObject.position.y +
      heldObject.userData.height / 2,
    clawGroup.z
  );

  return moveClaw(-CLAW_RAISE_SPEED, targetPos.y);
}

function grabLoad() {
  "use strict";

  const SPEED = 20;

  const clawPos = new THREE.Vector3();
  clawGroup.getWorldPosition(clawPos);

  const target = new THREE.Vector3(
    clawPos.x,
    clawPos.y - heldObject.userData.height / 2 - CLAW_BASE_HEIGHT / 2,
    clawPos.z
  );

  return moveLoad(SPEED, target);
}

function dropLoad() {
  "use strict";

  const SPEED = 10;

  const clawPos = new THREE.Vector3();
  clawGroup.getWorldPosition(clawPos);

  const target = new THREE.Vector3(
    clawPos.x,
    CONTAINER_ELEMENTS_THICKNESS + heldObject.userData.height / 2,
    clawPos.z
  );

  return moveLoad(SPEED, target);
}

function moveLoad(speed, targetPos) {
  "use strict";

  let delta = speed * deltaTime;

  const currentPos = new THREE.Vector3();
  heldObject.getWorldPosition(currentPos);

  const distance = new THREE.Vector3();
  distance.subVectors(targetPos, currentPos);

  if (distance.length() < delta) {
    heldObject.position.set(targetPos.x, targetPos.y, targetPos.z);
    return true;
  }

  const direction = distance.normalize();

  heldObject.position.addScaledVector(direction, delta);

  return false;
}

function handleCollisions() {
  "use strict";

  if (clawState === "empty") {
    heldObject = checkCollisions();
    if (heldObject === null) return;

    clawState = "grasping";

    // clear keys to prevent HUD showing pressed key when animation is running
    clearKeys(false);

    return;
  }

  if (clawState === "grasping") {
    const done = grabLoad();
    if (done) {
      // Move the load object to the claw
      heldObject.position.set(
        0,
        -heldObject.userData.height / 2 - CLAW_BASE_HEIGHT / 2,
        0
      );
      clawGroup.add(heldObject);

      clawState = "raising";
    }

    return;
  }

  if (clawState === "raising") {
    const done = raiseLoad();
    if (done) {
      clawState = "rotating";
    }
    return;
  }

  if (clawState === "rotating") {
    const done = rotateLoad();
    if (done) {
      clawState = "aligning";
    }
    return;
  }

  if (clawState === "aligning") {
    const done = alignLoad();
    if (done) {
      clawState = "lowering";
    }
    return;
  }

  if (clawState === "lowering") {
    const done = lowerLoad();
    if (done) {
      // Detach the load object from the claw
      const heldObjectPos = new THREE.Vector3();
      heldObject.getWorldPosition(heldObjectPos);
      heldObject.position.set(
        heldObjectPos.x,
        heldObjectPos.y,
        heldObjectPos.z
      );
      scene.add(heldObject);
      clawGroup.remove(heldObject);

      clawState = "placing";
    }
    return;
  }

  if (clawState === "placing") {
    const done = dropLoad();
    if (done) {
      clawState = "returning";
    }
    return;
  }

  if (clawState === "returning") {
    const done = raiseLoad();
    if (done) {
      clawState = "empty";
      scene.remove(heldObject);
      heldObject = null;
    }
    return;
  }
}

////////////
/* UPDATE */
////////////
function switchCamera(keyNumber) {
  activeCamera = cameras[keyNumber - 1];
}

function rotateUpperGroup(rotationSpeed, rotateToZero = false) {
  let angle = rotationSpeed * deltaTime;

  let currentAngle = upperGroup.rotation.y % (2 * Math.PI);
  if (currentAngle < 0) currentAngle += 2 * Math.PI;

  if (
    rotateToZero &&
    (currentAngle === 0 ||
      (angle > 0 && currentAngle + angle > 2 * Math.PI) ||
      (angle < 0 && currentAngle < angle))
  ) {
    angle = -currentAngle % (2 * Math.PI);
    if (angle < 0) angle += 2 * Math.PI;
  }

  upperGroup.rotation.y += angle;
  upperGroup.rotation.y = upperGroup.rotation.y % (2 * Math.PI);
  if (upperGroup.rotation.y < 0) upperGroup.rotation.y += 2 * Math.PI;

  return upperGroup.rotation.y === 0;
}

function moveCart(movementSpeed, targetX = null) {
  let delta = movementSpeed * deltaTime;

  if (
    cartGroup.position.x + delta > CART_RANGE_MAX ||
    cartGroup.position.x + delta < CART_RANGE_MIN
  ) {
    return true;
  }

  if (
    targetX !== null &&
    ((movementSpeed > 0 && cartGroup.position.x + delta > targetX) ||
      (movementSpeed < 0 && cartGroup.position.x + delta < targetX))
  ) {
    delta = targetX - cartGroup.position.x;
  }

  cartGroup.position.x += delta;

  return cartGroup.position.x === targetX;
}

function moveClaw(movementSpeed, targetY = null) {
  let delta = movementSpeed * deltaTime;
  const currentLength = cables[0].userData.length;

  if (
    currentLength - delta <= 4 * CLAW_BASE_HEIGHT ||
    currentLength - delta >
      LANCA_Y_BASELINE -
        CART_HEIGHT +
        TOWER_HEIGHT +
        BASE_HEIGHT / 2 -
        CONTAINER_ELEMENTS_THICKNESS -
        CLAW_ARM_RADIUS / Math.sin(CLAW_ANGLE_RANGE_MAX)
  ) {
    return true;
  }

  const clawPos = new THREE.Vector3();
  clawGroup.getWorldPosition(clawPos);

  if (
    targetY !== null &&
    ((movementSpeed > 0 && clawPos.y + delta > targetY) ||
      (movementSpeed < 0 && clawPos.y + delta < targetY))
  ) {
    delta = targetY - clawPos.y;
  }

  const newLength = currentLength - delta;
  const factor = newLength / CABLE_LENGTH;

  cables.forEach((cable) => {
    cable.position.y += delta / 2;
    cable.scale.y = factor;
    cable.userData.length = newLength;
  });

  clawGroup.position.y += delta;

  return clawPos.y + delta === targetY;
}

function adjustClawArmRotation(rotationSpeed) {
  const angle = rotationSpeed * deltaTime;
  const currentRotation = clawArms[1].rotation.x;

  if (
    currentRotation + angle < CLAW_ANGLE_RANGE_MIN ||
    currentRotation + angle > CLAW_ANGLE_RANGE_MAX
  )
    return;

  clawArms.forEach((arm) => {
    arm.userData.rotate(angle);
  });
}

function toggleWireframe() {
  for (const material of materials) {
    material.wireframe = !material.wireframe;
  }
}

function update() {
  "use strict";

  for (const [key, callback] of cameraKeysMap) {
    const keyElement = keyToHUDElementMap.get(key);
    keyElement.classList.add("active");
    callback();
  }

  handleCollisions();

  // If the animation is running, don't allow the user to interact with the crane
  if (clawState !== "empty") return;

  for (const [key, callback] of movementKeysMap) {
    const keyElement = keyToHUDElementMap.get(key);
    keyElement.classList.add("active");
    callback();
  }
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
  createHUD();

  render();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  // When window loses focus, clear all pressed keys
  window.addEventListener("blur", () => clearKeys());
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
  "use strict";

  deltaTime = clock.getDelta();
  update();
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

  let callback;
  const key = e.key.toLowerCase();
  switch (key) {
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
      callback = () => {
        switchCamera(Number(key));
        cameraKeysMap.delete(key);
      };
      cameraKeysMap.set(key, callback);
      break;
    case "7":
      callback = () => {
        toggleWireframe();
        cameraKeysMap.delete(key);
      };
      cameraKeysMap.set(key, callback);
      break;
    case "q":
      callback = () => rotateUpperGroup(UPPER_GROUP_ROTATION_SPEED);
      movementKeysMap.set(key, callback);
      break;
    case "a":
      callback = () => rotateUpperGroup(-UPPER_GROUP_ROTATION_SPEED);
      movementKeysMap.set(key, callback);
      break;
    case "s":
      callback = () => moveCart(-CART_MOVEMENT_SPEED);
      movementKeysMap.set(key, callback);
      break;
    case "w":
      callback = () => moveCart(CART_MOVEMENT_SPEED);
      movementKeysMap.set(key, callback);
      break;
    case "e":
      callback = () => moveClaw(CLAW_RAISE_SPEED);
      movementKeysMap.set(key, callback);
      break;
    case "d":
      callback = () => moveClaw(-CLAW_RAISE_SPEED);
      movementKeysMap.set(key, callback);
      break;
    case "r":
      callback = () => adjustClawArmRotation(-CLAW_ARM_ROTATION_SPEED);
      movementKeysMap.set(key, callback);
      break;
    case "f":
      callback = () => adjustClawArmRotation(CLAW_ARM_ROTATION_SPEED);
      movementKeysMap.set(key, callback);
      break;
  }
}

/////////////////////
/* KEY UP CALLBACK */
/////////////////////
function onKeyUp(e) {
  "use strict";

  const key = e.key.toLowerCase();

  cameraKeysMap.delete(key);
  movementKeysMap.delete(key);

  const keyElement = keyToHUDElementMap.get(key);
  if (keyElement) {
    keyElement.classList.remove("active");
  }
}

/////////
/* HUD */
/////////
function createHUD() {
  "use strict";

  const keybindsActionMap = new Map([
    ["Q", "Rotate the upper group counterclockwise"],
    ["A", "Rotate the upper group clockwise"],
    ["W", "Move the cart further"],
    ["S", "Move the cart closer"],
    ["E", "Raise the claw"],
    ["D", "Lower the claw"],
    ["R", "Open the claw"],
    ["F", "Close the claw"],
    ["1", "Switch to frontal camera"],
    ["2", "Switch to side camera"],
    ["3", "Switch to top camera"],
    ["4", "Switch to orthogonal camera"],
    ["5", "Switch to perspective camera"],
    ["6", "Switch to claw camera"],
    ["7", "Toggle wireframe"],
  ]);

  function isAlpha(c) {
    return (
      typeof c === "string" &&
      c.length === 1 &&
      ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z"))
    );
  }

  const body = document.querySelector("body");

  const hud = document.createElement("div");
  hud.id = "hud-container";

  keybindsActionMap.forEach((value, key) => {
    const keybindEntry = document.createElement("div");
    keybindEntry.className = "keybind-entry";

    const keybind = document.createElement("span");
    keybind.className = "keybind";
    keybind.textContent = isAlpha(key) ? `${key}${key.toLowerCase()}` : key;
    keybindEntry.appendChild(keybind);

    const action = document.createElement("p");
    action.className = "action";
    action.textContent = value;
    keybindEntry.appendChild(action);

    hud.appendChild(keybindEntry);

    keyToHUDElementMap.set(key.toLowerCase(), keybindEntry);
  });

  body.appendChild(hud);
}

function clearKeys(clearCameraKeys = true, clearMovementKeys = true) {
  let keysToClear = [];
  if (clearCameraKeys) keysToClear = [...cameraKeysMap.keys()];
  if (clearMovementKeys)
    keysToClear = [...keysToClear, ...movementKeysMap.keys()];

  keysToClear.forEach((key) => onKeyUp({ key }));
}

init();
animate();
