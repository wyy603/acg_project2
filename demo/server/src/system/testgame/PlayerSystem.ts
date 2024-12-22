import * as THREE from 'three';
import { Ammo, AmmoModule } from '@shared/utils/ammo'
import * as C from '@/component'
import * as E from '@shared/component/event'
import { Entity } from '@shared/basic'
import { EntitySystem, EventSystem } from '@shared/system'
import * as U from './utils'
import { SPRITE_STATE, CAMERA_OFFSET, CATCH_TYPE } from '@shared/constant'
import { spawnRawFood } from './utils';
import { PLAYER_MOVEMENT, INGREDIENT_PROPERTY } from '@shared/constant'
import { GridSystem } from '../GridSystem';
import { Config, INGREDIENT } from '@shared/constant';
import { positionGeometry } from 'three/webgpu';
import { GameSystem } from '../GameSystem';
import { OvercraftSystemBasic } from '@shared/basic/OvercraftSystemBasic';
import { OvercraftSystemServer } from '../OvercraftSystem';

function shoot1(player: Entity, origin: C.Vector3, direction: C.Vector3) {
    const gunTime = player.get(C.GunTime)!;
    if(gunTime.time == 0)
    {
        gunTime.time = 16;
        const ball = new Entity(player.room);
        const bodyinfo = U.getRigidBodyConstructionInfo(1, new Ammo.btSphereShape(0.2));
        bodyinfo.set_m_linearDamping(0.5);
        bodyinfo.set_m_restitution(0.8);
        
        const body = new Ammo.btRigidBody(bodyinfo);
        const state = SPRITE_STATE.COLLIDE | SPRITE_STATE.UPDATE_PHYSICS | SPRITE_STATE.CATCHABLE;
        body.setCcdMotionThreshold(0.001);
        body.setCcdSweptSphereRadius(0.2);
        ball.set(new C.Sprite('bullet'+player.id, body, state));
        ball.send(new C.SpriteInfo('bullet'+player.id, state));
        ball.send(new C.SetMesh(new C.SphereGeometry(0.4), new C.MeshPhongMaterial(new C.Color(0, 1, 0))));
        ball.receive(new C.SetPhysicsTransform(origin.copy().add(direction.copy().muls(5)), undefined, undefined));
        const speed = direction.copy().muls(300);
        console.log(speed.x,speed.y,speed.z);
        ball.receive(new C.SetPhysicsMovement(new C.LinearVelocity(speed.x,speed.y,speed.z)));
        console.log("a ball was shooted!")
        setTimeout(() => {
            EventSystem.addEvent(new E.EntityRemovedEvent(player.room, ball.id));
            console.log("The ball was removed!");
        }, 1500);
    }
}

function shoot2(player: Entity, origin: C.Vector3, direction: C.Vector3) {
    const gunTime = player.get(C.GunTime)!;
    if(gunTime.time == 0)
    {
        gunTime.time = 64;
        const ball = new Entity(player.room);
        const bodyinfo = U.getRigidBodyConstructionInfo(1.2, new Ammo.btSphereShape(0.6));
        bodyinfo.set_m_linearDamping(0.5);
        bodyinfo.set_m_restitution(0.8);
        
        const body = new Ammo.btRigidBody(bodyinfo);
        const state = SPRITE_STATE.COLLIDE | SPRITE_STATE.UPDATE_PHYSICS | SPRITE_STATE.CATCHABLE;
        body.setCcdMotionThreshold(0.001);
        body.setCcdSweptSphereRadius(0.4);
        ball.set(new C.Sprite('bullet'+player.id, body, state));
        ball.send(new C.SpriteInfo('bullet'+player.id, state));
        ball.send(new C.SetMesh(new C.SphereGeometry(0.6), new C.MeshPhongMaterial(new C.Color(1, 0, 0))));
        ball.receive(new C.SetPhysicsTransform(origin.copy().add(direction.copy().muls(5)), undefined, undefined));
        const speed = direction.copy().muls(800);
        console.log(speed.x,speed.y,speed.z);
        ball.receive(new C.SetPhysicsMovement(new C.LinearVelocity(speed.x,speed.y,speed.z)));
        console.log("a ball was shooted!")
        setTimeout(() => {
            EventSystem.addEvent(new E.EntityRemovedEvent(player.room, ball.id));
            console.log("The ball was removed!");
        }, 500);
    }
}

