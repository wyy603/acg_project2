import * as C from '@/component'
import * as THREE from 'three'
import { AmmoModule, Ammo } from '@shared/utils/ammo'
import { Entity } from '@shared/basic'
import { SerializeSystem, EntitySystem } from '@shared/system'
import { GameSystem } from '@/system'
import { SPRITE_STATE, CATCH_TYPE, ROOM_TYPE, Config } from '@shared/constant'
import WebSocket, { WebSocketServer } from 'ws';
import { INGREDIENT } from '@shared/constant'
import * as U from '@/system/testgame/utils'

export class RigidBody extends C.Component {
    constructor(public body: AmmoModule.btRigidBody) { super(); }
};
export class Sprite extends C.Component {
    position: C.Vector3 | undefined = undefined
    transformChanged: boolean = false
    rotation: C.Euler | undefined = undefined
    quaternion: C.Quaternion | undefined = undefined
    constructor(
        public name: string,
        private _body: AmmoModule.btRigidBody | undefined,
        public type: SPRITE_STATE,
        public asyncRot = true,
        public asyncPos = true,
        public activated = true,
    ) { 
        super();
    }
    setEntityId(id: number) {
        this._entityId = id;
        if(this.body) this.body.setUserIndex(this.getEntityId());
    }
    get body() { return this._body; }
    setBody(body: AmmoModule.btRigidBody) { this._body = body, this._body.setUserIndex(this.getEntityId()); }
    deactivate(physicsWorld: AmmoModule.btDiscreteDynamicsWorld) {
        this.activated = false;
        if(this.body) physicsWorld.removeRigidBody(this.body);
    }
    activate(physicsWorld: AmmoModule.btDiscreteDynamicsWorld) {
        this.activated = true;
        if(this.body) physicsWorld.addRigidBody(this.body, 1 << this.entity()!.room, 1 << this.entity()!.room);
    }
};

