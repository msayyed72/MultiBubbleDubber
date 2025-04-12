/**
 * Three.js 3D scene for the application background
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
            count: 2000,
            size: 0.05,
            color: 0x4361ee
        },
        animation: {
            rotationSpeed: 0.001,
            waveAmplitude: 0.2,
            waveFrequency: 0.003
        },
        stageSettings: {
            upload: {
                particleColor: 0x4361ee,
                bgColor1: 0xf8f9fa,
                bgColor2: 0xe9ecef
            },
            processing: {
                particleColor: 0x7209b7,
                bgColor1: 0xf8f9fa,
                bgColor2: 0xd8f3dc
            },
            results: {
                particleColor: 0x4cc9f0,
                bgColor1: 0xf8f9fa,
                bgColor2: 0xd8e2dc
            }
        }
    };
    
    // Scene, camera, and renderer
    let scene, camera, renderer;
    
    // Particles and objects
    let particleSystem, cube;
    
    // Animation variables
    let time = 0;
    let mouseX = 0;
    let mouseY = 0;
    
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
        // Create scene
        scene = new THREE.Scene();
        
        // Create camera
        const { fov, near, far, position } = sceneSettings.camera;
        camera = new THREE.PerspectiveCamera(
            fov,
            window.innerWidth / window.innerHeight,
            near,
            far
        );
        camera.position.set(position.x, position.y, position.z);
        
        // Create renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            ...sceneSettings.renderer
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Create particle system
        createParticleSystem();
        
        // Create floating objects
        createFloatingObjects();
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
    }
    
    /**
     * Create a particle system for the background
     */
    function createParticleSystem() {
        const { count, size, color } = sceneSettings.particles;
        
        // Create geometry
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        
        // Create random particle positions
        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 10;     // x
            positions[i + 1] = (Math.random() - 0.5) * 10; // y
            positions[i + 2] = (Math.random() - 0.5) * 10; // z
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create material
        const material = new THREE.PointsMaterial({
            color: color,
            size: size,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        // Create particle system
        particleSystem = new THREE.Points(particles, material);
        scene.add(particleSystem);
    }
    
    /**
     * Create floating objects for the scene
     */
    function createFloatingObjects() {
        // Create floating cubes
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshPhongMaterial({
            color: 0x7209b7,
            transparent: true,
            opacity: 0.7,
            flatShading: true
        });
        
        // Create multiple floating cubes
        for (let i = 0; i < 10; i++) {
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 5
            );
            cube.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            cube.userData = {
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.01,
                    y: (Math.random() - 0.5) * 0.01,
                    z: (Math.random() - 0.5) * 0.01
                },
                floatSpeed: 0.005 + Math.random() * 0.01,
                floatDistance: 0.2 + Math.random() * 0.3,
                initialY: cube.position.y
            };
            scene.add(cube);
        }
        
        // Create floating torus
        const torusGeometry = new THREE.TorusGeometry(1, 0.3, 16, 50);
        const torusMaterial = new THREE.MeshPhongMaterial({
            color: 0x4cc9f0,
            transparent: true,
            opacity: 0.7
        });
        const torus = new THREE.Mesh(torusGeometry, torusMaterial);
        torus.position.set(-3, 2, -2);
        torus.userData = {
            rotationSpeed: {
                x: 0.003,
                y: 0.005,
                z: 0.001
            },
            floatSpeed: 0.007,
            floatDistance: 0.3,
            initialY: torus.position.y
        };
        scene.add(torus);
        
        // Create floating sphere
        const sphereGeometry = new THREE.SphereGeometry(0.7, 32, 32);
        const sphereMaterial = new THREE.MeshPhongMaterial({
            color: 0x4361ee,
            transparent: true,
            opacity: 0.7
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(3, -1, -3);
        sphere.userData = {
            rotationSpeed: {
                x: 0.001,
                y: 0.002,
                z: 0.003
            },
            floatSpeed: 0.008,
            floatDistance: 0.4,
            initialY: sphere.position.y
        };
        scene.add(sphere);
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
    }
    
    /**
     * Handle window resize
     */
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
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
     * Animation loop
     */
    function animate() {
        requestAnimationFrame(animate);
        
        // Update time
        time += 0.01;
        
        // Rotate particle system
        if (particleSystem) {
            particleSystem.rotation.x += sceneSettings.animation.rotationSpeed * 0.5;
            particleSystem.rotation.y += sceneSettings.animation.rotationSpeed;
        }
        
        // Animate floating objects
        scene.children.forEach(child => {
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
        });
        
        // Apply parallax effect to camera
        camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
        camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
        
        // Render scene
        renderer.render(scene, camera);
    }
    
    /**
     * Update the scene based on the current application stage
     * @param {string} stageName - Current stage name
     */
    window.updateSceneForStage = function(stageName) {
        if (!sceneSettings.stageSettings[stageName]) return;
        
        const settings = sceneSettings.stageSettings[stageName];
        
        // Change particle color
        if (particleSystem && particleSystem.material) {
            gsap.to(particleSystem.material.color, {
                r: (settings.particleColor >> 16 & 255) / 255,
                g: (settings.particleColor >> 8 & 255) / 255,
                b: (settings.particleColor & 255) / 255,
                duration: 1
            });
        }
        
        // Animate camera
        switch (stageName) {
            case 'upload':
                gsap.to(camera.position, {
                    z: 5,
                    duration: 1.5,
                    ease: 'power2.inOut'
                });
                break;
            case 'processing':
                gsap.to(camera.position, {
                    z: 6,
                    duration: 1.5,
                    ease: 'power2.inOut'
                });
                break;
            case 'results':
                gsap.to(camera.position, {
                    z: 4.5,
                    duration: 1.5,
                    ease: 'power2.inOut'
                });
                break;
        }
        
        // Animate particle system
        if (particleSystem) {
            switch (stageName) {
                case 'upload':
                    gsap.to(particleSystem.rotation, {
                        x: 0,
                        y: 0,
                        duration: 2,
                        ease: 'power2.inOut'
                    });
                    break;
                case 'processing':
                    gsap.to(particleSystem.rotation, {
                        x: Math.PI / 4,
                        y: Math.PI / 6,
                        duration: 2,
                        ease: 'power2.inOut'
                    });
                    break;
                case 'results':
                    gsap.to(particleSystem.rotation, {
                        x: Math.PI / 2,
                        y: Math.PI / 3,
                        duration: 2,
                        ease: 'power2.inOut'
                    });
                    break;
            }
        }
    };
});
