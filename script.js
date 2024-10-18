// Set up scene, camera, and renderer
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });  // alpha:true to make background transparent
renderer.setClearColor(0x000000, 0);  // Renderer background transparent
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Add a directional light to the scene
let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 0);
scene.add(directionalLight);

// Add ambient light to brighten the entire scene
let ambientLight = new THREE.AmbientLight(0xffffff, 1);  // Soft global light
scene.add(ambientLight);

// Load normal and displacement maps (You can use custom textures here)
const textureLoader = new THREE.TextureLoader();
const normalMap = textureLoader.load('./rocky_terrain_02_1k.blend/textures/rocky_terrain_02_nor_gl_1k.exr');
const displacementMap = textureLoader.load('./rocky_terrain_02_1k.blend/textures/rocky_terrain_02_disp_1k.png');

// Create the bubble-like sphere using MeshPhysicalMaterial with normal and displacement maps
let geometry = new THREE.SphereGeometry(4.5, 64, 64);
let bubbleMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,       // Set color to white for glassy effect
    metalness: 0.15,        // Less metallic, more transparent
    roughness: 0.5,        // Reduced roughness for glossiness
    transmission: 0.9,     // Full transmission for transparency
    transparent: true,     
    opacity: 0.6,          // Semi-transparent for glass effect
    reflectivity: 0.7,     // Reflective for a shiny surface
    ior: 1.33,             // Index of Refraction, similar to glass
    clearcoat: 0.6,        // Adds an additional reflective layer
    clearcoatRoughness: 0.1,  // Keep the reflective layer smooth
    side: THREE.DoubleSide,  // Render both sides of the sphere
    depthWrite: false,      // Disable depth writing for proper transparency rendering
    normalMap: normalMap,    // Add normal map for bumpiness
    displacementMap: displacementMap,  // Add displacement map for actual surface displacement
    displacementScale: 0.5   // Adjust this value for more or less displacement
});

// Create the bubble mesh
let bubble = new THREE.Mesh(geometry, bubbleMaterial);
bubble.renderOrder = 1;  // Ensure the bubble renders after the grass
scene.add(bubble);

// Load the grass texture for the background (optional)
const grassDiffuse = textureLoader.load('./rocky_terrain_02_1k.blend/textures/rocky_terrain_02_diff_1k.jpg');

// Custom ShaderMaterial for grass with noise and fog effect
let grassShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 1 },
        grassTexture: { value: grassDiffuse }
    },
    vertexShader: `
        varying vec2 vUv;
        varying float vDistance;
        void main() {
            vUv = uv;
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            vDistance = length(modelPosition.xz);  // Distance from center
            gl_Position = projectionMatrix * viewMatrix * modelPosition;
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform sampler2D grassTexture;
        varying vec2 vUv;
        varying float vDistance;
        void main() {
            vec2 uv = vUv;
            uv.x += time * 0.05;  // Slow grass movement
            vec4 grassColor = texture2D(grassTexture, uv);
            
            // Create a fog-like fade-out based on distance
            float fogFactor = smoothstep(5.0, 30.0, vDistance);  // Adjust for gradual fade
            grassColor.a = mix(1.0, 0.0, fogFactor);  // Grass becomes transparent at the edge

            vec3 fogColor = vec3(0.8, 0.8, 0.9);  // blue mist
            grassColor.rgb = mix(grassColor.rgb, fogColor, fogFactor);
            
            gl_FragColor = grassColor;
        }
    `,
    transparent: true
});

// Create the grass background
let grassGeometry = new THREE.PlaneGeometry(200, 200, 256, 256);
let grassPlane = new THREE.Mesh(grassGeometry, grassShaderMaterial);
grassPlane.rotation.x = -Math.PI / 2;
grassPlane.position.y = -5;
grassPlane.renderOrder = 0;  // Ensure the grass renders before the bubble
scene.add(grassPlane);

// Animate the grass background
function animateGrass(deltaTime) {
    grassShaderMaterial.uniforms.time.value += deltaTime;
}

// Position the camera
camera.position.z = 10;

// Image paths
const images = [
    './The_Perfect/1.jpg',
    './The_Perfect/2.jpg',
    './The_Perfect/3.jpg',
    './The_Perfect/4.jpg',
    './The_Perfect/5.jpg',
    './The_Perfect/6.jpg',
    './The_Perfect/7.jpg',
    './The_Perfect/8.jpg',
    './The_Perfect/9.jpg',
    './The_Perfect/10.jpg',
    './The_Perfect/11.jpg',
    './The_Perfect/12.jpg'
];

// Set the sphere's radius and slightly reduce for image positioning
let radius = 6;     
let imageRadius = radius - 1.8;
let imageLoader = new THREE.TextureLoader();

// Create random image positions and place them inside the sphere
images.forEach((imageSrc, index) => {
    imageLoader.load(
        imageSrc,
        function(texture) {
            let material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
            let planeGeometry = new THREE.PlaneGeometry(3, 2);
            let plane = new THREE.Mesh(planeGeometry, material);

            // Randomize the placement of the images using spherical coordinates
            let phi = Math.random() * Math.PI;         // Random vertical angle (0 to Pi)
            let theta = Math.random() * 2 * Math.PI;   // Random horizontal angle (0 to 2*Pi)

            // Convert spherical coordinates to Cartesian coordinates
            plane.position.set(
                imageRadius * Math.sin(phi) * Math.cos(theta),
                imageRadius * Math.cos(phi),
                imageRadius * Math.sin(phi) * Math.sin(theta)
            );

            plane.lookAt(0, 0, 0);  // Make the image face the center of the sphere

            bubble.add(plane);
        },
        undefined,
        function(err) {
            console.error("Error loading image:", imageSrc, err);
        }
    );
});

// Automatic rotation for the bubble (similar to a spinning globe)
let autoRotateSpeed = 0.0006;  // Adjust the speed of rotation

// Interactivity (rotation)
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

document.addEventListener('mousedown', (event) => {
    isDragging = true;
});

document.addEventListener('mousemove', (event) => {
    if (isDragging) {
        let deltaMove = { x: event.offsetX - previousMousePosition.x, y: event.offsetY - previousMousePosition.y };

        let deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                deltaMove.y * 0.01,
                deltaMove.x * 0.01,
                0,
                'XYZ'
            ));

        bubble.quaternion.multiplyQuaternions(deltaRotationQuaternion, bubble.quaternion);

        previousMousePosition = { x: event.offsetX, y: event.offsetY };
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

// Render loop with auto rotation
let previousTime = 0;
function animate(time) {
    let deltaTime = time - previousTime;
    previousTime = time;

    // Auto-rotate the bubble when not interacting
    if (!isDragging) {
        bubble.rotation.y += autoRotateSpeed;
    }

    requestAnimationFrame(animate);
    animateGrass(deltaTime * 0.001);  // Slow down the grass movement
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
