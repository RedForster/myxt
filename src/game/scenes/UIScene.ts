import { Scene } from 'phaser';
import { UNITS_CONFIG } from '../config/UnitsConfig';
import { LevelConfig } from '../config/LevelConfig';

/**
 * UI场景
 * 负责用户界面显示和交互
 */
export class UIScene extends Scene {
    // 游戏数据
    private gameScene: any;
    private levelConfig: LevelConfig;
    private playerHealth: number;
    private playerResources: number;
    private isGameOver: boolean = false;

    // UI元素
    private resourceText: Phaser.GameObjects.Text;
    private healthBar: Phaser.GameObjects.Graphics;
    private healthBarBg: Phaser.GameObjects.Graphics;
    private progressBar: Phaser.GameObjects.Graphics;
    private progressBarBg: Phaser.GameObjects.Graphics;
    private organLevelText: Phaser.GameObjects.Text;
    private upgradeText: Phaser.GameObjects.Text;
    private upgradeButton: Phaser.GameObjects.Container;
    private towerButtons: { [key: string]: Phaser.GameObjects.Container } = {};
    private dialogueContainer: Phaser.GameObjects.Container;
    private dialogueText: Phaser.GameObjects.Text;

    // 时间管理
    private levelDuration: number;
    private gameStartTime: number;

    constructor() {
        super({ key: 'UIScene', active: false });
    }

    init(data: any) {
        this.gameScene = data.gameScene;
        this.levelConfig = data.levelConfig;
        this.playerHealth = data.playerHealth;
        this.playerResources = data.playerResources;
        this.isGameOver = false;

        this.levelDuration = this.levelConfig.waves.reduce((max, wave) => 
            Math.max(max, wave.endTime), 0);
        this.gameStartTime = this.time.now;
    }

    create() {
        const { width, height } = this.scale;

        this.createRightPanel(width, height);
        this.createTopLeftControls(width, height);
        this.createBottomLeftControls(width, height);
        this.createDialogueSystem(width, height);

        this.setupEventListeners();
        this.initTowerUnlocks();
        this.startTutorial();
    }

    /**
     * 创建右侧控制面板
     */
    private createRightPanel(width: number, height: number): void {
        const panelWidth = width * 0.25;
        const panelX = width - panelWidth;

        // 面板背景
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x111111, 0.8);
        panelBg.fillRect(panelX, 0, panelWidth, height);

        // 资源显示
        const resourceBox = this.add.graphics();
        resourceBox.fillStyle(0xc0392b);
        resourceBox.fillRoundedRect(panelX + panelWidth/2 - 125, 20, 250, 80, 20);

