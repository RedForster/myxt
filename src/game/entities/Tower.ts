import { Scene } from 'phaser';
import { Entity } from './Entity';
import { Enemy } from './Enemy';
import { TowerConfig } from '../config/UnitsConfig';

/**
 * 动画状态枚举
 */
export enum TowerAnimationState {
    IDLE = 'idle',
    ATTACK = 'attack',
    PLACEMENT = 'placement'
}

/**
 * 防御塔类
 * 实现索敌、攻击和射弹发射功能
 */
export class Tower extends Entity {
    protected config: TowerConfig;
    protected attackRange: number;
    protected detectionRange: number;
    protected fireRate: number;
    protected damage: number;
    protected projectileSpeed: number;
    protected attractionSlots: number;
    protected canMove: boolean;
    protected moveSpeed: number;
    
    private target: Enemy | null = null;
    private nextFire: number = 0;
    private rangeIndicator: Phaser.GameObjects.Graphics;
    private detectionRangeIndicator: Phaser.GameObjects.Graphics;
    private rangeLabelText: Phaser.GameObjects.Text;
    private targetListText: Phaser.GameObjects.Text;
    private targetLineGraphics: Phaser.GameObjects.Graphics;
    private attackers: Set<Enemy> = new Set();
    
    // 目标评估相关属性
    private targetEvaluationInterval: number = 1000; // 每1000ms评估一次目标，减少目标切换频率
    private lastTargetEvaluation: number = 0;
    private potentialTargets: Set<Enemy> = new Set(); // 潜在目标集合
    
    // 攻击范围传感器（用于优化性能）
    private attackSensor: Phaser.GameObjects.Zone;
    
    // 检测范围传感器（用于索敌）
    private detectSensor: Phaser.GameObjects.Zone;
    
    // 动画系统
    private animationState: TowerAnimationState = TowerAnimationState.IDLE;
    private isUsingSpritesheet: boolean = false;

    constructor(scene: Scene, x: number, y: number, towerConfig: TowerConfig) {
        // 尝试使用移动纹理，如果不存在则使用基础纹理
        const textureKey = scene.textures.exists(`${towerConfig.texture}_move`) ? 
                          `${towerConfig.texture}_move` : towerConfig.texture;
        
        super(scene, x, y, textureKey, towerConfig.hp);
        
        this.config = towerConfig;
        this.attackRange = towerConfig.range;
        this.detectionRange = towerConfig.detectionRange;
        this.fireRate = towerConfig.fireRate;
        this.damage = towerConfig.damage;
        this.projectileSpeed = towerConfig.projectileSpeed;
        this.attractionSlots = towerConfig.attractionSlots;
        this.canMove = towerConfig.canMove ?? false;
        this.moveSpeed = towerConfig.moveSpeed ?? 0;
        
        // 设置优化的物理体
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        // 使用更精确的碰撞体尺寸
        const collisionRadius = this.getOptimalCollisionRadius();
        body.setCircle(collisionRadius);
        
        // 防御塔应该是不可移动的（除非是特殊可移动塔）
        body.setImmovable(!this.canMove);
        body.setCollideWorldBounds(true);
        
        // 设置适当的质量，确保碰撞时的稳定性
        if (this.canMove) {
            body.setMass(1);
        } else {
            body.setMass(3); // 不可移动的塔有更大质量
        }
        
        // 添加轻微阻尼，减少不必要的振荡
        body.setDrag(0.95);
        
        // 创建传感器和指示器
        this.createAttackSensor();
        this.createDetectSensor();
        this.createRangeIndicator();
        this.createDetectionRangeIndicator();
        this.createRangeLabels();
        this.createTargetVisualization();
        this.setupAnimations();
    }

