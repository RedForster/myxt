# 精灵图系统示例配置

## 防御塔精灵图示例

### 中性粒细胞 (Neutrophil)
```
塔尺寸: 64x64 像素
待机动画: 4帧, 8 FPS, 循环
攻击动画: 6帧, 12 FPS, 单次
```

文件命名:
- `assets/spritesheets/towers/neutrophil_idle.png` - 4帧水平排列
- `assets/spritesheets/towers/neutrophil_attack.png` - 6帧水平排列

### B细胞 (B-cell)
```
塔尺寸: 64x64 像素
待机动画: 4帧, 8 FPS, 循环
攻击动画: 8帧, 12 FPS, 单次
```

文件命名:
- `assets/spritesheets/towers/bcell_idle.png` - 4帧水平排列
- `assets/spritesheets/towers/bcell_attack.png` - 8帧水平排列

## 敌人精灵图示例

### 普通细菌 (Common Bacteria)
```
敌人尺寸: 48x48 像素
待机动画: 4帧, 6 FPS, 循环
移动动画: 6帧, 8 FPS, 循环
攻击动画: 4帧, 10 FPS, 单次
死亡动画: 8帧, 8 FPS, 单次
```

文件命名:
- `assets/spritesheets/enemies/commonBacteria_idle.png` - 4帧水平排列
- `assets/spritesheets/enemies/commonBacteria_move.png` - 6帧水平排列
- `assets/spritesheets/enemies/commonBacteria_attack.png` - 4帧水平排列
- `assets/spritesheets/enemies/commonBacteria_death.png` - 8帧水平排列

## 精灵图制作指南

### 1. 尺寸要求
- 防御塔: 64x64 像素每帧
- 敌人: 48x48 像素每帧
- 所有帧必须尺寸一致

### 2. 排列方式
- 水平排列，从左到右
- 帧与帧之间无间隙
- 透明背景 (PNG格式)

### 3. 动画设计
- 待机动画: 轻微的呼吸效果
- 移动动画: 流畅的移动循环
- 攻击动画: 明显的攻击动作
- 死亡动画: 消散或倒下效果

### 4. 颜色建议
- 防御塔: 蓝色、绿色系
- 敌人: 红色、紫色系
- 高对比度便于识别

## 自动检测系统

系统会自动检测精灵图文件是否存在：
- 如果存在：使用精灵图动画
- 如果不存在：使用程序化纹理

这样可以确保游戏在没有精灵图的情况下也能正常运行。

## 性能优化建议

1. **精灵图大小**: 单个精灵图建议不超过 1024x1024 像素
2. **帧数**: 动画帧数控制在 4-8 帧之间
3. **颜色深度**: 使用 32 位 RGBA 格式
4. **压缩**: 使用 PNG 压缩减少文件大小