export class Gun extends C.Component {
    constructor() { super(); }
};
export class PlayerCatch extends C.Component {
    constructor(
        public catchType = CATCH_TYPE.NONE,
        public catchLen = 0,
        public catchEntity?: Entity,
        public catchConstraint?: AmmoModule.btPoint2PointConstraint,
    ) { super(); }
    removeConstraint(world: AmmoModule.btDiscreteDynamicsWorld) {
        if(!this.catchEntity) return;
        if(this.catchType == CATCH_TYPE.CONSTRAINT) {
            if(this.catchConstraint) {
                world.removeConstraint(this.catchConstraint);
                this.catchConstraint = undefined;
            }
        } else if(this.catchType == CATCH_TYPE.HAND) {
            const sprite = this.catchEntity!.get(Sprite)!;
            sprite.activate(world);
            const playerCamera = this.entity()!.getR(C.PlayerCamera)!;
            const origin = playerCamera.origin.getTHREE();
            const direction = playerCamera.direction.getTHREE();
            let {dis0: distance} = U.analyzeRaytest(this.entity()!);
            const radius = U.getRadius(sprite.body!);
            if(!distance) distance = Infinity;
            const position = C.Vector3.byTHREE(origin.clone().add(direction.multiplyScalar(Math.min(3, distance - radius))));
            console.log("uncatch hand");
            this.catchEntity.receive(new C.SetPhysicsTransform(position, undefined, undefined));
        }
        const body = this.catchEntity.get(C.Sprite)!.body;
        if(body) body.activate(true);
        this.catchType = CATCH_TYPE.NONE;
        this.catchLen = 0;
        this.catchEntity = undefined;
        this.send();
    }
    send() {
        console.log("updatePlayerCatch send u_playercatch", this.catchType, this.entity()!.id);
        this.entity()!.send(new C.U_PlayerCatch(this.catchType, this.catchLen, this.catchEntity?.id));
    }
};
export class GunTime extends C.Component {
    constructor(public time: number) { super(); }
};
export class Player extends C.Component {
    name = "Undefined"
    skin = ""
    connectId?: number
    catchType: CATCH_TYPE = CATCH_TYPE.HAND
    constructor(
        public ws: WebSocket,
        public entityId: number
    ) {
        super(entityId);
        this.setRoom(0);
        this.setName("Undefined");
        this.setCatchType(CATCH_TYPE.HAND);
        this.setSkin("blockbench-default");
    }
    sendProps() {
        this.setName(this.name);
        this.setCatchType(this.catchType);
        this.setSkin(this.skin);
    }
    connectEntity() {
        return this.connectId ? EntitySystem.get(this.connectId) : undefined;
    }
    setConnectId(id: number) {
        this.connectId = id;
        this.entity()!.send(new C.PlayerConnectId(this.connectId));
    }
    setName(name: string) {
        this.name = name;
        this.entity()!.send(new C.PlayerName(name));
    }
    setSkin(skin: string) {
        this.skin = skin;
        this.entity()!.send(new C.PlayerSkin(skin));
    }
    setRoom(room: number) {
        EntitySystem.setRoom(this.entity()!, room);
        const roomType = GameSystem.getRoomType(this.entity()!.room);
        this.entity()!.send(new C.PlayerRoom(roomType, room));
    }
    setCatchType(catchType: number) {
        this.catchType = catchType;
        this.entity()!.send(new C.PlayerCatchType(this.catchType));
    }
};
export class SpawnOnCatch extends C.Component {
    constructor(public ingredient: INGREDIENT) { super(); }
};
export class positionOnPlacing extends C.Component {
    constructor(public position: C.Vector3) {super();}
}
export class Plate extends C.Component {
    constructor(public list: Entity[]) { super(); }
};
export class knifeInfo extends C.Component {
    constructor(public position: C.Vector3) {super();}
}
export class cutBoard extends C.Component {
    constructor() { super(); }
}
export class Skillet extends C.Component {
    constructor() { super(); }
}
export class MinecraftWorld extends C.Component {
    public blockIds: Map<number, string> = new Map();
    public blocks: Map<number, AmmoModule.btRigidBody | undefined> = new Map();
    public array: Map<string, number[]> = new Map();
    constructor(
        object3d: THREE.Object3D,
        public position: AmmoModule.btVector3,
        public physicsWorld: AmmoModule.btDiscreteDynamicsWorld
    ) {
        super();
        this.getMinecraftShape(object3d);
    }
    getMinecraftShape(
        obj: THREE.Object3D,
        matrix = new THREE.Matrix4(),
        final = true,
    ) { // 只允许有一个叶子！
        obj.updateMatrix();
        matrix.premultiply(obj.matrix);
    
        if (obj.type === 'Mesh') {
            const geometry = (obj as THREE.Mesh).geometry;
            const positions = geometry.getAttribute('position').array;
    
            const setNodes: Set<string> = new Set();
            for (let i = 0; i < positions.length; i += 3) {
                const vec = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]).applyMatrix4(matrix);
                //console.log(`original ${vec.x}, ${vec.y}, ${vec.z}, ${Math.floor(vec.x)}, ${Math.floor(vec.y)}, ${Math.floor(vec.z)}`);
                vec.x = Math.floor(vec.x), vec.y = Math.floor(vec.y), vec.z = Math.floor(vec.z);
                setNodes.add(U.vecToStr(vec));
            }
            /*setNodes.add("5, 3, 5");
            console.log("hello", setNodes.has("5, 3, 5"));*/
            for(let str of setNodes.values()) {
                const vec = U.strToVec(str);
                //console.log("qwq",vec);
                let flag=true;
                let cnt=0;
                for(let dx=-1;dx<=0;++dx)for(let dy=-1;dy<=0;++dy)for(let dz=0;dz>=-1;--dz){
                    if(!flag)continue;
                    //console.log(U.vecToStr(vec),",",U.vecToStr(vec.clone().add(new THREE.Vector3(dx,dy,dz))),setNodes.has(U.vecToStr(vec.clone().add(new THREE.Vector3(dx,dy,dz)))));
                    if(flag&&!setNodes.has(U.vecToStr(vec.clone().add(new THREE.Vector3(dx,dy,dz))))) {
                        flag=false;
                        cnt+=1;
                    }
                }
                if(flag){
                    //if(vec.x>=98) console.log(`add ${vec.x}, ${vec.y}, ${vec.z}`);
                    if(!this.array.get(`${vec.x},${vec.z}`)) this.array.set(`${vec.x},${vec.z}`,[]);
                    this.array.get(`${vec.x},${vec.z}`)!.push(vec.y);
                }
            }
        } else {
            for (const child of obj.children) {
                this.getMinecraftShape(child, matrix.clone(), false);
            }
        }
        if(final) {
            for(let key of this.array.keys()) {
                this.array.set(key, this.array.get(key)!.sort((a, b) => a - b));
                //console.log(this.array.get(key)!);
            }
        }
    }
    update(playerEntity: Entity) {
        const vec = U.posAT(U.getPos(playerEntity));
        const bid = U.getMinecraftBlock(vec.add(U.posAT(this.position).multiplyScalar(-1)));
        if(!this.blockIds.has(playerEntity.id)) this.blockIds.set(playerEntity.id, bid);
        if(this.blockIds.get(playerEntity.id)! != bid) {
            const oldbody = this.blocks.get(playerEntity.id);
            if(oldbody) {
                console.log("destroy!!!!!");
                this.physicsWorld.removeRigidBody(oldbody);
                const shape = oldbody.getCollisionShape();
                /*if (!shape.__destroy__) { 如果要启用，这里不要注释掉
                    console.log("destroy!");
                    Ammo.destroy(shape);
                }*/
            }
            this.genBlock(playerEntity.id, bid);
            this.blockIds.set(playerEntity.id, bid);
        }
    }
    addToCompoundShape(triangleShape: AmmoModule.btTriangleMesh, bid: string) {
        const bvec = U.strToVec(bid);
        let count = 0;
        let flag = false;
        for(let x = bvec.x * Config.block_size; x < (bvec.x + 1) * Config.block_size; ++x) {
            for(let z = bvec.z * Config.block_size; z < (bvec.z + 1) * Config.block_size; ++z) {
                //console.log("bb x = ", x, "z = ", z);
                const ys = this.array.get(`${x},${z}`);
                if(!ys) continue;
                //console.log("aa x = ", x, "z = ", z);
                let ly: number | undefined = undefined;
                let lasty: number | undefined = undefined;
                for(let y of ys) if(bvec.y * Config.block_size <= y && y < (bvec.y + 1) * Config.block_size) {
                    if(!lasty || y - lasty != 1) {
                        if(lasty && ly) {
                            const vertices = [
                                [x - 1/2, ly-1/2, z - 1/2], // V0
                                [x + 1/2, ly-1/2, z - 1/2], // V1
                                [x + 1/2, ly-1/2, z + 1/2], // V2
                                [x - 1/2, ly-1/2, z + 1/2], // V3
                                [x - 1/2, lasty+1/2, z - 1/2],    // V4
                                [x + 1/2, lasty+1/2, z - 1/2],    // V5
                                [x + 1/2, lasty+1/2, z + 1/2],    // V6
                                [x - 1/2, lasty+1/2, z + 1/2]     // V7
                            ];
                            const indices = [
                                0, 1, 2, 0, 2, 3,
                                4, 5, 6, 4, 6, 7,
                                3, 2, 6, 3, 6, 7,
                                0, 4, 5, 0, 5, 1,
                                0, 3, 7, 0, 7, 4,
                                1, 5, 6, 1, 6, 2
                            ];
                            for(let i = 0; i < indices.length; i += 3) {
                                const v0 = new AmmoModule.btVector3(vertices[indices[i]][0], vertices[indices[i]][1], vertices[indices[i]][2]);
                                const v1 = new AmmoModule.btVector3(vertices[indices[i + 1]][0], vertices[indices[i + 1]][1], vertices[indices[i + 1]][2]);
                                const v2 = new AmmoModule.btVector3(vertices[indices[i + 2]][0], vertices[indices[i + 2]][1], vertices[indices[i + 2]][2]);
                                
                                triangleShape.addTriangle(v0, v1, v2, true);
                                flag = true;
                                Ammo.destroy(v0), Ammo.destroy(v1), Ammo.destroy(v2);
                            }
                            console.log(x, z, ly, lasty);
                            count += 1;
                        }
                        ly = y;
                    }
                    lasty = y;
                }
            }
        }
        console.log("count = ", count);
        return flag;
    }
    genBlock(playerId: number, bid: string) {
        const triangleShape = new Ammo.btTriangleMesh();

        let flag = false;
        flag = flag || this.addToCompoundShape(triangleShape, U.modifyMinecraftBlock(bid, [0, 0, 0]));

        /*for(let dx=-1;dx<=1;++dx)for(let dy=-1;dy<=1;++dy)for(let dz=-1;dz<=1;++dz) {
            flag = flag || this.addToTriangleMesh(triangleMesh, U.modifyMinecraftBlock(bid, [dx, dy, dz]));
        }*/
        if(!flag) return;
        console.log("flag = ", flag);

        const bodyinfo = U.getRigidBodyConstructionInfo(0, new Ammo.btBvhTriangleMeshShape(triangleShape, true));
        const body = new Ammo.btRigidBody(bodyinfo);

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(this.position);
        const motionState = body.getMotionState();
        motionState.setWorldTransform(transform);
        body.setMotionState(motionState);
        console.log("hello!!!");U.printV(U.getPos(body));

        body.setRestitution(0.8);
        this.blocks.set(playerId, body);
        
        body.setUserIndex(this.entity()!.id);
        this.physicsWorld.addRigidBody(body, 1 << this.entity()!.room, 1 << this.entity()!.room);
        //Ammo.destroy(triangleMeshShape);
        Ammo.destroy(bodyinfo);
        console.log("end");
        //Ammo.destroy(transform), Ammo.destroy(motionState);
    }
    delBlock(playerId: number) {
        const body = this.blocks.get(playerId);
        if(body) {
            this.physicsWorld.removeRigidBody(body);
            this.physicsWorld.removeCollisionObject(body);
        }
    }
}

export class ChatHistory extends C.Component {
    constructor(history: C.PlayerChat[]) { super(); }
};

export * from '@shared/component'

