import { Scene } from 'phaser';
import { LevelSelectionConfig, LevelSelectionManager } from '../config/LevelSelectionConfig';

/**
 * 关卡选择场景
 * 支持左右滑动查看关卡，每个关卡显示名称、预览图、描述和开始按钮
 */
export class LevelSelection extends Scene {
    private levelManager: LevelSelectionManager;
    private levels: LevelSelectionConfig[] = [];
    private currentLevelIndex: number = 0;
    
    // UI 元素
    private pageTitle: Phaser.GameObjects.Text;
    private levelCards: Phaser.GameObjects.Container[] = [];
    private leftArrow: Phaser.GameObjects.Container;
    private rightArrow: Phaser.GameObjects.Container;
    private backButton: Phaser.GameObjects.Container;
    
    // 滑动相关
    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragVelocity: number = 0;
    private cardSpacing: number = 300; // 卡片间距
    private centerX: number = 0;
    private cardWidth: number = 280;
    private cardHeight: number = 380;
    
    // 动画相关
    private cardTweens: Phaser.Tweens.Tween[] = [];

    constructor() {
        super('LevelSelection');
        this.levelManager = LevelSelectionManager.getInstance();
    }

    init() {
        const { width, height } = this.scale;
        this.centerX = width / 2;
        
        // 根据屏幕尺寸调整卡片大小和间距
        this.adjustLayoutForScreenSize();
        
        // 获取关卡数据
        this.levels = this.levelManager.getAllLevels();
        
        // 创建UI
        this.createUI();
        
        // 创建关卡卡片
        this.createLevelCards();
        
        // 设置初始位置
        this.updateCardPositions();
        
        // 设置输入处理
        this.setupInput();
    }

    create() {
        // 添加背景
        this.createBackground();
        
        // 添加粒子效果
        this.createParticleEffect();
    }

    /**
     * 创建UI元素
     */
    private createUI(): void {
        const { width, height } = this.scale;
        
        // 页面标题 - 根据屏幕尺寸调整字体大小
        const titleFontSize = width < 1200 ? '36px' : width < 1600 ? '42px' : '48px';
        this.pageTitle = this.add.text(width / 2, 60, '选择关卡', {
            fontSize: titleFontSize,
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#3498db',
            strokeThickness: 2
        }).setOrigin(0.5);

        // 左箭头
        this.leftArrow = this.createArrow(width / 2 - this.cardSpacing/2 + 20, height / 2, 'left');
        this.leftArrow.setVisible(this.currentLevelIndex > 0);
        
        // 右箭头
        this.rightArrow = this.createArrow(width / 2 + this.cardSpacing/2 - 20, height / 2, 'right');
        this.rightArrow.setVisible(this.currentLevelIndex < this.levels.length - 1);
        
        // 返回按钮 - 根据屏幕尺寸调整位置
        const backButtonX = Math.max(80, width * 0.05);
        const backButtonY = height - 60;
        this.backButton = this.createBackButton(backButtonX, backButtonY);
    }

    /**
     * 创建箭头按钮
     */
    private createArrow(x: number, y: number, direction: 'left' | 'right'): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        // 创建箭头背景
        const bg = this.add.circle(0, 0, 30, 0x3498db, 0.8);
        bg.setStrokeStyle(3, 0x2980b9);
        container.add(bg);
        
        // 创建箭头
        const arrow = this.add.triangle(
            0, 0,
            direction === 'left' ? -10 : 10, -10,
            direction === 'left' ? -10 : 10, 10,
            direction === 'left' ? 10 : -10, 0,
            0xffffff
        );
        container.add(arrow);
        
        // 设置交互
        container.setInteractive(new Phaser.Geom.Circle(0, 0, 30), Phaser.Geom.Circle.Contains);
        
        container.on('pointerover', () => {
            bg.setFillStyle(0x2980b9, 0.9);
            container.setScale(1.1);
            this.game.canvas.style.cursor = 'pointer';
        });
        
