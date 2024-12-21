import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const styles = {
  container: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to right, #1a1a1a, #2d2d2d)'
  },
  buttonContainer: {
    position: 'fixed',
    bottom: '1rem',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem'
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: 'none',
    borderRadius: '9999px',
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
    transition: 'background-color 0.2s'
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};

const CardFlipViewer = () => {
  const mountRef = useRef(null);
  const cardsRef = useRef([]);
  const [isFlipping, setIsFlipping] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.OrthographicCamera(
      -2 * aspect, 2 * aspect,
      2.5, -2,
      0.1, 1000
    );
    camera.position.set(0, 0, -20);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create rounded rectangle shape
    const roundedRectShape = new THREE.Shape();
    const width = 3;
    const height = 4;
    const radius = 0.2;

    roundedRectShape.moveTo(-width/2 + radius, -height/2);
    roundedRectShape.lineTo(width/2 - radius, -height/2);
    roundedRectShape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + radius);
    roundedRectShape.lineTo(width/2, height/2 - radius);
    roundedRectShape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
    roundedRectShape.lineTo(-width/2 + radius, height/2);
    roundedRectShape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - radius);
    roundedRectShape.lineTo(-width/2, -height/2 + radius);
    roundedRectShape.quadraticCurveTo(-width/2, -height/2, -width/2 + radius, -height/2);

    const extrudeSettings = {
      steps: 1,
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3
    };

    // Create cards from top to bottom
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'];
    const cards = [];
    
    for (let i = 0; i < colors.length; i++) {  
      const geometry = new THREE.ExtrudeGeometry(roundedRectShape, extrudeSettings);
      geometry.translate(1.5, 0, 0);
      
      const material = new THREE.MeshStandardMaterial({
        color: colors[i],
        roughness: 0.4,
        metalness: 0.1
      });
      
      const card = new THREE.Mesh(geometry, material);
      card.position.set(0, 0, (colors.length - 1 - i) * 0.1);  // Reverse the stacking order
      card.rotation.y = 0;
      
      cards.unshift(card);  // Add to front of array
      scene.add(card);
    }
    
    cardsRef.current = cards;
    console.log('Total cards created:', cards.length);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const aspect = window.innerWidth / window.innerHeight;
      camera.left = -5 * aspect;
      camera.right = 5 * aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  const handleNextClick = () => {
    if (isFlipping || currentPage >= cardsRef.current.length) {
      console.log('Cannot flip: isFlipping=', isFlipping, 'currentPage=', currentPage);
      return;
    }
    
    console.log('Flipping card at index:', currentPage);
    setIsFlipping(true);
    const card = cardsRef.current[currentPage];
    
    gsap.to(card.rotation, {
      y: Math.PI,
      duration: 1,
      onComplete: () => {
        console.log('Flip complete, new rotation:', card.rotation.y);
        setIsFlipping(false);
        setCurrentPage(prev => prev + 1);
      }
    });
  };

  const handlePrevClick = () => {
    console.log('Prev clicked, currentPage:', currentPage);
    
    if (isFlipping || currentPage <= 0) {
      console.log('Cannot flip back: isFlipping=', isFlipping, 'currentPage=', currentPage);
      return;
    }

    console.log('Flipping back card at index:', currentPage - 1);
    setIsFlipping(true);
    const card = cardsRef.current[currentPage - 1];
    
    gsap.to(card.rotation, {
      y: 0,
      duration: 1,
      onComplete: () => {
        console.log('Flip back complete, new rotation:', card.rotation.y);
        setIsFlipping(false);
        setCurrentPage(prev => prev - 1);
      }
    });
  };

  return (
    <div style={styles.container}>
      <div style={{ 
        position: 'fixed', 
        top: '1rem', 
        left: '1rem', 
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '1rem',
        borderRadius: '0.5rem',
        fontFamily: 'monospace'
      }}>
        <div>Current Page: {currentPage}</div>
        <div>Is Flipping: {isFlipping.toString()}</div>
        <div>Total Cards: {cardsRef.current.length}</div>
        <div>Card Rotations: {cardsRef.current.map((card, i) => (
          <div key={i}>Card {i}: {card.rotation.y.toFixed(2)}</div>
        ))}</div>
      </div>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div style={styles.buttonContainer}>
        <button
          style={{
            ...styles.button,
            ...(isFlipping || currentPage === 0 ? styles.buttonDisabled : {})
          }}
          onClick={handlePrevClick}
          disabled={isFlipping || currentPage === 0}
        >
          Previous
        </button>
        <button
          style={{
            ...styles.button,
            ...(isFlipping || currentPage === cardsRef.current.length - 1 ? styles.buttonDisabled : {})
          }}
          onClick={handleNextClick}
          disabled={isFlipping || currentPage === cardsRef.current.length - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CardFlipViewer;