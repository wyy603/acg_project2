import { EventSystem, EntitySystem } from '@shared/system'
import * as C from '@/component'
import * as E from '@shared/component/event'

import { WebSocketSystem, AssetSystem } from '@/system'

import { initHandler as sharedInitHandler } from '@shared/component/handler'
import { Game } from '@/system/GameSystem'

export function initHandler() {
    /*EventSystem.addHandler(E.EntityAddedEvent, (event: E.EntityAddedEvent) => {
        if(event._origin != "server") WebSocketSystem.send([event]);
    });
    EventSystem.addHandler(E.ComponentSetEvent, (event: E.ComponentSetEvent) => {
        const entity = EntitySystem.get(event.entityId);
        if(entity && event._origin != "server") WebSocketSystem.send([event]);
    });
    EventSystem.addHandler(E.EntityRemovedEvent, (event: E.EntityRemovedEvent) => {
        if(event._origin != "server") WebSocketSystem.send([event]);
    });*/
    sharedInitHandler();

    EventSystem.addHandler(E.LoadAssetEvent, async (event: E.LoadAssetEvent) => {
        const asset = await AssetSystem.load(event.name);
        const entity = EntitySystem.get(event.entityId);
        //console.log(`Load Asset ${event.name} to ${event.entityId}`);
        if(entity) {
            //console.log(`Find Entity ${event.entityId}, set ${event.name}`);
            entity.receive(new C.MeshByPathLoaded(event.name, event.args));
        }
    });
    EventSystem.addHandler(E.Broadcast, (event: E.Broadcast) => WebSocketSystem.send(event.value));
    EventSystem.addHandler(E.OvercraftUpdateEvent, (event: E.OvercraftUpdateEvent) => {
        Game.getGameSystem(0).onMessage(event);
    });
}