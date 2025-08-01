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
        console.log(`Entity constructor: Starting entity creation at (${x}, ${y}) with texture ${texture}`);
        
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        scene.physics.world.enable(this);
        
        console.log(`Entity constructor: Physics enabled - body exists: ${!!this.body}`);
        
        this.hp = hp;
        this.maxHp = hp;
        
        // 创建生命值条
        this.healthBar = scene.add.graphics();
        this.updateHealthBar();
        
        console.log(`Entity constructor: Entity creation completed - active: ${this.active}, visible: ${this.visible}, position: (${this.x}, ${this.y})`);
    }

    /**
     * 受到伤害
     * @param damage 伤害值
     */
    public receiveDamage(damage: number): void {
        const oldHp = this.hp;
        this.hp = Math.max(0, this.hp - damage);
        console.log(`${this.constructor.name} receiveDamage: ${oldHp} -> ${this.hp} (damage: ${damage})`);
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
        if (!this.healthBar) return;
        
        this.healthBar.clear();
        
        const barWidth = this.width;
        const barHeight = 8;
        const x = this.x - barWidth / 2;
        const y = this.y - this.height / 2 - 15;
        
        // 背景条
        this.healthBar.fillStyle(0x000000, 0.7);
        this.healthBar.fillRect(x, y, barWidth, barHeight);
        
        // 生命值条
        const healthPercent = this.hp / this.maxHp;
        const healthColor = healthPercent > 0.3 ? 0x2ecc71 : 0xe74c3c;
        this.healthBar.fillStyle(healthColor);
        this.healthBar.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        // 添加调试信息
        if (this.constructor.name === 'Tower') {
            console.log(`Tower updateHealthBar: hp=${this.hp}/${this.maxHp}, percent=${healthPercent}, pos=(${x},${y})`);
        }
    }

    /**
     * 实体销毁时的处理
     */
    protected onDestroy(): void {
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        this.destroy();
    }

    /**
     * 更新方法，子类应重写
     * @param time 当前时间
     * @param delta 时间增量
     * @param enemiesVisible 屏幕上是否有敌人可见
     */
    public update(time: number, delta: number, enemiesVisible: boolean = true): void {
        this.updateHealthBar();
    }
}