import { Entity } from '@shared/basic'
import { EntitySystem } from '@shared/system'
import { WebSocketSystem, AssetSystem } from '@/system'
import { INGREDIENT, INGREDIENT_PROPERTY } from '@shared/constant'
import * as C from '@/component'
import * as THREE from 'three'
import * as U from '@shared/utils'
export * from '@shared/utils'

import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader, Font } from 'three/addons/loaders/FontLoader.js';

const getOrder = (() => {
    let order = 0;
    return () => {
        order += 100;
        return order;
    };
})();

let MMM: any;
export function changeMinecraft(obj: THREE.Object3D) {
    if(obj instanceof THREE.Mesh) {
        const material = obj.material;
        // material.renderOrder = getOrder();
        if(material instanceof THREE.MeshPhysicalMaterial) {
            const texture = material.map;
            if(texture) {
                texture.minFilter = THREE.NearestFilter;
                texture.magFilter = THREE.NearestFilter;
            }
        }
        if(obj.name.includes("glass")) {
            console.log("hihihihiasdas1212");
            if(material instanceof THREE.MeshPhysicalMaterial) {
                material.depthWrite = false;
                material.clearcoatNormalScale = new THREE.Vector2(1, -1)
                material.normalScale = new THREE.Vector2(1, -1)
                material.transparent = true;
                material.opacity = 0.5;
                material.polygonOffset = true;
                material.polygonOffsetFactor = 0.75;
                material.polygonOffsetUnits = 4.0;

                console.log("glass material:", material);
            }
        } else {
            if(material instanceof THREE.MeshPhysicalMaterial) {
                material.depthWrite = true;
                material.depthTest = true;

                if(material.name.includes("stove_front")) {
                    console.log("other material:", material);
                    MMM = material;
                }
            }
        }
    } else {
        for (const child of obj.children) {
            changeMinecraft(child);
        }
    }
}

export function getSpriteByObject3D(obj: THREE.Object3D, scene: THREE.Scene) {
    while(obj.parent != scene && obj.parent != null) {
        if(obj.userData.entity) return obj.userData.entity;
        obj = obj.parent;
    }
    return obj.userData.entity;
}

export function playAnimation(obj: THREE.Object3D, name: string, ratio: number, repeat: boolean) {
    // console.log("playAnimation", obj, name, ratio);
    const clip = AssetSystem.getAnimation(name);
    if(!clip) return;
    if(!obj.userData.mixer) obj.userData.mixer = new THREE.AnimationMixer(obj);
    if(!obj.userData.actions) obj.userData.actions = {};
    const mixer = obj.userData.mixer, actions = obj.userData.actions;
    if(!actions[name]) actions[name] = mixer.clipAction(clip);
    const currentAction = actions[name];
    if(repeat == false) console.log("repeat = false");
    if(!repeat) currentAction.setLoop(THREE.LoopOnce), currentAction.reset();
    else currentAction.setLoop(THREE.LoopRepeat);
    if(!obj.userData.animatingAction) obj.userData.animatingAction = currentAction, currentAction.play();

    if(obj.userData.animatingAction != currentAction) {
        obj.userData.animatingAction.stop();
        currentAction.play();
        obj.userData.animatingAction = currentAction;
    }
    obj.userData.ratio = ratio;
}

