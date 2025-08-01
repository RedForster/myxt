import { Scene } from 'phaser';
import { Entity } from './Entity';
import { Enemy } from './Enemy';
import { OrganConfig } from '../config/UnitsConfig';

/**
 * 免疫器官类
 * 游戏中的核心防御单位，可以升级并生产资源
 */
export class ImmuneOrgan extends Entity {
    protected config: OrganConfig;
    protected level: number;
    protected attractionSlots: number;
    
    private attackers: Set<Enemy> = new Set();
    private resourceGenTimer: number = 0;
    private resourceGenInterval: number = 1000; // 1秒生成一次资源

    constructor(scene: Scene, x: number, y: number, organConfig: OrganConfig) {
        super(scene, x, y, organConfig.texture, organConfig.baseHp);
        
        this.config = organConfig;
        this.level = organConfig.initialLevel;
        this.attractionSlots = organConfig.attractionSlots;
        
        // 重新计算生命值
        this.maxHp = this.calculateMaxHp();
        this.hp = this.maxHp;
        
        // 设置物理体
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCircle(this.width / 2);
        body.setImmovable(true);
    }

    /**
     * 计算最大生命值
     */
    private calculateMaxHp(): number {
        return this.config.baseHp + this.config.hpPerLevel * (this.level - 1);
    }

    /**
     * 计算资源生成速度
     */
    public calculateResourceGen(): number {
        return this.config.baseResourceGen + this.config.resourceGenPerLevel * (this.level - 1);
    }

    /**
     * 升级器官
     */
    public upgrade(): boolean {
        if (this.level >= this.config.maxLevel) {
            return false;
        }
        
        this.level++;
        this.maxHp = this.calculateMaxHp();
        this.hp = this.maxHp; // 升级后恢复满血
        
        // 发送升级事件
        if (this.scene.events) {
            this.scene.events.emit('organUpgraded', {
                level: this.level,
                hp: this.hp,
                maxHp: this.maxHp,
                resourceGen: this.calculateResourceGen()
            });
        }
        
        return true;
    }

    /**
     * 获取当前等级
     */
    public getLevel(): number {
        return this.level;
    }

    /**
     * 获取升级消耗
     */
    public getUpgradeCost(): number {
        return this.config.upgradeCost;
    }

    /**
     * 检查是否可以升级
     */
    public canUpgrade(): boolean {
        return this.level < this.config.maxLevel;
    }

    /**
     * 添加攻击者
     */
    public addAttacker(enemy: Enemy): void {
        this.attackers.add(enemy);
    }

    /**
     * 移除攻击者
     */
    public removeAttacker(enemy: Enemy): void {
        this.attackers.delete(enemy);
    }

    /**
     * 检查吸引槽位是否已满
     */
    public isAttractionSlotsFull(): boolean {
        return this.attackers.size >= this.attractionSlots;
    }

    /**
     * 受到伤害
     */
    public receiveDamage(damage: number): void {
        console.log(`ImmuneOrgan receiveDamage: START - Received ${damage} damage, current HP: ${this.hp}, active: ${this.active}, visible: ${this.visible}`);
        
        // 不调用super.receiveDamage，而是自己处理伤害逻辑
        // 这样可以避免调用Entity.onDestroy()
        this.hp = Math.max(0, this.hp - damage);
        this.updateHealthBar();
        
        console.log(`ImmuneOrgan receiveDamage: After damage, HP: ${this.hp}/${this.maxHp}, active: ${this.active}, visible: ${this.visible}`);
        
        // 发送器官受伤事件
        if (this.scene.events) {
            console.log('ImmuneOrgan receiveDamage: Emitting organDamaged event');
            this.scene.events.emit('organDamaged', {
                hp: this.hp,
                maxHp: this.maxHp,
                damage: damage
            });
        } else {
            console.log('ImmuneOrgan receiveDamage: No scene.events available');
        }
        
        // 检查游戏结束
        if (this.hp <= 0 && this.scene.events) {
            console.log('ImmuneOrgan receiveDamage: HP depleted, emitting gameOver event');
            this.scene.events.emit('gameOver', { reason: 'organDestroyed' });
            
            // 设置半透明效果表示受损
            this.setAlpha(0.5);
            console.log(`ImmuneOrgan receiveDamage: Set alpha to 0.5, current alpha: ${this.alpha}`);
        }
        
        console.log(`ImmuneOrgan receiveDamage: END - HP: ${this.hp}, active: ${this.active}, visible: ${this.visible}, alpha: ${this.alpha}`);
    }

    /**
     * 生成资源
     */
    private generateResource(): void {
        const resourceAmount = this.calculateResourceGen();
        
        if (this.scene.events) {
            this.scene.events.emit('resourceGenerated', { amount: resourceAmount });
        }
    }

    /**
     * 更新器官状态
     * @param time 当前时间
     * @param delta 时间增量
     * @param enemiesVisible 屏幕上是否有敌人可见，对资源生成没有影响
     */
    public update(time: number, delta: number, enemiesVisible: boolean = true): void {
        // 检查免疫器官是否仍然存在
        if (!this.active || !this.visible) {
            console.warn(`ImmuneOrgan update: Organ is not active or visible - active: ${this.active}, visible: ${this.visible}`);
        }
        
        // 更新血条位置
        this.updateHealthBar();
        
        // 如果生命值为0，不再生成资源
        if (this.hp <= 0) return;
        
        // 资源生成（不受敌人可见状态影响）
        if (time > this.resourceGenTimer) {
            this.generateResource();
            this.resourceGenTimer = time + this.resourceGenInterval;
        }
    }

    /**
     * 销毁时处理
     * 免疫器官不应该被完全销毁，只需要处理相关逻辑
     */
    protected onDestroy(): void {
        console.log('ImmuneOrgan onDestroy called');
        
        // 通知所有攻击者重新寻找目标
        this.attackers.forEach(enemy => {
            if (enemy.active) {
                enemy.clearTarget();
            }
        });
        
        // 不调用super.onDestroy()，因为那会销毁整个实体
        // 而是只销毁血条，然后发出游戏结束事件
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        
        // 如果生命值为0，发出游戏结束事件
        if (this.hp <= 0 && this.scene.events) {
            this.scene.events.emit('gameOver', { reason: 'organDestroyed' });
        }
    }
}