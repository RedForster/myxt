import { Scene } from 'phaser';

/**
 * 游戏首页场景
 * 显示游戏名称、加载进度条和开始按钮
 */
export class Homepage extends Scene {
    private gameTitle: Phaser.GameObjects.Text;
    private loadingText: Phaser.GameObjects.Text;
    private progressBar: Phaser.GameObjects.Graphics;
    private progressBox: Phaser.GameObjects.Graphics;
    private startButton: Phaser.GameObjects.Container;
    private startButtonBg: Phaser.GameObjects.Rectangle;
    private startButtonText: Phaser.GameObjects.Text;
    private loadingComplete: boolean = false;

    constructor() {
        super('Homepage');
    }

    init() {
        const { width, height } = this.scale;
        
        // 创建游戏标题
        this.gameTitle = this.add.text(width / 2, height / 3, '免疫塔防', {
            fontSize: '96px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#3498db',
            strokeThickness: 4
        }).setOrigin(0.5);

        // 添加发光效果
        this.gameTitle.setShadow(2, 2, '#3498db', 10, true, true);

        // 创建副标题
        this.add.text(width / 2, height / 3 + 80, 'Immune Tower Defense', {
            fontSize: '36px',
            color: '#bdc3c7',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // 创建加载文本
        this.loadingText = this.add.text(width / 2, height / 2 + 50, '正在加载游戏资源...', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 创建进度条背景
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x2c3e50, 0.8);
        this.progressBox.fillRect(width / 2 - 200, height / 2 + 100, 400, 30);
        this.progressBox.lineStyle(2, 0x3498db, 1);
        this.progressBox.strokeRect(width / 2 - 200, height / 2 + 100, 400, 30);

        // 创建进度条
        this.progressBar = this.add.graphics();

        // 创建开始按钮（初始隐藏）
        this.startButton = this.add.container(width / 2, height / 2 + 200);
        this.startButton.setVisible(false);

        this.startButtonBg = this.add.rectangle(0, 0, 200, 60, 0x27ae60);
        this.startButtonBg.setStrokeStyle(3, 0x2ecc71);
        this.startButton.add(this.startButtonBg);

        this.startButtonText = this.add.text(0, 0, '开始游戏', {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.startButton.add(this.startButtonText);

        // 监听加载进度
        this.load.on('progress', (value: number) => {
            this.updateProgressBar(value);
        });

        this.load.on('fileprogress', (file: any) => {
            this.loadingText.setText(`正在加载: ${file.key}`);
        });

        this.load.on('complete', () => {
            this.onLoadingComplete();
        });

        // 开始加载资源
        this.loadAssets();
    }

    preload() {
        // 资源加载在 init() 中完成
    }

    /**
     * 加载游戏资源
     */
    private loadAssets(): void {
        // 加载背景图片
        this.load.image('homepage_bg', 'assets/bg.png');
        this.load.image('level_preview_1', 'assets/stage/stage1.png');
        this.load.image('level_preview_2', 'assets/stage/background.png');
        this.load.image('level_preview_3', 'assets/stage/barrier.png');
        
        // 加载UI图标
        this.load.image('icon_arrow_left', 'assets/UI/stop.png');
        this.load.image('icon_arrow_right', 'assets/UI/stop.png');
        
        // 加载现有游戏资源
        this.load.image('background', 'assets/bg.png');
        this.load.image('playerhealth', 'assets/UI/playerhealth.png');
        this.load.image('resourceUI', 'assets/UI/resourceUI.png');
        
        // 加载音效（如果有）
        // this.load.audio('bgm_home', ['assets/audio/home_bgm.mp3']);
        // this.load.audio('sfx_click', ['assets/audio/click.mp3']);
    }

    /**
     * 更新进度条
     */
    private updateProgressBar(value: number): void {
        this.progressBar.clear();
        this.progressBar.fillStyle(0x3498db, 1);
        this.progressBar.fillRect(
            this.scale.width / 2 - 195, 
            this.scale.height / 2 + 105, 
            390 * value, 
            20
        );
    }

    /**
     * 加载完成回调
     */
    private onLoadingComplete(): void {
        this.loadingComplete = true;
        this.loadingText.setText('加载完成！');
        
        // 显示开始按钮
        this.showStartButton();
    }

    /**
     * 显示开始按钮
     */
    private showStartButton(): void {
        this.startButton.setVisible(true);
        
        // 添加按钮动画
        this.tweens.add({
            targets: this.startButton,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // 添加按钮交互
        this.startButton.setInteractive(new Phaser.Geom.Rectangle(-100, -30, 200, 60), Phaser.Geom.Rectangle.Contains);
        
        this.startButton.on('pointerover', () => {
            this.startButtonBg.setFillStyle(0x2ecc71);
            this.startButtonText.setScale(1.1);
            this.game.canvas.style.cursor = 'pointer';
        });

        this.startButton.on('pointerout', () => {
            this.startButtonBg.setFillStyle(0x27ae60);
            this.startButtonText.setScale(1);
            this.game.canvas.style.cursor = 'default';
        });

        this.startButton.on('pointerdown', () => {
            this.startButtonBg.setFillStyle(0x1e8449);
            this.startButtonText.setScale(0.95);
            
            // 播放点击音效
            // this.sound.play('sfx_click');
        });

        this.startButton.on('pointerup', () => {
            this.startButtonBg.setFillStyle(0x2ecc71);
            this.startButtonText.setScale(1.1);
            
            // 切换到关卡选择场景
            this.scene.start('LevelSelection');
        });
    }

    create() {
        // 添加背景动画
        this.createBackgroundAnimation();
    }

    /**
     * 创建背景动画
     */
    private createBackgroundAnimation(): void {
        // 创建简单的背景动画效果
        this.tweens.add({
            targets: this.gameTitle,
            y: this.scale.height / 3 + 10,
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
}