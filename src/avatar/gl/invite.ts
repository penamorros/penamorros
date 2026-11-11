import { type Material, Mesh, Vector2 } from 'three'
import type { Stage } from './stage'

const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x))
  return t * t * (3 - 2 * t)
}

/** Rise in, duck a little on hover — no hand grips. */
export function animateInvite(stage: Stage, elapsed: number, duck = 0) {
  const rig = stage.rig
  const rise = smooth(elapsed / 0.65)
  const settle = Math.sin(Math.min(1, Math.max(0, (elapsed - 0.65) / 0.7)) * Math.PI) * 0.006
  rig.root.position.x = -duck * 0.04
  rig.root.position.y = -0.30 * (1 - rise) + settle - duck * 0.08
  rig.root.updateMatrixWorld(true)
}

/** Clip him to the portrait disc. */
export async function configureInvite(stage: Stage) {
  stage.rig.setMix(0)
  stage.rig.root.position.y = -0.3
  const resolution = { value: new Vector2() }
  stage.onFrame.push(() => stage.renderer.getDrawingBufferSize(resolution.value))
  stage.figure.traverse((object) => {
    if (!(object instanceof Mesh)) return
    const materials: Material[] = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      if (material.userData.inviteMask) continue
      material.userData.inviteMask = true
      const cacheKey = material.customProgramCacheKey()
      const compile = material.onBeforeCompile.bind(material)
      material.onBeforeCompile = (shader, renderer) => {
        compile(shader, renderer)
        shader.uniforms.inviteResolution = resolution
        shader.fragmentShader = 'uniform vec2 inviteResolution;\n' + shader.fragmentShader
        shader.fragmentShader = shader.fragmentShader.replace(/void main\s*\(\s*\)\s*\{/, `void main() {
          vec2 uvInvite = gl_FragCoord.xy / inviteResolution;
          uvInvite.y = 1.0 - uvInvite.y;
          vec2 portraitPoint = vec2(0.73, -0.12) + uvInvite * vec2(0.32, 0.40);
          float inviteRim = 0.5 - sqrt(max(0.0, 0.25 - pow(portraitPoint.x - 0.5, 2.0)));
          // Fixed rim clip — duck only moves him, it does not eat more of the body.
          if (portraitPoint.y > inviteRim) discard;
        `)
      }
      material.customProgramCacheKey = () => `${cacheKey}:invite-clip`
      material.needsUpdate = true
    }
  })
}
