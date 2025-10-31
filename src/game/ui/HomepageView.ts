import { Scene } from 'phaser';

type HomepageViewOptions = {
    showLoading?: boolean;
};

type HomepageReadyOptions = {
    message?: string;
    animateLoadingHide?: boolean;
};

export class HomepageView {
    private readonly scene: Scene;
    private background?: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
    private gameTitle?: Phaser.GameObjects.Text;
    private loadingText?: Phaser.GameObjects.Text;
    private progressBar?: Phaser.GameObjects.Graphics;
    private progressBox?: Phaser.GameObjects.Graphics;
    private startButton?: Phaser.GameObjects.Container;
    private startButtonText?: Phaser.GameObjects.Text;
    private startButtonHitArea?: Phaser.GameObjects.Zone;
    private startButtonTween?: Phaser.Tweens.Tween;
    private loadingVisible = false;
    private built = false;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    build(options: HomepageViewOptions = {}): void {
        if (this.built) {
            return;
        }

        this.built = true;
        const { width, height } = this.scene.scale;
        const showLoading = options.showLoading !== false;

        this.background = this.createBackground(width, height);

        this.gameTitle = this.scene.add.text(width / 2, height / 3 + 80, '免疫系统', {
            fontSize: '96px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#385EF3',
            strokeThickness: 15,
            fontFamily: '"Alibaba PuHuiTi", Arial, "Microsoft YaHei", "SimHei", sans-serif',
            padding: { x: 4, y: 8 }
        }).setOrigin(0.5);

        this.gameTitle.setShadow(2, 2, '#3498db', 10, true, true);

    this.scene.add.text(width / 2, height / 3 + 140, 'Tower Defense', {
            fontSize: '36px',
            color: '#bdc3c7',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        this.loadingText = this.scene.add.text(width / 2, height / 2 + 300, '正在加载游戏资源...', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.progressBox = this.scene.add.graphics();
        this.progressBox.fillStyle(0x2c3e50, 0.8);
        this.progressBox.fillRect(width / 2 - 200, height / 2 + 250, 400, 30);
        this.progressBox.lineStyle(2, 0x3498db, 1);
        this.progressBox.strokeRect(width / 2 - 200, height / 2 + 250, 400, 30);

        this.progressBar = this.scene.add.graphics();

        this.startButton = this.scene.add.container(width / 2, height / 2 + 400);
        this.startButton.setVisible(false);

        this.scene.tweens.add({
            targets: this.gameTitle,
            y: height / 3 + 10,
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        this.setLoadingVisible(showLoading, false);
    }

    updateProgress(value: number): void {
        if (!this.progressBar || !this.loadingVisible) {
            return;
        }

        this.progressBar.clear();
        this.progressBar.fillStyle(0xFAE806, 1);
        this.progressBar.fillRect(
            this.scene.scale.width / 2 - 195,
            this.scene.scale.height / 2 + 255,
            390 * value,
            20
        );
    }

    setLoadingFile(key?: string): void {
        if (!this.loadingText || !this.loadingVisible) {
            return;
        }

        const label = key ? `正在加载: ${key}` : '正在加载游戏资源...';
        this.loadingText.setText(label);
    }

    showReady(onStart: () => void, options: HomepageReadyOptions = {}): void {
        if (!this.startButton) {
            return;
        }

        const animateHide = options.animateLoadingHide !== false;
        const message = options.message ?? '加载完成!';

        if (this.loadingText) {
            this.loadingText.setText(message);
        }

        if (this.loadingVisible) {
            this.setLoadingVisible(false, animateHide);
        }

        this.refreshBackground();
        this.renderStartButton();
        this.attachStartButtonHandlers(onStart);
    }

    setLoadingVisible(visible: boolean, animate: boolean): void {
        this.loadingVisible = visible;

    const targets = this.getLoadingObjects();
        if (targets.length === 0) {
            return;
        }

        if (animate) {
            this.scene.tweens.add({
                targets,
                alpha: visible ? 1 : 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    targets.forEach(obj => {
                        obj.setVisible(visible);
                        obj.setAlpha(visible ? 1 : 0);
                    });
                }
            });
        } else {
            targets.forEach(obj => {
                obj.setVisible(visible);
                obj.setAlpha(visible ? 1 : 0);
            });
        }
    }

    private renderStartButton(): void {
        if (!this.startButton) {
            return;
        }

        if (this.startButtonTween) {
            this.startButtonTween.stop();
            this.startButtonTween.destroy();
            this.startButtonTween = undefined;
        }

        this.startButton.removeAll(true);
        this.startButton.setVisible(true);
        this.startButton.setScale(1);
        this.startButtonText = undefined;
    this.destroyStartButtonHitArea();

        const hitArea = this.addButtonBackground();

        this.startButtonText = this.createStartButtonLabel();
        this.startButton.add(this.startButtonText);

        this.configureStartButtonHitArea(hitArea.width, hitArea.height);

        this.startButtonTween = this.scene.tweens.add({
            targets: this.startButton,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    private attachStartButtonHandlers(onStart: () => void): void {
        const button = this.startButton;
        const text = this.startButtonText;

        const hitArea = this.startButtonHitArea;
        if (!button || !text || !hitArea) {
            return;
        }
        hitArea.removeAllListeners();
        hitArea.on('pointerover', () => {
            text.setScale(1.1);
            button.setScale(1.05);
            this.scene.game.canvas.style.cursor = 'pointer';
        });
        hitArea.on('pointerout', () => {
            text.setScale(1);
            button.setScale(1);
            this.scene.game.canvas.style.cursor = 'default';
        });
        hitArea.on('pointerdown', () => {
            text.setScale(0.95);
            button.setScale(0.95);
        });
        hitArea.on('pointerup', () => {
            text.setScale(1.1);
            button.setScale(1.05);
            this.scene.game.canvas.style.cursor = 'default';
            onStart();
        });
    }

    private refreshBackground(): void {
        const { width, height } = this.scene.scale;

        if (!this.scene.textures.exists('homepage_bg')) {
            return;
        }

        if (this.background) {
            this.background.destroy();
        }

        this.background = this.createBackground(width, height);
    }

    private createBackground(width: number, height: number): Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle {
        if (this.scene.textures.exists('homepage_bg')) {
            const bg = this.scene.add.image(width / 2, height / 2, 'homepage_bg');
            const scaleX = width / bg.width;
            const scaleY = height / bg.height;
            const scale = Math.max(scaleX, scaleY);
            bg.setScale(scale);
            bg.setDepth(-1);
            return bg;
        }

        const placeholder = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);
        placeholder.setDepth(-1);
        return placeholder;
    }

    private getLoadingObjects(): Array<Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Alpha & Phaser.GameObjects.Components.Visible> {
        const objects: Array<Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Alpha & Phaser.GameObjects.Components.Visible> = [];

        if (this.loadingText) {
            objects.push(this.loadingText as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Alpha & Phaser.GameObjects.Components.Visible);
        }

        if (this.progressBar) {
            objects.push(this.progressBar as unknown as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Alpha & Phaser.GameObjects.Components.Visible);
        }

        if (this.progressBox) {
            objects.push(this.progressBox as unknown as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Alpha & Phaser.GameObjects.Components.Visible);
        }

        return objects;
    }

    private addButtonBackground(): { width: number; height: number } {
        if (!this.startButton) {
            return { width: 0, height: 0 };
        }

        if (this.scene.textures.exists('start_btn')) {
            const texture = this.scene.textures.get('start_btn');
            const width = texture.source[0].width * 0.5;
            const height = texture.source[0].height * 0.5;

            const image = this.scene.add.image(0, 0, 'start_btn');
            image.setScale(0.5);
            this.startButton.add(image);

            return { width, height };
        }

        const width = 200;
        const height = 60;
        const rect = this.scene.add.rectangle(0, 0, width, height, 0xFFC600);
        rect.setStrokeStyle(3, 0x2ecc71);
        this.startButton.add(rect);

        return { width, height };
    }

    private createStartButtonLabel(): Phaser.GameObjects.Text {
        return this.scene.add.text(0, 0, '开始游戏', {
            fontSize: '36px',
            color: '#872C12',
            fontStyle: 'bold',
            fontFamily: 'Arial, "Alibaba PuHuiTi", "Microsoft YaHei", "SimHei", sans-serif',
            padding: { x: 4, y: 8 }
        }).setOrigin(0.5);
    }

    private configureStartButtonHitArea(width: number, height: number): void {
        if (!this.startButton) {
            return;
        }

        this.destroyStartButtonHitArea();
        this.startButton.setSize(width, height);
        const zone = this.scene.add.zone(0, 0, width, height);
        zone.setOrigin(0.5, 0.5);
        zone.setInteractive({ useHandCursor: false });
        this.startButton.add(zone);
        this.startButtonHitArea = zone;
    }

    private destroyStartButtonHitArea(): void {
        if (this.startButtonHitArea) {
            this.startButtonHitArea.destroy();
            this.startButtonHitArea = undefined;
        }
    }
}
