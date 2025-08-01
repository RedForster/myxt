import { Scene } from 'phaser';
import { Entity } from './Entity';
import { Tower } from './Tower';
import { ImmuneOrgan } from './ImmuneOrgan';
import { EnemyConfig } from '../config/UnitsConfig';

/**
 * 敌人类
 * 实现移动、攻击和目标搜寻功能
 */
export class Enemy extends Entity {
    protected config: EnemyConfig;
    protected speed: number;
    protected reward: number;
    protected attackDamage: number;
    protected attackRange: number;
    protected fireRate: number;
    protected targetedBySlots: number;
    
    private target: Tower | ImmuneOrgan | null = null;
    protected state: 'moving' | 'attacking' = 'moving';
    private nextAttack: number = 0;
    private nextSearch: number = 0;
    private targetedBy: Set<Tower> = new Set();
    public isKnockback: boolean = false;

    constructor(scene: Scene, x: number, y: number, enemyConfig: EnemyConfig) {
        console.log(`Enemy constructor: Starting enemy creation at (${x}, ${y})`);
        console.log(`Enemy constructor: Enemy config:`, enemyConfig);
        
        super(scene, x, y, enemyConfig.texture, enemyConfig.hp);
        
        console.log(`Enemy constructor: Super constructor completed`);
        console.log(`Enemy constructor: Initial state - active: ${this.active}, visible: ${this.visible}, alpha: ${this.alpha}, texture: ${this.texture}`);
        
        this.config = enemyConfig;
        this.speed = enemyConfig.speed;
        this.reward = enemyConfig.reward;
        this.attackDamage = enemyConfig.damage;
        this.attackRange = enemyConfig.attackRange;
        this.fireRate = enemyConfig.fireRate;
        this.targetedBySlots = enemyConfig.targetedBySlots;
        
        console.log(`Enemy constructor: Properties set, configuring physics`);
        
        // 设置物理体
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setCircle(this.width / 2);
            console.log(`Enemy constructor: Physics body configured, width: ${this.width}, height: ${this.height}`);
        } else {
            console.error(`Enemy constructor: Physics body not found!`);
        }
        
        // 强制设置可见性和位置
        this.setVisible(true);
        this.setActive(true);
        this.setPosition(x, y);
        
