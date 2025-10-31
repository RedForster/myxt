# 免疫塔防游戏 - 美术资源设计文档

## 概述

本文档为免疫塔防游戏（Immune Tower Defense）提供完整的美术资源设计规范，包括资源目录结构、文件命名规范、技术要求等内容。

## Phaser3 兼容性分析

### ✅ 符合Phaser3要求的设计点

1. **纹理加载机制**
   - 当前游戏使用程序化生成纹理（Preloader.ts:63-222）
   - 新资源可直接通过`this.load.image()`加载
   - 支持PNG、JPG等Phaser3原生格式

2. **资源路径映射**
   - 现有配置使用`texture`字段映射资源名（UnitsConfig.ts）
   - 新资源路径与现有配置完全兼容
   - 例如：`texture: 'tower_neutrophil'` → `assets/units/towers/neutrophil/idle.png`

3. **分组管理**
   - 现有代码使用Phaser Group管理实体（GameScene.ts:98-106）
   - 新资源结构支持按组分类加载
   - 便于实现资源池和性能优化

4. **尺寸规格**
   - 设计的分辨率（32x32到96x96）符合Phaser3推荐
   - 支持高DPI显示设备
   - 适合塔防游戏的视觉层次

## 资产目录结构

```
assets/
├── units/                    # 游戏单位
│   ├── towers/              # 防御塔（免疫细胞）
│   │   ├── neutrophil/      # 嗜中性白血球
│   │   │   ├── idle.png     # 待机状态（单帧）
│   │   │   ├── attack.png   # 攻击状态（单帧）
│   │   │   ├── idle_spritesheet.png  # 待机动画精灵图
│   │   │   ├── attack_spritesheet.png # 攻击动画精灵图
│   │   │   └── projectile.png # 投射物
│   │   ├── bcell/           # B细胞
│   │   ├── tcell/           # T细胞
│   │   └── macrophage/      # 巨噬细胞
│   ├── enemies/             # 敌人（病原体）
│   │   ├── bacteria/        # 细菌
│   │   │   ├── common/      # 普通细菌
│   │   │   │   ├── idle.png     # 待机状态
│   │   │   │   ├── move_spritesheet.png  # 移动动画精灵图
│   │   │   │   ├── attack_spritesheet.png # 攻击动画精灵图
│   │   │   │   └── death_spritesheet.png # 死亡动画精灵图
│   │   ├── virus/           # 病毒
│   │   └── fungus/          # 真菌
│   └── immune_organ/        # 免疫器官
│       ├── level1.png       # 1级形态
│       ├── level2.png       # 2级形态
│       ├── level3.png       # 3级形态
│       ├── level4.png       # 4级形态
│       └── level5.png       # 5级形态
├── environment/             # 环境资源（按关卡组织）
│   ├── level1/            # 第1关 - 血流环境
│   │   ├── background.png  # 血流背景 (1920x1080)
│   │   ├── path.png        # 血管路径瓦片 (64x64)
│   │   ├── tissue.png      # 组织区域瓦片 (64x64)
│   │   ├── bubble.png      # 血流气泡特效 (32x32)
│   │   └── flow.png        # 血流动画精灵图 (256x256)
│   ├── level2/            # 第2关 - 组织环境  
│   │   ├── background.png  # 组织背景 (1920x1080)
│   │   ├── path.png        # 组织间隙路径 (64x64)
│   │   ├── cell.png        # 细胞区域瓦片 (64x64)
│   │   ├── bubble.png      # 组织液气泡 (32x32)
│   │   └── pulse.png       # 组织脉动精灵图 (256x256)
│   └── level3/            # 第3关 - 淋巴结环境
│       ├── background.png  # 淋巴结背景 (1920x1080)
│       ├── path.png        # 淋巴管路径 (64x64)
│       ├── node.png        # 淋巴结瓦片 (64x64)
│       ├── bubble.png      # 淋巴液气泡 (32x32)
│       └── flow.png        # 淋巴流动精灵图 (256x256)
├── ui/                      # 界面资源
│   ├── icons/              # 图标
│   │   ├── towers/         # 塔图标
│   │   ├── skills/         # 技能图标
│   │   └── resources/     # 资源图标
│   ├── panels/             # 面板
│   │   ├── control_panel.png
│   │   ├── upgrade_panel.png
│   │   └── level_select.png
│   ├── buttons/            # 按钮
│   │   ├── start.png
│   │   ├── pause.png
│   │   └── upgrade.png
│   └── HUD/                # 平显
│       ├── health_bar.png
│       ├── resource_bar.png
│       └── wave_timer.png
├── effects/                 # 特效
│   ├── projectiles/        # 投射物特效
│   ├── explosions/         # 爆炸特效
│   ├── particles/          # 粒子效果
│   └── skills/             # 技能特效
└── animations/             # 动画序列
    ├── towers/            # 塔动画
    ├── enemies/           # 敌人动画
    └── effects/           # 特效动画
```

