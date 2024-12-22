import { Component, UComponent, register, MyEvent } from '../basic'
import { OrderInfo } from './playerComponent';

@register()
export class Broadcast extends MyEvent {
    constructor(public room: number, public value: Array<MyEvent>) { super(); }
};
@register()
export class AnyEvent extends MyEvent {
    constructor(public entityId: number, public value: any) {
        super();
    }
};
@register()
export class LoadAssetEvent extends MyEvent {
    constructor(public entityId: number, public name: string, public args: any) {
        super();
    }
};
@register()
export class LoginEvent extends MyEvent {
    constructor(public uuid: number, public entityId: number) { super(); }
};
@register()
export class MeshAddedEvent extends MyEvent {
    constructor(public entityId: number, public entities: Array<Component> = []) { super(); }
}
@register()
export class OvercraftUpdateEvent extends MyEvent {
    constructor(public subtick: number,public checkAll:boolean, public reset:boolean, public spawnList: OrderInfo[], public completeList: OrderInfo[]) {super();}
}
export { EntityAddedEvent, EntityRemovedEvent, ComponentSetEvent, MyEvent, EntitySetRoomEvent } from '@shared/basic'