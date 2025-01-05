import * as C from '@/component'
import * as E from '@shared/component/event'
import { Entity } from '@shared/basic'
import { EntitySystem, EventSystem } from '@shared/system'

import { PhysicsSystem } from '@/system/testgame/PhysicsSystem'
import { AssetSystem } from '@/system/AssetSystem'
import { WebSocketSystem } from '@/system/WebSocketSystem'
import { PlayerSystem } from './PlayerSystem'
import { GridSystem } from '../GridSystem'

import { Ammo, AmmoModule } from '@shared/utils/ammo'
import * as U from './utils'
import { diff } from '@shared/utils/basic'
import { SPRITE_STATE,
    LEVEL0_Config,
    LEVEL1_Config,
    LEVEL2_Config,
    LEVEL3_Config,
    LEVEL_Config,
    Config, GRID_TYPE, CollisionFlags, INGREDIENT_PROPERTY } from '@shared/constant'

async function generateLevel(
    Config: LEVEL_Config,
    room: number,
    gridSystem: GridSystem,
    physicsSystem: PhysicsSystem
) {
    for(const a of Config.tools) {
        if(a.type == "lantern") {
            const light = new Entity(room);
            const state = SPRITE_STATE.NONE;
            light.set(new C.Sprite("light", undefined, state));
            light.send(new C.SpriteInfo("light", state));
            light.send(new C.Lantern(a.position));
        } else if(a.type == "gun") {
            const gun = new Entity(room);
            const path = 'public/assets/tool/gun/gun.glb';
            const bodyinfo = U.getRigidBodyConstructionInfo(1, new Ammo.btSphereShape(0.4));
            bodyinfo.set_m_linearDamping(0.5);
            const body = new Ammo.btRigidBody(bodyinfo);
            const state = SPRITE_STATE.COLLIDE | SPRITE_STATE.UPDATE_PHYSICS | SPRITE_STATE.CATCHABLE;
            body.setCcdMotionThreshold(0.001);
            body.setCcdSweptSphereRadius(0.01);
            gun.set(new C.Sprite(`gun`, body, state));
            gun.send(new C.SpriteInfo(`gun`, state));
            gun.send(new C.SetMeshByPath(path));
            gun.receive(new C.SetPhysicsTransform(a.position));
            gun.set(new C.Gun());
        }
    }
    /*{
        const tree=new Entity(room);
        const state=SPRITE_STATE.NONE;
        tree.set(new C.Sprite("tree", undefined, state));
        tree.send(new C.SpriteInfo("tree", state));
        tree.send(new C.SetMeshByPath("assets/christmas_tree/christmas_tree_polycraft.glb",{scale:0.01}));
        tree.send(new C.MeshPhongMaterial(new C.Color(0,0,0)));
        tree.send(new C.SetMeshTransform(new C.Vector3(100,12.5,6)));
    }*/
    if(Config.level_path) {
        const world = new Entity(room);
        const path = Config.level_path;
        const bodyinfo = U.getRigidBodyConstructionInfo(0, U.TriangleShapeByMesh(await AssetSystem.get(path)));
        const body = new Ammo.btRigidBody(bodyinfo);
        body.setRestitution(0.8);
        const state = SPRITE_STATE.COLLIDE;
        world.set(new C.Sprite(Config.level_name, body, state));
        world.send(new C.SpriteInfo(Config.level_name, state));
        world.send(new C.SetMeshByPath(path, {minecraft: true}));
        world.receive(new C.SetPhysicsTransform(Config.roomPosition, undefined, undefined));

        /*const world = new Entity(room);
        const path = Config.level_path;
        const state = SPRITE_STATE.COLLIDE;
        world.set(new C.MinecraftWorld(await AssetSystem.get(path), Config.roomPosition.getAmmo(), physicsSystem.world));
        world.set(new C.Sprite(`world`, undefined, state));
        world.send(new C.SpriteInfo("world", state));
        world.send(new C.SetMeshByPath(path, {minecraft: true}));
        world.send(new C.SetMeshTransform(Config.roomPosition, undefined, undefined));*/
    }

    // Configure food storage places in level one
    if(Config.tips) {
        for (const storageItem of Config.tips) {
            const { position, str } = storageItem;

            const tips = new Entity(room);
            const halfExtents = new Ammo.btVector3(0.50, 0.50, 0.50); // Half extents for a unit cube
            const bodyinfo = U.getRigidBodyConstructionInfo(0, new Ammo.btBoxShape(halfExtents));
            bodyinfo.set_m_linearDamping(0);
            bodyinfo.set_m_restitution(0);

            const body = new Ammo.btRigidBody(bodyinfo);
            body.setCollisionFlags(body.getCollisionFlags() | 4);
            const state = SPRITE_STATE.NONE | SPRITE_STATE.DETECTOR;
            const spriteinfo = `tips`
            tips.set(new C.Sprite(spriteinfo, body, state));
            tips.send(new C.SpriteInfo(spriteinfo, state));
            tips.send(new C.SetMesh(new C.BoxGeometry(1, 1, 1), new C.DetectorMaterial(1,1,1)));
            tips.receive(new C.SetPhysicsTransform(position, undefined, undefined));
            tips.send(new C.Tips(str));
            //console.log((plane.getR(C.SetPhysicsTransform) as C.SetPhysicsTransform).position, item);
            //console.log("set position = ",realPosition);
        }
    }

    for (const storageItem of Config.storage) {
        const { position, item } = storageItem;
        const realPosition = new C.Vector3(); realPosition.clone(position);
        realPosition.add(Config.roomPosition).add(new C.Vector3(0,0.53,0));

        const plane = new Entity(room);
        const halfExtents = new Ammo.btVector3(0.50, 0.02, 0.50); // Half extents for a unit cube
        const bodyinfo = U.getRigidBodyConstructionInfo(0, new Ammo.btBoxShape(halfExtents));
        bodyinfo.set_m_linearDamping(0);
        bodyinfo.set_m_restitution(0);

        const body = new Ammo.btRigidBody(bodyinfo);
        body.setCollisionFlags(body.getCollisionFlags() | 4);
        const state = SPRITE_STATE.NONE | SPRITE_STATE.DETECTOR;
        const spriteinfo = INGREDIENT_PROPERTY[item].name + ` detector`
        plane.set(new C.Sprite(spriteinfo, body, state));
        plane.send(new C.SpriteInfo(spriteinfo, state));
        plane.send(new C.SetMesh(new C.BoxGeometry(1, 0.20, 1), new C.DetectorMaterial(1,0.20,1)));
        plane.receive(new C.SetPhysicsTransform(realPosition, undefined, undefined));
        plane.set(new C.SpawnOnCatch(item));
        //console.log((plane.getR(C.SetPhysicsTransform) as C.SetPhysicsTransform).position, item);
        //console.log("set position = ",realPosition);
    }

    // Configure stacking places in level one
    for (const position of Config.flatPositions) {
        const realPosition = new C.Vector3(); realPosition.clone(position);
        realPosition.add(Config.roomPosition).add(new C.Vector3(0,0.5 + 0.2 + 0.25 + 0.02 ,0));
        const plane = new Entity(room);
        const halfExtents = new Ammo.btVector3(0.49, 0.25, 0.49); // Half extents for a unit cube
        const bodyinfo = U.getRigidBodyConstructionInfo(0, new Ammo.btBoxShape(halfExtents));
        bodyinfo.set_m_linearDamping(0);
        bodyinfo.set_m_restitution(0);
        gridSystem.grids.set(realPosition,[]);
        gridSystem.gridsType.set(realPosition,GRID_TYPE.FLAT);

        const body = new Ammo.btRigidBody(bodyinfo);
        body.setCollisionFlags(body.getCollisionFlags() | 4);
        const state = SPRITE_STATE.NONE | SPRITE_STATE.DETECTOR;
        const spriteinfo = 'flat placing detector'
        plane.set(new C.Sprite(spriteinfo, body, state));
        plane.send(new C.SpriteInfo(spriteinfo, state));
        plane.send(new C.SetMesh(new C.BoxGeometry(1,0.5,1), new C.DetectorMaterial(1,0.5,1)));
        plane.receive(new C.SetPhysicsTransform(realPosition, undefined, undefined));
        plane.set(new C.positionOnPlacing(realPosition))
        //console.log((plane.getR(C.SetPhysicsTransform) as C.SetPhysicsTransform).position);
        //console.log("set position = ",realPosition);
    }

    // Configure knive_detectors cutting places in level one
    for (const position of Config.knive_detectors) {
        let knifePosition = undefined;
        {
            const realPosition = new C.Vector3(); realPosition.clone(position);
            realPosition.add(Config.roomPosition).add(new C.Vector3(0,0.4 + 0.25 + 0.02 ,0));
            knifePosition = realPosition;
            const plane = new Entity(room);
            const halfExtents = new Ammo.btVector3(0.49, 0.25, 0.49); // Half extents for a unit cube
            const bodyinfo = U.getRigidBodyConstructionInfo(0, new Ammo.btBoxShape(halfExtents));
            bodyinfo.set_m_linearDamping(0);
            bodyinfo.set_m_restitution(0);
            gridSystem.grids.set(realPosition,[]);
            gridSystem.gridsType.set(realPosition, GRID_TYPE.KNIFE);

            const body = new Ammo.btRigidBody(bodyinfo);
            body.setCollisionFlags(body.getCollisionFlags() | 4);
            const state = SPRITE_STATE.NONE | SPRITE_STATE.DETECTOR;
            const spriteinfo = 'knife placing detector'
            plane.set(new C.Sprite(spriteinfo, body, state));
            plane.send(new C.SpriteInfo(spriteinfo, state));
            plane.send(new C.SetMesh(new C.BoxGeometry(1,0.5,1), new C.DetectorMaterial(1,0.5,1)));
            plane.receive(new C.SetPhysicsTransform(realPosition, undefined, undefined));
            plane.set(new C.positionOnPlacing(realPosition))
            plane.set(new C.cutBoard());
        }
        /*{
            const realPosition = new C.Vector3(); realPosition.clone(position);
            realPosition.add(Config.roomPosition).dec(new C.Vector3(0,0.2,0));
            const plane = new Entity(room);
            const halfExtents = new Ammo.btVector3(0.55, 0.3, 0.55); // Half extents for a unit cube
            const bodyinfo = U.getRigidBodyConstructionInfo(0, new Ammo.btBoxShape(halfExtents));
            bodyinfo.set_m_linearDamping(0);
            bodyinfo.set_m_restitution(0);
            const body = new Ammo.btRigidBody(bodyinfo);
            body.setCollisionFlags(body.getCollisionFlags() | CollisionFlags.CF_NO_CONTACT_RESPONSE);
            const state = SPRITE_STATE.NONE | SPRITE_STATE.DETECTOR;
            const spriteinfo = 'knife cutting detector'
            plane.set(new C.Sprite(spriteinfo, body, state));
            plane.send(new C.SpriteInfo(spriteinfo, state));
            plane.send(new C.SetMesh(new C.BoxGeometry(1.1,0.5,1.1), new C.DetectorMaterial(1.1,0.5,1.1)));
            plane.receive(new C.SetPhysicsTransform(realPosition, undefined, undefined));
            plane.set(new C.knifeInfo(knifePosition));
        }*/
        //console.log((plane.getR(C.SetPhysicsTransform) as C.SetPhysicsTransform).position);
        //console.log("set position = ",realPosition);
    }
    for (const position of Config.skillets) {
        const realPosition = new C.Vector3(); realPosition.clone(position);
        realPosition.add(Config.roomPosition).add(new C.Vector3(0, 0.4 + 0.25 + 0.02 ,0));
        const skillet = U.createSprite({
            room: room,
            mass: 0,
            collision_shape: new Ammo.btBoxShape(new Ammo.btVector3(0.49, 0.25, 0.49)),
            name: `skillet placing detector`,
            sprite_state: SPRITE_STATE.NONE | SPRITE_STATE.DETECTOR,
            linear_damping: 0,
            restitution: 0,
            no_contact_response: true,
        });
        gridSystem.grids.set(realPosition, []);
        gridSystem.gridsType.set(realPosition, GRID_TYPE.SKILLET);
        skillet.send(new C.SetMesh(new C.BoxGeometry(1,0.5,1), new C.DetectorMaterial(1,0.5,1)));
        skillet.receive(new C.SetPhysicsTransform(realPosition, undefined, undefined));
        skillet.set(new C.positionOnPlacing(realPosition));
        skillet.set(new C.Skillet());
    }
    for(const position of Config.knives) {
        const knife = U.createSprite({
            room: room,
            mass: 1,
            collision_shape: new Ammo.btCapsuleShape(0.2, 0.8),
            name: `knife`,
            sprite_state: SPRITE_STATE.COLLIDE | SPRITE_STATE.UPDATE_PHYSICS | SPRITE_STATE.CATCHABLE,
            linear_damping: 0.5,
            restitution: 0.8,
            ccd_threshold: 0.1,
            ccd_radius: 0.1
        });
        knife.send(new C.SetMeshByPath("assets/tool/knife/knife.glb", {scale: 0.005}));
        knife.receive(new C.SetPhysicsTransform(position.copy().add(Config.roomPosition).add(new C.Vector3(0, 1, 0)), undefined, undefined));
        knife.set(new C.knifeInfo(new C.Vector3(0,0,0)));
    }

    // Configure serving area in level one
    for (const position of Config.servingArea) {
        const realPosition = new C.Vector3(); realPosition.clone(position);
        realPosition.add(Config.roomPosition).add(new C.Vector3(0, 0.5 + 0.25 + 0.02 + 0.2 ,0));
        const plane = new Entity(room);
        const halfExtents = new Ammo.btVector3(0.49, 0.25, 0.49); // Half extents for a unit cube
        const bodyinfo = U.getRigidBodyConstructionInfo(0, new Ammo.btBoxShape(halfExtents));
        bodyinfo.set_m_linearDamping(0);
        bodyinfo.set_m_restitution(0);
        gridSystem.grids.set(realPosition,[]);
        gridSystem.gridsType.set(realPosition,GRID_TYPE.SERVING);

        const body = new Ammo.btRigidBody(bodyinfo);
        body.setCollisionFlags(body.getCollisionFlags() | 4);
        const state = SPRITE_STATE.NONE | SPRITE_STATE.DETECTOR;
        const spriteinfo = 'serving detector'
        plane.set(new C.Sprite(spriteinfo, body, state));
        plane.send(new C.SpriteInfo(spriteinfo, state));
        plane.send(new C.SetMesh(new C.BoxGeometry(1,0.5,1), new C.DetectorMaterial(1,0.5,1)));
        plane.receive(new C.SetPhysicsTransform(realPosition, undefined, undefined));
        plane.set(new C.positionOnPlacing(realPosition));
        //console.log((plane.getR(C.SetPhysicsTransform) as C.SetPhysicsTransform).position);
        //console.log("set position = ",realPosition);
    }

    for(const data of Config.faces) {
        const {position, name} = data;
        const plane = new Entity(room);
        const state = SPRITE_STATE.NONE | SPRITE_STATE.NO_RAYTEST;
        plane.set(new C.Sprite("face:" + name, undefined, state));
        plane.send(new C.SpriteInfo("face:" + name, state));
        plane.send(new C.TexturePlane(name, position.copy().add(Config.roomPosition)));
    }
}

