<execution>
  <constraint>
    ## Web游戏开发客观限制
    - **浏览器性能约束**：受限于JavaScript执行效率和浏览器渲染能力
    - **网络传输限制**：游戏资源大小和加载速度的平衡要求
    - **设备兼容性约束**：不同设备的性能差异和输入方式差异
    - **Web标准限制**：必须遵循Web安全模型和浏览器API限制
    - **内存管理约束**：JavaScript垃圾回收机制对实时性能的影响
  </constraint>

  <rule>
    ## 强制性开发规则
    - **性能优先原则**：任何功能实现都必须考虑性能影响
    - **兼容性保证**：支持主流浏览器和移动设备
    - **代码模块化**：采用清晰的模块化架构，便于维护和扩展
    - **错误处理完备**：所有可能的异常情况都要有适当的处理机制
    - **资源优化强制**：图片、音频、模型等资源必须优化压缩
    - **渐进式加载**：大型游戏必须支持资源的渐进式加载
  </rule>

  <guideline>
    ## 开发指导原则
    - **用户体验优先**：流畅的游戏体验胜过复杂的功能
    - **技术栈简洁**：选择最适合的技术，避免过度工程化
    - **迭代式开发**：从最小可行产品开始，逐步完善功能
    - **测试驱动**：重要功能和算法要有对应的测试用例
    - **文档完备**：代码注释清晰，关键算法有详细说明
    - **社区标准**：遵循Web开发和游戏开发的最佳实践
  </guideline>

  <process>
    ## Web游戏开发标准流程
    
    ### Step 1: 游戏设计理解与需求分析
    
    ```mermaid
    flowchart TD
        A[游戏设计文档] --> B[核心玩法分析]
        B --> C[技术需求提取]
        C --> D[性能需求评估]
        D --> E[平台兼容性要求]
        E --> F[技术栈选型建议]
        
        B --> B1[游戏类型识别<br/>2D/3D/混合]
        C --> C1[渲染需求<br/>物理需求<br/>AI需求]
        D --> D1[帧率要求<br/>内存限制<br/>加载时间]
        E --> E1[浏览器支持<br/>移动端适配<br/>输入方式]
    ```
    
    **需求分析输出**：
    - 技术需求规格书
    - 性能指标定义
    - 兼容性要求清单
    - 开发复杂度评估
    
    ### Step 2: 技术架构设计
    
    ```mermaid
    graph TD
        A[系统架构设计] --> B[渲染系统]
        A --> C[游戏逻辑系统]
        A --> D[输入系统]
        A --> E[音频系统]
        A --> F[网络系统]
        
        B --> B1[Canvas 2D<br/>WebGL 3D<br/>混合渲染]
        C --> C1[状态管理<br/>事件系统<br/>物理引擎]
        D --> D1[输入抽象<br/>手势识别<br/>设备适配]
        E --> E1[音效管理<br/>音乐播放<br/>3D音频]
        F --> F1[资源加载<br/>多人同步<br/>数据存储]
    ```
    
    **架构设计模板**：
    
    ```javascript
    // 游戏核心架构示例
    class GameEngine {
        constructor() {
            this.renderer = new Renderer();
            this.inputManager = new InputManager();
            this.audioManager = new AudioManager();
            this.sceneManager = new SceneManager();
            this.gameLoop = new GameLoop();
        }
        
        init() {
            // 初始化各个系统
        }
        
        update(deltaTime) {
            // 游戏逻辑更新
        }
        
        render() {
            // 渲染处理
        }
    }
    ```
    
    ### Step 3: 核心算法实现
    
    ```mermaid
    flowchart LR
        A[算法需求] --> B{算法类型}
        
        B -->|移动控制| C[平滑移动<br/>重力模拟<br/>碰撞响应]
        B -->|AI行为| D[状态机<br/>寻路算法<br/>决策树]
        B -->|物理模拟| E[碰撞检测<br/>物理引擎<br/>粒子系统]
        B -->|游戏逻辑| F[回合制<br/>技能系统<br/>随机生成]
        
        C --> G[代码实现]
        D --> G
        E --> G
        F --> G
        
        G --> H[性能测试]
        H --> I[优化调整]
    ```
    
    **经典算法实现示例**：
    
    ```javascript
    // 碰撞检测算法示例
    class CollisionDetector {
        // AABB碰撞检测
        static checkAABB(rect1, rect2) {
            return rect1.x < rect2.x + rect2.width &&
                   rect1.x + rect1.width > rect2.x &&
                   rect1.y < rect2.y + rect2.height &&
                   rect1.y + rect1.height > rect2.y;
        }
        
        // 圆形碰撞检测
        static checkCircle(circle1, circle2) {
            const dx = circle1.x - circle2.x;
            const dy = circle1.y - circle2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < circle1.radius + circle2.radius;
        }
    }
    
    // A*寻路算法示例
    class PathFinder {
        static findPath(grid, start, end) {
            // A*算法实现
            const openSet = [start];
            const closedSet = [];
            
            while (openSet.length > 0) {
                // 寻路逻辑
            }
            
            return path;
        }
    }
    ```
    
    ### Step 4: 游戏系统集成
    
    ```mermaid
    graph TD
        A[核心系统] --> B[系统集成]
        B --> C[功能测试]
        C --> D[性能优化]
        D --> E[兼容性测试]
        E --> F[用户体验优化]
        
        A --> A1[渲染系统<br/>物理系统<br/>输入系统<br/>音频系统]
        
        D --> D1[渲染优化<br/>内存优化<br/>算法优化<br/>资源优化]
        
        E --> E1[浏览器测试<br/>设备测试<br/>性能测试<br/>错误处理]
    ```
    
    **集成测试流程**：
    
    ```javascript
    // 游戏主循环集成示例
    class Game {
        constructor() {
            this.engine = new GameEngine();
            this.currentScene = null;
            this.isRunning = false;
        }
        
        start() {
            this.engine.init();
            this.gameLoop();
        }
        
        gameLoop() {
            if (!this.isRunning) return;
            
            const now = performance.now();
            const deltaTime = now - this.lastTime;
            
            // 更新游戏逻辑
            this.update(deltaTime);
            
            // 渲染游戏画面
            this.render();
            
            this.lastTime = now;
            requestAnimationFrame(() => this.gameLoop());
        }
        
        update(deltaTime) {
            if (this.currentScene) {
                this.currentScene.update(deltaTime);
            }
        }
        
        render() {
            this.engine.renderer.clear();
            if (this.currentScene) {
                this.currentScene.render(this.engine.renderer);
            }
        }
    }
    ```
    
    ### Step 5: 性能优化与发布
    
    ```mermaid
    flowchart TD
        A[性能分析] --> B[瓶颈识别]
        B --> C[优化方案设计]
        C --> D[优化实施]
        D --> E[效果验证]
        E --> F{目标达成?}
        
        F -->|否| B
        F -->|是| G[准备发布]
        
        G --> H[资源压缩]
        H --> I[代码混淆]
        I --> J[部署优化]
        J --> K[监控部署]
    ```
    
    **性能优化清单**：
    
    | 优化类别 | 具体措施 | 预期效果 |
    |----------|----------|----------|
    | **渲染优化** | 批量绘制、纹理合并、LOD | 提升帧率30% |
    | **内存优化** | 对象池、资源释放、GC优化 | 减少内存占用50% |
    | **加载优化** | 资源预载、懒加载、压缩 | 减少加载时间60% |
    | **算法优化** | 空间分割、缓存计算 | 提升计算效率40% |
    
    **发布部署流程**：
    
    ```javascript
    // 构建配置示例
    const buildConfig = {
        // 代码压缩
        minification: true,
        
        // 资源优化
        imageOptimization: {
            quality: 0.8,
            format: 'webp'
        },
        
        // 音频压缩
        audioCompression: {
            bitrate: 128,
            format: 'ogg'
        },
        
        // 代码分割
        codeSplitting: true,
        
        // 缓存策略
        caching: {
            static: '1y',
            dynamic: '1d'
        }
    };
    ```
  </process>

  <criteria>
    ## 质量评价标准
    
    ### 技术实现质量
    - ✅ 代码结构清晰，模块化程度高
    - ✅ 算法实现正确，性能表现良好
    - ✅ 错误处理完备，异常情况覆盖全面
    - ✅ 代码注释详细，维护文档完整
    
    ### 性能表现指标
    - ✅ 60FPS稳定帧率（桌面端）
    - ✅ 30FPS稳定帧率（移动端）
    - ✅ 内存使用 < 100MB（简单游戏）
    - ✅ 初始加载时间 < 3秒
    
    ### 兼容性要求
    - ✅ 支持Chrome、Firefox、Safari、Edge最新版本
    - ✅ 支持iOS Safari、Android Chrome
    - ✅ 支持鼠标、触摸、键盘输入
    - ✅ 响应式设计适配不同屏幕尺寸
    
    ### 用户体验标准
    - ✅ 游戏操作响应及时
    - ✅ 视觉效果流畅自然
    - ✅ 音频同步准确无延迟
    - ✅ 加载过程有适当的提示和进度显示
  </criteria>
</execution>
