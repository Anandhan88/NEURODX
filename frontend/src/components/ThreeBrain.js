import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeBrain = ({ tumorClass }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene, camera, renderer
    const scene = new THREE.Scene();
    
    // Set background to transparent
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Clear previous canvas if any
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // Group to hold all brain parts
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);

    // 1. Create Brain Outer Shape (ellipsoid wireframe)
    const brainGeometry = new THREE.SphereGeometry(2, 32, 24);
    // Scale it to look more like a brain (longer in Y/Z, slightly flattened Y)
    brainGeometry.scale(1.2, 0.95, 1.4);

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x059669,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const brainMesh = new THREE.Mesh(brainGeometry, wireframeMaterial);
    brainGroup.add(brainMesh);

    // 2. Create Neural Network Inside (Points & Lines)
    const particleCount = 200;
    const particlesGeo = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    const cyanColor = new THREE.Color(0x10b981);
    const purpleColor = new THREE.Color(0x34d399);

    for (let i = 0; i < particleCount; i++) {
      // Generate random positions inside the ellipsoid brain bounds
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 1.8; // random radius up to 1.8

      const x = r * Math.sin(phi) * Math.cos(theta) * 1.2;
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.95;
      const z = r * Math.cos(phi) * 1.4;

      positions.push(x, y, z);

      // Blend cyan & purple colors
      const mixedColor = cyanColor.clone().lerp(purpleColor, Math.random());
      colors.push(mixedColor.r, mixedColor.g, mixedColor.b);
    }

    particlesGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    particlesGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Points material
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });
    const neuralPoints = new THREE.Points(particlesGeo, particleMaterial);
    brainGroup.add(neuralPoints);

    // Add neural connections (random lines between nearby points)
    const linePositions = [];
    const lineColors = [];
    const pointsArray = [];
    for (let i = 0; i < positions.length; i += 3) {
      pointsArray.push(new THREE.Vector3(positions[i], positions[i+1], positions[i+2]));
    }

    for (let i = 0; i < pointsArray.length; i++) {
      let connections = 0;
      for (let j = i + 1; j < pointsArray.length; j++) {
        const dist = pointsArray[i].distanceTo(pointsArray[j]);
        // Connect points that are close
        if (dist < 0.65 && connections < 2) {
          linePositions.push(pointsArray[i].x, pointsArray[i].y, pointsArray[i].z);
          linePositions.push(pointsArray[j].x, pointsArray[j].y, pointsArray[j].z);
          
          const c1 = new THREE.Color(0x10b981).multiplyScalar(0.25);
          lineColors.push(c1.r, c1.g, c1.b);
          lineColors.push(c1.r, c1.g, c1.b);
          connections++;
        }
      }
    }

    const linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    linesGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      linewidth: 1,
    });
    const neuralLines = new THREE.LineSegments(linesGeo, lineMat);
    brainGroup.add(neuralLines);

    // 3. Highlight Tumor Area if present
    let tumorHighlight = null;
    let tumorPulseDirection = 1;
    
    if (tumorClass && tumorClass !== 'No Tumor') {
      // Designate tumor position based on class
      let tumorPos = new THREE.Vector3(0, 0, 0);
      let highlightColor = 0xef4444; // Red for general tumors

      if (tumorClass === 'Glioma') {
        tumorPos.set(0.7, 0.4, 0.6); // Front-Right-Top lobe
        highlightColor = 0xa78bfa; // Purple
      } else if (tumorClass === 'Meningioma') {
        tumorPos.set(-0.8, -0.3, -0.5); // Back-Left meninges area
        highlightColor = 0xf59e0b; // Amber
      } else if (tumorClass === 'Pituitary') {
        tumorPos.set(0, -0.6, 0.1); // Central bottom (pituitary gland)
        highlightColor = 0x22d3ee; // Cyan
      }

      // Create glowing tumor sphere
      const tumorGeo = new THREE.SphereGeometry(0.3, 16, 16);
      const tumorMat = new THREE.MeshBasicMaterial({
        color: highlightColor,
        transparent: true,
        opacity: 0.8,
      });
      tumorHighlight = new THREE.Mesh(tumorGeo, tumorMat);
      tumorHighlight.position.copy(tumorPos);
      brainGroup.add(tumorHighlight);

      // Add a outer glowing aura ring or sphere
      const auraGeo = new THREE.SphereGeometry(0.5, 16, 16);
      const auraMat = new THREE.MeshBasicMaterial({
        color: highlightColor,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      auraMesh.position.copy(tumorPos);
      brainGroup.add(auraMesh);
      
      // Store reference to animate
      tumorHighlight.userData = { auraMesh };
    }

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Slow rotation
      brainGroup.rotation.y += 0.006;
      brainGroup.rotation.x = Math.sin(brainGroup.rotation.y * 0.5) * 0.15;

      // Pulse tumor if present
      if (tumorHighlight) {
        const scaleSpeed = 0.015;
        tumorHighlight.scale.addScalar(scaleSpeed * tumorPulseDirection);
        
        if (tumorHighlight.scale.x > 1.25) {
          tumorPulseDirection = -1;
        } else if (tumorHighlight.scale.x < 0.85) {
          tumorPulseDirection = 1;
        }

        // Pulse the outer aura
        const aura = tumorHighlight.userData.auraMesh;
        if (aura) {
          aura.scale.copy(tumorHighlight.scale).multiplyScalar(1.4);
          aura.material.opacity = (1.35 - tumorHighlight.scale.x) * 0.45;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (renderer) {
        renderer.dispose();
      }
      // Dispose geometries & materials
      brainGeometry.dispose();
      wireframeMaterial.dispose();
      particlesGeo.dispose();
      particleMaterial.dispose();
      linesGeo.dispose();
      lineMat.dispose();
    };
  }, [tumorClass]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100%', minHeight: '280px' }} 
      />
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        background: 'rgba(5, 8, 14, 0.6)',
        padding: '4px 10px',
        borderRadius: '6px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        pointerEvents: 'none'
      }}>
        Interactive 3D Scan View
      </div>
    </div>
  );
};

export default ThreeBrain;
