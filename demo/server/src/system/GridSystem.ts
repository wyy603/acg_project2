import * as C from '@/component'
import { Entity } from '@shared/basic'
import { GRID_TYPE, SPRITE_STATE, INGREDIENT, INGREDIENT_PROPERTY } from '@shared/constant';
import { Ammo, AmmoModule } from '@shared/utils/ammo';
import * as U from '@/system/testgame/utils'
import { OvercraftSystemServer } from './OvercraftSystem';
import { GameSystem } from './GameSystem';

function transformFood(food: Entity, ingredient: INGREDIENT, physicsWorld: AmmoModule.btDiscreteDynamicsWorld) {
    const foodInfo = food.getS(C.FoodInfo)!;
    if(!U.composeIngredients(foodInfo.ingredients.concat([ingredient]))) return;
    
    U.insFood(foodInfo, [ingredient]);
    const cutted = U.composeIngredients(foodInfo.ingredients)!;
    foodInfo.ingredients = [cutted], food.send(foodInfo);

    U.updateFoodBody(food, physicsWorld);
}

export class GridSystem {
    public grids = new Map<C.Vector3, Entity[]>();
	public gridsType = new Map<C.Vector3, GRID_TYPE>();
    public globalRoomId = 0;
    public timeStamp = 0;
    constructor() {
    }
	update(entities: Entity[], dt: number, physicsWorld: AmmoModule.btDiscreteDynamicsWorld) { // Only entity with component FoodInfo shall be added. 
        const currentTime = Date.now();
        if(currentTime - this.timeStamp >= 1000) {
            for(const vec of this.gridsType.keys()) {
                if(this.gridsType.get(vec)! == GRID_TYPE.SKILLET && this.grids.get(vec) && this.grids.get(vec)!.length > 0) {
                    const entity = this.grids.get(vec)![0], foodInfo = entity.getS(C.FoodInfo)!;
                    foodInfo.friedInfo!.progress += 1;
                    if(foodInfo.friedInfo!.progress >= foodInfo.friedInfo!.difficulty) {
                        transformFood(entity, INGREDIENT.fried, physicsWorld);
                    }
                    console.log("friedInfo progress + 1");
                    entity.send(foodInfo);
                }
            }
            this.timeStamp = this.timeStamp + Math.floor((currentTime - this.timeStamp) / 1000) * 1000;
        }
	}
    getGridType(vec: C.Vector3) {
        return this.gridsType.get(vec);
    }
	canPut(entity: Entity, position: C.Vector3) {
		if(!entity?.getS(C.FoodInfo)) return false;

        console.log("canPut?");
		console.log(this.gridsType.get(position));

		if(this.gridsType.get(position) === GRID_TYPE.FLAT) {
            const entities = this.grids.get(position)!;
            if(entities.length == 0) return true;
            else if(entities.length == 1) {
                const foodInfo = this.grids.get(position)![0]!.getS(C.FoodInfo)!;
                const ans = U.canInsFood(foodInfo, entity!.getS(C.FoodInfo)!);
                console.log("PLATE. can put: ", ans);
                return ans;
            }
            else return false;
		} else if(this.gridsType.get(position) === GRID_TYPE.KNIFE) { //刀台上无物品且当前物品可切。
			return (this.grids.get(position)!.length == 0 && entity?.getS(C.FoodInfo)?.cutInfo);
		} else if(this.gridsType.get(position) === GRID_TYPE.PLATE) {
			throw new Error("Not Implemented!");
		} else if(this.gridsType.get(position) === GRID_TYPE.SERVING) {
			const food = entity!.getS(C.FoodInfo)!;
			return food.ingredients.includes(INGREDIENT.plate);
		} else if(this.gridsType.get(position) === GRID_TYPE.SKILLET) {
            return (this.grids.get(position)!.length == 0 && entity?.getS(C.FoodInfo)?.friedInfo);
		}
	}
	onAdd(entity: Entity, position: C.Vector3, physicsWorld: AmmoModule.btDiscreteDynamicsWorld) {
		if(this.gridsType.get(position) === GRID_TYPE.SERVING) {
			(GameSystem.getRoomSystem(entity.room) as OvercraftSystemServer).onServing(entity.getS(C.FoodInfo)!);
			entity.removeEntity();
			return;
		} else if(this.gridsType.get(position) === GRID_TYPE.FLAT) {
            const entities = this.grids.get(position)!;
            if(entities.length == 0) {
                entities.push(entity);
                entity.getS(C.FoodInfo)!.inGrid = 1;
                entity.send(entity.getS(C.FoodInfo)!);
                entity.receive(new C.SetPhysicsTransform(position.copy().add(new C.Vector3(0,0.15+U.getFoodHeight(entity)/2,0))));
                U.updateFoodBody(entity, physicsWorld);
            } else if(entities.length == 1) {
                const currentEntity = this.grids.get(position)![0]!, foodInfo = currentEntity.getS(C.FoodInfo)!;
                console.log("hello, insFood", foodInfo, entity!.getS(C.FoodInfo)!.ingredients);
                U.insFood(foodInfo, entity!.getS(C.FoodInfo)!.ingredients);
                console.log("result foodInfo.ingredients", foodInfo.ingredients);
                currentEntity.send(foodInfo);
                U.updateFoodBody(currentEntity, physicsWorld);
                entity.removeEntity();
            }
            return;
        }
		this.grids.get(position)!.push(entity);
		entity.getS(C.FoodInfo)!.inGrid = 1;
        entity.send(entity.getS(C.FoodInfo)!);
		entity.receive(new C.SetPhysicsTransform(position));
        U.updateFoodBody(entity, physicsWorld);
	}
	onRemove(entity: Entity, physicsWorld: AmmoModule.btDiscreteDynamicsWorld) {
		entity.getS(C.FoodInfo)!.inGrid = 0;
        entity.send(entity.getS(C.FoodInfo)!);
		U.updateFoodBody(entity, physicsWorld);
		// entity.send(entity.getS(C.Sprite)!);
		// entity.get(C.Sprite)!.body.setCollisionFlags(entity.get(C.Sprite)!.body.getCollisionFlags() & ~Ammo.btCollisionObject.CF_NO_CONTACT_RESPONSE);
	}
    getFood(position: C.Vector3, physicsWorld: AmmoModule.btDiscreteDynamicsWorld) {
		const food = this.grids.get(position)!.at(0);
		return food;
	}
	takeFood(position: C.Vector3, physicsWorld: AmmoModule.btDiscreteDynamicsWorld) {
		const food = this.grids.get(position)?.at(0);
		if(food) {
			this.onRemove(food, physicsWorld);
			this.grids.get(position)!.splice(0,1);
		}
		return food;
	}
	cutOnPosition(position: C.Vector3, physicsWorld: AmmoModule.btDiscreteDynamicsWorld) {
		const food = this.grids.get(position)?.at(0);
		if(food) {
			const cutInfo = food!.getS(C.FoodInfo)!.cutInfo;
			cutInfo!.progress += 1;
			food!.send(food!.getS(C.FoodInfo)!);
			if(cutInfo!.progress >= cutInfo!.difficulty) {
				transformFood(food, INGREDIENT.cut, physicsWorld);
			}
			return food;
		}
		return undefined;
	}
};