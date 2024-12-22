import { GameSystem } from '@/system/GameSystem'

await GameSystem.init();
GameSystem.gameLoop();