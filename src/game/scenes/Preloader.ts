import { Scene } from 'phaser';
import { UNITS_CONFIG } from '../config/UnitsConfig';

/**
 * 预加载场景
 * 负责加载游戏所需的所有资源
 */
export class Preloader extends Scene {
    private loadingText: Phaser.GameObjects.Text;
    private progressBar: Phaser.GameObjects.Graphics;
    private progressBox: Phaser.GameObjects.Graphics;

    constructor() {
        super('Preloader');
    }

    init() {
        const { width, height } = this.scale;
        
        // 创建加载界面
        this.add.text(width / 2, height / 2 - 100, '免疫塔防', {
            fontSize: '72px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.loadingText = this.add.text(width / 2, height / 2 + 50, '正在加载资源...', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 创建进度条
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x222222, 0.8);
        this.progressBox.fillRect(width / 2 - 200, height / 2 + 100, 400, 50);

        this.progressBar = this.add.graphics();

        // 监听加载进度
        this.load.on('progress', (value: number) => {
            this.progressBar.clear();
            this.progressBar.fillStyle(0x3498db, 1);
            this.progressBar.fillRect(width / 2 - 190, height / 2 + 110, 380 * value, 30);
        });

        this.load.on('fileprogress', (file: any) => {
            this.loadingText.setText(`正在加载: ${file.key}`);
        });

        this.load.on('complete', () => {
            this.loadingText.setText('加载完成!');
        });
    }

    preload() {
        // 创建程序化生成的纹理
        this.createTextures();
    }

    /**
     * 创建程序化生成的纹理
     */
    private createTextures(): void {
        const createTexture = (name: string, width: number, height: number, drawCallback: (graphics: Phaser.GameObjects.Graphics) => void) => {
            const graphics = this.make.graphics({ x: 0, y: 0 }, false);
            drawCallback(graphics);
            graphics.generateTexture(name, width, height);
            graphics.destroy();
        };

        const createEmojiTexture = (name: string, width: number, height: number, emoji: string, bgColor: number = 0x000000) => {
            // 创建一个简单的纹理，使用形状来代表不同的emoji
            createTexture(name, width, height, (graphics) => {
                // 创建背景圆圈
                graphics.fillStyle(bgColor, 0.3);
                graphics.fillCircle(width/2, height/2, Math.min(width, height)/2 - 2);
                
                // 根据emoji类型绘制不同的形状
                graphics.fillStyle(0xffffff, 1);
                const radius = Math.min(width, height) * 0.3;
                
                if (emoji === '🩸') {
                    // 血滴形状
                    graphics.fillCircle(width/2, height/2 - radius/2, radius);
                    graphics.fillTriangle(
                        width/2 - radius, height/2 + radius/2,
                        width/2 + radius, height/2 + radius/2,
                        width/2, height/2 + radius
                    );
                } else if (emoji === '🔬') {
                    // 显微镜形状
                    graphics.fillRect(width/2 - radius/2, height/2 - radius, radius, radius * 2);
                    graphics.fillCircle(width/2, height/2 - radius, radius/2);
                } else if (emoji === '🛡️') {
                    // 盾牌形状
                    graphics.fillTriangle(
                        width/2, height/2 - radius,
                        width/2 - radius, height/2 + radius/2,
                        width/2 + radius, height/2 + radius/2
                    );
                } else if (emoji === '🦠') {
                    // 病毒形状
                    graphics.fillCircle(width/2, height/2, radius);
                    graphics.fillStyle(0x000000, 1);
                    graphics.fillCircle(width/2 - radius/3, height/2 - radius/3, radius/4);
                    graphics.fillCircle(width/2 + radius/3, height/2 - radius/3, radius/4);
                } else if (emoji === '❤️') {
                    // 心形
                    graphics.fillCircle(width/2 - radius/2, height/2 - radius/2, radius/2);
                    graphics.fillCircle(width/2 + radius/2, height/2 - radius/2, radius/2);
                    graphics.fillTriangle(
                        width/2 - radius, height/2,
                        width/2 + radius, height/2,
                        width/2, height/2 + radius
                    );
                } else if (emoji === '🤧') {
                    // 喷嚏形状
                    graphics.fillCircle(width/2, height/2, radius);
                    graphics.fillStyle(0x000000, 1);
                    graphics.fillRect(width/2 - radius/2, height/2 - radius/4, radius, radius/2);
                } else {
                    // 默认圆形
                    graphics.fillCircle(width/2, height/2, radius);
                }
            });
        };

        // 创建塔的纹理 - 从配置中读取图标设置
        Object.values(UNITS_CONFIG.towers).forEach(tower => {
            createEmojiTexture(
                tower.texture, 
                tower.icon.size, 
                tower.icon.size, 
                tower.icon.emoji, 
                tower.icon.bgColor
            );
        });

        // 创建敌人纹理 - 从配置中读取图标设置
        Object.values(UNITS_CONFIG.enemies).forEach(enemy => {
            createEmojiTexture(
                enemy.texture, 
                enemy.icon.size, 
                enemy.icon.size, 
                enemy.icon.emoji, 
                enemy.icon.bgColor
            );
        });

        // 创建射弹纹理
        createTexture('projectile', 16, 16, (g) => {
            g.fillStyle(0xf1c40f);
            g.fillCircle(8, 8, 6);
        });

        // 创建免疫器官纹理 - 从配置中读取图标设置
        Object.values(UNITS_CONFIG.fixed).forEach(fixed => {
            createEmojiTexture(
                fixed.texture, 
                fixed.icon.size, 
                fixed.icon.size, 
                fixed.icon.emoji, 
                fixed.icon.bgColor
            );
        });

        // 创建UI图标
        createTexture('icon_health', 48, 48, (g) => {
            g.fillStyle(0xe74c3c);
            g.fillCircle(24, 24, 20);
        });

        createTexture('icon_pause', 48, 48, (g) => {
            g.fillStyle(0xffffff);
            g.fillRect(10, 8, 12, 32);
            g.fillRect(28, 8, 12, 32);
        });

        createTexture('icon_play', 48, 48, (g) => {
            g.fillStyle(0xffffff);
            g.beginPath();
            g.moveTo(16, 12);
            g.lineTo(16, 36);
            g.lineTo(36, 24);
            g.closePath();
            g.fillPath();
        });

        createTexture('icon_exit', 48, 48, (g) => {
            g.lineStyle(6, 0xffffff);
            g.strokeCircle(24, 24, 18);
            g.strokePath();
            g.lineBetween(12, 12, 36, 36);
            g.lineBetween(36, 12, 12, 36);
        });

        // 创建UI图标 - 从配置中读取图标设置
        Object.values(UNITS_CONFIG.ui).forEach(ui => {
            createEmojiTexture(
                ui.texture, 
                ui.icon.size, 
                ui.icon.size, 
                ui.icon.emoji, 
                ui.icon.bgColor
            );
        });

        createTexture('icon_progress', 48, 48, (g) => {
            g.fillStyle(0x9b59b6);
            g.fillCircle(24, 24, 20);
        });

        createTexture('npc_avatar', 96, 96, (g) => {
            g.fillStyle(0xffffff);
            g.fillEllipse(48, 48, 80, 70);
            g.fillStyle(0x000000);
            g.fillCircle(35, 40, 4);
            g.fillCircle(61, 40, 4);
            g.lineStyle(2, 0x000000);
            g.arc(48, 55, 15, 0, Math.PI);
        });
    }

    create() {
        // 启动游戏场景
        this.scene.start('GameScene');
    }
}
