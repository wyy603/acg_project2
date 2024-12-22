import * as C from '@shared/component'
import * as THREE from 'three'
import { Entity } from '@shared/component'
import { CATCH_TYPE } from '@shared/constant'

export class Sprite extends C.Component {
    public playerName?: string
    public childrens: THREE.Object3D[] = [];
    public animationCounter: number = 0;
    public animate?: Function;
    constructor(public object3d: THREE.Object3D, public name: string, public playerNameMesh?: THREE.Mesh) { super(); }
    addChildren(obj: THREE.Object3D) {
        this.object3d.add(obj);
        this.childrens.push(obj);
    }
};
export class PlayerCatch extends C.Component {
    constructor(
        public catchType = CATCH_TYPE.NONE,
        public catchEntity?: Entity
    ) { super(); }
};
export * from '@shared/component'