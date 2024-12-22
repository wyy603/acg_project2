import { OvercraftSystemBasic } from '@shared/basic/OvercraftSystemBasic'
import { FoodInfo, OrderInfo } from '@shared/component';
import { OvercraftUpdateEvent } from '@shared/component/event';
import { WebSocketSystem } from '../WebSocketSystem';
import { HTMLSystem } from './HTMLSystem'
import { ORDER_PROPERTY } from '@shared/constant';
import { INGREDIENT_PROPERTY } from '@shared/constant';

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
	run(): void {
		if(!this.config) {
			throw new Error("No config detected");
		}

		this.isEnded = false;
		this.spawnTimestamps = this.config.spawnCheckpoints.slice();
		this.spawnTimestamps!.sort((a, b) => a - b);
		this.score = [0,0];
		this.currentOrders.length = 0;
		this.onServingList.length = 0;
		this.subtick = 0;
		this.checkAll = false;
		this.completeList = [];
		this.createList = [];
		this.timeBais = -Date.now();

		this.checkers = setInterval(() => {
			if(!this.isRunning()) {
				clearInterval(this.checkers!);
				return;
			}
			
			HTMLSystem.set2("OvercraftInfo", "score", Math.round(this.score[0]+this.score[1]));
			HTMLSystem.set2("OvercraftInfo", "time", Math.floor(this.weak_subtick / OvercraftSystemClient.TIME_PER_SEC));
			HTMLSystem.set2("OvercraftInfo", "orderList", this.currentOrders.map(x => {
				const info = ORDER_PROPERTY[x.type];
				return {ingredients: info.ingredients, percentage: Math.floor(x.getPercentage(this.weak_subtick) * 100)};
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
			if (this.checkers) { // Clear the interval if it exists
                clearInterval(this.checkers);
                this.checkers = null;
				this.run();
				return;
            }
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