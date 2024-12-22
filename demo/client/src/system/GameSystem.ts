import * as C from '@/component'
import { EntitySystem } from '@shared/system'
import { WebSocketSystem, RenderSystem, AssetSystem } from '@/system'
import * as THREE from 'three'
import Stats from 'three/addons/libs/stats.module.js';
import { TestGame } from '@/system/testgame/TestGame'
import { ROOM_TYPE } from '@shared/constant'
import { initHandler } from '@/component/handler'
import { Config, INGREDIENT_PROPERTY } from '@shared/constant'
import { HTMLSystem } from './testgame/HTMLSystem'
import { OvercraftSystemClient } from './testgame/OvercraftSystem'
import { ClientConfig } from '@/system'

export class ScreenSystem {
    static screenElement: Element
    static screenWidth = 0
    static screenHeight = 0
    static init() {
        this.screenElement = document.getElementsByClassName('screen')[0];
    }
    static calculateSize() {
        const rect = this.screenElement.getBoundingClientRect();
        this.screenWidth = rect.width;
        this.screenHeight = rect.height;
    }
    static getWidth() { return this.screenWidth; }
    static getHeight() { return this.screenHeight; }
};

export class Game {
    private static clock = new THREE.Clock();
    private static stats = new Stats();
    static gamesystems: Map<number, any>;
    static roomType = ROOM_TYPE.testGame;
    private static currentGame: TestGame | null = null;

    static async init() {
        EntitySystem.init();
        AssetSystem.init();
        for (const [ingredient, ingredientInfo] of Object.entries(INGREDIENT_PROPERTY)) {
            if (ingredientInfo.mesh) {
                await AssetSystem.load(ingredientInfo.mesh.path);
            }
        }

        await WebSocketSystem.init();

        ScreenSystem.init();
        ScreenSystem.calculateSize();
        RenderSystem.init(ScreenSystem.getWidth(), ScreenSystem.getHeight());
        initHandler();
        
        const domElement = RenderSystem.getDomElement();
        ScreenSystem.screenElement.appendChild(domElement);
        ScreenSystem.screenElement.appendChild( this.stats.dom );
        window.addEventListener( 'resize', () => {
            ScreenSystem.calculateSize();
            RenderSystem.resize(ScreenSystem.getWidth(), ScreenSystem.getHeight());
        }, false );

        this.gamesystems = new Map();
        const gamesystem = new OvercraftSystemClient(0, false);
        gamesystem.setConfig();
        this.gamesystems.set(0,gamesystem);
        gamesystem.run();
        /*WebSocketSystem.send([new PlayerRoomChangeEvent(WebSocketSystem.uuid, 1)]);*/
    }

    static getGame(state: ROOM_TYPE) {
        if(state == ROOM_TYPE.testGame) return new TestGame();
        else return null;
    }
    static getGameSystem(id: number) {
        return this.gamesystems.get(id)!;
    }

    static time = 0;
    static lastRender = 0;
    static render() {
        if(ClientConfig.lowFPS && Date.now()-this.lastRender <= 1000/35) {
            return;
        }
        this.lastRender = Date.now();
        this.stats.begin(); // Show FPS
        if(this.currentGame) this.currentGame.render();
        this.stats.end(); // Show FPS
    }
    static startGameLoop() {
        //console.log("[GameSystem] GameLoop start.");
        const time1 = performance.now();

        if (Config.log_level >= 5) {
            console.log("gameLoop start.");
        }
        const dt = this.clock.getDelta(); // Physics Simulation
        const timeStamp = Date.now();
        
        // get new game
        const player = EntitySystem.get(WebSocketSystem.uuid); if(player) {
            const playerInfo = player.getR(C.PlayerRoom); if(playerInfo) {
                if(!playerInfo.updated(Game)) {
                    console.log("Change Game!!!!!!!!!!!!!!", playerInfo);
                    if(this.currentGame) this.currentGame.deactivate();
                    this.roomType = playerInfo.roomType;
                    this.currentGame = this.getGame(this.roomType);
                    if(this.currentGame) this.currentGame.activate();
                    playerInfo.mark(Game);
                }
            }
        }
        if(this.currentGame) this.currentGame.update(dt, timeStamp);
        
        // debug
        if(Config.log_level>=1) {
            if(this.time == Config.client_tickrate) {
                HTMLSystem.set2("Logger", "websocket_total", WebSocketSystem.total);
                HTMLSystem.set2("Logger", "websocket_totalnum", WebSocketSystem.totalnum);
                WebSocketSystem.total = 0, WebSocketSystem.totalnum = 0;
                this.time = 0;
            }
        }
        this.time += 1;
        WebSocketSystem.update();

        const time2 = performance.now();

        //console.log("[GameSystem]", EntitySystem.getAll());

        // loop
        if(Config.client_tickrate == 0)
            setImmediate(() => this.startGameLoop())
        else {
            if((time2 - time1) > 1000 / Config.client_tickrate) {
                console.log("Warning! Tick rate can not be reached!");
            }
            HTMLSystem.set2("Logger", "dt(milisecond)", (time2 - time1).toFixed(2));
            setTimeout(() => this.startGameLoop(), 1000 / Config.client_tickrate - (time2 - time1));
        }
    }
    static run() {
        RenderSystem.setAnimationLoop(() => this.render());
        this.startGameLoop();
    }
};