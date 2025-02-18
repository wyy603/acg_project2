import { UComponent } from '@shared/basic'
import { Vector3 } from '@shared/component/physicsComponent'
import { SetMeshByPath } from '@shared/component/meshComponent'
import { Ammo, AmmoModule } from '@shared/utils/ammo'
import * as THREE from 'three'

export const Config = {
    server_port: 8000,
    server_tickrate: 60,
    client_tickrate: 128,
    overcraft_checkinterval: 10, //ms
    server_debug_ms: 0,
    log_level: 1,
    block_size: 16,
};
export enum CATCH_TYPE {
    NONE = -1,
    CONSTRAINT = 0,
    SIMPLE = 1,
    HAND = 2,
    TOTAL_NUM = 3,
};
export const CATCH_TYPE_NAME: Record<CATCH_TYPE, string> = {
    [CATCH_TYPE.NONE]: "None.",
    [CATCH_TYPE.CONSTRAINT]: "Set a constraint.",
    [CATCH_TYPE.SIMPLE]: "Soft catch.",
    [CATCH_TYPE.HAND]: "Grab in hand.",
    [CATCH_TYPE.TOTAL_NUM]: "ni wu di le"
};
export const CAMERA_PROP = {
    fov: 55,
    near: 0.1,
    far: 300
};
export enum ROOM_TYPE {
    testGame = 0,
    overcooked = 1
};
export enum SPRITE_STATE {
    NONE = 1,
    COLLIDE = 2,
    UPDATE_PHYSICS = 4,
    CATCHABLE = 8,
    IN_GRID = 16,
    IS_BORDER = 32,
    NO_RAYTEST = 64,
    DETECTOR = 128,
};
export enum GRID_TYPE {
    FLAT, PLATE, KNIFE, SERVING, SKILLET
};
export enum CollisionFlags {
    CF_STATIC_OBJECT = 1,
    CF_KINEMATIC_OBJECT = 2,
    CF_NO_CONTACT_RESPONSE = 4,
    CF_CUSTOM_MATERIAL_CALLBACK = 8,
    CF_CHARACTER_OBJECT = 16,
    CF_DISABLE_VISUALIZE_OBJECT = 32,
    CF_DISABLE_SPU_COLLISION_PROCESSING = 64,
    CF_HAS_CONTACT_STIFFNESS_DAMPING = 128,
    CF_HAS_CUSTOM_DEBUG_RENDERING_COLOR = 256,
    CF_HAS_FRICTION_ANCHOR = 512,
    CF_HAS_COLLISION_SOUND_TRIGGER = 1024
};
export const CAMERA_OFFSET = {
    x: 0,
    y: 1.8 * 1.0,
    z: -0.3
};
/*export const CAMERA_OFFSET = {
    x: 0,
    y: 5,
    z: 3
};*/
export const PLAYER_MOVEMENT = {
    speedY: 15,
    speedXZ: 40,
};

export enum INGREDIENT {
    cut,
    fried,
    plate,
    tomato,
    tomato_slice,
    potato,
    potato_slice,
    cabbage,
    cutted_cabbage,
    salad,
    raw_beef,
    cooked_beef,
    hamburger,
    sliced_bread,
    cucumber,
    cutted_cucumber,
    onion,
    cutted_onion,
    pizza_dough,
    pizza1,
    pizza2,
    pizza3,
    pizza4,
    pizza5,
    gun,
    knife,
};

interface INGREDIENT_INFO {
    name: string,
    recipe: INGREDIENT[]
    type: "raw" | "cylinder"

    recipe_ordered?: true
    mesh?: {path: string, scale: number};
    icon?: string

    collide?: AmmoModule.btCollisionShape,

    height?: number
    radius?: number
    priority?: number

    score?: number
};

/*
想渲染的就必须具有 mesh, collide
type=cylinder 必须具有 height, radius（除了cut之类的虚无东西）
type=compound 必须具有 score
*/