    /**
     * 获取最优碰撞体半径
     */
    private getOptimalCollisionRadius(): number {
        const visualSize = Math.max(this.width, this.height);
        const baseRadius = visualSize / 2;
        
        // 根据塔类型调整碰撞体大小
        let sizeMultiplier = 1.0;
        
        // 中性粒细胞塔 - 标准大小
        if (this.config.id === 'neutrophil') {
            sizeMultiplier = 1.1;
        }
        
        // 可以根据其他塔类型进一步调整
        // if (this.config.id === 'macrophage') {
        //     sizeMultiplier = 1.2;
        // }
        
        return baseRadius * sizeMultiplier;
    }

    /**
     * 设置动画系统
     */
    private setupAnimations(): void {
        // 检查是否有精灵图可用
        const idleSpritesheetKey = `${this.config.texture}_idle_spritesheet`;
        const attackSpritesheetKey = `${this.config.texture}_attack_spritesheet`;
        
        if (this.scene.textures.exists(idleSpritesheetKey)) {
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
        const idleKey = `${this.config.texture}_idle_spritesheet`;
        
        // 创建待机动画
        if (this.scene.anims.exists(`${this.config.texture}_idle`)) {
            this.play(`${this.config.texture}_idle`);
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
            // 启动待机动画
            this.startIdleAnimation();
        } else {
            // 如果没有找到移动纹理，使用基础纹理
            if (this.scene.textures.exists(this.config.texture)) {
                this.setTexture(this.config.texture);
                this.startIdleAnimation();
            }
        }
    }
    
    /**
     * 切换动画状态
     */
    public setAnimationState(state: TowerAnimationState): void {
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
    private playSpritesheetAnimation(state: TowerAnimationState): void {
        const animKey = `${this.config.texture}_${state}`;
        
        if (this.scene.anims.exists(animKey)) {
            this.play(animKey);
        }
    }
    
    /**
     * 播放单帧动画
     */
    private playSingleFrameAnimation(state: TowerAnimationState): void {
        // 使用初始化时确定的纹理，不再切换纹理
        // 根据状态启动相应的动画
        switch (state) {
            case TowerAnimationState.IDLE:
                this.startIdleAnimation();
                break;
            case TowerAnimationState.ATTACK:
                this.startAttackAnimation();
                break;
            case TowerAnimationState.PLACEMENT:
                this.startPlacementAnimation();
                break;
        }
    }
    
    /**
     * 获取当前动画状态
     */
    public getAnimationState(): TowerAnimationState {
        return this.animationState;
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
        
        super.receiveDamage(damage);
        
        // 添加受伤闪烁效果 - 更明显
        if (this.active && this.scene) {
            // 更明显的受伤效果
            this.setTint(0xff0000);
            this.setAlpha(0.7);
            
            // 使用更长的闪烁时间
            this.scene.time.delayedCall(200, () => {
                if (this.active) {
                    this.clearTint();
                    this.setAlpha(1.0);
                    
                    // 二次闪烁增强效果
                    this.scene.time.delayedCall(100, () => {
                        if (this.active) {
                            this.setTint(0xff0000);
                            this.scene.time.delayedCall(100, () => {
                                if (this.active) {
                                    this.clearTint();
                                }
                            });
                        }
                    });
                }
            });
            
        }
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
     * 创建检测范围传感器
     */
    private createDetectSensor(): void {
        this.detectSensor = this.scene.add.zone(this.x, this.y, this.detectionRange * 2, this.detectionRange * 2);
        this.scene.physics.world.enable(this.detectSensor);
        
        const sensorBody = this.detectSensor.body as Phaser.Physics.Arcade.Body;
        sensorBody.setCircle(this.detectionRange);
        
        // 关联回塔对象
        (this.detectSensor as any).parentTower = this;
    }
    
    /**
     * 更新传感器位置
     */
    public updateSensorPosition(): void {
        if (this.attackSensor) {
            this.attackSensor.setPosition(this.x, this.y);
        }
        if (this.detectSensor) {
            this.detectSensor.setPosition(this.x, this.y);
        }
    }
    
    /**
     * 更新范围指示器位置
     */
    public updateRangeIndicator(): void {
        if (this.rangeIndicator && this.rangeIndicator.visible) {
            this.rangeIndicator.setPosition(this.x, this.y);
            this.rangeIndicator.clear();
            this.rangeIndicator.lineStyle(2, 0x3498db, 0.3);
            this.rangeIndicator.strokeCircle(0, 0, this.attackRange);
        }
        
        if (this.detectionRangeIndicator && this.detectionRangeIndicator.visible) {
            this.detectionRangeIndicator.setPosition(this.x, this.y);
            this.detectionRangeIndicator.clear();
            this.detectionRangeIndicator.lineStyle(3, 0xe74c3c, 0.6);
            this.detectionRangeIndicator.strokeCircle(0, 0, this.detectionRange);
        }
        
        // 更新目标可视化位置
        this.updateTargetVisualizationPosition();
    }

    /**
     * 创建攻击范围指示器
     */
    private createRangeIndicator(): void {
        this.rangeIndicator = this.scene.add.graphics();
        this.rangeIndicator.setPosition(this.x, this.y);
        this.rangeIndicator.lineStyle(2, 0x3498db, 0.3);
        this.rangeIndicator.strokeCircle(0, 0, this.attackRange);
        this.rangeIndicator.setVisible(false); // 默认隐藏
    }

    /**
     * 创建检测范围指示器
     */
    private createDetectionRangeIndicator(): void {
        this.detectionRangeIndicator = this.scene.add.graphics();
        this.detectionRangeIndicator.setPosition(this.x, this.y);
        this.detectionRangeIndicator.lineStyle(3, 0xe74c3c, 0.6);
        this.detectionRangeIndicator.strokeCircle(0, 0, this.detectionRange);
        this.detectionRangeIndicator.setVisible(false); // 默认隐藏
    }

    /**
     * 创建范围标签
     */
    private createRangeLabels(): void {
        this.rangeLabelText = this.scene.add.text(
            this.x, 
            this.y + this.height/2 + 10, 
            '', 
            {
                fontSize: '10px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 2, y: 1 }
            }
        ).setOrigin(0.5);
        this.rangeLabelText.setVisible(false);
    }

    /**
     * 创建目标可视化元素
     */
    private createTargetVisualization(): void {
        // 创建目标列表文本
        this.targetListText = this.scene.add.text(
            this.x, 
            this.y - this.height/2 - 20, 
            '', 
            {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 4, y: 2 }
            }
        ).setOrigin(0.5);
        this.targetListText.setVisible(false);
        
        // 创建连线图形
        this.targetLineGraphics = this.scene.add.graphics();
        this.targetLineGraphics.setVisible(false);
    }

    /**
     * 显示/隐藏攻击范围
     */
    public showRange(visible: boolean): void {
        this.rangeIndicator.setVisible(visible);
        this.detectionRangeIndicator.setVisible(visible);
        this.rangeLabelText.setVisible(visible);
        this.updateTargetVisualization(visible);
        
        if (visible) {
            this.updateRangeLabels();
        }
    }

    /**
     * 更新目标可视化
     */
    private updateTargetVisualization(visible: boolean): void {
        if (this.targetListText) {
            this.targetListText.setVisible(visible);
        }
        if (this.targetLineGraphics) {
            this.targetLineGraphics.setVisible(visible);
        }
        
        if (visible) {
            this.updateTargetList();
        }
    }

    /**
     * 更新目标列表显示
     */
    private updateTargetList(): void {
        if (!this.targetListText || !this.targetLineGraphics) return;
        
        // 更新文本位置
        this.targetListText.setPosition(this.x, this.y - this.height/2 - 20);
        
        // 构建目标列表文本
        let targetText = '';
        const targets = [];
        
        // 添加主要目标
        if (this.target && this.target.active) {
            targets.push('主目标');
        }
        
        // 添加攻击者
        if (this.attackers.size > 0) {
            targets.push(`攻击者: ${this.attackers.size}`);
        }
        
        if (targets.length > 0) {
            targetText = targets.join(' | ');
        }
        
        this.targetListText.setText(targetText);
        
        // 更新连线
        this.updateTargetLines();
    }

    /**
     * 更新目标连线
     */
    private updateTargetLines(): void {
        if (!this.targetLineGraphics) return;
        
        this.targetLineGraphics.clear();
        
        // 绘制到主要目标的连线
        if (this.target && this.target.active) {
            this.drawDottedLine(
                this.x, 
                this.y, 
                this.target.x, 
                this.target.y, 
                0x00ff00, // 绿色表示主要目标
                2
            );
        }
        
        // 绘制到攻击者的连线
        this.attackers.forEach(enemy => {
            if (enemy && enemy.active) {
                this.drawDottedLine(
                    this.x, 
                    this.y, 
                    enemy.x, 
                    enemy.y, 
                    0xff6600, // 橙色表示攻击者
                    1
                );
            }
        });
    }

    /**
     * 绘制虚线
     */
    private drawDottedLine(x1: number, y1: number, x2: number, y2: number, color: number, width: number): void {
        const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
        const dashLength = 8;
        const gapLength = 4;
        const totalDashLength = dashLength + gapLength;
        
        this.targetLineGraphics.lineStyle(width, color, 0.8);
        
        let currentDistance = 0;
        while (currentDistance < distance) {
            const startRatio = currentDistance / distance;
            const endRatio = Math.min((currentDistance + dashLength) / distance, 1);
            
            const startX = x1 + (x2 - x1) * startRatio;
            const startY = y1 + (y2 - y1) * startRatio;
            const endX = x1 + (x2 - x1) * endRatio;
            const endY = y1 + (y2 - y1) * endRatio;
            
            this.targetLineGraphics.lineBetween(startX, startY, endX, endY);
            
            currentDistance += totalDashLength;
        }
    }

    /**
     * 更新范围标签
     */
    private updateRangeLabels(): void {
        if (!this.rangeLabelText) return;
        
        this.rangeLabelText.setPosition(this.x, this.y + this.height/2 + 10);
        this.rangeLabelText.setText(`攻击: ${this.attackRange.toFixed(0)}px | 检测: ${this.detectionRange.toFixed(0)}px`);
    }

    /**
     * 更新目标可视化位置
     */
    private updateTargetVisualizationPosition(): void {
        if (this.targetListText && this.targetListText.visible) {
            this.targetListText.setPosition(this.x, this.y - this.height/2 - 20);
        }
        
        if (this.targetLineGraphics && this.targetLineGraphics.visible) {
            this.updateTargetLines();
        }
    }

    /**
     * 获取攻击传感器
     */
    public getAttackSensor(): Phaser.GameObjects.Zone {
        return this.attackSensor;
    }
    
    /**
     * 获取检测传感器
     */
    public getDetectSensor(): Phaser.GameObjects.Zone {
        return this.detectSensor;
    }
    
    /**
     * 获取当前目标
     */
    public getTarget(): Enemy | null {
        return this.target;
    }
    
    /**
     * 检测范围内是否有敌人并触发索敌
     * 用于塔部署后立即检测已经存在的敌人
     * 只检测已经进入屏幕的敌人
     */
    public detectEnemiesInRange(): void {
        // 获取游戏场景以访问敌人组
        const gameScene = this.scene as any;
        if (!gameScene || !gameScene.enemies) return;
        
        // 遍历所有敌人，检查是否有敌人在检测范围内且在屏幕内
        gameScene.enemies.children.each((enemy: Enemy) => {
            if (!enemy || !enemy.active || !enemy.isAlive()) return;
            
            // 检查敌人是否在屏幕内
            if (!this.isEnemyOnScreen(enemy)) return;
            
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            
            if (distance <= this.detectionRange) {                
                // 将敌人添加到塔的潜在目标列表
                this.addPotentialTarget(enemy);
                
                // 如果塔当前没有目标，立即设置目标
                if (!this.getTarget() && this.canTarget(enemy)) {
                    this.setTarget(enemy);
                }
            }
        });
    }

    /**
     * 获取检测范围
     */
    public getDetectionRange(): number {
        return this.detectionRange;
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
            
            // 切换到攻击状态
            this.setAnimationState(TowerAnimationState.ATTACK);
        }
        
        // 更新目标可视化
        this.updateTargetList();
    }

    /**
     * 清除目标
     */
    public clearTarget(): void {
        if (this.target) {
            this.target.removeTargetedBy(this);
            this.target = null;
        }
        
        // 切换回待机状态
        this.setAnimationState(TowerAnimationState.IDLE);
        
        // 更新目标可视化
        this.updateTargetList();
    }
    
    /**
     * 检查敌人是否在屏幕内
     * 敌人需要至少部分进入屏幕才能被锁定
     */
    private isEnemyOnScreen(enemy: Enemy): boolean {
        // 获取敌人的位置和尺寸
        const enemyX = enemy.x;
        const enemyWidth = enemy.width || 50; // 默认宽度
        
        // 检查敌人是否至少有一部分在屏幕内
        // 屏幕左边界是 x = 0，允许敌人有少量身体（如半个身位）在屏幕外
        const leftThreshold = -enemyWidth * 0.3; // 允许30%的身体在屏幕外
        
        // 敌人的右边缘 (x + 半宽) 必须超过左边界阈值
        return enemyX + enemyWidth / 2 >= leftThreshold;
    }
    
    /**
     * 添加潜在目标到评估列表
     * 只添加已经进入屏幕的敌人
     */
    public addPotentialTarget(enemy: Enemy): void {
        if (enemy && enemy.active && enemy.isAlive() && this.isEnemyOnScreen(enemy)) {
            this.potentialTargets.add(enemy);
        }
    }
    
    /**
     * 移除潜在目标
     */
    public removePotentialTarget(enemy: Enemy): void {
        this.potentialTargets.delete(enemy);
    }
    
    /**
     * 评估并选择最优目标
     * 优先选择距离近的敌人作为目标
     * 只锁定已经进入屏幕的敌人
     */
    private evaluateAndSelectTarget(): void {
        // 如果没有潜在目标，直接返回
        if (this.potentialTargets.size === 0) return;
        
        let bestTarget: Enemy | null = null;
        let bestScore = -Infinity;
        
        // 如果当前目标仍然有效且在屏幕内，优先保持当前目标
        if (this.target && this.target.active && this.target.isAlive() && 
            this.isEnemyOnScreen(this.target) &&
            Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) <= this.detectionRange) {
            // 增加当前目标的锁定奖励，提高锁定性
            const currentTargetScore = this.calculateTargetScore(this.target) + 1000; // 增加额外1000分锁定奖励
            bestTarget = this.target;
            bestScore = currentTargetScore;
        }
        
        // 清理无效目标并评估每个潜在目标
        for (const enemy of Array.from(this.potentialTargets)) {
            // 检查敌人是否有效、存活、在检测范围内且在屏幕内
            if (!enemy.active || !enemy.isAlive() || 
                !this.isEnemyOnScreen(enemy) ||
                Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) > this.detectionRange) {
                this.potentialTargets.delete(enemy);
                continue;
            }
            
            // 跳过当前目标，因为已经评估过了
            if (enemy === this.target) continue;
            
            if (!this.canTarget(enemy)) continue;
            
            const score = this.calculateTargetScore(enemy);
            if (score > bestScore) {
                bestScore = score;
                bestTarget = enemy;
            }
        }
        
