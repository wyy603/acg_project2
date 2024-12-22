export interface IComponent {
    _typeComponent: boolean;
    _entityId: number
    entity(): IEntity | undefined;
    setEntityId(id: number): void
    getEntityId(): number
};
export interface IUComponent {
    _typeUComponent: boolean
    _entityId: number 
    _tag: any
    setEntityId(id: number): void
    getEntityId(): number
    mark(system: any): void
    updated(system: any): boolean
    clear(): void
    entity(): IEntity | undefined;
};
export type Constructor<T extends Object = Object> = new (...args: any[]) => T
export interface IEntity {
    room: number
    id: number
    components: Map<Constructor, IComponent>
    receives: Map<Constructor, IUComponent>
    sends: Map<Constructor, IUComponent>
    _hasR(object: Constructor): boolean
    hasR(object: Constructor | Constructor[]): boolean
    _has(object: Constructor): boolean
    has(object: Constructor | Constructor[]): boolean
    get<T extends IComponent = IComponent>(object: new (...args: any[]) => T): T | undefined
    getR<T extends IUComponent = IUComponent>(object: new (...args: any[]) => T): T | undefined
    getS<T extends IUComponent = IUComponent>(object: new (...args: any[]) => T): T | undefined
    getAllR(): IUComponent[]
    getAllS(system: any): IUComponent[]
    send(value: IUComponent | IUComponent[]): void
    receive(value: IUComponent | IUComponent[]): void
    set(value: IComponent | IComponent[]): void
    remove(object: Constructor, message: boolean): void
    removeEntity(message: boolean): void
};