## 详细资源清单

### 1. 防御塔（免疫细胞）

#### 1.1 嗜中性白血球 (Neutrophil)
- **功能**：基础防御塔，快速攻击
- **视觉风格**：浅蓝色圆形细胞，内部有深色颗粒
- **动画方案**：
  - **基础版**：单帧状态切换（idle.png, attack.png）
  - **进阶版**：精灵图动画（idle_spritesheet.png, attack_spritesheet.png）
- **资源文件**：
  - `assets/units/towers/neutrophil/idle.png` (64x64) - 待机状态单帧
  - `assets/units/towers/neutrophil/attack.png` (64x64) - 攻击状态单帧
  - `assets/units/towers/neutrophil/idle_spritesheet.png` (256x64) - 待机动画4帧
  - `assets/units/towers/neutrophil/attack_spritesheet.png` (256x64) - 攻击动画4帧
  - `assets/units/towers/neutrophil/projectile.png` (16x16) - 投射物
  - `assets/units/towers/neutrophil/icon.png` (64x64) - 建造图标
  - `assets/units/towers/neutrophil/placement.png` (64x64, 50%透明度) - 放置预览

#### 1.2 B细胞 (B-cell)
- **功能**：远程攻击，高伤害
- **视觉风格**：紫色椭圆形，表面有受体凸起
- **动画方案**：
  - **基础版**：单帧状态切换（idle.png, attack.png）
  - **进阶版**：精灵图动画（idle_spritesheet.png, attack_spritesheet.png）
- **资源文件**：
  - `assets/units/towers/bcell/idle.png` (80x80) - 待机状态单帧
  - `assets/units/towers/bcell/attack.png` (80x80) - 攻击状态单帧
  - `assets/units/towers/bcell/idle_spritesheet.png` (320x80) - 待机动画4帧
  - `assets/units/towers/bcell/attack_spritesheet.png` (320x80) - 攻击动画4帧
  - `assets/units/towers/bcell/projectile.png` (20x20) - 抗体投射物
  - `assets/units/towers/bcell/icon.png` (64x64) - 建造图标
  - `assets/units/towers/bcell/placement.png` (80x80, 50%透明度) - 放置预览

#### 1.3 T细胞 (T-cell)
- **功能**：快速攻击，长射程
- **视觉风格**：红色圆形，表面有T细胞受体
- **动画方案**：
  - **基础版**：单帧状态切换（idle.png, attack.png）
  - **进阶版**：精灵图动画（idle_spritesheet.png, attack_spritesheet.png）
- **资源文件**：
  - `assets/units/towers/tcell/idle.png` (72x72) - 待机状态单帧
  - `assets/units/towers/tcell/attack.png` (72x72) - 攻击状态单帧
  - `assets/units/towers/tcell/idle_spritesheet.png` (288x72) - 待机动画4帧
  - `assets/units/towers/tcell/attack_spritesheet.png` (288x72) - 攻击动画4帧
  - `assets/units/towers/tcell/projectile.png` (18x18) - 细胞因子投射物
  - `assets/units/towers/tcell/icon.png` (64x64) - 建造图标
  - `assets/units/towers/tcell/placement.png` (72x72, 50%透明度) - 放置预览

#### 1.4 巨噬细胞 (Macrophage)
- **功能**：重型防御，高血量高伤害
- **视觉风格**：黄色大型细胞，形状不规则
- **动画方案**：
  - **基础版**：单帧状态切换（idle.png, attack.png）
  - **进阶版**：精灵图动画（idle_spritesheet.png, attack_spritesheet.png）
