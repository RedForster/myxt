import lottie, { AnimationItem } from 'lottie-web';

/**
 * Lottie动画助手类
 * 用于在Phaser场景中集成Lottie动画
 */
export class LottieHelper {
    private container: HTMLDivElement;
    private animation: AnimationItem | null = null;
    private onCompleteCallback: (() => void) | null = null;

    constructor(private scene: Phaser.Scene) {
        // 创建DOM容器
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.pointerEvents = 'none';
        this.container.style.zIndex = '1000';
    }

    /**
     * 播放Lottie动画
     * @param animationData - Lottie JSON数据
     * @param x - X坐标（相对于游戏画布）
     * @param y - Y坐标（相对于游戏画布）
     * @param width - 动画宽度
     * @param height - 动画高度
     * @param loop - 是否循环播放
     * @param onComplete - 完成回调
     */
    play(
        animationData: any,
        x: number,
        y: number,
        width: number,
        height: number,
        loop: boolean = false,
        onComplete?: () => void
    ): void {
        // 设置容器样式和位置
    const canvas = this.scene.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    // Calculate how much the canvas was stretched in the DOM relative to Phaser's logical size
    const scaleFactorX = width !== 0 ? canvasRect.width / width : 1;
    const scaleFactorY = height !== 0 ? canvasRect.height / height : 1;
    const targetX = x * scaleFactorX;
    const targetY = y * scaleFactorY;
    const targetWidth = width * scaleFactorX;
    const targetHeight = height * scaleFactorY;

        console.log('[LottieHelper] Container setup', {
            x,
            y,
            width,
            height,
            scaleFactorX,
            scaleFactorY,
            targetX,
            targetY,
            targetWidth,
            targetHeight,
            canvasRect
        });
        
    this.container.style.left = `${canvasRect.left + targetX}px`;
    this.container.style.top = `${canvasRect.top + targetY}px`;
    this.container.style.width = `${targetWidth}px`;
    this.container.style.height = `${targetHeight}px`;
        this.container.style.overflow = 'hidden'; // 裁剪超出部分
        
        // 添加到DOM
        document.body.appendChild(this.container);
        
        // 存储回调
        this.onCompleteCallback = onComplete || null;
        
        // 创建Lottie动画
        this.animation = lottie.loadAnimation({
            container: this.container,
            renderer: 'svg',
            loop: loop,
            autoplay: true,
            animationData: animationData
        });
        
        // 动画加载完成后，调整SVG以横向满屏
    this.animation.addEventListener('DOMLoaded', () => {
            const svg = this.container.querySelector('svg');
            if (svg) {
                // 获取Lottie动画的原始尺寸
                const lottieWidth = animationData.w || 2048;
                const lottieHeight = animationData.h || 1536;
                
                // 计算缩放比例 - 确保横向满屏
        const scaleX = targetWidth / lottieWidth;
        const scaleY = targetHeight / lottieHeight;
                const scale = Math.max(scaleX, scaleY); // 使用较大的缩放比例确保满屏
                
                const scaledWidth = lottieWidth * scale;
                const scaledHeight = lottieHeight * scale;

                console.log('[LottieHelper] SVG sizing', {
                    lottieWidth,
                    lottieHeight,
                    scaleX,
                    scaleY,
                    scale,
                    scaledWidth,
                    scaledHeight,
                    targetWidth,
                    targetHeight
                });
                
                // 强制设置SVG的viewBox和preserveAspectRatio
                svg.setAttribute('viewBox', `0 0 ${lottieWidth} ${lottieHeight}`);
                svg.setAttribute('preserveAspectRatio', 'xMidYMid slice'); // slice模式确保覆盖满屏
                
                // 设置SVG样式
                svg.style.width = `${scaledWidth}px`;
                svg.style.height = `${scaledHeight}px`;
                svg.style.position = 'absolute';
                svg.style.minWidth = `100%`; // 确保至少横向满屏
                svg.style.minHeight = `100%`; // 确保至少纵向满屏
                
                // 居中显示（横向满屏，纵向居中）
                svg.style.left = `${(targetWidth - scaledWidth) / 2}px`;
                svg.style.top = `${(targetHeight - scaledHeight) / 2}px`;
                svg.style.transform = 'none'; // 清除可能的transform

                console.log('[LottieHelper] SVG style applied', {
                    left: svg.style.left,
                    top: svg.style.top,
                    width: svg.style.width,
                    height: svg.style.height,
                    minWidth: svg.style.minWidth,
                    minHeight: svg.style.minHeight,
                    viewBox: svg.getAttribute('viewBox'),
                    preserveAspectRatio: svg.getAttribute('preserveAspectRatio')
                });
            }
        });
        
        // 监听完成事件
        if (!loop && this.onCompleteCallback) {
            this.animation.addEventListener('complete', () => {
                if (this.onCompleteCallback) {
                    this.onCompleteCallback();
                }
            });
        }
    }

    /**
     * 停止并销毁动画
     */
    destroy(): void {
        if (this.animation) {
            this.animation.destroy();
            this.animation = null;
        }
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.onCompleteCallback = null;
    }

    /**
     * 设置透明度
     */
    setAlpha(alpha: number): void {
        this.container.style.opacity = alpha.toString();
    }

    /**
     * 获取动画容器
     */
    getContainer(): HTMLDivElement {
        return this.container;
    }

    /**
     * 获取动画实例
     */
    getAnimation(): AnimationItem | null {
        return this.animation;
    }
}
