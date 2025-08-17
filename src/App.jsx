import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense } from 'react'
import { Experience } from './Experience'

function App() {

  return (
    <Canvas shadows camera={{ position: [0, 5, 12], fov: 50 }}>
      <color attach="background" args={['#f0f4f8']} />
      <fog attach="fog" args={['#f0f4f8', 15, 30]} />
      <ambientLight intensity={1.5} />
      <directionalLight
        position={[5, 10, 7]}
        intensity={2.5}
        castShadow
      />
      <Suspense fallback={null}>
        <Physics>
          <Experience />
        </Physics>
      </Suspense>
    </Canvas>
  )
}

export default App
