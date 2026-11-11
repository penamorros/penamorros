// Second-order dynamics (the method from t3ssel8r's "Giving personality to procedural animations", also used by Lusion on ORYZO):
// f = speed in Hz, z = damping (1 = no overshoot), r = how it starts (above 1 anticipates, 0 eases in).
export class Spring {
  private k1: number;
  private k2: number;
  private k3: number;
  private xp: number;
  y: number;
  private yd = 0;

  constructor(f: number, z: number, r: number, x0 = 0) {
    this.k1 = z / (Math.PI * f);
    this.k2 = 1 / (2 * Math.PI * f * (2 * Math.PI * f));
    this.k3 = (r * z) / (2 * Math.PI * f);
    this.xp = x0;
    this.y = x0;
  }

  update(dt: number, x: number) {
    if (dt <= 0) return this.y;
    const xd = (x - this.xp) / dt;
    this.xp = x;
    const k2 = Math.max(this.k2, (dt * dt) / 2 + (dt * this.k1) / 2, dt * this.k1);
    this.y += dt * this.yd;
    this.yd += (dt * (x + this.k3 * xd - this.y - this.k1 * this.yd)) / k2;
    return this.y;
  }

  set(x: number) { this.xp = x; this.y = x; this.yd = 0; }
}