function rayTest(playerCamera: C.PlayerCamera, l: number, r: number, physicsWorld: AmmoModule.btDiscreteDynamicsWorld, entities: Entity[]) {
    const origin = playerCamera.origin.getAmmo();
    const direction = playerCamera.direction.getAmmo();
    const start = U.copyV(origin).op_add(direction.op_mul(l));
    const end = U.copyV(origin).op_add(direction.op_mul(r));
    const rayCallback = new Ammo.AllHitsRayResultCallback(start, end);
    physicsWorld.rayTest(origin, end, rayCallback);

    const collisionObjects = rayCallback.get_m_collisionObjects();
    const m_hitPointWorld = rayCallback.get_m_hitPointWorld();
    const m_hitfractions = rayCallback.get_m_hitFractions();
    const numHits = collisionObjects.size();
    const bodies = Array.from({ length: numHits }, (_, i) => (Ammo as any).castObject(collisionObjects.at(i), AmmoModule.btRigidBody) as AmmoModule.btRigidBody);
    const hitPoints = Array.from({ length: numHits }, (_, i) => m_hitPointWorld.at(i));
    const distances = Array.from({ length: numHits }, (_, i) => m_hitfractions.at(i));
    Ammo.destroy(end), Ammo.destroy(rayCallback);
    return {origin: origin, direction: direction, bodies: bodies, hitPoints: hitPoints, distances: distances};
}


