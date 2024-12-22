# Introduction

Now (2024.12.6), our project has a multiplayer system, a physics system, and some GUI.

You can press WASD to move, SPACE to jump, Z,X to fire bullets.

- You can press left mouse button to pick up items, and press again to release what you grasp. (This grasp system is very interesting, we highly recommend you to try a lot.)
- At the demo overcooked room, you can press the white block to obtain a black ball (it will be foods), and you can put it on green areas (table), or put it on the cutter, press the green area below to transform it to a red ball (cooked food).
- You can change your name at the right bottom settings button.

# Framework

Client and server are both pure typescript. We use THREE.js for rendering, ammo.js for simulation, and WebSocket for network communications. 

# Installation

1. clone the package.

```shell
git clone https://github.com/Yao-class-graphics-studio/project-guohao-jing-yuyang-wu.git
```

you also need to clone the large files by git LFS:

```shell
git lfs pull
```



2. Install packages.

Firstly,

```shell
cd demo
```

We use nodejs version v18.20.4 and npm version v10.7.0. You can directly set the version by `nvm`:

```powershell
nvm use 18
```

Then just npm install:

```shell
npm install
```



3. Set symbol links.

Since client and server share same assets, you should create symbolic links (`server/public/assets -> assets`, `client/public/assets -> assets`) by your self.

Here's an example on windows powershell:

```powershell
mkdir .\server\public
New-Item -ItemType SymbolicLink -Path .\server\public\assets -Target assets
New-Item -ItemType SymbolicLink -Path .\client\public\assets -Target assets
```

# Run in dev mode

Start the server:

```
npm run server-dev
```

Start the client (We use vite and this command will guide you to the localhost url):

```
npm run client-dev
```



# Online Access

我们在清华内网启动了一个服务器，网址为 `http://59.66.132.25:9982`，只要服务器是开启的，你就可以通过点击这个链接进入游戏。

请注意，在 chrome 131 最新更新中，网站由于没有启用 https 会被列为不安全的网站，因此无法锁定鼠标。你可使用其他浏览器（如 edge 等）来访问，或者参考[这篇教程](https://blog.csdn.net/qq_33204709/article/details/139252475)把我们的网站列入安全网站并启用"锁定和使用鼠标"权限。
