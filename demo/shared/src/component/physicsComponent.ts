import * as THREE from 'three'
import { AmmoModule, Ammo } from '@shared/utils/ammo'
import * as U from '@shared/utils'
import { Component, UComponent, register } from '@shared/basic'

@register()
export class Vector3 extends UComponent {
    constructor(public x = 0, public y = 0, public z = 0) { super(); }
    getTHREE() { return new THREE.Vector3(this.x, this.y, this.z);  }
    getAmmo() { return U.posTA(this.getTHREE()); }
    static byTHREE(vec: THREE.Vector3) { 
        return new Vector3(vec.x, vec.y, vec.z); 
    }
    static byAmmo(vec: AmmoModule.btVector3) { 
        const threeVec = U.posAT(vec);
        return this.byTHREE(threeVec);
    }
    add(vec: Vector3) {
        this.x += vec.x, this.y += vec.y, this.z += vec.z; return this;
    }
    dec(vec: Vector3) {
        this.x -= vec.x, this.y -= vec.y, this.z -= vec.z; return this;
    }
    dot(vec: Vector3) {
        return this.x * vec.x + this.y * vec.y + this.z * vec.z;
    }
    muls(a: number) {
        this.x *= a, this.y *= a, this.z *= a; return this;
    }
    divs(a: number) {
        this.x /= a, this.y /= a, this.z /= a; return this;
    }
    cross(vec: Vector3) {
        const x = this.y * vec.z - this.z * vec.y;
        const y = this.z * vec.x - this.x * vec.z;
        const z = this.x * vec.y - this.y * vec.x;
        return new Vector3(x, y, z);
    }
    norm() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    clone(vec: Vector3) {
        this.x = vec.x, this.y = vec.y, this.z = vec.z; return this;
    }
    copy() {
        return new Vector3(this.x, this.y, this.z);
    }
    equal(t: Vector3) {
        return this.x==t.x&&this.y==t.y&&this.z==t.z;
    }
};
@register()
export class Euler extends UComponent {
    constructor(public x = 0, public y = 0, public z = 0) { super(); }
    getTHREE() {
        return new THREE.Euler(this.x, this.y, this.z); 
    }
    getAmmo() { 
        const quaternion = new THREE.Quaternion().setFromEuler(this.getTHREE());
        return U.quatTA(quaternion); 
    }
    static byTHREE(euler: THREE.Euler) {
        return new Euler(euler.x, euler.y, euler.z);
    }
    static byAmmo(quat: AmmoModule.btQuaternion) {
        const threeQuat = U.quatAT(quat);
        const euler = new THREE.Euler().setFromQuaternion(threeQuat);
        return this.byTHREE(euler);
    }
};
@register()
export class Quaternion extends UComponent {
    constructor(public x = 0, public y = 0, public z = 0, public w = 1) { super(); }
    getTHREE() { 
        return new THREE.Quaternion(this.x, this.y, this.z, this.w); 
    }
    getAmmo() { 
        return U.quatTA(this.getTHREE()); 
    }
    static byTHREE(quat: THREE.Quaternion) {
        return new Quaternion(quat.x, quat.y, quat.z, quat.w);
    }
    static byAmmo(quat: AmmoModule.btQuaternion) {
        const threeQuat = U.quatAT(quat);
        return this.byTHREE(threeQuat);
    }
    equal(t: Quaternion) {
        return this.x==t.x&&this.y==t.y&&this.z==t.z&&this.w==t.w;
    }
    distance(t: Quaternion) {
        return Math.sqrt((this.x - t.x) ** 2 + (this.y - t.y) ** 2 + (this.z - t.z) ** 2 + (this.w - t.w) ** 2);
    }
};

@register()
export class LinearVelocity extends UComponent {
    constructor(public x = 0, public y = 0, public z = 0) { super(); }
    getTHREE() { return new THREE.Vector3(this.x, this.y, this.z);  }
    getAmmo() { return U.posTA(this.getTHREE()); }
};
@register()
export class AngularVelocity extends UComponent {
    constructor(public x = 0, public y = 0, public z = 0) { super(); }
    getTHREE() { 
        return new THREE.Euler(this.x, this.y, this.z); 
    }
    getAmmo() { 
        return new Ammo.btVector3(this.x, this.y, this.z);
    }
};