        this.resourceText = this.add.text(panelX + panelWidth/2, 60, 
            this.playerResources.toString(), {
            fontSize: '50px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0.5);

        // 器官升级按钮
        this.createOrganUpgradeButton(panelX + panelWidth/2, 155);

        // 塔建造按钮
        this.createTowerButtons(panelX + panelWidth/2, 240);

        // 喷嚏技能按钮
        this.createSneezeButton(panelX + panelWidth/2, height - 150);
    }

    /**
     * 创建器官升级按钮
     */
    private createOrganUpgradeButton(x: number, y: number): void {
        this.upgradeButton = this.add.container(x, y);

        const upgradeBg = this.add.graphics();
        upgradeBg.fillStyle(0x27ae60);
        upgradeBg.fillRoundedRect(-125, -40, 250, 80, 15);

        const organConfig = UNITS_CONFIG.fixed.immuneOrgan;
        this.organLevelText = this.add.text(0, -15, `器官等级: 1`, {
            fontSize: '28px',
            color: '#fff'
        }).setOrigin(0.5);

        this.upgradeText = this.add.text(0, 20, `升级 (${organConfig.upgradeCost})`, {
            fontSize: '24px',
            color: '#fff'
        }).setOrigin(0.5);

        this.upgradeButton.add([upgradeBg, this.organLevelText, this.upgradeText]);
        this.upgradeButton.setSize(250, 80).setInteractive();

        this.upgradeButton.on('pointerdown', () => {
            this.events.emit('upgradeOrgan');
        });
    }

    /**
     * 创建塔建造按钮
     */
    private createTowerButtons(x: number, y: number): void {
        const unitsContainer = this.add.container(x, y);
        const towers = Object.values(UNITS_CONFIG.towers);

        towers.forEach((towerConfig, index) => {
            const button = this.createUnitButton(towerConfig);
            const row = Math.floor(index / 2);
            const col = index % 2;
            button.setPosition(col * 200 - 100, row * 170 + 50);
            
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

        const border = this.add.graphics();
        border.lineStyle(6, 0xc0392b);
        border.strokeRect(-80, -80, 160, 160);

        const icon = this.add.image(0, 0, towerConfig.texture);

        const costText = this.add.text(-75, -75, towerConfig.cost.toString(), {
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#fff',
            backgroundColor: '#c0392b',
            padding: { x: 8, y: 4 }
        });

        btn.add([border, icon, costText]);
        btn.setSize(160, 160).setInteractive();

        btn.on('pointerdown', () => {
            if (this.playerResources >= towerConfig.cost) {
                this.events.emit('selectTower', towerConfig.id);
            }
        });

        return btn;
    }

    /**
     * 创建喷嚏技能按钮
     */
    private createSneezeButton(x: number, y: number): void {
        const sneezeSkill = this.levelConfig.skills.sneeze;
        const sneezeBtn = this.add.container(x, y);

        const sneezeBg = this.add.graphics();
        sneezeBg.fillStyle(0xc0392b);
        sneezeBg.fillRoundedRect(-125, -60, 250, 120, 20);

        const sneezeIcon = this.add.image(-80, 0, 'icon_sneeze').setScale(0.8);
        const sneezeText = this.add.text(30, 0, sneezeSkill.name, {
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0.5);

        sneezeBtn.add([sneezeBg, sneezeIcon, sneezeText]);
        sneezeBtn.setSize(250, 120).setInteractive();

        sneezeBtn.on('pointerdown', () => {
            this.events.emit('useSneezeSkill');
            sneezeBtn.disableInteractive().setAlpha(0.5);
            this.time.delayedCall(sneezeSkill.cooldown, () => {
                sneezeBtn.setInteractive().setAlpha(1);
            });
        });
    }

    /**
     * 创建左上角控制按钮
     */
    private createTopLeftControls(width: number, height: number): void {
        const container = this.add.container(60, 60);

        const exitBtn = this.add.image(0, 0, 'icon_exit').setScale(1.2).setInteractive();
        const pauseBtn = this.add.image(100, 0, 'icon_pause').setScale(1.2).setInteractive();

        pauseBtn.on('pointerdown', () => {
            if (this.gameScene.scene.isPaused()) {
                this.gameScene.scene.resume();
                pauseBtn.setTexture('icon_pause');
            } else {
                this.gameScene.scene.pause();
                pauseBtn.setTexture('icon_play');
            }
        });

        container.add([exitBtn, pauseBtn]);
    }

    /**
     * 创建左下角状态显示
     */
    private createBottomLeftControls(width: number, height: number): void {
        const container = this.add.container(250, height - 80);

        // 生命值条
        this.healthBarBg = this.add.graphics();
        this.healthBarBg.fillStyle(0x000000, 0.5);
        this.healthBarBg.fillRoundedRect(-150, -20, 400, 40, 20);

        this.healthBar = this.add.graphics();
        this.updateHealthBar();

        const healthIcon = this.add.image(-180, 0, 'icon_health');

        // 进度条
        this.progressBarBg = this.add.graphics();
        this.progressBarBg.fillStyle(0x000000, 0.5);
        this.progressBarBg.fillRoundedRect(-150, 40, 400, 40, 20);

        this.progressBar = this.add.graphics();

        const progressIcon = this.add.image(-180, 60, 'icon_progress');

        container.add([
            this.healthBarBg, this.healthBar, healthIcon,
            this.progressBarBg, this.progressBar, progressIcon
        ]);
    }

    /**
     * 创建对话系统
     */
    private createDialogueSystem(width: number, height: number): void {
        this.dialogueContainer = this.add.container(550, height - 80).setVisible(false);

        const avatar = this.add.image(0, 0, 'npc_avatar');

        const bubble = this.add.graphics();
        bubble.fillStyle(0xffffff, 0.9);
        bubble.fillRoundedRect(120, -50, 720, 100, 20);
        bubble.beginPath();
        bubble.moveTo(120, -10);
        bubble.lineTo(100, 0);
        bubble.lineTo(120, 10);
        bubble.closePath();
        bubble.fillPath();

        this.dialogueText = this.add.text(370, 0, '', {
            fontSize: '32px',
            color: '#000',
            wordWrap: { width: 480 }
        }).setOrigin(0.5);

        this.dialogueContainer.add([avatar, bubble, this.dialogueText]);
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

        this.gameScene.events.on('playerHealthChanged', (data: { health: number }) => {
            this.playerHealth = data.health;
            this.updateHealthBar();
        });

        this.gameScene.events.on('organUpgraded', (data: any) => {
            this.updateOrganInfo(data);
        });

        this.gameScene.events.on('showGameOver', (data: { reason: string }) => {
            this.showGameOver(data.reason);
        });
    }

    /**
     * 初始化塔解锁
     */
    private initTowerUnlocks(): void {
        this.levelConfig.towerUnlocks.forEach(unlock => {
            this.time.delayedCall(unlock.time * 1000, () => {
                const button = this.towerButtons[unlock.towerId];
                if (button) {
                    button.setVisible(true);
                }
            });
        });
    }

    /**
     * 开始教程
     */
    private startTutorial(): void {
        const tutorialSteps = [
            { time: 1000, text: '你好！欢迎来到免疫系统的世界！' },
            { time: 5000, text: '点击右侧的免疫细胞来选择它们。' },
            { time: 9000, text: '然后在左侧的战场上点击，部署它们来消灭病菌！' },
            { time: 14000, text: '祝你好运！' },
            { time: 17000, text: null }
        ];

        tutorialSteps.forEach(step => {
            this.time.delayedCall(step.time, () => {
                if (step.text) {
                    this.showDialogue(step.text);
                } else {
                    this.hideDialogue();
                }
            });
        });
    }

    /**
     * 显示对话
     */
    private showDialogue(text: string): void {
        this.dialogueText.setText(text);
        this.dialogueContainer.setVisible(true);
    }

    /**
     * 隐藏对话
     */
    private hideDialogue(): void {
        this.dialogueContainer.setVisible(false);
    }

    /**
     * 更新资源文本
     */
    private updateResourcesText(): void {
        this.resourceText.setText(this.playerResources.toString());
    }

    /**
     * 更新生命值条
     */
    private updateHealthBar(): void {
        this.healthBar.clear();
        const maxHealth = this.levelConfig.initialPlayerHealth;
        const healthPercent = this.playerHealth / maxHealth;
        const healthColor = healthPercent > 0.3 ? 0x2ecc71 : 0xe74c3c;
        
        this.healthBar.fillStyle(healthColor);
        this.healthBar.fillRoundedRect(-150, -20, 400 * healthPercent, 40, 20);
    }

    /**
     * 更新进度条
     */
    private updateProgressBar(progress: number): void {
        this.progressBar.clear();
        this.progressBar.fillStyle(0x9b59b6);
        this.progressBar.fillRoundedRect(-150, 40, 400 * progress, 40, 20);
    }

    /**
     * 更新器官信息
     */
    private updateOrganInfo(data: any): void {
        this.organLevelText.setText(`器官等级: ${data.level}`);
        if (data.level >= UNITS_CONFIG.fixed.immuneOrgan.maxLevel) {
            this.upgradeButton.disableInteractive().setAlpha(0.5);
            this.upgradeText.setText('已满级');
        }
    }

    /**
     * 显示游戏结束
     */
    private showGameOver(reason: string): void {
        if (this.isGameOver) return;
        
        this.isGameOver = true;
        const { width, height } = this.scale;
        
        this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
        
        const message = reason === 'healthDepleted' || reason === 'organDestroyed' ? '游戏失败' : '胜利！';
        const color = reason === 'healthDepleted' || reason === 'organDestroyed' ? '#e74c3c' : '#2ecc71';
        
        this.add.text(width/2, height/2, message, {
            fontSize: '192px',
            color: color,
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    update(time: number, delta: number): void {
        if (this.isGameOver || this.gameScene.scene.isPaused()) {
            return;
        }

        const elapsedTime = (this.time.now - this.gameStartTime) / 1000;
        const progress = Math.min(elapsedTime / this.levelDuration, 1);
        
        this.updateProgressBar(progress);

        // 检查胜利条件
        if (elapsedTime >= this.levelDuration && this.playerHealth > 0) {
            this.showGameOver('victory');
        }
    }
}