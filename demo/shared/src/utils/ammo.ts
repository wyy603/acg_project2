//import { Ammo as AmmoModule } from '@enable3d/ammo-on-nodejs'
//import AmmoModule from 'ammo.js'
import AmmoModule from 'ammojs-typed'

//const Ammo = await AmmoModule();

const Ammo = await AmmoModule.bind(AmmoModule)(AmmoModule);
console.log("Ammo Loaded");

export { Ammo, AmmoModule };