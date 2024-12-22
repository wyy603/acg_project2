import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'url';
import * as THREE from 'three';
import { AmmoModule, Ammo } from '@shared/utils/ammo'

import * as C from '@/component'
import * as E from '@shared/component/event'
import { Entity } from '@shared/basic'
import { EntitySystem } from '@shared/system'
import { Config } from '@shared/constant'
import { diff } from '@shared/utils/basic'
import * as U from '@shared/utils'

export class PhysicsSystem {
    world: AmmoModule.btDiscreteDynamicsWorld
    entities: Entity[]
    c1 = 0
    c2 = 0
    constructor() {
        const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
            dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
            overlappingPairCache = new Ammo.btDbvtBroadphase(),
            solver = new Ammo.btSequentialImpulseConstraintSolver();

        this.world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
        const vec = new Ammo.btVector3(0, -30, 0); this.world.setGravity(vec), Ammo.destroy(vec);
        this.entities = [];
        console.log("PhysicsSystem Loaded.");
    }
    update(entities: Entity[], dt: number, timeStamp: number) {
        //console.log("PhysicsSystem update");
        const newentities: Entity[] = [];
        for(const entity of entities) {
            const sprite = entity.get(C.Sprite);
            if(sprite && sprite.body) newentities.push(entity);
        }
        const [adds, dels] : Entity[][] = diff(this.entities, newentities);
        this.entities = newentities;
        for(const entity of adds) {
            const sprite = entity.get(C.Sprite)!;
            //console.log("add rigid body");
            this.world.addRigidBody(sprite.body!);
        }
        for(const entity of dels) {
            //console.log("remove rigid body!");
            this.world.removeRigidBody(entity.get(C.Sprite)!.body!);
        }

        for(const entity of this.entities) {
            const sprite = entity.get(C.Sprite);
            if(!sprite) continue;
            if(!sprite.body) continue;

            const description = entity.getR(C.SetPhysicsTransform);
            if(description && !description.updated(this)) {
                //console.log("update physics transform")
                const motionState = sprite.body!.getMotionState();
                const transform = new Ammo.btTransform();
                motionState.getWorldTransform(transform);
                if(description.position) {
                    const tmp = description.position.getAmmo();
                    sprite.position = description.position, transform.setOrigin(tmp), Ammo.destroy(tmp);
                    sprite.transformChanged = true;
                }
                if(description.rotation) {
                    const tmp = description.rotation.getAmmo();
                    sprite.rotation = description.rotation;
                    sprite.quaternion = C.Quaternion.byTHREE(new THREE.Quaternion().setFromEuler(description.rotation.getTHREE()))
                    transform.setRotation(tmp), Ammo.destroy(tmp);
                }
                if(description.quaternion) {
                    const tmp = description.quaternion.getAmmo();
                    sprite.rotation = C.Euler.byTHREE(new THREE.Euler().setFromQuaternion(description.quaternion.getTHREE()))
                    sprite.quaternion = description.quaternion;
                    transform.setRotation(tmp), Ammo.destroy(tmp);
                }
                motionState.setWorldTransform(transform);
                sprite.body!.setMotionState(motionState);
                description.mark(this);
                Ammo.destroy(transform);
            }

            const movement = entity.getR(C.SetPhysicsMovement);
            if(movement && !movement.updated(this)) {
                if(movement.linvel) sprite.body!.setLinearVelocity(movement.linvel.getAmmo());
                if(movement.angvel) sprite.body!.setAngularVelocity(movement.angvel.getAmmo());
                movement.mark(this);
            }
        }

        this.world.stepSimulation( dt, 13, 1/90);

        for(const entity of this.entities) {
            const sprite = entity.get(C.Sprite);
            if(!sprite) continue;
            if(!sprite.activated) continue;
            if(!sprite.body) continue;
            
            const motionState = sprite.body!.getMotionState();
            const transform = new Ammo.btTransform();
            motionState.getWorldTransform(transform);
            const position = C.Vector3.byAmmo(transform.getOrigin());
            const quaternion = C.Quaternion.byAmmo(transform.getRotation());

            //sprite.transformChanged = false;
            // if((sprite.asyncPos || sprite.asyncRot)) this.c1+=1
            
            if(sprite.asyncPos) {
                // console.log(!sprite.position.equal(position));
                //if(sprite.name.includes("player")) console.log("wtf", sprite.position, position);
                if(!sprite.position || ((sprite.position.copy().dec(position)).norm() > 1e-3) /*!(sprite.position.equal(position))*/) {
                    sprite.position = position;
                    sprite.transformChanged = true;
                }
            }
            if(sprite.asyncRot) {
                // if(sprite.quaternion)
                // {
                //     console.log(sprite.quaternion!.distance(quaternion));
                // }
                // if(sprite.quaternion) console.log(sprite.quaternion.equal(quaternion));
                if(!sprite.quaternion || (sprite.quaternion.distance(quaternion) > 1e-3)) {
                    sprite.quaternion = quaternion;
                    sprite.rotation = C.Euler.byTHREE(new THREE.Euler().setFromQuaternion(quaternion.getTHREE()));
                    sprite.transformChanged = true;
                }
            }
            // if(sprite.transformChanged && (sprite.asyncPos || sprite.asyncRot)) this.c2 +=1;
            // console.log(this.c2/this.c1);
            
            if((sprite.asyncPos || sprite.asyncRot) && sprite.transformChanged) {
                if(sprite.asyncRot) {
                    entity.send(new C.SetMeshTransform(
                        U.fixedV(sprite.position, 2),
                        undefined,
                        U.fixedQ(sprite.quaternion, 2),
                        )
                    );
                } else {
                    entity.send(new C.SetMeshTransform(
                        U.fixedV(sprite.position, 2),
                        U.fixedE(sprite.rotation, 2),
                        )
                    );
                }
                sprite.transformChanged = false;
                //console.log(SerializeSystem.serialize(new C.SetMeshTransform(sprite.asyncPos ? position : undefined, undefined, sprite.asyncRot ? quaternion : undefined)));
            }
            Ammo.destroy(transform);
        }
    }
};
