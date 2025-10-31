import { Scene } from 'phaser';
import { UNITS_CONFIG } from '../config/UnitsConfig';
import { LevelConfig } from '../config/LevelConfig';
import { DialogueManager } from '../config/DialogueConfig';
import { LottieHelper } from '../utils/LottieHelper';

/**
 * UI场景
 * 负责用户界面显示和交互
 */
export class UIScene extends Scene {
    // 游戏数据
    private gameScene: any;
    private levelConfig: LevelConfig;
    private currentLevelId: string;
    private playerHealth: number;
    private playerResources: number;
    private isGameOver: boolean = false;
    private hasFailed: boolean = false; // 新增：跟踪是否已经失败

    // UI元素
    private resourceText: Phaser.GameObjects.Text;
    private resourceContainer: Phaser.GameObjects.Container | null = null;
    private healthBar: Phaser.GameObjects.Image;
    private healthBarBg: Phaser.GameObjects.Image;
    private healthBarFill: Phaser.GameObjects.Image;
    private progressBar: Phaser.GameObjects.Image;
    private progressBarBg: Phaser.GameObjects.Image;
    private progressMoveIndicator: Phaser.GameObjects.Image; // 进度指示器
    private progressMarkers: Phaser.GameObjects.Image[] = [];
    private towerButtons: { [key: string]: Phaser.GameObjects.Container } = {};
    private towerCountText: Phaser.GameObjects.Text;
    private dialogueContainer: Phaser.GameObjects.Container;
    private dialogueText: Phaser.GameObjects.Text;
    private debugButton: Phaser.GameObjects.Container;
    private healthBarTexture: Phaser.Textures.CanvasTexture | null = null;
    private progressBarTexture: Phaser.Textures.CanvasTexture | null = null;
    private healthBarMaxWidth: number = 0;
    private healthBarFillHeight: number = 0;
    private progressBarMaxWidth: number = 0;
    private progressBarFillHeight: number = 0;
    
    // 打字机效果相关
    private typewriterTimer: Phaser.Time.TimerEvent | null = null;
    private currentDialogueText: string = '';
    private currentCharIndex: number = 0;
    
    // 对话队列系统
    private dialogueQueue: string[] = [];
    private isDialoguePlaying: boolean = false;

    // 时间管理
    private levelDuration: number;
    private gameStartTime: number;
    private pausedTime: number = 0;
    private lastPauseTime: number = 0;
    private isPaused: boolean = false;
    private timerCompleted: boolean = false;
    
    // 新增：相对时间系统
    private gameElapsedTime: number = 0;
    private lastUpdateTime: number = 0;
    
    // 计时器管理
    private towerUnlockTimers: Phaser.Time.TimerEvent[] = [];
    private tutorialTimers: Phaser.Time.TimerEvent[] = [];
    private skillCooldownTimers: Phaser.Time.TimerEvent[] = [];
    
    // 调试模式
    private isDebugMode: boolean = false;

    // 新增：初始化状态管理
    private isInitialized: boolean = false;
    private initializationTime: number = 0;
    
    // Lottie动画管理
    private lottieHelper: LottieHelper | null = null;
    
    // 对话系统管理器
    private dialogueManager: DialogueManager;

    constructor() {
        super({ key: 'UIScene', active: false });
        this.dialogueManager = new DialogueManager();
    }

    init(data: any) {
        
        // 重置所有状态
        this.resetAllState();
        
        this.gameScene = data.gameScene;
        this.levelConfig = data.levelConfig;
        this.currentLevelId = data.levelId || 'demo';
        this.playerHealth = data.playerHealth;
        this.playerResources = data.playerResources;
        this.isGameOver = false;
        
        // 重置对话管理器
        this.dialogueManager.reset();

        this.levelDuration = this.levelConfig.waves.reduce((max, wave) => 
            Math.max(max, wave.endTime), 120); // 默认120秒，确保至少有一个值
        
        // 使用从GameScene传递过来的游戏开始时间，如果没有则为0则使用当前时间
        this.gameStartTime = data.gameStartTime || this.time.now || Date.now();
        this.initializationTime = this.time.now;
        this.pausedTime = 0;
        this.lastPauseTime = 0;
        this.isPaused = false;
        
    }

    create() {
        
        const { width, height } = this.scale;

        // 安全检查：确保所有必要的数据都已初始化
        if (!this.levelConfig || !this.gameScene) {
            return;
        }

        this.createRightPanel(width, height);
        this.createTopLeftControls();
        this.createBottomLeftControls(height);
        this.createDialogueSystem(height);

        this.setupEventListeners();
        this.initTowerUnlocks();
        this.startTutorial();
        
        // 触发关卡开始对话
        this.triggerLevelStartDialogue();
        
        // 初始化进度条显示
        this.updateProgressBar(0);
        
        // 初始化进度指示器
        if (this.progressMoveIndicator) {
            this.progressMoveIndicator.setPosition(-150, 40); // 设置到条的开头
        }
        
        // 初始化相对时间系统
        this.lastUpdateTime = this.time.now;
        this.gameElapsedTime = 0;
        
        // 验证关键UI元素是否已正确创建
        
        // 标记初始化完成
        this.isInitialized = true;
    }

    /**
     * 重置所有状态变量
     */
    private resetAllState(): void {
        
        this.isGameOver = false;
        this.hasFailed = false; // 重置失败状态
        this.isPaused = false;
        this.isInitialized = false;
        this.timerCompleted = false;
        // 不在这里重置gameStartTime，因为它会在init()中被正确设置
        this.pausedTime = 0;
        this.lastPauseTime = 0;
        this.initializationTime = 0;
        this.levelDuration = 0;
        this.playerHealth = 0;
        this.playerResources = 0;
        
        // 重置Lottie动画
        if (this.lottieHelper) {
            this.lottieHelper.destroy();
            this.lottieHelper = null;
        }
        
        // 重置对话队列系统
        this.dialogueQueue = [];
        this.isDialoguePlaying = false;
        
        // 重置相对时间系统
        this.gameElapsedTime = 0;
        this.lastUpdateTime = 0;
        
        // 清理计时器数组
        if (this.towerUnlockTimers) {
            this.towerUnlockTimers.forEach(timer => {
                if (timer) {
                    timer.remove();
                }
            });
            this.towerUnlockTimers = [];
        }
        
        if (this.tutorialTimers) {
            this.tutorialTimers.forEach(timer => {
                if (timer) {
                    timer.remove();
                }
            });
            this.tutorialTimers = [];
        }
        
        if (this.skillCooldownTimers) {
            this.skillCooldownTimers.forEach(timer => {
                if (timer) {
                    timer.remove();
                }
            });
            this.skillCooldownTimers = [];
        }
        
    }

