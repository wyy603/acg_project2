import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import * as C from '@/component'
import * as E from '@shared/component/event'
import { EventSystem, EntitySystem } from '@shared/system'
import { v4 as uuidv4 } from 'uuid'

export class AssetSystem {
    static map = new Map<string, THREE.Object3D>();
    static textureMap = new Map<string, ImageBitmap>();
    static animationMap = new Map<string, THREE.AnimationClip>();
    static waiting_list = new Array<[string, string]>();
    static loading_list = new Set<string>();
    static gltfLoader = new GLTFLoader();
    static init() {
        
    }
    static loadBitmap(path: string, onLoad: (texture: ImageBitmap) => void) {
        // Check if the texture is already loaded
        if (this.textureMap.has(path)) {
            onLoad(this.textureMap.get(path)!);
            return;
        }

        const loader = new THREE.ImageBitmapLoader();
        loader.load(
            path,
            (texture) => {
                // Store the texture in the map
                this.textureMap.set(path, texture);
                onLoad(texture);
            },
            undefined, // onProgress is not used
            (error) => {
                console.error(`Error loading texture: ${path}`, error);
            }
        );
    }
    static async load(name: string) {
        const path = name;
        if (!this.map.get(name)) {
            if (!this.loading_list.has(name)) {
                this.loading_list.add(name);
                const id = uuidv4();
                try {
                    const gltf = await this.gltfLoader.loadAsync(path);
                    const mesh = gltf.scene;
                    for(const clip of gltf.animations) {
                        if(!this.animationMap.has(clip.name)) this.animationMap.set(clip.name, clip);
                    }
                    console.log(`[${id}] Load Asset ${name} ${path}: `, mesh);
                    this.map.set(name, mesh);
                } catch (error) {
                    console.error(`[${id}] Failed to load asset ${name}: `, error);
                } finally {
                    this.loading_list.delete(name);
                }
            } else {
                return new Promise((resolve) => {
                    const checkLoaded = () => {
                        if (!this.loading_list.has(name)) {
                            clearInterval(interval);
                            resolve(this.map.get(name));
                        }
                    };
                    const interval = setInterval(checkLoaded, 100);
                });
            }
        } else {
            return this.map.get(name);
        }
    }
    static get(name: string) {
        const ret = this.map.get(name);
        if(ret) return ret;
        else {
            console.error(`Error asset ${name} not found.`);
            return new THREE.Object3D();
        }
    }
    static getAnimation(name: string) {
        return this.animationMap.get(name);
    }
};