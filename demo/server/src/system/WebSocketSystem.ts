import WebSocket, { WebSocketServer } from 'ws';
import { Server, createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
// import { encode, decode } from '@msgpack/msgpack'

import * as C from '@/component'
import * as E from '@shared/component/event'
import { Entity } from '@shared/basic'
import { EventSystem, SerializeSystem, EntitySystem } from '@shared/system'
import { init as zstd_init , decompress, compress, compressUsingDict, createCCtx, decompressUsingDict, createDCtx } from '@bokuweb/zstd-wasm';

import { Config, ROOM_TYPE, SPRITE_STATE } from '@shared/constant'
import fs from 'fs'
import path from 'path'
const dataset_path = './../assets/';
import { readFileSync } from 'fs';

export class WebSocketSystem {
    public static port = Config.server_port;
    public static server: Server;
    public static wsServer: WebSocket.Server;
    public static buffer = new Map<string, Array<E.MyEvent>>();
    private static sentBytes = 0;
    private static receivedBytes = 0;
    private static dict: any;
    private static cctx: any;
    private static dctx: any;
    private static u8encoder: any;
    private static u8decoder: any;
    static async init() {
        await zstd_init();
        this.server = createServer();
        this.wsServer = new WebSocketServer({ server: this.server });
        this.wsServer.on("connection", this.onConnection.bind(this));
        this.server.listen(this.port, () => {
            console.log(`WebSocket server is running on port ${this.port}`);
        });
        setInterval(() => {
            //console.log(`Sent bytes: ${this.sentBytes} per second`);
            //console.log(`Received bytes: ${this.receivedBytes} per second`);
            this.sentBytes = 0;
            this.receivedBytes = 0;
        }, 1000);
        this.cctx = createCCtx();
        this.dctx = createDCtx();
        this.u8encoder = new TextEncoder();
        this.u8decoder = new TextDecoder('utf-8');
        const dict = readFileSync(path.join(dataset_path,'dict'));
        console.log(dict);
        this.dict = this.u8encoder.encode(dict);
        // fs.readdir(dataset_path, (err, files) => {
            //     if (err) {
                //         console.error('Error reading directory:', err);
                //         return;
                //     }
                //     console.log("Outputing files");
                
                //     files.forEach(file => {
        //         console.log(file);
        //     });
        // });
    }
    static onConnection(ws: WebSocket) {
        const entity = new Entity(0), id = entity.id;
        const player = new C.Player(ws, entity.id);
        entity.set(player);
        console.log(`New Player connected, uuid ${id}, Player Name: ${player.name}`);
        ws.on("message", (message: WebSocket.RawData) => this.onMessage(id, message));
        ws.on("close", () => this.onClose(id));

        /*setTimeout(() => {
            EntitySystem.setRoom(player, 1);
            player.set(new C.PlayerRoom(ROOM_TYPE.overcooked));
        }, 5000);*/
        console.log("[WebSocketSystem] add Player ", id)
        this.send(id, [new E.LoginEvent(id, entity.id)]);
    }
    static onMessage(id: number, message: WebSocket.RawData) {
        if(message instanceof Buffer) {
            const decompressed = decompressUsingDict(this.dctx, new Uint8Array(message), this.dict);
            // const decompressed = decompress(new Uint8Array(message));
            const jsonString = this.u8decoder.decode(decompressed);
            const json = JSON.parse(jsonString);
            // const json = decode(new Uint8Array(message)) as any;
            this.receivedBytes += (new Uint8Array(message)).length;
            for(let message of json) {
                const component = SerializeSystem.deserialize(message);
                if(component instanceof E.MyEvent) {
                    EventSystem.addEvent(component);
                }
            }
        } else {
            console.log("[WebSocketSystem] Wrong receive!", message);
        }
    }
    static onClose(id: number) {
        //console.log("[WebSocketSystem] Remove Player ", id);
        const player = EntitySystem.get(id); if(!player) return;
        player.removeEntity();
    }
    static update() {
        const entities = EntitySystem.getAll();
        for(const entity of entities) {
            const sends = entity.getAllS(this);
            if(sends.length > 0) {
                this.broadcast(entity.room, [new E.ComponentSetEvent(entity.id, sends)]);
            }
            for(const component of sends) component.mark(this);
            if(entity._roomUpdated) {
                this.broadcast(entity.room, [new E.EntitySetRoomEvent(entity.id, entity.room)]);
                entity._roomUpdated = false;
            }
        }
    }
    static broadcast(room: number, message: Array<E.MyEvent>) {
        //console.log(`${id} Broadcast ${message}`);

        const json: any = []
        for(let component of message) {
            component.clear();
            json.push(SerializeSystem.serialize(component));
        }
        // const str = new Uint8Array(encode(json));
        const jsonString = JSON.stringify(json);
        const buffer = this.u8encoder.encode(jsonString);
        const compressed = compressUsingDict(this.cctx, buffer, this.dict, 3);
        // const compressed = compress(buffer, 3);
        // if(Math.floor(Math.random() * 10) == 0)
        // {
        //     const fileName = `data_${uuidv4()}.json`; // or `data_${uuidv4()}.json`
        //     const filePath = path.join(dataset_path, fileName);
        //     // Write the JSON string to a file in the dataset_path
        //     // fs.writeFile(filePath, jsonString, 'utf-8', (err) => {
        //     //     if (err) {
        //     //         console.error('Error writing to file:', err);
        //     //     } else {
        //     //         console.log(`File written successfully to ${filePath}`);
        //     //     }
        //     // });
        //console.log("[WebSocket] broadcast");
        const entities = EntitySystem.getAll(C.Player);

        if(Config.server_debug_ms == 0) {
            for(const entity of entities) {
                const player = entity.get(C.Player)!;
                if(entity.room == room) {
                    player.ws.send(compressed);
                    this.sentBytes += compressed.length;  // Increment sent byte counter
                }
            }
        } else {
            setTimeout(() => {
                for(const entity of entities) {
                    const player = entity.get(C.Player)!;
                    if (entity.room == room) {
                        player.ws.send(compressed);
                        this.sentBytes += compressed.length;  // Increment sent byte counter
                    }
                }
            }, Config.server_debug_ms);
        }
    }
    static send(id: number, message: Array<E.MyEvent>) {
        const json: any = [];
        let flag = false;
        for (let component of message) {
            component.clear();
            if(component instanceof E.LoginEvent) {
                console.log("LoginEvent");
                flag = true;
            }
            json.push(SerializeSystem.serialize(component));
        }
        // const str = new Uint8Array(encode(json));
        
        const jsonString = JSON.stringify(json);
        const buffer = this.u8encoder.encode(jsonString);
        const compressed = compressUsingDict(this.cctx, buffer, this.dict, 3);
        // const compressed = compress(buffer, 3);

        const entity = EntitySystem.get(id); if (!entity) return;
        const player = entity.get(C.Player); if (!player) return;
        if (Config.server_debug_ms == 0) {
            player.ws.send(compressed);
            this.sentBytes += Buffer.byteLength(compressed, 'utf8');  // Increment sent byte counter
        } else {
            setTimeout(() => {
                player.ws.send(compressed);
                this.sentBytes += Buffer.byteLength(compressed, 'utf8');  // Increment sent byte counter
            }, Config.server_debug_ms);
        }
        /*if(flag) {
            console.log("LoginEvent send");
            console.log(str);
            throw Error("1");
        }*/
    }
};