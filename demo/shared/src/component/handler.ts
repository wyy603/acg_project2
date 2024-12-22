import { EventSystem, EntitySystem } from '@shared/system'
import * as C from '@shared/component'
import * as E from '@shared/component/event'

export function initHandler() {
    EventSystem.addHandler(E.EntityAddedEvent, (event: E.EntityAddedEvent) => {
        EntitySystem.onEntityAdded(event.room, event.entityId)
    });
    EventSystem.addHandler(E.ComponentSetEvent, (event: E.ComponentSetEvent) => {
        const entity = EntitySystem.get(event.entityId);
        const components = event.value;
        for(const component of components) component.clear(), component._typeUComponent = true;
        if(entity) {
            entity.receive(event.value);
        }
    });
    EventSystem.addHandler(E.EntityRemovedEvent, (event: E.EntityRemovedEvent) => {
        EntitySystem.onEntityRemoved(event.entityId)
    });
    EventSystem.addHandler(E.EntitySetRoomEvent, (event: E.EntitySetRoomEvent) => {
        const entity = EntitySystem.get(event.entityId);
        if(entity) EntitySystem.setRoom(entity, event.room);
    });
}