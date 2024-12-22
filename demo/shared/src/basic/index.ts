import { v4 as uuidv4 } from 'uuid'
import { IEntity, IComponent, IUComponent, Constructor } from './interface'
import { SerializeSystem, register } from './SerializeSystem'

export abstract class Component implements IComponent {
    public _typeComponent = true;
    constructor(public _entityId: number = 0) {}
    setEntityId(id: number) { this._entityId = id; }
    getEntityId() { return this._entityId; }
    entity() {
        return EntitySystem.get(this._entityId);
    }
};

export abstract class UComponent implements IUComponent {
    public _typeUComponent = true;
    constructor(public _entityId: number = 0, public _tag: Set<any> = new Set()) {}
    setEntityId(id: number) { this._entityId = id; }
    getEntityId() { return this._entityId; }
    mark(system: any) { this._tag.add(system); }
    updated(system: any) { return this._tag.has(system); }
    clear() { this._tag = new Set(); }
    entity() {
        return EntitySystem.get(this._entityId);
    }
};

export class MyEvent extends UComponent {
    constructor() { super(); }
}
@register()
export class ComponentSetEvent extends MyEvent {
    constructor(public entityId: number, public value: UComponent[]) {
        super();
    }
};
@register()
export class ComponentRemovedEvent extends MyEvent {
    constructor(public entityId: number, public value: UComponent) {
        super();
    }
};
@register()
export class EntityAddedEvent extends MyEvent {
    constructor(public room: number, public entityId: number) {
        super();
    }
};
@register()
export class EntityRemovedEvent extends MyEvent {
    constructor(public room: number, public entityId: number) {
        super();
    }
};
@register()
export class EntitySetRoomEvent extends MyEvent {
    constructor(public room: number, public entityId: number) {
        super();
    }
};

let globalEntityId = 0;
function getNextEntityId() {
    return globalEntityId++;
}

@register((entity: Entity) => { return entity.id; }, (obj: number) => { return EntitySystem.get(obj); })
export class Entity implements IEntity {
    public components = new Map<Constructor, Component>();
    public receives = new Map<Constructor, UComponent>();
    public sends = new Map<Constructor, UComponent>();
    public _roomUpdated = false;
    constructor(public room: number, public id: number = getNextEntityId(), message = true) {
        console.log("(i am) entity constructor");
        //console.log(`addEntity entityId = ${id}, room = ${room}`);
        EntitySystem.add(this);
        if(message) EventSystem.addEvent(new EntityAddedEvent(room, this.id));
    }
    _hasR(object: Constructor) {
        const component = this.receives.get(object.prototype); if(!component) return false;
        return true;
    }
    hasR(object: Constructor | Constructor[]) {
        if(Array.isArray(object)) {
            for(const func of object)
                if(!this._hasR(func)) return false;
            return true;
        } else return this._hasR(object);
    }
    _has(object: Constructor) {
        const component = this.components.get(object.prototype); if(!component) return false;
        return true;
    }
    has(object: Constructor | Constructor[]) {
        if(Array.isArray(object)) {
            for(const func of object)
                if(!this._has(func)) return false;
            return true;
        } else return this._has(object);
    }
    get<T extends Component = Component>(object: new (...args: any[]) => T): T | undefined {
        return this.components.get(object.prototype) as (T | undefined);
    }
    getR<T extends UComponent = UComponent>(object: new (...args: any[]) => T): T | undefined {
        return this.receives.get(object.prototype) as (T | undefined);
    }
    getS<T extends UComponent = UComponent>(object: new (...args: any[]) => T): T | undefined {
        return this.sends.get(object.prototype) as (T | undefined);
    }
    getAllR() {
        return Array.from(this.receives.values());
    }
    getAllS(system?: any) {
        if(system === undefined) return Array.from(this.sends.values());
        const list: UComponent[] = [];
        for(const components of this.sends.values()) if(!components.updated(system)) list.push(components);
        return list;
    }
    send(value: UComponent | UComponent[]) {
        if(value instanceof UComponent) {
            value.setEntityId(this.id);
            const prototype = Object.getPrototypeOf(value);
            this.sends.set(prototype, value);
            value.clear();
        } else {
            for(const comp of value) this.send(comp);
        }
    }
    receive(value: UComponent | UComponent[]) {
        if(value instanceof UComponent) {
            value.setEntityId(this.id);
            const prototype = Object.getPrototypeOf(value);
            this.receives.set(prototype, value);
            value.clear();
        } else {
            for(const comp of value) this.receive(comp);
        }
    }
    set(value: Component | Component[]) {
        if(value instanceof Component) {
            value.setEntityId(this.id);
            const prototype = Object.getPrototypeOf(value);
            this.components.set(prototype, value);
            if(value instanceof UComponent) {
                console.log("[Entity] Wrong component set.");
            }
        } else {
            for(const comp of value) this.set(comp);
        }
    }
    remove(object: Constructor, message = true) {
        const component = this.components.get(object.prototype);
        if(component) {
            this.components.delete(object.prototype);
            if(message && (component instanceof UComponent)) {
                EventSystem.addEvent(new ComponentRemovedEvent(this.id, component));
            }
        }
    }
    removeEntity(message = true) {
        for(const component of this.components.values()) {
            this.remove(Object.getPrototypeOf(component), false);
        }
        if(message) {
            EventSystem.addEvent(new EntityRemovedEvent(this.room, this.id));
        }
    }
};