export function setTexturePlane(sprite: C.Sprite, name: string, position: C.Vector3) {
    //console.log("setTexturePlane path", name);
    function setMaterial(bitmap: ImageBitmap, args: any = {}) {
        const texture = new THREE.CanvasTexture(bitmap);
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.colorSpace = "srgb";
        const { time, animation, ...filteredArgs } = args;
        const material = new THREE.MeshPhysicalMaterial({
            map: texture,
            side: THREE.DoubleSide,
            depthTest: true,
            clearcoatNormalScale: new THREE.Vector2(1, -1),
            normalScale: new THREE.Vector2(1, -1),
            transparent: false,
            specularIntensity: 1,
            ...filteredArgs
        });
        if(args.animation) {
            const { width, height } = texture.image;
            const frameNum = height / 16;
            texture.repeat.set(1, -1 / frameNum);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            if(!args.time) args.time = 2;
            sprite.animate = () => {
                sprite.animationCounter += 1;
                if(sprite.animationCounter % args.time == 0) {
                    material.map!.offset.y += 1 / frameNum;
                }
            }
        }
        return material;
    }
    function setGeometry() {
        const geometry = new THREE.PlaneGeometry(1, 1);
        const dx = Math.abs(position.x - (Math.floor(position.x) + 0.5));
        const dy = Math.abs(position.y - (Math.floor(position.y) + 0.5));
        const dz = Math.abs(position.z - (Math.floor(position.z) + 0.5));
        if (dx < dy && dx < dz) {
            geometry.rotateY(Math.PI / 2); // Rotate to face the yz plane
        } else if (dy < dx && dy < dz) {
            geometry.rotateX(Math.PI / 2); // Rotate to face the xz plane
        }
        return geometry;
    }
    if(name == "stove_front_on") {
        AssetSystem.loadBitmap("assets/minecraft_workspace/textures/stove_front_on.png", (bitmap) => {
            const material = setMaterial(bitmap, {time: 6, animation: true});
            const geometry = setGeometry();
            const plane = new THREE.Mesh(geometry, material);
            plane.position.copy(position.getTHREE());
            //console.log("setTexturePlane material", material);
            sprite.object3d = plane;
        });
    } else if(name == "water_still") {
        AssetSystem.loadBitmap("assets/minecraft_workspace/textures/water_still.png", (bitmap) => {
            const material = setMaterial(bitmap, {
                depthWrite: false,
                transparent: true,
                specularIntensity: 0,
                color: new THREE.Color(0x40A4FF),
                metalness: 0.5, // 增加金属感
                roughness: 0.9, // 减少粗糙度以增加反光
                reflectivity: 0.9, // 增加反射率
                clearcoat: 1.0, // 增加清漆效果
                clearcoatRoughness: 0.05, // 减少清漆粗糙度以增强反光
                time: 4,
                animation: true,
            });
            const geometry = setGeometry();
            const plane = new THREE.Mesh(geometry, material);
            plane.position.copy(position.getTHREE());
            //console.log("setTexturePlane material water", material);
            sprite.object3d = plane;
        });
    } else {
        if(name == "cow") name = "assets/minecraft_workspace/textures/cow_icon.png";
        AssetSystem.loadBitmap(name, (bitmap) => {
            const material = setMaterial(bitmap, {time: 6});
            const geometry = setGeometry();
            const plane = new THREE.Mesh(geometry, material);
            plane.position.copy(position.getTHREE());
            //console.log("setTexturePlane material", material);
            sprite.object3d = plane;
        });
    }
}

export function updateTexture(obj: THREE.Object3D, texture: THREE.Texture, exclude: THREE.Object3D[]) {
    if(obj instanceof THREE.Mesh) {
        if(obj.material instanceof THREE.Material) {
            obj.material = obj.material.clone();
            if(obj.material.map) obj.material.map = texture;
        }
    } else {
        for(const child of obj.children) {
            if(!exclude.includes(child)) updateTexture(child, texture, exclude);
        }
    }
}

export function updatePlayerName(sprite: C.Sprite, name: string) {
    console.log("updatePlayerName", name);
    console.log("aasprite", sprite);
    const entity = sprite.entity()!;
    const object3d = sprite.object3d;
    const loader = new FontLoader();
    loader.load( 'assets/fonts/helvetiker_regular.typeface.json', (font) => {
        console.log("Font Loaded", entity.id);
        const textGeometry = new TextGeometry(name, {
            font: font,
            size: 0.1,
            depth: 0.01,
            curveSegments: 12,
        } );
        textGeometry.center();

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const nameMesh = new THREE.Mesh(textGeometry, textMaterial);
        const oldNameMesh = sprite.playerNameMesh;
        if(oldNameMesh) U.disposeMesh(oldNameMesh);
        nameMesh.position.set(0, 2.25, 0);
        nameMesh.rotation.set(0, Math.PI, 0);
        sprite.addChildren(nameMesh);
        sprite.playerNameMesh = nameMesh;
        console.log("name world position", nameMesh.getWorldPosition(new THREE.Vector3()));
    } );
}

export function getChildrens(obj: THREE.Object3D, list: THREE.Object3D[] = []) {
    list.push(obj);
    if(obj instanceof THREE.Mesh) {
    } else {
        for(const child of obj.children) getChildrens(child, list);
    }
    return list;
}

export function getEntityByName(name: string) {
    const list = EntitySystem.getAll();
    const realList: Entity[] = [];
    for(const entity of list) {
        const realName : C.SpriteInfo | undefined = entity.getR(C.SpriteInfo);
        if(realName && realName.name.includes(name)) {
            realList.push(entity);
        }
    }
    return realList;
}

import { RenderSystem } from '@/system'
import { CAMERA_OFFSET, CATCH_TYPE } from '@shared/constant'

