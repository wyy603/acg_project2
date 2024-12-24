import { OvercraftSystemBasic } from '@shared/basic/OvercraftSystemBasic'
import { OrderInfo } from '@shared/component';
import { OvercraftUpdateEvent } from '@shared/component/event';
import { HTMLSystem } from './HTMLSystem'
import { ORDER_PROPERTY } from '@shared/constant';

export class OvercraftSystemClient extends OvercraftSystemBasic {
	protected weak_subtick: number;
	protected checkAll: boolean;
	protected completeList: OrderInfo[];
	protected createList: OrderInfo[];
	protected timeBais: number;
	private checkers: NodeJS.Timeout | null;
	constructor(roomID: number, isServer: boolean) {
		super(roomID, isServer);
		this.weak_subtick = 0;
		this.checkAll = false;
		this.completeList = [];
		this.createList = [];
		this.timeBais = 0;
		this.checkers = null;
	}
	delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
	private assertSync() {
		if(this.weak_subtick !== this.subtick) {
			throw new Error("[OvercraftSystem] Client not synced!");
		}
	}
	clearStatus() {
		this.spawnTimestamps = this.config.spawnCheckpoints.slice();
		this.spawnTimestamps!.sort((a, b) => a - b);
		this.score = [0,0];
		this.currentOrders = []
		this.onServingList = []
		this.subtick = 0;
		this.checkAll = false;
		this.completeList = [];
		this.createList = [];
		this.timeBais = -Date.now();
	}
	run(): void {
		if(!this.config) {
			throw new Error("No config detected");
		}
		
		this.clearStatus();
		this.isEnded = false;
		
		this.checkers = setInterval(() => {
			if(!this.isRunning()) {
				clearInterval(this.checkers!);
				return;
			}
			
			HTMLSystem.set2("OvercraftInfo", "score", Math.round(this.score[0]+this.score[1]));
			HTMLSystem.set2("OvercraftInfo", "time", Math.floor(this.weak_subtick / OvercraftSystemClient.TIME_PER_SEC));
			HTMLSystem.set2("OvercraftInfo", "orderList", this.currentOrders.map(x => {
				const info = ORDER_PROPERTY[x.type];
				return {ingredients: info.ingredients, percentage: Math.floor(x.getPercentage(this.weak_subtick) * 100), tutorial: info.tutorial};
			}));

			//order create, once per second. 
			for(let order of this.createList) {
				this.currentOrders.push(order);
			}
			this.createList = [];

			//Order complete check
			for(let food of this.completeList) {
				this.assertSync();
				for(let i = 0; i < this.currentOrders.length; i++) {
					const order = this.currentOrders[i];
					if(food.type === order.type) {
						const gain = order.getScore(this.subtick);
						this.score = this.score.map((value, index) => value + gain[index]);
						this.currentOrders!.splice(i, 1); // Remove the order
						i -= 1;
						break;
					}
				}
			}
			this.completeList = [];

			//Order expire check
			if(this.checkAll) {
				this.assertSync();
				if(this.currentOrders!.length && this.currentOrders!.at(0)!.getRemainingTime(this.subtick!) < 0) {
					const gain = this.currentOrders!.at(0)!.getScore(this.subtick!);
					this.score = this.score.map((value, index) => value + gain[index]);
					this.currentOrders!.splice(0,1);
				}
			}

			this.checkAll = false;
			this.weak_subtick = Date.now() + this.timeBais;

			// Game running check
			{
				if(this.subtick >= this.config.duration * OvercraftSystemBasic.TIME_PER_SEC) {
					this.assertSync();
					this.isEnded = true;
					clearInterval(this.checkers!);
					console.log('Duration reached');
					return;
				}
			}
		}, 1000 / OvercraftSystemBasic.TIME_PER_SEC);
	}
	onMessage(event: OvercraftUpdateEvent) {
		console.log("[OvercraftSystem]: recevied messages", event);
		if(event.reset) {
			console.log("Yes, i am reseting overcraft system.")
			if (this.checkers) { // Clear the interval if it exists
                if(this.checkers) clearInterval(this.checkers);
                this.checkers = null;
				return;
            }
			this.run();
		}
		if(event.stop) {
			console.log("Yes, i am stopping overcraft system.")
			if (this.checkers) { // Clear the interval if it exists
                clearInterval(this.checkers);
                this.checkers = null;
            }
			this.isEnded = true;
			this.clearStatus();
			HTMLSystem.set2("OvercraftInfo", "score", Math.round(this.score[0]+this.score[1]));
			HTMLSystem.set2("OvercraftInfo", "time", "Game is not running.");
			console.log(this.currentOrders);
			HTMLSystem.set2("OvercraftInfo", "orderList", this.currentOrders.map(x => {
				const info = ORDER_PROPERTY[x.type];
				return {ingredients: info.ingredients, percentage: Math.floor(x.getPercentage(this.weak_subtick) * 100)};
			}));
		}
		this.subtick = event.subtick;
		const now = Date.now();
		this.timeBais = -now + this.subtick;
		this.weak_subtick = now + this.timeBais;
		this.checkAll = true;
		this.completeList = event.completeList;
		this.createList = event.spawnList;
	}
}