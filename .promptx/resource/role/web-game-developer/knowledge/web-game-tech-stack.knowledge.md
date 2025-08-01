<knowledge>
  ## Web游戏开发技术栈详解
  
  ### Canvas 2D游戏开发核心技术
  
  ```javascript
  // Canvas 2D游戏引擎基础架构
  class Canvas2DEngine {
      constructor(canvasId) {
          this.canvas = document.getElementById(canvasId);
          this.ctx = this.canvas.getContext('2d');
          this.gameObjects = [];
          this.lastTime = 0;
      }
      
      // 游戏主循环
      gameLoop(currentTime) {
          const deltaTime = currentTime - this.lastTime;
          this.update(deltaTime);
          this.render();
          this.lastTime = currentTime;
          requestAnimationFrame((time) => this.gameLoop(time));
      }
      
      // 精灵渲染系统
      renderSprite(sprite, x, y, width, height) {
          this.ctx.drawImage(
              sprite.image,
              sprite.x, sprite.y, sprite.width, sprite.height,
              x, y, width, height
          );
      }
  }
  ```
  
  ### WebGL/Three.js 3D游戏开发
  
  ```javascript
  // Three.js 3D游戏基础设置
  class ThreeJSGame {
      constructor() {
          // 场景、相机、渲染器
          this.scene = new THREE.Scene();
          this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
          this.renderer = new THREE.WebGLRenderer();
          
          // 物理引擎集成 (Cannon.js)
          this.world = new CANNON.World();
          this.world.gravity.set(0, -9.82, 0);
      }
      
      // 3D模型加载
      loadModel(path, onLoad) {
          const loader = new THREE.GLTFLoader();
          loader.load(path, (gltf) => {
              this.scene.add(gltf.scene);
              onLoad(gltf);
          });
      }
      
      // 物理body创建
      createPhysicsBox(size, mass, position) {
          const shape = new CANNON.Box(new CANNON.Vec3(size.x/2, size.y/2, size.z/2));
          const body = new CANNON.Body({ mass: mass });
          body.addShape(shape);
          body.position.set(position.x, position.y, position.z);
          this.world.add(body);
          return body;
      }
  }
  ```
  
  ### 主流游戏框架对比分析
  
  | 框架 | 特点 | 适用场景 | 学习难度 | 性能 |
  |------|------|----------|----------|------|
  | **Phaser.js** | 功能完整，API友好 | 2D游戏，快速开发 | 低 | 中高 |
  | **PixiJS** | 高性能渲染引擎 | 2D动画，移动游戏 | 中 | 高 |
  | **Three.js** | 3D图形库，易上手 | 3D可视化，简单3D游戏 | 中 | 中高 |
  | **Babylon.js** | 专业3D游戏引擎 | 复杂3D游戏，VR/AR | 高 | 高 |
  | **PlayCanvas** | 云端开发平台 | 商业3D游戏，团队协作 | 中 | 高 |
  
  ### Phaser.js框架深度应用
  
  ```javascript
  // Phaser.js游戏配置
  const gameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      physics: {
          default: 'arcade',
          arcade: {
              gravity: { y: 300 },
              debug: false
          }
      },
      scene: {
          preload: preload,
          create: create,
          update: update
      }
  };
  
  // 场景创建
  function create() {
      // 创建玩家
      this.player = this.physics.add.sprite(100, 450, 'player');
      this.player.setBounce(0.2);
      this.player.setCollideWorldBounds(true);
      
      // 创建平台组
      this.platforms = this.physics.add.staticGroup();
      this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
      
      // 碰撞检测
      this.physics.add.collider(this.player, this.platforms);
  }
  ```
  
  ### PixiJS高性能渲染
  
  ```javascript
  // PixiJS应用初始化
  const app = new PIXI.Application({
      width: 800,
      height: 600,
      backgroundColor: 0x1099bb
  });
  
  // 纹理批处理优化
  class SpritePool {
      constructor(texture, poolSize) {
          this.pool = [];
          this.texture = texture;
          
          for (let i = 0; i < poolSize; i++) {
              const sprite = new PIXI.Sprite(texture);
              sprite.visible = false;
              this.pool.push(sprite);
          }
      }
      
      getSprite() {
          for (let sprite of this.pool) {
              if (!sprite.visible) {
                  sprite.visible = true;
                  return sprite;
              }
          }
          return null; // 池已满
      }
      
      releaseSprite(sprite) {
          sprite.visible = false;
      }
  }
  ```
</knowledge>
