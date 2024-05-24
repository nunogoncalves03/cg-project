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
const CENTRAL_CYLINDER_COLOR = 0xcccccc;

const RING_RADIUS = 0.9,
  RING_HEIGHT = 0.2;
const RING_CENTER_OFFSET = [
  CENTRAL_CYLINDER_RADIUS,
  CENTRAL_CYLINDER_RADIUS + RING_RADIUS,
  CENTRAL_CYLINDER_RADIUS + 2 * RING_RADIUS,
];
const RING_PIECE_SIZE = [
  RING_RADIUS * 0.4,
  RING_RADIUS * 0.55,
  RING_RADIUS * 0.7,
];
const RING_PIECES_COUNT = 8;

const DEFAULT_WIREFRAME = false;

const RINGS_MOVEMENT_SPEED = 1.75;

const RINGS_PIECE_ORIENTATION = [Math.PI / 8, Math.PI / 4, -Math.PI / 4];
const RINGS_PIECE_ROTATION_SPEED = [1.3, -1.8, 2.3];
const RINGS_PIECE_COLOR = [0xf57f89, 0x34ebba, 0xf0b673];
const RINGS_COLOR = [0xeeeeee, CENTRAL_CYLINDER_COLOR, 0xeeeeee];

// Variables

var scene, renderer;

var camera;

var lights = [];
var lightsActive = true;
var directionalLight;
var spotlights = [];
var pointlights = [];

var centralCylinder;

var rings = [];
var ringsMovementStatus = [true, true, true];
// The initial movement speed of the rings is random, distributed between
// 60% and 100% of the RINGS_MOVEMENT_SPEED and with a random direction
var ringMovementSpeeds = [
  RINGS_MOVEMENT_SPEED *
    (Math.random() * 0.4 + 0.6) *
    (Math.random() < 0.5 ? -1 : 1),
  RINGS_MOVEMENT_SPEED *
    (Math.random() * 0.4 + 0.6) *
    (Math.random() < 0.5 ? -1 : 1),
  RINGS_MOVEMENT_SPEED *
    (Math.random() * 0.4 + 0.6) *
    (Math.random() < 0.5 ? -1 : 1),
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
    90,
    window.innerWidth / window.innerHeight,
    0.05,
    2000
  );
  camera.position.x = 0;
  camera.position.y = 3;
  camera.position.z = 4.5;
  const centralCylinderPos = new THREE.Vector3();
  centralCylinder.getWorldPosition(centralCylinderPos);
  camera.lookAt(
    centralCylinderPos.x,
    centralCylinderPos.y - 0.5,
    centralCylinderPos.z
  );
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

function createAmbientLight(scene) {
  const light = new THREE.AmbientLight(0xde9b4e, 0.5);

  lights.push(light);
  scene.add(light);
}

function createDirectionalLight(scene) {
  directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(0, centralCylinder.position.y + 2, 5);
  directionalLight.target = centralCylinder;

  lights.push(directionalLight);
  scene.add(directionalLight);
}

function createSpotlight(parent, targetPiece) {
  const spotlight = new THREE.SpotLight(0xffffff, 0.2, 1.5, Math.PI / 2, 0.5);
  spotlight.position.set(0, 0, 0);
  spotlight.target = targetPiece;

  lights.push(spotlight);
  spotlights.push(spotlight);
  parent.add(spotlight);
}

