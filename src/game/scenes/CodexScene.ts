import { Scene } from 'phaser';
import { CODEX_CONFIG, CodexUnitEntry } from '../config/CodexConfig';

/**
 * 图鉴场景 - 新版
 * 根据 免疫图鉴.html 的设计重构
 */
export class CodexScene extends Scene {
    private entries: CodexUnitEntry[] = [];
    private allEntries: CodexUnitEntry[] = [];
    private scrollContainer: Phaser.GameObjects.Container;
    private pageIndex: number = 0;
    private cardsPerPage: number = 2;
    private cardWidth: number = 1446;
    private cardHeight: number = 1614;
    private cardGap: number = 98;
    private activeCategory: 'tower' | 'enemy' | 'organ' = 'tower';
    private tabs: { key: 'tower' | 'enemy' | 'organ'; label: string; icon: string; }[] = [
        { key: 'tower', label: '免疫系统', icon: 'codex_icon_immune' },
        { key: 'enemy', label: '病毒', icon: 'codex_icon_virus' },
        { key: 'organ', label: '免疫器官', icon: 'codex_icon_organ' }
    ];
    private pageIndicatorContainer: Phaser.GameObjects.Container;
    private tabsContainer: Phaser.GameObjects.Container; // 固定图层，保证始终在背景下面

    // 设计尺寸，用于缩放和定位
    private designWidth: number = 4096;
    private designHeight: number = 3112;
    private scaleFactor: number;

    private origin?: string;
    private isShowingDetail: boolean = false;
    private detailEntry?: CodexUnitEntry;

    constructor() {
        super('CodexScene');
    }

    init(data?: { filter?: 'tower' | 'enemy' | 'organ'; origin?: string }) {
        this.allEntries = CODEX_CONFIG.units;
        // 保存来源场景（用于返回按钮行为）
        if (data && data.origin) {
            this.origin = data.origin;
        }
        this.isShowingDetail = false;
        this.detailEntry = undefined;
        // 如果外部传入 filter 则使用它；否则默认把第一个 tab 设为 active
        if (data && data.filter) {
            this.activeCategory = data.filter;
        } else if (this.tabs && this.tabs.length > 0) {
            this.activeCategory = this.tabs[0].key;
        }
        this.entries = this.filterEntries(this.activeCategory);
        this.pageIndex = 0;
    }

