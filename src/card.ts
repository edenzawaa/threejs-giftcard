import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import gsap from 'gsap';

class LetterEnvelope extends THREE.Group {
  private isOpen: boolean = false;
  private lidPivot: THREE.Group;
  public letter: THREE.Group; // Exposed for zooming
  private isAnimating: boolean = false;

  constructor() {
    super();

    const envW = 2.0;
    const envH = 1.4;
    const pocketDepth = 0.02;
    const envColor = 0xF4B4C4; // Match front cover inner color
    const lidColor = 0xFFB6C1;
    const accentColor = 0xD4AF37; // Gold

    // 1. Envelope Body
    const bodyGeom = new THREE.PlaneGeometry(envW, envH);
    const bodyMat = new THREE.MeshStandardMaterial({ color: envColor, side: THREE.FrontSide });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    this.add(body);

    // 2. Pocket
    const pocketGeom = new THREE.PlaneGeometry(envW, envH);
    const pocketMat = new THREE.MeshStandardMaterial({ color: envColor, side: THREE.FrontSide });
    const pocket = new THREE.Mesh(pocketGeom, pocketMat);
    pocket.position.z = pocketDepth;
    this.add(pocket);

    // Add gold trim/flaps look
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#ffc4d0'; 
        ctx.fillRect(0, 0, 256, 128);
        ctx.strokeStyle = '#D4AF37'; // Gold
        ctx.lineWidth = 3;
        
        // V-shape flap lines
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(128, 70);
        ctx.lineTo(256, 0);
        ctx.stroke();
        
        // Bottom folds
        ctx.strokeStyle = '#E5C45D';
        ctx.beginPath();
        ctx.moveTo(0, 128);
        ctx.lineTo(128, 70);
        ctx.lineTo(256, 128);
        ctx.stroke();
    }
    const pocketTex = new THREE.CanvasTexture(canvas);
    (pocket.material as THREE.MeshStandardMaterial).map = pocketTex;

    // 3. Letter inside
    this.letter = new THREE.Group();
    const letterGeom = new THREE.PlaneGeometry(envW * 0.9, envH * 0.9);
    
    const letterCanvas = document.createElement('canvas');
    letterCanvas.width = 1024;
    letterCanvas.height = 1024;
    const letterCtx = letterCanvas.getContext('2d');
    if (letterCtx) {
        letterCtx.fillStyle = '#fffdf0'; // Paper color
        letterCtx.fillRect(0, 0, 1024, 1024);
        
        // Add a subtle border to the letter
        letterCtx.strokeStyle = '#e0dec0';
        letterCtx.lineWidth = 20;
        letterCtx.strokeRect(10, 10, 1004, 1004);

        letterCtx.fillStyle = '#2e2828';
        letterCtx.font = '54px "Pinyon Script"';
        letterCtx.textAlign = 'center';
        letterCtx.fillText('My dear sweetheart,', 512, 180);
        
        letterCtx.font = '38px Arial';
        const lines = [
            'You are my most beloved and endeared person',
            'Theres something that ive been wanting to',
            "get off my chest for a while now. Eversince",
            "the day we've met, I've already knew that",
            "I wanted to accompany you for life",
            "And with each day passing by, I've only been",
            "Proven more and more right. My love I am",
            "devoted and sincere when I say not a single day",
            "is wasted when spend with you."
        ];
        
        lines.forEach((line, i) => {
            letterCtx.fillText(line, 512, 320 + i * 70);
        });

        letterCtx.font = '48px "Pinyon Script"';
        letterCtx.fillText('Your Love Tùng', 512, 1000);
    }
    const letterTex = new THREE.CanvasTexture(letterCanvas);
    const letterMat = new THREE.MeshBasicMaterial({ map: letterTex });
    const letterMesh = new THREE.Mesh(letterGeom, letterMat);
    this.letter.add(letterMesh);
    this.letter.position.z = pocketDepth / 2;
    this.add(this.letter);

    // 4. Lid
    this.lidPivot = new THREE.Group();
    this.lidPivot.position.y = envH / 2;
    this.lidPivot.position.z = pocketDepth;
    this.add(this.lidPivot);