export const INGREDIENT_PROPERTY: Record<INGREDIENT, INGREDIENT_INFO> = {
    [INGREDIENT.tomato]: {
        name: "tomato",
        recipe: [],
        type: "raw",
        mesh: { path: "public/assets/food/tomato/tomato.glb", scale: 0.5 },
        icon: "public/assets/food/tomato/tomato_icon.png",
        collide: new Ammo.btSphereShape(0.3),
    },
    [INGREDIENT.cut]: {
        name: "cut",
        recipe: [],
        type: "cylinder",
    },
    [INGREDIENT.fried]: {
        name: "fried",
        recipe: [],
        type: "cylinder",
    },
    [INGREDIENT.tomato_slice]: {
        name: "tomato_slice",
        recipe: [INGREDIENT.tomato, INGREDIENT.cut],
        type: "cylinder",
        mesh: { path: "public/assets/food/tomato_slice/tomato_slice.glb", scale: 0.2 },
        icon: "public/assets/food/tomato_slice/icon.png",
        collide: new Ammo.btSphereShape(0.35),
        height: 0.04,
        radius: 0.28,
        priority: 0
    },
    [INGREDIENT.potato]: {
        name: "potato",
        recipe: [],
        type: "raw",
        mesh: { path: "public/assets/food/potato/potato.glb", scale: 0.5 },
        icon: "public/assets/food/potato/potato_slice.png",
        collide: new Ammo.btSphereShape(0.3),
    },
    [INGREDIENT.potato_slice]: {
        name: "potato_slice",
        recipe: [INGREDIENT.potato, INGREDIENT.cut],
        type: "cylinder",
        mesh: { path: "public/assets/food/potato_slice/potato_slice.glb", scale: 0.2 },
        icon: "public/assets/food/potato_slice/potato_slice.png",
        collide: new Ammo.btSphereShape(0.35),
        height: 0.04,
        radius: 0.28,
        priority: 0
    },
    [INGREDIENT.plate]: {
        name: "plate",
        recipe: [],
        type: "cylinder",
        mesh: { path: "public/assets/plate/plate.glb", scale: 0.5 },
        height: 0.11,
        radius: 0.50,
        priority: 100
    },
    [INGREDIENT.cabbage]: {
        name: "cabbage",
        recipe: [],
        type: "raw",
        mesh: { path: "public/assets/food/cabbage/cabbage.glb", scale: 0.05 },
        collide: new Ammo.btSphereShape(0.3),
    },
    [INGREDIENT.cutted_cabbage]: {
        name: "cutted_cabbage",
        recipe: [INGREDIENT.cabbage, INGREDIENT.cut],
        type: "cylinder",
        mesh: { path: "public/assets/food/cutted_cabbage/cutted_cabbage.glb", scale: 0.4 },
        icon: "public/assets/food/cutted_cabbage/icon.png",
        collide: new Ammo.btSphereShape(0.35),
        height: 0.04,
        radius: 0.28,
        priority: 0
    },
    [INGREDIENT.salad]: {
        name: "salad",
        recipe: [INGREDIENT.tomato_slice, INGREDIENT.cutted_cabbage, INGREDIENT.cutted_cabbage, INGREDIENT.cutted_onion],
        type: "cylinder",
        mesh: { path: "public/assets/food/salad/salad.glb", scale: 0.04 },
        collide: new Ammo.btSphereShape(0.3),
        height: 0.12,
        radius: 0.50,
        priority: 0
    },
    [INGREDIENT.raw_beef]: {
        name: "raw_beef",
        recipe: [],
        type: "raw",
        mesh: { path: "public/assets/food/raw_beef/raw_beef.glb", scale: 2.5 },
        icon: "public/assets/food/raw_beef/icon.png",
        collide: new Ammo.btSphereShape(0.3),
    },
    [INGREDIENT.cooked_beef]: {
        name: "cooked_beef",
        recipe: [INGREDIENT.raw_beef, INGREDIENT.fried],
        type: "cylinder",
        mesh: { path: "public/assets/food/cooked_beef/cooked_beef.glb", scale: 0.03 },
        icon: "public/assets/food/cooked_beef/icon.png",
        collide: new Ammo.btSphereShape(0.3),
        height: 0.12,
        radius: 0.50,
        priority: 0
    },
    [INGREDIENT.hamburger]: {
        name: "hamburger",
        recipe: [INGREDIENT.sliced_bread, INGREDIENT.tomato_slice, INGREDIENT.cooked_beef, INGREDIENT.cutted_cabbage, INGREDIENT.sliced_bread],
        type: "cylinder",
        mesh: { path: "public/assets/food/hamburger/hamburger.glb", scale: 0.027 },
        collide: new Ammo.btSphereShape(0.3),
        height: 0.12,
        radius: 0.50,
        priority: 0
    },
    [INGREDIENT.cucumber]: {
        name: "cucumber",
        recipe: [],
        type: "raw",
        mesh: { path: "public/assets/food/cucumber/cucumber.glb", scale: 0.14 },
        collide: new Ammo.btSphereShape(0.35),
    },
    [INGREDIENT.cutted_cucumber]: {
        name: "cutted_cucumber",
        recipe: [INGREDIENT.cucumber, INGREDIENT.cut],
        type: "cylinder",
        mesh: { path: "public/assets/food/cutted_cucumber/cutted_cucumber.glb", scale: 0.04 },
        icon: "public/assets/food/cutted_cucumber/icon.png",
        collide: new Ammo.btSphereShape(0.35),
        height: 0.06,
        radius: 0.28,
        priority: 0
    },
    [INGREDIENT.sliced_bread]: {
        name: "sliced_bread",
        recipe: [],
        type: "cylinder",
        mesh: { path: "public/assets/food/sliced_bread/sliced_bread.glb", scale: 4 },
        icon: "public/assets/food/sliced_bread/icon.png",
        collide: new Ammo.btSphereShape(0.35),
        height: 0.04,
        radius: 0.28,
        priority: 0
    },
    [INGREDIENT.onion]: {
        name: "onion",
        recipe: [],
        type: "raw",
        mesh: { path: "public/assets/food/onion/onion.glb", scale: 0.4 },
        collide: new Ammo.btSphereShape(0.25),
    },
    [INGREDIENT.cutted_onion]: {
        name: "cutted_onion",
        recipe: [INGREDIENT.onion, INGREDIENT.cut],
        type: "cylinder",
        mesh: { path: "public/assets/food/cutted_onion/cutted_onion.glb", scale: 0.04 },
        icon: "public/assets/food/cutted_onion/icon.png",
        collide: new Ammo.btSphereShape(0.35),
        height: 0.04,
        radius: 0.28,
        priority: 0
    },
    [INGREDIENT.pizza_dough]: {
        name: "pizza_dough",
        recipe: [],
        type: "cylinder",
        mesh: { path: "public/assets/food/pizzas/pizza_dough.glb", scale: 3.35 },
        icon: "public/assets/food/pizzas/pizza_dough.png",
        //collide: new Ammo.btSphereShape(0.35),
        height: 0.04,
        radius: 0.50,
        priority: 50
    },
    [INGREDIENT.pizza1]: {
        name: "pizza1",
        recipe: [INGREDIENT.pizza_dough, INGREDIENT.tomato_slice, INGREDIENT.fried],
        type: "cylinder",
        mesh: { path: "public/assets/food/pizzas/pizza1.glb", scale: 0.05 },
        //collide: new Ammo.btSphereShape(0.35),
        height: 0.04,
        radius: 0.50,
        priority: 0
    },
    [INGREDIENT.pizza2]: {
        name: "pizza2",
        recipe: [INGREDIENT.pizza_dough, INGREDIENT.tomato_slice, INGREDIENT.cutted_cucumber, INGREDIENT.fried],
        type: "cylinder",
        mesh: { path: "public/assets/food/pizzas/pizza2.glb", scale: 0.05 },
        //collide: new Ammo.btSphereShape(0.35),
        height: 0.04,
        radius: 0.50,
        priority: 0
    },
    [INGREDIENT.pizza3]: {
        name: "pizza3",
        recipe: [INGREDIENT.pizza_dough, INGREDIENT.cutted_cucumber, INGREDIENT.fried],
        type: "cylinder",
        mesh: { path: "public/assets/food/pizzas/pizza3.glb", scale: 0.05 },
        //collide: new Ammo.btSphereShape(0.35),
        height: 0.04,
        radius: 0.50,
        priority: 0
    },
    [INGREDIENT.pizza4]: {
        name: "pizza4",
        recipe: [],
        type: "cylinder",
        mesh: { path: "public/assets/food/pizzas/pizza4.glb", scale: 0.05 },
        //collide: new Ammo.btSphereShape(0.35),
        height: 0.04,
        radius: 0.50,
        priority: 0
    },
    [INGREDIENT.pizza5]: {
        name: "pizza5",
        recipe: [INGREDIENT.pizza_dough, INGREDIENT.cooked_beef, INGREDIENT.fried],
        type: "cylinder",
        mesh: { path: "public/assets/food/pizzas/pizza5.glb", scale: 0.05 },
        //collide: new Ammo.btSphereShape(0.35),
        height: 0.04,
        radius: 0.50,
        priority: 0
    },
    [INGREDIENT.gun]: {
        name: "gun",
        recipe: [],
        type: "raw",
        mesh: { path: "public/assets/tool/gun/gun.glb", scale: 1 },
        collide: new Ammo.btSphereShape(0.4),
    },
    [INGREDIENT.knife]: {
        name: "knife",
        recipe: [],
        type: "raw",
        mesh: { path: "public/assets/tool/knife/knife.glb", scale: 1 },
        collide: new Ammo.btCapsuleShape(0.2, 0.8),
    },
};

