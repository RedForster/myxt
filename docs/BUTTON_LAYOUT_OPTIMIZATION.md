# 游戏结束按钮布局优化

## 优化内容

### 📐 布局改变
- **之前**：按钮垂直排列在右下角
- **现在**：按钮水平排列在底部居中

### 🎨 视觉改进
- **背景图片**：
  - 左侧按钮：使用 `next_button.png` 作为背景
  - 右侧按钮：使用 `button.svg` 作为背景
- **按钮尺寸**：237 x 98 像素
- **字体优化**：使用 Alibaba PuHuiTi 字体，字号32px

### 🎮 按钮逻辑
- **胜利时**：
  - 左侧：**下一关** (next_button.png)
  - 右侧：**返回关卡** (button.svg)
  
- **失败时**：
  - 左侧：**重新挑战** (next_button.png)
  - 右侧：**返回关卡** (button.svg)

## 修改文件

### 1. Preloader.ts
新增图片资源加载：
```typescript
// 加载游戏结束按钮
this.load.image('next_button', 'assets/next_button.png');
this.load.image('return_button', 'assets/button.svg');
```

### 2. UIScene.ts

#### 新增方法：createImageButton()
```typescript
private createImageButton(
    x: number, 
    y: number, 
    text: string, 
    imageKey: string, 
    onClick: () => void
): Phaser.GameObjects.Container
```

**功能**：
- 创建使用图片作为背景的按钮
- 支持hover效果（1.05倍缩放）
- 显示白色文字标签
- 响应点击事件

#### 修改：showGameOver()
**按钮容器位置**：
```typescript
// 之前：右下角 (width - 200, height - 100)
// 现在：底部居中 (width / 2, height - 150)
const buttonContainer = this.add.container(width / 2, height - 150);
```

**按钮布局**：
```typescript
// 左侧按钮：x = -150
// 右侧按钮：x = 150
// 间距：300像素
```

## 视觉效果

### 胜利界面
```
┌─────────────────────────────────────────┐
│                                         │
│        🎉 Success Lottie动画            │
│            (全屏覆盖)                    │
│                                         │
│                                         │
│                                         │
│     ┌──────────┐      ┌──────────┐    │
│     │  下一关   │      │ 返回关卡 │    │
│     └──────────┘      └──────────┘    │
└─────────────────────────────────────────┘
     next_button.png    button.svg
```

### 失败界面
```
┌─────────────────────────────────────────┐
│                                         │
│        ❌ Fail Lottie动画               │
│            (全屏覆盖)                    │
│                                         │
│                                         │
│                                         │
│     ┌──────────┐      ┌──────────┐    │
│     │ 重新挑战  │      │ 返回关卡 │    │
│     └──────────┘      └──────────┘    │
└─────────────────────────────────────────┘
     next_button.png    button.svg
```

## 技术细节

### 按钮容器定位
- **X坐标**：`width / 2` (屏幕水平居中)
- **Y坐标**：`height - 150` (距离底部150像素)
- **深度层级**：1003 (确保在Lottie动画之上)

### 单个按钮定位
```typescript
// 左侧按钮（下一关/重新挑战）
x: -150  // 容器中心向左150px
y: 0     // 与容器中心对齐

// 右侧按钮（返回关卡）
x: 150   // 容器中心向右150px
y: 0     // 与容器中心对齐
```

### 实际屏幕坐标（1920x1080为例）
```typescript
容器中心：(960, 930)

左侧按钮中心：(810, 930)
右侧按钮中心：(1110, 930)

按钮间距：300像素
```

### 交互效果
```typescript
// 默认状态
scale: 1.0

// Hover状态
scale: 1.05 (放大5%)
cursor: pointer

// 点击时
执行回调函数
```

## 按钮尺寸计算

### 图片资源
- **next_button.png**：原始尺寸待确认
- **button.svg**：矢量图，可缩放

### 显示尺寸
- **宽度**：237像素
- **高度**：98像素
- **宽高比**：约 2.42:1

### 响应式调整
如果需要适配不同分辨率，可以动态计算：
```typescript
const buttonWidth = Math.min(237, width * 0.15);
const buttonHeight = buttonWidth / 2.42;
bg.setDisplaySize(buttonWidth, buttonHeight);
```

## 字体样式

### 文字属性
```typescript
{
    fontSize: '32px',           // 较大字号
    color: '#ffffff',           // 白色
    fontStyle: 'bold',          // 粗体
    fontFamily: 'Alibaba PuHuiTi, sans-serif'  // 统一字体
}
```

### 文字定位
- 使用 `setOrigin(0.5)` 居中对齐
- 位于按钮背景图片中心
- 自动适配按钮尺寸

## 下一关功能（TODO）

当前"下一关"按钮的实现：
```typescript
// 暂时重启当前关卡
this.restartCurrentLevel();
```

未来需要实现：
```typescript
// 加载下一关卡
const currentLevelId = this.currentLevelId;
const nextLevelId = this.getNextLevelId(currentLevelId);
if (nextLevelId) {
    this.scene.start('Preloader', { 
        nextScene: 'GameScene', 
        levelData: { levelId: nextLevelId } 
    });
}
```

## 优势

1. **更直观**：水平布局更符合阅读习惯
2. **更美观**：使用设计好的按钮图片
3. **更统一**：与游戏整体UI风格一致
4. **更友好**：按钮位置居中，易于点击

## 测试建议

### 功能测试
1. ✅ 胜利界面显示"下一关"和"返回关卡"
2. ✅ 失败界面显示"重新挑战"和"返回关卡"
3. ✅ 按钮hover效果正常
4. ✅ 点击功能正确

### 视觉测试
1. ✅ 按钮图片正常加载显示
2. ✅ 文字居中对齐
3. ✅ 按钮位置底部居中
4. ✅ 不遮挡Lottie动画主体内容

### 响应式测试
1. 测试不同分辨率下的显示效果
2. 确保按钮不超出屏幕范围
3. 验证按钮间距合适

## 注意事项

1. **图片资源**：
   - 确保 `next_button.png` 和 `button.svg` 存在于 `public/assets/` 目录
   - 检查图片尺寸和质量

2. **文字长度**：
   - 当前文字较短（4个字符）
   - 如需支持更长文字，可能需要调整字号或按钮宽度

3. **下一关功能**：
   - 当前是占位实现（重启当前关卡）
   - 需要后续实现完整的关卡切换逻辑

4. **浏览器兼容性**：
   - SVG支持所有现代浏览器
   - PNG完全兼容

## 相关资源

- next_button.png: `public/assets/next_button.png`
- button.svg: `public/assets/button.svg`
- Alibaba PuHuiTi 字体需确保已加载