- **资源文件**：
  - `assets/units/towers/macrophage/idle.png` (96x96) - 待机状态单帧
  - `assets/units/towers/macrophage/attack.png` (96x96) - 攻击状态单帧
  - `assets/units/towers/macrophage/idle_spritesheet.png` (384x96) - 待机动画4帧
  - `assets/units/towers/macrophage/attack_spritesheet.png` (384x96) - 攻击动画4帧
  - `assets/units/towers/macrophage/projectile.png` (24x24) - 吞噬效果
  - `assets/units/towers/macrophage/icon.png` (64x64) - 建造图标
  - `assets/units/towers/macrophage/placement.png` (96x96, 50%透明度) - 放置预览

### 2. 免疫器官

#### 2.1 免疫器官（可升级）
- **功能**：玩家基地，生成资源
- **视觉风格**：粉红色器官状，随等级变大变复杂
- **资源文件**：
  - `assets/units/immune_organ/level1.png` (128x128)
  - `assets/units/immune_organ/level2.png` (144x144)
  - `assets/units/immune_organ/level3.png` (160x160)
  - `assets/units/immune_organ/level4.png` (176x176)
  - `assets/units/immune_organ/level5.png` (192x192)

### 3. 敌人单位（病原体）

#### 3.1 细菌 (Bacteria)
- **类型**：普通敌人
- **视觉风格**：绿色球状或杆状，有鞭毛
- **动画方案**：
  - **基础版**：单帧状态切换（idle.png, attack.png）
  - **进阶版**：精灵图动画（移动、攻击、死亡动画）
- **资源文件**：
  - `assets/units/enemies/bacteria/common/idle.png` (48x48) - 待机状态单帧
  - `assets/units/enemies/bacteria/common/move_spritesheet.png` (192x48) - 移动动画4帧
  - `assets/units/enemies/bacteria/common/attack_spritesheet.png` (192x48) - 攻击动画4帧
  - `assets/units/enemies/bacteria/common/death_spritesheet.png` (192x48) - 死亡动画4帧

#### 3.2 病毒 (Virus)
- **类型**：快速敌人
- **视觉风格**：红色多面体结构，有蛋白突起
- **动画方案**：
  - **基础版**：单帧状态切换（idle.png, attack.png）
  - **进阶版**：精灵图动画（移动、攻击、死亡动画）
- **资源文件**：
  - `assets/units/enemies/virus/common/idle.png` (32x32) - 待机状态单帧
  - `assets/units/enemies/virus/common/move_spritesheet.png` (128x32) - 移动动画4帧
  - `assets/units/enemies/virus/common/attack_spritesheet.png` (128x32) - 攻击动画4帧
  - `assets/units/enemies/virus/common/death_spritesheet.png` (128x32) - 死亡动画4帧

#### 3.3 真菌 (Fungus)
- **类型**：重型敌人
- **视觉风格**：棕色孢子状，有菌丝
- **动画方案**：
  - **基础版**：单帧状态切换（idle.png, attack.png）
  - **进阶版**：精灵图动画（移动、攻击、死亡动画）
- **资源文件**：
  - `assets/units/enemies/fungus/common/idle.png` (56x56) - 待机状态单帧
  - `assets/units/enemies/fungus/common/move_spritesheet.png` (224x56) - 移动动画4帧
  - `assets/units/enemies/fungus/common/attack_spritesheet.png` (224x56) - 攻击动画4帧
  - `assets/units/enemies/fungus/common/death_spritesheet.png` (224x56) - 死亡动画4帧

### 4. UI界面资源

#### 4.1 图标资源
- **塔图标**：`assets/ui/icons/towers/` (64x64)
- - 资源图标：`assets/ui/icons/resources/` (48x48)
- **技能图标**：`assets/ui/icons/skills/` (64x64)

#### 4.2 面板资源
- **主控制面板**：`assets/ui/panels/main_panel.png` (400x600)
- **塔选择面板**：`assets/ui/panels/tower_panel.png` (300x500)
- **升级面板**：`assets/ui/panels/upgrade_panel.png` (250x400)
- **关卡选择面板**：`assets/ui/panels/level_select.png` (600x400)