export interface LEVEL_Config {
    level_path: string | undefined,
    level_name: string,
    knive_detectors: Vector3[],
    skillets: Vector3[],
    knives: Vector3[],
    servingArea: Vector3[],
    storage: {position: Vector3, item: INGREDIENT}[],
    flatPositions: Vector3[],
    faces: {position: Vector3, name: string}[]
    water: {p1: Vector3, p2: Vector3}[]
    tools: {position: Vector3, type: "lantern" | "gun"}[],
    generatePosition: Vector3,
    roomPosition: Vector3,
    tips?: {position: Vector3, str: string}[],
};


export const LEVEL0_Config: LEVEL_Config = {
    level_path: "public/assets/main_world/main_world_mc.glb",
    level_name: "main_world",
    roomPosition: new Vector3(0, -3, 0),
    generatePosition: new Vector3(0, 10, 0),
    knive_detectors: [
        new Vector3(-2, 5, 2).dec(new Vector3(0, 0, 0)),
    ],
    skillets: [
        new Vector3(-2, 5, -1).dec(new Vector3(0, 0, 0)),
    ],
    knives: [
        /*new Vector3(0, 10, 0).dec(new Vector3(0, 0, 0)),
        new Vector3(0, 10, 0).dec(new Vector3(0, 0, 0)),
        new Vector3(0, 10, 0).dec(new Vector3(0, 0, 0)),*/
    ],
    servingArea: [
    ],
    storage: [
        { position: new Vector3(-2, 5, 6).dec(new Vector3(0, 0, 0)), item: INGREDIENT.tomato },
        { position: new Vector3(-2, 5, 5).dec(new Vector3(0, 0, 0)), item: INGREDIENT.potato },
        { position: new Vector3(-2, 5, 7).dec(new Vector3(0, 0, 0)), item: INGREDIENT.raw_beef },
        { position: new Vector3(-2, 5, -4).dec(new Vector3(0, 0, 0)), item: INGREDIENT.plate },
        { position: new Vector3(1, 5, 9).dec(new Vector3(0, 0, 0)), item: INGREDIENT.knife },
        { position: new Vector3(1, 5, -10).dec(new Vector3(0, 0, 0)), item: INGREDIENT.gun },
    ],
    flatPositions: [
        new Vector3(-2, 4.5, -7).dec(new Vector3(0, 0, 0)),
        new Vector3(-2, 4.5, -8).dec(new Vector3(0, 0, 0)),
    ],
    faces: [
        { position: new Vector3(-1.499, 5, -1).dec(new Vector3(0, 0, 0)), name: "stove_front_on" },
        { position: new Vector3(1, 5.501, 9).dec(new Vector3(0, 0, 0)), name: "assets/tool/knife/icon.png" },
        { position: new Vector3(1, 5.501, -10).dec(new Vector3(0, 0, 0)), name: "assets/tool/gun/icon.png" },
    ],
    water: [],
    tools: [
        //{position: new Vector3(0, 10, 0), type: "gun"},
    ],
    tips: [
        { position: new Vector3(-2, 2, 4).dec(new Vector3(0, 0, 0)), str: "鼠标左键：拿起物品或与生成器、菜板、放置区等交互；鼠标右键：放下物品。" },
        { position: new Vector3(-2, 2, 1).dec(new Vector3(0, 0, 0)), str: "在拿起食物时，鼠标左键可以将部分食物放到菜板上。只能在菜板上切菜。" },
        { position: new Vector3(-2, 2, -2).dec(new Vector3(0, 0, 0)), str: "在拿起食物时，鼠标左键可以将部分食物放到煎锅上。" },
        { position: new Vector3(-2, 2, -5).dec(new Vector3(0, 0, 0)), str: "左边生成盘子，右边是放置区。只能在放置区对食物进行合成。所有菜都需要放在盘子上才能送出。在聊天栏中输入 /help 查询更多帮助。" },
    ],
};