        console.log(`Enemy constructor: Enemy creation completed - active: ${this.active}, visible: ${this.visible}, position: (${this.x}, ${this.y})`);
    }

    /**
     * 设置目标
     */
    public setTarget(target: Tower | ImmuneOrgan): void {
        if (this.target && this.target !== target) {
            this.target.removeAttacker(this);
        }
        
        this.target = target;
        if (target) {
            target.addAttacker(this);
            this.state = 'moving';
        }
    }

    /**
     * 清除目标
     */
    public clearTarget(): void {
        if (this.target) {
            this.target.removeAttacker(this);
            this.target = null;
        }
    }

    /**
     * 添加锁定此敌人的塔
     */
    public addTargetedBy(tower: Tower): void {
        this.targetedBy.add(tower);
    }

    /**
     * 移除锁定此敌人的塔
     */
    public removeTargetedBy(tower: Tower): void {
        this.targetedBy.delete(tower);
    }

    /**
     * 检查是否可以被锁定（槽位系统）
     */
    public canBeTargeted(): boolean {
        return this.targetedBy.size < this.targetedBySlots;
    }

    /**
     * 寻找最近的攻击目标
     */
    public findTarget(): void {
        const gameScene = this.scene as any;
        if (!gameScene.getAllTargets) {
            //console.log('Enemy findTarget: getAllTargets method not found');
            return;
        }
        
        const potentialTargets = gameScene.getAllTargets();
        //console.log(`Enemy findTarget: Found ${potentialTargets.length} potential targets`);
        
        let closestTarget: Tower | ImmuneOrgan | null = null;
        let closestDistance = Infinity;
        
        for (const target of potentialTargets) {
            if (target.active && !target.isAttractionSlotsFull()) {
                const distance = Phaser.Math.Distance.Between(
                    this.x, this.y, target.x, target.y
                );
                //console.log(`Enemy findTarget: Target at distance ${distance}, attraction slots full: ${target.isAttractionSlotsFull()}`);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestTarget = target;
                }
            } else {
                //console.log(`Enemy findTarget: Target skipped, active: ${target.active}, attraction slots full: ${target.isAttractionSlotsFull()}`);
            }
        }
        
        if (closestTarget) {
            //console.log(`Enemy findTarget: Setting closest target at distance ${closestDistance}`);
            this.setTarget(closestTarget);
        } else {
            // 如果没有找到合适的目标，尝试攻击免疫器官
            const organ = gameScene.getImmuneOrgan();
            if (organ && organ.active && !organ.isAttractionSlotsFull()) {
                //console.log('Enemy findTarget: No suitable targets available, targeting immune organ');
                this.setTarget(organ);
            } else {
                //console.log('Enemy findTarget: No targets available, including immune organ');
            }
        }
    }

    /**
     * 攻击目标
     */
    private attackTarget(time: number): void {
        if (!this.target) {
            //console.log('Enemy attackTarget: No target');
            return;
        }
        
        if (time <= this.nextAttack) {
            // 不打印这个日志，因为它会太频繁
            return;
        }
        
        //console.log(`Enemy attackTarget: Attacking target at position (${this.target.x}, ${this.target.y}), damage: ${this.attackDamage}`);
        
        // 再次检查target是否有效，防止在异步环境中被清除
        if (this.target && this.target.active) {
            // 使用子弹攻击，而不是直接造成伤害
            const gameScene = this.scene as any;
            if (gameScene.getProjectileFromPool) {
                const projectile = gameScene.getProjectileFromPool(this.x, this.y);
                if (projectile) {
                    // 设置子弹为敌人子弹，使用较慢的速度
                    projectile.fire(this.target, this.attackDamage, 400, true);
                    
                    // 旋转敌人朝向目标
                    this.rotation = Phaser.Math.Angle.Between(
                        this.x, this.y,
                        this.target.x, this.target.y
                    );
                    //console.log(`Enemy attackTarget: Fired projectile, next attack in ${this.fireRate}ms`);
                }
            } else {
                // 如果无法获取子弹，则直接造成伤害
                if (this.target.receiveDamage) {
                    this.target.receiveDamage(this.attackDamage);
                    console.log(`Enemy attackTarget: Direct damage dealt, next attack in ${this.fireRate}ms`);
                }
            }
        } else {
            //console.log('Enemy attackTarget: Target is not active');
        }
        this.nextAttack = time + this.fireRate;
    }

    /**
     * 移动到玩家区域时对玩家造成伤害
     */
    private damagePlayer(): void {
        const gameScene = this.scene as any;
        if (gameScene.damagePlayer) {
            gameScene.damagePlayer(this.config.damageToPlayer);
        }
        
        // 给予击杀奖励
        if (gameScene.events) {
            gameScene.events.emit('enemyReachedGoal', { reward: this.reward });
        }
        
        this.onDestroy();
    }

    /**
     * 更新敌人状态
     * @param time 当前时间
     * @param delta 时间增量
     * @param enemiesVisible 屏幕上是否有敌人可见，对敌人来说不影响射击
     */
    public update(time: number, delta: number, enemiesVisible: boolean = true): void {
        super.update(time, delta);
        
        if (!this.active) return;
        
        // 添加调试信息
        if (Math.floor(time / 1000) !== Math.floor((this.nextSearch || 0) / 1000)) {
            console.log(`Enemy update: Position (${this.x.toFixed(1)}, ${this.y.toFixed(1)}), state: ${this.state}, visible: ${this.visible}, active: ${this.active}`);
        }
        
        // 检查是否到达玩家区域
        const gameScene = this.scene as any;
        const gameWidth = gameScene.gameWidth || this.scene.scale.width * 0.75;
        if (this.x >= gameWidth) {
            //console.log(`Enemy update: Reached player area at x=${this.x}, damaging player`);
            this.damagePlayer();
            return;
        }
        
        // 如果处于击退状态，不进行正常的状态机处理
        if (this.isKnockback) {
            return;
        }
        
        // 重新寻找目标
        if ((!this.target || !this.target.active) && time > this.nextSearch) {
            //console.log(`Enemy update: No target or inactive target, finding new target at time ${time}`);
            this.findTarget();
            this.nextSearch = time + 500; // 每500ms搜索一次
        }
        
        // 状态机处理
        if (this.state === 'moving' && this.target) {
            // 移动到目标
            this.scene.physics.moveToObject(this, this.target, this.speed);
            
            // 检查是否到达攻击范围
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y, this.target.x, this.target.y
            );
            
            // 每秒只打印一次位置信息，避免日志过多
            if (Math.floor(time / 1000) !== Math.floor(this.nextSearch / 1000)) {
                console.log(`Enemy update: Moving to target at distance ${distance}, attack range: ${this.attackRange}, target: (${this.target.x}, ${this.target.y})`);
            }
            
            if (distance <= this.attackRange) {
                //console.log(`Enemy update: Reached attack range (${this.attackRange}), switching to attacking state`);
                this.state = 'attacking';
                const body = this.body as Phaser.Physics.Arcade.Body;
                body.setVelocity(0, 0);
            }
        } else if (this.state === 'attacking') {
            // 每秒只打印一次状态信息
            if (Math.floor(time / 1000) !== Math.floor(this.nextSearch / 1000)) {
                console.log(`Enemy update: In attacking state at position (${this.x}, ${this.y})`);
            }
            // 敌人总是攻击，不受屏幕上是否有敌人的影响
            this.attackTarget(time);
        } else {
            // 如果没有目标，向右移动
            if (this.state === 'moving' && !this.target) {
                const body = this.body as Phaser.Physics.Arcade.Body;
                body.setVelocity(this.speed, 0);
                if (Math.floor(time / 1000) !== Math.floor((this.nextSearch || 0) / 1000)) {
                    console.log(`Enemy update: No target, moving right at speed ${this.speed}`);
                }
            }
        }
    }

    /**
     * 获取奖励值
     */
    public getReward(): number {
        return this.reward;
    }

    /**
     * 销毁时处理
     */
    protected onDestroy(): void {
        this.clearTarget();
        
        // 清除所有锁定关系
        this.targetedBy.forEach(tower => {
            if (tower.active) {
                tower.clearTarget();
            }
        });
        
        // 发送击杀事件
        if (this.isAlive() && this.scene.events) {
            this.scene.events.emit('enemyDefeated', { reward: this.reward });
        }
        
        super.onDestroy();
    }
}