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
        
        // 更新纹理以反映当前等级
        this.updateTexture();
        
        // 初始等级可能大于1，应用相应的缩放
        if (this.level > 1) {
            const baseScale = 1.0;
            const scaleIncrementPerLevel = 0.15; // 每升一级增加15%的大小
            const initialScale = baseScale + ((this.level - 1) * scaleIncrementPerLevel);
            this.setScale(initialScale);
        }
        
        // 设置物理体
        const body = this.body as Phaser.Physics.Arcade.Body;
        const radius = (this.width * this.scaleX) / 2;
        body.setCircle(radius);
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
     * 更新纹理以反映当前等级
     */
    private updateTexture(): void {
        // 目前只有level1的图片，所有等级都使用同一张图片
        const textureKey = 'immune_organ_level1';
        
        if (this.scene.textures.exists(textureKey)) {
            this.setTexture(textureKey);
        }
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
        
        // 更新纹理
        this.updateTexture();
        
        // 随着等级增加而增大尺寸
        const baseScale = 1.0;
        const scaleIncrementPerLevel = 0.15; // 每升一级增加15%的大小
        const newScale = baseScale + ((this.level - 1) * scaleIncrementPerLevel);
        this.setScale(newScale);
        
        // 更新物理体大小以匹配新的视觉尺寸
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            // 重新设置圆形碰撞体，半径与缩放后的尺寸成比例
            const scaledWidth = this.width * this.scaleX;
            body.setCircle(scaledWidth / 2, 0, 0);
        }
        
        
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
        
        // 不调用super.receiveDamage，而是自己处理伤害逻辑
        // 这样可以避免调用Entity.onDestroy()
        this.hp = Math.max(0, this.hp - damage);
        this.updateHealthBar();
        
        
        // 发送器官受伤事件
        if (this.scene.events) {
            this.scene.events.emit('organDamaged', {
                hp: this.hp,
                maxHp: this.maxHp,
                damage: damage
            });
        } else {
        }
        
        // 免疫器官生命值为0时，让它在视觉上消失，但不触发游戏结束
        if (this.hp <= 0) {
            // 设置为不可见
            this.setVisible(false);
            // 禁用物理碰撞体
            const body = this.body as Phaser.Physics.Arcade.Body;
            if (body) {
                body.enable = false;
            }
            
            // 销毁血条
            if (this.healthBar) {
                this.healthBar.destroy();
                this.healthBar = null;
            }
            
            // 通知UI器官已被摧毁，但不会导致游戏结束
            if (this.scene.events) {
                this.scene.events.emit('organDestroyed');
            }
            
            // 通知所有攻击者重新寻找目标
            this.attackers.forEach(enemy => {
                if (enemy.active) {
                    enemy.clearTarget();
                }
            });
        }
        
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
            return;
        }
        
        // 如果生命值为0，不再更新或生成资源
        if (this.hp <= 0) {
            return;
        }
        
        // 更新血条位置
        this.updateHealthBar();
        
        // 资源生成（不受敌人可见状态影响）
        if (time > this.resourceGenTimer) {
            this.generateResource();
            this.resourceGenTimer = time + this.resourceGenInterval;
        }
    }
    
    /**
     * 重写基类的血条更新方法，考虑免疫器官的尺寸变化
     */
    protected updateHealthBar(): void {
        if (!this.healthBar || !this.active) return;
        
        this.healthBar.clear();
        
        // 血条宽度根据器官尺寸动态调整
        const scaleMultiplier = Math.max(1.0, this.scaleX);
        const barWidth = 60 * scaleMultiplier;
        const barHeight = 8 * Math.sqrt(scaleMultiplier); // 高度适度增加，但不和宽度成正比
        
        // 计算血条位置，考虑到器官尺寸增大后需要上移
        const x = this.x - barWidth / 2;
        // 血条的Y偏移量随器官大小增加而增加
        const offsetY = 40 + (10 * (this.scaleX - 1));
        const y = this.y - offsetY;
        
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
     * 销毁时处理
     * 免疫器官不应该被完全销毁，只需要处理相关逻辑
     */
    protected onDestroy(): void {
        
        // 通知所有攻击者重新寻找目标
        this.attackers.forEach(enemy => {
            if (enemy.active) {
                enemy.clearTarget();
            }
        });
        
        // 不调用super.onDestroy()，因为那会销毁整个实体
        // 如果血条还存在，则销毁血条
        if (this.healthBar) {
            this.healthBar.destroy();
            this.healthBar = null;
        }
        
        // 免疫器官被销毁时发出通知，但不再触发游戏结束
        if (this.hp <= 0 && this.scene.events) {
            this.scene.events.emit('organDestroyed');
        }
    }
}