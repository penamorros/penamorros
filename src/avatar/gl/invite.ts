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
  // (The forward lean and chin-in on hover read as a nod downwards and were taken out — the client, 2026-11-18.
  // Under the pointer he now only rises a touch and turns his head to look at it; see main.ts, `follow`.)
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
