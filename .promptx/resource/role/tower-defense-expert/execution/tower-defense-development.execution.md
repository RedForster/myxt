<execution>
  <constraint>
    ## 技术架构强制约束
    - **核心技术栈**：必须使用Phaser 3 + TypeScript + Vite组合，这是经过验证的最佳实践
    - **项目结构**：必须采用模块化目录结构：src/scenes、src/entities、src/systems、src/ui
    - **场景分离**：必须严格分离GameScene(游戏逻辑)和UIScene(界面逻辑)
    - **对象池使用**：射弹和敌人必须使用Phaser Groups对象池，避免性能问题
    - **状态管理**：敌人移动必须使用路径归一化值t，与视觉坐标解耦
    
    ## 开发环境限制
    - **Node.js版本**：建议使用LTS版本，确保Vite和TypeScript稳定运行
    - **浏览器兼容性**：主要支持现代浏览器的WebGL，Canvas作为回退方案
    - **测试环境**：Jest需要jest-canvas-mock来模拟Phaser所需的浏览器API
    - **部署要求**：vite.config.js必须正确配置base选项以支持GitHub Pages部署
  </constraint>

  <rule>
    ## 开发流程强制规则
    - **脚手架创建**：必须使用官方命令`npm create @phaserjs/game@latest`创建项目
    - **实体继承体系**：所有游戏对象必须继承自Entity基类，实现统一的生命值和伤害处理
    - **场景通信**：场景间必须使用Phaser EventEmitter进行通信，避免直接耦合
    - **资源加载**：所有资源必须在PreloaderScene中集中加载，提供加载进度反馈
    - **性能优化**：射弹和敌人必须使用group.get()和setActive(false)的对象池模式
    
    ## 代码质量规则
    - **类型安全**：所有函数参数和返回值必须有明确的TypeScript类型声明
    - **单一职责**：每个类和方法专注单一功能，避免上帝类
    - **配置驱动**：游戏参数(敌人属性、塔造价)必须使用配置文件管理
    - **错误处理**：关键逻辑必须有完善的错误处理和边界条件检查
    - **注释规范**：复杂算法和业务逻辑必须有清晰的注释说明
  </rule>

  <guideline>
    ## 架构设计指导原则
    - **框架优先**：充分利用Phaser 3内置功能，避免重复造轮子
    - **模块化思维**：系统间低耦合高内聚，便于测试和维护
    - **性能意识**：在关键路径上考虑性能影响，但避免过早优化
    - **可扩展性**：为未来功能扩展预留架构空间，考虑ECS演进路径
    - **开源借鉴**：参考tower-of-time-game等成功项目的最佳实践
    
    ## 用户体验指导
    - **响应性优先**：确保60FPS流畅体验，避免卡顿和掉帧
    - **视觉反馈**：重要操作要有明确的视觉和音频反馈
    - **加载体验**：提供友好的加载进度条和错误提示
    - **操作直观**：塔的放置、升级等操作要符合用户直觉
    - **平衡性**：游戏难度要有合理的学习曲线
  </guideline>

  <process>
    ## 塔防游戏开发标准流程
    
    ### Phase 1: 项目初始化 (1-2天)
    
    ```mermaid
    flowchart LR
        A[创建项目脚手架] --> B[配置开发环境]
        B --> C[设计项目结构]
        C --> D[创建基础场景]
        D --> E[配置资源加载]
    ```
    
    **具体步骤**：
    1. **执行脚手架命令**
       ```bash
       npm create @phaserjs/game@latest my-tower-defense
       cd my-tower-defense
       npm install
       ```
    
    2. **配置项目结构**
       ```
       src/
       ├── scenes/
       │   ├── PreloaderScene.ts
       │   ├── GameScene.ts
       │   └── UIScene.ts
       ├── entities/
       │   ├── Entity.ts
       │   ├── Enemy.ts
       │   ├── Tower.ts
       │   └── Projectile.ts
       ├── systems/
       │   ├── PathSystem.ts
       │   ├── CombatSystem.ts
       │   └── ResourceSystem.ts
       └── ui/
           ├── HealthBar.ts
           └── BuildMenu.ts
       ```
    
    3. **创建基础场景框架**
       - PreloaderScene: 资源加载和进度显示
       - GameScene: 核心游戏逻辑
       - UIScene: 用户界面覆盖层
    
    ### Phase 2: 核心系统实现 (3-5天)
    
    ```mermaid
    flowchart TD
        A[实体基类设计] --> B[敌人路径移动]
        B --> C[塔索敌射击]
        C --> D[射弹碰撞检测]
        D --> E[伤害计算系统]
        E --> F[游戏状态管理]
    ```
    
    **核心实现要点**：
    
    #### 1. 实体基类架构
    ```typescript
    abstract class Entity extends Phaser.GameObjects.Sprite {
      protected hp: number;
      protected maxHp: number;
      
      constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        scene.add.existing(this);
      }
      
      receiveDamage(damage: number): void {
        this.hp = Math.max(0, this.hp - damage);
        if (this.hp === 0) {
          this.destroy();
        }
      }
    }
    ```
    
    #### 2. 敌人路径移动系统
    ```typescript
    class Enemy extends Entity {
      private follower: Phaser.GameObjects.PathFollower;
      private path: Phaser.Curves.Path;
      
      update(delta: number): void {
        // 核心：使用归一化进度值更新位置
        this.follower.t += this.speed * delta;
        
        // 视觉更新是状态变化的结果
        const point = this.path.getPoint(this.follower.t);
        this.setPosition(point.x, point.y);
      }
    }
    ```
    
    #### 3. 塔索敌和射击系统
    ```typescript
    class Tower extends Entity {
      private target: Enemy | null = null;
      private attackRange: number = 100;
      private fireRate: number = 1000; // ms
      
      update(enemies: Phaser.GameObjects.Group): void {
        this.findTarget(enemies);
        if (this.target && this.canFire()) {
          this.fire();
        }
      }
      
      private findTarget(enemies: Phaser.GameObjects.Group): void {
        enemies.children.entries.forEach(enemy => {
          const distance = Phaser.Math.Distance.Between(
            this.x, this.y, enemy.x, enemy.y
          );
          if (distance <= this.attackRange) {
            this.target = enemy as Enemy;
            // 塔旋转朝向目标
            this.rotation = Phaser.Math.Angle.Between(
              this.x, this.y, enemy.x, enemy.y
            );
          }
        });
      }
    }
    ```
    
    #### 4. 对象池优化实现
    ```typescript
    class GameScene extends Phaser.Scene {
      private projectiles: Phaser.GameObjects.Group;
      private enemies: Phaser.GameObjects.Group;
      
      create(): void {
        // 创建对象池
        this.projectiles = this.add.group({
          classType: Projectile,
          maxSize: 100,
          runChildUpdate: true
        });
        
        this.enemies = this.add.group({
          classType: Enemy,
          maxSize: 50,
          runChildUpdate: true
        });
        
        // 碰撞检测
        this.physics.add.overlap(
          this.projectiles, 
          this.enemies, 
          this.handleCollision, 
          null, 
          this
        );
      }
      
      spawnProjectile(x: number, y: number): void {
        // 使用对象池获取射弹
        const projectile = this.projectiles.get(x, y);
        if (projectile) {
          projectile.setActive(true).setVisible(true);
        }
      }
      
      private handleCollision(projectile: Projectile, enemy: Enemy): void {
        enemy.receiveDamage(projectile.damage);
        
        // 回收到对象池而非销毁
        projectile.setActive(false).setVisible(false);
      }
    }
    ```
    
    ### Phase 3: UI和游戏完善 (2-3天)
    
    ```mermaid
    flowchart LR
        A[UI场景设计] --> B[生命条系统]
        B --> C[建造菜单]
        C --> D[游戏音效]
        D --> E[平衡性调试]
    ```
    
    **UI系统实现**：
    - 场景分离的UI覆盖层
    - 动态生命条跟随敌人
    - 塔建造和升级界面
    - 分数、金钱、生命值显示
    
    ### Phase 4: 测试和部署 (1-2天)
    
    ```mermaid
    flowchart LR
        A[单元测试配置] --> B[性能优化]
        B --> C[构建配置]
        C --> D[GitHub Pages部署]
    ```
    
    **关键配置**：
    
    #### Jest测试环境
    ```javascript
    // jest.config.js
    module.exports = {
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['jest-canvas-mock'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1'
      }
    };
    ```
    
    #### Vite部署配置
    ```javascript
    // vite.config.js
    export default {
      base: '/your-repo-name/', // 关键：GitHub Pages路径配置
      build: {
        outDir: 'dist',
        assetsDir: 'assets'
      }
    };
    ```
  </process>

  <criteria>
    ## 项目成功标准
    
    ### 技术质量指标
    - ✅ 60FPS稳定运行，无明显卡顿
    - ✅ TypeScript零错误，完整类型覆盖
    - ✅ 核心逻辑单元测试覆盖率 > 80%
    - ✅ 项目结构清晰，模块职责明确
    - ✅ 对象池正确实现，内存使用稳定
    
    ### 功能完整性
    - ✅ 敌人沿路径平滑移动
    - ✅ 塔准确索敌和射击
    - ✅ 射弹碰撞检测准确
    - ✅ UI响应及时，操作流畅
    - ✅ 资源加载完善，错误处理友好
    
    ### 工程质量
    - ✅ 本地开发环境一键启动
    - ✅ 生产构建成功，资源正确打包
    - ✅ GitHub Pages部署正常，无404错误
    - ✅ 代码可读性好，注释完善
    - ✅ Git提交历史清晰，版本管理规范
    
    ### 用户体验
    - ✅ 游戏规则易于理解
    - ✅ 操作响应及时准确
    - ✅ 视觉效果流畅自然
    - ✅ 音效配合恰当
    - ✅ 难度曲线合理
  </criteria>
</execution> 