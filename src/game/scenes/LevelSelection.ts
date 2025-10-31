import { Scene } from 'phaser';
import { LevelSelectionConfig, LevelSelectionManager } from '../config/LevelSelectionConfig';

/**
 * 关卡选择场景
 * 按照新UI设计        // 创建左右切换按钮
        this.leftButton = this.add.image(centerX - 800 * scaleRatio, centerY, 'previous_level');
        this.leftButton.setDisplaySize(85.27 * scaleRatio, 104.41 * scaleRatio);
        this.leftButton.setDepth(4);
        
        this.rightButton = this.add.image(centerX + 800 * scaleRatio, centerY, 'next_level');
        this.rightButton.setDisplaySize(85.27 * scaleRatio, 104.41 * scaleRatio);
        this.rightButton.setDepth(4);
        
        // 创建图鉴按钮
        this.unitLibButton = this.add.image(centerX - 650 * scaleRatio, centerY + 350 * scaleRatio, 'unit_lib');
        this.unitLibButton.setDisplaySize(270 * scaleRatio, 208 * scaleRatio);
        this.unitLibButton.setDepth(2);下一关来切换中间的关卡信息，点击中间任意位置进入关卡
 */
export class LevelSelection extends Scene {
    private levelManager: LevelSelectionManager;
    private levels: LevelSelectionConfig[] = [];
    private currentLevelIndex: number = 0;
    
    // UI 元素
    private backgroundImage: Phaser.GameObjects.Image;
    private levelCardBg: Phaser.GameObjects.Image;
    private titleBg: Phaser.GameObjects.Image;
    private infoBg: Phaser.GameObjects.Image;
    private levelPreviewImage: Phaser.GameObjects.Image;
    private leftButton: Phaser.GameObjects.Image;
    private rightButton: Phaser.GameObjects.Image;
    private backButton: Phaser.GameObjects.Container;
    private unitLibButton: Phaser.GameObjects.Image;
    
    // 文本元素
    private titlePart1: Phaser.GameObjects.Text;
    private titlePart2: Phaser.GameObjects.Text;
    private knowledgeText: Phaser.GameObjects.Text;
    private descriptionText: Phaser.GameObjects.Text;
    private enemyText: Phaser.GameObjects.Text;
    
    // 交互区域
    private centerPanel: Phaser.GameObjects.Zone;

    constructor() {
        super('LevelSelection');
        this.levelManager = LevelSelectionManager.getInstance();
    }

    preload() {
        // 加载新UI资源
        this.load.image('levelselect_bg', 'assets/levelselect_bg.svg');
        this.load.image('levelcard_bg', 'assets/levelcard_bg.svg');
        this.load.image('level_title_bg', 'assets/level_title_bg.svg');
        this.load.image('info_bg', 'assets/info_bg.svg');
        this.load.image('level_preview', 'assets/level_preview.svg');
        this.load.image('previous_level', 'assets/previous_level.svg');
        this.load.image('next_level', 'assets/next_level.svg');
        this.load.image('unit_lib', 'assets/unit_lib.svg');
        this.load.image('button', 'assets/button.svg');
    }

    init() {
        // 获取关卡数据
        this.levels = this.levelManager.getAllLevels();
        
        // 设置默认关卡
        this.currentLevelIndex = 0;
    }

    create() {
        const { width, height } = this.scale;
        
        // 创建背景
        this.backgroundImage = this.add.image(width / 2, height / 2, 'levelselect_bg');
        this.backgroundImage.setDisplaySize(width, height);
        
        // 创建UI元素
        this.createUI();
        
        // 更新当前关卡信息
        this.updateLevelInfo();
        
        // 设置交互
        this.setupInteractions();
    }

