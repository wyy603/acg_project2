// IMPORTANT: When to spawn orders. 
// 1. Current order counts smaller than min_orders
// 2. One order is completed, then wait for 5 seconds, spawn another if current orders < max orders.
// 3. Reaching some pre-determined timestamp. (更有节奏性？)
// 4. Maybe others. (Spawn another two with probability p?)

import { FoodInfo, OrderInfo } from "@shared/component";
import { ORDER_TYPE } from "@shared/constant";
import { OvercraftUpdateEvent } from "@shared/component/event";
import { Config } from "@shared/constant";
import { ORDER_PROPERTY } from "@shared/constant";

/** How to spawn orders:
 * 1. If some food that is available to spawn at this time is not spawned, spawned one of them.
 * 2. Otherwise pick any avaiable food. 
 * 3. Do nothing if no avaiable food. 
 */

/** Order value
 * should be determined in foodInfo (with bonus and penalty). 
 */

const level1Config = {
	duration: 5,
	minOrders: 2,
	maxOrders: 6,
	orderRegisterList: [
		{ type: ORDER_TYPE.Chopped_Potato, availableTime: [-1, 90] },
		{ type: ORDER_TYPE.Chopped_Tomato, availableTime: [-1, 90] },
		{ type: ORDER_TYPE.Salad, availableTime: [60, 150]},
		{ type: ORDER_TYPE.Tomato_Pizza, availableTime: [90, 240]},
		{ type: ORDER_TYPE.Pepperoni_Pizza, availableTime: [120, 270]},
		{ type: ORDER_TYPE.Hamburger, availableTime: [150, 300]},
	], 
	spawnCheckpoints: [20, 40, 40, 80, 80, 110, 140, 170, 200, 230, 250, 275], 
};

export class OvercraftSystemBasic {
	roomID: number;
	protected isServer: boolean;
	protected config: any;
	isEnded: boolean;
	protected spawnTimestamps: number[] | undefined;
	protected score: number[];
	protected currentOrders: OrderInfo[];
	protected onServingList: FoodInfo[]
	protected static checkInterval = Config.overcraft_checkinterval;
	protected subtick: number;
	protected messenger: OvercraftUpdateEvent;
	static TIME_PER_SEC: number = 1000;

	constructor(roomID: number, isServer: boolean) {
		this.roomID = roomID;
		this.isServer = isServer;
		this.score = [0,0];
		this.currentOrders = [];
		this.onServingList = [];
		this.subtick = 0;
		this.messenger = new OvercraftUpdateEvent(-1,false,false,false,[],[]);
		this.isEnded = true;
	}

	displayInfo(): void {
		console.log(`Room ID: ${this.roomID}, Is Server: ${this.isServer}`);
	}

	setConfig(config:any = level1Config): void {
		this.config = config;
	}

	isRunning(): boolean {
		return this.isEnded !== true;
	}

	protected spawnOrder(): boolean {
		const availableOrders = this.config.orderRegisterList.filter((order: any) => {
			return ( order.availableTime[0] * OvercraftSystemBasic.TIME_PER_SEC <= this.subtick! && this.subtick! <= order.availableTime[1] * OvercraftSystemBasic.TIME_PER_SEC);
		}).map((order: any) => {
			return new OrderInfo(order.type,this.subtick);
		});
		console.log("[OvercraftsystemBasic]: ", availableOrders);
		if(availableOrders.length === 0) return false;

		const priorOrders = availableOrders.filter((order: any) => {
			for(const x of this.currentOrders!) {
				if(x.type == order.type) return false;
			}
			return true;
		})

		let toSpawn = undefined;
		if(priorOrders.length !== 0)
		{
			toSpawn = priorOrders.at(Math.floor(Math.random() * priorOrders.length));
		}
		else
		{
			toSpawn = availableOrders.at(Math.floor(Math.random() * availableOrders.length));
		}

		console.log("To Spawn is:", toSpawn);

		this.currentOrders!.push(toSpawn);
		console.log(this.currentOrders.length);
		this.messenger.spawnList.push(toSpawn);

		return true;
	}

}