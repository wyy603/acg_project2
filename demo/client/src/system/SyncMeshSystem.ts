import * as THREE from 'three';
import { Ammo, AmmoModule } from '@shared/utils/ammo'
import * as C from '@/component'
import * as E from '@shared/component/event'
import { Entity } from '@shared/basic'
import { AmmoDebugDrawer, DefaultBufferSize } from '@shared/utils/AmmoDebugDrawer'
import { EventSystem, EntitySystem } from '@shared/system'
import { RenderSystem } from '@/system'
import * as U from './utils'
import { AssetSystem } from '@/system'
import { Config } from '@shared/constant'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { HTMLSystem } from './testgame/HTMLSystem'

export class SyncMeshSystem {
    static update(entities: Entity[], timeStamp: number) {
        for(const entity of entities) if(entity.hasR(C.SpriteInfo)) {
            const spriteInfo = entity.getR(C.SpriteInfo)!;
            if(!entity.has(C.Sprite)) entity.set(new C.Sprite(new THREE.Object3D(), spriteInfo.name));
            const sprite = entity.get(C.Sprite)!;

            let object3dupdate = false;

            const setMesh = entity.getR(C.SetMesh);
            const setMeshByPath = entity.getR(C.SetMeshByPath);
            const meshByPathLoaded = entity.getR(C.MeshByPathLoaded);
            const foodInfo = entity.getR(C.FoodInfo);
            const texturePlane = entity.getR(C.TexturePlane);
            const lineSegments = entity.getR(C.LineSegments);
            const meshBasicMaterial = entity.getR(C.MeshBasicMaterial);
            const meshPhongMaterial = entity.getR(C.MeshPhongMaterial);
            const transform = entity.getR(C.SetMeshTransform);

            if(setMeshByPath && !setMeshByPath.updated(this)) {
                EventSystem.addEvent(new E.LoadAssetEvent(entity.id, 
                    setMeshByPath.name, setMeshByPath.args));
                setMeshByPath.mark(this);
            }
            if((setMesh && !setMesh.updated(this)) || 
            (meshByPathLoaded && !meshByPathLoaded.updated(this)) || 
            (foodInfo && !foodInfo.updated(this)) ||
            (texturePlane && !texturePlane.updated(this)) ||
            (lineSegments && !lineSegments.updated(this))) {
                const parent = sprite.object3d.parent;
                sprite.object3d.removeFromParent();
                const childrens = Array.from(sprite.childrens).filter(child => sprite.object3d.children.includes(child));
                for(const a of childrens) if(sprite.object3d.children.includes(a)) a.removeFromParent();
                if(setMesh && !setMesh.updated(this)) {
                    sprite.object3d = setMesh.get();
                    setMesh.mark(this);
                }
                if(meshByPathLoaded && !meshByPathLoaded.updated(this)) {
                    sprite.object3d = AssetSystem.get(meshByPathLoaded.name).clone();
                    if(meshByPathLoaded.args) {
                        if(meshByPathLoaded.args.scale) sprite.object3d.scale.multiplyScalar(meshByPathLoaded.args.scale);
                        if(meshByPathLoaded.args.minecraft) U.changeMinecraft(sprite.object3d);
                    }
                    meshByPathLoaded.mark(this);

                    const player = U.getTheConnectingPlayer(entity);
                    if(entity.get(C.Sprite)?.name == "playerEntity") {
                        if(!player) console.log("change skin player not found!");
                        else console.log("change skin player found!");
                    }
                    if(player && player.getR(C.PlayerSkin)) {
                        AssetSystem.loadBitmap(`assets/skins/${player.getR(C.PlayerSkin)!.name}.png`, (bitmap) => {
                            const texture = new THREE.CanvasTexture(bitmap);
                            texture.wrapS = THREE.RepeatWrapping;
                            texture.wrapT = THREE.RepeatWrapping;
                            texture.minFilter = THREE.NearestFilter;
                            texture.magFilter = THREE.NearestFilter;
                            texture.colorSpace = "srgb";
                            U.updateTexture(sprite.object3d, texture);
                        });
                    }
                }
                if(foodInfo && !foodInfo.updated(this)) {
                    console.log("foodInfo", foodInfo);
                    sprite.object3d = U.getFoodMesh(foodInfo);
                    foodInfo.mark(this);
                }
                if(spriteInfo.name.includes("face:")) {
                    //console.log("face: entity", entity);
                }
                if(texturePlane && !texturePlane.updated(this)) {
                    U.setTexturePlane(sprite, texturePlane.name, texturePlane.position);
                    texturePlane.mark(this);
                }
                if(lineSegments && !lineSegments.updated(this)) {
                    sprite.object3d = lineSegments.get();
                    lineSegments.mark(this);
                }
                sprite.object3d.userData.entity = entity;
                if(parent) parent.add(sprite.object3d);
                U.setShadow(sprite.object3d), object3dupdate = true;
                for(const a of childrens) sprite.object3d.add(a);
            }
            if(meshBasicMaterial && (object3dupdate || !meshBasicMaterial.updated(this))) {
                U.setMaterial(sprite.object3d, meshBasicMaterial.get());
                meshBasicMaterial.mark(this);
            }
            if(meshPhongMaterial && (object3dupdate || !meshPhongMaterial.updated(this))) {
                U.setMaterial(sprite.object3d, meshPhongMaterial.get());
                meshPhongMaterial.mark(this);
            }
            if(transform && (object3dupdate || !transform.updated(this))) {
                if(sprite.name == "world") console.log("set position!!!!!");
                if(sprite.name == 'cube tool') {
                    //console.log("hi!!!!!!!!!!!!!!!!!!!!!!");
                    HTMLSystem.set2("Logger", "update_cube_pos", "true");
                }
                let position = transform.position, rotation = transform.rotation, quaternion = transform.quaternion;
                if(position) {
                    sprite.object3d.position.copy(position.getTHREE());
                }
                if(rotation) {
                    if(sprite.object3d.rotation.y != rotation.getTHREE().y) {
                        if(Config.log_level>=8) {
                            console.log("rotation difference", rotation.getTHREE(), sprite.object3d.rotation);
                        }
                        sprite.object3d.rotation.copy(rotation.getTHREE());
                    }
                }
                if(quaternion) {
                    sprite.object3d.quaternion.copy(quaternion.getTHREE());
                }
                transform.mark(this);
            } else {
                if(sprite.name == 'cube tool') HTMLSystem.set2("Logger", "update_cube_pos", "false");
            }

            spriteInfo.name = sprite.name;
            if(object3dupdate && sprite.playerName) {
                console.log("updatePlayerName", sprite.entity(), "-", entity);
                U.updatePlayerName(sprite, sprite.playerName);
            }
            if(object3dupdate && entity.getR(C.U_PlayerCatch)) {
                let flag = false;
                for(const playerEntity of EntitySystem.getAllR(C.PlayerConnectId)) if(playerEntity.getR(C.PlayerConnectId)!.id == entity.id) {
                    console.log("playerEntity=", playerEntity.id);
                    U.updatePlayerCatch(playerEntity, entity);
                    flag = true;
                }
                if(flag == true) console.log("qwq:set");
                else console.log("qwq:fail");
            }
            const playAnimation = entity.getR(C.PlayAnimation);
            if(object3dupdate && playAnimation) {
                U.playAnimation(sprite.object3d, playAnimation.name, playAnimation.ratio, playAnimation.repeat);
            }
        }
        for(const entity of entities) {
            const spriteInfo = entity.getR(C.SpriteInfo);
            const sprite = entity.get(C.Sprite);
            if(!spriteInfo || !sprite || spriteInfo.updated(this)) continue;
            sprite.name = spriteInfo.name;
            spriteInfo.mark(this);
        }
        for(const entity of entities) {
            const playAnimation = entity.getR(C.PlayAnimation);
            const object3d = entity.get(C.Sprite)?.object3d;
            if(object3d && playAnimation && !playAnimation.updated(this)) {
                U.playAnimation(object3d, playAnimation.name, playAnimation.ratio, playAnimation.repeat);
                playAnimation.mark(this);
            }
        }
    }
};