#### 4.3 按钮资源
- **标准按钮**：`assets/ui/buttons/` (128x32)
- **方形按钮**：`assets/ui/buttons/` (64x64)
- **图标按钮**：`assets/ui/buttons/` (48x48)

#### 4.4 HUD元素
- **生命值条**：`assets/ui/HUD/health_bar.png` (200x30)
- **资源条**：`assets/ui/HUD/resource_bar.png` (200x30)
- **波次计时器**：`assets/ui/HUD/wave_timer.png` (150x40)

### 5. 特效资源

#### 5.1 战斗特效
- **投射物**：`assets/effects/projectiles/` (16x24到32x32)
- **爆炸效果**：`assets/effects/explosions/` (64x64到128x128)
- **击中特效**：`assets/effects/impacts/` (32x32到64x64)

#### 5.2 技能特效
- **喷嚏技能**：`assets/effects/skills/sneeze/` (128x128)
- **发热技能**：`assets/effects/skills/fever/` (96x96)
- **抗体爆发**：`assets/effects/skills/antibody_burst/` (128x128)

#### 5.3 环境特效
- **粒子效果**：`assets/effects/particles/` (16x16到32x32)
- **背景动画**：`assets/environment/effects/` (192x192)

### 6. 环境资源（按关卡设计）

#### 6.1 第1关 - 血流环境
- **背景**：`assets/environment/level1/background.png` (1920x1080) - 血流动态背景
- **路径瓦片**：`assets/environment/level1/path.png` (64x64) - 血管路径
- **区域瓦片**：`assets/environment/level1/tissue.png` (64x64) - 组织区域
- **环境特效**：`assets/environment/level1/bubble.png` (32x32) - 血流气泡
- **环境动画**：`assets/environment/level1/flow.png` (256x256, 8帧) - 血流动画精灵图

#### 6.2 第2关 - 组织环境
- **背景**：`assets/environment/level2/background.png` (1920x1080) - 组织纹理背景
- **路径瓦片**：`assets/environment/level2/path.png` (64x64) - 组织间隙
- **区域瓦片**：`assets/environment/level2/cell.png` (64x64) - 细胞区域
- **环境特效**：`assets/environment/level2/bubble.png` (32x32) - 组织液气泡
- **环境动画**：`assets/environment/level2/pulse.png` (256x256, 8帧) - 组织脉动精灵图

#### 6.3 第3关 - 淋巴结环境
- **背景**：`assets/environment/level3/background.png` (1920x1080) - 淋巴结结构
- **路径瓦片**：`assets/environment/level3/path.png` (64x64) - 淋巴管
- **区域瓦片**：`assets/environment/level3/node.png` (64x64) - 淋巴结
- **环境特效**：`assets/environment/level3/bubble.png` (32x32) - 淋巴液气泡
- **环境动画**：`assets/environment/level3/flow.png` (256x256, 8帧) - 淋巴流动精灵图

## 技术规范

### 文件格式要求
- **主要资源**：PNG-24（支持透明通道）
- **UI元素**：PNG-8（256色，文件更小）
- **背景图**：JPG（质量90%，文件最小）
- **动画序列**：PNG精灵图或GIF

### 分辨率标准
- **游戏单位**：32x32 到 96x96 像素
- **UI图标**：64x64 像素
- **按钮**：128x32 或 64x64 像素
- **背景图**：1920x1080 像素（可平铺）
- **特效**：64x64 到 256x256 像素

### 文件命名规范
- 使用小写字母和下划线
- 动画帧按数字后缀命名：`idle_1.png`, `idle_2.png`
- 变种用描述性前缀：`bacteria_green.png`, `bacteria_red.png`
- 状态用后缀区分：`idle.png`, `attack.png`, `death.png`

### Phaser3 动画实现方案

#### 方案1：单帧状态切换（基础版）
```typescript
// 在Preloader.ts中加载单帧图片
this.load.image('tower_neutrophil_idle', 'assets/units/towers/neutrophil/idle.png');
this.load.image('tower_neutrophil_attack', 'assets/units/towers/neutrophil/attack.png');

// 在游戏代码中切换纹理
tower.setTexture('tower_neutrophil_attack'); // 攻击状态
tower.setTexture('tower_neutrophil_idle');    // 待机状态
```

