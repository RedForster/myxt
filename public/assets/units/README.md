# 精灵图动画系统

## 概述

这个系统为游戏提供了完整的精灵图动画支持，同时保持向后兼容性。游戏可以自动检测精灵图的存在，如果精灵图不可用，则回退到程序化生成的纹理。

## 资源目录结构

所有资源文件都位于 `public/assets/` 目录下，符合 Phaser3 最佳实践：

```
public/assets/
├── units/                    # 游戏单位
│   ├── towers/              # 防御塔（免疫细胞）
│   │   ├── neutrophil/      # 嗜中性白血球
│   │   ├── bcell/           # B细胞
│   │   ├── tcell/           # T细胞
│   │   └── macrophage/      # 巨噬细胞
│   ├── enemies/             # 敌人（病原体）
│   │   ├── bacteria/        # 细菌
│   │   ├── virus/           # 病毒
│   │   └── fungus/          # 真菌
│   └── immune_organ/        # 免疫器官
├── environment/             # 环境资源（按关卡组织）
│   ├── level1/            # 第1关 - 血流环境
│   ├── level2/            # 第2关 - 组织环境  
│   └── level3/            # 第3关 - 淋巴结环境
├── ui/                      # 界面资源
│   ├── icons/              # 图标
│   ├── panels/             # 面板
│   ├── buttons/            # 按钮
│   └── HUD/                # 平显
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

## 系统架构

### 1. 配置文件 (`src/game/config/SpriteSheetConfig.ts`)

定义了所有精灵图的配置信息：

- `SPRITE_SHEET_CONFIGS`: 精灵图加载配置
- `ANIMATION_CONFIGS`: 动画创建配置

### 2. 预加载器 (`src/game/scenes/Preloader.ts`)

负责：
- 加载精灵图资源
- 创建动画配置
- 自动回退到程序化纹理

### 3. 实体类动画系统

#### Tower 类 (`src/game/entities/Tower.ts`)
- 支持待机、攻击、放置三种状态
- 自动检测精灵图可用性
- 平滑的状态切换

#### Enemy 类 (`src/game/entities/Enemy.ts`)
- 支持待机、移动、攻击、死亡四种状态
- 死亡动画完成后自动销毁
- 支持精灵图和单帧纹理

## 使用方法

### 1. 添加新的精灵图

1. 将精灵图文件放在对应的目录：
   - `public/assets/units/towers/{towerType}/` - 防御塔精灵图
   - `public/assets/units/enemies/{enemyType}/{subtype}/` - 敌人精灵图

2. 在 `SpriteSheetConfig.ts` 中添加配置：

```typescript
{
    key: 'tower_newtower_idle_spritesheet',
    path: 'assets/units/towers/newtower/idle_spritesheet.png',
    frameWidth: 64,
    frameHeight: 64
}
```

3. 添加动画配置：

```typescript
{
    key: 'tower_newtower_idle',
    spriteSheetKey: 'tower_newtower_idle_spritesheet',
    frameRate: 8,
    repeat: -1
}
```

### 2. 精灵图命名约定

- 防御塔：`tower_{towerType}_{state}_spritesheet`
- 敌人：`enemy_{enemyType}_{subtype}_{state}_spritesheet`
- 动画：`{entityType}_{entityType}_{state}`

### 3. 状态类型

#### 防御塔状态
- `idle`: 待机状态
- `attack`: 攻击状态
- `placement`: 放置状态

#### 敌人状态
- `idle`: 待机状态
- `move`: 移动状态
- `attack`: 攻击状态
- `death`: 死亡状态

## 自动回退机制

如果精灵图文件不存在，系统会：

1. 使用程序化生成的单帧纹理
2. 通过纹理切换实现状态变化
3. 保持游戏正常运行

## 性能优化

### 1. 对象池
- 射弹使用对象池减少GC压力
- 实体组管理提高渲染效率

### 2. 条件渲染
- 只有屏幕可见的敌人才会攻击
- 优化动画播放频率

### 3. 内存管理
- 自动回收不用的纹理
- 动画完成后自动清理

## 调试功能

### 1. 控制台日志
- 详细的精灵图加载日志
- 动画状态切换日志
- 性能监控信息

### 2. 可视化调试
- 攻击范围指示器
- 生命值条显示
- 状态颜色变化

## 扩展性

### 1. 新增实体类型
- 继承基础Entity类
- 实现特定的动画状态
- 添加对应的配置

### 2. 新增动画状态
- 扩展状态枚举
- 更新动画配置
- 修改状态切换逻辑

### 3. 自定义动画
- 支持不同的帧率
- 支持不同的重复模式
- 支持动画回调

## 示例代码

### 创建自定义防御塔动画

```typescript
// 在SpriteSheetConfig.ts中添加
{
    key: 'tower_custom_idle_spritesheet',
    path: 'assets/units/towers/custom/idle_spritesheet.png',
    frameWidth: 64,
    frameHeight: 64
}

// 在Tower类中自动支持
// 系统会自动检测并创建对应的动画
```

### 创建自定义敌人动画

```typescript
// 在SpriteSheetConfig.ts中添加
{
    key: 'enemy_custom_move_spritesheet',
    path: 'assets/units/enemies/custom/common/move_spritesheet.png',
    frameWidth: 48,
    frameHeight: 48
}

// 在Enemy类中自动支持
// 敌人会自动使用移动动画
```

## 注意事项

1. **精灵图尺寸**: 确保所有帧的尺寸一致
2. **文件路径**: 使用相对路径，确保文件存在
3. **动画帧率**: 根据动画效果调整合适的帧率
4. **内存使用**: 大型精灵图会影响内存使用
5. **加载顺序**: 确保精灵图在动画创建前加载完成