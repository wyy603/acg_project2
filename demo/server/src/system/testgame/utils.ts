import { Entity } from '@shared/basic'
import * as C from '@/component'
import { AmmoModule, Ammo } from '@shared/utils/ammo'
import { SPRITE_STATE } from '@shared/constant'
import * as U from '@shared/utils'
import { EntitySystem } from '@shared/system'
import { INGREDIENT, INGREDIENT_PROPERTY } from '@shared/constant'
import * as THREE from 'three'

export function createSprite({room, mass, collision_shape, name, sprite_state, linear_damping, restitution, ccd_threshold, ccd_radius, no_contact_response}: {
    room: number,
    mass: number,
    collision_shape: AmmoModule.btCollisionShape
    name: string,
    sprite_state: SPRITE_STATE
    linear_damping?: number,
    restitution?: number,
    ccd_threshold?: number,
    ccd_radius?: number,
    no_contact_response?: true
}) {
    const entity = new Entity(room);
    const bodyinfo = U.getRigidBodyConstructionInfo(mass, collision_shape);
    if(linear_damping) bodyinfo.set_m_linearDamping(linear_damping);
    if(restitution) bodyinfo.set_m_restitution(restitution);
    
    const body = new Ammo.btRigidBody(bodyinfo);
    const state = sprite_state;
    if(ccd_threshold) body.setCcdMotionThreshold(ccd_threshold);
    if(ccd_radius) body.setCcdSweptSphereRadius(ccd_radius);
    if(no_contact_response) body.setCollisionFlags(body.getCollisionFlags() | 4);
    entity.set(new C.Sprite(name, body, state));
    entity.send(new C.SpriteInfo(name, state));
    return entity;
}
export function getPos(obj: Entity | C.Sprite | AmmoModule.btRigidBody) {
    let body: AmmoModule.btRigidBody;
    if(obj instanceof Entity) body = obj.get(C.Sprite)!.body!;
    else if(obj instanceof C.Sprite) body = obj.body!;
    else body = obj;
    const motionState = body.getMotionState();
    const transform = new Ammo.btTransform();
    motionState.getWorldTransform(transform);
    return transform.getOrigin();
}
export function getRot(obj: Entity | C.Sprite | AmmoModule.btRigidBody) {
    let body: AmmoModule.btRigidBody;
    if(obj instanceof Entity) body = obj.get(C.Sprite)!.body!;
    else if(obj instanceof C.Sprite) body = obj.body!;
    else body = obj;
    const motionState = body.getMotionState();
    const transform = new Ammo.btTransform();
    motionState.getWorldTransform(transform);
    return transform.getRotation();
}
export function getPosThree(obj: Entity | C.Sprite | AmmoModule.btRigidBody) {
    return U.posAT(getPos(obj));
}
export function getSpriteByBody(body: AmmoModule.btRigidBody, entities: Entity[]) {
    if(body.getUserIndex()) return EntitySystem.get(body.getUserIndex());
    return undefined;
}