function createPointLight(parent) {
  const numLights = 8;
  const box = new THREE.Box3().setFromObject(parent);
  const radius = box.max.y - box.min.y;
  for (let i = 0; i < numLights; i++) {
    const pointlight = new THREE.PointLight(0xffffff, 0.5, 2);
    const placementAngle = i * ((2 * Math.PI) / numLights);
    pointlight.position.x = radius * Math.cos(placementAngle);
    pointlight.position.z = radius * Math.sin(placementAngle);
    lights.push(pointlight);
    pointlights.push(pointlight);
    parent.add(pointlight);
  }
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function createMeshMaterial(geometry, material, materialOptions) {
  "use strict";

  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = { materialOptions, currentMaterial: material };
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
    color: CENTRAL_CYLINDER_COLOR,
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
  const geometry = new THREE.BufferGeometry();

  const vertices = new Float32Array([
    1.5, 0, -0, 1.6, 0, -0, 1.7, 0, -0, 1.8, 0, -0, 1.9, 0, -0, 2, 0, 0, 2.1, 0,
    0, 2.2, 0, 0, 2.3, 0, 0, 2.4, 0, 0, 2.5, 0, 0, 1.2333235466029882,
    0.8960620073974725, -0.1545084971874737, 1.3102656350323696,
    0.9519637068349673, -0.12360679774997896, 1.387207723461751,
    1.0078654062724621, -0.09270509831248422, 1.4641498118911322,
    1.0637671057099567, -0.06180339887498948, 1.5410919003205137,
    1.1196688051474517, -0.030901699437494733, 1.618033988749895,
    1.1755705045849463, 0, 1.6949760771792763, 1.231472204022441,
    0.030901699437494733, 1.7719181656086573, 1.2873739034599356,
    0.061803398874989465, 1.8488602540380388, 1.3432756028974304,
    0.09270509831248423, 1.9258023424674202, 1.3991773023349252,
    0.12360679774997896, 2.0027444308968017, 1.45507900177242,
    0.1545084971874737, 0.4930339887498949, 1.5174025904434003,
    -0.29389262614623657, 0.5180339887498949, 1.5943446788727818,
    -0.23511410091698925, 0.5430339887498948, 1.671286767302163,
    -0.17633557568774194, 0.568033988749895, 1.7482288557315444,
    -0.11755705045849463, 0.5930339887498949, 1.8251709441609258,
    -0.0587785252292473, 0.6180339887498949, 1.902113032590307, 0,
    0.6430339887498949, 1.9790551210196885, 0.0587785252292473,
    0.6680339887498948, 2.0559972094490697, 0.1175570504584946,
    0.693033988749895, 2.132939297878451, 0.17633557568774197,
    0.7180339887498949, 2.209881386307832, 0.23511410091698925,
    0.7430339887498949, 2.2868234747372136, 0.29389262614623657,
    -0.5272161727492246, 1.6226045354028333, -0.4045084971874737,
    -0.5453797359493586, 1.6785062348403283, -0.323606797749979,
    -0.5635432991494926, 1.7344079342778231, -0.2427050983124842,
    -0.5817068623496267, 1.7903096337153177, -0.1618033988749895,
    -0.5998704255497607, 1.8462113331528127, -0.08090169943749473,
    -0.6180339887498947, 1.9021130325903073, 0, -0.6361975519500287,
    1.958014732027802, 0.08090169943749473, -0.6543611151501626,
    2.0139164314652964, 0.16180339887498946, -0.6725246783502967,
    2.0698181309027914, 0.24270509831248427, -0.6906882415504307,
    2.1257198303402864, 0.323606797749979, -0.7088518047505648,
    2.181621529777781, 0.4045084971874737, -1.4930339887498947,
    1.0847526885842764, -0.47552825814757677, -1.5180339887498946,
    1.1029162517844104, -0.3804226065180614, -1.5430339887498947,
    1.1210798149845445, -0.285316954888546, -1.5680339887498946,
    1.1392433781846785, -0.1902113032590307, -1.5930339887498948,
    1.1574069413848125, -0.09510565162951533, -1.6180339887498947,
    1.1755705045849465, 0, -1.6430339887498946, 1.1937340677850805,
    0.09510565162951533, -1.6680339887498945, 1.2118976309852145,
    0.19021130325903066, -1.6930339887498949, 1.2300611941853488,
    0.2853169548885461, -1.7180339887498948, 1.2482247573854826,
    0.3804226065180614, -1.7430339887498947, 1.2663883205856166,
    0.47552825814757677, -2, 2.4492935982947064e-16, -0.5, -2,
    2.4492935982947064e-16, -0.4, -2, 2.4492935982947064e-16, -0.3, -2,
    2.4492935982947064e-16, -0.2, -2, 2.4492935982947064e-16,
    -0.09999999999999998, -2, 2.4492935982947064e-16, 0, -2,
    2.4492935982947064e-16, 0.09999999999999998, -2, 2.4492935982947064e-16,
    0.19999999999999996, -2, 2.4492935982947064e-16, 0.30000000000000004, -2,
    2.4492935982947064e-16, 0.4, -2, 2.4492935982947064e-16, 0.5,
    -1.7430339887498951, -1.2663883205856161, -0.4755282581475768,
    -1.7180339887498952, -1.248224757385482, -0.3804226065180615,
    -1.6930339887498953, -1.2300611941853483, -0.2853169548885461,
    -1.668033988749895, -1.211897630985214, -0.19021130325903074,
    -1.643033988749895, -1.19373406778508, -0.09510565162951534,
    -1.6180339887498951, -1.175570504584946, 0, -1.5930339887498952,
    -1.157406941384812, 0.09510565162951534, -1.568033988749895,
    -1.139243378184678, 0.19021130325903068, -1.5430339887498952,
    -1.121079814984544, 0.28531695488854614, -1.5180339887498953,
    -1.10291625178441, 0.3804226065180615, -1.4930339887498951,
    -1.084752688584276, 0.4755282581475768, -0.7088518047505653,
    -2.181621529777781, -0.4045084971874737, -0.6906882415504313,
    -2.125719830340286, -0.323606797749979, -0.6725246783502972,
    -2.069818130902791, -0.2427050983124842, -0.6543611151501632,
    -2.0139164314652964, -0.1618033988749895, -0.6361975519500291,
    -1.9580147320278019, -0.08090169943749473, -0.6180339887498951,
    -1.902113032590307, 0, -0.5998704255497611, -1.8462113331528125,
    0.08090169943749473, -0.5817068623496271, -1.7903096337153175,
    0.16180339887498946, -0.5635432991494931, -1.734407934277823,
    0.24270509831248427, -0.545379735949359, -1.6785062348403281,
    0.323606797749979, -0.527216172749225, -1.6226045354028336,
    0.4045084971874737, 0.7430339887498943, -2.286823474737214,
    -0.2938926261462366, 0.7180339887498943, -2.2098813863078326,
    -0.2351141009169893, 0.6930339887498944, -2.1329392978784516,
    -0.17633557568774197, 0.6680339887498944, -2.0559972094490697,
    -0.11755705045849466, 0.6430339887498945, -1.9790551210196887,
    -0.058778525229247314, 0.6180339887498945, -1.9021130325903073, 0,
    0.5930339887498944, -1.825170944160926, 0.058778525229247314,
    0.5680339887498945, -1.7482288557315446, 0.11755705045849463,
    0.5430339887498945, -1.6712867673021632, 0.176335575687742,
    0.5180339887498945, -1.594344678872782, 0.2351141009169893,
    0.4930339887498945, -1.5174025904434005, 0.2938926261462366,
    2.002744430896801, -1.4550790017724207, -0.15450849718747375,
    1.92580234246742, -1.3991773023349257, -0.12360679774997901,
    1.8488602540380386, -1.3432756028974309, -0.09270509831248425,
    1.7719181656086576, -1.2873739034599363, -0.06180339887498951,
    1.6949760771792761, -1.2314722040224415, -0.030901699437494743,
    1.6180339887498947, -1.1755705045849467, 0, 1.5410919003205135,
    -1.119668805147452, 0.030901699437494743, 1.464149811891132,
    -1.0637671057099571, 0.061803398874989486, 1.3872077234617506,
    -1.0078654062724623, 0.09270509831248426, 1.3102656350323694,
    -0.9519637068349677, 0.12360679774997901, 1.233323546602988,
    -0.8960620073974729, 0.15450849718747375, 2.5, -6.123233995736766e-16,
    -6.123233995736766e-17, 2.4, -5.878304635907295e-16, -4.898587196589413e-17,
    2.3, -5.633375276077824e-16, -3.6739403974420595e-17, 2.2,
    -5.388445916248355e-16, -2.4492935982947065e-17, 2.1,
    -5.143516556418884e-16, -1.224646799147353e-17, 2, -4.898587196589413e-16,
    0, 1.9, -4.653657836759942e-16, 1.224646799147353e-17, 1.8,
    -4.4087284769304716e-16, 2.449293598294706e-17, 1.7,
    -4.1637991171010006e-16, 3.67394039744206e-17, 1.6, -3.9188697572715305e-16,
    4.898587196589413e-17, 1.5, -3.6739403974420594e-16, 6.123233995736766e-17,
  ]);

  const indices = [
    0, 1, 11, 1, 12, 11, 1, 2, 12, 2, 13, 12, 2, 3, 13, 3, 14, 13, 3, 4, 14, 4,
    15, 14, 4, 5, 15, 5, 16, 15, 5, 6, 16, 6, 17, 16, 6, 7, 17, 7, 18, 17, 7, 8,
    18, 8, 19, 18, 8, 9, 19, 9, 20, 19, 9, 10, 20, 10, 21, 20, 11, 12, 22, 12,
    23, 22, 12, 13, 23, 13, 24, 23, 13, 14, 24, 14, 25, 24, 14, 15, 25, 15, 26,
    25, 15, 16, 26, 16, 27, 26, 16, 17, 27, 17, 28, 27, 17, 18, 28, 18, 29, 28,
    18, 19, 29, 19, 30, 29, 19, 20, 30, 20, 31, 30, 20, 21, 31, 21, 32, 31, 22,
    23, 33, 23, 34, 33, 23, 24, 34, 24, 35, 34, 24, 25, 35, 25, 36, 35, 25, 26,
    36, 26, 37, 36, 26, 27, 37, 27, 38, 37, 27, 28, 38, 28, 39, 38, 28, 29, 39,
    29, 40, 39, 29, 30, 40, 30, 41, 40, 30, 31, 41, 31, 42, 41, 31, 32, 42, 32,
    43, 42, 33, 34, 44, 34, 45, 44, 34, 35, 45, 35, 46, 45, 35, 36, 46, 36, 47,
    46, 36, 37, 47, 37, 48, 47, 37, 38, 48, 38, 49, 48, 38, 39, 49, 39, 50, 49,
    39, 40, 50, 40, 51, 50, 40, 41, 51, 41, 52, 51, 41, 42, 52, 42, 53, 52, 42,
    43, 53, 43, 54, 53, 44, 45, 55, 45, 56, 55, 45, 46, 56, 46, 57, 56, 46, 47,
    57, 47, 58, 57, 47, 48, 58, 48, 59, 58, 48, 49, 59, 49, 60, 59, 49, 50, 60,
    50, 61, 60, 50, 51, 61, 51, 62, 61, 51, 52, 62, 52, 63, 62, 52, 53, 63, 53,
    64, 63, 53, 54, 64, 54, 65, 64, 55, 56, 66, 56, 67, 66, 56, 57, 67, 57, 68,
    67, 57, 58, 68, 58, 69, 68, 58, 59, 69, 59, 70, 69, 59, 60, 70, 60, 71, 70,
    60, 61, 71, 61, 72, 71, 61, 62, 72, 62, 73, 72, 62, 63, 73, 63, 74, 73, 63,
    64, 74, 64, 75, 74, 64, 65, 75, 65, 76, 75, 66, 67, 77, 67, 78, 77, 67, 68,
    78, 68, 79, 78, 68, 69, 79, 69, 80, 79, 69, 70, 80, 70, 81, 80, 70, 71, 81,
    71, 82, 81, 71, 72, 82, 72, 83, 82, 72, 73, 83, 73, 84, 83, 73, 74, 84, 74,
    85, 84, 74, 75, 85, 75, 86, 85, 75, 76, 86, 76, 87, 86, 77, 78, 88, 78, 89,
    88, 78, 79, 89, 79, 90, 89, 79, 80, 90, 80, 91, 90, 80, 81, 91, 81, 92, 91,
    81, 82, 92, 82, 93, 92, 82, 83, 93, 83, 94, 93, 83, 84, 94, 84, 95, 94, 84,
    85, 95, 85, 96, 95, 85, 86, 96, 86, 97, 96, 86, 87, 97, 87, 98, 97, 88, 89,
    99, 89, 100, 99, 89, 90, 100, 90, 101, 100, 90, 91, 101, 91, 102, 101, 91,
    92, 102, 92, 103, 102, 92, 93, 103, 93, 104, 103, 93, 94, 104, 94, 105, 104,
    94, 95, 105, 95, 106, 105, 95, 96, 106, 96, 107, 106, 96, 97, 107, 97, 108,
    107, 97, 98, 108, 98, 109, 108, 99, 100, 110, 100, 111, 110, 100, 101, 111,
    101, 112, 111, 101, 102, 112, 102, 113, 112, 102, 103, 113, 103, 114, 113,
    103, 104, 114, 104, 115, 114, 104, 105, 115, 105, 116, 115, 105, 106, 116,
    106, 117, 116, 106, 107, 117, 107, 118, 117, 107, 108, 118, 108, 119, 118,
    108, 109, 119, 109, 120, 119,
  ];

  geometry.setIndex(indices);
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.computeVertexNormals();

  const materialOptions = {
    color: 0x34eb8c,
    side: THREE.DoubleSide,
    opacity: 0.7,
    transparent: true,
    depthWrite: false,
  };

  const material = new THREE.MeshLambertMaterial(materialOptions);
  const mobius = createMeshMaterial(geometry, material, materialOptions);

  mobius.rotation.x = Math.PI / 2;
  const size = (CENTRAL_CYLINDER_HEIGHT * 2) / 3;

  alignObjectVertically(mobius, size, CENTRAL_CYLINDER_HEIGHT + 0.2);
  createPointLight(mobius);

  parent.add(mobius);
}

function addRings(parent) {
  const ringCount = RING_CENTER_OFFSET.length;
  for (let i = 0; i < RING_CENTER_OFFSET.length; i++) {
    const ringGroup = new THREE.Object3D();
    ringGroup.position.set(
      0,
      CENTRAL_CYLINDER_HEIGHT / 2 + RING_HEIGHT * (ringCount - i),
      0
    );
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
  const materialOptions = { color: RINGS_COLOR[ringIndex] };
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
    color: RINGS_PIECE_COLOR[ringIndex],
    wireframe: DEFAULT_WIREFRAME,
    side: THREE.DoubleSide,
  };
  const material = new THREE.MeshLambertMaterial(materialOptions);

  const geometries = [
    new ParametricGeometry(coneFunction, 32, 32),
    new ParametricGeometry(tiltedCylinderFunction, 20, 20),
    new ParametricGeometry(hyperboloidFunction, 32, 32),
    new ParametricGeometry(romanSurfaceFunction, 32, 32),
    new ParametricGeometry(taperedCylinderFunction, 20, 20),
    new ParametricGeometry(torusFunction, 20, 20),
    new ParametricGeometry(hemisphereFunction, 32, 32),
    new ParametricGeometry(enneperSurfaceFunction, 32, 32),
  ];

  const newPieces = [];
  for (let i = 0; i < RING_PIECES_COUNT; i++) {
    const currentGeometry = geometries[(i + ringIndex * 2) % geometries.length];
    const piece = createMeshMaterial(
      currentGeometry,
      material.clone(),
      materialOptions
    );
    const placementAngle = i * ((2 * Math.PI) / RING_PIECES_COUNT) + offset;

    const pieceGroup = new THREE.Object3D();
    pieceGroup.position.setX(radius * Math.cos(placementAngle));
    pieceGroup.position.setZ(radius * Math.sin(placementAngle));

    const pieceRotAxis = new THREE.Object3D();
    const rotAxis = new THREE.Vector3(
      Math.random(),
      Math.random(),
      Math.random()
    ).normalize();
    pieceRotAxis.rotateOnAxis(rotAxis, Math.random() * Math.PI - Math.PI / 2);
    pieceRotAxis.add(piece);

    pieceRotAxis.position.setX(0);
    pieceRotAxis.position.setZ(0);
    alignPieceVertically(pieceRotAxis, RING_PIECE_SIZE[ringIndex]);
    pieceGroup.add(pieceRotAxis);

    // Create spotlight
    createSpotlight(pieceGroup, piece);

    newPieces.push(pieceRotAxis);
    parent.add(pieceGroup);
  }
  pieces.push(newPieces);
}

function alignPieceVertically(pieceObject, targetMaxMeasure, offset = 0) {
  scaleObject(pieceObject, targetMaxMeasure);

  const box = new THREE.Box3().setFromObject(pieceObject);
  const maxSpan = box.max.clone().sub(box.min).length();

  pieceObject.position.setY(maxSpan / 2 + offset);
}

function alignObjectVertically(object, targetMaxMeasure, offset = 0) {
  scaleObject(object, targetMaxMeasure);

  const box = new THREE.Box3().setFromObject(object);
  const height = box.max.y - box.min.y;

  object.position.setY(height / 2 + offset);
}

function scaleObject(object, targetMaxMeasure) {
  "use strict";

  const box = new THREE.Box3().setFromObject(object);
  const largestMeasure = Math.max(
    box.max.x - box.min.x,
    box.max.y - box.min.y,
    box.max.z - box.min.z
  );

  const scaleFactor = targetMaxMeasure / largestMeasure;

  object.scale.x = scaleFactor;
  object.scale.y = scaleFactor;
  object.scale.z = scaleFactor;
}

function addSkydome(parent) {
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load("images/skydome.png", function (texture) {
    const geometry = new THREE.SphereGeometry(8);
    texture.wrapT = THREE.RepeatWrapping;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.set(6, 2);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
    });

    const sphere = new THREE.Mesh(geometry, material);

    parent.add(sphere);
  });
}