    /**
     * 创建右侧控制面板
     */
    private createRightPanel(width: number, height: number): void {
        const panelWidth = 480; // 根据HTML固定宽度
        const panelX = width - panelWidth;

        // 面板背景
        const panelBg = this.add.image(panelX, 0, 'ctrl-panel-bg').setOrigin(0, 0);
        panelBg.setDisplaySize(panelWidth, height);

        // 资源显示
        this.createResourceText(width - panelWidth / 2, 120);

        // 塔建造按钮
        this.createTowerButtons(width - panelWidth / 2, 165); // 调整Y坐标

        // 喷嚏技能按钮
        this.createSneezeButton(width - panelWidth / 2, height - 120); // 调整Y坐标
        
        // 底部部署数量显示
        const limit = this.levelConfig.maxTowers;
        const label = this.add.text(width - panelWidth / 2, height - 250, '', {
            fontSize: '24px',
            color: '#ecf0f1'
        }).setOrigin(0.5);
        this.towerCountText = label;
        const current = (this.gameScene?.towers?.children?.entries || []).filter((t: any) => t?.active).length || 0;
        this.updateTowerCountText(current, limit);
        
        // 调试按钮
        //this.createDebugButton(width - panelWidth / 2, height - 10);
    }

    /**
     * 创建塔建造按钮
     */
    private createTowerButtons(x: number, y: number): void {
        const unitsContainer = this.add.container(x, y);
        const towers = Object.values(UNITS_CONFIG.towers);

        const contentBg = this.add.image(0, 0, 'content-bg').setDisplaySize(414, 1321).setOrigin(0.5, 0);
        unitsContainer.add(contentBg);

        const itemWidth = 176;
        const itemHeight = 236;
        const gap = 17;
        const startX = -(itemWidth + gap) / 2;
        const startY = 150;

        towers.forEach((towerConfig, index) => {
            const button = this.createUnitButton(towerConfig);
            const row = Math.floor(index / 2);
            const col = index % 2;
            button.setPosition(startX + col * (itemWidth + gap), startY + row * (itemHeight + gap));
            
            unitsContainer.add(button);
            this.towerButtons[towerConfig.id] = button;
            button.setVisible(false); // 初始隐藏，等待解锁
        });
    }

