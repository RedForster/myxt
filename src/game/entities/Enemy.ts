import { Scene } from 'phaser';
import { Entity } from './Entity';
import { Tower } from './Tower';
import { ImmuneOrgan } from './ImmuneOrgan';
import { EnemyConfig } from '../config/UnitsConfig';

/**
 * 动画状态枚举
 */
export enum EnemyAnimationState {
    IDLE = 'idle',
    MOVE = 'move',
    ATTACK = 'attack',
    DEATH = 'death'
}

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
    
    // 动画系统
    private animationState: EnemyAnimationState = EnemyAnimationState.MOVE;
    private isUsingSpritesheet: boolean = false;

    constructor(scene: Scene, x: number, y: number, enemyConfig: EnemyConfig) {
        
        // 尝试使用移动纹理，如果不存在则使用基础纹理
        const textureKey = scene.textures.exists(`${enemyConfig.texture}_move`) ? 
                          `${enemyConfig.texture}_move` : enemyConfig.texture;
        
        super(scene, x, y, textureKey, enemyConfig.hp);
        
        
        this.config = enemyConfig;
        this.speed = enemyConfig.speed;
        this.reward = enemyConfig.reward;
        this.attackDamage = enemyConfig.damage;
        this.attackRange = enemyConfig.attackRange;
        this.fireRate = enemyConfig.fireRate;
        this.targetedBySlots = enemyConfig.targetedBySlots;
        
        
        // 设置优化的物理体
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            // 使用更精确的碰撞体尺寸
            const collisionRadius = this.getOptimalCollisionRadius();
            body.setCircle(collisionRadius);
            
            // 移除阻尼和弹性设置，避免与平滑控制冲突
            // body.setDrag(0.98);  // 移除阻尼
            // body.setBounce(0.02); // 移除弹性
            
            // 设置合理的最大速度
            body.setMaxVelocity(this.speed * 1.2);
            
            // 启用边界碰撞
            body.setCollideWorldBounds(true);
            
            // 初始速度设为0，让update方法平滑控制
            body.setVelocity(0, 0);
        }
        
        // 强制设置可见性和位置
        this.setVisible(true);
        this.setActive(true);
        this.setPosition(x, y);
        
        // 设置动画系统
        this.setupAnimations();
        
    }

    /**
     * 获取最优碰撞体半径
     */
    private getOptimalCollisionRadius(): number {
        // 基于视觉尺寸和游戏需求计算
        const visualSize = Math.max(this.width, this.height);
        const baseRadius = visualSize / 2;
        
        // 根据敌人类型调整碰撞体大小
        let sizeMultiplier = 1.0;
        
        // 普通病菌 - 稍微增大碰撞体以确保良好的碰撞检测
        if (this.config.id === 'commonBacteria') {
            sizeMultiplier = 1.15;
        }
        
        // 可以根据其他敌人类型进一步调整
        // if (this.config.id === 'fastEnemy') {
        //     sizeMultiplier = 1.05;
        // }
        
        return baseRadius * sizeMultiplier;
    }

    /**
     * 设置动画系统
     */
    private setupAnimations(): void {
        // 检查是否有精灵图可用
        const moveSpritesheetKey = `${this.config.texture}_move_spritesheet`;
        const attackSpritesheetKey = `${this.config.texture}_attack_spritesheet`;
        
        if (this.scene.textures.exists(moveSpritesheetKey)) {
            this.isUsingSpritesheet = true;
            this.setupSpritesheetAnimations();
        } else {
            this.isUsingSpritesheet = false;
            this.setupSingleFrameAnimations();
        }
    }
    
    /**
     * 设置精灵图动画
     */
    private setupSpritesheetAnimations(): void {
        const moveKey = `${this.config.texture}_move_spritesheet`;
        const attackKey = `${this.config.texture}_attack_spritesheet`;
        
        // 默认播放移动动画
        if (this.scene.anims.exists(`${this.config.texture}_move`)) {
            this.play(`${this.config.texture}_move`);
        }
    }
    
    /**
     * 设置单帧动画
     */
    private setupSingleFrameAnimations(): void {
        // 设置默认移动纹理
        const moveTexture = `${this.config.texture}_move`;
        if (this.scene.textures.exists(moveTexture)) {
            this.setTexture(moveTexture);
            // 启动移动动画
            this.startMoveAnimation();
        } else {
            // 如果没有找到移动纹理，使用基础纹理
            if (this.scene.textures.exists(this.config.texture)) {
                this.setTexture(this.config.texture);
                this.startMoveAnimation();
            }
        }
    }
    
    /**
     * 切换动画状态
     */
    public setAnimationState(state: EnemyAnimationState): void {
        if (this.animationState === state) return;
        
        this.animationState = state;
        
        if (this.isUsingSpritesheet) {
            this.playSpritesheetAnimation(state);
        } else {
            this.playSingleFrameAnimation(state);
        }
    }
    
    /**
     * 播放精灵图动画
     */
    private playSpritesheetAnimation(state: EnemyAnimationState): void {
        const animKey = `${this.config.texture}_${state}`;
        
        if (this.scene.anims.exists(animKey)) {
            this.play(animKey);
        }
    }
    
    /**
     * 播放单帧动画
     */
    private playSingleFrameAnimation(state: EnemyAnimationState): void {
        // 使用初始化时确定的纹理，不再切换纹理
        // 根据状态启动相应的动画
        switch (state) {
            case EnemyAnimationState.MOVE:
                this.startMoveAnimation();
                break;
            case EnemyAnimationState.ATTACK:
                this.startAttackAnimation();
                break;
            case EnemyAnimationState.IDLE:
                this.startIdleAnimation();
                break;
            case EnemyAnimationState.DEATH:
                this.startDeathAnimation();
                break;
        }
    }
    
    /**
     * 获取当前动画状态
     */
    public getAnimationState(): EnemyAnimationState {
        return this.animationState;
    }
    
    /**
     * 播放死亡动画
     */
    public playDeathAnimation(): void {
        this.setAnimationState(EnemyAnimationState.DEATH);
        
        // 如果是精灵图动画，监听动画完成事件
        if (this.isUsingSpritesheet) {
            // 为精灵图动画也添加血条淡出效果
            if (this.healthBar) {
                this.scene.tweens.add({
                    targets: this.healthBar,
                    alpha: { from: 1, to: 0 },
                    duration: 500,
                    ease: 'Power2.easeIn'
                });
            }
            
            this.on('animationcomplete', () => {
                if (this.animationState === EnemyAnimationState.DEATH) {
                    this.destroyEntity();
                }
            });
        } else {
            // 单帧动画，使用tween动画
            this.startDeathAnimation();
        }
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
                return;
        }
        
        const potentialTargets = gameScene.getAllTargets();
        
        let closestTarget: Tower | ImmuneOrgan | null = null;
        let closestDistance = Infinity;
        
        for (const target of potentialTargets) {
            if (target && target.active && (!target.isAttractionSlotsFull || !target.isAttractionSlotsFull())) {
                const distance = Phaser.Math.Distance.Between(
                    this.x, this.y, target.x, target.y
                );
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestTarget = target;
                }
            }
        }
        
        if (closestTarget) {
            this.setTarget(closestTarget);
        } else {
            // 如果没有找到合适的目标，尝试攻击免疫器官
            const organ = gameScene.getImmuneOrgan();
            if (organ && organ.active) {
                this.setTarget(organ);
            } else {
            }
        }
    }

    /**
     * 攻击目标
     */
    private attackTarget(time: number): void {
        if (!this.target) {
            return;
        }
        
        if (time <= this.nextAttack) {
            return;
        }
        
        
        // 再次检查target是否有效，防止在异步环境中被清除
        if (this.target && this.target.active) {
            // 切换到攻击状态
            this.setAnimationState(EnemyAnimationState.ATTACK);
            
            // 使用子弹攻击，而不是直接造成伤害
            const gameScene = this.scene as any;
            if (gameScene.getProjectileFromPool) {
                    const projectile = gameScene.getProjectileFromPool(this.x, this.y);
                if (projectile) {
                    // 设置子弹为敌人子弹，使用较慢的速度
                    const gameWidth = gameScene.getGameWidth ? gameScene.getGameWidth() : this.scene.scale.width * 0.75;
                    // 如果是边界线，将射弹目标设置在边界线上
                    const targetObj = (this.target as any).isBoundaryLine ? 
                        { x: gameWidth - 10, y: this.target.y } : 
                        this.target;
                    
                    projectile.fire(targetObj, this.attackDamage, 400, true, this.attackRange);
                    
                    // 旋转敌人朝向目标
                    this.rotation = Phaser.Math.Angle.Between(
                        this.x, this.y,
                        this.target.x, this.target.y
                    );
                } else {
                }
            } else {
                // 如果无法获取子弹，则直接造成伤害
                if (this.target.receiveDamage) {
                    this.target.receiveDamage(this.attackDamage);
                }
            }
        } else {
        }
        this.nextAttack = time + this.fireRate;
    }

    /**
     * 到达右侧底线时攻击底线
     */
    private damagePlayer(): void {
        const gameScene = this.scene as any;
        
        // 切换到攻击状态
        this.setAnimationState(EnemyAnimationState.ATTACK);
        this.state = 'attacking';
        
        // 停止移动
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setVelocity(0, 0);
        }
        
        // 获取游戏场景实例，对底线发起攻击
        if (gameScene.damagePlayer) {
            gameScene.damagePlayer(this.attackDamage);
            
            // 添加攻击特效
            if (this.scene) {
                this.scene.time.delayedCall(500, () => {
                    // 攻击后自我销毁
                    if (gameScene.events) {
                        gameScene.events.emit('enemyReachedGoal', { reward: this.reward });
                    }
                    this.onDestroy();
                });
            } else {
                // 如果场景已经不存在，直接销毁
                if (gameScene.events) {
                    gameScene.events.emit('enemyReachedGoal', { reward: this.reward });
                }
                this.onDestroy();
            }
        } else {
            // 如果没有damagePlayer方法，直接销毁
            if (gameScene.events) {
                gameScene.events.emit('enemyReachedGoal', { reward: this.reward });
            }
            this.onDestroy();
        }
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
        
        // 调试信息：每60帧打印一次速度和位置
        if (time % 1000 < 16) {
            const body = this.body as Phaser.Physics.Arcade.Body;
            if (body) {
                console.log(`Enemy ${this.x.toFixed(0)},${this.y.toFixed(0)} vel:${body.velocity.x.toFixed(1)},${body.velocity.y.toFixed(1)} state:${this.state}`);
            }
        }
        
        // 检查是否到达玩家区域
        const gameScene = this.scene as any;
        const gameWidth = gameScene.gameWidth || this.scene.scale.width * 0.75;
        
        // 如果已经是攻击状态且在边界线，继续攻击
        if (this.state === 'attacking' && this.x >= gameWidth - 10) {
            if (time > this.nextAttack && gameScene.damagePlayer) {
                gameScene.damagePlayer(this.attackDamage);
                this.nextAttack = time + this.fireRate;
                
                // 显示攻击动画
                this.setAnimationState(EnemyAnimationState.ATTACK);
                this.scene.time.delayedCall(250, () => {
                    if (this.active) {
                        this.setAnimationState(EnemyAnimationState.IDLE);
                    }
                });
            }
            return;
        }
        
        // 检查是否到达边界线
        if (this.x >= gameWidth - 10 && this.state === 'moving') {
            // 尝试寻找边界线目标
            if (gameScene.boundaryLine) {
                // 将边界线设为目标
                this.target = gameScene.boundaryLine;
                this.state = 'attacking';
                
                // 不直接停止，让平滑减速处理
                
                // 立即进行第一次攻击
                if (gameScene.damagePlayer) {
                    gameScene.damagePlayer(this.attackDamage);
                    this.nextAttack = time + this.fireRate;
                    this.setAnimationState(EnemyAnimationState.ATTACK);
                }
            } else {
                // 如果找不到边界线对象，则使用旧的damagePlayer逻辑
                this.damagePlayer();
            }
            return;
        }
        
          
        // 重新寻找目标
        if ((!this.target || !this.target.active) && time > this.nextSearch) {
            //onsole.log(`Enemy update: No target or inactive target, finding new target at time ${time}`);
            this.findTarget();
            this.nextSearch = time + 500; // 每500ms搜索一次
        }
        
        // 状态机处理 - 统一使用速度控制，避免冲突
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;
        
        if (this.state === 'moving' && this.target) {
            // 获取游戏场景实例
            const gameScene = this.scene as any;
            const isWalkableMethod = gameScene.isPositionWalkable;
            
            // 计算向目标移动的方向
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            let targetVelocityX = Math.cos(angle) * this.speed;
            let targetVelocityY = Math.sin(angle) * this.speed;
            
            // 检查是否需要避障
            if (isWalkableMethod && typeof isWalkableMethod === 'function') {
                // 预测下一步位置
                const nextX = this.x + targetVelocityX * (1/60); // 假设60fps
                const nextY = this.y + targetVelocityY * (1/60);
                
                // 如果下一步不可通行，寻找替代方向
                if (!gameScene.isPositionWalkable(nextX, nextY)) {
                    // 尝试8个方向，选择最接近目标且可通行的方向
                    const directions = [
                        { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: -1, y: 1 },
                        { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 }
                    ];
                    
                    let bestDirection = null;
                    let bestDistance = Infinity;
                    
                    for (const dir of directions) {
                        const testX = this.x + dir.x * this.speed * (1/60);
                        const testY = this.y + dir.y * this.speed * (1/60);
                        
                        if (gameScene.isPositionWalkable(testX, testY)) {
                            const distance = Phaser.Math.Distance.Between(
                                testX, testY, this.target.x, this.target.y
                            );
                            
                            if (distance < bestDistance) {
                                bestDistance = distance;
                                bestDirection = dir;
                            }
                        }
                    }
                    
                    // 如果找到可通行方向，使用该方向
                    if (bestDirection) {
                        targetVelocityX = bestDirection.x * this.speed;
                        targetVelocityY = bestDirection.y * this.speed;
                    } else {
                        // 如果被完全卡住，停止移动
                        targetVelocityX = 0;
                        targetVelocityY = 0;
                    }
                }
            }
            
            // 平滑过渡到目标速度，避免突变
            const smoothingFactor = 0.2; // 调整这个值来控制平滑度
            body.velocity.x += (targetVelocityX - body.velocity.x) * smoothingFactor;
            body.velocity.y += (targetVelocityY - body.velocity.y) * smoothingFactor;
            
            // 切换到移动动画状态
            this.setAnimationState(EnemyAnimationState.MOVE);
            
            // 检查是否到达攻击范围
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y, this.target.x, this.target.y
            );
            
            if (distance <= this.attackRange) {
                this.state = 'attacking';
                // 不直接设为0，让平滑减速处理
            }
        } else if (this.state === 'attacking') {
            // 攻击状态 - 平滑减速到停止
            const smoothingFactor = 0.3;
            body.velocity.x += (0 - body.velocity.x) * smoothingFactor;
            body.velocity.y += (0 - body.velocity.y) * smoothingFactor;
            
            // 敌人总是攻击，不受屏幕上是否有敌人的影响
            this.attackTarget(time);
        } else {
            // 没有目标时的默认行为 - 向右移动
            if (this.state === 'moving' && !this.target) {
                // 获取游戏场景实例
                const gameScene = this.scene as any;
                const isWalkableMethod = gameScene.isPositionWalkable;
                
                let targetVelocityX = this.speed;
                let targetVelocityY = 0;
                
                // 检查右侧是否可通行
                if (isWalkableMethod && typeof isWalkableMethod === 'function') {
                    const nextX = this.x + this.speed * (1/60);
                    
                    if (!gameScene.isPositionWalkable(nextX, this.y)) {
                        // 如果不可通行，尝试找到可通行的方向
                        const directions = [
                            { x: 1, y: 1 }, { x: 1, y: -1 }, { x: 0, y: 1 }, { x: 0, y: -1 }
                        ];
                        
                        for (const dir of directions) {
                            const testX = this.x + dir.x * this.speed * (1/60);
                            const testY = this.y + dir.y * this.speed * (1/60);
                            
                            if (gameScene.isPositionWalkable(testX, testY)) {
                                targetVelocityX = dir.x * this.speed;
                                targetVelocityY = dir.y * this.speed;
                                break;
                            }
                        }
                    }
                }
                
                // 平滑过渡到目标速度
                const smoothingFactor = 0.2;
                body.velocity.x += (targetVelocityX - body.velocity.x) * smoothingFactor;
                body.velocity.y += (targetVelocityY - body.velocity.y) * smoothingFactor;
                
                // 切换到移动动画状态
                this.setAnimationState(EnemyAnimationState.MOVE);
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
     * 应用击退效果
     * @param knockbackForce 击退力度（负数表示向左推）
     */
    public applyKnockback(knockbackForce: number): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body || !this.active) {
            return;
        }
        
        // 应用水平击退力
        body.setVelocityX(knockbackForce);
        
        // 添加一个短暂的减速效果，让击退看起来更自然
        this.scene.time.delayedCall(200, () => {
            if (this.active && body) {
                // 逐渐恢复正常速度
                body.setVelocityX(0);
            }
        });
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
        
        // 发送击杀事件 - 注意：只有在真正存活时才发送奖励
        // 这里检查hp > 0是因为有些敌人可能在到达终点时调用onDestroy
        if (this.hp > 0 && this.scene.events) {
            this.scene.events.emit('enemyDefeated', { reward: this.reward });
        }
        
        // 直接播放死亡动画，跳过super.onDestroy()以避免重复销毁
        this.playDeathAnimation();
    }

    /**
     * 启动移动动画 - 横向伸缩变形效果
     */
    private startMoveAnimation(): void {
        // 检查场景是否可用
        if (!this.scene || !this.active) {
            return;
        }
        
        // 清除之前的动画
        if (this.moveTween) {
            this.moveTween.stop();
        }
        
        // 创建横向伸缩动画
        this.moveTween = this.scene.tweens.add({
            targets: this,
            scaleX: { from: 1, to: 0.8 },
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * 启动攻击动画 - 快速抖动效果
     */
    private startAttackAnimation(): void {
        // 检查场景是否可用
        if (!this.scene || !this.active) {
            return;
        }
        
        // 清除之前的动画
        if (this.moveTween) {
            this.moveTween.stop();
        }
        
        // 创建攻击动画
        this.attackTween = this.scene.tweens.add({
            targets: this,
            scaleX: { from: 1, to: 1.3 },
            scaleY: { from: 1, to: 1.1 },
            duration: 100,
            yoyo: true,
            repeat: 1,
            ease: 'Power2.easeOut',
            onComplete: () => {
                // 攻击动画完成后恢复移动动画
                if (this.active && this.animationState === EnemyAnimationState.ATTACK) {
                    this.startMoveAnimation();
                }
            }
        });
    }

    /**
     * 启动待机动画 - 轻微呼吸效果
     */
    private startIdleAnimation(): void {
        // 检查场景是否可用
        if (!this.scene || !this.active) {
            return;
        }
        
        // 清除之前的动画
        if (this.moveTween) {
            this.moveTween.stop();
        }
        
        // 创建待机动画
        this.moveTween = this.scene.tweens.add({
            targets: this,
            scaleX: { from: 1, to: 0.95 },
            scaleY: { from: 1, to: 1.05 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * 启动死亡动画 - 旋转缩小消失
     */
    private startDeathAnimation(): void {
        // 清除之前的动画
        if (this.moveTween) {
            this.moveTween.stop();
        }
        
        // 检查场景是否可用
        if (!this.scene || !this.active) {
            this.destroyEntity();
            return;
        }
        
        // 立即隐藏血条
        if (this.healthBar) {
            this.healthBar.setVisible(false);
            this.healthBar.setActive(false);
        }
        
        // 只对敌人实体进行死亡动画
        this.deathTween = this.scene.tweens.add({
            targets: this,
            scaleX: { from: 1, to: 0 },
            scaleY: { from: 1, to: 0 },
            angle: { from: 0, to: 360 },
            duration: 500,
            ease: 'Power2.easeIn',
            onComplete: () => {
                this.destroyEntity();
            }
        });
    }

    // 动画实例变量
    private moveTween: Phaser.Tweens.Tween | null = null;
    private attackTween: Phaser.Tweens.Tween | null = null;
    private deathTween: Phaser.Tweens.Tween | null = null;
}