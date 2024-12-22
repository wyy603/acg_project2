import { createRoot } from 'react-dom/client';
import React from 'react';
import { ReactSystem } from '@/system/ReactSystem'
import { Game } from '@/system/GameSystem'

const root = createRoot(document.getElementById('hud')!);
root.render(<ReactSystem/>);

await Game.init();
Game.run();