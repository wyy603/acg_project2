import * as THREE from 'three';
import { AmmoModule, Ammo } from '@shared/utils/ammo'
import { Entity } from '@shared/basic';
import { Vector3, Euler, Quaternion } from '@shared/component/physicsComponent'
import { Config } from '@shared/constant'

export function posTA(v: THREE.Vector3) {
    return new Ammo.btVector3(v.x, v.y, -v.z);
}
export function posAT(v: AmmoModule.btVector3) {
    return new THREE.Vector3(v.x(), v.y(), -v.z());
}
export function quatTA(v: THREE.Quaternion) {
    return new Ammo.btQuaternion(-v.x, -v.y, v.z, v.w);
}
export function quatAT(v: AmmoModule.btQuaternion) {
    return new THREE.Quaternion(-v.x(), -v.y(), v.z(), v.w());
}
export function printV(v: AmmoModule.btVector3) {
    console.log(v.x(), v.y(), v.z());
}
export function printQ(v: AmmoModule.btQuaternion) {
    console.log(v.x(), v.y(), v.z(), v.w());
}
export function copyV(v: AmmoModule.btVector3) {
    return new Ammo.btVector3(v.x(), v.y(), v.z());
}
export function fixedV(obj: Vector3 | undefined, precision: number) {
    if (obj instanceof Vector3) {
        return new Vector3(
            parseFloat(obj.x.toFixed(precision)),
            parseFloat(obj.y.toFixed(precision)),
            parseFloat(obj.z.toFixed(precision))
        );
    } else return obj;
}
export function fixedE(obj: Euler | undefined, precision: number) {
    if (obj instanceof Euler) {
        return new Euler(
            parseFloat(obj.x.toFixed(precision)),
            parseFloat(obj.y.toFixed(precision)),
            parseFloat(obj.z.toFixed(precision)),
        );
    } else {
        return obj;
    }
}
export function fixedQ(obj: Quaternion | undefined, precision: number) {
    if (obj instanceof Quaternion) {
        return new Quaternion(
            parseFloat(obj.x.toFixed(precision)),
            parseFloat(obj.y.toFixed(precision)),
            parseFloat(obj.z.toFixed(precision)),
            parseFloat(obj.w.toFixed(precision))
        );
    }
}

export function getRigidBodyConstructionInfo(
    mass: number, 
    colShape: AmmoModule.btCollisionShape,
) {
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    const motionState = new Ammo.btDefaultMotionState( transform );

    const localInertia = new Ammo.btVector3( 0, 1, 0 );
    colShape.calculateLocalInertia( mass, localInertia );

    const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    Ammo.destroy(localInertia);
    return rbInfo;
}
export function getRigidBody(
    mass: number, 
    colShape: AmmoModule.btCollisionShape,
) {
    const rbInfo = getRigidBodyConstructionInfo(mass, colShape);
    const body = new Ammo.btRigidBody( rbInfo );
    return body;
}

