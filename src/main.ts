import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import gsap from 'gsap';
import { GiftCard } from './card';
import { PetalSystem } from './petals';
import { SparkleSystem } from './sparkles';

class World {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private card: GiftCard;
  private petals: PetalSystem;
  private sparkles: SparkleSystem;
  private groundMirror: Reflector;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private isAnimating: boolean = false;

  private isZoomed: boolean = false;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        stencil: true // Ensure Stencil is enabled
    });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true; 
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    this.renderer.localClippingEnabled = true; // Enable Cropping Support
    document.body.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 0, 6);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    
    // Disable Zooming and Panning
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    
    // Limit rotation slightly for better aesthetics
    this.controls.minPolarAngle = Math.PI * 0.25; 
    this.controls.maxPolarAngle = Math.PI * 0.65;

    // --- REFLECTOR (WATER) SETUP ---
    const geometry = new THREE.PlaneGeometry(60, 60);
    this.groundMirror = new Reflector(geometry, {
        clipBias: 0.003,
        textureWidth: window.innerWidth * window.devicePixelRatio,
        textureHeight: window.innerHeight * window.devicePixelRatio,
        color: 0xaaeeff // Soft light blue for water tint
    });
    this.groundMirror.position.y = -3.0;
    this.groundMirror.rotation.x = -Math.PI / 2;
    
    // Custom Shader for Transparency, Fading, and Ripples
    const mirrorMaterial = this.groundMirror.material as THREE.ShaderMaterial;
    mirrorMaterial.transparent = true;
    mirrorMaterial.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = { value: 0 };
        shader.uniforms.uOpacity = { value: 0.6 }; // Slightly more transparent
        
        shader.vertexShader = `
            varying vec2 vUv2;
            ${shader.vertexShader.replace('void main() {', 'void main() {\nvUv2 = uv;')}
        `;
        
        shader.fragmentShader = `
            varying vec2 vUv2;
            uniform float uTime;
            uniform float uOpacity;
            uniform vec3 color;
            uniform sampler2D tDiffuse;
            varying vec4 vUv;

            void main() {
                float dist = length(vUv2 - vec2(0.5));
                float mask = smoothstep(0.5, 0.2, dist);
                vec2 distortion = vec2(
                    sin(vUv2.x * 12.0 + uTime * 1.5) * 0.005,
                    cos(vUv2.y * 12.0 + uTime * 1.5) * 0.005
                );
                vec4 reflectionSample = texture2DProj( tDiffuse, vUv + vec4(distortion, 0.0, 0.0) );
                
                // Mix reflection with the surface color directly
                vec3 finalColor = mix(reflectionSample.rgb, color, 0.5);
                
                gl_FragColor = vec4( finalColor, uOpacity * mask );
            }
        `;
        this.groundMirror.userData.shader = shader;
    };
    this.scene.add(this.groundMirror);

    // Add Sparkles
    this.sparkles = new SparkleSystem();
    this.scene.add(this.sparkles);

    // Add Petals
    this.petals = new PetalSystem();
    this.scene.add(this.petals);

    // Add Card
    this.card = new GiftCard();
    this.scene.add(this.card);

    // --- FLOATING ANIMATION ---
    gsap.to(this.card.position, {
        y: 0.2,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });

    gsap.to(this.card.rotation, {
        x: 0.05,
        z: 0.02,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });

    // Hook Petals and Camera to Card Toggle
    this.card.onToggle = (isOpen) => {
        this.isAnimating = true;
        this.controls.enabled = false;
        
        // If zooming out because card is closing
        if (!isOpen && this.isZoomed) {
            this.isZoomed = false;
        }

        const targetX = isOpen ? 1.2 : 0;
        const targetZ = isOpen ? 5.0 : 5.5;

        // Animate target and position in sync
        gsap.to(this.controls.target, {
            x: 0, y: 0, z: 0,
            duration: 1.5,
            ease: "power3.inOut"
        });

        gsap.to(this.camera.position, {
            x: targetX,
            y: 0,
            z: targetZ,
            duration: 1.5,
            ease: "power3.inOut",
            onUpdate: () => {
                this.controls.update();
            },
            onComplete: () => {
                this.isAnimating = false;
                this.controls.enabled = true;
            }
        });
    };

    // --- NEW LIGHTING SETUP ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    
    const spotLight = new THREE.SpotLight(0xffffff, 1.5);
    spotLight.position.set(5, 8, 5);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.6);
    frontLight.position.set(-2, -2, 5);

    const pointLight = new THREE.PointLight(0xffb6c1, 1, 10);
    pointLight.position.set(0, 0, 2);

    this.scene.add(ambientLight, spotLight, frontLight, pointLight);

    this.animate();
    this.handleResize();
    this.handleEvents();
  }

  private handleResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      
      // Update Reflector Texture Size
      this.groundMirror.getRenderTarget().setSize(
        window.innerWidth * window.devicePixelRatio,
        window.innerHeight * window.devicePixelRatio
      );
    });
  }

  private zoomToLetter() {
    this.isAnimating = true;
    this.isZoomed = true;
    this.controls.enabled = false;

    // Calculate letter world position
    const letterPos = new THREE.Vector3();
    this.card.envelope.letter.getWorldPosition(letterPos);

    // Animate target to letter
    gsap.to(this.controls.target, {
        x: letterPos.x,
        y: letterPos.y,
        z: letterPos.z,
        duration: 1.2,
        ease: "power3.inOut"
    });

    gsap.to(this.camera.position, {
        x: letterPos.x,
        y: letterPos.y,
        z: letterPos.z + 1.8, // Closer zoom distance for better readability
        duration: 1.2,
        ease: "power3.inOut",
        onUpdate: () => {
            this.controls.update();
        },
        onComplete: () => {
            this.isAnimating = false;
            this.controls.enabled = true;
        }
    });
  }

  private zoomOut() {
    this.isAnimating = true;
    this.isZoomed = false;
    this.controls.enabled = false;

    // Return to card-open view
    gsap.to(this.controls.target, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.2,
        ease: "power3.inOut"
    });

    gsap.to(this.camera.position, {
        x: 1.2,
        y: 0,
        z: 5.0,
        duration: 1.2,
        ease: "power3.inOut",
        onUpdate: () => {
            this.controls.update();
        },
        onComplete: () => {
            this.isAnimating = false;
            this.controls.enabled = true;
        }
    });
  }

  private handleEvents() {
    window.addEventListener('click', (event) => {
      if (this.isAnimating) return;
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      const intersects = this.raycaster.intersectObject(this.card, true);
      if (intersects.length > 0) {
        // Find if the first intersected object is part of the envelope or letter
        let obj: THREE.Object3D | null = intersects[0].object;
        let isEnvelope = false;
        let isLetter = false;

        while (obj) {
            if (obj === this.card.envelope.letter) {
                isLetter = true;
                isEnvelope = true; // Letter is part of envelope
                break;
            }
            if (obj === this.card.envelope) {
                isEnvelope = true;
                break;
            }
            obj = obj.parent;
        }

        if (isEnvelope) {
            if (isLetter && this.card.envelope.getOpenedState() && !this.isZoomed) {
                this.zoomToLetter();
            } else if (this.isZoomed) {
                this.zoomOut();
            } else {
                this.card.envelope.toggle();
            }
        } else {
            if (this.isZoomed) {
                this.zoomOut();
            } else {
                this.card.toggle();
            }
        }
      } else if (this.isZoomed) {
          // Clicking background while zoomed zooms out
          this.zoomOut();
      }
    });
  }

  private animate() {
    const time = performance.now() * 0.001;
    requestAnimationFrame(() => this.animate());
    this.petals.update();
    this.sparkles.update(time);
    this.controls.update();

    // Update Water Ripples
    if (this.groundMirror.userData.shader) {
      this.groundMirror.userData.shader.uniforms.uTime.value = time;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Wait for fonts to be ready before starting the world
document.fonts.ready.then(() => {
    new World();
});
