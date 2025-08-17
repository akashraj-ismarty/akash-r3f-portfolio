import { useGLTF, useAnimations, OrbitControls, Html } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { useFrame, useThree } from '@react-three/fiber'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useSpring, animated } from '@react-spring/three'
import * as THREE from 'three'

const journeyPoints = [
  {
    position: [0, 0.1, 0],
    title: "Akash's Journey Begins",
    text: "Welcome! I'm Akash, a developer passionate about creating immersive worlds. This is my journey from code to artistry. Click on the milestones to explore.",
    // The animation to play when this station is active.
    animation: 'akash - idle',
  },
  {
    position: [-5, 0.1, -2],
    title: 'The Foundation: Education & Passion',
    text: 'With a degree in Computer Science and 4+ years of hands-on experience, I built a strong foundation in software engineering, always driven by a curiosity for interactive 3D graphics.',
    animation: 'akash - idle', // You can change this to another animation
  },
  {
    position: [2, 0.1, -6],
    title: 'The Unity Craftsman (Experiences)',
    text: 'As a Senior Unity Developer, I specialized in crafting digital twins and training simulators. My focus was on performance, realism, and creating systems that felt alive through physics and game mechanics.',
    animation: 'akash - idle - vision pro',
  },
  {
    position: [-2, 0.1, -10],
    title: 'The Web Explorer (Technical Skills)',
    text: 'I expanded my skills into the web with Three.js and React Three Fiber, building browser-based 3D experiences. This is where my love for storytelling through interaction truly began to shine.',
    animation: 'akash-fight-quest',
  },
  {
    position: [6, 0.1, -12],
    title: 'The Creative Technologist',
    text: 'Now, as a Technical Artist, I bridge the gap between creativity and technology. I use shaders, Blender, and XR prototyping to transform abstract ideas into visually rich and emotionally resonant experiences.',
    animation: 'akash - idle', // Or another creative animation
  },
]

/**
 * A more advanced Avatar component that handles animation transitions.
 */
function Avatar({ currentAnimation, onAnimationFinished, ...props }) {
  const group = useRef();
  const { scene, animations } = useGLTF('/akash - idle.glb');
  // useAnimations gives us the mixer and all the animation actions
  const { actions, mixer } = useAnimations(animations, group);

  // This effect handles the logic for playing and transitioning animations
  useEffect(() => {
    const newAction = actions[currentAnimation];
    // Find the action that is currently playing
    const currentAction = Object.values(actions).find(action => action.isRunning());

    if (newAction && newAction !== currentAction) {
      // Fade out the previous action
      if (currentAction) {
        currentAction.fadeOut(0.5);
      }

      // Reset and fade in the new action
      newAction.reset();

      // Handle one-shot animations like 'akash-herodrop'
      if (currentAnimation === 'akash-herodrop') {
        newAction.setLoop(THREE.LoopOnce, 1);
        newAction.clampWhenFinished = true;
      } else {
        newAction.setLoop(THREE.LoopRepeat);
      }

      newAction.fadeIn(0.5).play();
    }
  }, [currentAnimation, actions]);

  // Make sure all parts of the avatar cast shadows
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
  }, [scene]);

  // Listen for when an animation finishes
  useEffect(() => {
    const onFinish = (e) => {
      if (onAnimationFinished && e.action.getClip().name === currentAnimation) {
        onAnimationFinished(currentAnimation);
      }
    };
    mixer.addEventListener('finished', onFinish);
    return () => mixer.removeEventListener('finished', onFinish);
  }, [mixer, onAnimationFinished, currentAnimation]);

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} castShadow />
    </group>
  )
}

function Station({ position, title, text, onClick, active }) {
  const [hovered, setHovered] = useState(false)
  const springProps = useSpring({ scale: hovered ? 1.2 : 1 })

  return (
    <animated.group position={position} scale={springProps.scale}>
      <mesh
        onClick={onClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        castShadow
      >
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color={active ? '#0056b3' : 'white'} metalness={0.2} roughness={0.1} />
      </mesh>
      <Html position={[0, 0.7, 0]} center>
        <div className={`story-ui ${active ? 'visible' : ''}`}>
          <h2>{title}</h2>
          <p>{text}</p>
          <button onClick={(e) => { e.stopPropagation(); onClick(true) }}>Close</button>
        </div>
      </Html>
    </animated.group>
  )
}

function PhysicsCubes() {
  return [...Array(10)].map((_, i) => (
    <RigidBody key={i} colliders="cuboid" position={[(Math.random() - 0.5) * 10, 2 + i * 0.5, (Math.random() - 0.5) * 10]}>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={['#ff6347', '#4682b4', '#3cb371'][i % 3]} />
      </mesh>
    </RigidBody>
  ))
}

function CameraRig({ activeStation, avatarPosition }) {
  const targetPosition = useMemo(() => new THREE.Vector3(), []);
  const lookAtPosition = useMemo(() => new THREE.Vector3(), []);

  // This hook runs on every frame
  useFrame((state, delta) => {
    if (activeStation !== null) {
      const stationPos = journeyPoints[activeStation].position
      targetPosition.set(stationPos[0] + 2, stationPos[1] + 2.5, stationPos[2] + 4)
      lookAtPosition.set(stationPos[0], stationPos[1] + 1, stationPos[2])
    } else {
      targetPosition.set(0, 5, 12)
      // Look at the avatar's initial position
      lookAtPosition.copy(avatarPosition).setY(1);
    }

    // Smoothly move the camera and its target
    state.camera.position.lerp(targetPosition, delta * 1.5);
    state.controls.target.lerp(lookAtPosition, delta * 1.5);
    // You must update the controls after manually changing the camera
    state.controls.update();
  })

  return <OrbitControls makeDefault />
}

export function Experience() {
  const [activeStation, setActiveStation] = useState(0);
  // Start with the hero drop animation
  const [currentAnimation, setCurrentAnimation] = useState('akash-herodrop');

  // Callback for when one-shot animations finish
  const handleAnimationFinished = (animationName) => {
    // After the drop, transition to idle
    if (animationName === 'akash-herodrop') {
      setCurrentAnimation('akash - idle');
    }
  };

  const handleStationClick = (index, isClosing = false) => {
    if (isClosing || activeStation === index) {
      setActiveStation(null);
      // When closing a station, return to idle
      setCurrentAnimation('akash - idle');
    } else {
      setActiveStation(index);
      // Set the animation based on the clicked station's data
      setCurrentAnimation(journeyPoints[index].animation);
    }
  }

  const avatarPosition = useMemo(() => new THREE.Vector3(0, -1.8, 2), []);

  return (
    <>
      <CameraRig activeStation={activeStation} avatarPosition={avatarPosition} />

      <Avatar
        scale={1.8}
        position={avatarPosition}
        currentAnimation={currentAnimation}
        onAnimationFinished={handleAnimationFinished}
      />

      {journeyPoints.map((point, index) => (
        <Station
          key={index}
          position={point.position}
          title={point.title}
          text={point.text}
          onClick={(isClosing) => handleStationClick(index, isClosing)}
          active={activeStation === index}
        />
      ))}

      <PhysicsCubes />

      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position-y={-0.1}>
          <boxGeometry args={[20, 0.2, 20]} />
          <meshStandardMaterial color="#eeeeee" />
        </mesh>
      </RigidBody>
    </>
  )
}

useGLTF.preload('/akash - idle.glb')