export const LEVEL1_Config: LEVEL_Config = {
    level_path: "public/assets/level1/level1.glb",
    level_name: "level1_test",
    roomPosition: new Vector3(100, 2, 10),
    generatePosition: new Vector3(104, 6, 12),
    knive_detectors: [
        new Vector3(103, 6, 7).dec(new Vector3(100, 2, 10))
    ],
    skillets: [],
    knives: [],
    servingArea: [
        new Vector3(93, 6, 13).dec(new Vector3(100, 2, 10))
    ],
    storage: [
        { position: new Vector3(102, 6, 13).dec(new Vector3(100, 2, 10)), item: INGREDIENT.tomato },
        { position: new Vector3(101, 6, 13).dec(new Vector3(100, 2, 10)), item: INGREDIENT.potato },
    ],
    flatPositions: [] as Vector3[],
    faces: [],
    water: [],
    tools: [],
};
for (let x = 95; x <= 101; x++) {
    LEVEL1_Config.flatPositions.push(new Vector3(x, 6, 10).dec(new Vector3(100, 2, 10)));
}

export const LEVEL2_Config: LEVEL_Config = {
    level_path: "public/assets/level2/level2.glb",
    level_name: "level2_test",
    roomPosition: new Vector3(100, 2, 10),
    generatePosition: new Vector3(104, 6, 12),
    knive_detectors: [
        new Vector3(105, 7, 14).dec(new Vector3(100, 2, 11)),
        new Vector3(104, 7, 14).dec(new Vector3(100, 2, 11)),
        new Vector3(103, 7, 14).dec(new Vector3(100, 2, 11)),
        new Vector3(99, 7, 15).dec(new Vector3(100, 2, 11)),
        new Vector3(98, 7, 15).dec(new Vector3(100, 2, 11)),
    ],
    skillets: [
        new Vector3(105, 7, 6).dec(new Vector3(100, 2, 10)),
        new Vector3(105, 7, 7).dec(new Vector3(100, 2, 10)),
        new Vector3(100, 7, 14).dec(new Vector3(100, 2, 10)),
    ],
    knives: [
        new Vector3(105, 7, 15).dec(new Vector3(100, 2, 11)),
        new Vector3(104, 7, 15).dec(new Vector3(100, 2, 11)),
        new Vector3(103, 7, 15).dec(new Vector3(100, 2, 11)),
    ],
    servingArea: [] as Vector3[],
    storage: [
        { position: new Vector3(94, 7, 15).dec(new Vector3(100, 2, 11)), item: INGREDIENT.cucumber },
        { position: new Vector3(94, 7, 14).dec(new Vector3(100, 2, 11)), item: INGREDIENT.tomato },
        { position: new Vector3(94, 7, 13).dec(new Vector3(100, 2, 11)), item: INGREDIENT.potato },
        { position: new Vector3(94, 7, 12).dec(new Vector3(100, 2, 11)), item: INGREDIENT.cabbage },
        { position: new Vector3(94, 7, 11).dec(new Vector3(100, 2, 11)), item: INGREDIENT.raw_beef },
        { position: new Vector3(94, 7, 10).dec(new Vector3(100, 2, 11)), item: INGREDIENT.sliced_bread },
        { position: new Vector3(94, 7, 9).dec(new Vector3(100, 2, 11)), item: INGREDIENT.pizza_dough },
        { position: new Vector3(94, 7, 8).dec(new Vector3(100, 2, 11)), item: INGREDIENT.onion },
        { position: new Vector3(101, 7, 5).dec(new Vector3(100, 2, 11)), item: INGREDIENT.plate },
        { position: new Vector3(98, 7, 5).dec(new Vector3(100, 2, 11)), item: INGREDIENT.plate },
    ],
    flatPositions: [] as Vector3[],
    faces: [
        //{ position: new Vector3(94.501, 7, 8).dec(new Vector3(100, 2, 11)), name: "stove_front_on" },
        //{ position: new Vector3(94.501, 7, 7).dec(new Vector3(100, 2, 11)), name: "stove_front_on" },
        { position: new Vector3(104.499, 7, 7).dec(new Vector3(100, 2, 11)), name: "stove_front_on" },
        { position: new Vector3(104.499, 7, 8).dec(new Vector3(100, 2, 11)), name: "stove_front_on" },
        { position: new Vector3(94, 7.501, 14).dec(new Vector3(100, 2, 10)), name: INGREDIENT_PROPERTY[INGREDIENT.cutted_cucumber].icon! },
        { position: new Vector3(94, 7.501, 10).dec(new Vector3(100, 2, 10)), name: "cow" },
        { position: new Vector3(94, 7.501, 9).dec(new Vector3(100, 2, 10)), name: INGREDIENT_PROPERTY[INGREDIENT.sliced_bread].icon! },
        { position: new Vector3(94, 7.501, 8).dec(new Vector3(100, 2, 10)), name: INGREDIENT_PROPERTY[INGREDIENT.pizza_dough].icon! },
        { position: new Vector3(94, 7.501, 7).dec(new Vector3(100, 2, 10)), name: INGREDIENT_PROPERTY[INGREDIENT.cutted_onion].icon! },
    ],
    water: [],
    tools: [
        {position: new Vector3(105-0.6, 10, 14-0.6), type: "lantern"},
        //{position: new Vector3(105-1,13,15), type: "lantern"},
        //{position: new Vector3(94,13,14-1), type: "lantern"},
    ]
};
/*for(let x = 98; x <= 101; ++x) {
    for(let y = 10; y <= 15; ++y) LEVEL2_Config.faces.push({ position: new Vector3(x, 6.4, y).dec(new Vector3(100, 2, 11)), name: "water_still" })
}*/
for (let x = 94; x <= 97; x++) {
    LEVEL2_Config.servingArea.push(new Vector3(x, 6.7, 4).dec(new Vector3(100, 2, 11)));
}
for(let z = 5; z <= 9; ++z) {
    LEVEL2_Config.flatPositions.push(new Vector3(99, 6.7, z).dec(new Vector3(100, 2, 11)));
    LEVEL2_Config.flatPositions.push(new Vector3(100, 6.7, z).dec(new Vector3(100, 2, 11)));
}

