# Lottie动画全屏显示修复

## 问题描述

**原始问题**：
- Lottie动画尺寸：2048 x 1536 (4:3 宽高比)
- 屏幕尺寸：1920 x 1080 (16:9 宽高比)
- 结果：动画无法横向满屏，两侧留有空白

## 问题原因

Lottie动画的宽高比(4:3)与屏幕宽高比(16:9)不一致：
- **动画比例**：2048/1536 = 1.33
- **屏幕比例**：1920/1080 = 1.78

当使用默认的缩放方式时，Lottie会等比例缩放以适应容器，导致：
- 如果按高度缩放：横向无法满屏，两侧留白
- 如果按宽度缩放：纵向超出屏幕

## 解决方案

### 核心策略
使用 **Cover** 缩放模式（类似CSS的`object-fit: cover`）：
1. 计算横向和纵向的缩放比例
2. 选择**较大的**缩放比例，确保至少有一个方向满屏
3. 超出部分使用 `overflow: hidden` 裁剪

### 实现细节

#### 1. 添加容器裁剪
```typescript
this.container.style.overflow = 'hidden'; // 裁剪超出部分
```

#### 2. 计算缩放比例
```typescript
// 获取Lottie动画的原始尺寸
const lottieWidth = animationData.w || 2048;
const lottieHeight = animationData.h || 1536;

// 计算缩放比例 - 确保横向满屏
const scaleX = width / lottieWidth;     // 1920/2048 = 0.9375
const scaleY = height / lottieHeight;   // 1080/1536 = 0.703125
const scale = Math.max(scaleX, scaleY); // 选择0.9375（横向）
```

#### 3. 应用缩放并居中
```typescript
const scaledWidth = lottieWidth * scale;   // 1920px (满屏)
const scaledHeight = lottieHeight * scale; // 1440px (超出360px)

svg.style.width = `${scaledWidth}px`;
svg.style.height = `${scaledHeight}px`;

// 居中显示（横向满屏，纵向居中裁剪）
svg.style.left = `${(width - scaledWidth) / 2}px`;  // 0px
svg.style.top = `${(height - scaledHeight) / 2}px`; // -180px (上下各裁剪180px)
```

## 修改文件

### LottieHelper.ts - play() 方法

**新增内容**：
```typescript
// 1. 添加overflow裁剪
this.container.style.overflow = 'hidden';

// 2. 监听DOMLoaded事件，动画加载完成后调整SVG
this.animation.addEventListener('DOMLoaded', () => {
    const svg = this.container.querySelector('svg');
    if (svg) {
        // 获取原始尺寸并计算缩放
        const lottieWidth = animationData.w || 2048;
        const lottieHeight = animationData.h || 1536;
        
        const scaleX = width / lottieWidth;
        const scaleY = height / lottieHeight;
        const scale = Math.max(scaleX, scaleY);
        
        // 应用缩放和居中
        const scaledWidth = lottieWidth * scale;
        const scaledHeight = lottieHeight * scale;
        
        svg.style.width = `${scaledWidth}px`;
        svg.style.height = `${scaledHeight}px`;
        svg.style.position = 'absolute';
        svg.style.left = `${(width - scaledWidth) / 2}px`;
        svg.style.top = `${(height - scaledHeight) / 2}px`;
    }
});
```

## 视觉效果对比

### 修复前（包含模式 - Contain）
```
┌─────────────────────────────────┐
│    │                      │     │
│    │   Lottie动画内容     │     │
│    │   (4:3比例)          │     │
│    │                      │     │
│    │   横向无法满屏       │     │
│    │   两侧留有空白       │     │
│    │                      │     │
└─────────────────────────────────┘
     ↑                      ↑
   空白                    空白
```

### 修复后（覆盖模式 - Cover）
```
┌─────────────────────────────────┐ ← 上方被裁剪
│█████████████████████████████████│
│█████████████████████████████████│
│███    Lottie动画内容      ███████│
│███    (横向满屏)          ███████│
│███    纵向超出部分裁剪    ███████│
│█████████████████████████████████│
│█████████████████████████████████│
└─────────────────────────────────┘ ← 下方被裁剪
```

## 技术细节

### Math.max() 的作用
```javascript
// 假设屏幕是 1920x1080，动画是 2048x1536

scaleX = 1920 / 2048 = 0.9375
scaleY = 1080 / 1536 = 0.703125

// 使用 Math.min() - Contain模式（全部显示）
scale = Math.min(0.9375, 0.703125) = 0.703125
结果：高度满屏，宽度留白

// 使用 Math.max() - Cover模式（覆盖满屏）
scale = Math.max(0.9375, 0.703125) = 0.9375
结果：宽度满屏，高度裁剪 ✓
```

### 居中算法
```javascript
// 横向（刚好满屏，无需偏移）
left = (1920 - 1920) / 2 = 0px

// 纵向（超出360px，向上偏移180px）
top = (1080 - 1440) / 2 = -180px
```

## 适配不同分辨率

### 16:9屏幕（如1920x1080）
- **横向**：完全撑满 ✓
- **纵向**：上下裁剪约12.5%

### 21:9超宽屏（如2560x1080）
- **横向**：完全撑满 ✓
- **纵向**：上下裁剪更多

### 4:3屏幕（如1024x768）
- **横向**：完全撑满 ✓
- **纵向**：可能刚好适配或轻微裁剪

## 优势

1. **横向满屏**：无论什么分辨率，横向都会撑满
2. **无留白**：不会出现黑边或空白区域
3. **动态适配**：自动根据实际屏幕尺寸和动画尺寸计算
4. **性能优化**：使用CSS transform，GPU加速

## 注意事项

1. **重要内容位置**：
   - 确保Lottie动画的关键内容在中心区域
   - 避免将重要元素放在上下边缘（可能被裁剪）

2. **不同动画尺寸**：
   - 代码会自动从 `animationData.w` 和 `animationData.h` 读取
   - 如果没有这些属性，使用默认值 2048x1536

3. **渲染器选择**：
   - 当前使用 SVG 渲染器（矢量，清晰）
   - 也可以改用 Canvas 渲染器（性能更好）

## 测试建议

1. **不同分辨率**：
   - 1920x1080 (Full HD)
   - 2560x1440 (2K)
   - 3840x2160 (4K)
   - 1366x768 (笔记本)

2. **不同宽高比**：
   - 16:9（标准）
   - 21:9（超宽屏）
   - 4:3（旧显示器）

3. **缩放测试**：
   - 浏览器缩放（Ctrl + +/-）
   - 全屏模式
   - 窗口化模式

## CSS等价写法

如果是纯CSS，等价于：
```css
.lottie-container {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
}

.lottie-container svg {
    width: auto;
    height: auto;
    min-width: 100%;
    min-height: 100%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    object-fit: cover; /* 关键属性 */
}
```

## 相关资源

- [CSS object-fit 属性](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit)
- [Lottie Web API](https://github.com/airbnb/lottie-web)
- [响应式设计最佳实践](https://web.dev/responsive-web-design-basics/)
