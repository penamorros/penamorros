// The jetpack he wears (the client, 2026-11-18): the same pack as in the skills run's render — a backplate, two tanks with
// blue light rings, nozzles — built here so the 3D twin over the portrait wears it too. It hangs on his upper spine, so
// it moves with him; on the small twin it sits a little high, so its tank tops show over his shoulders.
import { CircleGeometry, CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, TorusGeometry, BoxGeometry } from 'three'
import type { Rig } from './rig'

export function addJetpack(rig: Rig, lift = 0, spread = 0.058) {
	const metal = new MeshStandardMaterial({ color: 0x15181f, metalness: 0.85, roughness: 0.3 })
	const trim = new MeshStandardMaterial({ color: 0x2a2f3a, metalness: 0.9, roughness: 0.22 })
	const glow = new MeshBasicMaterial({ color: 0x8cc8ff, toneMapped: false })
	const hot = new MeshBasicMaterial({ color: 0xdff1ff, toneMapped: false })
	const g = new Group()
	const plate = new Mesh(new BoxGeometry(0.14 + spread * 1.1, 0.25, 0.035), metal)
	plate.position.set(0, -0.08, -0.085)
	g.add(plate)
	for (const sx of [-1, 1]) {
		const x = sx * spread
		const tank = new Mesh(new CylinderGeometry(0.046, 0.046, 0.25, 28), metal); tank.position.set(x, -0.08, -0.135); g.add(tank)
		const cap = new Mesh(new SphereGeometry(0.046, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), trim); cap.position.set(x, 0.045, -0.135); g.add(cap)
		for (const y of [0.0, -0.17]) { const ring = new Mesh(new TorusGeometry(0.047, 0.0045, 8, 32), glow); ring.rotation.x = Math.PI / 2; ring.position.set(x, y, -0.135); g.add(ring) }
		const strip = new Mesh(new BoxGeometry(0.008, 0.13, 0.004), glow); strip.position.set(x, -0.085, -0.182); g.add(strip)
		const noz = new Mesh(new CylinderGeometry(0.03, 0.042, 0.05, 24, 1, true), trim); noz.position.set(x, -0.23, -0.135); g.add(noz)
		const core = new Mesh(new CircleGeometry(0.03, 24), hot); core.rotation.x = Math.PI / 2; core.position.set(x, -0.254, -0.135); g.add(core)
	}
	g.position.y = 0.06 + lift
	g.traverse((o) => { o.frustumCulled = false })
	rig.bone('spine01').add(g)
	return g
}
