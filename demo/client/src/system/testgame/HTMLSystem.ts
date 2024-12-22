type systemSymbol = "Logger" | "Progress" | "OvercraftInfo"

export class HTMLSystem {
    static info: Record<string, any> = {}
    static setter: Record<string, Function> = {}
    static get(key: string) { return this.info[key]; }
    static update(key: systemSymbol) {
        if(!this.setter[key]) return;
        if((typeof this.info[key]) !== "object") this.setter[key](this.info[key]);
        else this.setter[key](Object.assign({}, this.info[key]));
    }
    static set(key: systemSymbol, value: any) {
        this.info[key] = value, this.update(key);
    }
    static setSetter(key: systemSymbol, func: Function) {
        this.setter[key] = func;
    }
    static get2(key: string, key2: string) {
        if(!this.info[key]) return undefined;
        return this.info[key][key2];
    }
    static set2(key: systemSymbol, key2: string, value: any) {
        if(!this.info[key]) this.info[key] = {};
        this.info[key][key2] = value, this.update(key);
    }
}; 