export class TestGame {
    physicsSystem: PhysicsSystem
    playerSystem: PlayerSystem
    gridSystem: GridSystem
    players: Entity[]
    generatePosition: C.Vector3
    timeStamp = 0
    constructor(public room: number, public level: number) {
        console.log("generate game", room, level);
        this.physicsSystem = new PhysicsSystem(room);
        this.playerSystem = new PlayerSystem();
        this.gridSystem = new GridSystem();
        this.players = [];
        this.generatePosition = new C.Vector3(0, 0, 0);
    }
    async init() {
        /*for(let j=1;j<=5;++j)
        {
            const ball = U.createSprite({
                room: this.room,
                mass: 0.1,
                collision_shape: new Ammo.btSphereShape(j/5),
                name: `ball${j}`,
                sprite_state: SPRITE_STATE.COLLIDE | SPRITE_STATE.UPDATE_PHYSICS | SPRITE_STATE.CATCHABLE,
                linear_damping: 0.5,
                restitution: 0.8,
                ccd_threshold: 0.1,
                ccd_radius: j/20
            });
            ball.send(new C.SetMesh(new C.SphereGeometry(j/5), new C.MeshPhongMaterial(new C.Color(1, 0, 0))));
            ball.receive(new C.SetPhysicsTransform(new C.Vector3(0, 40, -40), undefined, undefined));
        }*/
        // Add a tool cube
        {
            const halfExtents = new Ammo.btVector3(0.5, 0.5, 0.5); // Half extents for a unit cube
            const cube = U.createSprite({
                room: this.room,
                mass: 1,
                collision_shape: new Ammo.btBoxShape(halfExtents),
                name: `cube tool`,
                sprite_state: SPRITE_STATE.COLLIDE | SPRITE_STATE.UPDATE_PHYSICS | SPRITE_STATE.CATCHABLE,
                linear_damping: 0.5,
                restitution: 0.8,
                ccd_threshold: 0.001,
                ccd_radius: 0.2,
            });
            cube.send(new C.SetMesh(new C.BoxGeometry(1,1,1), new C.MeshPhongMaterial(new C.Color(0, 1, 0))));
            cube.receive(new C.SetPhysicsTransform(new C.Vector3(0, 40, -40), undefined, undefined));
            //ball.set(new C.SetMeshTransform(new C.Vector3(0, 40, -40), undefined, undefined));
        }
        {
            /*const world = new Entity(this.room);
            const path = 'public/assets/main_world/main_world.glb';
            const bodyinfo = U.getRigidBodyConstructionInfo(0, U.TriangleShapeByMesh(await AssetSystem.get(path)));
            const body = new Ammo.btRigidBody(bodyinfo);
            body.setRestitution(0.8);
            const state = SPRITE_STATE.COLLIDE;
            world.set(new C.Sprite(`world`, body, state));
            world.send(new C.SpriteInfo("world", state));
            world.send(new C.SetMeshByPath(path, {minecraft:true})); //world.send(new C.MeshPhongMaterial(new C.Color(0,0,0)));
            world.receive(new C.SetPhysicsTransform(new C.Vector3(0, 0, 0), undefined, undefined));*/

            /*const world = new Entity(this.room);
            const path = 'public/assets/test_building/test_building.glb';
            const state = SPRITE_STATE.COLLIDE;
            world.set(new C.MinecraftWorld(await AssetSystem.get(path), new Ammo.btVector3(0, -200, 0), this.physicsSystem.world));
            world.set(new C.Sprite(`world`, undefined, state));
            world.send(new C.SpriteInfo("world", state));
            world.send(new C.SetMeshByPath(path, {minecraft: true}));
            world.send(new C.SetMeshTransform(new C.Vector3(0, -200, 0), undefined, undefined));*/
        }
        {
            if(this.level == 0) {
                generateLevel(LEVEL0_Config, this.room, this.gridSystem, this.physicsSystem);
                this.generatePosition = LEVEL0_Config.generatePosition;
                
                const world = new Entity(this.room);
                const path = "public/assets/main_world/main_world.glb";
                const bodyinfo = U.getRigidBodyConstructionInfo(0, U.TriangleShapeByMesh(await AssetSystem.get(path)));
                const body = new Ammo.btRigidBody(bodyinfo);
                body.setRestitution(0.8);
                const state = SPRITE_STATE.COLLIDE;
                world.set(new C.Sprite("level0_world", body, state));
                world.send(new C.SpriteInfo("level0_world", state));
                world.send(new C.SetMeshByPath(path, {minecraft: true}));
                world.receive(new C.SetPhysicsTransform(new C.Vector3(0,0,0), undefined, undefined));
            } else if(this.level == 1) {
                generateLevel(LEVEL1_Config, this.room, this.gridSystem, this.physicsSystem);
                this.generatePosition = LEVEL1_Config.generatePosition;
            } else if(this.level == 2) {
                generateLevel(LEVEL2_Config, this.room, this.gridSystem, this.physicsSystem);
                this.generatePosition = LEVEL2_Config.generatePosition;
                /*const world = new Entity(this.room);
                const path = 'public/assets/test_building/test_building.glb';
                const state = SPRITE_STATE.COLLIDE;
                //world.set(new C.MinecraftWorld(await AssetSystem.get(path), new Ammo.btVector3(0, -200, 0), this.physicsSystem.world));
                world.set(new C.Sprite(`world`, undefined, state));
                world.send(new C.SpriteInfo("world", state));
                world.send(new C.SetMeshByPath(path, {minecraft: true}));
                world.send(new C.SetMeshTransform(new C.Vector3(0, -200, 0), undefined, undefined));*/
            } else if(this.level == 3) {
                generateLevel(LEVEL3_Config, this.room, this.gridSystem, this.physicsSystem);
                this.generatePosition = LEVEL3_Config.generatePosition;
            }
            //generateLevel(LEVEL1_Config.roomPosition, LEVEL1_Config, this.room);
            //generateLevel(LEVEL2_Config.roomPosition, LEVEL2_Config, this.room, this.gridSystem, this.physicsSystem);
            
            /*{
                console.log("[TestGame] Adding a car!");
                const entity = new Entity(this.room);
                const collide = new Ammo.btCompoundShape();
                function addSide(x: number, y: number, z: number, r: number) {
                    const wheel = new Ammo.btSphereShape(r);
                    const sideTransform = new Ammo.btTransform();
                    sideTransform.setIdentity();
                    sideTransform.setOrigin(new Ammo.btVector3(x, y, z));
                    collide.addChildShape(sideTransform, wheel);
                };
                function addSide2(x: number, y: number, z: number, xx: number, yy:number, zz:number) {
                    const box = new Ammo.btBoxShape(new Ammo.btVector3(xx/2,yy/2,zz/2));
                    const sideTransform = new Ammo.btTransform();
                    sideTransform.setIdentity();
                    sideTransform.setOrigin(new Ammo.btVector3(x, y, z));
                    collide.addChildShape(sideTransform, box);
                };
                const len = 5;
                const transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin(new Ammo.btVector3(0, 0, 0));
                collide.addChildShape(transform,new Ammo.btBoxShape(new Ammo.btVector3(len, 0.2, len)));

                addSide(len,-0.8,0,0.25);
                addSide(-len,-0.8,0,0.25);
                addSide(0,-0.8,len,0.25);
                addSide(0,-0.8,-len,0.25);

                addSide2(len-1,1,0,0.1,4,len*2);
                addSide2(-len+1,1,0,0.1,4,len*2);
                addSide2(0,1,len-1,len*2,4,0.1);
                addSide2(0,1,-len+1,len*2,4,0.1);

                const bodyinfo = U.getRigidBodyConstructionInfo(1, collide);
                bodyinfo.set_m_linearDamping(0);
                bodyinfo.set_m_restitution(0);

                const body = new Ammo.btRigidBody(bodyinfo);
                const state = SPRITE_STATE.COLLIDE | SPRITE_STATE.UPDATE_PHYSICS | SPRITE_STATE.CATCHABLE;
                body.setCcdMotionThreshold(0.001);
                body.setCcdSweptSphereRadius(len/2);
                body.setAngularFactor(new Ammo.btVector3(0,0.1,0));
                body.setFriction(0);
                entity.set(new C.Sprite(`car!`, body, state));
                entity.send(new C.SpriteInfo(`car!`, state));
                entity.send(new C.SetMesh(new C.BoxGeometry(len*2,0.4,len*2), new C.MeshPhongMaterial(new C.Color(0, 0, 1))));
                entity.receive(new C.SetPhysicsTransform(new C.Vector3(-40, 40, 10), undefined, undefined));
            }*/
        }
        /*for(let j=0;j<=1;++j)
        {
            const ball = new Entity(this.room);
            const path = 'public/assets/food/tomato/tomato.glb';
            const bodyinfo = U.getRigidBodyConstructionInfo(1, new Ammo.btSphereShape(0.35));
            bodyinfo.set_m_linearDamping(0.5);
            const body = new Ammo.btRigidBody(bodyinfo);
            const state = SPRITE_STATE.COLLIDE | SPRITE_STATE.UPDATE_PHYSICS | SPRITE_STATE.CATCHABLE;
            body.setCcdMotionThreshold(0.001);
            body.setCcdSweptSphereRadius(0.1);
            ball.set(new C.Sprite(`tomato${j}`, body, state));
            ball.send(new C.SpriteInfo(`tomato${j}`, state));
            ball.send(new C.SetMeshByPath(path, 0.5));
            ball.receive(new C.SetPhysicsTransform(new C.Vector3(0, 40 + j * 10, -40), undefined, undefined));
            //ball.set(new C.SetMeshTransform(new C.Vector3(0, 40, -40), undefined, undefined));
        }
        for(let j=0;j<=3;++j)
        {
            const ball = new Entity(this.room);
            const path = 'public/assets/food/tomato_slice/tomato_slice.glb';
            const bodyinfo = U.getRigidBodyConstructionInfo(1, new Ammo.btCylinderShape(new Ammo.btVector3(0.777, 0.266, 0.777)));
            bodyinfo.set_m_linearDamping(0.5);
            const body = new Ammo.btRigidBody(bodyinfo);
            const state = SPRITE_STATE.COLLIDE | SPRITE_STATE.UPDATE_PHYSICS | SPRITE_STATE.CATCHABLE;
            body.setCcdMotionThreshold(0.001);
            body.setCcdSweptSphereRadius(0.1);
            ball.set(new C.Sprite(`tomato${j}`, body, state));
            ball.send(new C.SpriteInfo(`tomato${j}`, state));
            ball.send(new C.SetMeshByPath(path));
            ball.receive(new C.SetPhysicsTransform(new C.Vector3(0, 40 + j * 10, -40), undefined, undefined));
            //ball.set(new C.SetMeshTransform(new C.Vector3(0, 40, -40), undefined, undefined));
        }
        for(let j=0;j<=1;++j)
        {
            const entity = new Entity(this.room);
            const path = 'public/assets/plate/plate.glb';
            const bodyinfo = U.getRigidBodyConstructionInfo(1, new Ammo.btCylinderShape(new Ammo.btVector3(0.99, 0.22, 0.99)));
            bodyinfo.set_m_linearDamping(0.5);
            const body = new Ammo.btRigidBody(bodyinfo);
            const state = SPRITE_STATE.COLLIDE | SPRITE_STATE.UPDATE_PHYSICS | SPRITE_STATE.CATCHABLE;
            body.setCcdMotionThreshold(0.001);
            body.setCcdSweptSphereRadius(0.1);
            body.setAngularFactor(new Ammo.btVector3(0,0,0));
            entity.set(new C.Sprite(`plate${j}`, body, state));
            entity.send(new C.SpriteInfo(`plate${j}`, state));
            entity.send(new C.SetMeshByPath(path));
            entity.receive(new C.SetPhysicsTransform(new C.Vector3(0, 40, -40), undefined, undefined));
        }*/
        /*for(let j=0;j<=5;++j){
            const gun = new Entity(this.room);
            const path = 'public/assets/tool/gun/gun.glb';
            const bodyinfo = U.getRigidBodyConstructionInfo(1, new Ammo.btSphereShape(0.4));
            bodyinfo.set_m_linearDamping(0.5);
            const body = new Ammo.btRigidBody(bodyinfo);
            const state = SPRITE_STATE.COLLIDE | SPRITE_STATE.UPDATE_PHYSICS | SPRITE_STATE.CATCHABLE;
            body.setCcdMotionThreshold(0.001);
            body.setCcdSweptSphereRadius(0.01);
            gun.set(new C.Sprite(`gun${j}`, body, state));
            gun.send(new C.SpriteInfo(`gun${j}`, state));
            gun.send(new C.SetMeshByPath(path));
            gun.receive(new C.SetPhysicsTransform(new C.Vector3(0, 5, -40), undefined, undefined));
            gun.set(new C.Gun());
        }*/
    }
    removePlayers() { // 这个函数和addPlayers只在GameSystem中使用，且removePlayers先用,addPlayers后用
        const entities = EntitySystem.getEntityByRoom(this.room);
        const newPlayers: Entity[] = [];
        for(const entity of entities) {
            const playerInfo = entity.get(C.Player); if(!playerInfo) continue;
            newPlayers.push(entity);
        }
        const [adds, dels] = diff(this.players, newPlayers);
        for(const entity of dels) this.removePlayer(entity, this.physicsSystem.world);
    }
    addPlayers() {
        const entities = EntitySystem.getEntityByRoom(this.room);
        const newPlayers: Entity[] = [];
        for(const entity of entities) {
            const playerInfo = entity.get(C.Player); if(!playerInfo) continue;
            newPlayers.push(entity);
        }
        const [adds, dels] = diff(this.players, newPlayers);
        for(const entity of adds) this.addPlayer(entity);
        this.players = newPlayers;
    }

