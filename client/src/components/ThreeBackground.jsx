import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * ThreeBackground – animated Three.js particle field / cricket ball scene
 * for the Login page background.
 * Uses Date.now() for timing to avoid the deprecated THREE.Clock API.
 */
export default function ThreeBackground() {
    const mountRef = useRef(null)

    useEffect(() => {
        const mount = mountRef.current
        if (!mount) return

        let frameId
        let renderer
        let onMouse
        let onResize

        try {
            // Scene setup
            const scene = new THREE.Scene()
            const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000)
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
            renderer.setSize(mount.clientWidth, mount.clientHeight)
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            mount.appendChild(renderer.domElement)
            camera.position.z = 5

            // Particles
            const particleCount = 600
            const positions = new Float32Array(particleCount * 3)
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] = (Math.random() - 0.5) * 20
                positions[i * 3 + 1] = (Math.random() - 0.5) * 20
                positions[i * 3 + 2] = (Math.random() - 0.5) * 20
            }
            const particleGeo = new THREE.BufferGeometry()
            particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
            const particleMat = new THREE.PointsMaterial({
                color: 0x22c55e,
                size: 0.04,
                transparent: true,
                opacity: 0.6,
            })
            const particles = new THREE.Points(particleGeo, particleMat)
            scene.add(particles)

            // Cricket ball
            const ballGeo = new THREE.SphereGeometry(0.8, 32, 32)
            const ballMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, metalness: 0.2, roughness: 0.7 })
            const ball = new THREE.Mesh(ballGeo, ballMat)
            ball.position.set(2, 0.5, -1)
            scene.add(ball)

            const wireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, opacity: 0.06, transparent: true })
            const wireOverlay = new THREE.Mesh(ballGeo.clone(), wireMat)
            ball.add(wireOverlay)

            // Lights
            scene.add(new THREE.AmbientLight(0xffffff, 0.5))
            const dirLight = new THREE.DirectionalLight(0x22c55e, 2)
            dirLight.position.set(5, 5, 5)
            scene.add(dirLight)

            // Mouse parallax
            let mouseX = 0, mouseY = 0
            onMouse = (e) => {
                mouseX = (e.clientX / window.innerWidth - 0.5) * 2
                mouseY = (e.clientY / window.innerHeight - 0.5) * 2
            }
            window.addEventListener('mousemove', onMouse)

            // Resize
            onResize = () => {
                if (!mount) return
                camera.aspect = mount.clientWidth / mount.clientHeight
                camera.updateProjectionMatrix()
                renderer.setSize(mount.clientWidth, mount.clientHeight)
            }
            window.addEventListener('resize', onResize)

            // Animation loop — use Date.now() instead of deprecated THREE.Clock
            const startTime = Date.now()
            const animate = () => {
                frameId = requestAnimationFrame(animate)
                const t = (Date.now() - startTime) / 1000 // seconds elapsed

                particles.rotation.y = t * 0.04
                particles.rotation.x = t * 0.02

                ball.rotation.x += 0.005
                ball.rotation.y += 0.008
                ball.position.y = 0.5 + Math.sin(t * 0.5) * 0.3

                camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05
                camera.position.y += (-mouseY * 0.5 - camera.position.y) * 0.05
                camera.lookAt(scene.position)

                renderer.render(scene, camera)
            }
            animate()
        } catch (err) {
            console.warn('[ThreeBackground] WebGL init failed:', err)
            // Fail silently — the CSS gradient background will still show
        }

        return () => {
            if (frameId) cancelAnimationFrame(frameId)
            if (onMouse) window.removeEventListener('mousemove', onMouse)
            if (onResize) window.removeEventListener('resize', onResize)
            if (renderer) {
                renderer.dispose()
                if (mount && mount.contains(renderer.domElement)) {
                    mount.removeChild(renderer.domElement)
                }
            }
        }
    }, [])

    return (
        <div
            ref={mountRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 0,
                pointerEvents: 'none',
                background: 'radial-gradient(ellipse at center, rgba(6,20,14,0.95) 0%, rgba(6,13,20,1) 100%)',
            }}
        />
    )
}
