import { Entity } from '@shared/basic'
import * as THREE from 'three'
import { AmmoModule, Ammo } from '@shared/utils/ammo'
import { SPRITE_STATE, ROOM_TYPE, CATCH_TYPE, INGREDIENT, ORDER_TYPE, ORDER_PROPERTY, TIME_PER_COMPLEXITY } from '@shared/constant'
import * as U from '@shared/utils'
import { Component, UComponent, register } from '@shared/basic'
import * as C from '.'
import { Config } from '@shared/constant'
import { OvercraftSystemBasic } from '@shared/basic/OvercraftSystemBasic'

// For Player Info ========================================
@register()
export class PlayerName extends UComponent {
    constructor(public name: string) { super(); }
};
@register()
export class PlayerSkin extends UComponent {
    constructor(public name: string) { super(); }
};
@register()
export class PlayerCatchType extends UComponent {
    constructor(public catchType: CATCH_TYPE) { super(); }
    clone() { return new PlayerCatchType(this.catchType); }
};
@register()
export class PlayerRoom extends UComponent {
    constructor(public roomType: ROOM_TYPE, public roomId: number) { super(); }
};
@register()
export class PlayerChangeRoom extends UComponent {
    constructor(public id: number) { super(); }
};
@register()
export class PlayerConnectId extends UComponent {
    constructor(public id: number) { super(); }
};
@register()
export class PlayerKeyboardInput extends UComponent {
    constructor(public keyDown: string[], public quaternion: C.Quaternion) { super(); }
};
@register()
export class PlayerClickInput extends UComponent {
    constructor(public type: number, public entities: Entity[], public distances: number[]) { super(); }
};
@register()
export class PlayerWheelInput extends UComponent {
    constructor(public deltaY: number) { super(); }
};
@register()
export class PlayerRotate extends UComponent {
    constructor(public mouseY: number) { super(); }
};
@register()
export class PlayerCamera extends UComponent {
    constructor(
        public origin: C.Vector3,
        public direction: C.Vector3,
    ) { super(); }
};

// For Sprite ========================================
@register()
export class SetPhysicsTransform extends UComponent {
    constructor(
        public position?: C.Vector3,
        public rotation?: C.Euler,
        public quaternion?: C.Quaternion
    ) { super(); }
};
@register()
export class SetPhysicsMovement extends UComponent {
    constructor(
        public linvel?: C.LinearVelocity,
        public angvel?: C.AngularVelocity,
    ) { super(); }
};
@register()
export class SetMeshTransform extends UComponent {
    constructor(
        public position?: C.Vector3,
        public rotation?: C.Euler,
        public quaternion?: C.Quaternion,
    ) { super(); }
};
@register()
export class SpriteInfo extends UComponent {
    constructor(public name: string, public type: SPRITE_STATE) { super(); }
};
@register()
export class CutInfo extends UComponent {
    public progress: number;
    public isCut: number;
    constructor(public difficulty: number) {
        super();
        this.progress = 0;
        this.isCut = 0;
    }
}
@register()
export class FriedInfo extends UComponent {
    constructor(public difficulty: number, public progress = 0, public fried = 0) { super(); }
};
@register()
export class OrderInfo extends UComponent {
    constructor(public type: ORDER_TYPE, public startingTime: number) {
        super();
    }
    getIdentity() {
        const tmp = ORDER_PROPERTY[this.type].ingredients.slice();
        return JSON.stringify(tmp.sort((a, b) => a - b));
    }
    getPercentage(subtick: number) {
        return 1 - ((subtick - this.startingTime) / OvercraftSystemBasic.TIME_PER_SEC) / (ORDER_PROPERTY[this.type].complexity * TIME_PER_COMPLEXITY);
    }
    getRemainingTime(subtick: number) {
        return ORDER_PROPERTY[this.type].complexity * TIME_PER_COMPLEXITY - (subtick - this.startingTime) / OvercraftSystemBasic.TIME_PER_SEC;
    }
    getScore(subtick: number) {
        const t = this.getRemainingTime(subtick);
        return ORDER_PROPERTY[this.type].scoreFunction(t);
    }
}
@register()
export class FoodInfo extends UComponent {
    public cutInfo: CutInfo | undefined;
    public friedInfo: FriedInfo | undefined;
    public inGrid: number;

    constructor(public ingredients: INGREDIENT[]) {
        super();
        this.inGrid = 0;
    }

    getIdentity() {
        const tmp = this.ingredients.slice();
        return JSON.stringify(tmp.sort((a, b) => a - b));
    }
};

@register()
export class U_PlayerCatch extends UComponent {
    constructor(
        public catchType = CATCH_TYPE.NONE,
        public catchLen = 0,
        public catchEntityId?: number
    ) { super(); }
    clone() {
        return new U_PlayerCatch(this.catchType, this.catchLen, this.catchEntityId);
    }
};
@register()
export class PlayerStuff extends UComponent {
    constructor(
        public cutting: number,
    ) { super(); }
};

@register()
export class PlayAnimation extends UComponent {
    constructor(public name: string, public ratio = 1, public repeat = true) { super(); }
    unequal(x: PlayAnimation) { return this.name != x.name || this.ratio != x.ratio || this.repeat != x.repeat; }
};

@register()
export class PlayerChat extends UComponent {
    constructor(public name: string, public str: string) { super(); }
};
@register()
export class SetTime extends UComponent {
    constructor(public str: "day" | "night") { super(); }
};