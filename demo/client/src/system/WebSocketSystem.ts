import { Server, createServer } from 'http';
import { Config } from '@shared/constant'
import { v4 as uuidv4 } from 'uuid';

import * as C from '@/component'
import * as E from '@shared/component/event'
import { EventSystem, SerializeSystem, EntitySystem } from '@shared/system'
// import { encode, decode } from '@msgpack/msgpack'
import { init as zstd_init , decompress, compress, compressUsingDict, createCCtx, decompressUsingDict, createDCtx } from '@bokuweb/zstd-wasm';

import dict from './../../public/assets/dict?raw';

export class WebSocketSystem {
    public static socket: WebSocket
    public static uuid = 0;
    private static sentBytes = 0;
    private static receivedBytes = 0;
    private static dict: any;
    private static cctx: any;
    private static dctx: any;
    private static u8encoder: any;
    private static u8decoder: any;
    static async init() {
        await zstd_init();
        this.cctx = createCCtx();
        this.dctx = createDCtx();
        this.u8encoder = new TextEncoder();
        this.u8decoder = new TextDecoder('utf-8');
        this.dict = this.u8encoder.encode(dict);
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(`ws://${window.location.hostname}:8000`);
            this.socket.binaryType = 'arraybuffer';
        
            this.socket.onopen = () => {
                console.log("WebSocket connection opened");
            };

            this.socket.onmessage = (event) => this.onMessage(event);
        
            this.socket.onerror = (error) => {
                console.error("WebSocket error:", error);
                reject(error);
            };

            //console.log("hi, i add handler");
            EventSystem.addHandler(E.LoginEvent, (event: E.LoginEvent) => {
                WebSocketSystem.uuid = event.uuid;
                console.log("[WebSocketSystem] Login as", event.uuid);
                resolve(WebSocketSystem.socket);
            });
        });
    }
    static total = 0;
    static totalnum = 0;
    static update() {
        const entities = EntitySystem.getAll();
        for(const entity of entities) {
            const sends = entity.getAllS(this);
            //if(sends.length > 0) console.log(sends);
            if(sends.length > 0) {
                //console.log("Send", sends);
                this.send([new E.ComponentSetEvent(entity.id, sends)]);
            }
            for(const component of sends) component.mark(this);
        }
    }
    static onMessage(event: MessageEvent) {
        this.total += (new Uint8Array(event.data)).length;
        this.totalnum += 1;
        // const json = decode(new Uint8Array(event.data)) as any;
        // console.log(event.data);
        const decompressed = decompressUsingDict(this.dctx, new Uint8Array(event.data), this.dict);
        // const decompressed = decompress(new Uint8Array(event.data));
        const jsonString = this.u8decoder.decode(decompressed);
        const json = JSON.parse(jsonString);
        // console.log(json);

        
        // console.log(json)
        // throw new Error("IDK");
        // console.log(json);
        //console.log("[WebSocketSystem] receive", json);
        for(let message of json) {
            const component = SerializeSystem.deserialize(message);
           // console.log("[WebSocketSystem] receive", component);
            if(component instanceof E.MyEvent) {
                EventSystem.addEvent(component);
                //console.log("[WebSocketSystem] receive", component);
            }
        }
    }
    static send(message: Array<E.MyEvent>) {
        const json: any = []
        for(let component of message) {
            component.clear();
            json.push(SerializeSystem.serialize(component));
        }
        const jsonString = JSON.stringify(json);
        const buffer = this.u8encoder.encode(jsonString);
        const compressed = compressUsingDict(this.cctx, buffer, this.dict, 3);
        // const compressed = compress(buffer, 3);
        // const str = encode(json);
        if(Config.log_level>=8) {
            console.log("Send", message);
        }
        this.socket.send(compressed);
    }
};