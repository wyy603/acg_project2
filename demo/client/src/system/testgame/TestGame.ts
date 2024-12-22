import * as C from '@/component'
import * as E from '@shared/component/event'
import { EventSystem, EntitySystem } from '@shared/system'
import { WebSocketSystem, RenderSystem, SyncMeshSystem, AssetSystem } from '@/system'
import { PlayerSystem } from './PlayerSystem'
import * as THREE from 'three'

export class TestGame {
    pointerLock = false
    playerSystem: PlayerSystem
    async onClick() {
        if (!document.pointerLockElement) {
            this.pointerLock = true;
            const domElement = RenderSystem.getDomElement();
            await domElement.requestPointerLock({
              unadjustedMovement: true,
            });
        }
    };
    onPointerLockChange() {
        if (document.pointerLockElement) {
            this.pointerLock = true;
            this.playerSystem.activateKey();
        } else {
            this.pointerLock = false;
            this.playerSystem.deactivateKey();
        }
    }

    constructor() {
        console.log("new testgame!");
        this.playerSystem = new PlayerSystem();
        this.onClick = this.onClick.bind(this);
        this.onPointerLockChange = this.onPointerLockChange.bind(this);
    }
    update(dt: number, timeStamp: number) {
        //console.log("[TestGame] update!");
        const entities = EntitySystem.getAll();
        SyncMeshSystem.update(entities, timeStamp);
        this.playerSystem.update(entities, this.pointerLock);
    }
    render() {
        const entities = EntitySystem.getAll();
        RenderSystem.update(entities);
    }
    activate() {
        const domElement = RenderSystem.getDomElement();
        domElement.addEventListener('click', this.onClick);
        document.addEventListener("pointerlockchange", this.onPointerLockChange);
        this.playerSystem.activate();
    }
    deactivate() {
        this.playerSystem.deactivate();
        const domElement = RenderSystem.getDomElement();
        domElement.removeEventListener('click', this.onClick);
        document.removeEventListener("pointerlockchange", this.onPointerLockChange);
        if (document.pointerLockElement === domElement) {
            document.exitPointerLock();
        }
    }
};