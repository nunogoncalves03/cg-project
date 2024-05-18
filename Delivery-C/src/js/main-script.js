import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { ParametricGeometries } from "three/addons/geometries/ParametricGeometries.js";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
const CENTRAL_CYLINDER_RADIUS = 0.15,
  CENTRAL_CYLINDER_HEIGHT = 3.5;

const RING_RADIUS = 0.9,
  RING_HEIGHT = 0.2;
const RING_CENTER_OFFSET = [
  CENTRAL_CYLINDER_RADIUS,
  CENTRAL_CYLINDER_RADIUS + RING_RADIUS,
  CENTRAL_CYLINDER_RADIUS + 2 * RING_RADIUS,
];
const RING_PIECE_SIZE = [
  RING_RADIUS * 0.3,
  RING_RADIUS * 0.55,
  RING_RADIUS * 0.8,
];
const RING_PIECES_COUNT = 8;

const DEFAULT_WIREFRAME = false;

const RINGS_MOVEMENT_SPEED = 2;

const RINGS_PIECE_ORIENTATION = [0, Math.PI / 4, -Math.PI / 4];
const RINGS_PIECE_ROTATION_SPEED = [1.3, -1.8, 2.3];

// Variables

var scene, renderer;

var camera;

var centralCylinder;

var rings = [];
var ringsMovementStatus = [false, false, false];
var ringMovementSpeeds = [
  RINGS_MOVEMENT_SPEED,
  RINGS_MOVEMENT_SPEED,
  RINGS_MOVEMENT_SPEED,
];

var pieces = [];

