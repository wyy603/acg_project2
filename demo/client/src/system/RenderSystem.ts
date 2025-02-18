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

import { getGPUTier } from 'detect-gpu';

let gpuTier: any;
(async () => {
  gpuTier = await getGPUTier();
})();

export class RenderSystem {
    static scene : THREE.Scene
    static camera : THREE.PerspectiveCamera
    static fakeCamera = new THREE.Object3D()
    static renderer : THREE.WebGLRenderer
    static lights: Set<THREE.Object3D> = new Set();
    static water: Water;
    static clock = new THREE.Clock();

	static sceneMax = new THREE.Scene();
	static maxObjects = new Set<THREE.Object3D>();
    static hemiLight: THREE.HemisphereLight;
	static addMaxdepth(obj: THREE.Object3D) {
		this.maxObjects.add(obj);
	}
	static delMaxdepth(obj: THREE.Object3D) {
		this.maxObjects.delete(obj);
	}

	static checkHighPerformance() {
		console.log("gpuTier", gpuTier);
		console.log(gpuTier.fps);
		// return true;
		return (gpuTier.fps >= 120);
		
		// // return true;
		// // Example criteria: check for high memory and modern GPU
		// const memory = navigator.deviceMemory || 4; // Default to 4GB if not available
		// const isModernGPU = navigator.gpu || false; // Check if WebGPU is available
	
		// return memory >= 8 && isModernGPU; // Example condition for high performance
	}
	
	static init(w: number, h: number) {
		this.fakeCamera.name = "test"
		this.camera = new THREE.PerspectiveCamera( CAMERA_PROP.fov, w / h, CAMERA_PROP.near, CAMERA_PROP.far );

        setTimeout(() => {
            const listener = new THREE.AudioListener();
            this.camera.add( listener );

            // 创建一个全局 audio 源
            const sound = new THREE.Audio( listener );

            console.log("music1");

            // 加载一个 sound 并将其设置为 Audio 对象的缓冲区
            const audioLoader = new THREE.AudioLoader();
            audioLoader.load( 'assets/audio/Chrismas-Tune.ogg', function( buffer ) {
                console.log("music");
                sound.setBuffer( buffer );
                sound.setLoop( true );
                sound.setVolume( 0.5 );
                sound.play();
            });
        }, 1000);

		const isHighPerformance = this.checkHighPerformance();
		if (isHighPerformance) {
			console.log("high performance");
			ClientConfig.noShadow = false;
			this.renderer = new THREE.WebGLRenderer({ antialias: true });
		} else
        {
			console.log("low performance");
			ClientConfig.noShadow = true;
			this.renderer = new THREE.WebGLRenderer({antialias: false,alpha: true, precision: "lowp", powerPreference: "low-power" });
		}
		this.renderer.setSize(w, h);
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.shadowMap.enabled = !ClientConfig.noShadow;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( 0xbfd1e5 );
        this.hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
        this.scene.add( this.hemiLight );
        this.lights.add( this.hemiLight );
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
        for(const entity of EntitySystem.getAllR(C.SetTime)) {
            const setTime = entity.getR(C.SetTime)!;
            if(!setTime.updated(this)) {
                if(setTime.str == "day") {
                    this.scene.remove(this.hemiLight), this.lights.delete(this.hemiLight);
                    this.hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1 );
                    this.scene.add( this.hemiLight ), this.lights.add( this.hemiLight );
                    this.scene.background = new THREE.Color(0xbfd1e5);
                } else if(setTime.str == "night") {
                    this.scene.remove(this.hemiLight), this.lights.delete(this.hemiLight);
                    this.hemiLight = new THREE.HemisphereLight(0x000033, 0x000000, 1);
                    this.scene.add( this.hemiLight ), this.lights.add( this.hemiLight );
                    this.scene.background = new THREE.Color(0x000011);
                }
                setTime.mark(this);
            }
        }
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
            if(this.lights.has(children)) continue;
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
        const connectId = EntitySystem.get(WebSocketSystem.uuid)?.getR(C.PlayerConnectId)?.id;
        if(connectId && EntitySystem.get(connectId)) {
            const playerCatch = EntitySystem.get(connectId)!.get(C.PlayerCatch);
            if(playerCatch && playerCatch.catchType == CATCH_TYPE.HAND) otherObjects.push(playerCatch.catchEntity!.get(C.Sprite)!.object3d);
        }

        for(const obj of otherObjects) this.addMaxdepth(obj);

        // 在 this.maxObjects 中的物体会在所有物体的最上方显示
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
        this.renderer.clearDepth();
        const objects = Array.from(this.maxObjects.values()).concat(Array.from(this.lights));
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