#### 方案2：精灵图动画（进阶版）
```typescript
// 在Preloader.ts中加载精灵图
this.load.spritesheet('tower_neutrophil_idle', 
    'assets/units/towers/neutrophil/idle_spritesheet.png', {
    frameWidth: 64,
    frameHeight: 64
});

this.load.spritesheet('tower_neutrophil_attack', 
    'assets/units/towers/neutrophil/attack_spritesheet.png', {
    frameWidth: 64,
    frameHeight: 64
});

// 创建动画
this.anims.create({
    key: 'neutrophil_idle',
    frames: this.anims.generateFrameNumbers('tower_neutrophil_idle', { start: 0, end: 3 }),
    frameRate: 8,
    repeat: -1
});

this.anims.create({
    key: 'neutrophil_attack',
    frames: this.anims.generateFrameNumbers('tower_neutrophil_attack', { start: 0, end: 3 }),
    frameRate: 12,
    repeat: 0
});

// 播放动画
tower.play('neutrophil_idle');    // 播放待机动画
tower.play('neutrophil_attack');  // 播放攻击动画
```

#### 方案3：混合动画方案（推荐）
```typescript
// 基础状态使用单帧，特效使用精灵图
this.load.image('tower_neutrophil_idle', 'assets/units/towers/neutrophil/idle.png');
this.load.spritesheet('tower_neutrophil_attack', 
    'assets/units/towers/neutrophil/attack_spritesheet.png', {
    frameWidth: 64,
    frameHeight: 64
});

// 创建攻击动画
this.anims.create({
    key: 'neutrophil_attack',
    frames: this.anims.generateFrameNumbers('tower_neutrophil_attack', { start: 0, end: 3 }),
    frameRate: 12,
    repeat: 0,
    onComplete: () => {
        // 动画完成后回到待机状态
        tower.setTexture('tower_neutrophil_idle');
    }
});

// 使用示例
function attack() {
    tower.play('neutrophil_attack');
}
```

#### 环境资源按关卡加载
```typescript
// 根据关卡ID动态加载环境资源
loadEnvironmentAssets(levelId: string) {
    // 加载背景
    this.load.image(`bg_level${levelId}`, `assets/environment/level${levelId}/background.png`);
    
    // 加载瓦片
    this.load.image(`tile_path_level${levelId}`, `assets/environment/level${levelId}/path.png`);
    this.load.image(`tile_area_level${levelId}`, `assets/environment/level${levelId}/tissue.png`);
    
    // 加载环境动画
    this.load.spritesheet(`env_flow_level${levelId}`, 
        `assets/environment/level${levelId}/flow.png`, {
        frameWidth: 256,
        frameHeight: 256
    });
    
    // 创建环境动画
    this.anims.create({
        key: `env_flow_${levelId}`,
        frames: this.anims.generateFrameNumbers(`env_flow_level${levelId}`, { start: 0, end: 7 }),
        frameRate: 8,
        repeat: -1
    });
}

// 使用示例
// 在关卡开始时调用
this.loadEnvironmentAssets('1'); // 加载第1关环境资源
```

#### 敌人动画实现
```typescript
// 加载敌人精灵图
this.load.spritesheet('enemy_bacteria_move', 
    'assets/units/enemies/bacteria/common/move_spritesheet.png', {
    frameWidth: 48,
    frameHeight: 48
});

this.load.spritesheet('enemy_bacteria_attack', 
    'assets/units/enemies/bacteria/common/attack_spritesheet.png', {
    frameWidth: 48,
    frameHeight: 48
});

this.load.spritesheet('enemy_bacteria_death', 
    'assets/units/enemies/bacteria/common/death_spritesheet.png', {
    frameWidth: 48,
    frameHeight: 48
});

// 创建动画
this.anims.create({
    key: 'bacteria_move',
    frames: this.anims.generateFrameNumbers('enemy_bacteria_move', { start: 0, end: 3 }),
    frameRate: 6,
    repeat: -1
});

this.anims.create({
    key: 'bacteria_attack',
    frames: this.anims.generateFrameNumbers('enemy_bacteria_attack', { start: 0, end: 3 }),
    frameRate: 8,
    repeat: 0
});

this.anims.create({
    key: 'bacteria_death',
    frames: this.anims.generateFrameNumbers('enemy_bacteria_death', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: 0
});

// 使用示例
enemy.play('bacteria_move');    // 移动动画
enemy.play('bacteria_attack');  // 攻击动画
enemy.play('bacteria_death');   // 死亡动画
```