    const lidShape = new THREE.Shape();
    lidShape.moveTo(-envW / 2, 0);
    lidShape.lineTo(envW / 2, 0);
    lidShape.lineTo(0, envH * 0.7);
    lidShape.lineTo(-envW / 2, 0);

    const lidGeom = new THREE.ShapeGeometry(lidShape);
    const lidMat = new THREE.MeshStandardMaterial({ color: lidColor, side: THREE.DoubleSide });
    const lid = new THREE.Mesh(lidGeom, lidMat);
    
    // Add gold seal to lid
    const sealGeom = new THREE.CircleGeometry(0.1, 32);
    const sealMat = new THREE.MeshStandardMaterial({ color: accentColor, metalness: 0.7, roughness: 0.3 });
    const seal = new THREE.Mesh(sealGeom, sealMat);
    seal.position.set(0, envH * 0.35, 0.005);
    lid.add(seal);

    this.lidPivot.add(lid);
    this.lidPivot.rotation.x = Math.PI * 0.99; 
  }

  public toggle() {
    if (this.isAnimating) return;
    this.isOpen = !this.isOpen;
    this.isAnimating = true;

    const timeline = gsap.timeline({
        onComplete: () => { this.isAnimating = false; }
    });

    if (this.isOpen) {
        timeline.to(this.lidPivot.rotation, { x: 0, duration: 0.6, ease: "power2.out" });
        timeline.to(this.letter.position, { y: 1.2, z: 0.05, duration: 0.8, ease: "back.out(1.2)" });
    } else {
        timeline.to(this.letter.position, { y: 0, z: 0.01, duration: 0.6, ease: "power2.inOut" });
        timeline.to(this.lidPivot.rotation, { x: Math.PI * 0.99, duration: 0.5, ease: "power2.inOut" });
    }
  }

  public getOpenedState() { return this.isOpen; }
}

export class GiftCard extends THREE.Group {
  private isOpen: boolean = false;
  private coverPivot: THREE.Group;
  private cover: THREE.Mesh;
  private base: THREE.Mesh;
  public envelope: LetterEnvelope;
  private cardWidth: number = 3.5;
  private cardHeight: number = 4.5;
  private photoScale: number = 0.7; // Scale the photo here
  
  // --- RIBBON DECORATION ADJUSTMENT VARIABLES ---
  // private ribbonScale: number = 0.5;
  // private ribbonX: number = 0;
  // private ribbonY: number = -1.5;
  // private ribbonZ: number = 0.035; 
  // private ribbonFlipX: boolean = false;
  // private ribbonFlipY: boolean = false;
  
  // --- FLOWER COVER ADJUSTMENT VARIABLES ---
  private flowerCoverScale: number = 0.7;
  private flowerCoverX: number = -this.cardWidth/3.1;
  private flowerCoverY: number = 0;
  private flowerCoverZ: number = 0.03; 
  private flowerCoverFlipX: boolean = true;
  private flowerCoverFlipY: boolean = false;
  
  // --- FLOWER DECORATION 1 ADJUSTMENT VARIABLES ---
  private flowerDec1Scale: number = 0.6;
  private flowerDec1X: number = 0.8;
  private flowerDec1Y: number = -1.2;
  private flowerCover1Z: number = 0.031; 
  private flowerDec1FlipX: boolean = false;
  private flowerDec1FlipY: boolean = false;
  // -----------------------------------------

  public onToggle?: (isOpen: boolean) => void;

