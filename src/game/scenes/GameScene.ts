import { Scene } from 'phaser';
import { Tower } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { ImmuneOrgan } from '../entities/ImmuneOrgan';
import { Projectile } from '../entities/Projectile';
import { UNITS_CONFIG } from '../config/UnitsConfig';
import { LEVELS_CONFIG, LevelConfig } from '../config/LevelConfig';

/**
 * 主游戏场景
 * 负责游戏逻辑、实体管理和物理交互
 */
export class Game extends Scene {
    // 游戏配置
    private levelConfig: LevelConfig;
    private gameWidth: number;
    private gameStartTime: number = 0;
    
    // 实体组
    private towers: Phaser.Physics.Arcade.Group;
    private enemies: Phaser.Physics.Arcade.Group;
    private projectiles: Phaser.Physics.Arcade.Group;
    private immuneOrgan: ImmuneOrgan;
    private towerSensors: Phaser.Physics.Arcade.StaticGroup;
    
    // 地图遮罩 - 用于控制可移动和部署区域
    private backgroundMask: Phaser.GameObjects.Image;
    private maskData: Uint8Array | null = null;
    
    // 有效区域缓存 - 用于高效敌人生成
    private validSpawnAreas: Array<{x: number, y: number, width: number, height: number}> = [];
    private validSpawnPoints: Array<{x: number, y: number}> = [];
    
      
    // 调试模式状态
    private debugMode: boolean = false;
    private enemyDebugTexts: Map<number, Phaser.GameObjects.Text> = new Map();
    private debugGraphics: Phaser.GameObjects.Graphics | null = null;
    
    // 游戏状态
    private playerHealth: number;
    private playerResources: number;
    private allTargets: (Tower | ImmuneOrgan)[] = [];
    
    // 波次管理
    private waveTimers: Phaser.Time.TimerEvent[] = [];
    private lastSpawnedEnemy: Enemy | null = null;
    
    // 胜利条件相关
    private timerCompleted: boolean = false;
    private victoryCheckTimer: Phaser.Time.TimerEvent | null = null;
    
    // UI交互
    private selectedTowerType: string | null = null;
    private placementIndicator: Phaser.GameObjects.Container | null = null;
    private placementIndicatorCreated: boolean = false; // 添加标记表示指示器是否已创建
    // 塔数量限制
    private get currentAliveTowers(): number { return this.towers ? this.towers.children.entries.filter((t: any) => t?.active).length : 0; }
    
    // 调试模式
    private isDebugMode: boolean = false;

    constructor() {
        super('GameScene');
    }

    create(data?: { levelId?: string }): void {
        
        // 使用关卡配置，如果没有指定则使用demo
        const levelId = data?.levelId || 'demo';
        this.levelConfig = LEVELS_CONFIG[levelId as keyof typeof LEVELS_CONFIG] || LEVELS_CONFIG.demo;

        // 记录器：确保本地存储集合存在
        this.ensureCodexSeenStore();
        
        this.gameWidth = this.scale.width * 0.75; // 游戏区域占3/4屏幕
        
        // 重置游戏开始时间
        this.gameStartTime = this.time.now || Date.now(); // 记录场景创建时间，如果time.now为0则使用Date.now
        
        // 初始化游戏状态
        this.playerHealth = this.levelConfig.initialPlayerHealth;
        this.playerResources = this.levelConfig.initialResources;
        
        // 重置游戏状态标志
        this.timerCompleted = false;
        
        
        this.createBackground();
        this.createEntityGroups();
        this.createImmuneOrgan();
        this.setupPhysics();
        this.setupInput();
        this.setupWaves();
        this.setupEvents();
        
        // 生成初始敌人
        this.spawnInitialEnemies();
        
        // 启动UI场景 - 添加延迟确保GameScene完全初始化
        this.time.delayedCall(32, () => {
            this.scene.launch('UIScene', {
                gameScene: this,
                playerHealth: this.playerHealth,
                playerResources: this.playerResources,
                levelConfig: this.levelConfig,
                levelId: data?.levelId || 'demo',
                gameStartTime: this.gameStartTime // 传递游戏开始时间
            });
        });
        
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        // 创建游戏区域背景
        if (this.textures.exists('level1_background')) {
            const bg = this.add.image(
                this.scale.width / 2, 
                this.scale.height / 2, 
                'level1_background'
            );
            bg.setDisplaySize(this.scale.width, this.scale.height);
            bg.setDepth(-1);
        } else {
            // 回退到纯色背景
            const bg = this.add.rectangle(
                this.gameWidth / 2, 
                this.scale.height / 2, 
                this.gameWidth, 
                this.scale.height, 
                0x2c3e50
            );
            bg.setDepth(-1);
        }
        
        // 加载背景遮罩图片（不可见，仅用于检测）
        if (this.textures.exists('background_mask')) {
            this.backgroundMask = this.add.image(
                this.scale.width / 2,
                this.scale.height / 2,
                'background_mask'
            );
            this.backgroundMask.setDisplaySize(this.scale.width, this.scale.height);
            this.backgroundMask.setVisible(false); // 隐藏遮罩图片
            this.backgroundMask.setDepth(-1);
            
            // 提取遮罩图片的像素数据用于碰撞检测
            this.extractMaskData();
        } else {
            console.log('background_mask 纹理不存在，跳过遮罩数据提取');
        }
        
        // 创建右侧控制面板背景
        const ctrlPanelWidth = this.scale.width - this.gameWidth;
        if (this.textures.exists('level1_ctrl_bg')) {
            const ctrlBg = this.add.image(
                this.gameWidth + ctrlPanelWidth / 2, 
                this.scale.height / 2, 
                'level1_ctrl_bg'
            );
            ctrlBg.setDisplaySize(ctrlPanelWidth, this.scale.height);
            //ctrlBg.setDepth(-1);
        } else {
            // 回退到纯色背景
            const ctrlBg = this.add.rectangle(
                this.gameWidth + ctrlPanelWidth / 2, 
                this.scale.height / 2, 
                ctrlPanelWidth, 
                this.scale.height, 
                0x34495e
            );
            ctrlBg.setDepth(-1);
        }
        
        // 创建分界线
        const divider = this.add.line(
            0, 0, 
            this.gameWidth, 0, 
            this.gameWidth, this.scale.height, 
            0xffffff, 0.3
        );
        divider.setOrigin(0, 0);
    }
    
    /**
     * 提取遮罩图片的像素数据
     */
    private extractMaskData(): void {
        if (!this.backgroundMask) return;
        
        // 获取纹理
        const texture = this.textures.get('background_mask');
        const source = texture.getSourceImage();
        
        // 创建临时画布来获取像素数据
        const canvas = document.createElement('canvas');
        const width = source.width;
        const height = source.height;
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        
        // 绘制图像到画布
        ctx.drawImage(source, 0, 0);
        
        // 获取像素数据
        try {
            const imageData = ctx.getImageData(0, 0, width, height);
            this.maskData = imageData.data as unknown as Uint8Array;
            
            // 创建可视化调试图层
            this.createDebugMaskVisualization();
        } catch (e) {
        }
        
        // 分析并缓存有效生成区域
        this.analyzeValidSpawnAreas();
    }
    
    /**
     * 分析并缓存有效生成区域
     */
    private analyzeValidSpawnAreas(): void {
        if (!this.maskData || !this.backgroundMask) {
            console.log('无法分析有效区域：缺少遮罩数据');
            return;
        }
        
        console.log('开始分析有效生成区域...');
        
        // 清空现有缓存
        this.validSpawnAreas = [];
        this.validSpawnPoints = [];
        
        const texture = this.textures.get('background_mask');
        const source = texture.getSourceImage();
        const sourceWidth = source.width;
        const sourceHeight = source.height;
        
        const scaleX = sourceWidth / this.backgroundMask.displayWidth;
        const scaleY = sourceHeight / this.backgroundMask.displayHeight;
        
        // 重点关注X=0线附近的区域（敌人入口区域）
        const scanWidth = 200; // 扫描宽度（像素）
        const scanHeight = this.scale.height;
        
        // 网格大小，平衡精度和性能
        const gridSize = 8;
        
        // 临时存储连续的有效区域
        let currentArea: {startY: number, endY: number, x: number} | null = null;
        const minAreaHeight = 30; // 最小区域高度
        
        // 扫描X=0附近的垂直区域
        for (let worldX = -100; worldX <= scanWidth; worldX += gridSize) {
            let validColumn = true;
            let validPointsInColumn: number[] = [];
            
            // 检查这个垂直列是否有效
            for (let worldY = 50; worldY <= scanHeight - 50; worldY += gridSize) {
                if (this.isPositionWalkable(worldX, worldY)) {
                    validPointsInColumn.push(worldY);
                } else {
                    // 如果发现不可通行的点，标记整列为无效（除非是边缘区域）
                    if (worldX > 20) { // X>20的区域需要连续
                        validColumn = false;
                        break;
                    }
                }
            }
            
            if (validColumn && validPointsInColumn.length > 0) {
                // 找到有效列，添加到有效点列表
                validPointsInColumn.forEach(y => {
                    this.validSpawnPoints.push({x: worldX, y: y});
                });
                
                // 记录连续区域
                const minY = Math.min(...validPointsInColumn);
                const maxY = Math.max(...validPointsInColumn);
                
                if (currentArea && Math.abs(minY - currentArea.endY) < gridSize * 2) {
                    // 延续当前区域
                    currentArea.endY = maxY;
                } else {
                    // 开始新区域
                    if (currentArea && (currentArea.endY - currentArea.startY) >= minAreaHeight) {
                        this.validSpawnAreas.push({
                            x: currentArea.x,
                            y: currentArea.startY,
                            width: gridSize,
                            height: currentArea.endY - currentArea.startY
                        });
                    }
                    currentArea = {x: worldX, startY: minY, endY: maxY};
                }
            } else {
                // 结束当前区域
                if (currentArea && (currentArea.endY - currentArea.startY) >= minAreaHeight) {
                    this.validSpawnAreas.push({
                        x: currentArea.x,
                        y: currentArea.startY,
                        width: gridSize,
                        height: currentArea.endY - currentArea.startY
                    });
                }
                currentArea = null;
            }
        }
        
        // 处理最后一个区域
        if (currentArea && (currentArea.endY - currentArea.startY) >= minAreaHeight) {
            this.validSpawnAreas.push({
                x: currentArea.x,
                y: currentArea.startY,
                width: gridSize,
                height: currentArea.endY - currentArea.startY
            });
        }
        
        console.log(`有效区域分析完成: 发现 ${this.validSpawnAreas.length} 个有效区域，${this.validSpawnPoints.length} 个有效点`);
        
        // 如果没有找到足够的有效区域，添加一些备用区域
        if (this.validSpawnAreas.length === 0) {
            console.log('未找到有效区域，添加备用区域');
            // 添加一些默认的备用区域
            for (let y = 100; y < scanHeight - 100; y += 150) {
                this.validSpawnAreas.push({
                    x: -50,
                    y: y,
                    width: 100,
                    height: 80
                });
            }
        }
    }
    
