import * as THREE from 'three';
import { AmmoModule, Ammo } from '@shared/utils/ammo'

export function posThreeToAmmo(v: THREE.Vector3): AmmoModule.btVector3 {
    return new Ammo.btVector3(v.x, v.y, -v.z);
}
export function posAmmoToThree(v: AmmoModule.btVector3) {
    return new THREE.Vector3(v.x(), v.y(), -v.z());
}
export function rotThreeToAmmo(v: THREE.Quaternion) {
    return new Ammo.btQuaternion(-v.x, -v.y, v.z, v.w);
}
export function rotAmmoToThree(v: AmmoModule.btQuaternion) {
    return new THREE.Quaternion(-v.x(), -v.y(), v.z(), v.w());
}
export function printAmmoVector(v: AmmoModule.btVector3) {
    console.log(v.x(), v.y(), v.z());
}
export function printAmmoQuaternion(v: AmmoModule.btQuaternion) {
    console.log(v.x(), v.y(), v.z(), v.w());
}
export function copyV(v: AmmoModule.btVector3) {
    return new Ammo.btVector3(v.x(), v.y(), v.z());
}
export function distanceAmmo(a: AmmoModule.btVector3,b: AmmoModule.btVector3) {
    const x = a.x() - b.x();
    const y = a.y() - b.y();
    const z = a.z() - b.z();
    const distance = Math.sqrt(x*x+y*y+z*z);
    return distance;
}