    /**
     * 创建单位按钮
     */
    private createUnitButton(towerConfig: any): Phaser.GameObjects.Container {
        const btn = this.add.container(0, 0);

        const itemBg = this.add.image(0, 0, 'item-background');
        itemBg.setDisplaySize(176, 236);

        const itemImg = this.add.image(0, -30, `${towerConfig.texture}_move`)
            .setDisplaySize(129, 132);

        const costBox = this.add.container(0, 75);
        const costBg = this.add.graphics();
        costBg.fillStyle(0x296EB7); // rgba(41, 110, 183, 1)
        costBg.lineStyle(1, 0x1C4F85); // rgba(28, 79, 133, 1)
        costBg.fillRoundedRect(-157 / 2, -56 / 2, 157, 56, 17);
        costBg.strokeRoundedRect(-157 / 2, -56 / 2, 157, 56, 17);

        const costBoxInner = this.add.graphics();
        costBoxInner.fillStyle(0x5FA4ED); // rgba(95, 164, 237, 1)
        costBoxInner.fillRoundedRect(-155/2, -48/2-3, 155, 48, 17);
        
        const costIcon = this.add.image(-30, 0, 'icon_resource').setDisplaySize(44, 47);
        
        const costText = this.add.text(25, 0, towerConfig.cost.toString(), {
            fontFamily: 'Alibaba PuHuiTi, sans-serif',
            fontSize: '30px',
            color: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        costBox.add([costBg, costBoxInner, costIcon, costText]);

        btn.add([itemBg, itemImg, costBox]);
        btn.setSize(176, 236).setInteractive();

        btn.on('pointerdown', () => {
            if (this.playerResources >= towerConfig.cost) {
                this.events.emit('selectTower', towerConfig.id);
            }
        });

        return btn;
    }

    /**
     * 创建调试按钮
     */
    private createDebugButton(x: number, y: number): void {
        this.debugButton = this.add.container(x, y);

        const debugBg = this.add.graphics();
        debugBg.fillStyle(0x34495e, 0.8);
        debugBg.fillRoundedRect(-80, -25, 160, 50, 10);

        const debugText = this.add.text(0, 0, '调试模式', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0.5);

        this.debugButton.add([debugBg, debugText]);
        this.debugButton.setSize(160, 50).setInteractive();

        this.debugButton.on('pointerdown', () => {
            this.toggleDebugMode();
        });

        // 设置初始状态
        this.updateDebugButtonAppearance();
    }

    /**
     * 切换调试模式
     */
    private toggleDebugMode(): void {
        this.isDebugMode = !this.isDebugMode;
        this.updateDebugButtonAppearance();
        
        // 通知游戏场景切换调试模式
        console.log('UIScene: toggleDebugMode 被调用, isDebugMode =', this.isDebugMode);
        console.log('UIScene: gameScene 引用 =', this.gameScene);
        console.log('UIScene: gameScene.setDebugMode 方法存在 =', !!(this.gameScene && this.gameScene.setDebugMode));
        
        if (this.gameScene && this.gameScene.setDebugMode) {
            console.log('UIScene: 调用 gameScene.setDebugMode(', this.isDebugMode, ')');
            this.gameScene.setDebugMode(this.isDebugMode);
        } else {
            console.log('UIScene: 无法调用 setDebugMode - gameScene 引用或方法不存在');
        }
        
    }

    /**
     * 更新调试按钮外观
     */
    private updateDebugButtonAppearance(): void {
        if (!this.debugButton) return;
        
        const debugBg = this.debugButton.list[0] as Phaser.GameObjects.Graphics;
        const debugText = this.debugButton.list[1] as Phaser.GameObjects.Text;
        
        if (this.isDebugMode) {
            debugBg.fillStyle(0x2ecc71, 0.9);
            debugText.setColor('#000');
        } else {
            debugBg.fillStyle(0x34495e, 0.8);
            debugText.setColor('#fff');
        }
        
        debugBg.clear();
        debugBg.fillRoundedRect(-80, -25, 160, 50, 10);
    }

    /**
     * 创建喷嚏技能按钮
     */
    private createSneezeButton(x: number, y: number): void {
        const sneezeSkill = this.levelConfig.skills.sneeze;
        const sneezeBtn = this.add.container(x, y);

        const skillBg = this.add.image(0, 0, 'skill-bg').setDisplaySize(406, 225);
        
        const skillIconWrapper = this.add.container(0, 0);
        const skillIcon = this.add.image(0, 0, 'skill-icon').setDisplaySize(197, 198);

        const feverText = this.add.text(0, 60, '喷嚏', {
            fontFamily: 'Alibaba PuHuiTi, sans-serif',
            fontSize: '24px',
            color: 'rgba(221,111,29,1)',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const feverBox = this.add.graphics();
        feverBox.fillStyle(0xF5CE3B); // rgba(245, 206, 59, 1)
        feverBox.fillRect(feverText.x - feverText.width/2 - 5, feverText.y - feverText.height/2 - 2, feverText.width + 10, feverText.height + 4);
        
        skillIconWrapper.add([skillIcon, feverBox, feverText]);
        skillIconWrapper.setPosition(0, 10);

        sneezeBtn.add([skillBg, skillIconWrapper]);
        sneezeBtn.setSize(406, 225).setInteractive();

        sneezeBtn.on('pointerdown', () => {
            this.events.emit('useSneezeSkill');
            sneezeBtn.disableInteractive().setAlpha(0.5);
            const cooldownTimer = this.time.delayedCall(sneezeSkill.cooldown, () => {
                sneezeBtn.setInteractive().setAlpha(1);
            });
            if (!this.skillCooldownTimers) {
                this.skillCooldownTimers = [];
            }
            this.skillCooldownTimers.push(cooldownTimer);
        });

        // 图鉴按钮（位于喷嚏按钮右侧）
        // const codexBtn = this.add.container(x + 200, y);
        // const codexBg = this.add.graphics();
        // codexBg.fillStyle(0x2980b9);
        // codexBg.fillRoundedRect(-100, -60, 200, 120, 20);
        // const codexIcon = this.add.image(-50, 0, 'icon_codex').setScale(0.9);
        // const codexText = this.add.text(10, 0, '图鉴', { fontSize: '28px',fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
        // codexBtn.add([codexBg, codexIcon, codexText]);
        // codexBtn.setSize(200, 120).setInteractive();
        // codexBtn.on('pointerdown', () => {
        //     // 暂停游戏与UI并打开图鉴场景
        //     const gameScene = this.scene.get('GameScene') as any;
        //     if (gameScene && gameScene.pauseGame) {
        //         gameScene.pauseGame();
        //     }
        //     this.scene.launch('CodexScene', { origin: 'UIScene' });
        //     this.scene.pause();
        // });
    }

    /**
     * 创建左上角控制按钮
     */
    private createTopLeftControls(): void {
        const container = this.add.container(60, 60);

        const exitBtn = this.add.image(0, 0, 'icon_exit').setDisplaySize(48, 48).setInteractive();
        const pauseBtn = this.add.image(100, 0, 'icon_pause').setDisplaySize(48, 48).setInteractive();

        exitBtn.on('pointerdown', () => {
            // 返回到关卡选择界面
            this.returnToLevelSelection();
        });

        pauseBtn.on('pointerdown', () => {
            if (this.gameScene.scene.isPaused()) {
                // 恢复游戏
                this.gameScene.scene.resume();
                this.gameScene.resumeGame();
                this.resumeUIScene();
                this.isPaused = false;
                pauseBtn.setTexture('icon_pause').setDisplaySize(48, 48);
            } else {
                // 暂停游戏
                this.gameScene.scene.pause();
                this.gameScene.pauseGame();
                this.pauseUIScene();
                this.isPaused = true;
                pauseBtn.setTexture('icon_play').setDisplaySize(48, 48);
            }
        });

        container.add([exitBtn, pauseBtn]);
    }

    /**
     * 暂停UI场景计时器
     */
    private pauseUIScene(): void {
        // 暂停塔解锁计时器
        this.towerUnlockTimers.forEach(timer => {
            if (timer && timer.paused === false) {
                timer.paused = true;
            }
        });
        
        // 暂停教程计时器
        this.tutorialTimers.forEach(timer => {
            if (timer && timer.paused === false) {
                timer.paused = true;
            }
        });
        
        // 暂停技能冷却计时器
        this.skillCooldownTimers.forEach(timer => {
            if (timer && timer.paused === false) {
                timer.paused = true;
            }
        });
    }
    
    /**
     * 恢复UI场景计时器
     */
    private resumeUIScene(): void {
        // 恢复塔解锁计时器
        this.towerUnlockTimers.forEach(timer => {
            if (timer && timer.paused === true) {
                timer.paused = false;
            }
        });
        
        // 恢复教程计时器
        this.tutorialTimers.forEach(timer => {
            if (timer && timer.paused === true) {
                timer.paused = false;
            }
        });
        
        // 恢复技能冷却计时器
        this.skillCooldownTimers.forEach(timer => {
            if (timer && timer.paused === true) {
                timer.paused = false;
            }
        });
    }

    /**
     * 创建左下角状态显示
     */
    private createBottomLeftControls(height: number): void {
        const container = this.add.container(200, height - 80);

        // 说明：此前出现居中横线的原因可能是奇数高度(41)与 fill+stroke 在同一个 Graphics 上导致 Canvas 抗锯齿在中线混合；
        // 为避免该问题：使用偶数高度(40)、分离填充与描边到两个 Graphics，并使用整数半径20。
        const HEALTH_BAR_WIDTH = 353;
        const HEALTH_BAR_HEIGHT = 40; // 偶数高度，避免中心像素半透明拼合
        const HEALTH_BAR_RADIUS = 20; // 与高度一半一致，形成圆头
        const HEALTH_BAR_FILL_HEIGHT = HEALTH_BAR_HEIGHT - 8;
        this.healthBarMaxWidth = HEALTH_BAR_WIDTH - 8;
        this.healthBarFillHeight = HEALTH_BAR_FILL_HEIGHT;

        // 生命值条填充
        const healthBarFillBg = this.add.graphics();
        healthBarFillBg.fillStyle(0x000000, 0.5);
        healthBarFillBg.fillRoundedRect(-150, -20, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT, HEALTH_BAR_RADIUS);

        // 生命值条描边
        const healthBarStroke = this.add.graphics();
        healthBarStroke.lineStyle(4, 0xFFFFFF, 1);
        healthBarStroke.strokeRoundedRect(-150, -20, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT, HEALTH_BAR_RADIUS);

        const healthGradientKey = 'health-bar-gradient';
        if (this.textures.exists(healthGradientKey)) {
            this.textures.remove(healthGradientKey);
        }
        this.healthBarTexture = this.textures.createCanvas(healthGradientKey, this.healthBarMaxWidth || (HEALTH_BAR_WIDTH - 8), this.healthBarFillHeight || HEALTH_BAR_FILL_HEIGHT) as Phaser.Textures.CanvasTexture;

        const healthBarImage = this.add.image(-150 + 4, 0, healthGradientKey)
            .setOrigin(0, 0.5)
            .setDisplaySize(this.healthBarMaxWidth || (HEALTH_BAR_WIDTH - 8), this.healthBarFillHeight || HEALTH_BAR_FILL_HEIGHT)
            .setDepth(3)
            .setVisible(false);
        this.healthBar = healthBarImage;
        if (this.healthBarTexture) {
            this.drawVerticalGradient(
                this.healthBarTexture,
                this.healthBarMaxWidth,
                this.healthBarFillHeight,
                0xFF856A,
                0xD90F16,
                (this.healthBarFillHeight || HEALTH_BAR_FILL_HEIGHT) / 2
            );
        }
        
        // 保留原有的health_move图标（可选，如果需要额外的装饰）
        this.healthBarFill = this.add.image(-130, 0, 'health_move');
        const healthImageHeight = 60;
        const healthImageRatio = this.textures.get('health_move').getSourceImage().width / 
                            this.textures.get('health_move').getSourceImage().height || 1;
        const healthImageWidth = healthImageHeight * healthImageRatio;
        this.healthBarFill.setDisplaySize(healthImageWidth, healthImageHeight);
        this.healthBarFill.setOrigin(0.5, 0.5);
        this.healthBarFill.setDepth(4);
        
        // 初始化生命值条
        this.updateHealthBar();

        // 进度条背景（同样采用偶数高度并分离填充与描边）
        const PROGRESS_BAR_WIDTH = 353;
        const PROGRESS_BAR_HEIGHT = 40;
        const PROGRESS_BAR_RADIUS = 20;
        const PROGRESS_BAR_FILL_HEIGHT = PROGRESS_BAR_HEIGHT - 8;
        this.progressBarMaxWidth = PROGRESS_BAR_WIDTH - 8;
        this.progressBarFillHeight = PROGRESS_BAR_FILL_HEIGHT;

        const progressBarFillBg = this.add.graphics();
        progressBarFillBg.fillStyle(0x000000, 0.5);
        progressBarFillBg.fillRoundedRect(-150, 30, PROGRESS_BAR_WIDTH, PROGRESS_BAR_HEIGHT, PROGRESS_BAR_RADIUS);

        const progressBarStroke = this.add.graphics();
        progressBarStroke.lineStyle(4, 0xFFFFFF, 1);
        progressBarStroke.strokeRoundedRect(-150, 30, PROGRESS_BAR_WIDTH, PROGRESS_BAR_HEIGHT, PROGRESS_BAR_RADIUS);
        
        const progressGradientKey = 'progress-bar-gradient';
        if (this.textures.exists(progressGradientKey)) {
            this.textures.remove(progressGradientKey);
        }
        this.progressBarTexture = this.textures.createCanvas(progressGradientKey, this.progressBarMaxWidth || (PROGRESS_BAR_WIDTH - 8), this.progressBarFillHeight || PROGRESS_BAR_FILL_HEIGHT) as Phaser.Textures.CanvasTexture;

        const progressBarImage = this.add.image(-150 + 4, 50, progressGradientKey)
            .setOrigin(0, 0.5)
            .setDisplaySize(this.progressBarMaxWidth || (PROGRESS_BAR_WIDTH - 8), this.progressBarFillHeight || PROGRESS_BAR_FILL_HEIGHT)
            .setDepth(3)
            .setVisible(false);
        this.progressBar = progressBarImage;
        if (this.progressBarTexture) {
            this.drawVerticalGradient(
                this.progressBarTexture,
                this.progressBarMaxWidth,
                this.progressBarFillHeight,
                0x48E7FF,
                0x0084D6,
                (this.progressBarFillHeight || PROGRESS_BAR_FILL_HEIGHT) / 2
            );
        }
        
        // 保留原有的stage_move指示器（可选）
        // 指示器初始放在进度条左端的中心位置 (x 在左端, y=50 为进度条中心)
        this.progressMoveIndicator = this.add.image(-150, 50, 'stage_move');
        const moveIndicatorHeight = 60;
        const aspectRatio = this.textures.get('stage_move').getSourceImage().width / 
                          this.textures.get('stage_move').getSourceImage().height;
        const moveIndicatorWidth = moveIndicatorHeight * aspectRatio;
        this.progressMoveIndicator.setDisplaySize(moveIndicatorWidth, moveIndicatorHeight);
        this.progressMoveIndicator.setOrigin(0.5, 0.5);
        this.progressMoveIndicator.setDepth(4);
        
        // 添加波次标记
        this.addWaveMarkers();

        // 添加所有元素到容器
        const containerItems = [
            healthBarFillBg, healthBarStroke, this.healthBar, this.healthBarFill,
            progressBarFillBg, progressBarStroke, this.progressBar, this.progressMoveIndicator
        ];
        
        if (this.progressMarkers.length > 0) {
            this.progressMarkers.forEach(marker => containerItems.push(marker));
        }

        container.add(containerItems);
    }

    /**
     * 创建对话系统
     */
    private createDialogueSystem(height: number): void {
        this.dialogueContainer = this.add.container(550, height - 40).setVisible(false);

        const avatar = this.add.image(30, 0, 'npc_avatar').setDisplaySize(100, 100);

        // 创建一个更大的气泡来容纳多行文字
        const bubble = this.add.graphics();
        bubble.fillStyle(0xffffff, 0.9);
        bubble.fillRoundedRect(120, -60, 720, 100, 20);
        
        // 绘制指向头像的小三角
        bubble.beginPath();
        bubble.moveTo(120, -20);
        bubble.lineTo(100, 0);
        bubble.lineTo(120, 20);
        bubble.closePath();
        bubble.fillPath();

        // 创建文字，使用较小的字体和适当的行间距
        this.dialogueText = this.add.text(480, 0, '', {
            fontSize: '22px',
            color: '#000',
            wordWrap: { 
                width: 660,
                useAdvancedWrap: true
            },
            lineSpacing: 10,
            padding: {
                top: 10,
                bottom: 10
            }
        }).setOrigin(0.5);

        this.dialogueContainer.add([avatar, bubble, this.dialogueText]);
        
        // 让对话框可以点击来跳过打字机效果
        this.dialogueContainer.setSize(720, 130).setInteractive();
        this.dialogueContainer.on('pointerdown', () => {
            this.skipTypewriter();
        });
    }

    /**
     * 设置事件监听
     */
    private setupEventListeners(): void {
        // 监听游戏场景事件
        this.gameScene.events.on('resourcesChanged', (data: { resources: number }) => {
            this.playerResources = data.resources;
            this.updateResourcesText();
        });

        this.gameScene.events.on('towersCountChanged', (data: { current: number; max?: number }) => {
            this.updateTowerCountText(data.current, data.max);
        });

        this.gameScene.events.on('playerHealthChanged', (data: { health: number }) => {
            this.playerHealth = data.health;
            this.updateHealthBar();
        });

        this.gameScene.events.on('showGameOver', (data: { reason: string }) => {
            this.showGameOver(data.reason);
        });
        
        // 监听塔部署事件
        this.gameScene.events.on('towerDeployed', (data: { towerType: string }) => {
            this.handleTowerDeployment(data.towerType);
        });
    }

    private updateTowerCountText(current: number, max?: number): void {
        if (!this.towerCountText) return;
        const maxText = max !== undefined ? ` / ${max}` : '';
        this.towerCountText.setText(`已部署: ${current}${maxText}`);
    }

    /**
     * 初始化塔解锁
     */
    private initTowerUnlocks(): void {
        this.levelConfig.towerUnlocks.forEach(unlock => {
            const timer = this.time.delayedCall(unlock.time * 1000, () => {
                const button = this.towerButtons[unlock.towerId];
                if (button) {
                    button.setVisible(true);
                }
            });
            // 存储计时器引用以便暂停/恢复
            if (!this.towerUnlockTimers) {
                this.towerUnlockTimers = [];
            }
            this.towerUnlockTimers.push(timer);
        });
    }

    /**
     * 开始教程
     */
    private startTutorial(): void {
        // 简化的教程系统，主要教程内容现在通过对话配置系统处理
        const tutorialSteps = [
            { time: 8000, text: '你好！欢迎来到免疫系统的世界！' },
            { time: 12000, text: '点击右侧的免疫细胞来选择它们。' },
            { time: 16000, text: '然后在左侧的战场上点击，部署它们来消灭病菌！' },
            { time: 20000, text: '祝你好运！' },
            { time: 23000, text: null }
        ];

        tutorialSteps.forEach(step => {
            const timer = this.time.delayedCall(step.time, () => {
                if (step.text) {
                    this.showDialogue(step.text);
                }
                // 不再需要手动隐藏，队列系统会自动处理
            });
            // 存储计时器引用以便暂停/恢复
            if (!this.tutorialTimers) {
                this.tutorialTimers = [];
            }
            this.tutorialTimers.push(timer);
        });
    }

    /**
     * 显示对话
     */
    private showDialogue(text: string): void {
        // 处理多行文本：将 \n 分割的文本转换为数组
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const formattedText = lines.join('\n');
        
        // 将新对话添加到队列
        this.dialogueQueue.push(formattedText);
        
        // 如果当前没有对话在播放，则开始播放队列
        if (!this.isDialoguePlaying) {
            this.playNextDialogue();
        }
    }
    
    /**
     * 播放下一个对话
     */
    private playNextDialogue(): void {
        if (this.dialogueQueue.length === 0) {
            // 队列为空，停止播放
            this.isDialoguePlaying = false;
            this.hideDialogue();
            return;
        }
        
        // 从队列中取出下一个对话
        const nextText = this.dialogueQueue.shift()!;
        
        // 设置对话内容
        this.currentDialogueText = nextText;
        this.currentCharIndex = 0;
        this.isDialoguePlaying = true;
        
        // 显示对话容器
        this.dialogueContainer.setVisible(true);
        
        // 开始打字机效果
        this.startTypewriter();
    }
    
    /**
     * 开始打字机效果
     */
    private startTypewriter(): void {
        this.dialogueText.setText('');
        
        // 每50毫秒显示一个字符
        this.typewriterTimer = this.time.addEvent({
            delay: 50,
            callback: () => {
                if (this.currentCharIndex < this.currentDialogueText.length) {
                    // 显示到当前字符位置的文字
                    const displayText = this.currentDialogueText.substring(0, this.currentCharIndex + 1);
                    this.dialogueText.setText(displayText);
                    this.currentCharIndex++;
                } else {
                    // 打字完成，停止计时器
                    this.stopTypewriter();
                    
                    // 计算显示时间后自动播放下一个对话
                    const lines = this.currentDialogueText.split('\n').filter(line => line.trim() !== '');
                    const baseTime = 2000; // 基础显示时间（打字完成后）
                    const lineTime = lines.length * 800; // 每行额外800ms
                    const displayTime = Math.min(baseTime + lineTime, 6000);
                    
                    this.time.delayedCall(displayTime, () => {
                        this.playNextDialogue();
                    });
                }
            },
            repeat: -1
        });
    }
    
    /**
     * 停止打字机效果
     */
    private stopTypewriter(): void {
        if (this.typewriterTimer) {
            this.typewriterTimer.remove();
            this.typewriterTimer = null;
        }
    }
    
    /**
     * 跳过打字机效果，立即显示完整对话
     */
    private skipTypewriter(): void {
        if (this.typewriterTimer) {
            // 如果正在打字，立即显示完整文字
            this.stopTypewriter();
            this.dialogueText.setText(this.currentDialogueText);
            
            // 立即开始播放下一个对话
            const lines = this.currentDialogueText.split('\n').filter(line => line.trim() !== '');
            const baseTime = 1000; // 跳过后的基础显示时间
            const lineTime = lines.length * 500; // 每行额外500ms
            const displayTime = Math.min(baseTime + lineTime, 3000);
            
            this.time.delayedCall(displayTime, () => {
                this.playNextDialogue();
            });
        }
    }

    /**
     * 隐藏对话
     */
    private hideDialogue(): void {
        // 停止打字机效果
        this.stopTypewriter();
        this.dialogueContainer.setVisible(false);
        this.isDialoguePlaying = false;
    }
    
    /**
     * 更新资源文本
     */
    private updateResourcesText(): void {
        if (!this.isInitialized) {
            return;
        }

        if (this.resourceText && this.resourceText.active) {
            this.resourceText.setText(this.playerResources.toString());
            return;
        }

        this.createResourceText();
    }

    /**
     * 创建或重新创建资源文本
     */
    private createResourceText(x?: number, y?: number): void {
        const panelWidth = 480;
        const finalX = x !== undefined ? x : this.scale.width - panelWidth / 2;
        const finalY = y !== undefined ? y : 120;

        if (!this.scene) {
            return;
        }

        const shouldRebuildContainer = !this.resourceContainer || !this.resourceContainer.scene;

        if (shouldRebuildContainer) {
            if (this.resourceContainer) {
                try {
                    this.resourceContainer.destroy(true);
                } catch (destroyError) {}
            }

            this.resourceContainer = this.add.container(finalX, finalY);

            const headerBox = this.add.graphics();
            headerBox.fillStyle(0xE88B8F);
            headerBox.lineStyle(3, 0xD14D45);
            headerBox.fillRoundedRect(-204, -55.5, 408, 90, 14);
            headerBox.strokeRoundedRect(-204, -55.5, 408, 90, 14);

            const headerImg = this.add.image(-70, -10, 'icon_resource').setDisplaySize(66, 70);

            this.resourceText = this.add.text(40, -10, this.playerResources.toString(), {
                fontFamily: 'Alibaba PuHuiTi, sans-serif',
                fontSize: '64px',
                color: '#fff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            this.resourceContainer.add([headerBox, headerImg, this.resourceText]);
            return;
        }

        const container = this.resourceContainer;
        if (!container || !container.scene) {
            return;
        }

        container.setPosition(finalX, finalY);

        if (!this.resourceText || !this.resourceText.active) {
            if (this.resourceText) {
                try {
                    this.resourceText.destroy();
                } catch (destroyError) {}
            }

            this.resourceText = this.add.text(40, -10, this.playerResources.toString(), {
                fontFamily: 'Alibaba PuHuiTi, sans-serif',
                fontSize: '64px',
                color: '#fff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            container.add(this.resourceText);
            return;
        }

        this.resourceText.setText(this.playerResources.toString());
    }

    /**
     * 更新生命值条
     */
    private updateHealthBar(): void {
        if (!this.healthBar || !this.healthBar.active) {
            return;
        }
        
        const maxHealth = this.levelConfig.initialPlayerHealth;
        const healthPercent = Math.max(0, Math.min(1, this.playerHealth / maxHealth));
        
        // 计算进度条宽度（最大宽度为背景宽度减去边距）
        const maxWidth = this.healthBarMaxWidth || (353 - 8); // 减去边框宽度
        const currentWidth = maxWidth * healthPercent;

        if (currentWidth > 0 && this.healthBarTexture) {
            this.drawVerticalGradient(
                this.healthBarTexture,
                currentWidth,
                this.healthBarFillHeight || 32,
                0xFF856A,
                0xD90F16,
                (this.healthBarFillHeight || 32) / 2
            );
            this.healthBar.setVisible(true);
        } else {
            if (this.healthBarTexture) {
                this.drawVerticalGradient(
                    this.healthBarTexture,
                    0,
                    this.healthBarFillHeight || 32,
                    0xFF856A,
                    0xD90F16,
                    (this.healthBarFillHeight || 32) / 2
                );
            }
            this.healthBar.setVisible(false);
        }
        
        // 更新心形图标位置（可选）
        if (this.healthBarFill && this.healthBarFill.active) {
            const heartPosition = -150 + 4 + Math.max(currentWidth, 0);
            this.healthBarFill.x = heartPosition;
        }
    }

    /**
     * 添加波次标记到进度条
     */
    private addWaveMarkers(): void {
        if (!this.levelConfig || !this.levelConfig.waves) return;
        
        // 清除之前的标记（如果有）
        this.progressMarkers.forEach(marker => marker.destroy());
        this.progressMarkers = [];
        
        const totalDuration = this.levelDuration;
        
        // 为每个波次的开始点添加标记
        this.levelConfig.waves.forEach((wave, index) => {
            if (index > 0) { // 跳过第一个波次（开始点）
                const position = wave.startTime / totalDuration;
                const markerX = -150 + (400 * position);
                
                const marker = this.add.image(markerX, 25, 'stage_mark');
                marker.setOrigin(0.5, 0);
                marker.setDisplaySize(50, 50); // 增大尺寸便于更清晰可见
                marker.setDepth(3); // 确保标记在最上层
                
                this.progressMarkers.push(marker);
            }
        });
    }
    
    /**
     * 更新进度条
     */
    private updateProgressBar(progress: number): void {
        if (!this.progressBar || !this.progressBar.active) {
            return;
        }
        
        // 计算进度条宽度
        const maxWidth = this.progressBarMaxWidth || (353 - 8); // 减去边框宽度
        const currentWidth = maxWidth * Math.min(progress, 1);
        
        if (currentWidth > 0 && this.progressBarTexture) {
            this.drawVerticalGradient(
                this.progressBarTexture,
                currentWidth,
                this.progressBarFillHeight || 32,
                0x48E7FF,
                0x0084D6,
                (this.progressBarFillHeight || 32) / 2
            );
            this.progressBar.setVisible(true);
        } else {
            if (this.progressBarTexture) {
                this.drawVerticalGradient(
                    this.progressBarTexture,
                    0,
                    this.progressBarFillHeight || 32,
                    0x48E7FF,
                    0x0084D6,
                    (this.progressBarFillHeight || 32) / 2
                );
            }
            this.progressBar.setVisible(false);
        }
        
        // 更新指示器位置（可选）
        if (this.progressMoveIndicator && this.progressMoveIndicator.active) {
            const indicatorPositionX = -150 + 4 + currentWidth;
            this.progressMoveIndicator.x = indicatorPositionX;
            // 保持垂直居中 - 进度条背景顶部30 + 高度40 => 中心50
            this.progressMoveIndicator.y = 50;
            
            if (this.timerCompleted) {
                this.progressMoveIndicator.x = -150 + 4 + maxWidth;
                this.progressMoveIndicator.y = 50;
            }
        }
    }

    /**
     * 显示游戏结束
     */
    private showGameOver(reason: string): void {
        
        if (this.isGameOver) {
            return;
        }
        
        // 设置游戏结束状态，防止重复调用
        this.isGameOver = true;
        
        // 检查是否为失败事件，如果是则设置失败状态
        if (reason === 'healthDepleted' || reason === 'organDestroyed') {
            this.hasFailed = true;
        }
        const { width, height } = this.scale;
        
        // 判断胜利或失败
        const isVictory = reason !== 'healthDepleted' && reason !== 'organDestroyed';
        
        // 创建全屏遮罩容器
        const fullScreenContainer = this.add.container(0, 0);
        fullScreenContainer.setDepth(1000); // 确保在最顶层
        
        // 全屏黑色遮罩
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9);
        overlay.setOrigin(0, 0);
        fullScreenContainer.add(overlay);
        
        // 使用Lottie动画
        this.lottieHelper = new LottieHelper(this);
        const animationKey = isVictory ? 'success_lottie' : 'fail_lottie';
        const animationData = this.cache.json.get(animationKey);
        
        if (animationData) {
            // 播放全屏Lottie动画
            this.lottieHelper.play(
                animationData,
                0,
                0,
                width,
                height,
                false,
                () => {
                    // 动画完成后停留在最后一帧，不销毁也不淡出
                    // 回调留空即可
                }
            );
        } else {
            // 如果Lottie数据不存在，直接显示模态窗口
            console.warn(`Lottie animation data not found: ${animationKey}`);
        }
        
        // 按钮容器 - 放在屏幕底部居中
        const buttonContainer = this.add.container(width / 2, height - 150);
        buttonContainer.setDepth(1003); // 确保在Lottie动画之上
        
        if (isVictory) {
            // 胜利时：左边下一关，右边返回关卡
            // 下一关按钮 - 使用next_button.png
            const nextBtn = this.createImageButton(
                450, 
                0, 
                '下一关', 
                'next_button',
                () => {
                    // TODO: 实现下一关逻辑
                    this.restartCurrentLevel(); // 暂时重启当前关卡
                }
            );
            buttonContainer.add(nextBtn);
            
            // 返回关卡按钮 - 使用return_button
            const returnBtn = this.createImageButton(
                750, 
                0, 
                '返回关卡', 
                'return_button',
                () => {
                    this.returnToLevelSelection();
                }
            );
            buttonContainer.add(returnBtn);
        } else {
            // 失败时：左边重新挑战，右边返回关卡
            // 重新挑战按钮 - 使用next_button.png
            const retryBtn = this.createImageButton(
                450, 
                0, 
                '重新挑战', 
                'next_button',
                () => {
                    this.restartCurrentLevel();
                }
            );
            buttonContainer.add(retryBtn);
            
            // 返回关卡按钮 - 使用return_button
            const returnBtn = this.createImageButton(
                750, 
                0, 
                '返回关卡', 
                'return_button',
                () => {
                    this.returnToLevelSelection();
                }
            );
            buttonContainer.add(returnBtn);
        }
        
    }

    /**
     * 创建模态窗口按钮
     */
    /**
     * 创建带图片背景的按钮
     */
    private createImageButton(x: number, y: number, text: string, imageKey: string, onClick: () => void): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        // 按钮背景图片
        const bg = this.add.image(0, 0, imageKey);
        // 设置合适的显示尺寸
        bg.setDisplaySize(237, 98); // 根据button.svg的尺寸调整，保持比例
        container.add(bg);
        
        // 按钮文本
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '32px',
            color: '#323232',
            fontStyle: 'bold',
            fontFamily: 'Alibaba PuHuiTi, sans-serif'
        }).setOrigin(0.5);
        container.add(buttonText);
        
        // 设置交互
        container.setSize(237, 98).setInteractive();
        
        container.on('pointerover', () => {
            container.setScale(1.05);
            this.game.canvas.style.cursor = 'pointer';
        });
        
        container.on('pointerout', () => {
            container.setScale(1);
            this.game.canvas.style.cursor = 'default';
        });
        
        container.on('pointerdown', onClick);
        
        return container;
    }

    /**
     * 返回关卡选择
     */
    private returnToLevelSelection(): void {
        
        // 销毁Lottie动画
        if (this.lottieHelper) {
            this.lottieHelper.destroy();
            this.lottieHelper = null;
        }
        
        // 停止当前场景
        if (this.gameScene && this.gameScene.scene) {
            this.gameScene.scene.stop();
        }
        
        // 延迟返回，确保场景完全停止
        this.time.delayedCall(100, () => {
            this.scene.start('LevelSelection');
        });
    }

    /**
     * 重新开始当前关卡
     */
    private restartCurrentLevel(): void {
        // 销毁Lottie动画
        if (this.lottieHelper) {
            this.lottieHelper.destroy();
            this.lottieHelper = null;
        }
        
        // 停止当前场景
        if (this.gameScene) {
            this.gameScene.scene.stop();
        }
        this.scene.stop();
        
        // 通过 Preloader 重启游戏，确保资源正确加载
        this.scene.start('Preloader', { nextScene: 'GameScene', levelData: { levelId: this.currentLevelId } });
    }

    update(time: number, delta: number): void {
        // 添加初始化状态检查
        if (!this.isInitialized || this.isGameOver || this.isPaused) {
            return;
        }

        // 使用相对时间系统，避免绝对时间的问题
        if (this.lastUpdateTime > 0) {
            this.gameElapsedTime += delta;
        }
        this.lastUpdateTime = time;
        
        // 将毫秒转换为秒
        const elapsedTimeInSeconds = this.gameElapsedTime / 1000;
        const progress = Math.min(elapsedTimeInSeconds / this.levelDuration, 1);
        
        // 添加调试日志（每5秒输出一次以便追踪）
        if (Math.floor(elapsedTimeInSeconds) % 5 === 0 && Math.floor(elapsedTimeInSeconds) !== Math.floor((elapsedTimeInSeconds - delta/1000))) {
        }
        
        this.updateProgressBar(progress);

        // 检查胜利条件 - 只有在没有失败的情况下才检查胜利
        if (elapsedTimeInSeconds >= this.levelDuration && this.playerHealth > 0 && this.isInitialized && !this.hasFailed && !this.timerCompleted) {
            
            // 标记计时器完成，停止敌人生成
            this.timerCompleted = true;
            this.gameScene.stopEnemySpawning();
            
            // 显示提示信息
            this.showDialogue('计时完成！消灭所有剩余病菌以获得胜利！');
        }
    }

    /**
     * 场景销毁时的清理
     */
    shutdown(): void {
        
        // 销毁Lottie动画
        if (this.lottieHelper) {
            this.lottieHelper.destroy();
            this.lottieHelper = null;
        }
        
        // 清理所有计时器
        this.time.removeAllEvents();
        
        // 清理计时器数组
        if (this.towerUnlockTimers) {
            this.towerUnlockTimers.forEach(timer => {
                if (timer) {
                    timer.remove();
                }
            });
            this.towerUnlockTimers = [];
        }
        
        if (this.tutorialTimers) {
            this.tutorialTimers.forEach(timer => {
                if (timer) {
                    timer.remove();
                }
            });
            this.tutorialTimers = [];
        }
        
        if (this.skillCooldownTimers) {
            this.skillCooldownTimers.forEach(timer => {
                if (timer) {
                    timer.remove();
                }
            });
            this.skillCooldownTimers = [];
        }
        
        // 清理所有事件监听
        if (this.gameScene) {
            this.gameScene.events.removeAllListeners();
        }
        this.events.removeAllListeners();
        
        // 清理输入监听
        Object.values(this.towerButtons).forEach(button => {
            if (button) {
                button.removeAllListeners();
            }
        });
        
        // 清理对话系统
        this.stopTypewriter();
        if (this.dialogueContainer) {
            this.dialogueContainer.removeAll(true);
        }
        
        // 重置所有状态变量
        this.resetAllState();
        this.gameScene = null;
        this.levelConfig = null as any;
        
    }
    
    /**
     * 触发关卡开始对话
     */
    private triggerLevelStartDialogue(): void {
        // 获取当前关卡ID
        const levelId = this.currentLevelId;
        
        const dialogueText = this.dialogueManager.checkTrigger('levelStart', { levelId });
        if (dialogueText) {
            this.showDialogue(dialogueText);
        }
    }
    
    /**
     * 处理塔部署事件
     */
    private handleTowerDeployment(towerType: string): void {
        // 记录部署
        this.dialogueManager.recordDeployment(towerType);
        
        // 检查是否触发对话
        const dialogueText = this.dialogueManager.checkTrigger('deploy', { towerType });
        
        if (dialogueText) {
            this.showDialogue(dialogueText);
        }
    }

    /**
     * 使用 CanvasTexture 绘制纵向渐变填充
     */
    private drawVerticalGradient(
        texture: Phaser.Textures.CanvasTexture,
        filledWidth: number,
        filledHeight: number,
        topColor: number,
        bottomColor: number,
        cornerRadius: number = 0
    ): void {
        const targetWidth = Math.max(0, Math.min(texture.width, filledWidth));
        const targetHeight = filledHeight > 0 ? Math.min(texture.height, filledHeight) : texture.height;
        const ctx = texture.context;

        ctx.clearRect(0, 0, texture.width, texture.height);

        if (targetWidth <= 0 || targetHeight <= 0) {
            texture.refresh();
            return;
        }

        const radius = Math.max(0, Math.min(cornerRadius, targetHeight / 2, targetWidth / 2));

        const top = Phaser.Display.Color.IntegerToRGB(topColor);
        const bottom = Phaser.Display.Color.IntegerToRGB(bottomColor);
        const gradient = ctx.createLinearGradient(0, 0, 0, targetHeight);
        gradient.addColorStop(0, `rgba(${top.r},${top.g},${top.b},1)`);
        gradient.addColorStop(1, `rgba(${bottom.r},${bottom.g},${bottom.b},1)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (radius > 0) {
            ctx.moveTo(radius, 0);
            ctx.lineTo(targetWidth - radius, 0);
            ctx.quadraticCurveTo(targetWidth, 0, targetWidth, radius);
            ctx.lineTo(targetWidth, targetHeight - radius);
            ctx.quadraticCurveTo(targetWidth, targetHeight, targetWidth - radius, targetHeight);
            ctx.lineTo(radius, targetHeight);
            ctx.quadraticCurveTo(0, targetHeight, 0, targetHeight - radius);
            ctx.lineTo(0, radius);
            ctx.quadraticCurveTo(0, 0, radius, 0);
        } else {
            ctx.rect(0, 0, targetWidth, targetHeight);
        }
        ctx.closePath();
        ctx.fill();

        texture.refresh();
    }
}