export function updatePlayerCatch(entity: Entity, connectEntity: Entity) { // 第一个有C.PlayerName，第二个是它connect的
    console.log("updatePlayerCatch", entity.id, connectEntity.id, connectEntity.get(C.PlayerCatch)?.catchType);
    const sprite = connectEntity.get(C.Sprite); if(!sprite) return;
    const object3d = sprite.object3d;
    const u_playerCatch = connectEntity.getR(C.U_PlayerCatch);
    let playerCatch = connectEntity.get(C.PlayerCatch);
    /*if(connectEntity.get(C.PlayerCatch)?.catchType == CATCH_TYPE.HAND && 
    u_playerCatch?.catchType == CATCH_TYPE.HAND) {
        u_playerCatch.catchType = CATCH_TYPE.NONE;
    }*/ //强行修复换房间时拿着东西会留下mesh的bug
    if(u_playerCatch) {
        console.log("hihihi!!");
        if(playerCatch) {
            console.log("hohoho!!");
            if(playerCatch.catchType == CATCH_TYPE.HAND) {
                const catchEntity = playerCatch.catchEntity!;
                const catchObject3D = catchEntity.get(C.Sprite)!.object3d;
                console.log("updatePlayerCatch catchObject3D", catchObject3D);
                catchObject3D.removeFromParent();
            }
        }
        connectEntity.set(new C.PlayerCatch(u_playerCatch.catchType, u_playerCatch.catchEntityId ? EntitySystem.get(u_playerCatch.catchEntityId) : undefined));
        playerCatch = connectEntity.get(C.PlayerCatch)!;
        console.log("updatePlayerCatch2", entity.id, connectEntity.id, connectEntity.get(C.PlayerCatch)?.catchType, u_playerCatch.catchType);
        if(playerCatch.catchType == CATCH_TYPE.HAND) {
            let catchObject3D = playerCatch.catchEntity!.get(C.Sprite)!.object3d;
            if(entity.id == WebSocketSystem.uuid) {
                RenderSystem.fakeCamera.add(catchObject3D);
                catchObject3D.position.set(2, -0.5, -2);
                catchObject3D.rotation.set(0, -Math.PI / 2, 0);
            } else {
                sprite.addChildren(catchObject3D);
                console.log("object3d.children", object3d.children, "catch.parent.name", catchObject3D.parent!.name, "catch.parent", catchObject3D.parent);
                catchObject3D.position.set(0.4, 1, -0.8);
                catchObject3D.rotation.set(0, -Math.PI / 2, 0);
            }
        }
    }
}

export function getFoodMesh(food: C.FoodInfo): THREE.Object3D {
    const group = new THREE.Group();
    if(food.ingredients.length == 1) {
        const ingredient = food.ingredients[0];
        const info = INGREDIENT_PROPERTY[ingredient];
        if (info.mesh !== undefined) {
            const mesh = (AssetSystem.get(info.mesh.path)).clone();
            mesh.scale.multiplyScalar(info.mesh.scale);
            group.add(mesh);
            mesh.position.set(0, 0, 0);
        }
    } else {
        let height = 0;
        let sumHeight = 0;
        food.ingredients.forEach(ingredient => {
            const info = INGREDIENT_PROPERTY[ingredient];
            if (info.height !== undefined && info.mesh !== undefined) sumHeight += info.height;
        });
        food.ingredients.forEach(ingredient => {
            const info = INGREDIENT_PROPERTY[ingredient];
            if (info.height !== undefined && info.mesh !== undefined) {
                const mesh = (AssetSystem.get(info.mesh.path)).clone();
                mesh.scale.multiplyScalar(info.mesh.scale);
                group.add(mesh);
                mesh.position.set(0, - height, 0);
                height += info.height;
            }
        });
        console.log("getFoodMesh", sumHeight);
    }
    if(food.friedInfo && food.inGrid) {
        console.log("has food.friedInfo");
        const progressBar = new THREE.Group();
        const ratio = Math.min(food.friedInfo.progress / food.friedInfo.difficulty, 1);
        const obj1 = new THREE.Mesh(new THREE.PlaneGeometry(ratio, 0.1), new THREE.MeshBasicMaterial({color: new THREE.Color(0, ratio, 0), side: THREE.DoubleSide}));
        progressBar.add(obj1);
        obj1.position.set(0, 0, -0.5 + ratio / 2);
        obj1.rotation.set(0, Math.PI / 2, 0);
        const obj2 = new THREE.Mesh(new THREE.PlaneGeometry(1 - ratio, 0.1), new THREE.MeshBasicMaterial({color: 0x808080, side: THREE.DoubleSide}));
        progressBar.add(obj2);
        obj2.position.set(0, 0, 0.5 - (1 - ratio) / 2);
        obj2.rotation.set(0, Math.PI / 2, 0);
        group.add(progressBar);
        progressBar.position.set(0, 0.4, 0);
    }
    console.log("getFoodMesh", food.ingredients, group);
    return group;
}