    /**
     * 创建遮罩可视化调试图层
     * 仅在调试模式下使用
     */
    private createDebugMaskVisualization(): void {
        if (!this.maskData || !this.backgroundMask) return;
        
        // 创建一个调试图形对象
        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setDepth(100); // 确保在最上层
        
        // 获取纹理尺寸
        const texture = this.textures.get('background_mask');
        const sourceWidth = texture.getSourceImage().width;
        const sourceHeight = texture.getSourceImage().height;
        
        // 计算缩放比例
        const scaleX = sourceWidth / this.backgroundMask.displayWidth;
        const scaleY = sourceHeight / this.backgroundMask.displayHeight;
        
        // 网格大小（每10个像素采样一次，提高性能）
        const gridSize = 10;
        
        // 遍历画布，绘制可通行区域
        for (let y = 0; y < sourceHeight; y += gridSize) {
            for (let x = 0; x < sourceWidth; x += gridSize) {
                // 计算像素索引
                const pixelIndex = (y * sourceWidth + x) * 4;
                
                // 获取Alpha值
                const alpha = this.maskData[pixelIndex + 3];
                
                // 转换回世界坐标
                const worldX = (x - sourceWidth / 2) / scaleX + this.backgroundMask.x;
                const worldY = (y - sourceHeight / 2) / scaleY + this.backgroundMask.y;
                
                // 绘制点表示可通行区域（透明区域）
                if (alpha === 0) {
                    this.debugGraphics.fillStyle(0x00ff00, 0.2);
                } else {
                    this.debugGraphics.fillStyle(0xff0000, 0.2);
                }
                
                // 绘制小方块
                this.debugGraphics.fillRect(worldX - 2, worldY - 2, 4, 4);
            }
        }
        
        // 默认关闭调试图层
        this.debugGraphics.visible = false;
    }
    
    /**
     * 设置调试模式（由UIScene调用）
     * @param enabled 是否启用调试模式
     */
    public setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
        
        // 如果有遮罩图形，切换其可见性
        if (this.debugGraphics) {
            this.debugGraphics.visible = enabled;
        }
        
        // 切换敌人调试信息的显示
        this.updateEnemyDebugDisplay();
        
        // 更新所有塔的范围指示器可见性
        this.towers.children.entries.forEach((tower: Tower) => {
            if (tower.active && tower.showRange) {
                tower.showRange(enabled);
            }
        });
        