///////////////////////////
/* PARAMETRIC GEOMETRIES */
///////////////////////////
function coneFunction(u, v, target) {
  const radius = 5;
  const height = 10;
  const theta = 2 * Math.PI * u;
  const r = radius * (1 - v);
  const x = r * Math.cos(theta);
  const y = height * v;
  const z = r * Math.sin(theta);
  target.set(x, y, z);
}

function tiltedCylinderFunction(u, v, target) {
  const radius = 3;
  const height = 10;
  const theta = 2 * Math.PI * u;
  const offsetX = 4 * v;
  const x = radius * Math.cos(theta) + offsetX;
  const y = height * (v - 0.5);
  const z = radius * Math.sin(theta);
  target.set(x, y, z);
}

function taperedCylinderFunction(u, v, target) {
  const radiusTop = 5;
  const radiusBottom = 2;
  const height = 5;
  const theta = 2 * Math.PI * u;
  const r = radiusTop + (radiusBottom - radiusTop) * (1 - v);
  const x = r * Math.cos(theta);
  const y = height * (v - 0.5);
  const z = r * Math.sin(theta);
  target.set(x, y, z);
}

function torusFunction(u, v, target) {
  const radius = 5;
  const tube = 2;
  const theta = 2 * Math.PI * u;
  const phi = 2 * Math.PI * v;
  const x = (radius + tube * Math.cos(phi)) * Math.cos(theta);
  const y = (radius + tube * Math.cos(phi)) * Math.sin(theta);
  const z = tube * Math.sin(phi);
  target.set(x, y, z);
}

