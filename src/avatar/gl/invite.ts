import type { Stage } from './stage'

const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x))
  return t * t * (3 - 2 * t)
}

/**
 * Head + a little shoulder peek. Hands stay hidden. On hover he leans in —
 * no ducking away — so the face gesture reads clearly.
 */
export function animateInvite(stage: Stage, elapsed: number, duck = 0) {
  const rig = stage.rig
  const rise = smooth(elapsed / 0.65)
  const settle = Math.sin(Math.min(1, Math.max(0, (elapsed - 0.65) / 0.7)) * Math.PI) * 0.004
  rig.root.position.x = 0
  // Hover peeks him a little higher into the circle — toward you, not away.
  rig.root.position.y = -0.12 * (1 - rise) + settle + 0.022 * duck
  rig.root.updateMatrixWorld(true)
  if (duck > 0.01) {
    // Small forward lean (positive X) + chin-in. No yaw twist — that read as a back-swing.
    rig.add('spine03', 1, 0, 0, 3 * duck)
    rig.add('spine04', 1, 0, 0, 2 * duck)
    rig.add('neck01', 1, 0, 0, 4 * duck)
    rig.add('neck03', 1, 0, 0, 2 * duck)
    // (A head tilt and a hop were tried here and read wrong for him — the client, 2026-11-16. Keep it square: up and in.)
  }
}

/** Collar + shoulders on, hands off — soft peek over the portrait. */
export async function configureInvite(stage: Stage) {
  stage.rig.setMix(0)
  stage.rig.root.position.y = -0.12
  stage.body.group.visible = true
  // Shirt, collar, zip stay; hide the hand mesh so the armless stump never shows.
  stage.body.meshes[3].visible = false
  stage.phone.group.visible = false
}
