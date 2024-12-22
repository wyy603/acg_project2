import * as THREE from 'three';
import { Ammo, AmmoModule } from '@shared/utils/ammo'
import * as C from '@/component'
import * as E from '@shared/component/event'
import * as myC from '@/component'
import { Entity } from '@shared/basic'
import { EntitySystem } from '@shared/system'
import { AmmoDebugDrawer, DefaultBufferSize } from '@shared/utils/AmmoDebugDrawer'

import { ClientConfig, WebSocketSystem } from '@/system'
import { Water } from 'three/addons/objects/Water.js';
import { Config, CAMERA_PROP, CATCH_TYPE } from '@shared/constant'
import * as U from '@/system/utils'
import { HTMLSystem } from './testgame/HTMLSystem'

export class RenderSystem {
    static scene : THREE.Scene
    static camera : THREE.PerspectiveCamera
    static fakeCamera = new THREE.Object3D()
    static renderer : THREE.WebGLRenderer
    static lights: THREE.Object3D[] = [];
    static water: Water;
    static clock = new THREE.Clock();

    static sceneMax = new THREE.Scene();
    static maxObjects = new Set<THREE.Object3D>();
    static addMaxdepth(obj: THREE.Object3D) {
        this.maxObjects.add(obj);
    }
    static delMaxdepth(obj: THREE.Object3D) {
        this.maxObjects.delete(obj);
    }

    static setRenderer(w: number, h:number) {
        // 
        // this.renderer = new THREE.WebGLRenderer(config)
        this.renderer = new THREE.WebGLRenderer({ antialias: true});
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.shadowMap.enabled = !ClientConfig.noShadow;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    static init(w: number, h: number) {
        this.fakeCamera.name = "test"
        this.camera = new THREE.PerspectiveCamera( CAMERA_PROP.fov, w / h, CAMERA_PROP.near, CAMERA_PROP.far );
        // this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, precision: "lowp", powerPreference: "low-power"});

        // this.renderer = new THREE.WebGLRenderer({ antialias: true});
        this.setRenderer(w, h); 

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xbfd1e5 );

        {
            const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1 );
            this.scene.add( hemiLight );
            this.lights.push( hemiLight );
        }
        {
            const pointLight = new THREE.PointLight(0xffff99, 35, 200);
            pointLight.position.set(105-0.6, 10, 14-0.6);
            this.scene.add(pointLight);
            this.lights.push(pointLight);
            pointLight.castShadow = true;
            pointLight.shadow.camera.far = 400;
            const d = 150;
            pointLight.shadow.mapSize.width = 4096;
            pointLight.shadow.mapSize.height = 4096;
            pointLight.shadow.radius = 10;
            pointLight.shadow.blurSamples = 25;
            pointLight.shadow.bias = -0.001;
        }
    }

    static setAnimationLoop(callback: XRFrameRequestCallback | null) { this.renderer.setAnimationLoop(callback); }
    static getDomElement() { return this.renderer.domElement; }
    static getCamera() { return this.camera; }

    static resize(w: number, h: number) { // Resize
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    static update(entities: Entity[]) {
        if(this.renderer.shadowMap.enabled !== (!ClientConfig.noShadow)) {
            this.renderer.shadowMap.enabled = !ClientConfig.noShadow;
            const updateShadowProperties = (object: THREE.Object3D) => {
                object.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = !ClientConfig.noShadow;
                        child.receiveShadow = !ClientConfig.noShadow;
                    }
                });
            };
            this.scene.traverse(updateShadowProperties);
        }
        const dt = this.clock.getDelta();
        const meshes = new Array<THREE.Object3D>();
        const childrens = this.scene.children;
        const all = U.getChildrens(this.scene);
        for(const entity of entities) {
            const component = entity.get(myC.Sprite);
            if(component) meshes.push(component.object3d);
        }
        const adds = new Array<THREE.Object3D>();
        const dels = new Array<THREE.Object3D>();
        for(const mesh of meshes) {
            let pa = mesh.parent;
            while(pa != this.scene && pa) pa = pa.parent;
            if(!all.includes(mesh) && !mesh.parent) {
                adds.push(mesh);
            }
        }
        for(const children of childrens) {
            if(this.lights.includes(children)) continue;
            if(!meshes.includes(children)) dels.push(children);
        }
        for(const x of adds) {
            this.scene.add(x);
        }
        for(const x of dels) {
            this.scene.remove(x);
        }

        // 动画
        for(const entity of entities) {
            const component = entity.get(myC.Sprite); if(!component) continue;
            const object3d = component.object3d;
            if(component.animate && all.includes(object3d)) component.animate();
            if(object3d.userData.mixer) object3d.userData.mixer.update(dt * object3d.userData.ratio);
        }

        // CATCH_TYPE.HAND 抓取的物体要在最上方
        const otherObjects: THREE.Object3D[] = [];
        const playerCatch = EntitySystem.get(EntitySystem.get(WebSocketSystem.uuid)!.getR(C.PlayerConnectId)!.id)!.get(C.PlayerCatch);
        if(playerCatch && playerCatch.catchType == CATCH_TYPE.HAND) otherObjects.push(playerCatch.catchEntity!.get(C.Sprite)!.object3d);
        
        for(const obj of otherObjects) this.addMaxdepth(obj);

        // 在 this.maxObjects 中的物体会在所有物体的最上方显示
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
        this.renderer.clearDepth();
        const objects = Array.from(this.maxObjects.values()).concat(this.lights);
        const parents: Map<THREE.Object3D, {parent: THREE.Object3D, position: THREE.Vector3, rotation: THREE.Euler, scale: THREE.Vector3}> = new Map();
        for(const obj of objects) if(obj.parent) {
            obj.updateMatrixWorld(true);
            const worldMatrix = obj.matrixWorld.clone();
            parents.set(obj, {parent: obj.parent, position: obj.position.clone(), rotation: obj.rotation.clone(), scale: obj.scale.clone()});
            obj.removeFromParent();
            this.sceneMax.add(obj);
            worldMatrix.decompose(obj.position, obj.quaternion, obj.scale);
        }
        this.renderer.autoClearColor = false;
        this.renderer.render(this.sceneMax, this.camera);
        for(const obj of objects) if(parents.get(obj)) {
            this.sceneMax.remove(obj);
            this.scene.add(obj);
            const {parent, position, rotation, scale} = parents.get(obj)!;
            parent.add(obj);
            obj.position.copy(position), obj.rotation.copy(rotation), obj.scale.copy(scale);
            obj.updateMatrixWorld(true);
        }
        this.renderer.autoClearColor = true;

        for(const obj of otherObjects) this.delMaxdepth(obj);
    }
};