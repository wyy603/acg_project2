import { EventSystem, EntitySystem } from '@shared/system'
import * as C from '@/component'
import * as E from '@shared/component/event'

import { WebSocketSystem, GameSystem } from '@/system'

import { initHandler as sharedInitHandler } from '@shared/component/handler'

export function initHandler() {
    EventSystem.addHandler(E.EntityAddedEvent, (event: E.EntityAddedEvent) => {
        console.log("server handler add entity", event.entityId);
        WebSocketSystem.broadcast(event.room, [event]);
    });
    // EventSystem.addHandler(E.ComponentSetEvent, (event: E.ComponentSetEvent) => {
    //     const entity = EntitySystem.get(event.entityId);
    //     if(entity) WebSocketSystem.broadcast(entity.room, [event], event._origin);
    // });
    EventSystem.addHandler(E.EntityRemovedEvent, (event: E.EntityRemovedEvent) => {
        console.log("server handler remove entity", event.entityId);
        WebSocketSystem.broadcast(event.room, [event]);
    });
    sharedInitHandler();

    EventSystem.addHandler(E.Broadcast, (event: E.Broadcast) => WebSocketSystem.broadcast(event.room, event.value));
}