export function getTheConnectingPlayer(entity: C.Entity) {
    for(const player of EntitySystem.getAll()) {
        if(player.getR(C.PlayerConnectId)?.id == entity.id) return player;
    }
}
export function getPlayerName() {
    const entity = EntitySystem.get(WebSocketSystem.uuid)!;
    return entity.getR(C.PlayerName)!.name;
}
export function setPlayerName(name: string) {
    const entity = EntitySystem.get(WebSocketSystem.uuid)!;
    entity.receive(new C.PlayerName(name));
    entity.send(new C.PlayerName(name));
}
export function getPlayerSkin() {
    const entity = EntitySystem.get(WebSocketSystem.uuid)!;
    return entity.getR(C.PlayerSkin)!.name;
}
export function setPlayerSkin(name: string) {
    console.log("setPlayerSkin", name);
    const entity = EntitySystem.get(WebSocketSystem.uuid)!;
    entity.receive(new C.PlayerSkin(name));
    entity.send(new C.PlayerSkin(name));
}

export function getMinecraftBlock({north, south, east, west, bottom, up}: {
    north: THREE.Texture,
    south: THREE.Texture,
    east: THREE.Texture,
    west: THREE.Texture,
    bottom: THREE.Texture,
    up: THREE.Texture,
}) {
    const textures = {
        north,
        south,
        west,
        east,
        bottom,
        up,
    };

    function repeatMaterial(texture: THREE.Texture) {
        const { width, height } = texture.image;
        texture.repeat.set(1 / (height / 16), 1);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return new THREE.MeshBasicMaterial({ map: texture });
    }
    
    const materials = [
        repeatMaterial(textures.east),  // right
        repeatMaterial(textures.west),  // left
        repeatMaterial(textures.up),    // top
        repeatMaterial(textures.bottom),// bottom
        repeatMaterial(textures.south), // front
        repeatMaterial(textures.north),  // back
    ];
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const cube = new THREE.Mesh(geometry, materials);
    return cube;
}

import { HTMLSystem } from '@/system/testgame/HTMLSystem'
import { OvercraftSystemClient } from './testgame/OvercraftSystem'
import { Game } from '@/system/GameSystem'

function playerChangeRoom(room: number) {
    const player = EntitySystem.get(WebSocketSystem.uuid)!;
    player.send(new C.PlayerChangeRoom(room));
}
export function sendPlayerMessage(str: string) {
    function send(msg: any) {
        let list: any[] = HTMLSystem.get("ChatBox"); if(!list) list = [];
        list.push(msg);
        HTMLSystem.set("ChatBox", list);
    }
    const player = EntitySystem.get(WebSocketSystem.uuid);
    if(!player) return;
    if(str != "") {
        if (str[0] === '/') {
            const parts = str.slice(1).split(' ');
            const command = parts[0];
            const args = parts.slice(1);
            if(command == 'cd') {
                if(args[0] == '0' || args[0] == '1' || args[0] == '2' || args[0] == '3') {
                    const changeRoom = parseInt(args[0]);
                    const system = Game.gamesystems.get(0) as OvercraftSystemClient;
                    if(system && system.isRunning()) {
                        send({type: 'error', str: `Error: Game is running.`});
                    } else if(EntitySystem.get(player.getR(C.PlayerConnectId)!.id)!.getR(C.U_PlayerCatch)?.catchEntityId) {
                        send({type: 'error', str: `Error: You are catching an item.`});
                    } else if(changeRoom == player.getR(C.PlayerRoom)!.roomId) {
                        send({type: 'error', str: `Error: You are already in room ${args[0]}.`});
                    } else {
                        playerChangeRoom(parseInt(args[0]));
                        send({type: 'systemmessage', str: `Sending you to room ${args[0]}...`})
                    }
                } else {
                    send({type: 'error', str: `Error: room ${args[0]} not found.`});
                }
            } else if(command == 'help') {
                send({type: 'systemmessage', str: `欢迎来到 OverCraft! `});
                send({type: 'systemmessage', str: `1. 鼠标左键：拿起物品或与生成器、菜板、放置区等交互；鼠标右键：放下物品。`});
                send({type: 'systemmessage', str: `2. 鼠标滚轮可以切换抓取方式。在拿枪时，按 z,x 发射子弹。`});
                send({type: 'systemmessage', str: `3. 在主世界 (room_id = 0) 可以获得与 OverCraft 做菜相关的帮助。在房间中按 q 开始一局游戏。`});
                send({type: 'systemmessage', str: `4. /cd [room_id = 0,1,2,3] 可以切换房间。当前在房间 ${player.getR(C.PlayerRoom)!.roomId}。`});
                send({type: 'systemmessage', str: `5. /help 可以获取帮助。`});
            } else {
                send({type: 'error', str: `Error: invalid command [${str}].`});
            }
        } else {
            player.send(new C.PlayerChat(getPlayerName(), str));
        }
    }
}