export function composeIngredients(ingredients: INGREDIENT[]): INGREDIENT | undefined { // 在合成表中寻找，多个ingredients合成一个
    for (const [key, info] of Object.entries(INGREDIENT_PROPERTY)) {
        const ingredientEnum = Number(key) as INGREDIENT;
        const { recipe, recipe_ordered } = info;

        if (recipe_ordered) {
            if (JSON.stringify(recipe) === JSON.stringify(ingredients)) {
                return ingredientEnum;
            }
        } else {
            const sortedRecipe = [...recipe].sort();
            const sortedList = [...ingredients].sort();
            if(ingredientEnum == INGREDIENT.tomato_slice) {
                console.log("composeIngredient", sortedRecipe, sortedList);
            }
            if (JSON.stringify(sortedRecipe) === JSON.stringify(sortedList)) {
                return ingredientEnum;
            }
        }
    }
    return undefined;
}
export function canInsFood(food1: C.FoodInfo, food2: C.FoodInfo): boolean {
    for(const a of food1.ingredients) if(INGREDIENT_PROPERTY[a].type != "cylinder") return false;
    for(const a of food2.ingredients) if(INGREDIENT_PROPERTY[a].type != "cylinder") return false;
    return true;
}
export function updateFoodInfo(foodInfo: C.FoodInfo) {
    if(composeIngredients(foodInfo.ingredients.concat(INGREDIENT.cut))) {
        foodInfo.cutInfo = new C.CutInfo(10);
        foodInfo.entity()!.send(foodInfo);
    }
    if(composeIngredients(foodInfo.ingredients.concat(INGREDIENT.fried))) {
        foodInfo.friedInfo = new C.FriedInfo(10);
        foodInfo.entity()!.send(foodInfo);
    }
}
export function insFood(foodInfo: C.FoodInfo, ingredient2: INGREDIENT[], final = true) { // 给food增加ingredient2，然后更新其信息和物理
    foodInfo.ingredients.push(...ingredient2);
    foodInfo.ingredients.sort((a, b) => {
        const priorityA = INGREDIENT_PROPERTY[a].priority ?? 0;
        const priorityB = INGREDIENT_PROPERTY[b].priority ?? 0;
        return priorityA - priorityB;
    });
    console.log("insFood", foodInfo.ingredients);
    if(foodInfo.ingredients.includes(INGREDIENT.plate)) {
        const tmparr = Array.from(foodInfo.ingredients);
        tmparr.splice(tmparr.indexOf(INGREDIENT.plate), 1);
        console.log("tmparr", tmparr);
        const compose = composeIngredients(tmparr);
        if(compose) foodInfo.ingredients.splice(0, foodInfo.ingredients.length), foodInfo.ingredients.push(compose), insFood(foodInfo, [INGREDIENT.plate], false);
    }
    if(final) {
        updateFoodInfo(foodInfo);
    }
}
export function spawnPlate(player: Entity) {
    const gunTime = player.get(C.GunTime)!;
    if(gunTime.time == 0)
    {
        gunTime.time = Config.server_tickrate * 0.5;
        const plate = spawnRawFood(INGREDIENT.plate, player.room);
        const position = getPosThree(player);
        plate.receive(new C.SetPhysicsTransform(new C.Vector3(position.x,position.y+3,position.z), undefined, undefined));
    }
}
export function spawnSomething(player: Entity, ingredient: INGREDIENT) {
    const gunTime = player.get(C.GunTime)!;
    if(gunTime.time == 0)
    {
        gunTime.time = Config.server_tickrate * 0.5;
        const plate = spawnRawFood(ingredient, player.room);
        const position = getPosThree(player);
        plate.receive(new C.SetPhysicsTransform(new C.Vector3(position.x,position.y+3,position.z), undefined, undefined));
    }
}
export function spawnRawFood(itemType: INGREDIENT, room: number) {
    //console.log("spawnRawFood");
    const item = new Entity(room);
    item.send(new C.FoodInfo([itemType]));
    const body = getFoodBody(item);
    //body.setActivationState(4); // DISABLE_ACTIVATION
    const state = SPRITE_STATE.COLLIDE | SPRITE_STATE.UPDATE_PHYSICS | SPRITE_STATE.CATCHABLE;
    const spriteinfo = INGREDIENT_PROPERTY[itemType].name;
    item.set(new C.Sprite(spriteinfo, body, state));
    item.send(new C.SpriteInfo(spriteinfo, state));
    item.receive(new C.SetPhysicsTransform(new C.Vector3(0,0,0), undefined, undefined));
    updateFoodInfo(item.getS(C.FoodInfo)!);
    return item;
}

export function getFoodHeight(entity: C.Entity) {
    const food = entity.getS(C.FoodInfo)!;
    let maxRadius = 0;
    let totalHeight = 0;
    food.ingredients.forEach(ingredient => {
        const info = INGREDIENT_PROPERTY[ingredient];
        if (info.height !== undefined && info.radius !== undefined) {
            maxRadius = Math.max(maxRadius, info.radius);
            totalHeight += info.height;
        }
    });
    return totalHeight;
}
export function getFoodBody(entity: C.Entity) {
    let collide: AmmoModule.btCollisionShape
    let raw = false;
    const food = entity.getS(C.FoodInfo)!;
    console.log('getFoodBody', food.ingredients);
    if(food.ingredients.length == 1 && (!INGREDIENT_PROPERTY[food.ingredients[0]].height || !food.inGrid)) {
        const ingredient = food.ingredients[0];
        const info = INGREDIENT_PROPERTY[ingredient];
        if(info.collide) collide = info.collide;
        else if(info.height && info.radius) {
            collide = new Ammo.btCylinderShape(new Ammo.btVector3(info.radius, info.height, info.radius));
        } else throw Error("Error on getFoodBody");
        raw = true;
    } else {
        let maxRadius = 0;
        let totalHeight = 0;
        food.ingredients.forEach(ingredient => {
            const info = INGREDIENT_PROPERTY[ingredient];
            if (info.height !== undefined && info.radius !== undefined) {
                maxRadius = Math.max(maxRadius, info.radius);
                totalHeight += info.height;
            }
        });
        console.log("totalHeight = ", totalHeight);
        collide = new Ammo.btCylinderShape(new Ammo.btVector3(maxRadius, totalHeight, maxRadius));
    }
    //collide = new Ammo.btSphereShape(0.3);

    const bodyinfo = U.getRigidBodyConstructionInfo(1, collide);
    bodyinfo.set_m_linearDamping(0.5);
    const body = new Ammo.btRigidBody(bodyinfo);
    body.setCcdMotionThreshold(0.001);
    body.setCcdSweptSphereRadius(0.1);
    if(food.inGrid) {
        body.setAngularFactor(new Ammo.btVector3(0, 0, 0));
        body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
        body.setLinearFactor(new Ammo.btVector3(0, 0.1, 0));
        body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
    } else if(!raw) {
        body.setAngularFactor(new Ammo.btVector3(0, 0, 0));
        body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
        body.setLinearFactor(new Ammo.btVector3(1, 1, 1));
        body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
        body.setDamping(0, 0.5);
    } else {
        body.setAngularFactor(new Ammo.btVector3(0.4, 0.4, 0.4));
        body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
        body.setLinearFactor(new Ammo.btVector3(1, 1, 1));
        body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
        body.setDamping(0, 0.5);
    }
    return body;
}
export function updateFoodBody(entity: C.Entity, physicsWorld: AmmoModule.btDiscreteDynamicsWorld) {
    const body = getFoodBody(entity);

    const sprite = entity.get(C.Sprite)!;
    const food = entity.getS(C.FoodInfo)!;
    let motionState = sprite.body!.getMotionState();
    const transform = new Ammo.btTransform();
    motionState.getWorldTransform(transform);
    physicsWorld.removeRigidBody(sprite.body!);
    sprite.setBody(body);
    if(food.inGrid) {
        sprite.type &= (~SPRITE_STATE.CATCHABLE);
        transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
    } else {
        sprite.type |= SPRITE_STATE.CATCHABLE;
    }
    physicsWorld.addRigidBody(sprite.body!);
    motionState = sprite.body!.getMotionState();
    motionState.setWorldTransform(transform);
    sprite.body!.setMotionState(motionState);
}

