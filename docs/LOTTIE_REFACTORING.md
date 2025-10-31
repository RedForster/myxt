# Lottie动画重构说明

## 概述
将游戏结束反馈动画从精灵表（Sprite Sheet）方式重构为Lottie动画方式。

## 修改内容

### 1. 安装依赖
```bash
npm install lottie-web
```

### 2. 新增文件
- **src/game/utils/LottieHelper.ts** - Lottie动画助手类
  - 封装了Lottie动画的加载、播放、销毁等功能
  - 提供了与Phaser场景集成的接口
  - 支持自定义位置、尺寸、透明度等属性

### 3. 修改文件

#### Preloader.ts
- **loadFeedbackEffects()** 方法：
  - 移除原有的 `multiatlas` 加载方式
  - 改为加载 JSON 格式的 Lottie 动画文件：
    - `success_lottie`: assets/effects/feedback/success.json
    - `fail_lottie`: assets/effects/feedback/fail.json

- **createFeedbackAnimations()** 方法：
  - 移除了精灵表动画的创建逻辑
  - Lottie动画不需要预先创建动画序列

#### UIScene.ts
- **导入 LottieHelper**：
  ```typescript
  import { LottieHelper } from '../utils/LottieHelper';
  ```

- **showGameOver()** 方法重构：
  - 移除了精灵表动画相关代码（feedbackSprite）
  - 使用 LottieHelper 播放动画：
    ```typescript
    const lottieHelper = new LottieHelper(this);
    const animationKey = isVictory ? 'success_lottie' : 'fail_lottie';
    const animationData = this.cache.json.get(animationKey);
    
    lottieHelper.play(
        animationData,
        0, 0, width, height,
        false,
        onComplete
    );
    ```
  - 动画完成后自动淡出并销毁
  - 失败时提供了降级方案（直接显示模态窗口）

## 技术优势

### 相比精灵表的优势：
1. **文件体积更小** - JSON文本文件比多张PNG图片组成的精灵表小得多
2. **矢量渲染** - Lottie使用SVG渲染，支持任意缩放而不失真
3. **更易编辑** - 可以使用After Effects等工具直接导出和修改
4. **更流畅** - 不受帧数限制，动画更加平滑
5. **更灵活** - 可以在运行时修改动画的各种属性

### LottieHelper类的特点：
1. **DOM集成** - 使用HTML元素承载动画，确保在Phaser画布上正确显示
2. **生命周期管理** - 自动处理动画的创建和销毁
3. **回调支持** - 支持动画完成回调
4. **样式控制** - 支持透明度、位置、尺寸等属性的动态调整

## 使用方法

### 基本用法：
```typescript
const lottieHelper = new LottieHelper(this);
const animationData = this.cache.json.get('animation_key');

lottieHelper.play(
    animationData,  // Lottie JSON数据
    x,              // X坐标
    y,              // Y坐标
    width,          // 宽度
    height,         // 高度
    false,          // 是否循环
    () => {         // 完成回调
        lottieHelper.destroy();
    }
);
```

### 动态控制：
```typescript
// 设置透明度
lottieHelper.setAlpha(0.5);

// 销毁动画
lottieHelper.destroy();

// 获取动画实例（用于高级控制）
const animation = lottieHelper.getAnimation();
```

## 注意事项

1. **资源路径** - 确保Lottie JSON文件在正确的路径：
   - public/assets/effects/feedback/success.json
   - public/assets/effects/feedback/fail.json

2. **内存管理** - 动画使用完毕后要调用 `destroy()` 方法释放资源

3. **浏览器兼容性** - lottie-web库支持所有主流现代浏览器

4. **性能** - 对于复杂动画，SVG渲染可能比canvas渲染慢，可以根据需要调整渲染器类型

## 未来扩展

可以在其他需要动画效果的地方使用LottieHelper，例如：
- 技能特效
- UI过渡动画
- 教程引导动画
- 粒子效果

## 测试

启动开发服务器后，进入游戏并完成或失败一局，观察游戏结束时的反馈动画是否正常播放。
