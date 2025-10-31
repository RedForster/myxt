import { Scene } from 'phaser';

/**
 * 基础实体类
 * 所有游戏对象的基类，提供生命值管理和基础功能
 */
export abstract class Entity extends Phaser.GameObjects.Sprite {
    protected hp: number;
    protected maxHp: number;
    protected healthBar: Phaser.GameObjects.Graphics;

    constructor(scene: Scene, x: number, y: number, texture: string, hp: number) {
        
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        scene.physics.world.enable(this);
        
        
        this.hp = hp;
        this.maxHp = hp;
        
        // 创建生命值条
        this.healthBar = scene.add.graphics();
        this.updateHealthBar();
        
    }

    /**
     * 受到伤害
     * @param damage 伤害值
     */
    public receiveDamage(damage: number): void {
        // 检查实体是否仍然活跃
        if (!this.active || !this.scene || this.hp <= 0) {
            return;
        }
        
        const oldHp = this.hp;
        this.hp = Math.max(0, this.hp - damage);
        this.updateHealthBar();
        
        if (this.hp <= 0) {
            this.onDestroy();
        }
    }

    /**
     * 获取当前生命值
     */
    public getHp(): number {
        return this.hp;
    }

    /**
     * 获取最大生命值
     */
    public getMaxHp(): number {
        return this.maxHp;
    }

    /**
     * 检查是否存活
     */
    public isAlive(): boolean {
        return this.hp > 0;
    }

    /**
     * 更新生命值条显示
     */
    protected updateHealthBar(): void {
        if (!this.healthBar || !this.active) return;
        
        this.healthBar.clear();
        
        // 使用固定宽度而不是this.width，确保PNG图片显示正常
        const barWidth = 60;
        const barHeight = 8;
        const x = this.x - barWidth / 2;
        const y = this.y - 40; // 固定偏移量
        
        
        // 背景条
        this.healthBar.fillStyle(0x000000, 0.7);
        this.healthBar.fillRect(x, y, barWidth, barHeight);
        
        // 生命值条
        const healthPercent = this.hp / this.maxHp;
        const healthColor = healthPercent > 0.3 ? 0x2ecc71 : 0xe74c3c;
        this.healthBar.fillStyle(healthColor);
        this.healthBar.fillRect(x, y, barWidth * healthPercent, barHeight);
    }

    /**
     * 实体销毁时的处理
     * 子类可以重写此方法来添加死亡动画
     */
    protected onDestroy(): void {
        // 不再立即销毁血条，留给子类处理
        // 注意：这里不能直接调用destroyEntity()，因为子类需要处理死亡动画
        this.destroy();
    }

    /**
     * 实际销毁实体的方法
     * 供死亡动画完成后调用
     */
    protected destroyEntity(): void {
        
        // 禁用物理体
        if (this.body) {
            (this.body as Phaser.Physics.Arcade.Body).enable = false;
        }
        
        // 从所有物理组中移除
        if (this.parentContainer) {
        }
        
        if (this.healthBar) {
            this.healthBar.destroy();
        } else {
        }
        
        // 确保从场景中完全移除
        this.destroy();
    }

    /**
     * 更新方法，子类应重写
     * @param time 当前时间
     * @param delta 时间增量
     * @param enemiesVisible 屏幕上是否有敌人可见
     */
    public update(time: number, delta: number, enemiesVisible: boolean = true): void {
        // 只在实体存活且血条存在时更新血条
        if (this.active && this.hp > 0 && this.healthBar) {
            this.updateHealthBar();
        }
    }
}