        container.on('pointerout', () => {
            bg.setFillStyle(0x3498db, 0.8);
            container.setScale(1);
            this.game.canvas.style.cursor = 'default';
        });
        
        container.on('pointerdown', () => {
            this.onArrowClick(direction);
        });
        
        return container;
    }

    /**
     * 创建返回按钮
     */
    private createBackButton(x: number, y: number): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        // 创建按钮背景
        const bg = this.add.rectangle(0, 0, 120, 50, 0xe74c3c, 0.8);
        bg.setStrokeStyle(2, 0xc0392b);
        container.add(bg);
        
        // 创建按钮文本
        const text = this.add.text(0, 0, '返回', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(text);
        
        // 设置交互
        container.setInteractive(new Phaser.Geom.Rectangle(-60, -25, 120, 50), Phaser.Geom.Rectangle.Contains);
        
        container.on('pointerover', () => {
            bg.setFillStyle(0xc0392b, 0.9);
            container.setScale(1.05);
            this.game.canvas.style.cursor = 'pointer';
        });
        
        container.on('pointerout', () => {
            bg.setFillStyle(0xe74c3c, 0.8);
            container.setScale(1);
            this.game.canvas.style.cursor = 'default';
        });
        
        container.on('pointerup', () => {
            this.scene.start('Homepage');
        });
        
        return container;
    }

    /**
     * 创建关卡卡片
     */
    private createLevelCards(): void {
        this.levelCards.forEach(card => card.destroy());
        this.levelCards = [];
        
        this.levels.forEach((level, index) => {
            const card = this.createLevelCard(level, index);
            this.levelCards.push(card);
            this.add.existing(card);
        });
    }

    /**
     * 创建单个关卡卡片
     */
    private createLevelCard(level: LevelSelectionConfig, index: number): Phaser.GameObjects.Container {
        const card = this.add.container(0, 0);
        
        const { width } = this.scale;
        const cardWidth = this.cardWidth;
        const cardHeight = this.cardHeight;
        
        // 根据卡片大小调整字体
        const nameFontSize = cardWidth < 260 ? '24px' : cardWidth < 280 ? '28px' : '32px';
        const titleFontSize = cardWidth < 260 ? '18px' : cardWidth < 280 ? '20px' : '24px';
        const descFontSize = cardWidth < 260 ? '12px' : cardWidth < 280 ? '14px' : '16px';
        
        // 卡片背景
        const cardBg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x2c3e50, 0.9);
        cardBg.setStrokeStyle(3, level.unlocked ? 0x3498db : 0x7f8c8d);
        card.add(cardBg);
        
        // 难度标识
        const difficultyColor = {
            easy: 0x27ae60,
            medium: 0xf39c12,
            hard: 0xe74c3c
        }[level.difficulty];
        
        const difficultyBadge = this.add.rectangle(-cardWidth/2 + 50, -cardHeight/2 + 25, 80, 30, difficultyColor, 0.8);
        card.add(difficultyBadge);
        
        const difficultyText = this.add.text(-cardWidth/2 + 50, -cardHeight/2 + 25, level.difficulty.toUpperCase(), {
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        card.add(difficultyText);
        
        // 关卡名称
        const levelName = this.add.text(0, -cardHeight/2 + 70, level.name, {
            fontSize: nameFontSize,
            color: level.unlocked ? '#ffffff' : '#7f8c8d',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        card.add(levelName);
        
        // 关卡标题
        const levelTitle = this.add.text(0, -cardHeight/2 + 100, level.title, {
            fontSize: titleFontSize,
            color: level.unlocked ? '#bdc3c7' : '#95a5a6'
        }).setOrigin(0.5);
        card.add(levelTitle);
        
        // 预览图（占位符）- 根据卡片大小调整
        const previewWidth = cardWidth - 40;
        const previewHeight = cardHeight * 0.2; // 减小预览图高度
        const previewPlaceholder = this.add.rectangle(0, -cardHeight/2 + 180, previewWidth, previewHeight, 0x34495e, 0.5);
        previewPlaceholder.setStrokeStyle(2, 0x7f8c8d);
        card.add(previewPlaceholder);
        
        const previewText = this.add.text(0, -cardHeight/2 + 180, '预览图', {
            fontSize: '16px',
            color: '#7f8c8d'
        }).setOrigin(0.5);
        card.add(previewText);
        
        // 关卡描述 - 使用正常字体大小，支持多行显示
        const maxDescWidth = cardWidth - 40; // 适当边距
        const description = this.add.text(0, -cardHeight/2 + 290, level.description, {
            fontSize: descFontSize, // 使用正常字体大小
            color: level.unlocked ? '#bdc3c7' : '#95a5a6',
            wordWrap: { width: maxDescWidth , useAdvancedWrap: true },
            align: 'center',
            lineSpacing: 4, // 增加行间距
            maxLines: 5 // 允许最多5行
        }).setOrigin(0.5);
        card.add(description);
        
        // 完成状态
        if (level.completed) {
            const completedBadge = this.add.text(cardWidth/2 - 60, -cardHeight/2 + 40, '✓ 已完成', {
                fontSize: '16px',
                color: '#27ae60',
                fontStyle: 'bold'
            }).setOrigin(1, 0.5);
            card.add(completedBadge);
        }
        
        // 开始按钮
        if (level.unlocked) {
            const startButton = this.createStartButton(0, cardHeight/2 - 50, level);
            card.add(startButton);
        } else {
            const lockedText = this.add.text(0, cardHeight/2 - 50, '🔒 未解锁', {
                fontSize: '18px',
                color: '#7f8c8d',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            card.add(lockedText);
        }
        
        // 设置卡片透明度
        if (!level.unlocked) {
            card.setAlpha(0.6);
        }
        
        return card;
    }

    /**
     * 创建开始按钮
     */
    private createStartButton(x: number, y: number, level: LevelSelectionConfig): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        // 按钮背景
        const bg = this.add.rectangle(0, 0, 120, 40, 0x27ae60, 0.8);
        bg.setStrokeStyle(2, 0x2ecc71);
        container.add(bg);
        
        // 按钮文本
        const text = this.add.text(0, 0, level.completed ? '重新挑战' : '开始', {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(text);
        
        // 设置交互
        container.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
        
        container.on('pointerover', () => {
            bg.setFillStyle(0x2ecc71, 0.9);
            container.setScale(1.05);
            this.game.canvas.style.cursor = 'pointer';
        });
        
        container.on('pointerout', () => {
            bg.setFillStyle(0x27ae60, 0.8);
            container.setScale(1);
            this.game.canvas.style.cursor = 'default';
        });
        
        container.on('pointerup', () => {
            this.startLevel(level);
        });
        
        return container;
    }

    /**
     * 开始关卡
     */
    private startLevel(level: LevelSelectionConfig): void {
        // 设置当前关卡
        this.levelManager.setCurrentLevel(level);
        
        // 切换到游戏场景
        this.scene.start('GameScene', { levelId: level.id });
    }

    /**
     * 更新卡片位置
     */
    private updateCardPositions(): void {
        // 清除之前的动画
        this.cardTweens.forEach(tween => tween.stop());
        this.cardTweens = [];
        
        this.levelCards.forEach((card, index) => {
            const targetX = this.centerX + (index - this.currentLevelIndex) * this.cardSpacing;
            const targetY = this.scale.height / 2;
            
            // 计算缩放和透明度
            const distance = Math.abs(index - this.currentLevelIndex);
            const scale = Math.max(0.7, 1 - distance * 0.15);
            const alpha = Math.max(0.4, 1 - distance * 0.2);
            
            // 创建新的动画
            const tween = this.tweens.add({
                targets: card,
                x: targetX,
                y: targetY,
                scaleX: scale,
                scaleY: scale,
                alpha: alpha,
                duration: 300,
                ease: 'Power2.easeOut'
            });
            
            this.cardTweens.push(tween);
            
            // 设置层级
            card.setDepth(this.levelCards.length - distance);
        });
        
        // 更新箭头显示
        this.leftArrow.setVisible(this.currentLevelIndex > 0);
        this.rightArrow.setVisible(this.currentLevelIndex < this.levels.length - 1);
    }

    /**
     * 根据屏幕尺寸调整布局
     */
    private adjustLayoutForScreenSize(): void {
        const { width, height } = this.scale;
        
        // 根据屏幕宽度调整卡片大小和间距，增加高度以容纳多行文本
        if (width < 1200) {
            this.cardWidth = 240;
            this.cardHeight = 360; // 增加高度
            this.cardSpacing = 250;
        } else if (width < 1600) {
            this.cardWidth = 260;
            this.cardHeight = 400; // 增加高度
            this.cardSpacing = 280;
        } else {
            this.cardWidth = 280;
            this.cardHeight = 440; // 增加高度
            this.cardSpacing = 300;
        }
    }

    /**
     * 设置输入处理
     */
    private setupInput(): void {
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.isDragging = true;
            this.dragStartX = pointer.x;
            this.dragVelocity = 0;
        });
        
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDragging) {
                const deltaX = pointer.x - this.dragStartX;
                this.dragVelocity = deltaX * 0.5;
                
                // 实时更新卡片位置
                this.levelCards.forEach((card, index) => {
                    const baseX = this.centerX + (index - this.currentLevelIndex) * this.cardSpacing;
                    card.x = baseX + deltaX * 0.5;
                });
            }
        });
        
        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (this.isDragging) {
                this.isDragging = false;
                this.handleSwipe();
            }
        });
        
        // 键盘控制
        this.input.keyboard.on('keydown-LEFT', () => {
            this.onArrowClick('left');
        });
        
        this.input.keyboard.on('keydown-RIGHT', () => {
            this.onArrowClick('right');
        });
    }

    /**
     * 处理滑动
     */
    private handleSwipe(): void {
        const threshold = 50; // 滑动阈值
        
        if (Math.abs(this.dragVelocity) > threshold) {
            if (this.dragVelocity > 0 && this.currentLevelIndex > 0) {
                this.currentLevelIndex--;
            } else if (this.dragVelocity < 0 && this.currentLevelIndex < this.levels.length - 1) {
                this.currentLevelIndex++;
            }
        }
        
        this.updateCardPositions();
    }

    /**
     * 处理箭头点击
     */
    private onArrowClick(direction: 'left' | 'right'): void {
        if (direction === 'left' && this.currentLevelIndex > 0) {
            this.currentLevelIndex--;
        } else if (direction === 'right' && this.currentLevelIndex < this.levels.length - 1) {
            this.currentLevelIndex++;
        }
        
        this.updateCardPositions();
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        const { width, height } = this.scale;
        
        // 创建简单背景
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a1a, 1);
        bg.fillRect(0, 0, width, height);
        
        // 添加渐变效果
        const gradient = this.add.graphics();
        for (let i = 0; i < height; i++) {
            const alpha = i / height * 0.3;
            gradient.fillStyle(0x3498db, alpha);
            gradient.fillRect(0, i, width, 1);
        }
    }

    /**
     * 创建背景动画效果
     */
    private createParticleEffect(): void {
        // 创建简单的星星效果
        const stars = this.add.group();
        
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.scale.width;
            const y = Math.random() * this.scale.height;
            const star = this.add.circle(x, y, 1, 0xffffff, 0.5);
            stars.add(star);
            
            // 添加闪烁动画
            this.tweens.add({
                targets: star,
                alpha: { from: 0.2, to: 0.8 },
                duration: 1000 + Math.random() * 2000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }
    }
}