    /**
     * 创建UI元素
     */
    private createUI(): void {
        const { width, height } = this.scale;
        
        // 根据UI设计定位各个元素
        const centerX = width / 2;
        const centerY = height / 2;
        
        // 统一使用基于宽度的缩放比例
        const scaleRatio = width / 2048 * 0.8;
        
        // 创建关卡卡片背景 (最底层)
        this.levelCardBg = this.add.image(centerX-25, centerY, 'levelcard_bg');
        this.levelCardBg.setDisplaySize(1624 * scaleRatio, 985 * scaleRatio);
        this.levelCardBg.setDepth(0);
        console.log("关卡背景尺寸", this.levelCardBg.displayWidth, this.levelCardBg.displayHeight);

        // 创建关卡预览图 (第二层)
        this.levelPreviewImage = this.add.image(centerX, centerY - 60 * scaleRatio, 'level_preview');
        this.levelPreviewImage.setDisplaySize(1449 * scaleRatio, 498 * scaleRatio);
        this.levelPreviewImage.setDepth(1);

        // 创建标题背景 (第三层，在预览图之上)
        this.titleBg = this.add.image(centerX, centerY - 380 * scaleRatio, 'level_title_bg');
        this.titleBg.setDisplaySize(701 * scaleRatio, 104 * scaleRatio);
        this.titleBg.setDepth(2);
        console.log("标题背景尺寸", this.titleBg.displayWidth, this.titleBg.displayHeight);

        // 创建标题文字 (最顶层)
        this.titlePart1 = this.add.text(centerX - 120 * scaleRatio, centerY - 380 * scaleRatio, '第一关', {
            fontSize: Math.round(57 * scaleRatio) + 'px',
            color: '#00AEFF',
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 5
        }).setOrigin(0.5);
        this.titlePart1.setShadow(0, 5 * scaleRatio, '#FFFFFF', 2, false, true);
        this.titlePart1.setDepth(3);
        
        this.titlePart2 = this.add.text(centerX + 100 * scaleRatio, centerY - 380 * scaleRatio, '普通病菌', {
            fontSize: Math.round(57 * scaleRatio) + 'px',
            color: '#1F32FF',
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 5
        }).setOrigin(0.5);
        this.titlePart2.setShadow(0, 6 * scaleRatio, '#FFFFFF', 1, false, true);
        this.titlePart2.setDepth(3);
        
        // 创建信息背景
        this.infoBg = this.add.image(centerX - 200 * scaleRatio, centerY + 250 * scaleRatio, 'info_bg');
        this.infoBg.setDisplaySize(812 * scaleRatio, 86 * scaleRatio);
        this.infoBg.setDepth(2);
        
        // 创建知识点文字
        this.knowledgeText = this.add.text(centerX - 530 * scaleRatio, centerY + 250 * scaleRatio, '知识点：demo1', {
            fontSize: Math.round(36 * scaleRatio) + 'px',
            color: '#0067A7',
            fontFamily: 'Inter, Arial, sans-serif',
            stroke: '#fdfdfaff',
            strokeThickness: 2
        }).setOrigin(0, 0.5);
        this.knowledgeText.setDepth(3);
        
        // 创建描述文字
        this.descriptionText = this.add.text(centerX - 520 * scaleRatio, centerY + 330 * scaleRatio, '关于描述：人体的demo2相比demo1更加脆弱', {
            fontSize: Math.round(28 * scaleRatio) + 'px',
            color: '#434343',
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontStyle: 'bold',
            wordWrap: { width: 799 * scaleRatio }
        }).setOrigin(0, 0.5);
        this.descriptionText.setDepth(3);
        
        this.enemyText = this.add.text(centerX - 520 * scaleRatio, centerY + 360 * scaleRatio, '可能出现的敌人：普通病菌', {
            fontSize: Math.round(28 * scaleRatio) + 'px',
            color: '#434343',
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        this.enemyText.setDepth(3);
        
        // 创建左右切换按钮
        this.leftButton = this.add.image(centerX - 900 * scaleRatio, centerY, 'previous_level');
        this.leftButton.setDisplaySize(85.27 * scaleRatio, 104.41 * scaleRatio);
        
        this.rightButton = this.add.image(centerX + 900 * scaleRatio, centerY, 'next_level');
        this.rightButton.setDisplaySize(85.27 * scaleRatio, 104.41 * scaleRatio);
        
        // 创建图鉴按钮
        this.unitLibButton = this.add.image(centerX - 1050 * scaleRatio, centerY + 600 * scaleRatio, 'unit_lib');
        this.unitLibButton.setDisplaySize(270 * scaleRatio, 208 * scaleRatio);
        
        // 创建返回按钮
        this.createBackButton(centerX + 1050 * scaleRatio, centerY + 650 * scaleRatio);
        
        // 创建中央交互区域
        this.centerPanel = this.add.zone(centerX, centerY, 1624 * scaleRatio, 985 * scaleRatio);
        this.centerPanel.setInteractive();
    }

    /**
     * 创建返回按钮
     */
    private createBackButton(x: number, y: number): void {
        const { width } = this.scale;
        const scaleRatio = width / 2048;
        
        this.backButton = this.add.container(x, y);
        
        // 按钮背景
        const buttonBg = this.add.image(0, 0, 'button');
        buttonBg.setDisplaySize(236 * scaleRatio, 109 * scaleRatio);
        this.backButton.add(buttonBg);
        
        // 按钮文字
        const buttonText = this.add.text(0, 0, '返回', {
            fontSize: Math.round(30 * scaleRatio) + 'px',
            color: '#323232',
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.backButton.add(buttonText);
        
        // 设置交互
        this.backButton.setSize(236 * scaleRatio, 109 * scaleRatio);
        this.backButton.setInteractive();
    }

    /**
     * 更新关卡信息
     */
    private updateLevelInfo(): void {
        if (this.levels.length === 0) return;
        
        const currentLevel = this.levels[this.currentLevelIndex];
        console.log("当前关卡数据", currentLevel);
        // 更新标题
        this.titlePart1.setText(`第${this.currentLevelIndex + 1}关`);
        this.titlePart2.setText(currentLevel.title || '普通病菌');
        
        // 更新知识点 - 使用description字段或默认值
        this.knowledgeText.setText(`${currentLevel.description || 'demo1'}`);
        
        // 更新描述
        this.descriptionText.setText(currentLevel.description || '关于描述：人体的demo2相比demo1更加脆弱');
        this.enemyText.setText(`可能出现的敌人：普通病菌`);
        
        // 更新按钮可见性
        this.leftButton.setVisible(this.currentLevelIndex > 0);
        this.rightButton.setVisible(this.currentLevelIndex < this.levels.length - 1);
    }

    /**
     * 设置交互
     */
    private setupInteractions(): void {
        // 左箭头点击
        this.leftButton.setInteractive();
        this.leftButton.on('pointerdown', () => {
            if (this.currentLevelIndex > 0) {
                this.currentLevelIndex--;
                this.updateLevelInfo();
            }
        });
        
        // 右箭头点击
        this.rightButton.setInteractive();
        this.rightButton.on('pointerdown', () => {
            if (this.currentLevelIndex < this.levels.length - 1) {
                this.currentLevelIndex++;
                this.updateLevelInfo();
            }
        });
        
        // 中央面板点击进入关卡
        this.centerPanel.on('pointerdown', () => {
            this.startLevel(this.currentLevelIndex);
        });
        
        // 返回按钮
        this.backButton.on('pointerdown', () => {
            this.scene.start('Homepage');
        });
        
        // 图鉴按钮
        this.unitLibButton.setInteractive();
            this.unitLibButton.on('pointerdown', () => {
            this.scene.launch('CodexScene', { origin: 'LevelSelection' });
            this.scene.pause();
        });
    }

    /**
     * 开始关卡
     */
    private startLevel(levelIndex: number): void {
        const level = this.levels[levelIndex];
        if (level && level.unlocked) {
            this.scene.start('GameScene', { 
                levelId: level.id,
                levelData: level 
            });
        }
    }
}
