import * as THREE from 'three';

export class SparkleSystem extends THREE.Group {
  private particles: THREE.Points;
  private particleCount: number = 100;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;

  constructor() {
    super();

    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      sizes[i] = Math.random();
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.material = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.add(this.particles);
  }

  public update(time: number) {
    const positions = this.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < this.particleCount; i++) {
      // Gentle drift
      positions[i * 3 + 1] += Math.sin(time * 0.5 + i) * 0.002;
      positions[i * 3] += Math.cos(time * 0.3 + i) * 0.001;

      // Twinkle effect (flicker opacity)
      this.material.opacity = 0.5 + Math.sin(time * 2) * 0.3;
    }
    
    this.geometry.attributes.position.needsUpdate = true;
  }
}
