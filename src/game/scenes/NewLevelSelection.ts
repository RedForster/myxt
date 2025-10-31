import { Scene } from 'phaser';
import { LevelSelectionConfig, LevelSelectionManager } from '../config/LevelSelectionConfig';

/**
 * 关卡选择场景
 * 按照新UI设计，用户通过点击上一关下一关来切换中间的关卡信息，点击中间任意位置进入关卡
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
        
        // 创建关卡卡片背景
        this.levelCardBg = this.add.image(centerX, centerY, 'levelcard_bg');
        this.levelCardBg.setDisplaySize(1624 * (width / 2048), 985 * (height / 1536));
        
        // 创建标题背景
        this.titleBg = this.add.image(centerX, centerY - 200, 'level_title_bg');
        this.titleBg.setDisplaySize(701 * (width / 2048), 104 * (height / 1536));
        
        // 创建标题文字
        this.titlePart1 = this.add.text(centerX - 100, centerY - 200, '第一关', {
            fontSize: '57px',
            color: '#00AEFF',
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.titlePart1.setShadow(0, 5, '#FFFFFF', 2, false, true);
        
        this.titlePart2 = this.add.text(centerX + 100, centerY - 200, '普通病菌', {
            fontSize: '57px',
            color: '#1F32FF',
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.titlePart2.setShadow(0, 6, '#FFFFFF', 1, false, true);
        
        // 创建关卡预览图
        this.levelPreviewImage = this.add.image(centerX, centerY - 50, 'level_preview');
        this.levelPreviewImage.setDisplaySize(1449 * (width / 2048), 498 * (height / 1536));
        
        // 创建信息背景
        this.infoBg = this.add.image(centerX, centerY + 150, 'info_bg');
        this.infoBg.setDisplaySize(812 * (width / 2048), 86 * (height / 1536));
        
        // 创建知识点文字
        this.knowledgeText = this.add.text(centerX - 150, centerY + 150, '知识点：demo1', {
            fontSize: '36px',
            color: '#000000',
            fontFamily: 'Inter, Arial, sans-serif'
        }).setOrigin(0, 0.5);
        
        // 创建描述文字
        this.descriptionText = this.add.text(centerX - 200, centerY + 200, '关于描述：人体的demo2相比demo1更加脆弱', {
            fontSize: '28px',
            color: '#434343',
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontStyle: 'bold',
            wordWrap: { width: 799 * (width / 2048) }
        }).setOrigin(0, 0.5);
        
        this.enemyText = this.add.text(centerX - 200, centerY + 230, '可能出现的敌人：普通病菌', {
            fontSize: '28px',
            color: '#434343',
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        // 创建左右切换按钮
        this.leftButton = this.add.image(centerX - 800, centerY, 'previous_level');
        this.leftButton.setDisplaySize(85.27 * (width / 2048), 104.41 * (height / 1536));
        
        this.rightButton = this.add.image(centerX + 800, centerY, 'next_level');
        this.rightButton.setDisplaySize(85.27 * (width / 2048), 104.41 * (height / 1536));
        
        // 创建图鉴按钮
        this.unitLibButton = this.add.image(centerX - 650, centerY + 350, 'unit_lib');
        this.unitLibButton.setDisplaySize(270 * (width / 2048), 208 * (height / 1536));
        
        // 创建返回按钮
        this.createBackButton(centerX + 500, centerY + 350);
        
        // 创建中央交互区域
        this.centerPanel = this.add.zone(centerX, centerY, 1624 * (width / 2048), 985 * (height / 1536));
        this.centerPanel.setInteractive();
    }

    /**
     * 创建返回按钮
     */
    private createBackButton(x: number, y: number): void {
        const { width, height } = this.scale;
        
        this.backButton = this.add.container(x, y);
        
        // 按钮背景
        const buttonBg = this.add.image(0, 0, 'button');
        buttonBg.setDisplaySize(236 * (width / 2048), 109 * (height / 1536));
        this.backButton.add(buttonBg);
        
        // 按钮文字
        const buttonText = this.add.text(0, 0, '返回', {
            fontSize: '30px',
            color: '#323232',
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.backButton.add(buttonText);
        
        // 设置交互
        this.backButton.setSize(236 * (width / 2048), 109 * (height / 1536));
        this.backButton.setInteractive();
    }

    /**
     * 更新关卡信息
     */
    private updateLevelInfo(): void {
        if (this.levels.length === 0) return;
        
        const currentLevel = this.levels[this.currentLevelIndex];
        
        // 更新标题
        this.titlePart1.setText(`第${this.currentLevelIndex + 1}关`);
        this.titlePart2.setText(currentLevel.name || '普通病菌');
        
        // 更新知识点 - 使用description字段或默认值
        this.knowledgeText.setText(`知识点：${currentLevel.description || 'demo1'}`);
        
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
            this.scene.start('CodexScene', { origin: 'NewLevelSelection' });
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
