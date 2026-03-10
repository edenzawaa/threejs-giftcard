import * as THREE from 'three';

export class PetalSystem extends THREE.Group {
  private petals: THREE.Mesh[] = [];
  private petalCount: number = 100;
  private isActive: boolean = true;

  constructor() {
    super();

    const petalGeom = new THREE.PlaneGeometry(0.15, 0.15);
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xFF69B4, // Hot Pink
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });

    for (let i = 0; i < this.petalCount; i++) {
      const petal = new THREE.Mesh(petalGeom, petalMat);
      this.resetPetal(petal);
      // Stagger the initial positions so they don't all start at the top
      petal.position.y = Math.random() * 50 - 5;
      
      this.petals.push(petal);
      this.add(petal);
    }

    this.visible = true;
  }

  private resetPetal(petal: THREE.Mesh) {
    petal.position.x = (Math.random() - 0.5) * 20; // Increased from 10
    petal.position.y = 5 + Math.random() * 5;
    petal.position.z = (Math.random() - 0.5) * 15; // Increased from 5
    
    petal.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );

    // Store custom data for animation
    petal.userData.speed = 0.02 + Math.random() * 0.03;
    petal.userData.sway = 0.01 + Math.random() * 0.02;
    petal.userData.swaySpeed = 0.02 + Math.random() * 0.02;
    petal.userData.swayOffset = Math.random() * Math.PI * 2;
  }

  public setVisible(visible: boolean) {
    this.isActive = visible;
    this.visible = visible;
  }

  public update() {
    if (!this.isActive) return;

    this.petals.forEach(petal => {
      // Fall down
      petal.position.y -= petal.userData.speed;
      
      // Sway side to side
      petal.userData.swayOffset += petal.userData.swaySpeed;
      petal.position.x += Math.sin(petal.userData.swayOffset) * petal.userData.sway;
      
      // Rotate slowly
      petal.rotation.x += 0.01;
      petal.rotation.y += 0.012;

      // Reset if off bottom
      if (petal.position.y < -5) {
        this.resetPetal(petal);
      }
    });
  }
}
