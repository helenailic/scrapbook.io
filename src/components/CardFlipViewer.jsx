import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

// Constants
const COLORS = ['#9e4d14', '#9e4d14', '#faede4', '#faede4', '#faede4', '#9e4d14'];
const CARD_DIMENSIONS = { width: 3.2, height: 3.9, radius: 0.2 };

const styles = {
  container: {
    width: '100%',
    height: '100%',
    background: 'pink',
    display: 'flex'
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

const createRoundedRectShape = ({ width, height, radius }) => {
  const shape = new THREE.Shape();
  
  // Start from left edge (rounded), with straight spine on right
  shape.moveTo(0, -height/2 + radius);  // Start from left side
  shape.quadraticCurveTo(0, -height/2, radius, -height/2);  // Round bottom-left
  shape.lineTo(width, -height/2);  // Straight line to bottom-right (spine)
  shape.lineTo(width, height/2);  // Straight line up right side (spine)
  shape.lineTo(radius, height/2);  // Line to top-left
  shape.quadraticCurveTo(0, height/2, 0, height/2 - radius);  // Round top-left
  shape.lineTo(0, -height/2 + radius);  // Line back to start
  
  return shape;
};

const BookViewer = () => {
  const mountRef = useRef(null);
  const cardsRef = useRef([]);
  const [isFlipping, setIsFlipping] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = setupCamera();
    const renderer = setupRenderer();
    mountRef.current.appendChild(renderer.domElement);

    setupLighting(scene);
    setupCards(scene);

    // Force material updates to ensure the initial colors are applied correctly
    cardsRef.current.forEach((pageGroup) => {
      const cardMesh = pageGroup.children[0]; // Access the card mesh
      cardMesh.material.needsUpdate = true;  // Force update of the material
    });
  
    // Render the scene once to ensure all initial states are applied
    renderer.render(scene, camera);
    
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

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

  const setupCamera = () => {
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.OrthographicCamera(-2 * aspect, 2 * aspect, 2.5, -2, 0.1, 1000);
    camera.position.set(0, 0, -10);
    camera.lookAt(0, 0, 0);
    return camera;
  };

  const setupRenderer = () => {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
    return renderer;
  };

  const setupLighting = (scene) => {
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, -50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
  };

  const setupCards = (scene) => {
    const shape = createRoundedRectShape(CARD_DIMENSIONS);
    const extrudeSettings = {
      steps: 1,
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3
    };

    cardsRef.current = COLORS.map((color, i) => {
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      
      const pageGroup = new THREE.Group();

      const material = new THREE.MeshStandardMaterial({
        color: i === 0 || i === COLORS.length-1 ? '#9e4d14' : '#faf7f3',
        roughness: 0,
        metalness: 0,
        side: THREE.DoubleSide
      });
      
      const card = new THREE.Mesh(geometry, material);
      
      // Position the card and rotate it to face the camera
      card.position.set(-CARD_DIMENSIONS.width, 0, 0);
      card.rotation.x = Math.PI; // Rotate 180 degrees to face camera
      pageGroup.add(card);
      
      // Position the page group with spine at center (x=0)
      pageGroup.position.set(-1, 0, 0.1 * i);
      
      pageGroup.userData = { 
        index: i,
        isFlipped: false
      };
      
      scene.add(pageGroup);
      return pageGroup;
    });
  };

  const flipPage = (isNext) => {
    if (isFlipping || 
        (isNext && currentPage >= cardsRef.current.length - 1) || 
        (!isNext && currentPage <= 0)) {
      return;
    }

    setIsFlipping(true);
    const pageGroup = cardsRef.current[isNext ? currentPage : currentPage - 1];

    gsap.to(pageGroup.rotation, {
      y: isNext ? -Math.PI : 0,
      duration: 0.8,
      ease: "power1.inOut",
      onComplete: () => {
        pageGroup.userData.isFlipped = isNext;
    
        // Ensure color remains correct after flipping
        const cardMesh = pageGroup.children[0];
        const isEdgePage = pageGroup.userData.index === 0 || pageGroup.userData.index === cardsRef.current.length - 1;
        //cardMesh.material.color.set(isEdgePage ? '#9e4d14' : '#FDEAD2');
    
        gsap.to(pageGroup.position, {
          z: isNext ? 
            0.1 * (cardsRef.current.length + 1) : 
            0.1 * pageGroup.userData.index,
          duration: 0.1,
          onComplete: () => {
            setCurrentPage(prev => isNext ? prev + 1 : prev - 1);
            setIsFlipping(false);
          }
        });
      }
    });
  };

  return (
    <div style={styles.container}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div style={styles.buttonContainer}>
        <button
          style={{
            ...styles.button,
            ...(isFlipping || currentPage === 0 ? styles.buttonDisabled : {})
          }}
          onClick={() => flipPage(false)}
          disabled={isFlipping || currentPage === 0}
        >
          Previous
        </button>
        <button
          style={{
            ...styles.button,
            ...(isFlipping || currentPage === cardsRef.current.length - 1 ? styles.buttonDisabled : {})
          }}
          onClick={() => flipPage(true)}
          disabled={isFlipping || currentPage === cardsRef.current.length - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default BookViewer;