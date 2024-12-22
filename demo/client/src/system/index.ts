import { WebSocketSystem } from './WebSocketSystem'
import { SyncMeshSystem } from './SyncMeshSystem'
import { AssetSystem } from './AssetSystem'
import { RenderSystem } from './RenderSystem'
export { RenderSystem, WebSocketSystem, SyncMeshSystem, AssetSystem }

export class ClientConfig {
    static lowFPS = false;
    static noShadow = true;

    static update_lowFPS(x: boolean) {
        this.lowFPS = x;
    }
    static update_noShadow(x: boolean) {
        this.noShadow = x;
    }
}