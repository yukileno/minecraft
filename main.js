import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(10, 20, 5);
scene.add(directionalLight);

// Ground
const groundSize = 50;
const groundGeometry = new THREE.BoxGeometry(1, 1, 1);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // ForestGreen

const groundMesh = new THREE.InstancedMesh(groundGeometry, groundMaterial, groundSize * groundSize);
scene.add(groundMesh);

const matrix = new THREE.Matrix4();
let i = 0;
for (let x = 0; x < groundSize; x++) {
    for (let z = 0; z < groundSize; z++) {
        // Set position for each instance
        const position = new THREE.Vector3(x - groundSize / 2, -0.5, z - groundSize / 2);
        matrix.setPosition(position);
        groundMesh.setMatrixAt(i++, matrix);
    }
}
groundMesh.instanceMatrix.needsUpdate = true;

// Collection of user-placed blocks
const blocks = new THREE.Group();
scene.add(blocks);

const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
const blockMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 }); // BurlyWood

// Raycaster for block interaction
const raycaster = new THREE.Raycaster();


// Pointer Lock Controls
const controls = new PointerLockControls(camera, document.body);
// Set initial camera position (player's head)
camera.position.set(0, 1.6, 0); // Start at the center, at standing height

// Add the camera to the scene (it's the 'player')
scene.add(controls.getObject());

// UI for locking pointer
const instructions = document.createElement('div');
instructions.style.position = 'absolute';
instructions.style.top = '50%';
instructions.style.left = '50%';
instructions.style.transform = 'translate(-50%, -50%)';
instructions.style.color = 'white';
instructions.style.fontSize = '24px';
instructions.style.fontFamily = 'sans-serif';
instructions.innerHTML = 'Click to start';
document.body.appendChild(instructions);

document.body.addEventListener('click', () => {
    controls.lock();
});

controls.addEventListener('lock', () => {
    instructions.style.display = 'none';
});

controls.addEventListener('unlock', () => {
    instructions.style.display = 'block';
});


// Keyboard input state
const keys = {
    w: false, a: false, s: false, d: false
};

window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() in keys) {
        keys[event.key.toLowerCase()] = true;
    }
});

window.addEventListener('keyup', (event) => {
    if (event.key.toLowerCase() in keys) {
        keys[event.key.toLowerCase()] = false;
    }
});

window.addEventListener('mousedown', (event) => {
    if (!controls.isLocked) return;

    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const intersects = raycaster.intersectObjects([groundMesh, ...blocks.children], false);

    if (intersects.length > 0) {
        const intersection = intersects[0];
        const distance = 5; // Max distance to interact with blocks
        if (intersection.distance > distance) return;

        // Left click (0) to destroy
        if (event.button === 0) {
            if (intersection.object === groundMesh) {
                // Hide the instance in the InstancedMesh
                const instanceId = intersection.instanceId;
                const matrix = new THREE.Matrix4();
                groundMesh.getMatrixAt(instanceId, matrix);
                matrix.scale(new THREE.Vector3(0, 0, 0));
                groundMesh.setMatrixAt(instanceId, matrix);
                groundMesh.instanceMatrix.needsUpdate = true;
            } else {
                // Remove a user-placed block
                scene.remove(intersection.object);
                blocks.remove(intersection.object);
            }
        }
        // Right click (2) to place
        else if (event.button === 2) {
            const newBlock = new THREE.Mesh(blockGeometry, blockMaterial);
            const newPos = intersection.object.position.clone();

            if (intersection.object === groundMesh) {
                // If placing on the ground, get the instance's position
                const matrix = new THREE.Matrix4();
                groundMesh.getMatrixAt(intersection.instanceId, matrix);
                newPos.setFromMatrixPosition(matrix);
            }

            newPos.add(intersection.face.normal);

            // Snap to grid
            newBlock.position.copy(newPos).floor().addScalar(0.5);

            scene.add(newBlock);
            blocks.add(newBlock);
        }
    }
});


const clock = new THREE.Clock();

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta(); // Time since last frame

    // Simplified movement with PointerLockControls
    const moveSpeed = 5 * delta; // Use delta for frame-rate independent speed
    if (keys.w) controls.moveForward(moveSpeed);
    if (keys.s) controls.moveForward(-moveSpeed);
    if (keys.a) controls.moveRight(-moveSpeed);
    if (keys.d) controls.moveRight(moveSpeed);

    renderer.render(scene, camera);
}

animate();