  constructor() {
    super();

    const width = this.cardWidth;
    const height = this.cardHeight;
    const thickness = 0.05;
    const radius = 0.1;
    const segments = 5;

    const geometry = new RoundedBoxGeometry(width, height, thickness, segments, radius);

    // Front Cover Materials (Pink Exterior and Interior)
    const coverMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xFFB6C1 }), // Side
      new THREE.MeshStandardMaterial({ color: 0xFFB6C1 }), // Side
      new THREE.MeshStandardMaterial({ color: 0xFFB6C1 }), // Side
      new THREE.MeshStandardMaterial({ color: 0xFFB6C1 }), // Side
      new THREE.MeshStandardMaterial({ color: 0xFFB6C1 }), // Front (Exterior)
      new THREE.MeshStandardMaterial({ color: 0xFFB6C1 }), // Back (Interior - Pink)
    ];

    // Base Materials (Pink Exterior and Interior)
    const baseMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xFFB6C1 }), // Side
      new THREE.MeshStandardMaterial({ color: 0xFFB6C1 }), // Side
      new THREE.MeshStandardMaterial({ color: 0xFFB6C1 }), // Side
      new THREE.MeshStandardMaterial({ color: 0xFFB6C1 }), // Side
      new THREE.MeshStandardMaterial({ color: 0xFFB6C1 }), // Front (Interior - Pink)
      new THREE.MeshStandardMaterial({ color: 0xFFB6C1 }), // Back (Exterior)
    ];

    // 1. Setup the Base
    this.base = new THREE.Mesh(geometry, baseMaterials);
    this.base.position.set(width / 2, 0, -thickness / 2);
    this.base.castShadow = true;
    this.base.receiveShadow = true;
    this.add(this.base);

    // 2. Setup the Cover Pivot (The Hinge)
    this.coverPivot = new THREE.Group();
    this.coverPivot.position.set(0, 0, thickness / 2);
    this.add(this.coverPivot);

    // 3. Setup the Cover
    this.cover = new THREE.Mesh(geometry, coverMaterials);
    this.cover.position.set(width / 2, 0, 0);
    this.cover.castShadow = true;
    this.cover.receiveShadow = true;
    this.coverPivot.add(this.cover);

    // Add content inside
    this.addInsideContent(width, height);
    // Add content to the front
    this.addFrontContent(width, height);
    // Add content to the inside of the cover
    this.addInsideCoverContent(width, height);

    // Initial centering
    this.position.x = -width / 2;
  }

  private addInsideCoverContent(width: number, height: number) {
    const padding = 0.1; 
    const contentWidth = width * (1 - padding);
    const contentHeight = height * (1 - padding);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background
      ctx.fillStyle = '#FDF5E6'; 
      ctx.fillRect(0, 0, 512, 512);

      // Gold Frame Decoration
      const gold = '#D4AF37';
      this.drawCorner(ctx, 40, 40, 0, gold);
      this.drawCorner(ctx, 472, 40, Math.PI/2, gold);
      this.drawCorner(ctx, 472, 472, Math.PI, gold);
      this.drawCorner(ctx, 40, 472, -Math.PI/2, gold);
      this.drawWavyLine(ctx, 90, 40, 422, 40, gold);
      this.drawWavyLine(ctx, 472, 90, 472, 422, gold);
      this.drawWavyLine(ctx, 422, 472, 90, 472, gold);
      this.drawWavyLine(ctx, 40, 422, 40, 90, gold);

      ctx.fillStyle = '#D44B66'; 
      ctx.font = '50px "Pinyon Script"';
      ctx.textAlign = 'center';
      ctx.fillText('To my favourite person', 256, 180);
      ctx.font = '32px "Pinyon Script"';
      ctx.fillText('Tri ân người lái đò', 256, 280);
      ctx.fillText('tận tụy và tâm huyết', 256, 330);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const planeGeom = new THREE.PlaneGeometry(contentWidth, contentHeight);
    const planeMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.FrontSide });
    const insideCoverDecor = new THREE.Mesh(planeGeom, planeMat);
    insideCoverDecor.position.z = -0.026; 
    insideCoverDecor.rotation.y = Math.PI;
    this.cover.add(insideCoverDecor);

    // --- ADD INTERACTIVE ENVELOPE ---
    this.envelope = new LetterEnvelope();
    this.envelope.position.set(0, -height * 0.1, -0.03); // Position relative to cover interior
    this.envelope.rotation.y = Math.PI; // Face the interior
    this.envelope.scale.set(0.8, 0.8, 0.8);
    this.cover.add(this.envelope);
  }

  private drawCorner(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, color: string = '#D44B66') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.bezierCurveTo(0, 20, 20, 0, 50, 0);
    ctx.stroke();
    ctx.restore();
  }

  private drawWavyLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
    const amplitude = 5;
    const frequency = 0.1;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i <= distance; i++) {
        ctx.lineTo(i, Math.sin(i * frequency) * amplitude);
    }
    ctx.stroke();
    ctx.restore();
  }

  private addFrontContent(width: number, height: number) {
    const padding = 0.1; 
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFB6C1'; 
      ctx.fillRect(0, 0, 512, 512);
      

      const c = '#FFFFFF';
      
      // Corners
      this.drawCorner(ctx, 55, 55, 0, c);
      this.drawCorner(ctx, 457, 55, Math.PI/2, c);
      this.drawCorner(ctx, 457, 457, Math.PI, c);
      this.drawCorner(ctx, 55, 457, -Math.PI/2, c);

      // Connecting Wavy Lines
      this.drawWavyLine(ctx, 105, 55, 407, 55, c);   // Top
      this.drawWavyLine(ctx, 457, 105, 457, 407, c); // Right
      this.drawWavyLine(ctx, 407, 457, 105, 457, c); // Bottom
      this.drawWavyLine(ctx, 55, 407, 55, 105, c);   // Left

      ctx.fillStyle = '#000000';
      ctx.font = 'Italic 40px "Playfair Display"';
      ctx.textAlign = 'center';
      ctx.fillText('Happy 8/3', 256, 206);
      ctx.font = '36px "Pinyon Script"';
      ctx.fillText("International Women's Day", 256, 250);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const planeGeom = new THREE.PlaneGeometry(width * (1 - padding), height * (1 - padding));
    const planeMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.FrontSide });
    const frontDecor = new THREE.Mesh(planeGeom, planeMat);
    frontDecor.position.z = 0.026; 
    frontDecor.renderOrder = 1; // Base layer
    this.cover.add(frontDecor);

    // --- ADD FLOWER COVER OVERLAY ---
    const loader = new THREE.TextureLoader();
    loader.load('/flower-cover.png', (flowerTexture) => {
        const aspect = flowerTexture.image.width / flowerTexture.image.height;
        const fWidth = width * this.flowerCoverScale;
        const fHeight = fWidth / aspect;
        
        const fGeom = new THREE.PlaneGeometry(fWidth, fHeight);
        const fMat = new THREE.MeshBasicMaterial({ 
            map: flowerTexture, 
            transparent: true,
            side: THREE.DoubleSide, // Ensure it's visible even when flipped
            depthWrite: false 
        });
        const flowerOverlay = new THREE.Mesh(fGeom, fMat);
        flowerOverlay.position.set(this.flowerCoverX, this.flowerCoverY, this.flowerCoverZ);
        flowerOverlay.scale.x = this.flowerCoverFlipX ? -1 : 1;
        flowerOverlay.scale.y = this.flowerCoverFlipY ? -1 : 1;
        flowerOverlay.renderOrder = 2; // Always render on top of frontDecor
        this.cover.add(flowerOverlay);
    });

    // --- ADD FLOWER DECORATION 1 OVERLAY ---
    loader.load('/flower-dec-1.png', (dec1Texture) => {
        const aspect = dec1Texture.image.width / dec1Texture.image.height;
        const fWidth = width * this.flowerDec1Scale;
        const fHeight = fWidth / aspect;
        
        const fGeom = new THREE.PlaneGeometry(fWidth, fHeight);
        const fMat = new THREE.MeshBasicMaterial({ 
            map: dec1Texture, 
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false 
        });
        const dec1Overlay = new THREE.Mesh(fGeom, fMat);
        dec1Overlay.position.set(this.flowerDec1X, this.flowerDec1Y, this.flowerCover1Z);
        dec1Overlay.scale.x = this.flowerDec1FlipX ? -1 : 1;
        dec1Overlay.scale.y = this.flowerDec1FlipY ? -1 : 1;
        dec1Overlay.renderOrder = 3; // Render on top of flower-cover
        this.cover.add(dec1Overlay);
    });
  }

  private addInsideContent(width: number, height: number) {
    const padding = 0.1;
    const contentWidth = width * (1 - padding);
    const contentHeight = height * (1 - padding);

    // --- CREATE DECORATIVE BACKGROUND FOR BASE ---
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // 1. Background Cream Color
      ctx.fillStyle = '#FDF5E6'; 
      ctx.fillRect(0, 0, 512, 512);

      // Gold Frame Decoration
      const gold = '#D4AF37';
      this.drawCorner(ctx, 40, 40, 0, gold);
      this.drawCorner(ctx, 472, 40, Math.PI/2, gold);
      this.drawCorner(ctx, 472, 472, Math.PI, gold);
      this.drawCorner(ctx, 40, 472, -Math.PI/2, gold);
      this.drawWavyLine(ctx, 90, 40, 422, 40, gold);
      this.drawWavyLine(ctx, 472, 90, 472, 422, gold);
      this.drawWavyLine(ctx, 422, 472, 90, 472, gold);
      this.drawWavyLine(ctx, 40, 422, 40, 90, gold);
    }
    
    const bgTexture = new THREE.CanvasTexture(canvas);
    const bgGeom = new THREE.PlaneGeometry(contentWidth, contentHeight);
    const bgMat = new THREE.MeshBasicMaterial({ map: bgTexture });
    const bgMesh = new THREE.Mesh(bgGeom, bgMat);
    bgMesh.position.z = 0.028; 
    this.base.add(bgMesh);

    const loader = new THREE.TextureLoader();
    loader.load('/photo.png', (texture) => {
      const aspect = texture.image.width / texture.image.height;
      const photoWidth = width * this.photoScale;
      const photoHeight = photoWidth / aspect;

      const planeGeom = new THREE.PlaneGeometry(photoWidth, photoHeight);
      const planeMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, alphaTest: 0.05 });
      const photo = new THREE.Mesh(planeGeom, planeMat);
      photo.position.set(0, 0, 0.03); // Centered
      photo.renderOrder = 4;
      this.base.add(photo);
    }, undefined, () => {
      this.renderTextFallback(width, height);
    });

    // // --- ADD RIBBON OVERLAY ---
    // loader.load('/ribbon-dec-1.png', (ribbonTexture) => {
    //     const aspect = ribbonTexture.image.width / ribbonTexture.image.height;
    //     const rWidth = width * this.ribbonScale;
    //     const rHeight = rWidth / aspect;

    //     const rGeom = new THREE.PlaneGeometry(rWidth, rHeight);
    //     const rMat = new THREE.MeshBasicMaterial({ 
    //         map: ribbonTexture, 
    //         transparent: true,
    //         side: THREE.DoubleSide,
    //         depthWrite: false 
    //     });
    //     const ribbonOverlay = new THREE.Mesh(rGeom, rMat);
    //     ribbonOverlay.position.set(this.ribbonX, this.ribbonY, this.ribbonZ);
    //     ribbonOverlay.scale.x = this.ribbonFlipX ? -1 : 1;
    //     ribbonOverlay.scale.y = this.ribbonFlipY ? -1 : 1;
    //     ribbonOverlay.renderOrder = 5; // Highest render order to overlay everything on base
    //     this.base.add(ribbonOverlay);
    // });
    }

  private renderTextFallback(width: number, height: number) {
    const padding = 0.1; 
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    // if (ctx) {
    //   ctx.fillStyle = '#FDF5E6'; 
    //   ctx.fillRect(0, 0, 512, 512);
    //   ctx.fillStyle = '#D44B66';
    //   ctx.font = '48px "Pinyon Script"';
    //   ctx.textAlign = 'center';
    //   ctx.fillText('Chúc Cô Huệ luôn rạng rỡ', 256, 180);
    //   ctx.fillText('như những đóa hoa!', 256, 230);
    //   ctx.font = '32px "Pinyon Script"';
    //   ctx.fillStyle = '#000000';
    //   ctx.fillText('Hạnh phúc - Sức khỏe - Thành công', 256, 320);
    // }
    const texture = new THREE.CanvasTexture(canvas);
    const planeGeom = new THREE.PlaneGeometry(width * (1 - padding), height * (1 - padding));
    const planeMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
    const content = new THREE.Mesh(planeGeom, planeMat);
    content.position.z = 0.03;
    this.base.add(content);
  }

  public toggle() {
    this.isOpen = !this.isOpen;
    
    // Notify at the start of animation
    if (this.onToggle) this.onToggle(this.isOpen);

    // Animate Hinge Rotation
    gsap.to(this.coverPivot.rotation, {
      y: this.isOpen ? -Math.PI * 0.85 : 0,
      duration: 1.5,
      ease: "power3.inOut"
    });

    // CENTER THE CARD: Animate World Position X
    const targetX = this.isOpen ? 0 : -this.cardWidth / 2;
    gsap.to(this.position, {
      x: targetX,
      duration: 1.5,
      ease: "power3.inOut"
    });
  }
}
