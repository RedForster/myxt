import { Scene } from 'phaser';
import { UNITS_CONFIG } from '../config/UnitsConfig';
import { SPRITE_SHEET_CONFIGS, ANIMATION_CONFIGS } from '../config/SpriteSheetConfig';
import { HomepageView } from '../ui/HomepageView';

/**
 * 预加载场景
 * 负责加载游戏所需的所有资源
 */
export class Preloader extends Scene {
    private homepageView?: HomepageView;
    private nextSceneConfig?: { key: string; data?: any };

    constructor() {
        super('Preloader');
    }

    init(data?: { nextScene?: string; levelData?: any }) {
        if (data && data.nextScene) {
            this.nextSceneConfig = { key: data.nextScene, data: data.levelData };
        } else {
            this.nextSceneConfig = undefined;
        }

        this.homepageView = new HomepageView(this);
        this.homepageView.build({ showLoading: true });
    }

    preload() {
        this.load.on('progress', (value: number) => {
            this.homepageView?.updateProgress(value);
        });

        this.load.on('fileprogress', (file: Phaser.Loader.File) => {
            this.homepageView?.setLoadingFile(file.key);
        });

        this.load.once('complete', () => {
            if (this.nextSceneConfig) {
                return;
            }

            this.homepageView?.showReady(() => {
                this.scene.start('LevelSelection');
            });
        });

        this.load.on('loaderror', (file: Phaser.Loader.File) => {
            console.error('Failed to load file:', file);
        });

        this.loadHomepageAssets();

        // 创建程序化生成的纹理
        this.createTextures();
        
        // 加载单个PNG图片资源
        this.loadSingleImages();
        
        // 加载精灵图资源
        this.loadSpriteSheets();
        
        // 加载反馈动效资源
        this.loadFeedbackEffects();
    }

