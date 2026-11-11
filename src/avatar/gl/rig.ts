// His skeleton: MakeHuman's bones, with the standing pose as every bone's rest. Everything he does is the blend towards the text pose plus small living motion on top.
import { Bone, Group, Quaternion, Skeleton, Vector3 } from "three";

const I = new Quaternion();
const tmp = new Quaternion();
const axis = new Vector3();

export type RigData = {
  bones: string[];
  parents: number[];
  heads: number[][];
  text: number[][];
  phone: { R: number[][]; C: number[]; half: number[] };
  phoneText: { R: number[][]; C: number[] };
  thumb: { R: number[]; L: number[] };
  phoneWrist: { standR: number[][]; standP: number[]; textR: number[][]; textP: number[] };
  rest: Record<string, number[]>;
};

export class Rig {
  root = new Group();
  bones: Bone[] = [];
  skeleton!: Skeleton;
  index: Record<string, number> = {};
  private qText: Quaternion[];
  private thumbAxis: { R: Vector3; L: Vector3 };

  constructor(public data: RigData) {
    data.bones.forEach((name, i) => {
      const b = new Bone();
      b.name = name;
      this.index[name] = i;
      this.bones.push(b);
    });
    data.bones.forEach((_, i) => {
      const p = data.parents[i];
      const h = data.heads[i];
      if (p >= 0) {
        const ph = data.heads[p];
        this.bones[i].position.set(h[0] - ph[0], h[1] - ph[1], h[2] - ph[2]);
        this.bones[p].add(this.bones[i]);
      } else {
        this.bones[i].position.set(h[0], h[1], h[2]);
        this.root.add(this.bones[i]);
      }
    });
    this.qText = data.text.map((q) => new Quaternion(q[0], q[1], q[2], q[3]));
    this.thumbAxis = { R: new Vector3(...(data.thumb.R as [number, number, number])), L: new Vector3(...(data.thumb.L as [number, number, number])) };
  }

  bone(name: string) { return this.bones[this.index[name]]; }
  head(name: string) { return this.data.heads[this.index[name]]; }

  /** Call once he is in the scene graph, in the rest pose. */
  finish() {
    this.root.updateMatrixWorld(true);
    this.skeleton = new Skeleton(this.bones);
  }

  /** m: 0 standing, 1 texting. */
  setMix(m: number) {
    for (let i = 0; i < this.bones.length; i++) this.bones[i].quaternion.slerpQuaternions(I, this.qText[i], m);
  }

  /** A small extra turn, on top of what setMix set. */
  add(name: string, x: number, y: number, z: number, deg: number) {
    const b = this.bones[this.index[name]];
    if (!b) return;
    tmp.setFromAxisAngle(axis.set(x, y, z).normalize(), (deg * Math.PI) / 180);
    b.quaternion.multiply(tmp);
  }

  /** A thumb coming down on the screen, 0 to 1. Only meaningful while texting. */
  tap(side: "R" | "L", v: number) {
    const a = this.thumbAxis[side];
    this.add(`finger1-2.${side}`, a.x, a.y, a.z, v * 15);
    this.add(`finger1-3.${side}`, a.x, a.y, a.z, v * 11);
  }
}