    create() {
        const { width, height } = this.scale;
        // Fullscreen grey overlay to dim the underlying UIScene and block input
        // so the Codex appears modal-style. Add it before the main UI container
        // so the main content renders above the overlay.
        const overlay = this.add.rectangle(0, 0, width, height, 0x333333, 0.9).setOrigin(0, 0);
        // Make overlay interactive to prevent pointer events from reaching scenes underneath
        overlay.setInteractive();
        
        // 计算缩放因子以适应屏幕
        this.scaleFactor = Math.min(width / this.designWidth, height / this.designHeight);
        const centerX = width / 2;
        const centerY = height / 2;

        // 主容器，所有元素都添加到这里，方便整体缩放
        const mainContainer = this.add.container(centerX, centerY);
        mainContainer.setScale(this.scaleFactor);

        // 顶部主区域背景
        const bgCanvas = this.add.image(0, 0, 'codex_bg_canvas');
        bgCanvas.setPosition(
            (254 - this.designWidth / 2) + bgCanvas.width / 2,
            (428 - this.designHeight / 2) + bgCanvas.height / 2
        );
        mainContainer.add(bgCanvas);

        // 标题 "免疫图鉴"
        const title = this.add.text(
            (254 + 422) - this.designWidth / 2,
            (428 + 74) - this.designHeight / 2,
            '免疫图鉴', {
            fontSize: '136px',
            color: 'rgba(50,37,139,1)',
            fontStyle: 'bold',
            fontFamily: "'Alibaba PuHuiTi','Microsoft YaHei',sans-serif"
        });
        mainContainer.add(title);

        // 返回按钮 (需要始终在最上层可根据需求后续调整)
        this.createReturnButton(mainContainer);

        // Tabs容器：先添加，再绘制tabs，后面添加的cardsAreaBg会覆盖在其上方
        this.tabsContainer = this.add.container(0, 0);
        mainContainer.add(this.tabsContainer);
        this.createTabs();

        // 卡片区域背景（要求在tabs上方显示保持遮挡关系稳定）
        const cardsAreaBg = this.add.image(0, 0, 'codex_cards_area');
        cardsAreaBg.setPosition(
            (254 + 154) - this.designWidth / 2 + cardsAreaBg.width / 2,
            (428 + 274) - this.designHeight / 2 + cardsAreaBg.height / 2
        );
        mainContainer.add(cardsAreaBg);

        // 滚动容器
        this.scrollContainer = this.add.container(0, 0);
        mainContainer.add(this.scrollContainer);
        
        // 遮罩，限制卡片显示区域
        const maskGraphics = this.make.graphics(undefined, false);
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillRect(
            centerX + ((254 + 154) - this.designWidth / 2) * this.scaleFactor,
            centerY + ((428 + 274) - this.designHeight / 2) * this.scaleFactor,
            3488 * this.scaleFactor,
            1972 * this.scaleFactor
        );
        const mask = maskGraphics.createGeometryMask();
        this.scrollContainer.setMask(mask);

        this.populateCards();

        // 页面指示器
        this.pageIndicatorContainer = this.add.container(0, 0);
        mainContainer.add(this.pageIndicatorContainer);
        this.createPageIndicator();

        // 拖动滑动
        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
            (this as any)._dragStartX = p.x;
        });
        this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
            const dx = p.x - (this as any)._dragStartX;
            if (Math.abs(dx) > 60) {
                this.scrollTo(this.pageIndex + (dx < 0 ? 1 : -1));
            }
        });
    }

    private createReturnButton(container: Phaser.GameObjects.Container) {
        const btnX = (3352 + 236 / 2) - this.designWidth / 2;
        const btnY = (2800 + 109 / 2) - this.designHeight / 2;

        const btn = this.add.image(btnX, btnY, 'codex_return_button').setDisplaySize(474, 196);
        const label = this.add.text(btnX, btnY, '返回', {
            fontSize: '60px',
            color: 'rgba(50,50,50,1)',
            fontStyle: '700'
        }).setOrigin(0.5);

        container.add([btn, label]);

        btn.setInteractive()
            .on('pointerdown', () => btn.setTint(0xcccccc))
            .on('pointerout', () => btn.clearTint())
            .on('pointerup', () => {
                btn.clearTint();
                if (this.isShowingDetail) {
                    this.closeDetail();
                    return;
                }

                // 根据打开来源返回到不同的场景
                const origin = this.origin || '';
                if (origin === 'UIScene') {
                    this.scene.stop('CodexScene');
                    this.scene.resume('UIScene');
                    const gameScene = this.scene.get('GameScene') as any;
                    if (gameScene && gameScene.resumeGame) {
                        gameScene.resumeGame();
                    }
                } else if (origin === 'LevelSelection' || origin === 'NewLevelSelection') {
                    // If opened from level selection, stop Codex and resume/start level selection
                    this.scene.stop('CodexScene');
                    // Use start to ensure LevelSelection is in foreground
                    this.scene.start(origin);
                } else {
                    // Default behavior: resume UIScene if present, otherwise go to Homepage
                    if (this.scene.isActive('UIScene')) {
                        this.scene.stop('CodexScene');
                        this.scene.resume('UIScene');
                    } else {
                        this.scene.start('Homepage');
                    }
                }
            });
    }

    private createTabs() {
        if (!this.tabsContainer) return;
        // 清空但保持图层位置不变
        this.tabsContainer.removeAll(true);
        const tabBaseX = (254 + 1056) - this.designWidth / 2;
        const tabBaseY = (428 + 114) - this.designHeight / 2;
        const tabWidth = 892;
        const tabHeight = 278;
        const tabGap = 778; // 1834 - 1056

        this.tabs.forEach((tab, i) => {
            const isActive = this.activeCategory === tab.key;
            const x = tabBaseX + i * tabGap + tabWidth / 2;
            const y = tabBaseY + tabHeight / 2;

            const tabBg = this.add.image(x, y, isActive ? 'codex_chip_active' : 'codex_chip_inactive');

            // 选择图标（active状态使用 *_active ）
            let iconKey = tab.icon;
            if (isActive) {
                if (tab.key === 'tower') iconKey = 'codex_icon_immune_active';
                else if (tab.key === 'enemy') iconKey = 'codex_icon_virus_active';
                else if (tab.key === 'organ') iconKey = 'codex_icon_organ_active';
            }

            const icon = this.add.image(
                x - tabWidth/2 + (tab.key === 'enemy' ? 288 : (tab.key === 'organ' ? 192 : 176)),
                y - tabHeight/2 + 58 + (tab.key === 'enemy' ? 50 : (tab.key === 'organ' ? 41.45 : 45.34)),
                iconKey
            );

            const label = this.add.text(
                x - tabWidth/2 + (tab.key === 'enemy' ? 288+101.54+36 : (tab.key === 'organ' ? 192+94.36+23.64 : 176+79.3+38.7)),
                y - tabHeight/2 + 58,
                tab.label, {
                fontSize: '96px',
                color: isActive ? 'rgba(144,59,23,1)' : 'rgba(30,64,174,1)',
                fontStyle: '700'
            });

            this.tabsContainer.add([tabBg, icon, label]);

            tabBg.setInteractive().on('pointerup', () => {
                if (!isActive) {
                    this.activeCategory = tab.key;
                    this.entries = this.filterEntries(this.activeCategory);
                    this.pageIndex = 0;
                    this.isShowingDetail = false;
                    this.detailEntry = undefined;
                    this.populateCards();
                    this.createPageIndicator();
                    this.scrollTo(0, true); // Scroll to first page instantly
                    // 仅刷新tab内容，不改变层级
                    this.createTabs();
                }
            });
        });
    }

    private createCard(entry: CodexUnitEntry, x: number, y: number): Phaser.GameObjects.Container {
        const cardContainer = this.add.container(x, y);
        const w = this.cardWidth;
        const h = this.cardHeight;

        const bg = this.add.image(0, 0, 'codex_card_panel');
        cardContainer.add(bg);

        const name = this.add.text(-w / 2 + 194, -h / 2 + 132, entry.name, {
            fontSize: '96px',
            color: 'rgba(67,76,166,1)',
            fontStyle: '700'
        });
        cardContainer.add(name);

        const charTextureKey = this.textures.exists(entry.iconTextureKey) ? entry.iconTextureKey : 'codex_char_img_placeholder';
        const charHolderY = -h / 2 + 78 + 110 + 442 / 2;
        const charHolder = this.add.image(-w / 2 + 132 + 680 / 2, charHolderY, 'codex_char_bg').setDisplaySize(544, 354);
        const charImg = this.add.image(charHolder.x, charHolder.y, charTextureKey);
        if (this.textures.exists(charTextureKey)) {
            const tex = this.textures.get(charTextureKey);
            const src = tex.getSourceImage() as HTMLImageElement | undefined;
            if (src) {
                const scale = Math.min(500 / src.width, 500 / src.height, 3);
                charImg.setDisplaySize(src.width * scale, src.height * scale);
            } else {
                charImg.setDisplaySize(432, 432);
            }
        } else {
            charImg.setDisplaySize(432, 432);
        }
        cardContainer.add([charHolder, charImg]);

        const attrContainer = this.add.container(-w / 2 + 132 + 680 + 32, -h / 2 + 78 + 150);
        cardContainer.add(attrContainer);

        const createAttr = (iconKey: string, label: string, value: string | number, posY: number, iconW: number, iconH: number) => {
            const maxIconWidth = 108;
            const iconTextGap = 50;
            const iconX = maxIconWidth - iconW;
            const icon = this.add.image(iconX, posY + iconH / 2, iconKey).setOrigin(0, 0.5).setDisplaySize(iconW, iconH);
            const textBlockX = maxIconWidth + iconTextGap;
            const attrBg = this.add.image(textBlockX, posY + 64 / 2, 'codex_attr_bg').setOrigin(0, 0.5);
            const text = this.add.text(attrBg.x + 22, attrBg.y, `${label} ${value}`, {
                fontSize: '40px',
                color: 'rgba(81,93,209,1)',
                fontStyle: '700'
            }).setOrigin(0, 0.5);
            return [icon, attrBg, text];
        };

        attrContainer.add(createAttr('icon_resource', '消耗资源', entry.cost, 0, 94, 100));
        attrContainer.add(createAttr('icon_hp', '生命值', entry.hp, 144, 108, 94));
        attrContainer.add(createAttr('icon_attack', '攻击力', entry.attack, 262, 86, 98));

        const skillSectionY = -h / 2 + 78 + 442 + 108;
        const skillBg = this.add.image(-w / 2 + 176 + 396 / 2, skillSectionY + 102 / 2, 'codex_section_bg');
        const skillLabel = this.add.text(skillBg.x, skillBg.y + (102 / 2 - 51), '技能', {
            fontSize: '60px', color: 'rgba(81,93,209,1)', fontStyle: '700'
        }).setOrigin(0.5);
        const skillDesc = this.add.text(-w / 2 + 176 + 4, skillSectionY + 102 + 24, entry.skillBrief, {
            fontSize: '60px', color: 'rgba(110,110,110,1)', fontStyle: '700', lineSpacing: 20,
            wordWrap: { width: 1080, useAdvancedWrap: true }
        });
        cardContainer.add([skillBg, skillLabel, skillDesc]);

        const descSectionY = skillSectionY + 208 + 28;
        const descBg = this.add.image(-w / 2 + 176 + 396 / 2, descSectionY + 102 / 2, 'codex_section_bg');
        const descLabel = this.add.text(descBg.x, descBg.y + (102 / 2 - 51), '角色描述', {
            fontSize: '60px', color: 'rgba(81,93,209,1)', fontStyle: '700'
        }).setOrigin(0.5);
        const descText = this.add.text(-w / 2 + 176 + 4, descSectionY + 102 + 44, entry.description, {
            fontSize: '60px', color: 'rgba(110,110,110,1)', fontStyle: '700', lineSpacing: 20,
            wordWrap: { width: 1080, useAdvancedWrap: true }
        });
        cardContainer.add([descBg, descLabel, descText]);

    cardContainer.setSize(w, h).setInteractive({ useHandCursor: true });
        cardContainer.on('pointerup', () => {
            const dragDx = Math.abs(((this as any)._dragStartX ?? 0) - (this.input?.activePointer?.upX ?? 0));
            if (dragDx < 30) {
                this.openDetail(entry);
            }
        });

        return cardContainer;
    }

    private createDetailCard(entry: CodexUnitEntry, x: number, y: number): Phaser.GameObjects.Container {
        const cardContainer = this.add.container(x, y);
        const hasDetailPanel = this.textures.exists('codex_card_detail_panel');
        const detailTexture = hasDetailPanel ? this.textures.get('codex_card_detail_panel') : null;
        const sourceImage = detailTexture?.getSourceImage() as HTMLImageElement | undefined;
        const panelWidth = sourceImage?.width ?? this.cardWidth;
        const panelHeight = sourceImage?.height ?? this.cardHeight;

        // 更新卡片尺寸缓存，供分页与滚动计算使用
        this.cardWidth = panelWidth;
        this.cardHeight = panelHeight;

        const backgroundKey = hasDetailPanel ? 'codex_card_detail_panel' : 'codex_card_panel';
        const bg = this.add.image(0, 0, backgroundKey).setOrigin(0.5);
        cardContainer.add(bg);

        const paddingLeft = -panelWidth / 2 + 160;
        const paddingTop = -panelHeight / 2 + 120;

        // 标题
        const title = this.add.text(paddingLeft, paddingTop, entry.name, {
            fontSize: '120px',
            color: '#2C3C9F',
            fontStyle: '700',
            padding: { x: 4, y: 8 },
                fixedWidth: 0,
                fixedHeight: 0
        });
        cardContainer.add(title);

        // 技能简介标签
        // const briefBg = this.add.graphics();
        // const briefWidth = 540;
        // const briefHeight = 68;
        // briefBg.fillStyle(0xE2E8FF, 1);
        // briefBg.fillRoundedRect(paddingLeft, paddingTop + 130, briefWidth, briefHeight, 34);
        // cardContainer.add(briefBg);
        // const briefText = this.add.text(paddingLeft + 32, paddingTop + 130 + briefHeight / 2, `技能：${entry.skillBrief}`, {
        //     fontSize: '48px',
        //     color: '#4A5BC9',
        //     fontStyle: '600'
        // }).setOrigin(0, 0.5);
        // cardContainer.add(briefText);

        // 左侧展示区域
        const previewWidth = Math.min(panelWidth * 0.55, 1480);
        const previewHeight = Math.min(panelHeight * 0.42, 820);
        const previewX = paddingLeft;
        const previewY = paddingTop + 240;

        const previewBg = this.add.graphics();
        previewBg.fillStyle(0xffffff, 1);
        previewBg.fillRoundedRect(previewX, previewY, previewWidth, previewHeight, 56);
        previewBg.lineStyle(6, 0xD8DEFF, 1);
        previewBg.strokeRoundedRect(previewX, previewY, previewWidth, previewHeight, 56);
        cardContainer.add(previewBg);

        const textureKey = this.textures.exists(entry.iconTextureKey) ? entry.iconTextureKey : 'codex_char_img_placeholder';
        const previewImage = this.add.image(previewX + previewWidth / 2, previewY + previewHeight / 2, textureKey);
        if (this.textures.exists(textureKey)) {
            const tex = this.textures.get(textureKey);
            const texSource = tex.getSourceImage() as HTMLImageElement | undefined;
            if (texSource) {
                const scale = Math.min((previewWidth - 160) / texSource.width, (previewHeight - 160) / texSource.height, 3);
                previewImage.setDisplaySize(texSource.width * scale, texSource.height * scale);
            } else {
                previewImage.setDisplaySize(previewWidth * 0.9, previewHeight * 0.9);
            }
        } else {
            previewImage.setDisplaySize(previewWidth * 0.9, previewHeight * 0.9);
        }
        cardContainer.add(previewImage);

        // // 技能详解
        // const skillDetailTitle = this.add.text(paddingLeft, previewY + previewHeight + 48, '技能解析', {
        //     fontSize: '60px',
        //     color: '#4A5BC9',
        //     fontStyle: '700'
        // });
        // cardContainer.add(skillDetailTitle);
        // const skillDetailText = this.add.text(paddingLeft, skillDetailTitle.y + 72, entry.skillDetail, {
        //     fontSize: '44px',
        //     color: '#5B6288',
        //     wordWrap: { width: previewWidth, useAdvancedWrap: true },
        //     lineSpacing: 12
        // });
        // cardContainer.add(skillDetailText);

        // 属性标签
        const stats: { icon: string; label: string; value: string; }[] = [
            { icon: 'icon_resource', label: '资源消耗', value: entry.cost },
            { icon: 'icon_hp', label: '生命值', value: entry.hp },
            { icon: 'icon_attack', label: '攻击力', value: entry.attack },
            { icon: this.textures.exists('icon_threat') ? 'icon_threat' : 'icon_attack', label: '威胁值', value: entry.threat }
        ].filter(stat => stat.value && stat.value !== '空');

    const statsPerRow = 3;
    const statY = 360;
    const statSpacing = 500;
    const statRowHeight = 120;

        stats.forEach((stat, index) => {
            const row = Math.floor(index / statsPerRow);
            const col = index % statsPerRow;
            const statContainer = this.add.container(paddingLeft + col * statSpacing, statY + row * statRowHeight);
            const statBg = this.add.graphics();
            statBg.fillStyle(0xD5DDFF, 1);
            // Wider stat background per design request
            statBg.fillRoundedRect(0, 0, 440, 96, 48);
            statBg.lineStyle(4, 0xD5DDFF, 1);
            statBg.strokeRoundedRect(0, 0, 440, 96, 48);
            statContainer.add(statBg);

            const icon = this.add.image(60, 48, stat.icon).setOrigin(0.5);
            icon.setDisplaySize(72, 72);
            statContainer.add(icon);

            const valueText = this.add.text(140, 48, `${stat.label} ${stat.value}`, {
                fontSize: '50px',
                color: '#5260D1',
                fontStyle: '700',fontFamily: '"Alibaba PuHuiTi", Arial, "Microsoft YaHei", "SimHei", sans-serif',
            }).setOrigin(0, 0.5);
            statContainer.add(valueText);

            cardContainer.add(statContainer);
        });

        // 解锁信息
        const statRows = Math.ceil(stats.length / statsPerRow);
        const statsBlockHeight = statRows > 0 ? statRows * statRowHeight : 0;
        const unlockText = this.add.text(paddingLeft, statY + statsBlockHeight + 60, `解锁条件：${entry.unlock}`, {
            fontSize: '44px',
            color: '#5B6288',
            fontStyle: 'bold',
            padding: { x: 4, y: 8 },
            fixedWidth: 0,
            fixedHeight: 0
        });
        cardContainer.add(unlockText);

        // 右侧内容区
        const panelLeft = -panelWidth / 2;
        const rightColumnX = paddingLeft + previewWidth + 160;
        const consumedWidth = rightColumnX - panelLeft;
        const rightColumnWidth = Math.max(panelWidth - consumedWidth - 120, 600);
        let sectionY = paddingTop;

        const addSection = (titleText: string, body: string, foot:string) => {
            // const headerBg = this.add.graphics();
            // headerBg.fillStyle(0xEAF0FF, 1);
            // headerBg.fillRoundedRect(rightColumnX, sectionY, rightColumnWidth, 72, 36);
            const headerBg = this.add.image(rightColumnX + 200, sectionY+ 30, 'codex_section_bg');
            cardContainer.add(headerBg);

            const headerText = this.add.text(rightColumnX + 48, sectionY + 36, titleText, {
                fontSize: '60px',
                color: '#4A5BC9',
                fontStyle: 'bold',
                fontFamily: '"Alibaba PuHuiTi", Arial, "Microsoft YaHei", "SimHei", sans-serif',
                padding: { x: 4, y: 8 },
                fixedWidth: 0,
                fixedHeight: 0
            }).setOrigin(0, 0.5);
            cardContainer.add(headerText);

            const bodyText = this.add.text(rightColumnX, sectionY + 106, body, {
                fontSize: '60px',
                color: '#6E6E6E',
                fontStyle: 'bold',
                wordWrap: { width: rightColumnWidth, useAdvancedWrap: true },
                lineSpacing: 16,
                fontFamily: '"Alibaba PuHuiTi", Arial, "Microsoft YaHei", "SimHei", sans-serif',
                padding: { x: 4, y: 8 },
                fixedWidth: 0,
                fixedHeight: 0
            });
            cardContainer.add(bodyText);
            sectionY = sectionY + 96 + bodyText.height + 48;

            if (foot) {
                const footText = this.add.text(rightColumnX, bodyText.y + bodyText.height + 16, foot, {
                    fontSize: '60px',
                    color: '#6573c4ff',
                    fontStyle: 'bold',
                    fontFamily: '"Alibaba PuHuiTi", Arial, "Microsoft YaHei", "SimHei", sans-serif',
                    wordWrap: { width: rightColumnWidth, useAdvancedWrap: true },
                    padding: { x: 4, y: 8 },
                    fixedWidth: 0,
                    fixedHeight: 0
                });
                cardContainer.add(footText);
                sectionY = sectionY + footText.height + 48;
            }
            
        };

        addSection('角色描述', entry.skillBrief+":"+entry.skillDetail, entry.description);
        addSection('知识点', entry.knowledge);

        cardContainer.setSize(panelWidth, panelHeight);
        return cardContainer;
    }

    private openDetail(entry: CodexUnitEntry): void {
        this.isShowingDetail = true;
        this.detailEntry = entry;
        this.pageIndex = 0;
        this.populateCards();
        this.createPageIndicator();
    }

    private closeDetail(): void {
        this.isShowingDetail = false;
        this.detailEntry = undefined;
        this.pageIndex = 0;
        this.populateCards();
        this.createPageIndicator();
    }

    private scrollTo(nextIndex: number, instant = false) {
        if (this.isShowingDetail) {
            return;
        }
        const totalPages = Math.ceil(this.entries.length / this.cardsPerPage);
        const maxIndex = Math.max(totalPages - 1, 0);
        this.pageIndex = Phaser.Math.Clamp(nextIndex, 0, maxIndex);
        
        const targetOffset = -this.pageIndex * (this.cardWidth * this.cardsPerPage + this.cardGap * (this.cardsPerPage -1) + this.cardGap * 2) * this.scaleFactor;

        if (instant) {
            this.scrollContainer.x = targetOffset;
            this.createPageIndicator();
        } else {
            this.tweens.add({
                targets: this.scrollContainer,
                x: targetOffset,
                duration: 300,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    this.createPageIndicator();
                }
            });
        }
    }

    private filterEntries(category: 'tower' | 'enemy' | 'organ'): CodexUnitEntry[] {
        return this.allEntries.filter(e => e.category === category);
    }

    private populateCards(): void {
        this.scrollContainer.removeAll(true);

        const cardsAreaBaseX = (254 + 154) - this.designWidth / 2;
        const cardsAreaBaseY = (428 + 274) - this.designHeight / 2;
        const areaWidth = 3488;
        const areaHeight = 1972;

        if (this.isShowingDetail && this.detailEntry) {
            this.cardsPerPage = 1;

            let detailWidth = this.cardWidth;
            let detailHeight = this.cardHeight;
            if (this.textures.exists('codex_card_detail_panel')) {
                const tex = this.textures.get('codex_card_detail_panel');
                const src = tex.getSourceImage() as HTMLImageElement | undefined;
                if (src) {
                    detailWidth = src.width;
                    detailHeight = src.height;
                }
            }
            const horizontalMargin = Math.max((areaWidth - detailWidth) / 2, 0);
            const verticalMargin = Math.max((areaHeight - detailHeight) / 2, 0);
            const startX = cardsAreaBaseX + horizontalMargin;
            const startY = cardsAreaBaseY + verticalMargin;
            const card = this.createDetailCard(this.detailEntry, startX + detailWidth / 2, startY + detailHeight / 2);
            this.scrollContainer.add(card);
            this.scrollContainer.x = 0;
            return;
        }

        this.cardsPerPage = 2;
        this.cardWidth = 1446;
        this.cardHeight = 1614;

        const cardMarginLeft = 200;
        const cardMarginTop = 180;
        const startX = cardsAreaBaseX + cardMarginLeft;
        const startY = cardsAreaBaseY + cardMarginTop;

        this.entries.forEach((entry, index) => {
            const cardX = startX + (index * (this.cardWidth + this.cardGap)) + this.cardWidth / 2;
            const cardY = startY + this.cardHeight / 2;
            const card = this.createCard(entry, cardX, cardY);
            this.scrollContainer.add(card);
        });
    }

    private createPageIndicator(): void {
        this.pageIndicatorContainer.removeAll(true);
        if (this.isShowingDetail) {
            return;
        }
        const totalPages = Math.ceil(this.entries.length / this.cardsPerPage);
        if (totalPages <= 1) return;

        const y = (428 + 2338 - 100) - this.designHeight / 2; // Position it above the bottom edge
        const indicatorWidth = totalPages * 40;
        const startX = -indicatorWidth / 2;

        for (let i = 0; i < totalPages; i++) {
            const x = startX + i * 40;
            const dot = this.add.graphics();
            if (i === this.pageIndex) {
                dot.fillStyle(0x4A2C2A, 1);
                dot.fillCircle(x, y, 12);
            } else {
                dot.fillStyle(0x4A2C2A, 0.5);
                dot.fillCircle(x, y, 10);
            }
            this.pageIndicatorContainer.add(dot);
        }
    }
}



