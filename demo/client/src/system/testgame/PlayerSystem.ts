import * as THREE from 'three';
import { Ammo, AmmoModule } from '@shared/utils/ammo'
import * as C from '@/component'
import * as E from '@shared/component/event'
import { Entity } from '@shared/basic'
import { EntitySystem } from '@shared/system'
import { WebSocketSystem } from '@/system'
import { RenderSystem, AssetSystem } from '@/system'
import { ScreenSystem } from '@/system/GameSystem'
import * as U from '../utils'
import { HTMLSystem } from './HTMLSystem'
import { CAMERA_OFFSET, CATCH_TYPE, SPRITE_STATE, CATCH_TYPE_NAME } from '@shared/constant'

function rayTest(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const objects = scene.children.filter(obj => {
        const entity = U.getSpriteByObject3D(obj, scene);
        if(entity) return (entity.getR(C.SpriteInfo)!.type & SPRITE_STATE.NO_RAYTEST) == 0;
        else return false;
    })
    const intersects = raycaster.intersectObjects(objects, true);
    const entities: Entity[] = [];
    const distances: number[] = [];
    for(const intersect of intersects) {
        const entity = U.getSpriteByObject3D(intersect.object, scene);
        if(entity) entities.push(entity), distances.push(intersect.distance);
    }
    return {
        entities: entities,
        distances: distances
    }
}

