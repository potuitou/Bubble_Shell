const vertexShader = /* glsl */ `
    uniform float uTime;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vNormal;

    float wave(float waveSize, float tipDistance, float centerDistance) {
        // Tip is the fifth vertex drawn per blade
        bool isTip = (gl_VertexID + 1) % 5 == 0;
        float waveDistance = isTip ? tipDistance : centerDistance;
        return sin((uTime * 0.5) + waveSize) * waveDistance; // Adjust the wave speed and size
    }

    void main() {
        vPosition = position;
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);

        if (vPosition.y < 0.0) {
            vPosition.y = 0.0;
        } else {
            // Apply wave effect to x and z to create a wind-like motion
            vPosition.x += wave(uv.x * 5.0, 0.3, 0.1);
            vPosition.z += wave(uv.y * 5.0, 0.3, 0.1);
        }

        gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
    }
`;

const fragmentShader = /* glsl */ `
    uniform sampler2D uCloud;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vNormal;

    vec3 green = vec3(0.1, 0.7, 0.3);

    void main() {
        vec3 color = mix(green * 0.7, green, vPosition.y);
        color = mix(color, texture2D(uCloud, vUv).rgb, 0.4);

        float lighting = normalize(dot(vNormal, vec3(10)));
        gl_FragColor = vec4(color + lighting * 0.03, 1.0);
    }
`;