function hemisphereFunction(u, v, target) {
  const radius = 5;
  const theta = Math.PI * u;
  const phi = (Math.PI / 2) * v;
  const x = radius * Math.cos(theta) * Math.sin(phi);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(theta) * Math.sin(phi);
  target.set(x, y, z);
}

function hyperboloidFunction(u, v, target) {
  const r = 1.4 * v;
  const theta = (3 / 2) * Math.PI * u;
  const x = r * Math.cos(theta);
  const y = -Math.pow(r, 2);
  const z = r * Math.sin(theta);
  target.set(x, y, z);
}

function romanSurfaceFunction(u, v, target) {
  u = u * Math.PI * 2;
  v = v * Math.PI;
  const x = Math.sin(u) * Math.cos(v) * Math.cos(v);
  const y = Math.sin(u) * Math.sin(v) * Math.sin(v);
  const z = (Math.cos(u) * Math.sin(2 * v)) / 2;
  target.set(x, y, z);
}

function enneperSurfaceFunction(u, v, target) {
  u = u * 2 - 1;
  v = v * 2 - 1;
  const x = u - u ** 3 / 3 + u * v ** 2;
  const y = v - v ** 3 / 3 + v * u ** 2;
  const z = u ** 2 - v ** 2;
  target.set(x, y, z);
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
  const maxHeight = CENTRAL_CYLINDER_HEIGHT - RING_HEIGHT * 2;
  const minHeight = RING_HEIGHT;

  if (movementSpeed > 0 && ring.position.y + delta > maxHeight) {
    delta = maxHeight - ring.position.y;
    ringMovementSpeeds[ringIndex] *= -1;
  }

  if (movementSpeed < 0 && ring.position.y + delta < minHeight) {
    delta = minHeight - ring.position.y;
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
  let newMaterial;
  for (const mesh of meshes) {
    switch (key) {
      case "q":
        newMaterial = new THREE.MeshLambertMaterial(
          mesh.userData.materialOptions
        );
        if (lightsActive) {
          mesh.material = newMaterial;
        }
        mesh.userData.currentMaterial = newMaterial;
        break;
      case "w":
        newMaterial = new THREE.MeshPhongMaterial(
          mesh.userData.materialOptions
        );
        if (lightsActive) {
          mesh.material = newMaterial;
        }
        mesh.userData.currentMaterial = newMaterial;
        break;
      case "e":
        newMaterial = new THREE.MeshToonMaterial(mesh.userData.materialOptions);
        if (lightsActive) {
          mesh.material = newMaterial;
        }
        mesh.userData.currentMaterial = newMaterial;
        break;
      case "r":
        newMaterial = new THREE.MeshNormalMaterial(
          mesh.userData.materialOptions
        );
        if (lightsActive) {
          mesh.material = newMaterial;
        }
        mesh.userData.currentMaterial = newMaterial;
        break;
      case "t":
        if (lightsActive) {
          mesh.material = mesh.userData.currentMaterial;
        } else {
          mesh.material = new THREE.MeshBasicMaterial(
            mesh.userData.materialOptions
          );
        }
        break;
    }
  }
}

function update() {
  "use strict";

  // Offset the scene while on VR mode to move away from the camera
  if (renderer.xr.isPresenting) {
    scene.position.set(0, -1.5, -4.5);
  }

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
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  renderer.xr.enabled = true;
  document.body.appendChild(VRButton.createButton(renderer));

  createScene();
  createPerspectiveCamera();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  // When window loses focus, clear all pressed keys
  window.addEventListener("blur", () => clearKeys());

  window.addEventListener("resize", onResize);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
  "use strict";

  deltaTime = clock.getDelta();
  update();
  render();

  renderer.setAnimationLoop(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {
  "use strict";

  renderer.setSize(window.innerWidth, window.innerHeight);

  if (window.innerHeight > 0 && window.innerWidth > 0) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
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
      callback = () => {
        directionalLight.visible = !directionalLight.visible;
        keysMap.delete(key);
      };
      keysMap.set(key, callback);
      break;
    case "p":
      callback = () => {
        for (const pointlight of pointlights) {
          pointlight.visible = !pointlight.visible;
        }
        keysMap.delete(key);
      };
      keysMap.set(key, callback);
      break;
    case "s":
      callback = () => {
        for (const spotlight of spotlights) {
          spotlight.visible = !spotlight.visible;
        }
        keysMap.delete(key);
      };
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
      callback = () => {
        lightsActive = !lightsActive;
        switchMaterials(key);
        keysMap.delete(key);
      };
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