        // 如果找到更好的目标，切换目标
        if (bestTarget && bestTarget !== this.target) {
            this.setTarget(bestTarget);
        }
    }
    
    /**
     * 计算目标评分
     * 评分越高，优先级越高
     */
    private calculateTargetScore(enemy: Enemy): number {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
        
        // 基础分数：距离越近分数越高
        let score = 2000 - distance * 2;
        
        // 距离权重：在攻击范围内的敌人获得额外奖励
        if (distance <= this.attackRange) {
            score += 1000; // 在攻击范围内的敌人获得大幅奖励
        } else if (distance <= this.attackRange * 1.5) {
            score += 500; // 接近攻击范围的敌人获得中等奖励
        }
        
        // 当前目标奖励：避免频繁切换目标
        if (enemy === this.target) {
            score += 800; // 增加当前目标的奖励，从300提升到800
        }
        
        // 攻击者优先级：正在攻击塔的敌人优先级更高
        if (this.attackers.has(enemy)) {
            score += 1500; // 攻击者获得高优先级
        }
        
        return score;
    }

    /**
     * 检查是否可以攻击敌人（槽位系统）
     */
    public canTarget(enemy: Enemy): boolean {
        const canTarget = enemy.canBeTargeted();
        return canTarget;
    }

    /**
     * 添加攻击者
     */
    public addAttacker(enemy: Enemy): void {
        this.attackers.add(enemy);
        this.updateTargetList();
    }

    /**
     * 移除攻击者
     */
    public removeAttacker(enemy: Enemy): void {
        this.attackers.delete(enemy);
        this.updateTargetList();
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
                projectile.fire(this.target, this.damage, this.projectileSpeed, false, this.attackRange);
            } else {
            }
        } else {
        }
    }

    /**
     * 向目标敌人移动
     * @param enemy 目标敌人
     */
    private moveTowardsEnemy(enemy: Enemy): void {
        if (!this.canMove || !this.moveSpeed || !enemy || !enemy.active) return;
        
        // 计算与目标的距离
        const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
        
        // 如果敌人已经进入攻击范围，立即停止移动
        if (distance <= this.attackRange) {
            this.stopMoving();
            return;
        }
        
        // 只有当敌人在检测范围内但不在攻击范围内时才移动
        if (distance > this.detectionRange) {
            this.stopMoving();
            this.clearTarget();
            return;
        }
        
        // 检查攻击范围内是否有敌人，如果有则不移动
        if (this.hasEnemiesInAttackRange()) {
            this.stopMoving();
            return;
        }
        
        // 计算移动方向和速度
        const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
        const velocity = this.moveSpeed; // 转换为像素/帧
        
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        // 设置物理体速度
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setVelocity(vx, vy);
        }
        
        // 旋转塔朝向目标
        this.rotation = angle;
    }
    
    /**
     * 停止移动
     */
    private stopMoving(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setVelocity(0, 0);
        }
    }
    
    /**
     * 检查攻击范围内是否有敌人
     * @returns 如果攻击范围内有敌人，返回true，否则返回false
     */
    private hasEnemiesInAttackRange(): boolean {
        return this.findEnemyInAttackRange() !== null;
    }

    /**
     * 查找攻击范围内的敌人
     * 只查找已经进入屏幕的敌人
     * @returns 返回攻击范围内的第一个有效敌人，如果没有则返回null
     */
    private findEnemyInAttackRange(): Enemy | null {
        // 获取游戏场景以访问敌人组
        const gameScene = this.scene as any;
        if (!gameScene || !gameScene.enemies) return null;
        
        let bestEnemy: Enemy | null = null;
        let bestDistance = Infinity;
        
        // 遍历所有敌人，查找攻击范围内的最佳目标
        gameScene.enemies.children.each((enemy: Enemy) => {
            if (!enemy || !enemy.active || !enemy.isAlive()) return;
            
            // 只考虑已经进入屏幕的敌人
            if (!this.isEnemyOnScreen(enemy)) return;
            
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (distance <= this.attackRange && this.canTarget(enemy)) {
                // 选择距离最近的敌人
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestEnemy = enemy;
                }
            }
        });
        
        return bestEnemy;
    }
    
    /**
     * 更新塔状态
     * @param time 当前时间
     * @param delta 时间增量
     * @param enemiesVisible 屏幕上是否有敌人可见
     */
    public update(time: number, delta: number, enemiesVisible: boolean = true): void {
        super.update(time, delta);
        
        // 更新传感器位置
        this.updateSensorPosition();
        
        // 定期评估目标，查找更优的目标
        let shouldEvaluate = time > this.lastTargetEvaluation + this.targetEvaluationInterval;
        
        // 如果当前目标不在攻击范围内，更频繁地评估目标
        if (this.target && this.target.active) {
            const distanceToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
            if (distanceToTarget > this.attackRange) {
                shouldEvaluate = time > this.lastTargetEvaluation + 200; // 每200ms评估一次
            }
        }
        
        if (shouldEvaluate) {
            this.evaluateAndSelectTarget();
            this.lastTargetEvaluation = time;
        }
        
        // 检查目标有效性 - 使用detectionRange作为目标丢失范围，且目标必须在屏幕内
        if (this.target && (!this.target.active || !this.target.isAlive() ||
            !this.isEnemyOnScreen(this.target) ||
            Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) > this.detectionRange)) {
            this.clearTarget();
        }
        
        // 如果可移动且有目标，向目标移动
        if (this.canMove && this.target && this.target.active) {
            this.moveTowardsEnemy(this.target);
        } else if (this.canMove && !this.target) {
            // 没有目标时停止移动
            this.stopMoving();
        }
        
        // 只有当屏幕上有敌人时才攻击
        if (enemiesVisible && this.target && time > this.nextFire) {
            // 检查目标是否在攻击范围内
            const distanceToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
            
            if (distanceToTarget <= this.attackRange) {
                this.fire();
                this.nextFire = time + this.fireRate;
                
                // 攻击后短暂回到待机状态
                this.scene.time.delayedCall(200, () => {
                    if (this.target && this.target.active) {
                        this.setAnimationState(TowerAnimationState.ATTACK);
                    } else {
                        this.setAnimationState(TowerAnimationState.IDLE);
                    }
                });
            } else {
                // 目标不在攻击范围内，检查是否有其他敌人在攻击范围内
                const enemyInAttackRange = this.findEnemyInAttackRange();
                if (enemyInAttackRange) {
                    this.setTarget(enemyInAttackRange);
                    // 立即攻击新的目标
                    this.fire();
                    this.nextFire = time + this.fireRate;
                    
                    this.scene.time.delayedCall(200, () => {
                        if (this.target && this.target.active) {
                            this.setAnimationState(TowerAnimationState.ATTACK);
                        } else {
                            this.setAnimationState(TowerAnimationState.IDLE);
                        }
                    });
                } else {
                    // 没有敌人在攻击范围内，切换回待机状态
                    this.setAnimationState(TowerAnimationState.IDLE);
                }
            }
        }
        
        // 更新范围指示器位置
        this.updateRangeIndicator();
        
        // 更新范围标签位置
        if (this.rangeLabelText && this.rangeLabelText.visible) {
            this.updateRangeLabels();
        }
    }

    /**
     * 销毁时清理
     */
    protected onDestroy(): void {
        
        this.clearTarget();
        
        // 立即从所有物理组中移除，防止继续被敌人攻击
        const gameScene = this.scene as any;
        if (gameScene.towers && gameScene.towers.contains) {
            if (gameScene.towers.contains(this)) {
                gameScene.towers.remove(this, true, true);
            }
        }
        // 通知UI更新塔数量（已从组中移除，计数会减少）
        try {
            const current = (gameScene?.towers?.children?.entries || []).filter((t: any) => t?.active).length || 0;
            const max = gameScene?.levelConfig?.maxTowers;
            if (gameScene?.events?.emit) {
                gameScene.events.emit('towersCountChanged', { current, max });
            }
        } catch {}
        
        // 通知所有攻击者重新寻找目标
        this.attackers.forEach(enemy => {
            if (enemy.active) {
                enemy.clearTarget();
            }
        });
        
        if (this.rangeIndicator) {
            this.rangeIndicator.destroy();
        }
        
        if (this.detectionRangeIndicator) {
            this.detectionRangeIndicator.destroy();
        }
        
        if (this.rangeLabelText) {
            this.rangeLabelText.destroy();
        }
        
        if (this.targetListText) {
            this.targetListText.destroy();
        }
        
        if (this.targetLineGraphics) {
            this.targetLineGraphics.destroy();
        }
        
        if (this.attackSensor) {
            this.attackSensor.destroy();
        }
        
        if (this.detectSensor) {
            this.detectSensor.destroy();
        }
        
        // 播放死亡动画（动画完成后会销毁血条和实体）
        this.playDeathAnimation();
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
        if (this.idleTween) {
            this.idleTween.stop();
        }
        
        // 创建待机动画
        this.idleTween = this.scene.tweens.add({
            targets: this,
            scaleX: { from: 1, to: 0.95 },
            scaleY: { from: 1, to: 1.05 },
            duration: 1500,
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
        if (this.idleTween) {
            this.idleTween.stop();
        }
        
        // 创建攻击动画
        this.attackTween = this.scene.tweens.add({
            targets: this,
            scaleX: { from: 1, to: 1.2 },
            scaleY: { from: 1, to: 0.8 },
            duration: 150,
            yoyo: true,
            repeat: 1,
            ease: 'Power2.easeOut',
            onComplete: () => {
                // 攻击动画完成后恢复待机动画
                if (this.active && this.animationState === TowerAnimationState.ATTACK) {
                    this.startIdleAnimation();
                }
            }
        });
    }

    /**
     * 启动放置动画 - 弹跳效果
     */
    private startPlacementAnimation(): void {
        // 检查场景是否可用
        if (!this.scene || !this.active) {
            return;
        }
        
        // 清除之前的动画
        if (this.idleTween) {
            this.idleTween.stop();
        }
        
        // 创建放置动画
        this.placementTween = this.scene.tweens.add({
            targets: this,
            scaleX: { from: 0.8, to: 1.1 },
            scaleY: { from: 0.8, to: 1.1 },
            duration: 200,
            yoyo: true,
            repeat: 1,
            ease: 'Back.easeOut',
            onComplete: () => {
                // 放置动画完成后恢复待机动画
                if (this.active && this.animationState === TowerAnimationState.PLACEMENT) {
                    this.setAnimationState(TowerAnimationState.IDLE);
                }
            }
        });
    }

    // 动画实例变量
    private idleTween: Phaser.Tweens.Tween | null = null;
    private attackTween: Phaser.Tweens.Tween | null = null;
    private placementTween: Phaser.Tweens.Tween | null = null;

/**
     * 播放死亡动画 - 翻转后消失
     */
    private playDeathAnimation(): void {
        // 防止重复触发死亡动画
        if (this.deathTween && this.deathTween.isPlaying()) {
            return;
        }
        
        // 清除之前的动画
        if (this.idleTween) {
            this.idleTween.stop();
        }
        if (this.attackTween) {
            this.attackTween.stop();
        }
        if (this.placementTween) {
            this.placementTween.stop();
        }
        
        // 确保血条在动画期间仍然可见但跟随实体一起消失
        if (this.healthBar) {
            this.healthBar.setVisible(true);
        }
        
        // 检查场景是否可用
        if (!this.scene || !this.active) {
            this.destroyEntity();
            return;
        }
        
        // 标记为不再活跃，防止重复触发
        this.setActive(false);
        
        // 禁用物理体，防止继续碰撞和移动
        if (this.body) {
            const body = this.body as Phaser.Physics.Arcade.Body;
            body.enable = false;
            body.setVelocity(0, 0);
            body.setImmovable(true);
        }
        
        // 创建死亡动画 - 移除旋转，使用翻转效果
        this.deathTween = this.scene.tweens.add({
            targets: [this, this.healthBar],
            scaleX: { from: 1, to: 0 },
            scaleY: { from: 1, to: 0 },
            alpha: { from: 1, to: 0 },
            duration: 500,
            ease: 'Power2.easeIn',
            onComplete: () => {
                // 动画完成后调用父类的销毁方法，这会销毁血条和实体
                this.destroyEntity();
            }
        });
    }

    // 死亡动画实例变量
    private deathTween: Phaser.Tweens.Tween | null = null;
}