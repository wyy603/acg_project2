// IMPORTANT: When to spawn orders. 
// 1. Current order counts smaller than min_orders
// 2. One order is completed, then wait for 5 seconds, spawn another if current orders < max orders.
// 3. Reaching some pre-determined timestamp. (更有节奏性？)
// 4. Maybe others. (Spawn another two with probability p?)

import { OvercraftSystemBasic } from '@shared/basic/OvercraftSystemBasic'
import { FoodInfo } from '@shared/component';
import { OvercraftUpdateEvent } from '@shared/component/event';
import { WebSocketSystem } from './WebSocketSystem';

/** How to spawn orders:
 * 1. If some food that is available to spawn at this time is not spawned, spawned one of them.
 * 2. Otherwise pick any avaiable food. 
 * 3. Do nothing if no avaiable food. 
 */

/** Order value
 * should be determined in foodInfo (with bonus and penalty). 
 */

export class OvercraftSystemServer extends OvercraftSystemBasic {
	protected startTime: number;
	protected lastCreate: number;
	constructor(roomID: number, isServer: boolean) {
		super(roomID, isServer);
		this.startTime = 0;
		this.lastCreate = 0;
	}
	delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
	async run(): Promise<void> {
		if(!this.config) {
			throw new Error("No config detected");
		}

		this.isEnded = false;
		this.spawnTimestamps = this.config.spawnCheckpoints.slice();
		this.spawnTimestamps!.sort((a, b) => a - b);
		this.score = [0,0];
		this.currentOrders = [];
		this.onServingList = [];
		this.subtick = 0;
		this.messenger = new OvercraftUpdateEvent(-1,false,false,false,[],[]);
		this.startTime = Date.now();
		this.lastCreate = -10000;
		this.messenger.reset = true;

		// console.log("I think this is only runned once.");

		const runChecker = () => {
			if(!this.isRunning()) return;

			this.subtick = (Date.now()-this.startTime);

			//order create, once per second. 
			if(this.subtick - this.lastCreate >= OvercraftSystemBasic.TIME_PER_SEC)
			{
				// console.log(this.subtick);
				if(this.spawnTimestamps!.length > 0 && this.spawnTimestamps![0] * OvercraftSystemBasic.TIME_PER_SEC <= this.subtick && this.currentOrders!.length < this.config.maxOrders) {
					this.spawnOrder();
					this.spawnTimestamps!.splice(0,1);
				}else if(this.currentOrders!.length < this.config.minOrders) {
					this.spawnOrder();
				}

				this.lastCreate = this.subtick;
				console.log(this.subtick);

			}

			//Order complete check
			if(this.onServingList.length)
			{
				const food = this.onServingList.at(0)!;
				this.onServingList.splice(0,1);
				let flag = false;
				for (let i = 0; i < this.currentOrders!.length; i++) {
					const order = this.currentOrders![i];
					console.log("Identity",order.getIdentity(),food.getIdentity());
					if (food.getIdentity() === order.getIdentity()) {
						const gain = order.getScore(this.subtick);
						this.score = this.score.map((value, index) => value + gain[index]);
						this.currentOrders!.splice(i, 1); // Remove the order
						i -= 1;
						this.messenger.completeList.push(order);
						flag = true;
						this.spawnTimestamps!.push(this.subtick / OvercraftSystemBasic.TIME_PER_SEC + 5);
						this.spawnTimestamps!.sort((a, b) => a - b);
						break;
					}
				}
				if(!flag) console.log("Serving wrong food",this.currentOrders, food);
			}

			//Order expire check
			if(this.currentOrders!.length && this.currentOrders!.at(0)!.getRemainingTime(this.subtick!) < 0) {
				const gain = this.currentOrders!.at(0)!.getScore(this.subtick!);
				this.score = this.score.map((value, index) => value + gain[index]);
				this.currentOrders!.splice(0,1);
				this.messenger.checkAll = true;
			}
			
			this.subtick += 1;
			//Game ending check
			if(this.subtick >= this.config.duration * OvercraftSystemBasic.TIME_PER_SEC) {
				this.close();
			}

			//send updates to clients
			if(this.messenger.completeList.length || this.messenger.checkAll || this.messenger.spawnList.length || this.messenger.reset || this.messenger.stop) {
				this.messenger.subtick = this.subtick;
				WebSocketSystem.broadcast(this.roomID, [this.messenger]);
				this.messenger = new OvercraftUpdateEvent(-1,false,false,false,[],[]);
			}


			setTimeout(runChecker, OvercraftSystemBasic.checkInterval);
		};

		runChecker();
		
	}
	close() {
		this.isEnded = true;
		this.messenger.stop = true;
		WebSocketSystem.broadcast(this.roomID, [this.messenger]);
		this.messenger = new OvercraftUpdateEvent(-1,false,false,false,[],[]);
		console.log('Game is stopped');
		return;
	}
	onServing(food: FoodInfo) {
		console.log("Serving food!: ", food);
		if (!this.isRunning()) return;
		this.onServingList.push(food);
	}
}