export class EventSystem {
    static eventHandler = new Map<Object, Function[]>();
    static asyncEventHandler = new Map<Object, Function[]>();
    constructor() {
        
    }
    static addHandler<T extends MyEvent>(obj: new (...args: any[]) => MyEvent, func: (event: T) => any) {
        let arr = this.eventHandler.get(obj.prototype);
        if(!arr) arr = []
        arr.push(func);
        this.eventHandler.set(obj.prototype, arr);
    }
    static addAsyncHandler<T extends MyEvent>(obj: new (...args: any[]) => MyEvent, func: (event: T) => any) {
        let arr = this.eventHandler.get(obj.prototype);
        if(!arr) arr = []
        arr.push(func);
        this.eventHandler.set(obj.prototype, arr);
    }
    static async addEvent<T extends MyEvent>(event: T, callback?: (event: T) => any) {
        //console.log("addEvent", event);
        const prototype = Object.getPrototypeOf(event);
        let handlers = this.eventHandler.get(prototype);
        if(handlers) {
            for(let func of handlers) func(event);
        }
        handlers = this.asyncEventHandler.get(prototype);
        if(handlers) {
            for(let func of handlers) await func(event);
        }
        if(callback) callback(event);
    }
};

export class EntitySystem {
    public static entities = new Map<number, Entity>();
    public static entityRoom = new Map<number, Entity[]>();
    public static globalRoomId = 0;
    static init() {
        (window as any).EntitySystem = this;
    }
    static onEntityAdded(room: number, entityId: number) {
        console.log("(i am) add entity", entityId);
        if(!this.entities.has(entityId)) {
            const entity = new Entity(room, entityId, false);
            
        }
    }
    static get(entityId: number) {
        return this.entities.get(entityId);
    }
    static getAllR(obj?: Constructor | Constructor[]) {
        const list = Array.from(this.entities.values());
        if(obj === undefined) return list;
        const realList: Entity[] = [];
        for(const entity of list) if(entity.hasR(obj)) realList.push(entity);
        return realList;
    }
    static getAll(obj?: Constructor | Constructor[]) {
        const list = Array.from(this.entities.values());
        if(obj === undefined) return list;
        const realList: Entity[] = [];
        for(const entity of list) if(entity.has(obj)) realList.push(entity);
        return realList;
    }
    static setRoom(entity: Entity, room: number) {
        const a = this.entityRoom.get(entity.room);
        if(a) {
            const id = a.indexOf(entity);
            if(id > -1) a.splice(id, 1);
        }
        entity.room = room, entity._roomUpdated = true;
        const entities = EntitySystem.getEntityByRoom(entity.room);
        entities.push(entity);
    }
    static getEntityByRoom(room: number) {
        const entities = this.entityRoom.get(room);
        if(!entities) this.entityRoom.set(room, []);
        return entities ? entities : [];
    }
    static add(entity: Entity): Entity {
       // console.log("add", entity.room)
        this.entities.set(entity.id, entity);
        const entities = EntitySystem.getEntityByRoom(entity.room);
        entities.push(entity);
        return entity;
    }
    static onEntityRemoved(entityId: number) {
        console.log("(i am) remove entity", entityId);
        if(this.entities.has(entityId)) {
            const entity = this.entities.get(entityId);
            this.entities.delete(entityId);
            if(entity) {
                const roomEntities = this.entityRoom.get(entity.room);
                if (roomEntities) {
                    this.entityRoom.set(entity.room, roomEntities.filter(e => e.id !== entityId));
                }

                entity.removeEntity(false);
            }
        }
    }
};

export { SerializeSystem, register }