function handleClick(entity: Entity, entities: Entity[], physicsWorld: AmmoModule.btDiscreteDynamicsWorld, gridSystem: GridSystem) {
    console.log("handleClick");
    const player = entity.get(C.Player)!;
    const playerConnectId = player.connectId;
    if(!playerConnectId) return;
    const playerEntity = EntitySystem.get(playerConnectId);
    if(!playerEntity) return;
    const clickInput = playerEntity.getR(C.PlayerClickInput)!;
    const sprite = playerEntity.get(C.Sprite);
    
    const playerCatch = playerEntity.get(C.PlayerCatch);
    if(!sprite || !playerCatch) return;

    const catchingItem = playerCatch.catchEntity;
    const playerCamera = playerEntity.getR(C.PlayerCamera);
    if(!playerCamera) return;
    const origin = playerCamera.origin.getTHREE();
    const direction = playerCamera.direction.getTHREE();
    const rayTestEntities = clickInput.entities;
    // console.log("click entities", rayTestEntities.map(i => i.get(C.Sprite)!.name));
    const distances = clickInput.distances;
    const hitPoints = distances.map(distance => {
        return origin.clone().add(direction.clone().multiplyScalar(distance));
    });

    const b1 = sprite.body!;
    const v1 = U.getPos(b1);
    let {minEntity, catchableEntity} = U.analyzeRaytest(playerEntity);
    if(minEntity) console.log("entity2", minEntity.get(C.Sprite)!.name);

    let sprite2 = minEntity ? minEntity.get(C.Sprite)! : undefined;
    let b2 = sprite2 ? sprite2.body : undefined, v2 = sprite2 ? U.getPos(sprite2.body!) : undefined;

    function onPositionPlacing() {
        if(minEntity) {
            const Pplayer = U.getPosThree(playerEntity!);
            const Pcatch = U.getPosThree(catchingItem!);
            const P2 = U.getPosThree(minEntity);
            const positionOnPlacing = minEntity.get(C.positionOnPlacing);
            if(positionOnPlacing && ((Math.abs(Pcatch.x-P2.x)<=0.5 && Math.abs(Pcatch.z-P2.z)<=0.5 && Math.abs(Pcatch.y-P2.y)<=0.25) ||
            (Pplayer.distanceTo(P2)<=6))) {
                if(gridSystem.canPut(catchingItem!, positionOnPlacing.position)) return true;
            }
        }
        return false;
    }
    function putOnPositionOnPlacing() {
        gridSystem.onAdd(catchingItem!, minEntity!.get(C.positionOnPlacing)!.position, physicsWorld);
    }
    function onCutFood() {
        if(minEntity) {
            const Pplayer = U.getPosThree(playerEntity!);
            const Pcatch = U.getPosThree(catchingItem!);
            const P2 = U.getPosThree(minEntity);
            const cutBoard = minEntity.get(C.cutBoard);
            if(cutBoard && (Pplayer.distanceTo(P2)<=6)) {
                if(playerCatch!.catchType == CATCH_TYPE.HAND && catchingItem!.get(C.knifeInfo)) return true;
            }
        }
    }
    function cutFood() {
        const food = gridSystem.cutOnPosition(minEntity!.get(C.positionOnPlacing)!.position, physicsWorld);
        if(food) {
            playerEntity!.send(new C.PlayerStuff(food.getS(C.FoodInfo)!.cutInfo!.progress));
            catchingItem!.send(new C.PlayAnimation("KnifeCut", 10, false));
        }
    }
    function onComposeFood() {
        if(catchableEntity) {
            const foodInfo = playerCatch!.catchEntity!.getS(C.FoodInfo);
            const foodInfo2 = catchableEntity.getS(C.FoodInfo);
            const rot2 = U.getRot(catchableEntity.get(C.Sprite)!.body!);
            const vy = Math.abs(rot2.y() / Math.sqrt(1-rot2.w()*rot2.w()));
            if(foodInfo && foodInfo2 && U.canInsFood(foodInfo2, foodInfo) && vy>=0.8) {
                return true;
            }
        }
        return false;
    }
    function composeFood() {
        if(!onComposeFood()) return;
        const foodInfo = playerCatch!.catchEntity!.getS(C.FoodInfo)!;
        const foodInfo2 = catchableEntity!.getS(C.FoodInfo)!;
        U.insFood(foodInfo2, foodInfo.ingredients);
        U.updateFoodBody(catchableEntity!, physicsWorld);
        catchableEntity!.send(foodInfo2);
        playerCatch!.catchEntity!.removeEntity();
        playerCatch!.removeConstraint(physicsWorld);
    }

    if(clickInput.type == 2) {
        if(playerCatch.catchType != CATCH_TYPE.NONE) { // 当前正在抓取物品 
            // 释放物品
            console.log("[click] Uncatch!");
            playerCatch.removeConstraint(physicsWorld);
        }
    } else if(clickInput.type == 0) {
        if(playerCatch.catchType == CATCH_TYPE.NONE) {
            if (minEntity) {
                b2 = b2!, v2 = v2!, sprite2 = sprite2!;
                const vec = U.copyV(v2).op_sub(v1);
                const dist = vec.length();
                // console.log("[PlayerSystem] click!");
                if(minEntity) console.log("test entity: ", minEntity.get(C.Sprite)!.name);
                
                if(minEntity && minEntity.get(C.positionOnPlacing) && dist <= 6) { // 点击在存储区，自动切换为里面的食物
                    // console.log("[PlayerSystem] PositionOnPlacing");
                    const tmp = gridSystem.takeFood(minEntity.get(C.positionOnPlacing)!.position, physicsWorld); //直接把食物取出
                    if(tmp) catchableEntity = tmp;
                    /*if(minEntity && dist <= 6) {
                        sprite2 = minEntity.get(C.Sprite)!;
                        b2 = sprite2.body;
                        v2 = U.getPos(b2!);
                        console.log("change entity, name", sprite2.name);
                    } else { Ammo.destroy(vec); return; }*/
                }
                if(minEntity && minEntity.get(C.knifeInfo) && dist <= 6) { // 点击在刀上，切里面的食物。
                    // console.log("[PlayerSystem] knifeInfo");
                    const food = gridSystem.cutOnPosition(minEntity.get(C.knifeInfo)!.position, physicsWorld);
                    if(food) {
                        console.log("cut food");
                        playerEntity.send(new C.PlayerStuff(food.getS(C.FoodInfo)!.cutInfo!.progress));
                    }
                    return;
                }
            }
            if(catchableEntity) {
                const sprite3 = catchableEntity.get(C.Sprite)!;
                const b3 = sprite3.body, v3 = U.getPos(sprite3.body!);
                const vec = U.copyV(v3).op_sub(v1);
                const dist = vec.length();
                console.log("name", sprite3 ? sprite3.name : undefined, entities.length);
                if(player.catchType == CATCH_TYPE.CONSTRAINT && dist <= 12) {
                    console.log("constraint catch!");
                    const catchObjConstraint = new Ammo.btPoint2PointConstraint(b1, b3!, vec, new Ammo.btVector3(0,0,0));
                    b3!.activate(true);
                    physicsWorld.addConstraint(catchObjConstraint, true);
                    playerCatch.catchType = CATCH_TYPE.CONSTRAINT;
                    playerCatch.catchLen = dist;
                    playerCatch.catchEntity = catchableEntity;
                    playerCatch.catchConstraint = catchObjConstraint;
                    playerCatch.send();
                    return;
                } else if(player.catchType == CATCH_TYPE.SIMPLE && dist <= 5) {
                    console.log("simple catch!");
                    playerCatch.catchType = CATCH_TYPE.SIMPLE;
                    playerCatch.catchLen = dist;
                    playerCatch.catchEntity = catchableEntity;
                    b3!.activate(true);
                    playerCatch.send();
                    return;
                } else if(player.catchType == CATCH_TYPE.HAND && dist <= 5) {
                    playerCatch.catchType = CATCH_TYPE.HAND;
                    playerCatch.catchLen = 0;
                    playerCatch.catchEntity = catchableEntity;
                    playerCatch.send();
                    b3!.activate(true);
                    sprite3.deactivate(physicsWorld);
                    return;
                }
            }
            if(minEntity) {
                b2 = b2!, v2 = v2!, sprite2 = sprite2!;
                const vec = U.copyV(v2).op_sub(v1);
                const dist = vec.length();
                if(minEntity && minEntity.get(C.SpawnOnCatch) && dist <= 6) { // 抓到一个拥有 C.SpawnOnCatch Component 的物体，从它中生成出食物出来
                    const itemType = (minEntity.get(C.SpawnOnCatch) as C.SpawnOnCatch).ingredient;
                    const spawnedItem = spawnRawFood(itemType, minEntity.room);
                    spawnedItem.receive(new C.SetPhysicsTransform(C.Vector3.byAmmo(v2), undefined, undefined));
                    return;
                }
            }
        } else {
            console.log("click but catching:");
            if(onPositionPlacing()) {
                playerCatch.removeConstraint(physicsWorld);
                putOnPositionOnPlacing();
            } else if(onCutFood()) {
                cutFood();
            } else if(onComposeFood()) {
                console.log("onComposeFood");
                composeFood();
            }
        }
    }
}

