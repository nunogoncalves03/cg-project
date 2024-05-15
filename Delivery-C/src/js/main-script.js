import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
const CENTRAL_CYLINDER_RADIUS = 0.15,
  CENTRAL_CYLINDER_HEIGHT = 3.5;

const RING_RADIUS = 0.7,
  RING_HEIGHT = 0.35;
const RING_CENTER_OFFSET = [
  CENTRAL_CYLINDER_RADIUS,
  CENTRAL_CYLINDER_RADIUS + RING_RADIUS,
  CENTRAL_CYLINDER_RADIUS + 2 * RING_RADIUS,
];

const DEFAULT_WIREFRAME = false;

// Variables

var scene, renderer;

var camera;

var centralCylinder;
var rings = [];

var keysMap = new Map();

const clock = new THREE.Clock();
var deltaTime;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
  "use strict";

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb8d3d9);

  addFloor(scene);
  addCarousel(scene);
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createPerspectiveCamera() {
  "use strict";
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 5;
  camera.lookAt(0, 0, 0);
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function addFloor(parent) {
  "use strict";

  const material = new THREE.MeshBasicMaterial({
    color: 0x808080,
    side: THREE.DoubleSide,
    wireframe: DEFAULT_WIREFRAME,
  });
  const geometry = new THREE.BoxGeometry(
    50 * 5, // FIXME: hardcoded
    50 * 5,
    10,
    3,
    3
  );

  const floor = new THREE.Mesh(geometry, material);

  floor.position.y -= 5;
  floor.rotation.x = Math.PI / 2;

  parent.add(floor);
}

function addCarousel(parent) {
  "use strict";

  addCentralCylinder(parent);
  addRings(parent);
}

function addCentralCylinder(parent) {
  "use strict";

  const material = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    wireframe: DEFAULT_WIREFRAME,
  });
  const geometry = new THREE.CylinderGeometry(
    CENTRAL_CYLINDER_RADIUS,
    CENTRAL_CYLINDER_RADIUS,
    CENTRAL_CYLINDER_HEIGHT
  );

  centralCylinder = new THREE.Mesh(geometry, material);
  centralCylinder.position.set(0, CENTRAL_CYLINDER_HEIGHT / 2, 0);

  parent.add(centralCylinder);
}

function addRings(parent) {
  const ringCount = RING_CENTER_OFFSET.length;
  for (let i = 0; i < RING_CENTER_OFFSET.length; i++) {
    const ringGroup = new THREE.Object3D();
    ringGroup.position.set(0, RING_HEIGHT * (ringCount - i), 0);
    addRing(ringGroup, i);

    rings.push(ringGroup);

    parent.add(ringGroup);
  }
}

function addRing(parent, ringIndex) {
  "use strict";

  // Create a ring shape
  const outerRadius = RING_CENTER_OFFSET[ringIndex] + RING_RADIUS;
  const innerRadius = RING_CENTER_OFFSET[ringIndex];
  const ringShape = createRingShape(innerRadius, outerRadius);

  const extrudeSettings = {
    steps: 1,
    depth: RING_HEIGHT,
    bevelEnabled: false,
  };

  // Create geometry by extruding the ring shape
  const geometry = new THREE.ExtrudeGeometry(ringShape, extrudeSettings);
  const material = new THREE.MeshBasicMaterial({
    color: ringIndex % 2 == 0 ? 0xff0000 : 0x0000ff,
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.position.set(0, 0, 0);
  ring.rotateX(Math.PI / 2);

  parent.add(ring);
}

function createRingShape(innerRadius, outerRadius) {
  const ringShape = new THREE.Shape();
  ringShape.moveTo(outerRadius, 0);
  ringShape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);

  const holePath = new THREE.Path();
  holePath.moveTo(innerRadius, 0);
  holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  ringShape.holes.push(holePath);
  
  return ringShape;
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

////////////
/* UPDATE */
////////////
function update() {
  "use strict";

  for (const callback of keysMap.values()) {
    callback();
  }
}

/////////////
/* DISPLAY */
/////////////
function render() {
  "use strict";
  renderer.render(scene, camera);
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
  createPerspectiveCamera();

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

  let callback;
  const key = e.key.toLowerCase();
  switch (key) {
    case "1":
    case "2":
    case "3":
      // TODO: toggle rings movement
      callback = () => {};
      keysMap.set(key, callback);
      break;
    case "d":
      callback = () => {};
      keysMap.set(key, callback);
      break;
    case "p":
      // TODO: toggle luzes pontuais
      callback = () => {};
      keysMap.set(key, callback);
      break;
    case "s":
      // TODO: toggle luzes spotlight
      callback = () => {};
      keysMap.set(key, callback);
      break;
    case "q":
    case "w":
    case "e":
    case "r":
      // TODO: change materials
      callback = () => {};
      keysMap.set(key, callback);
      break;
    case "t":
      // TODO: deactive light calculations
      callback = () => {};
      keysMap.set(key, callback);
      break;
  }
}

/////////////////////
/* KEY UP CALLBACK */
/////////////////////
function onKeyUp(e) {
  "use strict";

  const key = e.key.toLowerCase();

  keysMap.delete(key);
}

function clearKeys() {
  keysMap.forEach((key) => onKeyUp({ key }));
}

init();
animate();
