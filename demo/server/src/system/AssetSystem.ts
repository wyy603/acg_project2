import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import * as C from '@/component'
import * as E from '@shared/component/event'
import NodeThreeExporter from '@injectit/threejs-nodejs-exporters'
import fs from 'fs'

export class AssetSystem {
    static map = new Map<string, THREE.Object3D>();
    static waiting_list = new Array<[string, string, number]>();
    static exporter = new NodeThreeExporter();
    static init() {
        
    }
    static addMesh(name: string, mesh: THREE.Object3D) {
        if(this.map.get(name)) return;
        this.map.set(name, mesh);
    }
    static async loadOne(path: string): Promise<THREE.Object3D> {
        return new Promise((resolve, reject) => {
            this.exporter.parse('glb', fs.readFileSync(path), (model: {scene: THREE.Object3D}) => {
                resolve(model.scene); 
            });
        })
    }
    static async get(name: string) {
        const path = name;
        if(!this.map.get(name)) {
            const model = (await this.loadOne(path));
            this.map.set(name, model);
        }
        return this.map.get(name)!;
    }
};