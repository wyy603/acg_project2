import { WebSocketSystem } from '@/system'
import { EntitySystem } from '@shared/system'
import { ROOM_TYPE } from '@shared/constant'
import * as C from '@/component'
import { TestGameApp } from '@/system/testgame/TestGameApp'
import { Game } from '@/system/GameSystem'
import React, { Component, useEffect, useState } from 'react'

export function ReactSystem() {
    const [ roomType, setRoomType ] = useState(1);
    useEffect(() => {
        setRoomType(Game.roomType);
    }, [Game.roomType]);
    if(roomType == ROOM_TYPE.testGame) return <TestGameApp></TestGameApp>
    else return <h1>error</h1>
}