export class PlayerSystem {
    mouseX = 0
    mouseY = 0
    pointerLock = false;
    keyDown = new Set<string>();
    click: undefined | MouseEvent = undefined;
    wheel: undefined | WheelEvent = undefined;
    dirLight: THREE.DirectionalLight
    name?: THREE.Mesh
    constructor() {
        console.log("new playersystem!");
        const dirLight = new THREE.DirectionalLight( 0xffffff, 2 );
        this.dirLight = dirLight;
        RenderSystem.scene.add(dirLight);
        RenderSystem.lights.add(dirLight);
        const dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 5 );
        RenderSystem.scene.add(dirLightHelper);
        dirLight.castShadow = true;
        dirLight.shadow.camera.far = 400;
        const d = 150;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.left = - d;
        dirLight.shadow.camera.top	= d;
        dirLight.shadow.camera.bottom = - d;
        dirLight.shadow.mapSize.width = 4096;
        dirLight.shadow.mapSize.height = 4096;
        dirLight.shadow.radius = 5;
        dirLight.shadow.blurSamples = 25;
        dirLight.shadow.bias = -0.001; // https://blog.csdn.net/eevee_1/article/details/123372143
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this); 
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseClick = this.onMouseClick.bind(this);
        this.onWheel = this.onWheel.bind(this);
        (window as any).gameUtils = U;
    }
    mouseMoveListener = (event: MouseEvent) => this.onMouseMove(event)
    keyDownListener = (event: KeyboardEvent) => this.onKeyDown(event)
    keyUpListener = (event: KeyboardEvent) => this.onKeyUp(event)
    clickListener = (event: MouseEvent) => this.onMouseClick(event)
    activateKey() {
        document.addEventListener('mousemove', this.onMouseMove, false);
		document.addEventListener('keydown', this.onKeyDown, false);
		document.addEventListener('keyup', this.onKeyUp, false);
        document.addEventListener('click', this.onMouseClick, false);
        document.addEventListener('wheel', this.onWheel, false);
    }
    deactivateKey() {
        document.removeEventListener('mousemove', this.onMouseMove, false);
		document.removeEventListener('keydown', this.onKeyDown, false);
		document.removeEventListener('keyup', this.onKeyUp, false);
        document.removeEventListener('click', this.onMouseClick, false);
        document.removeEventListener('wheel', this.onWheel, false);
    }
    activate() {
        () => this.activateKey();
    }
    deactivate() {
        RenderSystem.lights.delete(this.dirLight);
    }
    onMouseClick(event: MouseEvent) {
        this.click = event;

        console.log("onmouseclick");

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), RenderSystem.camera);

        const tests: THREE.Object3D[] = [];
        for(const entity of EntitySystem.getAllR(C.Tips)) {
            const sprite = entity.get(C.Sprite), spriteInfo = entity.getR(C.SpriteInfo);
            if(sprite && spriteInfo && (spriteInfo.type & SPRITE_STATE.DETECTOR)) tests.push(sprite.object3d);
        }
        const intersects = raycaster.intersectObjects(tests, true);

        for(const closestIntersect of intersects) {
            const entity = U.getSpriteByObject3D(closestIntersect.object, RenderSystem.scene);
            if (entity) {
                console.log("find tip!");
                let list: any[] = HTMLSystem.get("ChatBox"); if(!list) list = [];
                list.push({type: 'systemmessage', str: entity.getR(C.Tips)!.str});
                HTMLSystem.set("ChatBox", list);
                break;
            }
        }
    }
    onWheel(event: WheelEvent) {
        this.wheel = event;
    }
    onMouseMove(event: MouseEvent) {
		if(this.pointerLock) {
			this.mouseY = -event.movementX / 800;
            this.mouseX = -event.movementY / 800;
        } else {
            this.mouseY = 0;
            this.mouseX = 0;
        }
	}
	onKeyDown(event: KeyboardEvent) {
        const ch = event.key.toLowerCase();
		if("wasd zxcpqo".includes(ch)) this.keyDown.add(ch);
	}
	onKeyUp(event: KeyboardEvent) {
        const ch = event.key.toLowerCase();
		if("wasd zxcpqo".includes(ch)) this.keyDown.delete(ch);
	}
    update(entities: Entity[], pointerLock: boolean) {
        this.updateMyPlayer(entities, pointerLock);
        this.updateAllPlayers(entities);
    }
    updateAllPlayers(entities: Entity[]) {
        const tmplist: any = [];
        for(const entity of entities) {
            const playerName = entity.getR(C.PlayerName);
            if(!playerName) continue;
            const connectId = entity.getR(C.PlayerConnectId);
            if(!connectId) continue;
            tmplist.push({entityid: entity.id, connectid: connectId.id});
            if(playerName.updated(this) && connectId.updated(this)) continue;
            const connectEntity = EntitySystem.get(connectId.id); if(!connectEntity) continue;
            const sprite = connectEntity.get(C.Sprite); if(!sprite) continue;
            sprite.playerName = playerName.name;
            U.updatePlayerName(sprite, sprite.playerName);
        
            playerName.mark(this);
        }
        // console.log("(i am)", WebSocketSystem.uuid, JSON.stringify(tmplist));
        
        for(const entity of entities) {
            const playerName = entity.getR(C.PlayerName), connectId = entity.getR(C.PlayerConnectId);
            if(!playerName || !connectId) continue;
            const connectEntity = EntitySystem.get(connectId.id); if(!connectEntity) continue;
            const sprite = connectEntity.get(C.Sprite); if(!sprite) continue;
            const object3d = sprite.object3d;

            const u_playerCatch = connectEntity.getR(C.U_PlayerCatch);
            let playerCatch = connectEntity.get(C.PlayerCatch);
            if(u_playerCatch && !u_playerCatch.updated(this)) {
                console.log("updatePlayerCatch type 2", u_playerCatch.catchType);
                U.updatePlayerCatch(entity, connectEntity);
                u_playerCatch.mark(this);
            }

            const playerSkin = entity.getR(C.PlayerSkin);
            if(playerSkin && (!playerSkin.updated(this) || !connectId.updated(this))) {
                //console.log("change skin", entity.id, connectId.id, playerSkin.name, JSON.stringify(sprite.object3d.children), sprite.name);
                AssetSystem.loadBitmap(`assets/skins/${playerSkin.name}.png`, (bitmap) => {
                    createImageBitmap(bitmap).then(abitmap => {
                        const texture = new THREE.CanvasTexture(abitmap);
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.minFilter = THREE.NearestFilter;
                        texture.magFilter = THREE.NearestFilter;
                        texture.colorSpace = "srgb";
                        U.updateTexture(sprite.object3d, texture, sprite.childrens);
                    });
                });
                playerSkin.mark(this);
            }
        }

        for(const entity of entities) {
            const playerName = entity.getR(C.PlayerName), playerChat = entity.getR(C.PlayerChat);
            if(!playerName || !playerChat || playerChat.updated(this)) continue;
            let list: any[] = HTMLSystem.get("ChatBox"); if(!list) list = [];
            list.push({type: 'message', name: playerChat.name, str: playerChat.str});
            console.log("list", list);
            HTMLSystem.set("ChatBox", list);
            playerChat.mark(this);
        }
        for(const entity of entities) {
            const connectId = entity.getR(C.PlayerConnectId);
            if(!connectId) continue;
            connectId.mark(this);
        }
    }
    updateMyPlayer(entities: Entity[], pointerLock: boolean) {
        const player = EntitySystem.get(WebSocketSystem.uuid);
        if(!player) return;

        const playerConnect = player.getR(C.PlayerConnectId);
        if(!playerConnect) return;
        const playerEntity = EntitySystem.get(playerConnect.id);

        this.pointerLock = pointerLock;
        if(!playerEntity) return;

        const object3dcomponent = playerEntity.get(C.Sprite);
        if(!object3dcomponent) return;
        const object3d = object3dcomponent.object3d;
        HTMLSystem.set2("Logger", "pos", {x: object3d.position.x.toFixed(1), y: object3d.position.y.toFixed(1), z: object3d.position.z.toFixed(1)});
        //const cube_pos = Utils.getEntityByName('cube')[0]!.get(C.SetMeshTransform)!.position!;
        //Logger.set("cube_pos", `(${cube_pos.x.toFixed(1)},${cube_pos.y.toFixed(1)},${cube_pos.z.toFixed(1)})`);
        if(!playerConnect.updated(this)) {
            const camera = RenderSystem.camera;
            camera.rotation.order = 'XYZ';
            object3dcomponent.addChildren(camera);
            camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);
            camera.rotation.set(0, 0, 0);
            playerConnect.mark(this);
            const fakeCamera = RenderSystem.fakeCamera;
            fakeCamera.removeFromParent();
            console.log("object3d", object3d)
            object3dcomponent.addChildren(fakeCamera);
            fakeCamera.position.copy(camera.position);
            fakeCamera.rotation.copy(camera.rotation);
        }
 
        const scene = RenderSystem.scene;
        const camera = RenderSystem.camera;
        const fakeCamera = RenderSystem.fakeCamera;

        this.dirLight.target = object3d;
        this.dirLight.position.copy(object3d.position).add(new THREE.Vector3(5, 100, 5));

        if(this.mouseY) {
            playerEntity.send(new C.PlayerRotate(this.mouseY));
        }
        camera.rotation.x += this.mouseX;
        if(camera.rotation.x > Math.PI / 2) camera.rotation.x = Math.PI / 2;
        if(camera.rotation.x < -Math.PI / 2) camera.rotation.x = -Math.PI / 2;
        fakeCamera.position.copy(camera.position);
        fakeCamera.rotation.copy(camera.rotation);
        
        {
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
            playerEntity.send(new C.PlayerCamera(
                C.Vector3.byTHREE(raycaster.ray.origin),
                C.Vector3.byTHREE(raycaster.ray.direction),
            ));
        }
        this.mouseX = 0;
        this.mouseY = 0;
        const keyDown: string[] = [];
        for(const ch of this.keyDown) keyDown.push(ch);
        {
            const input = new C.PlayerKeyboardInput(keyDown, C.Quaternion.byTHREE(object3d.quaternion));
            //console.log("[PlayerSystem] sendkeyboardinput");
            playerEntity.send(input);
        }
        if(this.click) {
            const {entities, distances} = rayTest(camera, scene);
            // console.log("click entities", entities.map(i => i.get(C.Sprite)!.name));
            playerEntity.send(new C.PlayerClickInput(this.click.button, entities, distances));
            //if(!HTMLSystem.get2("Progress", "click number")) HTMLSystem.set2("Progress", "click number", 0);
            //HTMLSystem.set2("Progress", "click number", HTMLSystem.get2("Progress", "click number") + 1);
            this.click = undefined;
        }
        if(this.wheel) {
            playerEntity.send(new C.PlayerWheelInput(this.wheel.deltaY));
            this.wheel = undefined;
        }
        const playerStuff = playerEntity.getR(C.PlayerStuff);
        if(playerStuff && !playerStuff.updated(this)) {
            console.log("set progress");
            HTMLSystem.set2("Progress", "progress", Math.min(playerStuff.cutting * 10, 100));
            playerStuff.mark(this);
        }
        const playerCatchType = player.getR(C.PlayerCatchType);
        if(playerCatchType && !playerCatchType.updated(this)) {
            HTMLSystem.set2("OvercraftInfo", "playerCatchType", CATCH_TYPE_NAME[playerCatchType.catchType]);
        }
        /*const position = U.getEntityByName("cube")[0].get(C.Sprite)!.object3d.position;
        HTMLSystem.set2("Logger", "cube_pos", `{'x':${Math.round(position.x)}, 'y':${Math.round(position.y)}, 'z':${Math.round(position.z)}}`)
        const parent = U.getEntityByName("cube")[0].get(C.Sprite)!.object3d.parent;
        if(parent) {
            HTMLSystem.set2("Logger", "cube_pos_parent", parent.name);
        }*/
        function send(msg: any) {
            let list: any[] = HTMLSystem.get("ChatBox"); if(!list) list = [];
            list.push(msg);
            HTMLSystem.set("ChatBox", list);
        }
        const systemMessage = player.getR(C.SystemMessage);
        if(systemMessage && !systemMessage.updated(this)) {
            for(const a of systemMessage.str) send({type: systemMessage.type, str: a});
            systemMessage.mark(this);
        }

        {
            function round(vec: THREE.Vector3) {
                return new THREE.Vector3(Math.round(vec.x), Math.round(vec.y), Math.round(vec.z));
            }
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

            /*const tests: THREE.Object3D[] = [];
            for(const entity of entities) {
                const sprite = entity.get(C.Sprite), spriteInfo = entity.getR(C.SpriteInfo);
                if(sprite && spriteInfo && (spriteInfo.type & SPRITE_STATE.DETECTOR)) tests.push(sprite.object3d);
            }
            const intersects = raycaster.intersectObjects(tests, true);*/
            const intersects = raycaster.intersectObjects(scene.children, true);

            const objects = intersects.map(intersect => intersect.object);
            const direction = raycaster.ray.direction;
            for(const closestIntersect of intersects) {
                const entity = U.getSpriteByObject3D(closestIntersect.object, scene);
                if (entity && entity != playerEntity) {
                    const point = closestIntersect.point;
                    const p1 = round(point.clone().add(direction.clone().multiplyScalar(0.1)));
                    const p2 = round(point.clone().add(direction.clone().multiplyScalar(-0.1)));
                    //console.log(p1, p2, entity.get(C.Sprite)!.name);
                    HTMLSystem.set2("Logger", "raycast far", p1);
                    HTMLSystem.set2("Logger", "raycast near", p2);
                    break;
                }
            }
            const detectors: THREE.Object3D[] = [];
            for(const entity of entities) {
                const sprite = entity.get(C.Sprite), spriteInfo = entity.getR(C.SpriteInfo);
                if(sprite && spriteInfo && (spriteInfo.type & SPRITE_STATE.DETECTOR)) detectors.push(sprite.object3d), sprite.object3d.visible = false;
            }
            for(const obj of objects) if(detectors.includes(obj)) { obj.visible = true; break; }
        }
    }
};