export const LEVEL3_Config: LEVEL_Config = {
    level_path: "public/assets/level3/level3.glb",
    level_name: "level3",
    roomPosition: new Vector3(0, 0, 0),
    generatePosition: new Vector3(6, 28.6, -5.6),
    knive_detectors: [
        new Vector3(12, 29, -11),
        new Vector3(14, 29, -16),
        new Vector3(15, 29, -16),
        new Vector3(16, 29, -16),
    ],
    skillets: [
        new Vector3(17, 29, -15),
        new Vector3(17, 29, -14),
    ],
    knives: [
        new Vector3(12, 31, -16),
        new Vector3(12, 31.5, -16),
        new Vector3(12, 32, -16),
    ],
    servingArea: [
        new Vector3(11, 28.7, -11),
        new Vector3(11, 28.7, -12),
        new Vector3(11, 28.7, -13),
        new Vector3(11, 28.7, -14),
        new Vector3(11, 28.7, -15),
    ],
    storage: [
        { position: new Vector3(17, 29, -7), item: INGREDIENT.tomato },
        { position: new Vector3(17, 31, -7), item: INGREDIENT.potato },
        { position: new Vector3(17, 29, -5), item: INGREDIENT.cabbage },
        { position: new Vector3(17, 31, -5), item: INGREDIENT.cucumber },
        { position: new Vector3(15, 29, -5), item: INGREDIENT.pizza_dough },
        { position: new Vector3(14, 29, -5), item: INGREDIENT.cutted_onion },
        { position: new Vector3(17, 30, -9), item: INGREDIENT.raw_beef },
        { position: new Vector3(11, 29, -9), item: INGREDIENT.plate },
    ],
    flatPositions: [
        new Vector3(12, 28.7, -13),
        new Vector3(12, 28.7, -14),
        new Vector3(12, 28.7, -15),
        new Vector3(17, 28.7, -13),
        new Vector3(17, 28.7, -11),
    ],
    faces: [
        { position: new Vector3(16.499, 29, -15), name: "stove_front_on" },
        { position: new Vector3(16.499, 29, -14), name: "stove_front_on" },
        { position: new Vector3(17.499, 32, -5), name: INGREDIENT_PROPERTY[INGREDIENT.cutted_cucumber].icon! },
        { position: new Vector3(15, 29, -5.501), name: INGREDIENT_PROPERTY[INGREDIENT.pizza_dough].icon! },
        { position: new Vector3(14, 29, -5.501), name: INGREDIENT_PROPERTY[INGREDIENT.cutted_onion].icon! },
        { position: new Vector3(17.499, 31, -9), name: "cow" },
    ],
    water: [],
    tools: [
        { position: new Vector3(14,32,-11), type: "lantern" },
    ]
};

