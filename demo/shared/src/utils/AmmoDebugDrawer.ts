// https://github.com/InfiniteLee/ammo-debug-drawer/

import * as THREE from 'three';
import { AmmoModule, Ammo } from '@shared/utils/ammo'

export const DefaultBufferSize = 3 * 1000000;

export const AmmoDebugConstants = {
  NoDebug: 0,
  DrawWireframe: 1,
  DrawAabb: 2,
  DrawFeaturesText: 4,
  DrawContactPoints: 8,
  NoDeactivation: 16,
  NoHelpText: 32,
  DrawText: 64,
  ProfileTimings: 128,
  EnableSatComparison: 256,
  DisableBulletLCP: 512,
  EnableCCD: 1024,
  DrawConstraints: 1 << 11, //2048
  DrawConstraintLimits: 1 << 12, //4096
  FastWireframe: 1 << 13, //8192
  DrawNormals: 1 << 14, //16384
  MAX_DEBUG_DRAW_MODE: 0xffffffff
};

/**
 * An implementation of the btIDebugDraw interface in Ammo.js, for debug rendering of Ammo shapes
 * @class AmmoDebugDrawer
 * @param {Uint32Array} indexArray
 * @param {Float32Array} verticessArray
 * @param {Float32Array} colorsArray
 * @param {Ammo.btCollisionWorld} world
 * @param {object} [options]
 */

export class AmmoDebugDrawer implements AmmoModule.btIDebugDraw {
    private debugDrawMode: number
    indexArray: Uint32Array | null
    verticesArray: Float32Array
    colorsArray: Float32Array

    geometry : THREE.BufferGeometry
    debugMaterial : THREE.LineBasicMaterial
    debugMesh: THREE.LineSegments

    debugDrawer: AmmoModule.DebugDrawer
    
    world: AmmoModule.btCollisionWorld
    index: number
    enabled: boolean
    warnedOnce = false

    constructor(
        indexArray: Uint32Array | null,
        verticesArray: Float32Array,
        colorsArray: Float32Array,
        world: AmmoModule.btCollisionWorld,
        scene: THREE.Object3D,
        debugDrawMode = AmmoDebugConstants.DrawWireframe,
    ) {
        this.world = world;
        this.indexArray = indexArray;
        this.verticesArray = verticesArray;
        this.colorsArray = colorsArray;

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute("position", new THREE.BufferAttribute(this.verticesArray, 3));
        this.geometry.setAttribute("color", new THREE.BufferAttribute(this.colorsArray, 3));
        this.debugMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        this.debugMesh = new THREE.LineSegments(this.geometry, this.debugMaterial);
        scene.add(this.debugMesh);

        this.debugDrawMode = debugDrawMode;
        this.index = 0;
        if (this.indexArray) {
            Atomics.store(this.indexArray, 0, this.index);
        }
        this.enabled = false;

        this.debugDrawer = new Ammo.DebugDrawer();
        this.debugDrawer.drawLine = this.drawLine.bind(this);
        this.debugDrawer.drawContactPoint = this.drawContactPoint.bind(this);
        this.debugDrawer.reportErrorWarning = this.reportErrorWarning.bind(this);
        this.debugDrawer.draw3dText = this.draw3dText.bind(this);
        this.debugDrawer.setDebugMode = this.setDebugMode.bind(this);
        this.debugDrawer.getDebugMode = this.getDebugMode.bind(this);

        world.setDebugDrawer(this.debugDrawer);
        /*setInterval(() => {
            const mode = (this.debugDrawMode + 1) % 3;
            this.setDebugMode(mode);
        }, 1000);*/
    }
    enable() {
        this.enabled = true;
    }
    disable() {
        this.enabled = false;
    }
    update() {
        if (!this.enabled) {
            return;
        }
        //console.log(`update ${(this.debugDrawMode)}`);
        //console.log(this, this.world.getDebugDrawer());
        if (this.indexArray) {
            if (Atomics.load(this.indexArray, 0) === 0) {
                this.index = 0;
                this.world.debugDrawWorld();
                Atomics.store(this.indexArray, 0, this.index);
            }
        } else {
            this.index = 0;
            //console.log(this.world);
            this.world.debugDrawWorld();
        }
        //console.log(this.index);
    }
    drawLine(from: any, to : any, color : any): void {
        //console.log('drawLine');
        const heap = Ammo.HEAPF32;
        const r = heap[(color + 0) / 4];
        const g = heap[(color + 4) / 4];
        const b = heap[(color + 8) / 4];
        const fromX = heap[(from + 0) / 4];
        const fromY = heap[(from + 4) / 4];
        const fromZ = heap[(from + 8) / 4];
        this.geometry.attributes.position.setXYZ(this.index, fromX, fromY, -fromZ);
        this.geometry.attributes.color.setXYZ(this.index++, r, g, -b);
        const toX = heap[(to + 0) / 4];
        const toY = heap[(to + 4) / 4];
        const toZ = heap[(to + 8) / 4];
        this.geometry.attributes.position.setXYZ(this.index, toX, toY, -toZ);
        this.geometry.attributes.color.setXYZ(this.index++, r, g, -b);
    }
    //TODO: figure out how to make lifeTime work
    drawContactPoint(pointOnB: any, normalOnB: any, distance: number, lifeTime: number, color: any) {
        //console.log('drawContactPoint');
        const heap = Ammo.HEAPF32;
        const r = heap[(color + 0) / 4];
        const g = heap[(color + 4) / 4];
        const b = heap[(color + 8) / 4];
        const x = heap[(pointOnB + 0) / 4];
        const y = heap[(pointOnB + 4) / 4];
        const z = heap[(pointOnB + 8) / 4];
        this.geometry.attributes.position.setXYZ(this.index, x, y, -z);
        this.geometry.attributes.color.setXYZ(this.index++, r, g, -b);
        const dx = heap[(normalOnB + 0) / 4] * distance;
        const dy = heap[(normalOnB + 4) / 4] * distance;
        const dz = heap[(normalOnB + 8) / 4] * distance;
        this.geometry.attributes.position.setXYZ(this.index, x + dx, y + dy, -(z + dz));
        this.geometry.attributes.color.setXYZ(this.index++, r, g, -b);
    }
    reportErrorWarning(warningString: string) {
        console.log(warningString);
        /*if (Ammo.hasOwnProperty("UTF8ToString")) {
            console.warn(Ammo.UTF8ToString(warningString));
        } else if (!this.warnedOnce) {
            this.warnedOnce = true;
            console.warn("Cannot print warningString, please export UTF8ToString from Ammo.js in make.py");
        }*/
    }
    draw3dText(location: AmmoModule.btVector3, textString: string) {
        //TODO
        console.log("TODO: draw3dText");
    }
    setDebugMode(debugMode: number) {
        this.debugDrawMode = debugMode;
    }
    getDebugMode(): number {
        //console.log('getDebugMode');
        return this.debugDrawMode;
    }
}