        // 添加调试日志
        console.log(`调试模式: ${enabled ? '开启' : '关闭'} (来自UIScene)`);
        console.log(`当前敌人数量: ${this.enemies.getChildren().length}`);
    }
    
    /**
     * 更新敌人调试信息显示
     */
    private updateEnemyDebugDisplay(): void {
        const enemies = this.enemies.getChildren() as Enemy[];
        
        console.log(`GameScene: updateEnemyDebugDisplay 被调用, debugMode = ${this.debugMode}, 敌人数量 = ${enemies.length}`);
        
        if (this.debugMode) {
            console.log('GameScene: 启用调试模式，为敌人创建调试文本');
            // 启用调试模式：为所有敌人创建调试文本
            enemies.forEach((enemy, index) => {
                if (enemy.active && !this.enemyDebugTexts.has(index)) {
                    this.createEnemyDebugText(enemy, index);
                }
            });
        } else {
            console.log('GameScene: 关闭调试模式，隐藏所有调试文本');
            // 关闭调试模式：隐藏所有调试文本
            this.enemyDebugTexts.forEach(text => {
                text.setVisible(false);
            });
        }
    }
    
    /**
     * 为单个敌人创建调试文本
     */
    private createEnemyDebugText(enemy: Enemy, index: number): void {
        // 获取敌人当前位置的alpha值
        const alpha = this.getAlphaAtPosition(enemy.x, enemy.y);
        
        // 根据alpha值选择颜色
        const textColor = this.getDebugTextColor(alpha);
        const bgColor = this.getDebugBgColor(alpha);
        
        // 创建调试文本
        const debugText = this.add.text(
            enemy.x,
            enemy.y + 20,
            `(${enemy.x.toFixed(0)}, ${enemy.y.toFixed(0)})\\nα: ${alpha}`,
            {
                fontSize: '10px',
                color: textColor,
                backgroundColor: bgColor,
                padding: { x: 2, y: 1 }
            }
        );
        debugText.setDepth(1000); // 确保在最上层
        debugText.setOrigin(0.5, 0); // 以底部中心为原点
        
        // 添加边框效果
        debugText.setStroke('#444444', 1);
        
        // 存储到map中，使用索引作为键
        this.enemyDebugTexts.set(index, debugText);
        
        // 添加调试日志
        console.log(`为敌人 ${index} 创建调试文本，位置: (${enemy.x.toFixed(0)}, ${enemy.y.toFixed(0)}), alpha: ${alpha}`);
    }
    
    /**
     * 根据alpha值获取调试文本颜色
     */
    private getDebugTextColor(alpha: number): string {
        if (alpha === -1) return '#ffff00'; // 黄色：无数据
        if (alpha === 0) return '#00ff00';   // 绿色：可通行
        return '#ff0000';                     // 红色：不可通行
    }
    
    /**
     * 根据alpha值获取调试文本背景颜色
     */
    private getDebugBgColor(alpha: number): string {
        if (alpha === -1) return 'rgba(0, 0, 0, 0.8)';
        if (alpha === 0) return 'rgba(0, 0, 0, 0.7)';
        return 'rgba(0, 0, 0, 0.9)';
    }
    
    /**
     * 获取指定位置的alpha值
     */
    private getAlphaAtPosition(x: number, y: number): number {
        if (!this.maskData || !this.backgroundMask) {
            return -1; // 表示没有数据
        }

        const checkX = Math.max(0, x);
        const texture = this.textures.get('background_mask');
        const source = texture.getSourceImage();
        const sourceWidth = source.width;
        const sourceHeight = source.height;
        
        const scaleX = sourceWidth / this.backgroundMask.displayWidth;
        const scaleY = sourceHeight / this.backgroundMask.displayHeight;
      
        const offsetX = checkX - this.backgroundMask.x;
        const offsetY = y - this.backgroundMask.y;

        const pixelX = Math.floor((offsetX * scaleX) + (sourceWidth / 2));
        const pixelY = Math.floor((offsetY * scaleY) + (sourceHeight / 2));
                
        if (pixelX < 0 || pixelX >= sourceWidth || pixelY < 0 || pixelY >= sourceHeight) {
            return -1; // 超出范围
        }

        const pixelIndex = (pixelY * sourceWidth + pixelX) * 4;
        return this.maskData[pixelIndex + 3];
    }
    
    /**
     * 更新敌人调试文本位置和信息
     */
    private updateEnemyDebugTexts(): void {
        if (!this.debugMode) return;
        
        const enemies = this.enemies.getChildren() as Enemy[];
        
        // 更新现有敌人的调试信息
        enemies.forEach((enemy, index) => {
            if (enemy.active) {
                const debugText = this.enemyDebugTexts.get(index);
                if (debugText) {
                    // 更新位置
                    debugText.setPosition(enemy.x, enemy.y + 20);
                    
                    // 更新alpha值和颜色
                    const alpha = this.getAlphaAtPosition(enemy.x, enemy.y);
                    debugText.setText(`(${enemy.x.toFixed(0)}, ${enemy.y.toFixed(0)})\\nα: ${alpha}`);
                    debugText.setColor(this.getDebugTextColor(alpha));
                    debugText.setBackgroundColor(this.getDebugBgColor(alpha));
                    debugText.setVisible(true);
                }
            }
        });
        
        // 清理已被销毁敌人的调试文本
        this.enemyDebugTexts.forEach((text, index) => {
            if (index >= enemies.length || !enemies[index].active) {
                text.destroy();
                this.enemyDebugTexts.delete(index);
            }
        });
    }
    
    /**
     * 检查位置是否可通行（基于遮罩图片）
     * @param x 世界坐标X
     * @param y 世界坐标Y
     * @returns 如果位置可通行则返回true
     */
    public isPositionWalkable(x: number, y: number): boolean {
        if (!this.maskData || !this.backgroundMask) {
            // 如果没有遮罩数据，提前返回，避免后续报错
            //console.log(`位置检查失败: (${x.toFixed(0)}, ${y.toFixed(0)}) - 没有遮罩数据`);
            return true;
        }

        // 核心修复：如果检查点在屏幕左侧外部，我们实际关心的是它进入屏幕的入口（x=0）是否可通行。
        const checkX = Math.max(0, x);

        const texture = this.textures.get('background_mask');
        const source = texture.getSourceImage();
        const sourceWidth = source.width;
        const sourceHeight = source.height;
        
        const scaleX = sourceWidth / this.backgroundMask.displayWidth;
        const scaleY = sourceHeight / this.backgroundMask.displayHeight;
      
        const offsetX = checkX - this.backgroundMask.x;
        const offsetY = y - this.backgroundMask.y;

        const pixelX = Math.floor((offsetX * scaleX) + (sourceWidth / 2));
        const pixelY = Math.floor((offsetY * scaleY) + (sourceHeight / 2));
                
        if (pixelX < 0 || pixelX >= sourceWidth || pixelY < 0 || pixelY >= sourceHeight) {
            //console.log(`位置检查失败: (${x.toFixed(0)}, ${y.toFixed(0)}) - 像素坐标超出范围 (${pixelX}, ${pixelY}) 纹理尺寸: ${sourceWidth}x${sourceHeight}`);
            return false;
        }

        const pixelIndex = (pixelY * sourceWidth + pixelX) * 4;
        const alpha = this.maskData[pixelIndex + 3];

        const isWalkable = alpha === 0;
        
        if (!isWalkable) {
            //console.log(`位置检查失败: (${x.toFixed(0)}, ${y.toFixed(0)}) - Alpha值: ${alpha} (需要0)`);
        }

        return isWalkable;
    }

    
    /**
     * 创建实体组
     */
    private createEntityGroups(): void {
        this.towers = this.physics.add.group({
            classType: Tower,
            runChildUpdate: true
        });
        
        this.enemies = this.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });
        
        this.projectiles = this.physics.add.group({
            classType: Projectile,
            runChildUpdate: true,
            maxSize: 100
        });
        
        this.towerSensors = this.physics.add.staticGroup();
    }

    /**
     * 创建免疫器官
     */
    // 边界线类，作为病菌的攻击目标
    private boundaryLine: Phaser.GameObjects.Rectangle;
    
    /**
     * 创建免疫器官
     */
    private createImmuneOrgan(): void {
        const organX = this.gameWidth - 180;
        const organY = this.scale.height / 2;
        
        this.immuneOrgan = new ImmuneOrgan(
            this, 
            organX, 
            organY, 
            UNITS_CONFIG.fixed.immuneOrgan
        );
        
        // 使其可交互并添加点击事件
        this.immuneOrgan.setInteractive({ useHandCursor: true });
        this.immuneOrgan.on('pointerdown', (
            _pointer: Phaser.Input.Pointer,
            _localX: number,
            _localY: number,
            event: Phaser.Types.Input.EventData
        ) => {
            // 阻止事件冒泡，避免触发地图放置
            event.stopPropagation();
            this.onUpgradeOrgan();
        });
        
        // 创建边界线作为病菌攻击目标
        this.createBoundaryLine();
        
        this.updateAllTargets();
    }
    
    /**
     * 创建边界线，作为病菌的攻击目标
     */
    private createBoundaryLine(): void {
        // 在游戏区域最右侧创建一个垂直线，高度与游戏画面一致
        const boundaryX = this.gameWidth - 5; // 稍微往左偏移5个像素
        
        // 创建一个透明的矩形作为边界线
        this.boundaryLine = this.add.rectangle(
            boundaryX,
            this.scale.height / 2,
            10, // 宽度
            this.scale.height, // 高度
            0xFFFFFF, // 颜色
            0 // 透明度0，完全不可见
        );
        
        // 添加物理属性
        this.physics.add.existing(this.boundaryLine, true); // 静态物理体
        
        // 为边界线添加自定义属性和方法，使其可以作为敌人的攻击目标
        const boundaryLineObj = this.boundaryLine as any;
        boundaryLineObj.isBoundaryLine = true;
        boundaryLineObj.active = true; // 设为活跃状态
        
        // 实现一个虚拟的血量系统，这里不需要血量，只需要接口
        boundaryLineObj.hp = 9999999; // 设置一个很大的血量值，表示永远不会被摧毁
        boundaryLineObj.maxHp = 9999999;
        boundaryLineObj.isAlive = () => true; // 总是返回true
        
        // 实现receiveDamage方法以支持敌人攻击
        boundaryLineObj.receiveDamage = (damage: number) => {
            // 伤害会传递给玩家
            this.damagePlayer(damage);
            return false; // 表示不会被摧毁
        };
        
        // 实现必要的方法以支持敌人目标系统
        boundaryLineObj.addAttacker = (enemy: any) => {};
        boundaryLineObj.removeAttacker = (enemy: any) => {};
        boundaryLineObj.isAttractionSlotsFull = () => false; // 永远可以被攻击
        
    }

    /**
     * 设置物理交互
     */
    private setupPhysics(): void {
        // 射弹与敌人的碰撞（防御塔射弹打敌人）
        this.physics.add.overlap(
            this.projectiles,
            this.enemies,
            this.handleProjectileHit,
            (projectile, enemy) => {
                const p = projectile as Projectile;
                const e = enemy as Enemy;
                // 确保是防御塔的射弹，并且目标是存活的敌人
                return !p.isEnemyProjectile && e.isAlive() && p.active;
            },
            this
        );
        
        // 敌人射弹与防御塔的碰撞
        this.physics.add.overlap(
            this.projectiles,
            this.towers,
            this.handleEnemyProjectileHit,
            (projectile, tower) => {
                const p = projectile as Projectile;
                const t = tower as Tower;
                // 只有敌人射弹才能打防御塔
                return p.isEnemyProjectile && p.active && t.active;
            },
            this
        );
        
        // 敌人射弹与免疫器官的碰撞
        this.physics.add.overlap(
            this.projectiles,
            [this.immuneOrgan],
            this.handleEnemyProjectileHit,
            (projectile, target) => {
                const p = projectile as Projectile;
                // 只有敌人射弹才能打免疫器官
                return p.isEnemyProjectile && p.active && target.active;
            },
            this
        );
        
        // 敌人射弹与边界线的碰撞
        this.physics.add.overlap(
            this.projectiles,
            this.boundaryLine,
            this.handleProjectileBoundaryHit,
            (projectile, boundary) => {
                const p = projectile as Projectile;
                // 所有子弹在接触边界线时都应该被销毁
                return p.active;
            },
            this
        );
        
        // 稍后会在tower创建时设置传感器重叠检测
        
        // 添加敌人与防御塔的碰撞检测
        this.physics.add.collider(
            this.enemies,
            this.towers,
            this.handleEnemyTowerCollision,
            null,
            this
        );
        
        // 添加敌人之间的温和碰撞处理
        this.physics.add.collider(
            this.enemies,
            this.enemies,
            this.handleEnemyCollision,
            null,
            this
        );
    }

    /**
     * 设置输入处理
     */
    private setupInput(): void {
        this.input.on('pointerdown', this.handlePlacement, this);
        this.input.on('pointermove', this.updatePlacementIndicator, this);
    }

    /**
     * 设置波次
     */
    private setupWaves(): void {
        // 清除旧的wave计时器，避免重复生成
        this.waveTimers.forEach(timer => {
            if (timer) {
                timer.remove();
            }
        });
        this.waveTimers = [];
        
        
        // 创建主要的敌人生成计时器（每2秒生成一个敌人）
        const testTimer = this.time.addEvent({
            delay: 2000,
            callback: () => {
                if (!this.timerCompleted) {
                    this.spawnEnemy('commonBacteria');
                }
            },
            callbackScope: this,
            loop: true
        });
        
        this.waveTimers.push(testTimer);
        
        // 同时创建波次计时器
        this.levelConfig.waves.forEach((wave, index) => {
            
            const timer = this.time.addEvent({
                delay: wave.interval,
                callback: () => {
                    const elapsedSeconds = (this.time.now - this.gameStartTime) / 1000;
                    if (elapsedSeconds >= wave.startTime && elapsedSeconds <= wave.endTime && !this.timerCompleted) {
                        this.spawnEnemy(wave.enemyType);
                    }
                },
                callbackScope: this,
                loop: true
            });
            
            this.waveTimers.push(timer);
        });
    }

    /**
     * 设置事件监听
     */
    private setupEvents(): void {
        // 监听UI场景事件
        const uiScene = this.scene.get('UIScene');
        if (uiScene) {
            uiScene.events.on('selectTower', this.onSelectTower, this);
            uiScene.events.on('useSneezeSkill', this.onUseSneezeSkill, this);
        }
        
        // 监听游戏事件
        this.events.on('enemyDefeated', this.onEnemyDefeated, this);
        this.events.on('resourceGenerated', this.onResourceGenerated, this);
        this.events.on('organDamaged', this.onOrganDamaged, this);
        this.events.on('gameOver', this.onGameOver, this);
    }

    /**
     * 生成初始敌人
     * 修复重新开始游戏后敌人数量少的问题
     */
    private spawnInitialEnemies(): void {
        const { count, enemyType } = this.levelConfig.initialEnemies;
        
        // 仅清除初始敌人的延迟事件，保留波次事件
        // 创建一个数组存储初始敌人生成事件，以便可以单独清理它们
        const initialEnemyEvents: Phaser.Time.TimerEvent[] = [];
        
        // 直接创建第一个敌人，避免延迟
        if (count > 0) {
            this.spawnEnemyWithDistribution(enemyType, 0, count);
        }
        
        // 创建剩余的敌人，保持延迟
        for (let i = 1; i < count; i++) {
            // 添加调试日志
            
            // 对于重新启动的场景，确保延迟回调能被正确执行
            const delay = i * 400;
            const event = this.time.addEvent({
                delay: delay,
                callback: () => {
                    // 为初始敌人使用特定的分布式位置
                    this.spawnEnemyWithDistribution(enemyType, i, count);
                },
                callbackScope: this
            });
            
            // 将事件添加到数组中，方便后续清理
            initialEnemyEvents.push(event);
        }
    }
    
    /**
     * 使用特定分布生成敌人 - 基于有效区域的智能版本
     * @param enemyType 敌人类型
     * @param spawnIndex 生成索引
     * @param totalSpawns 总生成数量
     */
    private spawnEnemyWithDistribution(enemyType: string, spawnIndex: number, totalSpawns: number): void {
        
        console.log(`尝试分布式生成敌人: ${enemyType} (索引: ${spawnIndex}/${totalSpawns})`);
        
        const enemyConfig = UNITS_CONFIG.enemies[enemyType as keyof typeof UNITS_CONFIG.enemies];
        if (!enemyConfig) {
            console.log(`分布式敌人生成失败: ${enemyType} - 配置不存在`);
            return;
        }
        
        // 获取当前活跃敌人
        const enemies = this.enemies.getChildren() as Enemy[];
        const activeEnemies = enemies.filter(e => e.active);
        
        console.log(`分布式生成 - 当前活跃敌人: ${activeEnemies.length}, 可用有效点: ${this.validSpawnPoints.length}`);
        
        // 首先尝试基于有效区域的智能查找
        const smartPosition = this.findSafePositionInValidAreas(activeEnemies, 25);
        
        if (smartPosition) {
            console.log(`智能查找成功，创建分布式敌人: ${enemyType} 在 (${smartPosition.x.toFixed(0)}, ${smartPosition.y.toFixed(0)})`);
            const enemy = new Enemy(this, smartPosition.x, smartPosition.y, enemyConfig);
            this.setupEnemyPhysics(enemy, enemyConfig);
            return;
        }
        
        // 如果智能查找失败，尝试传统的分布式方法
        console.log(`智能查找失败，尝试传统分布式方法...`);
        
        const spawnPosition = this.calculateMaskAwareDistributedPosition(spawnIndex, totalSpawns);
        console.log(`计算分布式位置: (${spawnPosition.x.toFixed(0)}, ${spawnPosition.y.toFixed(0)})`);
        
        const validPosition = this.findValidSpawnPosition(spawnPosition.x, spawnPosition.y);
        
        // 如果找不到有效位置，跳过生成
        if (!validPosition) {
            console.log(`分布式敌人生成失败: ${enemyType} (索引: ${spawnIndex}) - 所有方法都找不到有效的生成位置`);
            return;
        }
        
        console.log(`传统方法成功，创建分布式敌人: ${enemyType} 在 (${validPosition.x.toFixed(0)}, ${validPosition.y.toFixed(0)})`);
        
        const enemy = new Enemy(this, validPosition.x, validPosition.y, enemyConfig);
        this.setupEnemyPhysics(enemy, enemyConfig);
        
        // 确保目标列表是最新的
        this.updateAllTargets();
    }

    /**
     * 计算分布式敌人生成位置
     * @param spawnIndex 当前敌人的索引（用于分布式生成）
     * @param totalSpawns 总生成数量（用于计算分布）
     * @returns {x: number, y: number} 生成位置
     */
    private calculateDistributedSpawnPosition(spawnIndex: number, totalSpawns: number): {x: number, y: number} {
        const gameAreaLeft = -100;  // 扩展到屏幕左侧外部
        const gameAreaRight = this.gameWidth;
        const gameAreaTop = 50;
        const gameAreaBottom = this.scale.height - 50;
        
        // X轴位置：在屏幕左侧更广的区域分布
        let x: number;
        const xPositions = [-80, -50, -20]; // 多个X轴生成位置
        x = xPositions[spawnIndex % xPositions.length];
        
        // Y轴位置：在可部署区域内均匀分布
        let y: number;
        
        if (totalSpawns === 1) {
            // 单个敌人，放在中间
            y = (gameAreaTop + gameAreaBottom) / 2;
        } else {
            // 多个敌人，均匀分布
            const spacing = (gameAreaBottom - gameAreaTop) / (totalSpawns - 1);
            y = gameAreaTop + (spawnIndex * spacing);
            
            // 添加一些随机偏移，避免完全在一条直线上
            const randomOffset = Phaser.Math.Between(-30, 30);
            y += randomOffset;
            
            // 确保不超出边界
            y = Phaser.Math.Clamp(y, gameAreaTop, gameAreaBottom);
        }
        
        return {x, y};
    }
    
    /**
     * 获取下一个分布式敌人生成位置
     * @returns {x: number, y: number} 生成位置
     */
    private getNextDistributedSpawnPosition(): {x: number, y: number} {
        // 获取当前活跃敌人数量的近似值作为分布索引
        const currentEnemyCount = this.enemies ? this.enemies.children.size : 0;
        
        // 预估这波敌人总数（基于初始敌人生成数量）
        const estimatedWaveSize = this.levelConfig.initialEnemies.count;
        
        // 使用当前敌人数量的模数作为索引，实现循环分布
        const spawnIndex = currentEnemyCount % Math.max(estimatedWaveSize, 5);
        
        return this.calculateMaskAwareDistributedPosition(spawnIndex, Math.max(estimatedWaveSize, 5));
    }
    
    /**
     * 查找有效的生成位置，考虑背景遮罩
     * @param baseX 基础X坐标
     * @param baseY 基础Y坐标
     * @returns {x: number, y: number} 有效的生成位置，如果找不到则返回null
     */
    private findValidSpawnPosition(baseX: number, baseY: number): {x: number, y: number} | null {
        console.log(`开始搜索有效生成位置: 基础位置(${baseX.toFixed(0)}, ${baseY.toFixed(0)})`);
        
        // 如果基础位置可通行，适合生成敌人，直接使用
        if (this.isPositionWalkable(baseX, baseY)) {
            console.log(`基础位置可通行，直接使用: (${baseX.toFixed(0)}, ${baseY.toFixed(0)})`);
            return {x: baseX, y: baseY};
        }
        
        // 搜索策略：系统性螺旋搜索 + 网格搜索
        const maxAttempts = 25; // 增加搜索次数
        const searchRadius = 150; // 扩大搜索半径
        
        // 第一阶段：螺旋搜索
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // 计算搜索半径，逐渐扩大
            const radius = (attempt + 1) * (searchRadius / maxAttempts);
            
            // 使用更均匀的角度分布
            const angle = ((attempt * 137.5) % 360) * Math.PI / 180; // 黄金角分布
            const distance = radius * 0.8; // 稍微减少距离，避免过远
            
            const testX = baseX + Math.cos(angle) * distance;
            const testY = baseY + Math.sin(angle) * distance;
            
            // 确保在游戏区域内
            const clampedX = Math.max(-150, Math.min(this.gameWidth + 50, testX));
            const clampedY = Math.max(50, Math.min(this.scale.height - 50, testY));
            
            if (this.isPositionWalkable(clampedX, clampedY)) {
                console.log(`螺旋搜索找到有效位置(尝试${attempt + 1}): (${clampedX.toFixed(0)}, ${clampedY.toFixed(0)})`);
                return {x: clampedX, y: clampedY};
            }
        }
        
        console.log(`螺旋搜索失败，开始网格搜索...`);
        
        // 第二阶段：网格搜索
        const gridSize = 30;
        let gridAttempts = 0;
        for (let offsetX = -120; offsetX <= 120; offsetX += gridSize) {
            for (let offsetY = -100; offsetY <= 100; offsetY += gridSize) {
                gridAttempts++;
                const testX = baseX + offsetX;
                const testY = baseY + offsetY;
                
                if (testX >= -150 && testX <= this.gameWidth + 50 && 
                    testY >= 50 && testY <= this.scale.height - 50 &&
                    this.isPositionWalkable(testX, testY)) {
                    console.log(`网格搜索找到有效位置(尝试${gridAttempts}): (${testX.toFixed(0)}, ${testY.toFixed(0)})`);
                    return {x: testX, y: testY};
                }
            }
        }
        
        // 如果都找不到有效位置，返回null
        console.log(`无法找到有效生成位置: 基础位置(${baseX.toFixed(0)}, ${baseY.toFixed(0)}), 螺旋搜索25次 + 网格搜索${gridAttempts}次均失败`);
        return null;
    }
    
    /**
     * 计算考虑背景遮罩的分布式敌人生成位置
     * @param spawnIndex 当前敌人的索引
     * @param totalSpawns 总生成数量
     * @returns {x: number, y: number} 生成位置
     */
    private calculateMaskAwareDistributedPosition(spawnIndex: number, totalSpawns: number): {x: number, y: number} {
        // 首先尝试标准分布式位置
        const standardPosition = this.calculateDistributedSpawnPosition(spawnIndex, totalSpawns);
        
        // 如果标准位置可通行，适合生成敌人，直接使用
        if (this.isPositionWalkable(standardPosition.x, standardPosition.y)) {
            return standardPosition;
        }
        
        // 如果标准位置不可通行，尝试在该分布区域内寻找有效位置
        const gameAreaTop = 50;
        const gameAreaBottom = this.scale.height - 50;
        const searchRange = 100; // 搜索范围
        
        // 在计算的Y位置附近搜索有效位置
        for (let yOffset = -searchRange; yOffset <= searchRange; yOffset += 20) {
            const testY = standardPosition.y + yOffset;
            const clampedY = Phaser.Math.Clamp(testY, gameAreaTop, gameAreaBottom);
            
            if (this.isPositionWalkable(standardPosition.x, clampedY)) {
                return {x: standardPosition.x, y: clampedY};
            }
        }
        
        // 如果仍然找不到，返回标准位置，让findValidSpawnPosition处理
        return standardPosition;
    }
    
    /**
     * 简化的位置安全检查
     */
    private isPositionSafe(x: number, y: number, enemies: Enemy[], minDistance: number = 25): boolean {
        // 首先检查是否适合生成敌人（可通行区域）
        const isWalkable = this.isPositionWalkable(x, y);
        if (!isWalkable) {
            console.log(`位置安全检查失败: (${x.toFixed(0)}, ${y.toFixed(0)}) - 位置不可通行`);
            return false;
        }
        
        // 减少最小距离要求，提高生成成功率
        minDistance = Math.max(minDistance, 25);
        
        // 如果没有敌人，直接返回true
        if (enemies.length === 0) {
            return true;
        }
        
        // 限制检查的敌人数量，提高性能
        const maxChecks = Math.min(enemies.length, 6);
        
        // 如果敌人数量很少，直接检查所有
        if (enemies.length <= maxChecks) {
            for (const enemy of enemies) {
                const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
                if (distance < minDistance) {
                    console.log(`位置安全检查失败: (${x.toFixed(0)}, ${y.toFixed(0)}) - 距离敌人太近 (${distance.toFixed(1)} < ${minDistance})`);
                    return false;
                }
            }
            return true;
        }
        
        // 敌人数量多时，只检查最近的几个
        const enemyDistances: Array<{enemy: Enemy, distance: number}> = [];
        
        // 计算与所有敌人的距离
        for (const enemy of enemies) {
            const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            enemyDistances.push({enemy, distance});
        }
        
        // 按距离排序，只检查最近的maxChecks个
        enemyDistances.sort((a, b) => a.distance - b.distance);
        
        for (let i = 0; i < maxChecks; i++) {
            if (enemyDistances[i].distance < minDistance) {
                console.log(`位置安全检查失败: (${x.toFixed(0)}, ${y.toFixed(0)}) - 距离第${i+1}近的敌人太近 (${enemyDistances[i].distance.toFixed(1)} < ${minDistance})`);
                return false;
            }
        }
        
        return true;
    }

    /**
     * 从有效区域中获取随机生成位置
     */
    private getRandomPositionFromValidAreas(): {x: number, y: number} | null {
        if (this.validSpawnPoints.length === 0) {
            console.log('没有可用的有效生成点');
            return null;
        }
        
        // 优先从有效点中随机选择
        const randomPoint = this.validSpawnPoints[Math.floor(Math.random() * this.validSpawnPoints.length)];
        return {x: randomPoint.x, y: randomPoint.y};
    }
    
    /**
     * 查找安全的生成位置（基于有效区域）
     */
    private findSafePositionInValidAreas(enemies: Enemy[], minDistance: number = 25): {x: number, y: number} | null {
        console.log(`在有效区域中查找安全位置，当前敌人数量: ${enemies.length}`);
        
        // 如果没有敌人，直接返回随机有效位置
        if (enemies.length === 0) {
            const randomPos = this.getRandomPositionFromValidAreas();
            if (randomPos) {
                console.log(`没有其他敌人，使用随机有效位置: (${randomPos.x.toFixed(0)}, ${randomPos.y.toFixed(0)})`);
            }
            return randomPos;
        }
        
        // 尝试多次找到安全位置
        const maxAttempts = Math.min(20, this.validSpawnPoints.length);
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const randomPos = this.getRandomPositionFromValidAreas();
            if (!randomPos) continue;
            
            // 检查与所有敌人的距离
            let isSafe = true;
            let closestEnemyDistance = Infinity;
            
            // 只检查最近的几个敌人以提高性能
            const maxEnemyChecks = Math.min(enemies.length, 8);
            for (let i = 0; i < maxEnemyChecks; i++) {
                const enemy = enemies[i];
                const distance = Phaser.Math.Distance.Between(randomPos.x, randomPos.y, enemy.x, enemy.y);
                closestEnemyDistance = Math.min(closestEnemyDistance, distance);
                
                if (distance < minDistance) {
                    isSafe = false;
                    break;
                }
            }
            
            if (isSafe) {
                console.log(`找到安全位置(尝试${attempt + 1}): (${randomPos.x.toFixed(0)}, ${randomPos.y.toFixed(0)}), 最近敌人距离: ${closestEnemyDistance.toFixed(1)}`);
                return randomPos;
            }
        }
        
        console.log(`在${maxAttempts}次尝试后未找到安全位置，最近敌人距离要求: ${minDistance}`);
        return null;
    }

    /**
     * 查找简单的安全生成位置（保留作为备用）
     */
    private findSimpleSafePosition(baseX: number, baseY: number): {x: number, y: number} | null {
        const enemies = this.enemies.getChildren() as Enemy[];
        const activeEnemies = enemies.filter(e => e.active);
        
        console.log(`开始搜索安全位置: 基础位置(${baseX.toFixed(0)}, ${baseY.toFixed(0)}), 活跃敌人数量: ${activeEnemies.length}`);
        
        // 检查基础位置是否安全
        if (this.isPositionSafe(baseX, baseY, activeEnemies)) {
            console.log(`基础位置安全，直接使用: (${baseX.toFixed(0)}, ${baseY.toFixed(0)})`);
            return {x: baseX, y: baseY};
        }
        
        // 尝试多个随机偏移位置，增加搜索范围
        for (let attempt = 0; attempt < 12; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 80; // 扩大搜索范围
            
            const testX = baseX + Math.cos(angle) * distance;
            const testY = baseY + Math.sin(angle) * distance;
            
            // 确保在游戏边界内
            const clampedX = Math.max(-50, Math.min(this.gameWidth + 50, testX));
            const clampedY = Math.max(50, Math.min(this.scale.height - 50, testY));
            
            if (this.isPositionSafe(clampedX, clampedY, activeEnemies, 25)) {
                console.log(`找到安全位置(尝试${attempt + 1}): (${clampedX.toFixed(0)}, ${clampedY.toFixed(0)})`);
                return {x: clampedX, y: clampedY};
            }
        }
        
        // 如果都失败，返回null表示找不到可用位置
        console.log(`无法找到安全位置: 基础位置(${baseX.toFixed(0)}, ${baseY.toFixed(0)}), 搜索了12个位置均失败`);
        return null;
    }

    /**
     * 生成敌人 - 基于有效区域的智能版本
     */
    private spawnEnemy(enemyType: string): void {
        console.log(`尝试生成敌人: ${enemyType}`);
        
        const enemyConfig = UNITS_CONFIG.enemies[enemyType as keyof typeof UNITS_CONFIG.enemies];
        if (!enemyConfig) {
            console.log(`敌人生成失败: ${enemyType} - 配置不存在`);
            return;
        }

        // 获取当前活跃敌人
        const enemies = this.enemies.getChildren() as Enemy[];
        const activeEnemies = enemies.filter(e => e.active);
        
        console.log(`当前活跃敌人数量: ${activeEnemies.length}, 可用有效点数量: ${this.validSpawnPoints.length}`);
        
        // 使用新的基于有效区域的位置查找
        const safePosition = this.findSafePositionInValidAreas(activeEnemies, 25);
        
        // 如果找不到安全位置，尝试旧的备用方法
        if (!safePosition) {
            console.log(`基于有效区域的查找失败，尝试备用方法...`);
            const basePosition = this.getNextDistributedSpawnPosition();
            const fallbackPosition = this.findSimpleSafePosition(basePosition.x, basePosition.y);
            
            if (!fallbackPosition) {
                console.log(`敌人生成失败: ${enemyType} - 所有方法都找不到安全生成位置`);
                return;
            }
            
            console.log(`备用方法成功，创建敌人: ${enemyType} 在 (${fallbackPosition.x.toFixed(0)}, ${fallbackPosition.y.toFixed(0)})`);
            
            // 创建敌人
            const enemy = new Enemy(this, fallbackPosition.x, fallbackPosition.y, enemyConfig);
            this.setupEnemyPhysics(enemy, enemyConfig);
            return;
        }
        
        console.log(`成功找到安全位置，创建敌人: ${enemyType} 在 (${safePosition.x.toFixed(0)}, ${safePosition.y.toFixed(0)})`);
        
        // 创建敌人
        const enemy = new Enemy(this, safePosition.x, safePosition.y, enemyConfig);
        this.setupEnemyPhysics(enemy, enemyConfig);
    }
    
    /**
     * 设置敌人物理属性
     */
    private setupEnemyPhysics(enemy: Enemy, enemyConfig: any): void {
        enemy.setVisible(true);
        enemy.setActive(true);
        
        // 启用物理体 - 移除手动速度设置，让Enemy自己控制
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.enable = true;
            // 初始速度设为0，让Enemy的update方法平滑控制
            body.setVelocity(0, 0);
        }
        
        // 添加到敌人组
        this.enemies.add(enemy, true);
        this.lastSpawnedEnemy = enemy;

        // 如果调试模式开启，为这个敌人创建调试文本
        if (this.debugMode) {
            const enemies = this.enemies.getChildren() as Enemy[];
            const index = enemies.indexOf(enemy);
            if (index !== -1) {
                this.createEnemyDebugText(enemy, index);
            }
        }

        // 图鉴：标记为已遇到
        this.markCodexSeen(enemyConfig.id);
        
        // 确保目标列表是最新的
        this.updateAllTargets();
        
        // 让敌人寻找目标
        enemy.findTarget();
    }

         /**
      * 从对象池获取射弹
      */
     public getProjectileFromPool(x: number, y: number): Projectile | null {
         let projectile = this.projectiles.getFirstDead(false) as Projectile;
         
         if (!projectile) {
             projectile = new Projectile(this, x, y);
             this.projectiles.add(projectile, true);
         } else {
             // 确保重用的子弹被正确重置
             projectile.setPosition(x, y);
             projectile.setActive(true);
             projectile.setVisible(true);
             if (projectile.body) {
                 projectile.body.setVelocity(0, 0);
             }
         }
         
         return projectile;
     }

    /**
     * 处理防御塔射弹命中敌人
     */
    private handleProjectileHit(projectile: Projectile, gameObject: Phaser.GameObjects.GameObject): void {
        // 首先检查projectile是否存在且类型正确
        if (!projectile || !(projectile instanceof Projectile)) {
            return;
        }

        // 检查enemy是否为有效的目标
        if (!gameObject || !(gameObject instanceof Enemy)) {
            return;
        }

        const enemy = gameObject as Enemy;
        
        // 确保projectile和enemy都处于激活状态
        if (projectile.active && enemy.active) {
            // 应用伤害
            if (enemy.receiveDamage && projectile.getDamage) {
                const damage = projectile.getDamage();
                enemy.receiveDamage(damage);
            }

            // 回收子弹
            projectile.recycleProjectile();
            
            // 播放命中特效（如果有的话）
            this.createHitEffect(projectile.x, projectile.y);
        }
    }
    
    /**
     * 处理敌人射弹命中防御塔或免疫器官
     */
    /**
     * 创建命中特效
     */
    private createHitEffect(x: number, y: number): void {
        // 创建简单的爆炸动画效果
        const explosion = this.add.circle(x, y, 5, 0xffff00, 1);
        
        // 创建缩放动画
        this.tweens.add({
            targets: explosion,
            scale: { from: 0.5, to: 2 },
            alpha: { from: 1, to: 0 },
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
    }

    /**
     * 处理敌人射弹命中防御塔或免疫器官
     */
    private handleEnemyProjectileHit(gameObject1: Phaser.GameObjects.GameObject, gameObject2: Phaser.GameObjects.GameObject): void {
        // 确定哪个是射弹，哪个是目标
        let projectile: Projectile | null = null;
        let target: Tower | ImmuneOrgan | null = null;
        
        if (gameObject1 instanceof Projectile) {
            projectile = gameObject1;
            if (gameObject2 instanceof Tower || gameObject2 instanceof ImmuneOrgan) {
                target = gameObject2;
            }
        } else if (gameObject2 instanceof Projectile) {
            projectile = gameObject2;
            if (gameObject1 instanceof Tower || gameObject1 instanceof ImmuneOrgan) {
                target = gameObject1;
            }
        }
        
        // 检查实体是否仍然活跃
        if (!projectile || !target || !projectile.active || !target.active || !projectile.scene || !target.scene) {
            return;
        }
        
        // 确保projectile和target都处于激活状态，并且是敌人的子弹
        if (projectile.active && target.active && projectile.isEnemyProjectile) {
            // 应用伤害
            if (target.receiveDamage && projectile.getDamage) {
                const damage = projectile.getDamage();
                target.receiveDamage(damage);
            }

            // 回收子弹
            projectile.recycleProjectile();
            
            // 播放命中特效
            this.createHitEffect(projectile.x, projectile.y);
        }
    }
    
    /**
     * 处理子弹与边界线的碰撞
     */
    private handleProjectileBoundaryHit(gameObject1: Phaser.GameObjects.GameObject, gameObject2: Phaser.GameObjects.GameObject): void {
        // 确定哪个是射弹，哪个是边界
        let projectile: Projectile | null = null;
        let boundary: Phaser.GameObjects.Rectangle | null = null;
        
        if (gameObject1 instanceof Projectile && gameObject2 instanceof Phaser.GameObjects.Rectangle) {
            projectile = gameObject1;
            boundary = gameObject2;
        } else if (gameObject2 instanceof Projectile && gameObject1 instanceof Phaser.GameObjects.Rectangle) {
            projectile = gameObject2;
            boundary = gameObject1;
        }
        
        // 检查实体是否有效
        if (!projectile || !boundary || !projectile.active || !projectile.scene) {
            return;
        }
        
        // 如果是敌人射弹，对玩家造成伤害
        if (projectile.isEnemyProjectile) {
            // 对边界线造成伤害（这将通过边界线的receiveDamage传递到玩家）
            const boundaryObj = boundary as any;
            if (boundaryObj.receiveDamage && typeof boundaryObj.receiveDamage === 'function') {
                const damage = projectile.getDamage ? projectile.getDamage() : 10;
                boundaryObj.receiveDamage(damage);
            }
        }
        
        // 播放命中特效
        this.createHitEffect(projectile.x, projectile.y);
        
        // 回收射弹
        projectile.recycleProjectile();
    }

    /**
     * 处理塔的选择
     */
    private onSelectTower(towerType: string): void {
        this.selectedTowerType = towerType;
        this.createPlacementIndicator(towerType);
    }

    /**
     * 创建放置指示器
     */
    private createPlacementIndicator(towerType: string): void {
        // 如果指示器不存在或已被销毁，重新创建
        if (!this.placementIndicator || !this.placementIndicator.scene) {
            this.placementIndicator = this.add.container(0, 0);
            this.placementIndicatorCreated = true;
        } else {
            // 清除现有内容
            this.placementIndicator.removeAll(true);
        }
        
        const towerConfig = UNITS_CONFIG.towers[towerType as keyof typeof UNITS_CONFIG.towers];
        if (!towerConfig) return;
        
        // 创建检测范围圈（外圈）
        const detectionCircle = this.add.circle(0, 0, towerConfig.detectionRange, 0x3498db, 0.2);
        detectionCircle.setStrokeStyle(2, 0x3498db, 0.5);
        
        // 创建攻击范围圈（内圈）
        const attackCircle = this.add.circle(0, 0, towerConfig.range, 0xe74c3c, 0.3);
        attackCircle.setStrokeStyle(2, 0xe74c3c, 0.7);
        
        // 使用移动纹理作为放置指示器，如果不存在则使用基础纹理
        const textureKey = `${towerConfig.texture}_move`;
        const towerSprite = this.add.sprite(0, 0, this.textures.exists(textureKey) ? textureKey : towerConfig.texture).setAlpha(0.7);
        
        this.placementIndicator.add([detectionCircle, attackCircle, towerSprite]);
        this.placementIndicator.setVisible(true);
        
        // 确保指示器在最上层显示
        this.placementIndicator.setDepth(1000);
        
    }

    /**
     * 更新放置指示器
     */
    private updatePlacementIndicator(pointer: Phaser.Input.Pointer): void {
        // 如果没有选择塔或指示器不存在，直接返回
        if (!this.selectedTowerType) return;
        
        // 如果指示器不存在或已被销毁，尝试重新创建
        if (!this.placementIndicator || !this.placementIndicator.scene) {
            this.createPlacementIndicator(this.selectedTowerType);
            if (!this.placementIndicator) return; // 如果创建失败，直接返回
        }
        
        // 更新指示器位置
        this.placementIndicator.setPosition(pointer.x, pointer.y);
        
        const towerConfig = UNITS_CONFIG.towers[this.selectedTowerType as keyof typeof UNITS_CONFIG.towers];
        if (!towerConfig) return;
        
        // 检查位置是否在游戏区域内、资源是否足够，以及是否在可部署区域
        const isInGameArea = pointer.x < this.gameWidth;
        const hasEnoughResources = this.playerResources >= towerConfig.cost;
        const isWalkable = this.isPositionWalkable(pointer.x, pointer.y);
        const pendingCount = (towerConfig?.deployCount ?? 1);
        const underTowerLimit = (this.levelConfig.maxTowers === undefined) || (this.currentAliveTowers + pendingCount <= this.levelConfig.maxTowers);

        const canPlace = isInGameArea && hasEnoughResources && isWalkable && underTowerLimit;
        
        // 确保指示器可见
        this.placementIndicator.setVisible(true);
        
        // 更新指示器颜色，表明是否可以放置
        if (this.placementIndicator.list && this.placementIndicator.list.length >= 3) {
            const towerSprite = this.placementIndicator.getAt(2) as Phaser.GameObjects.Sprite;
            if (towerSprite && towerSprite.setTint && typeof towerSprite.setTint === 'function') {
                towerSprite.setTint(canPlace ? 0xffffff : 0xff0000);
            }
        }
    }

    /**
     * 处理塔的放置
     */
    private handlePlacement(pointer: Phaser.Input.Pointer): void {
        // 如果点击在UI区域，取消选择
        if (pointer.x > this.gameWidth) {
            this.selectedTowerType = null;
            if (this.placementIndicator) {
                this.placementIndicator.setVisible(false);
            }
            return;
        }
        
        if (!this.selectedTowerType) return;
        
        const towerConfig = UNITS_CONFIG.towers[this.selectedTowerType as keyof typeof UNITS_CONFIG.towers];
        
        // 检查资源是否足够且位置是否有效
        const isWalkable = this.isPositionWalkable(pointer.x, pointer.y);
        const pendingCount = (towerConfig?.deployCount ?? 1);
        const underTowerLimit = (this.levelConfig.maxTowers === undefined) || (this.currentAliveTowers + pendingCount <= this.levelConfig.maxTowers);
        
        if (this.playerResources >= towerConfig.cost && isWalkable && underTowerLimit) {
            this.placeTower(pointer.x, pointer.y, this.selectedTowerType);
            this.playerResources -= towerConfig.cost;
            
            // 通知UI更新资源显示
            this.events.emit('resourcesChanged', { resources: this.playerResources });
            // 通知UI更新塔数量
            this.events.emit('towersCountChanged', { current: this.currentAliveTowers, max: this.levelConfig.maxTowers });
        } else if (!underTowerLimit) {
            // 达到上限时给出轻微反馈
            if ((this as any).sound && (this as any).sound.play) {
                (this as any).sound.play('error', { volume: 0.2 });
            }
        }
        
        this.selectedTowerType = null;
        if (this.placementIndicator) {
            this.placementIndicator.setVisible(false);
        }
    }

    /**
     * 放置塔
     */
    private placeTower(x: number, y: number, towerType: string): void {
        const towerConfig = UNITS_CONFIG.towers[towerType as keyof typeof UNITS_CONFIG.towers];
        if (!towerConfig) return;
        
        // 检查是否需要部署多个塔
        const deployCount = towerConfig.deployCount || 1;
        
        if (deployCount === 1) {
            // 单个塔部署
            this.deploySingleTower(x, y, towerConfig);
        } else {
            // 多个塔部署
            this.deployMultipleTowers(x, y, towerConfig, deployCount);
        }
    }

    /**
     * 部署单个塔
     */
    private deploySingleTower(x: number, y: number, towerConfig: TowerConfig): void {
        const tower = new Tower(this, x, y, towerConfig);
        this.towers.add(tower);
        
        // 如果调试模式启用，显示范围指示器
        if (this.isDebugMode) {
            tower.showRange(true);
        }
        
        this.setupTowerPhysics(tower);
        // 立即检测范围内的敌人
        tower.detectEnemiesInRange();
        this.updateAllTargets();
        this.notifyNearbyEnemiesOfNewTower(tower);
        // 图鉴：标记为已遇到
        this.markCodexSeen(towerConfig.id);
        // 部署后更新数量
        this.events.emit('towersCountChanged', { current: this.currentAliveTowers, max: this.levelConfig.maxTowers });
        // 发送塔部署事件给UI场景（用于对话系统）
        this.events.emit('towerDeployed', { towerType: towerConfig.id });
    }

    /**
     * 部署多个塔
     */
    private deployMultipleTowers(centerX: number, centerY: number, towerConfig: TowerConfig, count: number): void {
        const deployedTowers: Tower[] = [];
        // 若有限制，裁剪数量避免超过上限
        const max = (this.levelConfig as any)?.maxTowers as number | undefined;
        if (max !== undefined) {
            const remaining = Math.max(0, max - this.currentAliveTowers);
            count = Math.min(count, remaining);
            if (count <= 0) {
                return;
            }
        }
        
        // 计算塔的排列位置（三角形排列）
        const spacing = 130; // 基于192x192精灵尺寸，避免重叠
        
        for (let i = 0; i < count; i++) {
            let x, y;
            
            if (count === 1) {
                // 只有1个塔时放在中心
                x = centerX;
                y = centerY;
            } else if (count === 2) {
                // 2个塔时横向排列
                x = centerX + (i === 0 ? -spacing/2 : spacing/2);
                y = centerY;
            } else if (count === 3) {
                // 3个塔时三角形排列
                switch (i) {
                    case 0: // 顶部
                        x = centerX;
                        y = centerY - spacing * 0.6;
                        break;
                    case 1: // 左下
                        x = centerX - spacing * 0.5;
                        y = centerY + spacing * 0.3;
                        break;
                    case 2: // 右下
                        x = centerX + spacing * 0.5;
                        y = centerY + spacing * 0.3;
                        break;
                }
            } else {
                // 超过3个塔时，围绕中心圆形排列
                const angle = (i * 2 * Math.PI) / count;
                x = centerX + Math.cos(angle) * spacing;
                y = centerY + Math.sin(angle) * spacing;
            }
            
            // 检查位置是否在游戏区域内且可通行
            if (x < 30 || x > this.gameWidth - 30 || y < 30 || y > this.scale.height - 30 || !this.isPositionWalkable(x, y)) {
                continue;
            }
            
            const tower = new Tower(this, x, y, towerConfig);
            this.towers.add(tower);
            deployedTowers.push(tower);
            
            // 如果调试模式启用，显示范围指示器
            if (this.isDebugMode) {
                tower.showRange(true);
            }
            
            this.setupTowerPhysics(tower);
            // 立即检测范围内的敌人
            tower.detectEnemiesInRange();
            // 图鉴：标记为已遇到
            this.markCodexSeen(towerConfig.id);
            
        }
        
        // 更新目标列表并通知敌人
        this.updateAllTargets();
        deployedTowers.forEach(tower => {
            this.notifyNearbyEnemiesOfNewTower(tower);
        });
        // 批量部署后更新数量
        this.events.emit('towersCountChanged', { current: this.currentAliveTowers, max: this.levelConfig.maxTowers });
        // 对于多塔部署，只发送一次塔部署事件（用于对话系统）
        if (deployedTowers.length > 0) {
            this.events.emit('towerDeployed', { towerType: towerConfig.id });
        }
    }

    /**
     * 设置塔的物理和传感器
     */
    private setupTowerPhysics(tower: Tower): void {
        // 添加传感器到静态组
        this.towerSensors.add(tower.getAttackSensor());
        this.towerSensors.add(tower.getDetectSensor());
        
        // 设置传感器与敌人的重叠检测
        this.physics.add.overlap(
            tower.getAttackSensor(),
            this.enemies,
            this.handleEnemyInTowerRange,
            null,
            this
        );
        
        // 设置检测传感器与敌人的重叠检测
        this.physics.add.overlap(
            tower.getDetectSensor(),
            this.enemies,
            this.handleEnemyInTowerDetectionRange,
            null,
            this
        );
        
        // 移除位置修正系统，使用物理引擎默认碰撞效果
    }

    /**
     * 处理敌人之间的碰撞 - 使用物理引擎默认效果
     */
    private handleEnemyCollision(enemy1: Enemy, enemy2: Enemy): void {
        // 让物理引擎处理碰撞，不添加任何手动位移
        // 移除所有手动位置修正和速度修改代码
    }

    /**
     * 处理敌人与塔的碰撞
     */
    private handleEnemyTowerCollision(gameObject1: Phaser.GameObjects.GameObject, gameObject2: Phaser.GameObjects.GameObject): void {
        // 确定哪个是敌人，哪个是塔
        let enemy: Enemy | null = null;
        let tower: Tower | null = null;
        
        if (gameObject1 instanceof Enemy && gameObject2 instanceof Tower) {
            enemy = gameObject1;
            tower = gameObject2;
        } else if (gameObject2 instanceof Enemy && gameObject1 instanceof Tower) {
            enemy = gameObject2;
            tower = gameObject1;
        }
        
        if (!enemy || !tower || !enemy.active || !tower.active) return;
        
        // 让敌人停止并攻击塔
        enemy.setTarget(tower);
        
        // 移除手动速度设置，使用物理引擎默认碰撞效果
    }

    /**
     * 让附近的敌人重新评估目标
     */
    private notifyNearbyEnemiesOfNewTower(tower: Tower): void {
        // 检查附近的敌人，让他们重新评估目标
        this.enemies.children.each((enemy: Enemy) => {
            if (enemy && enemy.active) {
                const distance = Phaser.Math.Distance.Between(
                    enemy.x, enemy.y,
                    tower.x, tower.y
                );
                // 如果敌人在塔的感知范围内，重新评估目标
                if (distance < 200) { // 感知范围
                    enemy.findTarget();
                }
            }
        });
    }

    /**
     * 处理敌人进入塔的攻击范围
     */
    private handleEnemyInTowerRange(gameObject1: Phaser.GameObjects.GameObject, gameObject2: Phaser.GameObjects.GameObject): void {
        // 确定哪个是传感器，哪个是敌人
        let sensor: Phaser.GameObjects.Zone | null = null;
        let enemy: Enemy | null = null;
        
        if (gameObject1 instanceof Phaser.GameObjects.Zone && gameObject2 instanceof Enemy) {
            sensor = gameObject1;
            enemy = gameObject2;
        } else if (gameObject2 instanceof Phaser.GameObjects.Zone && gameObject1 instanceof Enemy) {
            sensor = gameObject2;
            enemy = gameObject1;
        }
        
        if (!sensor || !enemy || !enemy.active) return;
        
        const tower = (sensor as any).parentTower as Tower;
        if (!tower || !tower.active) return;
        
        // 检查槽位系统
        if (tower.canTarget(enemy)) {
            tower.setTarget(enemy);
        }
    }
    
    /**
     * 处理敌人进入塔的检测范围
     */
    private handleEnemyInTowerDetectionRange(gameObject1: Phaser.GameObjects.GameObject, gameObject2: Phaser.GameObjects.GameObject): void {
        // 确定哪个是传感器，哪个是敌人
        let sensor: Phaser.GameObjects.Zone | null = null;
        let enemy: Enemy | null = null;
        
        if (gameObject1 instanceof Phaser.GameObjects.Zone && gameObject2 instanceof Enemy) {
            sensor = gameObject1;
            enemy = gameObject2;
        } else if (gameObject2 instanceof Phaser.GameObjects.Zone && gameObject1 instanceof Enemy) {
            sensor = gameObject2;
            enemy = gameObject1;
        }
        
        if (!sensor || !enemy || !enemy.active) return;
        
        const tower = (sensor as any).parentTower as Tower;
        if (!tower || !tower.active) return;
        
        // 计算距离确保敌人在检测范围内
        const distance = Phaser.Math.Distance.Between(tower.x, tower.y, enemy.x, enemy.y);
        if (distance <= tower.getDetectionRange()) {
            // 将敌人添加到塔的潜在目标列表
            tower.addPotentialTarget(enemy);
            
            // 如果塔当前没有目标，立即设置目标
            if (!tower.getTarget() && tower.canTarget(enemy)) {
                tower.setTarget(enemy);
            }
        }
    }
    
    /**
     * 处理敌人离开塔的检测范围
     * 注意：需要在update中手动检测，因为Phaser没有内置的“离开重叠区域”事件
     */
    private checkEnemiesOutOfRange(): void {
        this.towers.getChildren().forEach((tower: any) => {
            if (!tower || !tower.active) return;
            
            const towerDetectionRange = tower.getDetectionRange();
            
            this.enemies.getChildren().forEach((enemy: any) => {
                if (!enemy || !enemy.active) return;
                
                const distance = Phaser.Math.Distance.Between(tower.x, tower.y, enemy.x, enemy.y);
                if (distance > towerDetectionRange) {
                    // 如果敌人离开检测范围，从潜在目标列表中移除
                    tower.removePotentialTarget(enemy);
                }
            });
        });
    }

    /**
     * 处理器官升级
     */
    private onUpgradeOrgan(): void {
        if (this.playerResources >= this.immuneOrgan.getUpgradeCost() && 
            this.immuneOrgan.canUpgrade()) {
            this.playerResources -= this.immuneOrgan.getUpgradeCost();
            this.immuneOrgan.upgrade();
            
            this.events.emit('resourcesChanged', { resources: this.playerResources });
        }
    }

    /**
     * 处理喷嚏技能
     */
    private onUseSneezeSkill(): void {
        const damage = this.levelConfig.skills.sneeze.damage;
        const knockbackForce = -300; // 向左击退的力度
        
        this.enemies.children.entries.forEach(enemy => {
            const enemyEntity = enemy as unknown as Enemy;
            if (enemy.active && enemyEntity.receiveDamage) {
                // 造成伤害
                enemyEntity.receiveDamage(damage);
                
                // 应用击退效果
                if (enemyEntity.applyKnockback) {
                    enemyEntity.applyKnockback(knockbackForce);
                }
            }
        });
    }

    /**
     * 处理敌人被击败
     */
    private onEnemyDefeated(data: { reward: number }): void {
        this.playerResources += data.reward;
        this.events.emit('resourcesChanged', { resources: this.playerResources });
    }

    /**
     * 处理资源生成
     */
    private onResourceGenerated(data: { amount: number }): void {
        this.playerResources += data.amount;
        this.events.emit('resourcesChanged', { resources: this.playerResources });
    }

    /**
     * 处理器官受伤
     */
    private onOrganDamaged(data: { hp: number; maxHp: number; damage: number }): void {
        // 器官受伤逻辑已在ImmuneOrgan类中处理
    }

    /**
     * 对玩家造成伤害
     */
    public damagePlayer(damage: number): void {
        this.playerHealth = Math.max(0, this.playerHealth - damage);
        this.events.emit('playerHealthChanged', { health: this.playerHealth });
        
        if (this.playerHealth <= 0) {
            this.events.emit('gameOver', { reason: 'healthDepleted' });
        }
    }

    /**
     * 停止所有敌人生成
     */
    public stopEnemySpawning(): void {
        this.timerCompleted = true;
        
        // 停止所有波次计时器
        this.waveTimers.forEach(timer => {
            if (timer) {
                timer.remove();
            }
        });
        this.waveTimers = [];
        
        // 开始检查是否所有敌人都被消灭
        this.startVictoryCheck();
    }

    
    /**
     * 开始检查胜利条件
     */
    private startVictoryCheck(): void {
        
        // 如果已有检查计时器，先移除
        if (this.victoryCheckTimer) {
            this.victoryCheckTimer.remove();
        }
        
        // 创建检查计时器，每500ms检查一次
        this.victoryCheckTimer = this.time.addEvent({
            delay: 500,
            callback: this.checkVictoryCondition,
            callbackScope: this,
            loop: true
        });
    }

/**
     * 检查胜利条件
     */
    private checkVictoryCondition(): void {
        let activeEnemies = 0;
        let totalEnemies = 0;
        
        this.enemies.children.entries.forEach((enemy: Enemy) => {
            totalEnemies++;
            if (enemy && enemy.active && enemy.isAlive()) {
                activeEnemies++;
                // 打印敌人位置信息用于调试
            }
        });
        
        
        if (activeEnemies === 0) {
            if (this.victoryCheckTimer) {
                this.victoryCheckTimer.remove();
                this.victoryCheckTimer = null;
            }
            this.events.emit('gameOver', { reason: 'victory' });
        }
    }

    /**
     * 处理游戏结束
     */
    private onGameOver(data: { reason: string }): void {
        this.scene.pause();
        this.events.emit('showGameOver', data);
    }

    /**
     * 更新所有目标列表
     */
    private updateAllTargets(): void {
        // 添加塔和免疫器官作为基础目标
        this.allTargets = [...this.towers.children.entries as Tower[], this.immuneOrgan];
    }

    /**
     * 获取所有目标 (增加边界线作为特殊目标)
     */
    public getAllTargets(): any[] {
        // 如果免疫器官不可见（已被摧毁）且边界线存在，将边界线添加为目标
        if (this.immuneOrgan && !this.immuneOrgan.visible && this.boundaryLine) {
            return [...this.towers.children.entries as Tower[], this.boundaryLine];
        }
        return this.allTargets;
    }

    /**
     * 获取免疫器官
     */
    public getImmuneOrgan(): ImmuneOrgan {
        return this.immuneOrgan;
    }

    /**
     * 获取游戏区域宽度
     */
    public getGameWidth(): number {
        return this.gameWidth;
    }

    // 图鉴：确保本地存储集合存在
    private ensureCodexSeenStore(): void {
        try {
            const raw = localStorage.getItem('immune_td_codex_seen');
            if (!raw) {
                localStorage.setItem('immune_td_codex_seen', JSON.stringify([]));
            }
        } catch {
            // ignore
        }
    }

    // 图鉴：记录已见单位
    private markCodexSeen(id: string): void {
        try {
            const raw = localStorage.getItem('immune_td_codex_seen');
            const arr: string[] = raw ? JSON.parse(raw) : [];
            if (!arr.includes(id)) {
                arr.push(id);
                localStorage.setItem('immune_td_codex_seen', JSON.stringify(arr));
            }
        } catch {
            // ignore
        }
    }

    /**
     * 检查屏幕上是否有敌人
     */
    private hasVisibleEnemies(): boolean {
        let hasEnemies = false;
        
        this.enemies.children.each((enemy: Enemy) => {
            if (enemy && enemy.active && enemy.isAlive() &&
                enemy.x > -100 && enemy.x < this.scale.width + 100 &&
                enemy.y > -100 && enemy.y < this.scale.height + 100) {
                hasEnemies = true;
                return false; // 停止迭代
            }
        });
        
        return hasEnemies;
    }
    
    /**
     * 暂停所有游戏计时器和系统
     */
    public pauseGame(): void {
        // 暂停所有波次计时器
        this.waveTimers.forEach(timer => {
            if (timer && timer.paused === false) {
                timer.paused = true;
            }
        });
        
        // 暂停物理系统
        if (this.physics && this.physics.world) {
            this.physics.world.pause();
        }
        
        // 暂停所有实体的动画和动作
        this.tweens.pauseAll();
        
        // 暂停所有实体的更新
        this.towers.children.each((tower: Tower) => {
            if (tower) tower.active = false;
        });
        this.enemies.children.each((enemy: Enemy) => {
            if (enemy) enemy.active = false;
        });
        this.projectiles.children.each((projectile: Projectile) => {
            if (projectile) projectile.active = false;
        });
    }
    
    /**
     * 恢复所有游戏计时器和系统
     */
    public resumeGame(): void {
        // 恢复所有波次计时器
        this.waveTimers.forEach(timer => {
            if (timer && timer.paused === true) {
                timer.paused = false;
            }
        });
        
        // 恢复物理系统
        if (this.physics && this.physics.world) {
            this.physics.world.resume();
        }
        
        // 恢复所有实体的动画和动作
        this.tweens.resumeAll();
        
        // 恢复所有实体的更新
        this.towers.children.each((tower: Tower) => {
            if (tower) tower.active = true;
        });
        this.enemies.children.each((enemy: Enemy) => {
            if (enemy) enemy.active = true;
        });
        this.projectiles.children.each((projectile: Projectile) => {
            if (projectile) projectile.active = true;
        });
    }

    /**
     * 场景销毁时的清理
     */
    shutdown(): void {
        
        // 清理所有计时器
        this.waveTimers.forEach(timer => {
            if (timer) {
                timer.remove();
            }
        });
        this.waveTimers = [];
        
        // 清理胜利检查计时器
        if (this.victoryCheckTimer) {
            this.victoryCheckTimer.remove();
            this.victoryCheckTimer = null;
        }
        
          
        // 清理所有事件监听
        this.events.removeAllListeners();
        
        // 清理输入监听
        this.input.off('pointerdown', this.handlePlacement, this);
        this.input.off('pointermove', this.updatePlacementIndicator, this);
        
        // 清理实体组
        if (this.towers) {
            this.towers.clear(true, true);
        }
        if (this.enemies) {
            this.enemies.clear(true, true);
        }
        if (this.projectiles) {
            this.projectiles.clear(true, true);
        }
        if (this.towerSensors) {
            this.towerSensors.clear(true, true);
        }
        
        // 清理放置指示器
        if (this.placementIndicator) {
            this.placementIndicator.removeAll(true);
            this.placementIndicator.destroy();
            this.placementIndicator = null;
            this.placementIndicatorCreated = false;
        }
        
        // 重置选择状态
        this.selectedTowerType = null;
        
        // 清理背景遮罩数据
        this.backgroundMask = null;
        this.maskData = null;
        
        // 清理有效区域缓存
        this.validSpawnAreas = [];
        this.validSpawnPoints = [];
        
        // 重置所有状态变量
        this.gameStartTime = 0;
        this.playerHealth = 0;
        this.playerResources = 0;
        this.selectedTowerType = null;
        this.timerCompleted = false;
        this.allTargets = [];
        this.immuneOrgan = null;
        
    }

    /**
     * 游戏主循环更新
     */
    public update(time: number, delta: number): void {
        // 更新敌人调试信息
        this.updateEnemyDebugTexts();
        
        // 调试信息：每60帧打印一次状态
        if (time % 1000 < 16) {
            const enemies = this.enemies.getChildren() as Enemy[];
            console.log(`调试模式状态: ${this.debugMode}, 敌人数量: ${enemies.length}, 调试文本数量: ${this.enemyDebugTexts.size}`);
        }
        
        // 检查屏幕上是否有敌人
        const enemiesVisible = this.hasVisibleEnemies();
        
        // 每5秒打印一次状态信息
        if (time % 5000 < 100) {
        }
        
        // 手动更新免疫器官
        if (this.immuneOrgan && this.immuneOrgan.active) {
            // 传递敌人可见状态，以便控制射击
            this.immuneOrgan.update(time, delta, enemiesVisible);
            
            // 每5秒检查一次免疫器官状态
            if (time % 5000 < 100) {
            }
        } else {
            if (time % 5000 < 100) {
            }
        }
        
        // 确保敌人的update方法被调用
        let enemyCount = 0;
        this.enemies.children.each((enemy: Enemy) => {
            if (enemy && enemy.active) {
                // 敌人始终更新，但可以传递敌人可见状态以控制射击
                enemy.update(time, delta);
                enemyCount++;
            }
        });
        
        // 更新防御塔，传递敌人可见状态
        this.towers.children.each((tower: Tower) => {
            if (tower && tower.active) {
                // 传递敌人可见状态，以便控制射击
                tower.update(time, delta, enemiesVisible);
            }
        });
        
        // 每5秒打印一次敌人数量
        if (time % 5000 < 100) {
        }
    }
}