    update() {
        const now = Date.now();
        const dt = (now - this.timeStamp) / 1000;
        this.timeStamp = now;

        const entities = EntitySystem.getEntityByRoom(this.room);
        this.playerSystem.update(entities, dt, this.physicsSystem.world, this.gridSystem);
        this.physicsSystem.update(entities, dt, this.timeStamp);
        this.gridSystem.update(entities, dt, this.physicsSystem.world);
    }
    addPlayer(playerEntity: Entity) {
        console.log("[TestGame] addPlayer TestGame!", this.room, playerEntity.id);
        WebSocketSystem.broadcast(this.room, [new E.EntityAddedEvent(this.room, playerEntity.id)]);
        playerEntity.get(C.Player)!.sendProps();
        const entity = new Entity(this.room);
        const path = 'public/assets/main_character/minecraft_idle_and_walking_animation.glb';
        const scale = 1;
        const capsuleShape = new Ammo.btCapsuleShape(0.4 * scale, 1.3 * scale);
        const collide = new Ammo.btCompoundShape();
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(0, 0.95 * scale, 0));
        collide.addChildShape(transform, capsuleShape);
        //const collide = BoxShapeByMesh(AssetSystem.get(path));
        const bodyinfo = U.getRigidBodyConstructionInfo(10, collide);
        //bodyinfo.set_m_friction(0.5);
        const body = new Ammo.btRigidBody(bodyinfo);
        body.setCcdMotionThreshold(0.001);
        body.setCcdSweptSphereRadius(2);
        const vec = new Ammo.btVector3(0, 0, 0); body.setAngularFactor(vec), Ammo.destroy(vec);
		body.setActivationState(4);
        const state = SPRITE_STATE.COLLIDE | SPRITE_STATE.UPDATE_PHYSICS;
        entity.set(new C.Sprite(`playerEntity`, body, state, false, true));
        entity.send(new C.SpriteInfo(`playerEntity`, state));
        entity.send(new C.PlayAnimation("still_test"));
        entity.set(new C.PlayerCatch(undefined, undefined));
        entity.send(new C.SetMeshByPath(path, {scale: scale}));
        console.log("testgamegenerateposition", this.room, this.generatePosition);
        entity.receive(new C.SetPhysicsTransform(this.generatePosition, undefined));
        //entity.set(new C.SetPhysicsTransform(new C.Vector3(0, 50, 0)));