var meshes = [];

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

  addCarousel(scene);
  addSkydome(scene);
  createAmbientLight(scene);
  createDirectionalLight(scene);
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createPerspectiveCamera() {
  "use strict";
  camera = new THREE.PerspectiveCamera(
    80,
    window.innerWidth / window.innerHeight,
    0.05,
    2000
  );
  camera.position.x = 0;
  camera.position.y = 2.5;
  camera.position.z = 6;
  camera.lookAt(0, 0, 0);
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

function createAmbientLight(scene) {
  const light = new THREE.AmbientLight(0xffa257, 0.5);
  scene.add(light);
}

function createDirectionalLight(scene) {
  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(0, centralCylinder.position.y, 5);
  directionalLight.target = centralCylinder;
  scene.add(directionalLight);
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function createMeshMaterial(geometry, material, materialOptions) {
  "use strict";

  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = { materialOptions };
  meshes.push(mesh);

  return mesh;
}

function addCarousel(parent) {
  "use strict";

  addCentralCylinder(parent);
  addMobius(parent);
  addRings(parent);
}

function addCentralCylinder(parent) {
  "use strict";

  const materialOptions = {
    color: 0x0000ff,
    wireframe: DEFAULT_WIREFRAME,
  };
  const material = new THREE.MeshLambertMaterial(materialOptions);
  const geometry = new THREE.CylinderGeometry(
    CENTRAL_CYLINDER_RADIUS,
    CENTRAL_CYLINDER_RADIUS,
    CENTRAL_CYLINDER_HEIGHT
  );

  centralCylinder = createMeshMaterial(geometry, material, materialOptions);
  centralCylinder.position.set(0, CENTRAL_CYLINDER_HEIGHT / 2, 0);

  parent.add(centralCylinder);
}

function addMobius(parent) {
  const segments = 10;
  const stripWidth = 10;

  const vertices = [];
  const indices = [];

  const geometry = new THREE.BufferGeometry();
  const slice = segments + 1;

  for (let i = 0; i <= segments; i++) {
    const v = i / segments;
    for (let j = 0; j <= stripWidth; j++) {
      const u = j / stripWidth;
      const vertex = addVertex(u, v);
      console.log(vertex);
      vertices.push(vertex.x, vertex.y, vertex.z);
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < stripWidth; j++) {
      const a = i * slice + j;
      const b = i * slice + j + 1;
      const c = (i + 1) * slice + j + 1;
      const d = (i + 1) * slice + j;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geometry.setIndex(indices);
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  const materialOptions = { color: 0x34eb8c, side: THREE.DoubleSide };

  const material = new THREE.MeshLambertMaterial(materialOptions);
  const mobius = createMeshMaterial(geometry, material, materialOptions);

  mobius.rotation.x = Math.PI / 2;
  const size = (CENTRAL_CYLINDER_HEIGHT * 2) / 3;

  alignPieceVertically(mobius, size, CENTRAL_CYLINDER_HEIGHT);

  parent.add(mobius);
}

function addVertex(u, t) {
  u = u - 0.5;
  const v = 2 * Math.PI * t;
  const a = 2;
  const x = Math.cos(v) * (a + u * Math.cos(v / 2));
  const y = Math.sin(v) * (a + u * Math.cos(v / 2));
  const z = u * Math.sin(v / 2);
  const vertex = new THREE.Vector3(x, y, z);
  return vertex;
}

function addRings(parent) {
  const ringCount = RING_CENTER_OFFSET.length;
  for (let i = 0; i < RING_CENTER_OFFSET.length; i++) {
    const ringGroup = new THREE.Object3D();
    ringGroup.position.set(0, RING_HEIGHT * (ringCount - i), 0);
    addRing(ringGroup, i);
    addPieces(ringGroup, i);

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
    curveSegments: 64,
    depth: RING_HEIGHT,
    bevelEnabled: false,
  };

  // Create geometry by extruding the ring shape
  const geometry = new THREE.ExtrudeGeometry(ringShape, extrudeSettings);
  const materialOptions = { color: ringIndex % 2 == 0 ? 0xff0000 : 0x0000ff };
  const material = new THREE.MeshLambertMaterial(materialOptions);

  const ring = createMeshMaterial(geometry, material, materialOptions);
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

function addPieces(parent, ringIndex) {
  const offset = Math.PI / 8;
  const radius = RING_CENTER_OFFSET[ringIndex] + RING_RADIUS / 2;

  const materialOptions = {
    color: 0x34eb8c,
    wireframe: DEFAULT_WIREFRAME,
    side: THREE.DoubleSide,
  };
  const material = new THREE.MeshLambertMaterial(materialOptions);

  const geometries = [
    new ParametricGeometry(ParametricGeometries.mobius, 20, 20),
    new ParametricGeometry(ParametricGeometries.klein, 20, 20),
    new ParametricGeometries.TorusKnotGeometry(),
  ];

  const newPieces = [];
  for (let i = 0; i < RING_PIECES_COUNT; i++) {
    const currentGeometry = geometries[i % geometries.length];
    const piece = createMeshMaterial(
      currentGeometry,
      material,
      materialOptions
    );
    const placementAngle = i * ((2 * Math.PI) / RING_PIECES_COUNT) + offset;

    const pieceGroup = new THREE.Object3D();
    pieceGroup.rotateX(RINGS_PIECE_ORIENTATION[ringIndex]);
    pieceGroup.rotateZ(RINGS_PIECE_ORIENTATION[ringIndex]);
    pieceGroup.add(piece);

    pieceGroup.position.setX(radius * Math.cos(placementAngle));
    pieceGroup.position.setZ(radius * Math.sin(placementAngle));
    alignPieceVertically(pieceGroup, RING_PIECE_SIZE[ringIndex]);

    newPieces.push(piece);
    parent.add(pieceGroup);
  }
  pieces.push(newPieces);
}

function alignPieceVertically(
  pieceObject,
  targetMaxMeasure,
  targetY = RING_HEIGHT / 4
) {
  const box = new THREE.Box3().setFromObject(pieceObject);
  const largestMeasure = Math.max(
    box.max.x - box.min.x,
    box.max.y - box.min.y,
    box.max.z - box.min.z
  );

  const scaleFactor = targetMaxMeasure / largestMeasure;

  pieceObject.scale.x = scaleFactor;
  pieceObject.scale.y = scaleFactor;
  pieceObject.scale.z = scaleFactor;

  box.setFromObject(pieceObject);
  const height = box.max.y - box.min.y;

  pieceObject.position.setY(height / 2 + targetY);
}

function addSkydome(parent) {
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load("images/skydome.png", function (texture) {
    const geometry = new THREE.SphereGeometry(8);
    texture.wrapT = THREE.RepeatWrapping;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.set(8, 6);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
    });

    const sphere = new THREE.Mesh(geometry, material);

    parent.add(sphere);
  });
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
function moveRing(ringIndex) {
  "use strict";

  const movementSpeed = ringMovementSpeeds[ringIndex];
  const ring = rings[ringIndex];
  let delta = movementSpeed * deltaTime;

  if (movementSpeed > 0 && ring.position.y + delta > CENTRAL_CYLINDER_HEIGHT) {
    delta = CENTRAL_CYLINDER_HEIGHT - ring.position.y;
    ringMovementSpeeds[ringIndex] *= -1;
  }

  if (movementSpeed < 0 && ring.position.y + delta < RING_HEIGHT) {
    delta = RING_HEIGHT - ring.position.y;
    ringMovementSpeeds[ringIndex] *= -1;
  }

  ring.position.y += delta;
}

function rotateCentralCylinder() {
  "use strict";

  const movementSpeed = 0.5;
  centralCylinder.rotation.y += movementSpeed * deltaTime;
}

function rotatePieces() {
  "use strict";

  for (let i = 0; i < pieces.length; i++) {
    const ringPieces = pieces[i];
    for (const piece of ringPieces) {
      piece.rotation.y += RINGS_PIECE_ROTATION_SPEED[i] * deltaTime;
    }
  }
}

function switchMaterials(key) {
  for (const mesh of meshes) {
    switch (key) {
      case "q":
        mesh.material = new THREE.MeshLambertMaterial(
          mesh.userData.materialOptions
        );
        break;
      case "w":
        mesh.material = new THREE.MeshPhongMaterial(
          mesh.userData.materialOptions
        );
        break;
      case "e":
        mesh.material = new THREE.MeshToonMaterial(
          mesh.userData.materialOptions
        );
        break;
      case "r":
        mesh.material = new THREE.MeshNormalMaterial(
          mesh.userData.materialOptions
        );
        break;
    }
  }
}

function update() {
  "use strict";

  for (const callback of keysMap.values()) {
    callback();
  }

  const ringCount = RING_CENTER_OFFSET.length;
  for (let i = 0; i < ringCount; i++) {
    if (ringsMovementStatus[i]) {
      moveRing(i);
    }
  }

  rotateCentralCylinder();
  rotatePieces();
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

  new OrbitControls(camera, renderer.domElement);

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
      callback = () => {
        const ringIndex = Number(key) - 1;
        ringsMovementStatus[ringIndex] = !ringsMovementStatus[ringIndex];
        keysMap.delete(key);
      };
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
      callback = () => {
        switchMaterials(key);
        keysMap.delete(key);
      };
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
