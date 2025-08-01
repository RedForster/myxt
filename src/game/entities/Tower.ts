import { Scene } from 'phaser';
import { Entity } from './Entity';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import { TowerConfig } from '../config/UnitsConfig';

/**
 * 防御塔类
 * 实现索敌、攻击和射弹发射功能
 */
export class Tower extends Entity {
    protected config: TowerConfig;
    protected attackRange: number;
    protected fireRate: number;
    protected damage: number;
    protected projectileSpeed: number;
    protected attractionSlots: number;
    
    private target: Enemy | null = null;
    private nextFire: number = 0;
    private nextSearch: number = 0;
    private rangeIndicator: Phaser.GameObjects.Graphics;
    private attackers: Set<Enemy> = new Set();
    
    // 攻击范围传感器（用于优化性能）
    private attackSensor: Phaser.GameObjects.Zone;

    constructor(scene: Scene, x: number, y: number, towerConfig: TowerConfig) {
        super(scene, x, y, towerConfig.texture, towerConfig.hp);
        
        this.config = towerConfig;
        this.attackRange = towerConfig.range;
        this.fireRate = towerConfig.fireRate;
        this.damage = towerConfig.damage;
        this.projectileSpeed = towerConfig.projectileSpeed;
        this.attractionSlots = towerConfig.attractionSlots;
        
        // 设置物理体
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCircle(this.width / 2);
        body.setImmovable(true);
        body.setCollideWorldBounds(true);
        
        this.createAttackSensor();
        this.createRangeIndicator();
    }

    /**
     * 创建攻击范围传感器
     */
    private createAttackSensor(): void {
        this.attackSensor = this.scene.add.zone(this.x, this.y, this.attackRange * 2, this.attackRange * 2);
        this.scene.physics.world.enable(this.attackSensor);
        
        const sensorBody = this.attackSensor.body as Phaser.Physics.Arcade.Body;
        sensorBody.setCircle(this.attackRange);
        
        // 关联回塔对象
        (this.attackSensor as any).parentTower = this;
    }

    /**
     * 创建攻击范围指示器
     */
    private createRangeIndicator(): void {
        this.rangeIndicator = this.scene.add.graphics();
        this.rangeIndicator.lineStyle(2, 0x3498db, 0.3);
        this.rangeIndicator.strokeCircle(this.x, this.y, this.attackRange);
        this.rangeIndicator.setVisible(false); // 默认隐藏
    }

    /**
     * 显示/隐藏攻击范围
     */
    public showRange(visible: boolean): void {
        this.rangeIndicator.setVisible(visible);
    }

    /**
     * 获取攻击传感器
     */
    public getAttackSensor(): Phaser.GameObjects.Zone {
        return this.attackSensor;
    }

    /**
     * 设置目标
     */
    public setTarget(enemy: Enemy): void {
        // 清除旧目标
        if (this.target && this.target !== enemy) {
            this.target.removeTargetedBy(this);
        }
        
        this.target = enemy;
        if (enemy) {
            enemy.addTargetedBy(this);
            
            // 旋转塔朝向目标
            this.rotation = Phaser.Math.Angle.Between(
                this.x, this.y, enemy.x, enemy.y
            );
        }
    }

    /**
     * 清除目标
     */
    public clearTarget(): void {
        if (this.target) {
            this.target.removeTargetedBy(this);
            this.target = null;
        }
    }

    /**
     * 检查是否可以攻击敌人（槽位系统）
     */
    public canTarget(enemy: Enemy): boolean {
        return enemy.canBeTargeted();
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
     * 发射射弹
     */
    private fire(): void {
        if (!this.target || !this.target.active || !this.target.isAlive()) return;
        
        // 从场景获取射弹对象池
        const gameScene = this.scene as any;
        if (gameScene.getProjectileFromPool) {
            const projectile = gameScene.getProjectileFromPool(this.x, this.y);
            if (projectile && projectile.active) {
                projectile.fire(this.target, this.damage, this.projectileSpeed);
                console.log(`Tower fire: Fired projectile at enemy, damage=${this.damage}, speed=${this.projectileSpeed}`);
            } else {
                console.warn('Tower fire: Failed to get active projectile from pool');
            }
        } else {
            console.warn('Tower fire: getProjectileFromPool not found on scene');
        }
    }

    /**
     * 更新塔状态
     * @param time 当前时间
     * @param delta 时间增量
     * @param enemiesVisible 屏幕上是否有敌人可见
     */
    public update(time: number, delta: number, enemiesVisible: boolean = true): void {
        super.update(time, delta);
        
        // 检查目标有效性
        if (this.target && (!this.target.active || !this.target.isAlive() ||
            Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) > this.attackRange)) {
            this.clearTarget();
        }
        
        // 只有当屏幕上有敌人时才攻击
        if (enemiesVisible && this.target && time > this.nextFire) {
            this.fire();
            this.nextFire = time + this.fireRate;
        }
    }

    /**
     * 销毁时清理
     */
    protected onDestroy(): void {
        this.clearTarget();
        
        // 通知所有攻击者重新寻找目标
        this.attackers.forEach(enemy => {
            if (enemy.active) {
                enemy.clearTarget();
            }
        });
        
        if (this.rangeIndicator) {
            this.rangeIndicator.destroy();
        }
        
        if (this.attackSensor) {
            this.attackSensor.destroy();
        }
        
        super.onDestroy();
    }
}