    private loadHomepageAssets(): void {
        this.load.image('homepage_bg', 'assets/homepage_bg.png');
        this.load.image('start_btn', 'assets/start_btn.svg');
        this.load.image('level_preview_1', 'assets/stage/stage1.png');
        this.load.image('level_preview_2', 'assets/stage/background.png');
        this.load.image('level_preview_3', 'assets/stage/barrier.png');
        this.load.image('icon_arrow_left', 'assets/UI/stop.png');
        this.load.image('icon_arrow_right', 'assets/UI/stop.png');
        this.load.image('background', 'assets/bg.png');
        this.load.image('playerhealth', 'assets/UI/playerhealth.png');
        this.load.image('resourceUI', 'assets/UI/resourceUI.png');
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
            // 创建基础纹理（向后兼容）
            createEmojiTexture(
                tower.texture, 
                tower.icon.size, 
                tower.icon.size, 
                tower.icon.emoji, 
                tower.icon.bgColor
            );
            
            // 创建单帧状态纹理
            createEmojiTexture(
                `${tower.texture}_idle`, 
                tower.icon.size, 
                tower.icon.size, 
                tower.icon.emoji, 
                tower.icon.bgColor
            );
            
            createEmojiTexture(
                `${tower.texture}_attack`, 
                tower.icon.size, 
                tower.icon.size, 
                tower.icon.emoji, 
                tower.icon.bgColor
            );
        });

        // 创建敌人纹理 - 从配置中读取图标设置
        Object.values(UNITS_CONFIG.enemies).forEach(enemy => {
            // 创建基础纹理（向后兼容）
            createEmojiTexture(
                enemy.texture, 
                enemy.icon.size, 
                enemy.icon.size, 
                enemy.icon.emoji, 
                enemy.icon.bgColor
            );
            
            // 创建单帧状态纹理（仅在图片文件不存在时创建）
            createEmojiTexture(
                `${enemy.texture}_idle`, 
                enemy.icon.size, 
                enemy.icon.size, 
                enemy.icon.emoji, 
                enemy.icon.bgColor
            );
            
            createEmojiTexture(
                `${enemy.texture}_attack`, 
                enemy.icon.size, 
                enemy.icon.size, 
                enemy.icon.emoji, 
                enemy.icon.bgColor
            );
            
            createEmojiTexture(
                `${enemy.texture}_death`, 
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

        // 免疫器官纹理现在通过精灵图加载，不再创建程序化纹理

        // 创建UI图标
        // createTexture('icon_health', 48, 48, (g) => {
        //     g.fillStyle(0xe74c3c);
        //     g.fillCircle(24, 24, 20);
        // });

        // 加载UI按钮图片
        this.load.image('icon_pause', 'assets/ui/buttons/pause.png');
        this.load.image('icon_play', 'assets/ui/buttons/play.png');
        this.load.image('icon_exit', 'assets/ui/buttons/exit.png');

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

        // 加载NPC头像图片
        this.load.image('npc_avatar', 'assets/units/npc/tutor.png');

        // 加载图鉴新资源
        this.load.image('codex_bg_canvas', 'assets/bg-canvas.png');
        this.load.image('codex_chip_active', 'assets/chip-active.png');
        this.load.image('codex_chip_inactive', 'assets/chip-inactive.png');
        this.load.image('codex_icon_immune', 'assets/icon-immune.png');
        this.load.image('codex_icon_immune_active', 'assets/icon-immune-active.png');
        this.load.image('codex_icon_virus', 'assets/icon-virus.png');
        this.load.image('codex_icon_virus_active', 'assets/icon-virus-active.png');
        this.load.image('codex_icon_organ', 'assets/icon-route.png'); // base icon
        this.load.image('codex_icon_organ_active', 'assets/icon-route-active.png');
        this.load.image('codex_cards_area', 'assets/bg-cards-area.png');
        this.load.image('codex_card_panel', 'assets/card-panel.png');
        this.load.image('codex_card_detail_panel', 'assets/card-detail-panel.png');
        this.load.image('codex_char_bg', 'assets/character_image_bg.png');
        this.load.image('codex_attr_bg', 'assets/attr-bg.png');
        this.load.image('codex_section_bg', 'assets/section-bg.png');
        this.load.image('codex_return_button', 'assets/button.svg');
        this.load.image('codex_char_img_placeholder', 'assets/character_image.png');

        // 加载游戏结束按钮
        this.load.image('next_button', 'assets/next_button.png');
        this.load.image('return_button', 'assets/button.svg');

        // 加载图鉴属性图标
        this.load.image('icon_health', 'assets/icon-hp.png');
        this.load.image('icon_attack', 'assets/icon-attack.png');
        this.load.image('icon_resource', 'assets/icon-resource.png');
        this.load.image('icon_threat', 'assets/icon-virus.png'); // Assuming icon-virus is for threat

        // 加载UI进度条和生命值条相关资源
        this.load.image('stage_process', 'assets/ui/icons/resources/stage_process.png');
        this.load.image('stage_mark', 'assets/ui/icons/resources/stage_mark.png');
        this.load.image('stage_move', 'assets/ui/icons/resources/stage_move.png');
        this.load.image('health_move', 'assets/ui/icons/resources/health_move.png');
    }

    /**
     * 加载单个PNG图片资源
     */
    private loadSingleImages(): void {
        // 加载敌人移动状态的单个PNG图片
        Object.values(UNITS_CONFIG.enemies).forEach(enemy => {
            const moveImagePath = `assets/units/enemies/${enemy.texture.replace('enemy_', '')}/common/idle.png`;
            this.load.image(`${enemy.texture}_move`, moveImagePath);
        });
        
        // 加载塔移动状态的单个PNG图片
        Object.values(UNITS_CONFIG.towers).forEach(tower => {
            const moveImagePath = `assets/units/towers/${tower.texture.replace('tower_', '')}/idle.png`;
            this.load.image(`${tower.texture}_move`, moveImagePath);
        });
        
        // 加载地图遮罩图片 - 用于控制可移动和部署区域
        this.load.image('background_mask', 'assets/environment/level1/background-mask.png');

        // 加载图鉴背景
        this.load.image('codex_bg', 'assets/ui/codex_bg.png');
        
        // 加载控制面板UI资源
        this.load.image('ctrl-panel-bg', 'assets/ctrl-panel-bg.png');
        this.load.image('content-bg', 'assets/content-bg.png');
        this.load.image('item-background', 'assets/item-background.png');
        this.load.image('skill-bg', 'assets/skill-bg.png');
        this.load.image('skill-icon', 'assets/skill-icon.png');

        // 加载图鉴新资源
        this.load.image('codex_bg_canvas', 'assets/bg-canvas.png');
        this.load.image('codex_chip_active', 'assets/chip-active.png');
        this.load.image('codex_chip_inactive', 'assets/chip-inactive.png');
        this.load.image('codex_icon_immune', 'assets/icon-immune.png');
        this.load.image('codex_icon_immune_active', 'assets/icon-immune-active.png');
        this.load.image('codex_icon_virus', 'assets/icon-virus.png');
        this.load.image('codex_icon_virus_active', 'assets/icon-virus-active.png');
        this.load.image('codex_icon_organ', 'assets/icon-route.png');
        this.load.image('codex_icon_organ_active', 'assets/icon-route-active.png');
        this.load.image('codex_cards_area', 'assets/bg-cards-area.png');
        this.load.image('codex_card_panel', 'assets/card-panel.png');
        this.load.image('codex_card_detail_panel', 'assets/card-detail-panel.png');
        this.load.image('codex_char_bg', 'assets/character_image_bg.png');
        this.load.image('codex_attr_bg', 'assets/attr-bg.png');
        this.load.image('codex_section_bg', 'assets/section-bg.png');
        this.load.image('codex_return_button', 'assets/button.svg');
        this.load.image('codex_char_img_placeholder', 'assets/character_image.png');

        // 加载图鉴属性图标
        this.load.image('icon_hp', 'assets/icon-hp.png');
        this.load.image('icon_attack', 'assets/icon-attack.png');
        this.load.image('icon_resource', 'assets/icon-resource.png');
        this.load.image('icon_threat', 'assets/icon-virus.png'); // 使用病毒图标作为威胁值图标

        // 加载UI进度条和生命值条相关资源
        this.load.image('stage_process', 'assets/ui/icons/resources/stage_process.png');
        this.load.image('stage_mark', 'assets/ui/icons/resources/stage_mark.png');
        this.load.image('stage_move', 'assets/ui/icons/resources/stage_move.png');
        this.load.image('health_move', 'assets/ui/icons/resources/health_move.png');
    }

    /**
     * 加载精灵图资源
     */
    private loadSpriteSheets(): void {
        // 加载所有类型的精灵图
        Object.values(SPRITE_SHEET_CONFIGS).forEach(configs => {
            configs.forEach(config => {
                try {
                    // 尝试加载精灵图，如果失败会自动回退到程序化纹理
                    this.load.spritesheet(config.key, config.path, {
                        frameWidth: config.frameWidth,
                        frameHeight: config.frameHeight
                    });
                } catch (error) {
                }
            });
        });
        
        // 特别检查免疫器官精灵图
        const immuneOrganConfig = SPRITE_SHEET_CONFIGS.fixed.find(config => config.key === 'immune_organ_level1');
        if (immuneOrganConfig) {
        } else {
        }
    }

    /**
     * 加载反馈动效资源
     */
    private loadFeedbackEffects(): void {
        // 加载Lottie JSON动画
        this.load.json('success_lottie', 'assets/effects/feedback/success.json');
        this.load.json('fail_lottie', 'assets/effects/feedback/fail.json');
    }

    /**
     * 创建动画
     */
    private createAnimations(): void {
        // 防御塔动画
        this.createTowerAnimations();
        
        // 敌人动画
        this.createEnemyAnimations();
        
        // 反馈动效动画
        this.createFeedbackAnimations();
    }

    /**
     * 创建防御塔动画
     */
    private createTowerAnimations(): void {
        const towerAnimations = ANIMATION_CONFIGS.towers;
        
        towerAnimations.forEach(animConfig => {
            if (this.textures.exists(animConfig.spriteSheetKey)) {
                this.anims.create({
                    key: animConfig.key,
                    frames: this.anims.generateFrameNumbers(animConfig.spriteSheetKey),
                    frameRate: animConfig.frameRate,
                    repeat: animConfig.repeat
                });
            }
        });
    }

    /**
     * 创建敌人动画
     */
    private createEnemyAnimations(): void {
        const enemyAnimations = ANIMATION_CONFIGS.enemies;
        
        enemyAnimations.forEach(animConfig => {
            if (this.textures.exists(animConfig.spriteSheetKey)) {
                this.anims.create({
                    key: animConfig.key,
                    frames: this.anims.generateFrameNumbers(animConfig.spriteSheetKey),
                    frameRate: animConfig.frameRate,
                    repeat: animConfig.repeat
                });
            }
        });
    }

    /**
     * 创建反馈动效动画
     */
    private createFeedbackAnimations(): void {
        // Lottie动画不需要在这里创建，直接使用JSON数据
        // 已移除sprite-based反馈动画的创建逻辑
    }

    create() {
        this.createAnimations();

        if (this.nextSceneConfig) {
            const { key, data } = this.nextSceneConfig;
            this.scene.start(key, data);
        }
    }
}