        const player = playerEntity.get(C.Player)!;
        player.setConnectId(entity.id);
        player.sendProps();

        const entities = EntitySystem.getEntityByRoom(this.room);
        for(const entity of entities) {
            const events: E.MyEvent[] = []
            //console.log("hello!", (entity.getAllS()).length);
            events.push(new E.EntityAddedEvent(this.room, entity.id));
            const list: C.UComponent[] = [];
            for(const comp of entity.getAllS()) {
                if(!(comp instanceof C.PlayerChat)) {
                    list.push(comp);
                }
            }
            events.push(new E.ComponentSetEvent(entity.id, list));
            WebSocketSystem.send(playerEntity.id, events);
        }
    }
    removePlayer(player: Entity, physicsWorld: AmmoModule.btDiscreteDynamicsWorld) {
        console.log("removePlayer TestGame!", this.room, player.id);
        const playerConnectId = player.get(C.Player)!.connectId; if(!playerConnectId) return;
        const entity = EntitySystem.get(playerConnectId); if(!entity) return;
        const playerCatch = entity.get(C.PlayerCatch);
        if(playerCatch) {
            console.log("removeConstraint");
            playerCatch.removeConstraint(physicsWorld);
        }
        //console.log("remove ", entity.id);

        const events: E.MyEvent[] = [];
        events.push(new E.EntityRemovedEvent(entity.room, entity.id));
        console.log("use entity.removeEntity()");
        entity.removeEntity();

        const entities = EntitySystem.getEntityByRoom(this.room);
        for(const entity of entities) {
            //console.log("remove ", entity.id);
            events.push(new E.EntityRemovedEvent(entity.room, entity.id));
        }
        WebSocketSystem.send(player.id, events);

        const minecraftWorlds = EntitySystem.getAll(C.MinecraftWorld);
        for(const minecraftWorld of minecraftWorlds) {
            minecraftWorld.get(C.MinecraftWorld)!.delBlock(playerConnectId);
        }
    }
    remove() {
        
    }
};