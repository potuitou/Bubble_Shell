// Set up scene, camera, and renderer
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0); // Background transparent
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Add lights to the scene
let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 0);
scene.add(directionalLight);

let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Create the dynamic grass and add it to the scene
const grass = new Grass(30, 100000);
scene.add(grass);

// Load normal and displacement maps for the bubble material
const textureLoader = new THREE.TextureLoader();
const normalMap = textureLoader.load('./rocky_terrain_02_1k.blend/textures/rocky_terrain_02_nor_gl_1k.exr');
const displacementMap = textureLoader.load('./rocky_terrain_02_1k.blend/textures/rocky_terrain_02_disp_1k.png');

// Create multiple bubbles but only show one at a time
let bubbles = [];
let currentIndex = 0;
const bubblePositions = [
    { x: 0, y: 4.7, z: 0 },
    { x: 0, y: 4.7, z: 0 },
    { x: 0, y: 4.7, z: 0 },
    { x: 0, y: 4.7, z: 0 },
    { x: 0, y: 6, z: 0 }
];

// Define images for each bubble
const bubbleImages = [
    [   './Diary/Diary.png'],
    [   './Daily Things/Wechat-Final-7.jpg',
        './Daily Things/Wechat-Final-8.jpg',
        './Daily Things/Wechat-Final-9.jpg',
        './Daily Things/Wechat-Final-10.jpg'
    ],
    [   './Snow/Snow1.png',
        './Snow/Snow2.png',
        './Snow/Snow3.png',
        './Snow/Snow4.png',
        './Snow/Snow5.png',
        './Snow/Snow6.png',
        './Snow/Snow7.png',
        './Snow/Snow8.png',
        './Snow/Snow9.png',
        './Snow/Snow10.png',
        './Snow/Snow11.png',
        './Snow/Snow12.png'
    ],
    [   './Home/Home-3.png',
        './Home/Home-4.png',
        './Home/Home-5.png',
        './Home/Home-8.png',
        './Home/Home-9.png',
        './Home/Home-10.png',
        './Home/Home-15.png',
        './Home/Home-17.png',
        './Home/Home-18.png',
        './Home/Home-23.png',
        './Home/Home-26.png',
        './Home/Home-27.png',
        './Home/Home-28.png',
        './Home/Home-31.png',
        './Home/Home-33.png',
    ],
    [   './Langue/langue1.png',
        './Langue/langue2.png',
        './Langue/langue3.png',
        './Langue/langue4.png',
        './Langue/langue5.png',
        './Langue/langue6.png',
    ],
    
];

bubblePositions.forEach((pos, index) => {
    let geometry = new THREE.SphereGeometry(3.6, 32, 23);
    let bubbleMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.15,
        roughness: 0.5,
        transmission: 0.9,
        transparent: true,
        opacity: index === currentIndex ? 1 : 0, // 当前显示的球体初始设置为不透明
        reflectivity: 0.7,
        ior: 1.33,
        clearcoat: 0.6,
        clearcoatRoughness: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false,
        normalMap: normalMap,
        displacementMap: displacementMap,
        displacementScale: 0.5
    });
    

    let bubble = new THREE.Mesh(geometry, bubbleMaterial);
    bubble.position.set(pos.x, pos.y, pos.z);
    bubble.renderOrder = 1;
    scene.add(bubble);
    bubbles.push(bubble);

    // Initially, make all bubbles invisible except the first one
    bubble.visible = index === currentIndex;

    // Load images for each bubble
    let radius = 5;
    let imageRadius = radius - 1.8;
    let imageLoader = new THREE.TextureLoader();

    bubbleImages[index].forEach((imageSrc) => {
        imageLoader.load(
            imageSrc,
            function(texture) {
                let material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
                let planeGeometry = new THREE.PlaneGeometry(3, 2);
                let plane = new THREE.Mesh(planeGeometry, material);

                // Randomize placement using spherical coordinates
                let phi = Math.random() * Math.PI;
                let theta = Math.random() * 2 * Math.PI;

                plane.position.set(
                    imageRadius * Math.sin(phi) * Math.cos(theta),
                    imageRadius * Math.cos(phi),
                    imageRadius * Math.sin(phi) * Math.sin(theta)
                );

                plane.lookAt(0, 0, 0);
                bubble.add(plane);
            }
        );
    });
});

// Controls for user interaction
let controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2.2;
controls.maxDistance = 15;

// Position the camera
camera.position.set(-3, 6, 10);
camera.lookAt(0, 0, 0);

// Animation for grass and auto-rotating bubbles
let previousTime = 0;
let autoRotateSpeed = 0.0006;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

function animate(time) {
    let deltaTime = time - previousTime;
    previousTime = time;

    grass.update(deltaTime * 0.001);

    if (!isDragging && bubbles[currentIndex]) {
        bubbles[currentIndex].rotation.y += autoRotateSpeed;
    }

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

// Function to smoothly transition between bubbles
function transitionBubbles(nextIndex) {
    let currentBubble = bubbles[currentIndex];
    let nextBubble = bubbles[nextIndex];

    let progress = 0;
    const duration = 500; // Duration in milliseconds

    function fade() {
        progress += 20; // Roughly 16ms per frame for 60fps
        let factor = Math.min(progress / duration, 1);

        currentBubble.material.opacity = 1 - factor;
        nextBubble.material.opacity = factor;

        if (factor < 1) {
            requestAnimationFrame(fade);
        } else {
            currentBubble.visible = false;
            currentIndex = nextIndex;
        }
    }

    nextBubble.visible = true;
    requestAnimationFrame(fade);
}

// Handle arrow buttons to switch between bubbles
document.getElementById('arrow-left').addEventListener('click', () => {
    let nextIndex = (currentIndex - 1 + bubbles.length) % bubbles.length;
    transitionBubbles(nextIndex);
});

document.getElementById('arrow-right').addEventListener('click', () => {
    let nextIndex = (currentIndex + 1) % bubbles.length;
    transitionBubbles(nextIndex);
});

// Handle mouse interactions for rotating the bubble
document.addEventListener('mousedown', () => { isDragging = true; });
document.addEventListener('mousemove', (event) => {
    if (isDragging && bubbles[currentIndex]) {
        let deltaMove = { x: event.offsetX - previousMousePosition.x, y: event.offsetY - previousMousePosition.y };
        let deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(deltaMove.y * 0.01, deltaMove.x * 0.01, 0, 'XYZ'));
        bubbles[currentIndex].quaternion.multiplyQuaternions(deltaRotationQuaternion, bubbles[currentIndex].quaternion);
        previousMousePosition = { x: event.offsetX, y: event.offsetY };
    }
});
document.addEventListener('mouseup', () => { isDragging = false; });

// Resize handling
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