export enum ORDER_TYPE {
    Chopped_Potato,
    Chopped_Tomato,
    Salad,
    Tomato_Pizza,
    Pepperoni_Pizza,
    Hamburger,
}

export const TIME_PER_COMPLEXITY = 15;

type ORDER_INFO = {
    ingredients: INGREDIENT[];
    complexity: number; // expire time = 10 * complexity. 
    tutorial: INGREDIENT[]
    scoreFunction: (x: any) => any;
};

export const ORDER_PROPERTY: Record<ORDER_TYPE, ORDER_INFO> = {
    [ORDER_TYPE.Chopped_Potato]: {
        ingredients: [INGREDIENT.potato_slice, INGREDIENT.plate],
        complexity: 2,
        tutorial: [INGREDIENT.potato_slice],
        scoreFunction: (x) => (x >= 0 ? [1 * 20, x] : [-30, 0]),
    },
    [ORDER_TYPE.Chopped_Tomato]: {
        ingredients: [INGREDIENT.tomato_slice, INGREDIENT.plate],
        complexity: 2,
        tutorial: [INGREDIENT.tomato_slice],
        scoreFunction: (x) => (x >= 0 ? [1 * 20, x] : [-30, 0]),
    },
    [ORDER_TYPE.Salad]: {
        ingredients: [INGREDIENT.salad, INGREDIENT.plate],
        complexity: 3,
        tutorial: [INGREDIENT.tomato_slice, INGREDIENT.cutted_cabbage, INGREDIENT.cutted_cabbage, INGREDIENT.cutted_onion],
        scoreFunction: (x) => (x >= 0 ? [2 * 20, x] : [-30, 0]),
    },
    [ORDER_TYPE.Tomato_Pizza]: {
        ingredients: [INGREDIENT.pizza1, INGREDIENT.plate],
        complexity: 4,
        tutorial: [INGREDIENT.pizza_dough, INGREDIENT.tomato_slice],
        scoreFunction: (x) => (x >= 0 ? [3 * 20, x] : [-30, 0]),
    },
    [ORDER_TYPE.Pepperoni_Pizza]: {
        ingredients: [INGREDIENT.pizza5, INGREDIENT.plate],
        complexity: 5,
        tutorial: [INGREDIENT.pizza_dough, INGREDIENT.cooked_beef, INGREDIENT.fried],
        scoreFunction: (x) => (x >= 0 ? [4 * 20, x] : [-30, 0]),
    },
    [ORDER_TYPE.Hamburger]: {
        ingredients: [INGREDIENT.hamburger, INGREDIENT.plate],
        complexity: 6,
        tutorial: [INGREDIENT.sliced_bread, INGREDIENT.tomato_slice, INGREDIENT.cooked_beef, INGREDIENT.cutted_cabbage, INGREDIENT.sliced_bread],
        scoreFunction: (x) => (x >= 0 ? [5 * 20, x] : [-30, 0]),
    },
};
