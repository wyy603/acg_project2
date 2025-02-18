import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'url';
import * as THREE from 'three';

import * as C from '@/component'
import { Entity } from '@shared/basic'
import '@shared/component/event'
import '@/component'
import { SerializeSystem, EntitySystem, EventSystem } from '@shared/system'
import { Config, ROOM_TYPE } from '@shared/constant'

import { TestGame } from '@/system/testgame/TestGame'
import { WebSocketSystem } from '@/system/WebSocketSystem'

import { initHandler } from '@/component/handler'
import { GridSystem } from './GridSystem';
import { OvercraftSystemServer } from './OvercraftSystem';
import { globalWorld } from './testgame/PhysicsSystem'

export class GameSystem {
    static games: Map<number, TestGame> = new Map();
    static gamesystems: Map<number, any> = new Map();
    static roomName: Map<number, string> = new Map();
    static activate = false
    static timeStamp = 0;
    static async addRoom(room: number, level: number, name: string) {
        const game = new TestGame(room, level);
        await game.init();
        this.games.set(room, game);
        const sys0 = new OvercraftSystemServer(room, true); // NOTE: actually still in room id 0, too lazy to change. 
        sys0.setLevel(level);
        this.gamesystems.set(room, sys0);
        this.roomName.set(room, name);
    }
    static async init() {
        SerializeSystem.init();
        EntitySystem.init();
        await WebSocketSystem.init();
        initHandler();

        await this.addRoom(0, 0, "main");
        await this.addRoom(1, 3, "qwq2");
        
        /*{
            const game0 = new TestGame(0, 0);
            await game0.init();
            this.games.set(0, game0);
            const sys0 = new OvercraftSystemServer(0, true); // NOTE: actually still in room id 0, too lazy to change. 
            sys0.setConfig();
            this.gamesystems.set(0, sys0);
        }

        {
            const game1 = new TestGame(1, 2);
            await game1.init();
            this.games.set(1, game1);
            const sys1 = new OvercraftSystemServer(1, true);
            sys1.setConfig();
            this.gamesystems.set(1, sys1);
        }

        {
            const game1 = new TestGame(2, 2);
            await game1.init();
            this.games.set(2, game1);
            const sys1 = new OvercraftSystemServer(2, true);
            sys1.setConfig();
            this.gamesystems.set(2, sys1);
        }

        {
            const game1 = new TestGame(3, 2);
            await game1.init();
            this.games.set(3, game1);
            const sys1 = new OvercraftSystemServer(3, true);
            sys1.setConfig();
            this.gamesystems.set(3, sys1);
        }*/
    }
    static getRoomType(id: number) {
        if(this.games.get(id) instanceof TestGame) return ROOM_TYPE.testGame;
        else {
            console.log("[GameSystem] Wrong getRoomType");
            return ROOM_TYPE.testGame;
        }
    }
    static getRoomSystem(id: number) {
        return this.gamesystems.get(id)!;
    }
    static gameLoop() {
        const players = EntitySystem.getAll(C.Player);
        if (players.length == 0) {
            console.log('No players, waiting...')
            const list = EntitySystem.getAll();
            console.log("Number of entities:", list.length);
            WebSocketSystem.update();
            setTimeout(() => this.gameLoop(), 1000);
        } else {
            const time1 = performance.now();
            const list = EntitySystem.getEntityByRoom(1);
            /*console.log("all entities:");
            for(const entity of list){
                const sprite=entity.get(C.SpriteInfo);
                if(sprite)console.log(sprite.name,entity.id,entity.room);
                //console.log(entity);
            }*/
            for(const game of this.games.values()) {
                game.removePlayers();
            }
            for(const game of this.games.values()) {
                game.addPlayers();
            }
            if(globalWorld) {
                const now = Date.now();
                const dt = (now - this.timeStamp) / 1000;
                if(this.timeStamp != 0) globalWorld.stepSimulation( dt, 13, 1/90);
                this.timeStamp = now;
            }
            for(const game of this.games.values()) {
                if(!this.activate) game.timeStamp = Date.now();
                game.update();
            }
            WebSocketSystem.update();
            
            if(!this.activate) this.activate = true;
            const time2 = performance.now();
            // console.log("[GameSystem] dt (milisecond)", time2 - time1);
            if(Config.server_tickrate == 0)
                setImmediate(() => this.gameLoop());
            else {
                if((time2 - time1) > 1000 / Config.server_tickrate) {
                    //console.log("Warning! Tick rate can not be reached!");
                }
                setTimeout(() => this.gameLoop(), 1000 / Config.server_tickrate - (time2 - time1));
            }
            //setImmediate(() => this.gameLoop());
        }
    }
}