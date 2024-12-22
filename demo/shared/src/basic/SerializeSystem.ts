import { IEntity, IComponent, IUComponent, Constructor } from './interface'

type ClassInfo = {
    prototype: Object
    name: string
    serialize: ((input: any) => any) | null
    deserialize: ((input: any) => any) | null
};

export class SerializeSystem {
    private static infos = new Array<ClassInfo>();
    private static objectMap: Map<Object, number> = new Map();
    private static idGenerated = false;
    static init() {
        
    }
    static register(type: Function, name: string, serialize: ((input: any) => any) | null = null, deserialize: ((input: any) => any) | null = null) {
        //console.log(`register ${name}`);
        const prototype = type.prototype;
        this.infos.push({prototype, name, serialize, deserialize});
    }
    static generateID() {
        //console.log("[SerializeSystem] length", this.infos.length);
        this.infos.sort((a, b) => a.name.localeCompare(b.name));
        for(let i = 0; i < this.infos.length; ++i) {
            const info = this.infos[i]
            this.objectMap.set(info.prototype, i);
        }
    }

    static serialize(obj: any): any {
        if(!this.idGenerated) this.generateID(), this.idGenerated = true;
        if(obj === undefined || obj === null) { return obj; }
        if((typeof obj) !== "object") {
            return obj;
        }
        if (Array.isArray(obj)) return obj.map(item => SerializeSystem.serialize(item));
        let id = this.objectMap.get(Object.getPrototypeOf(obj));
        if(id === undefined || this.infos[id] === undefined) { 
            //console.log("[SerializeSystem] Error", obj);
            id = -1;
        }
        let objectData: any;
        const serialize = id == -1 ? null : this.infos[id].serialize;
        if(serialize === null) {
            objectData = {};
            Object.keys(obj).forEach(key => {
                const data = obj[key];
                if(data != undefined && data != null && !((obj._typeUComponent) && (key == "_tag" || key == "_typeUComponent" || key == "_entityId"))) {
                    objectData[key] = SerializeSystem.serialize(data);
                }
            });
        } else objectData = serialize(obj);
        if(id == -1) {
            //console.log("[SerializeSystem] Result: ", {A: id, B: objectData});
        }
        return {A: id, B: objectData};
    }

    static deserialize(json: any): any {
        if(!this.idGenerated) this.generateID(), this.idGenerated = true;
        if(json === undefined || json === null) { return json; }
        if((typeof json) !== "object") return json;
        if(Array.isArray(json)) return json.map(item => SerializeSystem.deserialize(item));
        const { A: id, B: objectData } = json;
        const deserialize = id == -1 ? null : this.infos[id].deserialize;
        if(id == -1) {
            //onsole.log("[SerializeSystem] Error", {A: id, B: objectData});
        }
        if(deserialize === null) {
            for(const key in objectData) {
                objectData[key] = SerializeSystem.deserialize(objectData[key]);
            }
            if(id == -1) return objectData;
            else {
                const instance = Object.create(this.infos[id].prototype);
                Object.assign(instance, objectData);
                return instance;
            }
        } else return deserialize(objectData);
    }
};

export function register(serialize: ((input: any) => any) | null = null, deserialize: ((input: any) => any) | null = null) {
    return function (constructor: any) {
        SerializeSystem.register(constructor, constructor.name, serialize, deserialize);
    };
}