export function getMinecraftBlock(v: THREE.Vector3) {
    return `${Math.floor(v.x / Config.block_size)}, ${Math.floor(v.y / Config.block_size)}, ${Math.floor(v.z / Config.block_size)}`;
}
export function strToVec(str: string) {
    const parts = str.split(',').map(part => part.trim());
    return new THREE.Vector3(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
}
export function vecToStr(vec: THREE.Vector3) {
    return `${vec.x}, ${vec.y}, ${vec.z}`
}
export function modifyMinecraftBlock(bid: string, inc: number[]) {
    const parts = bid.split(',').map(part => part.trim());
    return `${parseInt(parts[0]) + inc[0]}, ${parseInt(parts[1]) + inc[1]}, ${parseInt(parts[2]) + inc[2]}`;
}

export function TriangleShapeByMesh(
    obj: THREE.Object3D,
    matrix = new THREE.Matrix4(),
    useQuantizedAabbCompression = true,
): AmmoModule.btCollisionShape {
    obj.updateMatrix();
    matrix.premultiply(obj.matrix);
    if(obj.type == 'Mesh') {
        const geometry = (obj as THREE.Mesh).geometry;
        const positions = geometry.getAttribute('position').array;
        const vertices = new Array<AmmoModule.btVector3>();
        for(let i = 0; i < positions.length; i += 3) {
            const vec = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
            vertices.push(posTA(vec.applyMatrix4(matrix)));
        }
        const indicesAttribute = geometry.index;
        const indices = indicesAttribute == null ? Array.from({ length: vertices.length / 3 }, (_, i) => i) : indicesAttribute.array;
        const triangleMesh = new Ammo.btTriangleMesh();
        for(let i = 0; i < indices.length; i += 3) {
            triangleMesh.addTriangle(vertices[indices[i]], vertices[indices[i + 1]], vertices[indices[i + 2]], true);
        }
        const body = new Ammo.btBvhTriangleMeshShape(triangleMesh, useQuantizedAabbCompression);
        return body;
    } else {
        const body = new Ammo.btCompoundShape();
        for(const child of obj.children) {
            const transform = new Ammo.btTransform();
            transform.setIdentity();
            body.addChildShape(transform, TriangleShapeByMesh(child, matrix.clone(), useQuantizedAabbCompression));
            Ammo.destroy(transform);
        }
        return body;
    }
}
export function BoxShapeByMesh(obj: THREE.Object3D, matrix = new THREE.Matrix4()): AmmoModule.btCollisionShape {
    obj.updateMatrix();
    matrix.premultiply(obj.matrix);
    if(obj.type == 'Mesh') {
        const geometry = (obj as THREE.Mesh).geometry;
        geometry.computeBoundingBox();
        const box = geometry.boundingBox as THREE.Box3;
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        matrix.decompose(position, quaternion, scale);

        const boxAmmo = new Ammo.btBoxShape(new Ammo.btVector3(
            (box.max.x - box.min.x) / 2 * scale.x,
            (box.max.y - box.min.y) / 2 * scale.y,
            (box.max.z - box.min.z) / 2 * scale.z,
        ));
        const transform = new Ammo.btTransform(
            quatTA(quaternion),
            posTA(position)
        )
        const body = new Ammo.btCompoundShape();
        body.addChildShape(transform, boxAmmo);
        Ammo.destroy(transform);
        return body;
    } else {
        const body = new Ammo.btCompoundShape();
        for(const child of obj.children) {
            const transform = new Ammo.btTransform();
            transform.setIdentity();
            body.addChildShape(transform, BoxShapeByMesh(child, matrix.clone()));
            Ammo.destroy(transform);
        }
        return body;
    }
}
export function SphereShapeByMesh(obj: THREE.Object3D, matrix = new THREE.Matrix4()): AmmoModule.btCollisionShape {
    obj.updateMatrix();
    matrix.premultiply(obj.matrix);
    if(obj.type == 'Mesh') {
        const geometry = (obj as THREE.Mesh).geometry;
        geometry.computeBoundingBox();
        const box = geometry.boundingBox as THREE.Box3;
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        matrix.decompose(position, quaternion, scale);

        const boundingSphere = box.getBoundingSphere(new THREE.Sphere());

        const boxAmmo = new Ammo.btSphereShape(boundingSphere.radius * (scale.x + scale.y + scale.z) / 3);
        const transform = new Ammo.btTransform(
            quatTA(quaternion),
            posTA(position)
        )
        const body = new Ammo.btCompoundShape();
        body.addChildShape(transform, boxAmmo);
        Ammo.destroy(transform);
        return body;
    } else {
        const body = new Ammo.btCompoundShape();
        for(const child of obj.children) {
            const transform = new Ammo.btTransform();
            transform.setIdentity();
            body.addChildShape(transform, SphereShapeByMesh(child, matrix.clone()));
            Ammo.destroy(transform);
        }
        return body;
    }
}
export function removeMesh(object3D: THREE.Mesh) {
    // for better memory management and performance
    if (object3D.geometry) object3D.geometry.dispose();

    if (object3D.material) {
        if (object3D.material instanceof Array) {
            // for better memory management and performance
            object3D.material.forEach(material => material.dispose());
        } else {
            // for better memory management and performance
            object3D.material.dispose();
        }
    }
    object3D.removeFromParent(); // the parent might be the scene or another Object3D, but it is sure to be removed this way
    return true;
}
export function setShadow(obj: THREE.Object3D) {
    if(obj.type == 'Mesh') {
        obj.receiveShadow = true;
        obj.castShadow = true;
    } else {
        for (const child of obj.children) {
            setShadow(child);
        }
        obj.receiveShadow = true;
        obj.castShadow = true;
    }
}
export function setMaterial(obj: THREE.Object3D, material: THREE.Material) {
    if(obj.type == 'Mesh') {
        const mesh = obj as THREE.Mesh;
        const color = (mesh.material as any).color;
        mesh.material = material.clone();
        if(color) (mesh.material as any).color = color;
    } else {
        for (const child of obj.children) setMaterial(child, material);
    }
}
export function distanceAmmo(a: AmmoModule.btVector3,b: AmmoModule.btVector3) {
    const x = a.x() - b.x();
    const y = a.y() - b.y();
    const z = a.z() - b.z();
    const distance = Math.sqrt(x*x+y*y+z*z);
    return distance;
}
export function disposeMesh(mesh: THREE.Mesh) {
    mesh.removeFromParent();
    mesh.geometry.dispose();
    if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose());
    } else {
        mesh.material.dispose();
    }
}

/*import os from 'os';

export function getLocalIPAddress(): string {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        const iface = interfaces[interfaceName];
        if (iface) {
            for (const alias of iface) {
                if (alias.family === 'IPv4' && !alias.internal) {
                    return alias.address;
                }
            }
        }
    }
    return 'localhost';
}*/