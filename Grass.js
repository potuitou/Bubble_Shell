class GrassGeometry extends THREE.BufferGeometry {
    constructor(size, count) {
        super();
        const positions = [];
        const uvs = [];
        const indices = [];

        for (let i = 0; i < count; i++) {
            const surfaceMin = (size / 2) * -1;
            const surfaceMax = size / 2;
            const radius = (size / 2) * Math.random();
            const theta = Math.random() * 2 * Math.PI;
            const x = radius * Math.cos(theta);
            const y = radius * Math.sin(theta);

            uvs.push(
                ...Array.from({ length: 5 }).flatMap(() => [
                    (x - surfaceMin) / (surfaceMax - surfaceMin),
                    (y - surfaceMin) / (surfaceMax - surfaceMin)
                ])
            );

            const blade = this.computeBlade([x, 0, y], i);
            positions.push(...blade.positions);
            indices.push(...blade.indices);
        }

        this.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        this.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
        this.setIndex(indices);
        this.computeVertexNormals();
    }

    computeBlade(center, index = 0) {
        const height = 0.1 + Math.random() * 0.6;
        const vIndex = index * 5;
        const yaw = Math.random() * Math.PI * 3;
        const yawVec = [Math.sin(yaw), 0, -Math.cos(yaw)];
        const bend = Math.random() * Math.PI * 2;
        const bendVec = [Math.sin(bend), 0, -Math.cos(bend)];

        const bl = yawVec.map((n, i) => n * (0.1 / 2) + center[i]);
        const br = yawVec.map((n, i) => n * (-0.1 / 2) + center[i]);
        const tl = yawVec.map((n, i) => n * (0.1 / 4) + center[i]);
        const tr = yawVec.map((n, i) => n * (-0.1 / 4) + center[i]);
        const tc = bendVec.map((n, i) => n * 0.1 + center[i]);

        tl[1] += height / 2;
        tr[1] += height / 2;
        tc[1] += height;

        return {
            positions: [...bl, ...br, ...tr, ...tl, ...tc],
            indices: [
                vIndex, vIndex + 1, vIndex + 2,
                vIndex + 2, vIndex + 4, vIndex + 3,
                vIndex + 3, vIndex, vIndex + 2
            ]
        };
    }
}

const cloudTexture = new THREE.TextureLoader().load('cloud.jpg');
cloudTexture.wrapS = cloudTexture.wrapT = THREE.RepeatWrapping;

class Grass extends THREE.Mesh {
    constructor(size, count) {
        const geometry = new GrassGeometry(size, count);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uCloud: { value: cloudTexture },
                uTime: { value: 0 }
            },
            side: THREE.DoubleSide,
            vertexShader,
            fragmentShader
        });
        super(geometry, material);
        const floor = new THREE.Mesh(
            new THREE.CircleGeometry(15, 8).rotateX(Math.PI / 2),
            material
        );
        floor.position.y = -Number.EPSILON;
        this.add(floor);
    }

    update(time) {
        this.material.uniforms.uTime.value = time;
    }
}
