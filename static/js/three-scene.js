/**
 * Advanced Three.js 3D scene for the futuristic application background
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const canvas = document.getElementById('three-canvas');
    
    // Scene settings
    const sceneSettings = {
        camera: {
            fov: 75,
            near: 0.1,
            far: 1000,
            position: { x: 0, y: 0, z: 5 }
        },
        renderer: {
            antialias: true,
            alpha: true
        },
        particles: {
            count: 5000,
            size: 0.06,
            color: 0x00b3ff,
            sizeAttenuation: true
        },
        animation: {
            rotationSpeed: 0.001,
            waveAmplitude: 0.2,
            waveFrequency: 0.003
        },
        grid: {
            size: 20,
            divisions: 30,
            colorCenterLine: 0x00b3ff,
            colorGrid: 0x9000ff,
            opacity: 0.15
        },
        stageSettings: {
            upload: {
                particleColor: 0x00b3ff,
                gridColor: 0x00b3ff,
                bgColor1: 0x080B2D,
                bgColor2: 0x050723
            },
            processing: {
                particleColor: 0x9000ff,
                gridColor: 0x9000ff,
                bgColor1: 0x080B2D,
                bgColor2: 0x050723
            },
            results: {
                particleColor: 0x00ff9d,
                gridColor: 0x00ff9d,
                bgColor1: 0x080B2D,
                bgColor2: 0x050723
            }
        }
    };
    
    // Scene, camera, and renderer
    let scene, camera, renderer;
    
    // Objects and effects
    let particleSystem, hologramGrid, energyField;
    let glowComposer, glowPass, bloomPass;
    
    // Particle groups for different shapes
    let particleGroups = [];
    
    // Animation variables
    let time = 0;
    let mouseX = 0;
    let mouseY = 0;
    let currentStage = 'upload';
    
    // Initialize the scene
    initScene();
    
    // Add event listeners
    addEventListeners();
    
    // Start animation loop
    animate();
    
    /**
     * Initialize the 3D scene
     */
    function initScene() {
        // Create scene with fog for depth effect
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x050723, 0.04);
        
        // Create camera
        const { fov, near, far, position } = sceneSettings.camera;
        camera = new THREE.PerspectiveCamera(
            fov,
            window.innerWidth / window.innerHeight,
            near,
            far
        );
        camera.position.set(position.x, position.y, position.z);
        
        // Create renderer with improved settings
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x050723, 1);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        
        // Add a subtle post-processing glow effect
        setupPostProcessing();
        
        // Create holographic grid
        createHolographicGrid();
        
        // Create advanced particle system
        createParticleSystem();
        
        // Create energy field
        createEnergyField();
        
        // Create floating holographic objects
        createFloatingObjects();
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x4ad7ff, 0.3);
        scene.add(ambientLight);
        
        // Add directional light with soft shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 2, 1);
        scene.add(directionalLight);
        
        // Add point lights for extra highlights
        addDynamicLights();
    }
    
    /**
     * Setup post-processing effects for glow
     */
    function setupPostProcessing() {
        // Parameters for the bloom pass
        const params = {
            exposure: 1,
            bloomStrength: 0.8,
            bloomThreshold: 0,
            bloomRadius: 0.5
        };
        
        // Create composer and passes
        glowComposer = new THREE.EffectComposer(renderer);
        const renderPass = new THREE.RenderPass(scene, camera);
        glowComposer.addPass(renderPass);
        
        // Add bloom for the glow effect
        bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            params.bloomStrength,
            params.bloomRadius,
            params.bloomThreshold
        );
        glowComposer.addPass(bloomPass);
    }
    
    /**
     * Create dynamic lights to enhance the scene
     */
    function addDynamicLights() {
        // Add colored point lights
        const colors = [0x00b3ff, 0x9000ff, 0xff0066, 0x00ff9d];
        const positions = [
            [-3, 2, -2],
            [3, -1, -3],
            [-2, -2, -1],
            [2, 3, -2]
        ];
        
        positions.forEach((pos, index) => {
            const light = new THREE.PointLight(colors[index], 1, 8);
            light.position.set(pos[0], pos[1], pos[2]);
            light.intensity = 0.8;
            light.userData = {
                initialIntensity: 0.8,
                pulseFactor: 0.2,
                pulseSpeed: 0.5 + Math.random() * 0.5,
                initialY: pos[1]
            };
            scene.add(light);
        });
    }
    
    /**
     * Create a holographic grid for the ground
     */
    function createHolographicGrid() {
        const { size, divisions, colorCenterLine, colorGrid, opacity } = sceneSettings.grid;
        
        // Create grid helper
        hologramGrid = new THREE.GridHelper(size, divisions, colorCenterLine, colorGrid);
        hologramGrid.position.y = -3;
        hologramGrid.material.transparent = true;
        hologramGrid.material.opacity = opacity;
        
        // Add custom fading effect to the grid based on distance
        const gridMaterial = hologramGrid.material;
        if (Array.isArray(gridMaterial)) {
            gridMaterial.forEach(mat => {
                mat.transparent = true;
                mat.opacity = opacity;
            });
        }
        
        scene.add(hologramGrid);
    }
    
    /**
     * Create energy field effect
     */
    function createEnergyField() {
        // Create transparent sphere for energy field
        const geometry = new THREE.SphereGeometry(8, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00b3ff,
            transparent: true,
            opacity: 0.05,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            wireframe: true
        });
        
        energyField = new THREE.Mesh(geometry, material);
        energyField.userData = {
            pulseSpeed: 0.003,
            maxScale: 1.1,
            minScale: 0.9
        };
        
        scene.add(energyField);
    }
    
    /**
     * Create an advanced particle system with different shapes and behaviors
     */
    function createParticleSystem() {
        const { count, size, color, sizeAttenuation } = sceneSettings.particles;
        
        // Create particle texture for better looking points
        const particleTexture = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTktMTItMzBUMDE6Mzc6MjArMDE6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE5LTEyLTMwVDAxOjM4OjU3KzAxOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDE5LTEyLTMwVDAxOjM4OjU3KzAxOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjc1MDk0MjI1LTJm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');
        
        // Create different particle groups for more visual interest
        
        // 1. Main particle cloud
        const cloudGeometry = new THREE.BufferGeometry();
        const cloudPositions = new Float32Array(count * 3);
        const cloudSizes = new Float32Array(count);
        const cloudColors = new Float32Array(count * 3);
        
        // Create random particle positions with varying sizes and colors
        const colorBase = new THREE.Color(color);
        const colorVariation1 = new THREE.Color(0x9000ff);
        const colorVariation2 = new THREE.Color(0xff0066);
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            // Position in a sphere shape with random variations
            const radius = 5 + Math.random() * 3;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            cloudPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);     // x
            cloudPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta); // y
            cloudPositions[i3 + 2] = radius * Math.cos(phi);                   // z
            
            // Random sizes with variation
            cloudSizes[i] = size * (0.5 + Math.random() * 1.5);
            
            // Color gradient based on position
            const mixRatio1 = Math.abs(cloudPositions[i3] / 10);
            const mixRatio2 = Math.abs(cloudPositions[i3 + 1] / 10);
            
            const particleColor = new THREE.Color().copy(colorBase);
            particleColor.lerp(colorVariation1, mixRatio1);
            particleColor.lerp(colorVariation2, mixRatio2);
            
            cloudColors[i3] = particleColor.r;
            cloudColors[i3 + 1] = particleColor.g;
            cloudColors[i3 + 2] = particleColor.b;
        }
        
        cloudGeometry.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
        cloudGeometry.setAttribute('size', new THREE.BufferAttribute(cloudSizes, 1));
        cloudGeometry.setAttribute('color', new THREE.BufferAttribute(cloudColors, 3));
        
        // Create custom shader material for better-looking particles
        const cloudMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointTexture: { value: particleTexture }
            },
            vertexShader: `
                uniform float time;
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    // Add subtle movement
                    pos.x += sin(time * 0.3 + position.z * 0.5) * 0.1;
                    pos.y += cos(time * 0.2 + position.x * 0.5) * 0.1;
                    pos.z += sin(time * 0.1 + position.y * 0.5) * 0.1;
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (20.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                void main() {
                    gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
            vertexColors: true
        });
        
        // Create the particle system and add to scene
        particleSystem = new THREE.Points(cloudGeometry, cloudMaterial);
        particleSystem.userData = {
            type: 'main'
        };
        scene.add(particleSystem);
        particleGroups.push(particleSystem);
        
        // 2. Create a spiral formation of particles
        createSpiralParticles();
        
        // 3. Create data flow particles
        createDataFlowParticles();
    }
    
    /**
     * Create a spiral formation of particles
     */
    function createSpiralParticles() {
        const spiralCount = 1000;
        const spiralGeometry = new THREE.BufferGeometry();
        const spiralPositions = new Float32Array(spiralCount * 3);
        const spiralSizes = new Float32Array(spiralCount);
        const spiralColors = new Float32Array(spiralCount * 3);
        
        // Create particles in a spiral formation
        const spiralColor = new THREE.Color(0x00b3ff);
        const spiralColor2 = new THREE.Color(0xff0066);
        
        for (let i = 0; i < spiralCount; i++) {
            const i3 = i * 3;
            const angle = 0.2 * i;
            const radius = 0.03 * angle;
            
            spiralPositions[i3] = radius * Math.cos(angle);      // x
            spiralPositions[i3 + 1] = 0.02 * i - 5;              // y (creates a vertical spiral)
            spiralPositions[i3 + 2] = radius * Math.sin(angle);  // z
            
            // Size based on position in spiral
            spiralSizes[i] = 0.05 * (1 + Math.sin(angle * 0.2));
            
            // Color gradient along the spiral
            const colorMix = i / spiralCount;
            const color = new THREE.Color().copy(spiralColor).lerp(spiralColor2, colorMix);
            
            spiralColors[i3] = color.r;
            spiralColors[i3 + 1] = color.g;
            spiralColors[i3 + 2] = color.b;
        }
        
        spiralGeometry.setAttribute('position', new THREE.BufferAttribute(spiralPositions, 3));
        spiralGeometry.setAttribute('size', new THREE.BufferAttribute(spiralSizes, 1));
        spiralGeometry.setAttribute('color', new THREE.BufferAttribute(spiralColors, 3));
        
        // Create material for spiral particles
        const spiralMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                uniform float time;
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    // Rotate spiral over time
                    float angle = time * 0.5;
                    float x = pos.x * cos(angle) - pos.z * sin(angle);
                    float z = pos.x * sin(angle) + pos.z * cos(angle);
                    pos.x = x;
                    pos.z = z;
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (20.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.5) discard;
                    gl_FragColor = vec4(vColor, 1.0) * vec4(1.0, 1.0, 1.0, 0.8);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
            vertexColors: true
        });
        
        const spiralSystem = new THREE.Points(spiralGeometry, spiralMaterial);
        spiralSystem.userData = {
            type: 'spiral'
        };
        scene.add(spiralSystem);
        particleGroups.push(spiralSystem);
    }
    
    /**
     * Create particles that simulate data flow
     */
    function createDataFlowParticles() {
        const flowCount = 500;
        const flowGeometry = new THREE.BufferGeometry();
        const flowPositions = new Float32Array(flowCount * 3);
        const flowSizes = new Float32Array(flowCount);
        const flowSpeeds = new Float32Array(flowCount);
        
        // Create particles that flow in streams
        for (let i = 0; i < flowCount; i++) {
            const i3 = i * 3;
            // Start at random positions on a sphere
            const radius = 6;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            flowPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);     // x
            flowPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta); // y
            flowPositions[i3 + 2] = radius * Math.cos(phi);                   // z
            
            // Random sizes with variation
            flowSizes[i] = 0.03 + Math.random() * 0.03;
            
            // Random speed for each particle
            flowSpeeds[i] = 0.01 + Math.random() * 0.02;
        }
        
        flowGeometry.setAttribute('position', new THREE.BufferAttribute(flowPositions, 3));
        flowGeometry.setAttribute('size', new THREE.BufferAttribute(flowSizes, 1));
        flowGeometry.setAttribute('speed', new THREE.BufferAttribute(flowSpeeds, 1));
        
        // Create material for flow particles
        const flowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0x00ff9d) }
            },
            vertexShader: `
                uniform float time;
                attribute float size;
                attribute float speed;
                varying float vAlpha;
                void main() {
                    vec3 pos = position;
                    // Flow particles towards the center
                    float dist = length(pos);
                    if (dist < 0.1) {
                        // Reset when too close to center
                        float newDist = 6.0;
                        pos = pos * (newDist / dist);
                        vAlpha = 0.0;
                    } else {
                        // Move towards center
                        pos = pos * (1.0 - speed * 0.1);
                        vAlpha = 1.0 - (dist / 6.0); // Fade as it gets closer
                    }
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (10.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                varying float vAlpha;
                void main() {
                    if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.5) discard;
                    gl_FragColor = vec4(color, vAlpha);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        });
        
        const flowSystem = new THREE.Points(flowGeometry, flowMaterial);
        flowSystem.userData = {
            type: 'flow'
        };
        scene.add(flowSystem);
        particleGroups.push(flowSystem);
    }
    
    /**
     * Create floating holographic objects for the scene
     */
    function createFloatingObjects() {
        // Create holographic octahedron
        const octaGeometry = new THREE.OctahedronGeometry(0.7, 0);
        const octaMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x9000ff,
            transparent: true,
            opacity: 0.7,
            metalness: 1,
            roughness: 0.3,
            clearcoat: 1,
            clearcoatRoughness: 0.2,
            wireframe: false,
            side: THREE.DoubleSide
        });
        
        const octahedron = new THREE.Mesh(octaGeometry, octaMaterial);
        octahedron.position.set(-3, 2, -2);
        octahedron.userData = {
            rotationSpeed: {
                x: 0.003,
                y: 0.005,
                z: 0.001
            },
            floatSpeed: 0.007,
            floatDistance: 0.3,
            initialY: octahedron.position.y
        };
        scene.add(octahedron);
        
        // Create holographic torus knot
        const torusKnotGeometry = new THREE.TorusKnotGeometry(0.7, 0.2, 100, 16);
        const torusKnotMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x00b3ff,
            transparent: true,
            opacity: 0.7,
            metalness: 0.9,
            roughness: 0.2,
            clearcoat: 1,
            clearcoatRoughness: 0.1,
            wireframe: false
        });
        
        const torusKnot = new THREE.Mesh(torusKnotGeometry, torusKnotMaterial);
        torusKnot.position.set(3, -1, -3);
        torusKnot.userData = {
            rotationSpeed: {
                x: 0.001,
                y: 0.002,
                z: 0.003
            },
            floatSpeed: 0.006,
            floatDistance: 0.4,
            initialY: torusKnot.position.y
        };
        scene.add(torusKnot);
        
        // Create holographic icosahedron
        const icoGeometry = new THREE.IcosahedronGeometry(0.5, 0);
        const icoMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xff0066,
            transparent: true,
            opacity: 0.7,
            metalness: 0.8,
            roughness: 0.2,
            clearcoat: 1,
            clearcoatRoughness: 0.1,
            wireframe: false
        });
        
        const icosahedron = new THREE.Mesh(icoGeometry, icoMaterial);
        icosahedron.position.set(-2, -2, -1);
        icosahedron.userData = {
            rotationSpeed: {
                x: 0.002,
                y: 0.003,
                z: 0.001
            },
            floatSpeed: 0.008,
            floatDistance: 0.3,
            initialY: icosahedron.position.y
        };
        scene.add(icosahedron);
    }
    
    /**
     * Add event listeners for user interaction
     */
    function addEventListeners() {
        // Resize handler
        window.addEventListener('resize', onWindowResize);
        
        // Mouse move handler for parallax effect
        document.addEventListener('mousemove', onMouseMove);
        
        // Touch move handler for mobile
        document.addEventListener('touchmove', onTouchMove);
        
        // Click handler for ripple effect
        document.addEventListener('click', createRipple);
    }
    
    /**
     * Handle window resize
     */
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update effect composer size
        if (glowComposer) {
            glowComposer.setSize(window.innerWidth, window.innerHeight);
            if (bloomPass) {
                bloomPass.resolution.set(window.innerWidth, window.innerHeight);
            }
        }
    }
    
    /**
     * Handle mouse movement
     * @param {MouseEvent} event - Mouse event
     */
    function onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    
    /**
     * Handle touch movement
     * @param {TouchEvent} event - Touch event
     */
    function onTouchMove(event) {
        if (event.touches.length > 0) {
            // Calculate touch position in normalized device coordinates
            mouseX = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    }
    
    /**
     * Create ripple effect on click
     * @param {MouseEvent} event - Click event
     */
    function createRipple(event) {
        // Create a ripple effect at the click location
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        
        raycaster.setFromCamera(mouse, camera);
        
        // Create a plane at z=0 to intersect with raycaster
        const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(planeZ, intersectPoint);
        
        // Create ripple
        const ringGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00b3ff,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(intersectPoint);
        ring.rotation.x = Math.PI / 2;
        ring.scale.set(0.1, 0.1, 0.1);
        scene.add(ring);
        
        // Animate the ripple
        gsap.to(ring.scale, {
            x: 3,
            y: 3,
            z: 3,
            duration: 2,
            ease: 'power2.out'
        });
        
        gsap.to(ringMaterial, {
            opacity: 0,
            duration: 2,
            ease: 'power2.out',
            onComplete: () => {
                scene.remove(ring);
                ringGeometry.dispose();
                ringMaterial.dispose();
            }
        });
    }
    
    /**
     * Animation loop
     */
    function animate() {
        requestAnimationFrame(animate);
        
        // Update time
        time += 0.01;
        
        // Update shader uniforms
        particleGroups.forEach(group => {
            if (group.material.uniforms && group.material.uniforms.time) {
                group.material.uniforms.time.value = time;
            }
        });
        
        // Animate energy field
        if (energyField) {
            const pulseScale = energyField.userData.minScale + 
                              (Math.sin(time * energyField.userData.pulseSpeed) * 0.5 + 0.5) * 
                              (energyField.userData.maxScale - energyField.userData.minScale);
            
            energyField.scale.set(pulseScale, pulseScale, pulseScale);
            energyField.rotation.y = time * 0.05;
        }
        
        // Animate holographic grid
        if (hologramGrid) {
            hologramGrid.position.y = -3 + Math.sin(time * 0.2) * 0.1;
            hologramGrid.rotation.y = time * 0.03;
        }
        
        // Animate point lights
        scene.children.forEach(child => {
            // Animate floating objects
            if (child.userData && child.userData.floatSpeed) {
                // Apply rotation
                child.rotation.x += child.userData.rotationSpeed.x;
                child.rotation.y += child.userData.rotationSpeed.y;
                child.rotation.z += child.userData.rotationSpeed.z;
                
                // Apply floating motion
                child.position.y = child.userData.initialY + 
                                  Math.sin(time * child.userData.floatSpeed) * 
                                  child.userData.floatDistance;
            }
            
            // Animate dynamic lights
            if (child.isPointLight && child.userData && child.userData.pulseSpeed) {
                const pulseIntensity = child.userData.initialIntensity + 
                                      Math.sin(time * child.userData.pulseSpeed) * 
                                      child.userData.pulseFactor;
                
                child.intensity = pulseIntensity;
            }
        });
        
        // Apply parallax effect to camera
        camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
        camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
        
        // Render scene with post-processing
        if (glowComposer) {
            glowComposer.render();
        } else {
            renderer.render(scene, camera);
        }
    }
    
    /**
     * Update the scene based on the current application stage
     * @param {string} stageName - Current stage name
     */
    window.updateSceneForStage = function(stageName) {
        if (!sceneSettings.stageSettings[stageName]) return;
        
        currentStage = stageName;
        const settings = sceneSettings.stageSettings[stageName];
        
        // Update grid color
        if (hologramGrid) {
            const gridColor = new THREE.Color(settings.gridColor);
            if (Array.isArray(hologramGrid.material)) {
                hologramGrid.material[0].color.set(settings.gridColor);
                hologramGrid.material[1].color.set(settings.gridColor);
            }
        }
        
        // Update energy field color
        if (energyField && energyField.material) {
            gsap.to(energyField.material.color, {
                r: (settings.particleColor >> 16 & 255) / 255,
                g: (settings.particleColor >> 8 & 255) / 255,
                b: (settings.particleColor & 255) / 255,
                duration: 1.5
            });
        }
        
        // Animate camera based on stage
        switch (stageName) {
            case 'upload':
                gsap.to(camera.position, {
                    z: 5.5,
                    duration: 1.5,
                    ease: 'power2.inOut'
                });
                
                if (bloomPass) {
                    gsap.to(bloomPass, {
                        strength: 0.8,
                        radius: 0.5,
                        duration: 1.5
                    });
                }
                break;
                
            case 'processing':
                gsap.to(camera.position, {
                    z: 6.5,
                    duration: 1.5,
                    ease: 'power2.inOut'
                });
                
                if (bloomPass) {
                    gsap.to(bloomPass, {
                        strength: 1.2,
                        radius: 0.7,
                        duration: 1.5
                    });
                }
                break;
                
            case 'results':
                gsap.to(camera.position, {
                    z: 5,
                    duration: 1.5,
                    ease: 'power2.inOut'
                });
                
                if (bloomPass) {
                    gsap.to(bloomPass, {
                        strength: 1.5,
                        radius: 0.6,
                        duration: 1.5
                    });
                }
                break;
        }
        
        // Create a "transition" effect
        const transitionGeometry = new THREE.PlaneGeometry(50, 50);
        const transitionMaterial = new THREE.MeshBasicMaterial({
            color: settings.particleColor,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const transitionPlane = new THREE.Mesh(transitionGeometry, transitionMaterial);
        transitionPlane.position.z = -10;
        scene.add(transitionPlane);
        
        // Animate transition
        gsap.to(transitionMaterial, {
            opacity: 0,
            duration: 1.5,
            ease: 'power2.inOut',
            onComplete: () => {
                scene.remove(transitionPlane);
                transitionGeometry.dispose();
                transitionMaterial.dispose();
            }
        });
    };
});