export function getConstraints(entity: C.Entity) {
    const list = [];
    for(const entity of EntitySystem.getAll(C.PlayerCatch)) {
        if(entity.get(C.PlayerCatch)!.catchEntity == entity) list.push(C.PlayerCatch);
    }
    return list;
}

import { Config } from '@shared/constant'

export function getRadius(obj: AmmoModule.btRigidBody) {
    const aabbMin = new Ammo.btVector3();
    const aabbMax = new Ammo.btVector3();
    obj.getAabb(aabbMin, aabbMax);

    // 计算中心
    const centerX = (aabbMin.x() + aabbMax.x()) / 2;
    const centerY = (aabbMin.y() + aabbMax.y()) / 2;
    const centerZ = (aabbMin.z() + aabbMax.z()) / 2;

    // 计算半径
    const radius = Math.sqrt(
    Math.pow(aabbMax.x() - centerX, 2) +
    Math.pow(aabbMax.y() - centerY, 2) +
    Math.pow(aabbMax.z() - centerZ, 2)
    );
    return radius;
}

export function analyzeRaytest(entity: Entity) {
    const rayTestEntities = entity.getR(C.PlayerClickInput)?.entities;
    const distances = entity.getR(C.PlayerClickInput)?.distances;
    const catchingItem = entity.get(C.PlayerCatch)?.catchEntity;
    if(!rayTestEntities || !distances) return {entity: undefined, distance: undefined}
    console.log("analyzeRaytest", rayTestEntities.map(entity => entity.get(C.Sprite)!.name), distances);
    let nearEntity: Entity | undefined = undefined;
    let minEntity: Entity | undefined = undefined;
    let catchableEntity: Entity | undefined = undefined;
    let dis0 = 0, dis1 = 0, dis2 = 0;
    for(let i = 0; i < rayTestEntities.length; ++i) {
        const entityi = rayTestEntities[i];
        const spritei = rayTestEntities[i].get(C.Sprite)!;
        const state = spritei.type;
        if(entityi == entity) continue;
        if(entityi == catchingItem) continue;
        {
            if(!nearEntity) nearEntity = entityi, dis0 = distances[i];
        }
        if(state & SPRITE_STATE.DETECTOR) {
            if(!minEntity) minEntity = entityi, dis1 = distances[i];
        }
        if(state & SPRITE_STATE.CATCHABLE) {
            if(!catchableEntity) catchableEntity = entityi, dis2 = distances[i];
        }
    }
    if(minEntity) console.log("analyzeRaytest result", minEntity.get(C.Sprite)!.name);
    return { minEntity: minEntity, catchableEntity: catchableEntity, nearEntity: nearEntity, dis0: dis0, dis1: dis1, dis2: dis2 }
}
export function getEntityByName(name: string) {
    const list = EntitySystem.getAll();
    const realList: Entity[] = [];
    for(const entity of list) {
        const realName : C.Sprite | undefined = entity.get(C.Sprite);
        if(realName && realName.name.includes(name)) {
            realList.push(entity);
        }
    }
    return realList;
}

export * from '@shared/utils'