## 资源优先级

### 第一优先级（核心游戏）
1. 防御塔基础资源（4种塔的单帧状态：idle.png, attack.png）
2. 免疫器官资源（5个等级的静态图片）
3. 基础敌人资源（细菌的单帧状态）
4. 核心UI资源（图标、按钮、面板）
5. **第1关环境资源**（level1/背景、路径、区域瓦片）

### 第二优先级（完整体验）
1. 防御塔精灵图动画（idle_spritesheet.png, attack_spritesheet.png）
2. 敌人精灵图动画（移动、攻击、死亡动画）
3. 其他敌人类型（病毒、真菌）
4. 特效资源（投射物、爆炸）
5. **第2-3关环境资源**（level2/level3背景、瓦片、环境动画）

### 第三优先级（丰富内容）
1. 技能特效和动画
2. 环境特效和动画（气泡、流动效果）
3. 地形瓦片系统扩展
4. 高级动画效果（如升级动画、技能释放动画）
5. **后续关卡环境资源**（level4+，如皮肤环境、骨髓环境等）

## 预计资源总量

### 第一优先级（基础版）
- **单帧资源**：约30-50个文件
- **UI资源**：约40-60个文件
- **第1关环境资源**：约5-8个文件
- **小计**：约75-118个文件

### 第二优先级（进阶版）
- **精灵图动画**：约40-60个文件
- **特效资源**：约30-50个文件
- **敌人资源**：约20-30个文件
- **第2-3关环境资源**：约10-15个文件
- **小计**：约100-155个文件

### 第三优先级（完整版）
- **高级动画**：约30-50个文件
- **环境特效**：约20-30个文件
- **技能特效**：约20-30个文件
- **后续关卡环境资源**：约15-25个文件
- **小计**：约85-135个文件

### 总计
- **基础版**：约75-118个文件
- **进阶版**：约175-273个文件
- **完整版**：约260-408个文件

## 性能优化建议

1. **纹理图集**：将多个小图合并为图集，减少Draw Call
2. **对象池**：复用游戏对象，减少GC压力
3. **压缩优化**：使用WebP格式减小文件大小
4. **懒加载**：按需加载资源，减少初始加载时间
5. **分辨率适配**：为不同设备提供不同分辨率的资源

## 质量检查清单

### 基础资源检查
- [ ] 所有单帧资源分辨率符合规范
- [ ] 文件命名规范统一（小写+下划线）
- [ ] 透明通道正确设置
- [ ] 资源路径与配置文件匹配
- [ ] 在Phaser3中正常加载和显示

### 精灵图动画检查
- [ ] 精灵图尺寸计算正确（帧宽 × 帧数）
- [ ] 动画帧顺序正确（从左到右，从上到下）
- [ ] 帧率设置合理（待机6-8fps，攻击8-12fps）
- [ ] 动画循环设置正确（repeat: -1 或 repeat: 0）
- [ ] 动画过渡平滑

### 游戏集成检查
- [ ] 单帧状态切换功能正常
- [ ] 精灵图动画播放正常
- [ ] 混合动画方案工作正常
- [ ] 动画完成回调正确执行
- [ ] 内存使用合理，无资源泄露

### UI和特效检查
- [ ] UI元素在不同分辨率下显示正常
- [ ] 特效与游戏场景协调
- [ ] 按钮交互状态正确
- [ ] 图标清晰可识别

### 性能优化检查
- [ ] 纹理图集使用合理
- [ ] 对象池实现正确
- [ ] 资源懒加载机制工作正常
- [ ] 在目标设备上性能流畅

---

本文档将随着游戏开发的进展而更新，确保美术资源与游戏需求的同步。