export class PlayerSystem {
    constructor() {
        
    }
    onGround(sprite: C.Sprite, physicsWorld: AmmoModule.btDiscreteDynamicsWorld) {
        const dispatcher = physicsWorld.getDispatcher();
		for(let i = 0; i < dispatcher.getNumManifolds(); ++i) {
			const manifold = dispatcher.getManifoldByIndexInternal(i);
			const body0 = (Ammo as any).castObject(manifold.getBody0(), Ammo.btRigidBody);
            const body1 = (Ammo as any).castObject(manifold.getBody1(), Ammo.btRigidBody);
			if(body0 == sprite.body || body1 == sprite.body) {
				for(let j = 0; j < manifold.getNumContacts(); ++j) {
					const contactPoint = manifold.getContactPoint(j);
					let normal = contactPoint.get_m_normalWorldOnB();
					if(Math.abs(normal.y()) > 0.4) {
						return true;
					}
				}
			}
		}
		return false;
	}
    update(entities: Entity[], dt: number, physicsWorld: AmmoModule.btDiscreteDynamicsWorld, gridSystem: GridSystem) {
        
        for(const entity of entities) if(entity.get(C.Player)) {
            const player = entity.get(C.Player)!;
            const playerConnectId = player.connectId;
            if(!playerConnectId) continue;
            const playerEntity = EntitySystem.get(playerConnectId);
            if(!playerEntity) continue;
            const keyboardInput = playerEntity.getR(C.PlayerKeyboardInput);
            const clickInput = playerEntity.getR(C.PlayerClickInput);
            const rotateInput = playerEntity.getR(C.PlayerRotate);
            const sprite = playerEntity.get(C.Sprite);
            const playerCatch = playerEntity.get(C.PlayerCatch);
            const playerChangeName = entity.getR(C.PlayerName);
            const playerChangeSkin = entity.getR(C.PlayerSkin);
            const playerCatchType = entity.getR(C.PlayerCatchType);
            if(!sprite || !playerCatch) continue;

            if(playerChangeName && !playerChangeName.updated(this)) {
                console.log("broadcast playerchangename");
                player.setName(playerChangeName.name);
                playerChangeName.mark(this);
            }
            if(playerChangeSkin && !playerChangeSkin.updated(this)) {
                player.setSkin(playerChangeSkin.name);
                playerChangeSkin.mark(this);
            }
            if(playerCatchType && !playerCatchType.updated(this)) {
                player.setCatchType(playerCatchType.catchType);
                playerCatchType.mark(this);
            }
            if(!playerEntity.get(C.GunTime)) playerEntity.set(new C.GunTime(0));
            const gunTime = playerEntity.get(C.GunTime)!;
            let playerAnimation = new C.PlayAnimation("still_test", 1);
            if(gunTime.time > 0) gunTime.time -= 1;
            if(keyboardInput) {
                const keyDown = keyboardInput.keyDown;
                const velocity = sprite.body!.getLinearVelocity();
                const animationRatio = Math.sqrt(velocity.x() * velocity.x() + velocity.z() * velocity.z()) / 3;
                const movement = U.posAT(velocity).applyQuaternion(keyboardInput.quaternion.getTHREE().invert());
                let damping = Math.exp( - 3 * dt );
                let speedXZ = PLAYER_MOVEMENT.speedXZ * dt, speedY = PLAYER_MOVEMENT.speedY;
                {
                    if(this.onGround(sprite, physicsWorld)) {
                        if(keyDown.includes(' ')) movement.setY( + speedY);
                    } else {
                        damping *= 0.1;
                        speedXZ = 15 * dt;
                    }
                    if(keyDown.includes('a')) movement.setX(movement.x - speedXZ), playerAnimation = new C.PlayAnimation("walking_test", animationRatio);
                    if(keyDown.includes('d')) movement.setX(movement.x + speedXZ), playerAnimation = new C.PlayAnimation("walking_test", animationRatio);
                    if(keyDown.includes('w')) movement.setZ(movement.z - speedXZ), playerAnimation = new C.PlayAnimation("walking_test", animationRatio);
                    if(keyDown.includes('s')) movement.setZ(movement.z + speedXZ), playerAnimation = new C.PlayAnimation("walking_test", animationRatio);
                    if(keyDown.includes('p')) {
                        U.spawnPlate(playerEntity);
                    }
                    if(keyDown.includes('x')) {
                        if(playerCatch.catchType == CATCH_TYPE.HAND && playerCatch.catchEntity!.get(C.Gun)) {
                            shoot2(playerEntity,playerEntity.getR(C.PlayerCamera)!.origin!,playerEntity.getR(C.PlayerCamera)!.direction!);
                        }
                    }
                    if(keyDown.includes('z')) {
                        if(playerCatch.catchType == CATCH_TYPE.HAND && playerCatch.catchEntity!.get(C.Gun)) {
                            shoot1(playerEntity,playerEntity.getR(C.PlayerCamera)!.origin!,playerEntity.getR(C.PlayerCamera)!.direction!);
                        }
                    }
                    if(keyDown.includes('q')) {
                        const system = GameSystem.gamesystems.get(0) as OvercraftSystemServer;
                        if(system && !system.isRunning()) system.run();
                    }
                    if(keyDown.includes('o')) {
                        const system = GameSystem.gamesystems.get(0) as OvercraftSystemServer;
                        if(system && system.isRunning()) system.isEnded = true;
                    }
                }
                /*if(playerAnimation.name != "still_test") {
                    U.printV(velocity);
                    // console.log("playerAnimation", playerAnimation);
                }*/
                
                sprite.body!.setDamping(damping, 0);
                const realMovement = U.posTA(movement.applyQuaternion(keyboardInput.quaternion.getTHREE()));
                sprite.body!.setLinearVelocity(realMovement);
            }
            if(!playerEntity.getS(C.PlayAnimation) || playerEntity.getS(C.PlayAnimation)!.unequal(playerAnimation)) playerEntity.send(playerAnimation);
            if(clickInput && !clickInput.updated(this)) {
                handleClick(entity, entities, physicsWorld, gridSystem);
                clickInput.mark(this);
            }
            
            const wheelInput = playerEntity.getR(C.PlayerWheelInput);
            if(wheelInput && !wheelInput.updated(this)) {
                if (wheelInput.deltaY > 0) {
                    player.setCatchType((player.catchType + 1) % CATCH_TYPE.TOTAL_NUM);
                  } else if (wheelInput.deltaY < 0) {
                    player.setCatchType((player.catchType + CATCH_TYPE.TOTAL_NUM - 1) % CATCH_TYPE.TOTAL_NUM);
                }
                wheelInput.mark(this);
            }
            
            if(rotateInput && !rotateInput.updated(this)) {
                if(!sprite.rotation) sprite.rotation = new C.Euler(0, 0, 0);
                sprite.rotation.y += rotateInput.mouseY;
                rotateInput.mark(this);
                sprite.transformChanged = true;
            }
            
            if(playerCatch.catchType != CATCH_TYPE.NONE) {
                const playerCamera = playerEntity.getR(C.PlayerCamera)!;
                const origin = playerCamera.origin.getTHREE();
                const direction = playerCamera.direction.getTHREE();
                const bodyOrigin = U.getPosThree(playerEntity);
                const localTarPos = U.posTA(origin.clone().add(bodyOrigin.multiplyScalar(-1)).add(direction.clone().multiplyScalar(playerCatch.catchLen)));
                const catchBody = playerCatch.catchEntity!.get(C.Sprite)!.body;
                const catchBodyOrigin = U.getPos(catchBody!);
                const tarPos = U.getPos(sprite.body!).op_add(localTarPos);
                playerCatch.catchEntity!.get(C.Sprite)!.body!.activate(true);

                if(playerCatch.catchType == CATCH_TYPE.CONSTRAINT) {
                    playerCatch.catchConstraint!.setPivotA(localTarPos);
                } else if(playerCatch.catchType == CATCH_TYPE.SIMPLE) {
                    const rayCallback = new Ammo.AllHitsRayResultCallback(catchBodyOrigin, tarPos);
                    physicsWorld.rayTest(catchBodyOrigin, tarPos, rayCallback);
                    const displacement = tarPos.op_sub(catchBodyOrigin);
                    const length = displacement.length();
                    displacement.normalize();
                    if(length > 2 * playerCatch.catchLen) playerCatch.removeConstraint(physicsWorld);
                    else {
                        let resultLength = length * 30;

                        /*if (rayCallback.hasHit()) {
                            const hitPoints = rayCallback.get_m_hitPointWorld();
                            const collisionObjects = rayCallback.get_m_collisionObjects();
                            let nearPoint: null | AmmoModule.btVector3 = null;
                            for(let j = 0; j < hitPoints.size(); ++j) {
                                const collisionObject = collisionObjects.at(j);
                                const body = (Ammo as any).castObject(collisionObject, AmmoModule.btRigidBody);
                                if(body.isStaticObject() && !U.getSpriteByBody(body, entities)!.get(C.Sprite)!.name.includes('detector')) { nearPoint = hitPoints.at(j); break; }
                            }
                            if(nearPoint != null) {
                                const displacementNear = nearPoint.op_sub(catchBodyOrigin);
                                const lengthNear = displacementNear.length();
                                resultLength = lengthNear * lengthNear * 5;
                                Ammo.destroy(nearPoint);
                            }
                        }*/

                        if(resultLength > 1e-6) {
                            catchBody!.setLinearVelocity(displacement.op_mul(resultLength));
                        }
                    }
                }
                Ammo.destroy(localTarPos);
                Ammo.destroy(tarPos);
            }

            const minecraftWorlds = EntitySystem.getAll(C.MinecraftWorld);
            for(const minecraftWorld of minecraftWorlds) {
                minecraftWorld.get(C.MinecraftWorld)!.update(playerEntity);
            }
        }
    }
};