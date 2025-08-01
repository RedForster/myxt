import { Scene } from 'phaser';
import { Tower } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { ImmuneOrgan } from '../entities/ImmuneOrgan';
import { Projectile } from '../entities/Projectile';
import { UNITS_CONFIG } from '../config/UnitsConfig';
import { LEVELS_CONFIG, LevelConfig } from '../config/LevelConfig';

/**
 * 主游戏场景
 * 负责游戏逻辑、实体管理和物理交互
 */
export class Game extends Scene {
    // 游戏配置
    private levelConfig: LevelConfig;
    private gameWidth: number;
    private gameStartTime: number = 0;
    
    // 实体组
    private towers: Phaser.GameObjects.Group;
    private enemies: Phaser.Physics.Arcade.Group;
    private projectiles: Phaser.Physics.Arcade.Group;
    private immuneOrgan: ImmuneOrgan;
    private towerSensors: Phaser.Physics.Arcade.StaticGroup;
    
    // 游戏状态
    private playerHealth: number;
    private playerResources: number;
    private allTargets: (Tower | ImmuneOrgan)[] = [];
    
    // 波次管理
    private waveTimers: Phaser.Time.TimerEvent[] = [];
    
    // UI交互
    private selectedTowerType: string | null = null;
    private placementIndicator: Phaser.GameObjects.Container | null = null;

    constructor() {
        super('GameScene');
    }

    create(): void {
        this.levelConfig = LEVELS_CONFIG.demo;
        this.gameWidth = this.scale.width * 0.75; // 游戏区域占3/4屏幕
        this.gameStartTime = this.time.now; // 记录场景创建时间
        
        // 初始化游戏状态
        this.playerHealth = this.levelConfig.initialPlayerHealth;
        this.playerResources = this.levelConfig.initialResources;
        
        this.createBackground();
        this.createEntityGroups();
        this.createImmuneOrgan();
        this.setupPhysics();
        this.setupInput();
        this.setupWaves();
        this.setupEvents();
        
        // 生成初始敌人
        this.spawnInitialEnemies();
        
        // 启动UI场景
        this.scene.launch('UIScene', {
            gameScene: this,
            playerHealth: this.playerHealth,
            playerResources: this.playerResources,
            levelConfig: this.levelConfig
        });
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        // 创建游戏区域背景
        const bg = this.add.rectangle(
            this.gameWidth / 2, 
            this.scale.height / 2, 
            this.gameWidth, 
            this.scale.height, 
            0x2c3e50
        );
        bg.setDepth(-1);
        
        // 创建分界线
        const divider = this.add.line(
            0, 0, 
            this.gameWidth, 0, 
            this.gameWidth, this.scale.height, 
            0xffffff, 0.3
        );
        divider.setOrigin(0, 0);
    }

    /**
     * 创建实体组
     */
    private createEntityGroups(): void {
        this.towers = this.add.group({
            classType: Tower,
            runChildUpdate: true
        });
        
        this.enemies = this.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });
        
        this.projectiles = this.physics.add.group({
            classType: Projectile,
            runChildUpdate: true,
            maxSize: 100
        });
        
        this.towerSensors = this.physics.add.staticGroup();
    }

    /**
     * 创建免疫器官
     */
    private createImmuneOrgan(): void {
        const organX = this.gameWidth - 180;
        const organY = this.scale.height / 2;
        
        this.immuneOrgan = new ImmuneOrgan(
            this, 
            organX, 
            organY, 
            UNITS_CONFIG.fixed.immuneOrgan
        );
        
        this.updateAllTargets();
    }

    /**
     * 设置物理交互
     */
    private setupPhysics(): void {
        // 射弹与敌人的碰撞（防御塔射弹打敌人）
        this.physics.add.overlap(
            this.projectiles,
            this.enemies,
            this.handleProjectileHit,
            (projectile, enemy) => {
                const p = projectile as Projectile;
                const e = enemy as Enemy;
                // 确保是防御塔的射弹，并且目标是存活的敌人
                return !p.isEnemyProjectile && e.isAlive() && p.active;
            },
            this
        );
        
        // 敌人射弹与防御塔的碰撞
        this.physics.add.overlap(
            this.projectiles,
            this.towers,
            this.handleEnemyProjectileHit,
            (projectile, tower) => {
                const p = projectile as Projectile;
                const t = tower as Tower;
                // 只有敌人射弹才能打防御塔
                return p.isEnemyProjectile && p.active && t.active;
            },
            this
        );
        
        // 敌人射弹与免疫器官的碰撞
        this.physics.add.overlap(
            this.projectiles,
            [this.immuneOrgan],
            this.handleEnemyProjectileHit,
            (projectile, target) => {
                const p = projectile as Projectile;
                // 只有敌人射弹才能打免疫器官
                return p.isEnemyProjectile && p.active && target.active;
            },
            this
        );
        
        // 稍后会在tower创建时设置传感器重叠检测
        
        // 添加敌人与防御塔的碰撞检测
        this.physics.add.collider(
            this.enemies,
            this.towers,
            this.handleEnemyTowerCollision,
            null,
            this
        );
    }

    /**
     * 设置输入处理
     */
    private setupInput(): void {
        this.input.on('pointerdown', this.handlePlacement, this);
        this.input.on('pointermove', this.updatePlacementIndicator, this);
    }

    /**
     * 设置波次
     */
    private setupWaves(): void {
        console.log('GameScene setupWaves: Starting wave setup');
        
        // 简化测试：直接创建一个计时器，每2秒生成一个敌人
        const testTimer = this.time.addEvent({
            delay: 2000,
            callback: () => {
                console.log('Test timer: Spawning enemy');
                this.spawnEnemy('commonBacteria');
            },
            callbackScope: this,
            loop: true
        });
        
        this.waveTimers.push(testTimer);
        console.log('Created test wave timer with 2 second interval');
        
        // 同时保留原来的波次逻辑，但简化
        this.levelConfig.waves.forEach((wave, index) => {
            console.log(`GameScene setupWaves: Creating wave ${index} - startTime: ${wave.startTime}, endTime: ${wave.endTime}, interval: ${wave.interval}, enemyType: ${wave.enemyType}`);
            
            const timer = this.time.addEvent({
                delay: wave.interval,
                callback: () => {
                    const elapsedSeconds = (this.time.now - this.gameStartTime) / 1000;
                    if (elapsedSeconds >= wave.startTime && elapsedSeconds <= wave.endTime) {
                        console.log(`Spawning enemy from wave ${index}: ${wave.enemyType}`);
                        this.spawnEnemy(wave.enemyType);
                    }
                },
                callbackScope: this,
                loop: true
            });
            
            this.waveTimers.push(timer);
        });
    }

    /**
     * 设置事件监听
     */
    private setupEvents(): void {
        // 监听UI场景事件
        const uiScene = this.scene.get('UIScene');
        if (uiScene) {
            uiScene.events.on('selectTower', this.onSelectTower, this);
            uiScene.events.on('upgradeOrgan', this.onUpgradeOrgan, this);
            uiScene.events.on('useSneezeSkill', this.onUseSneezeSkill, this);
        }
        
        // 监听游戏事件
        this.events.on('enemyDefeated', this.onEnemyDefeated, this);
        this.events.on('resourceGenerated', this.onResourceGenerated, this);
        this.events.on('organDamaged', this.onOrganDamaged, this);
        this.events.on('gameOver', this.onGameOver, this);
    }

    /**
     * 生成初始敌人
     */
    private spawnInitialEnemies(): void {
        const { count, enemyType } = this.levelConfig.initialEnemies;
        for (let i = 0; i < count; i++) {
            this.time.delayedCall(i * 400, () => {
                this.spawnEnemy(enemyType);
            });
        }
    }

    /**
     * 生成敌人
     */
    private spawnEnemy(enemyType: string): void {
        console.log(`GameScene spawnEnemy: Starting spawn process for ${enemyType}`);
        
        const enemyConfig = UNITS_CONFIG.enemies[enemyType as keyof typeof UNITS_CONFIG.enemies];
        if (!enemyConfig) {
            console.error(`GameScene spawnEnemy: Enemy config not found for ${enemyType}`);
            return;
        }
        
        const x = -50;
        const y = Phaser.Math.Between(100, this.scale.height - 100);
        
        console.log(`GameScene spawnEnemy: Creating enemy at (${x}, ${y}) with config:`, enemyConfig);
        
        const enemy = new Enemy(this, x, y, enemyConfig);
        console.log(`GameScene spawnEnemy: Enemy object created:`, enemy);
        
        this.enemies.add(enemy, true);
        console.log(`GameScene spawnEnemy: Enemy added to enemies group. Total enemies: ${this.enemies.countActive()}`);
        
        // 验证敌人是否真的被添加到了组中
        console.log(`GameScene spawnEnemy: Enemies group details:`, {
            totalChildren: this.enemies.children.size,
            activeChildren: this.enemies.countActive(),
            enemyPosition: { x: enemy.x, y: enemy.y },
            enemyActive: enemy.active,
            enemyVisible: enemy.visible,
            enemyAlpha: enemy.alpha
        });
        
        // 确保目标列表是最新的
        this.updateAllTargets();
        
        // 让敌人寻找目标
        enemy.findTarget();
        
        console.log(`GameScene spawnEnemy: Spawn completed for enemy at (${x}, ${y})`);
    }

         /**
      * 从对象池获取射弹
      */
     public getProjectileFromPool(x: number, y: number): Projectile | null {
         let projectile = this.projectiles.getFirstDead(false) as Projectile;
         
         if (!projectile) {
             projectile = new Projectile(this, x, y);
             this.projectiles.add(projectile, true);
             console.log('Created new projectile');
         } else {
             console.log('Reused projectile from pool');
             // 确保重用的子弹被正确重置
             projectile.setPosition(x, y);
             projectile.setActive(true);
             projectile.setVisible(true);
             if (projectile.body) {
                 projectile.body.setVelocity(0, 0);
             }
         }
         
         return projectile;
     }

    /**
     * 处理防御塔射弹命中敌人
     */
    private handleProjectileHit(projectile: any, enemy: Enemy): void {
        // 首先检查projectile是否存在且类型正确
        if (!projectile || !(projectile instanceof Projectile)) {
            console.warn('GameScene handleProjectileHit: Invalid projectile type');
            return;
        }

        // 检查enemy是否为有效的目标
        if (!enemy || !(enemy instanceof Enemy)) {
            console.warn('GameScene handleProjectileHit: Invalid enemy type');
            return;
        }

        console.log(`GameScene handleProjectileHit: projectile=${projectile.active}, enemy=${enemy.active}`);
        
        // 确保projectile和enemy都处于激活状态
        if (projectile.active && enemy.active) {
            // 应用伤害
            if (enemy.receiveDamage && projectile.getDamage) {
                const damage = projectile.getDamage();
                console.log(`GameScene handleProjectileHit: Applying damage ${damage} to enemy`);
                enemy.receiveDamage(damage);
            }

            // 回收子弹
            projectile.recycleProjectile();
            
            // 播放命中特效（如果有的话）
            this.createHitEffect(projectile.x, projectile.y);
        }
    }
    
    /**
     * 处理敌人射弹命中防御塔或免疫器官
     */
    /**
     * 创建命中特效
     */
    private createHitEffect(x: number, y: number): void {
        // 创建简单的爆炸动画效果
        const explosion = this.add.circle(x, y, 5, 0xffff00, 1);
        
        // 创建缩放动画
        this.tweens.add({
            targets: explosion,
            scale: { from: 0.5, to: 2 },
            alpha: { from: 1, to: 0 },
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
    }

    private handleEnemyProjectileHit(obj1: any, obj2: any): void {
        // 添加详细的调试信息
        console.log(`GameScene handleEnemyProjectileHit: obj1 type: ${obj1?.constructor?.name}, obj2 type: ${obj2?.constructor?.name}`);
        
        // 确定哪个是射弹，哪个是目标
        let projectile: any;
        let target: any;
        
        if (obj1 instanceof Projectile) {
            projectile = obj1;
            target = obj2;
        } else if (obj2 instanceof Projectile) {
            projectile = obj2;
            target = obj1;
        } else {
            console.warn('GameScene handleEnemyProjectileHit: Neither object is a Projectile');
            return;
        }
        
        console.log(`GameScene handleEnemyProjectileHit: projectile type: ${projectile?.constructor?.name}, target type: ${target?.constructor?.name}`);
        
        // 检查target是否为有效的目标类型
        if (!(target instanceof Tower) && !(target instanceof ImmuneOrgan)) {
            console.warn(`GameScene handleEnemyProjectileHit: Invalid target type: ${target?.constructor?.name}`);
            return;
        }

        console.log(`GameScene handleEnemyProjectileHit: projectile=${projectile.active}, target=${target.active}, targetType=${target.constructor.name}`);
        
        // 确保projectile和target都处于激活状态，并且是敌人的子弹
        if (projectile.active && target.active && projectile.isEnemyProjectile) {
            // 应用伤害
            if (target.receiveDamage && projectile.getDamage) {
                const damage = projectile.getDamage();
                console.log(`GameScene handleEnemyProjectileHit: Applying damage ${damage} to ${target.constructor.name}`);
                target.receiveDamage(damage);
                
                // 特别检查免疫器官的状态
                if (target instanceof ImmuneOrgan) {
                    console.log(`GameScene handleEnemyProjectileHit: ImmuneOrgan after damage - active: ${target.active}, visible: ${target.visible}, alpha: ${target.alpha}`);
                }
            }

            // 回收子弹
            projectile.recycleProjectile();
            
            // 播放命中特效
            this.createHitEffect(projectile.x, projectile.y);
        }
    }

    /**
     * 处理塔的选择
     */
    private onSelectTower(towerType: string): void {
        this.selectedTowerType = towerType;
        this.createPlacementIndicator(towerType);
    }

    /**
     * 创建放置指示器
     */
    private createPlacementIndicator(towerType: string): void {
        if (!this.placementIndicator) {
            this.placementIndicator = this.add.container(0, 0);
        }
        
        this.placementIndicator.removeAll(true);
        
        const towerConfig = UNITS_CONFIG.towers[towerType as keyof typeof UNITS_CONFIG.towers];
        if (!towerConfig) return;
        
        const rangeCircle = this.add.circle(0, 0, towerConfig.range, 0x3498db, 0.3);
        const towerSprite = this.add.sprite(0, 0, towerConfig.texture).setAlpha(0.7);
        
        this.placementIndicator.add([rangeCircle, towerSprite]);
        this.placementIndicator.setVisible(true);
    }

    /**
     * 更新放置指示器
     */
    private updatePlacementIndicator(pointer: Phaser.Input.Pointer): void {
        if (!this.selectedTowerType || !this.placementIndicator) return;
        
        this.placementIndicator.setPosition(pointer.x, pointer.y);
        
        const towerConfig = UNITS_CONFIG.towers[this.selectedTowerType as keyof typeof UNITS_CONFIG.towers];
        const canPlace = pointer.x < this.gameWidth && 
                         this.playerResources >= towerConfig.cost;
        
        this.placementIndicator.getAt(1).setTint(canPlace ? 0xffffff : 0xff0000);
    }

    /**
     * 处理塔的放置
     */
    private handlePlacement(pointer: Phaser.Input.Pointer): void {
        // 如果点击在UI区域，取消选择
        if (pointer.x > this.gameWidth) {
            this.selectedTowerType = null;
            if (this.placementIndicator) {
                this.placementIndicator.setVisible(false);
            }
            return;
        }
        
        if (!this.selectedTowerType) return;
        
        const towerConfig = UNITS_CONFIG.towers[this.selectedTowerType as keyof typeof UNITS_CONFIG.towers];
        
        // 检查资源是否足够
        if (this.playerResources >= towerConfig.cost) {
            this.placeTower(pointer.x, pointer.y, this.selectedTowerType);
            this.playerResources -= towerConfig.cost;
            
            // 通知UI更新资源显示
            this.events.emit('resourcesChanged', { resources: this.playerResources });
        }
        
        this.selectedTowerType = null;
        if (this.placementIndicator) {
            this.placementIndicator.setVisible(false);
        }
    }

    /**
     * 放置塔
     */
    private placeTower(x: number, y: number, towerType: string): void {
        const towerConfig = UNITS_CONFIG.towers[towerType as keyof typeof UNITS_CONFIG.towers];
        if (!towerConfig) return;
        
        // 检查是否需要部署多个塔
        const deployCount = towerConfig.deployCount || 1;
        
        if (deployCount === 1) {
            // 单个塔部署
            this.deploySingleTower(x, y, towerConfig);
        } else {
            // 多个塔部署
            this.deployMultipleTowers(x, y, towerConfig, deployCount);
        }
    }

    /**
     * 部署单个塔
     */
    private deploySingleTower(x: number, y: number, towerConfig: TowerConfig): void {
        const tower = new Tower(this, x, y, towerConfig);
        this.towers.add(tower);
        
        this.setupTowerPhysics(tower);
        this.updateAllTargets();
        this.notifyNearbyEnemiesOfNewTower(tower);
    }

    /**
     * 部署多个塔
     */
    private deployMultipleTowers(centerX: number, centerY: number, towerConfig: TowerConfig, count: number): void {
        const deployedTowers: Tower[] = [];
        
        // 计算塔的排列位置（三角形排列）
        const spacing = 60; // 塔之间的间距，增加距离避免重叠
        
        for (let i = 0; i < count; i++) {
            let x, y;
            
            if (count === 1) {
                // 只有1个塔时放在中心
                x = centerX;
                y = centerY;
            } else if (count === 2) {
                // 2个塔时横向排列
                x = centerX + (i === 0 ? -spacing/2 : spacing/2);
                y = centerY;
            } else if (count === 3) {
                // 3个塔时三角形排列
                switch (i) {
                    case 0: // 顶部
                        x = centerX;
                        y = centerY - spacing * 0.6;
                        break;
                    case 1: // 左下
                        x = centerX - spacing * 0.5;
                        y = centerY + spacing * 0.3;
                        break;
                    case 2: // 右下
                        x = centerX + spacing * 0.5;
                        y = centerY + spacing * 0.3;
                        break;
                }
            } else {
                // 超过3个塔时，围绕中心圆形排列
                const angle = (i * 2 * Math.PI) / count;
                x = centerX + Math.cos(angle) * spacing;
                y = centerY + Math.sin(angle) * spacing;
            }
            
            // 检查位置是否在游戏区域内
            if (x < 30 || x > this.gameWidth - 30 || y < 30 || y > this.scale.height - 30) {
                console.warn(`Tower position out of bounds: (${x}, ${y})`);
                continue;
            }
            
            const tower = new Tower(this, x, y, towerConfig);
            this.towers.add(tower);
            deployedTowers.push(tower);
            
            this.setupTowerPhysics(tower);
            
            console.log(`Deployed tower ${i + 1}/${count} at (${x.toFixed(1)}, ${y.toFixed(1)})`);
        }
        
        // 更新目标列表并通知敌人
        this.updateAllTargets();
        deployedTowers.forEach(tower => {
            this.notifyNearbyEnemiesOfNewTower(tower);
        });
    }

    /**
     * 设置塔的物理和传感器
     */
    private setupTowerPhysics(tower: Tower): void {
        // 添加传感器到静态组
        this.towerSensors.add(tower.getAttackSensor());
        
        // 设置传感器与敌人的重叠检测
        this.physics.add.overlap(
            tower.getAttackSensor(),
            this.enemies,
            this.handleEnemyInTowerRange,
            null,
            this
        );
    }

    /**
     * 处理敌人与塔的碰撞
     */
    private handleEnemyTowerCollision(enemy: Enemy, tower: Tower): void {
        if (!enemy.active || !tower.active) return;
        
        // 让敌人停止并攻击塔
        enemy.setTarget(tower);
        
        // 强制敌人停在当前位置
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
    }

    /**
     * 让附近的敌人重新评估目标
     */
    private notifyNearbyEnemiesOfNewTower(tower: Tower): void {
        // 检查附近的敌人，让他们重新评估目标
        this.enemies.children.each((enemy: Enemy) => {
            if (enemy && enemy.active) {
                const distance = Phaser.Math.Distance.Between(
                    enemy.x, enemy.y,
                    tower.x, tower.y
                );
                // 如果敌人在塔的感知范围内，重新评估目标
                if (distance < 200) { // 感知范围
                    enemy.findTarget();
                }
            }
        });
    }

    /**
     * 处理敌人进入塔的攻击范围
     */
    private handleEnemyInTowerRange(sensor: Phaser.GameObjects.Zone, enemy: Enemy): void {
        const tower = (sensor as any).parentTower as Tower;
        
        if (!tower || !tower.active || !enemy || !enemy.active) return;
        
        // 检查槽位系统
        if (tower.canTarget(enemy)) {
            tower.setTarget(enemy);
        }
    }

    /**
     * 处理器官升级
     */
    private onUpgradeOrgan(): void {
        if (this.playerResources >= this.immuneOrgan.getUpgradeCost() && 
            this.immuneOrgan.canUpgrade()) {
            this.playerResources -= this.immuneOrgan.getUpgradeCost();
            this.immuneOrgan.upgrade();
            
            this.events.emit('resourcesChanged', { resources: this.playerResources });
        }
    }

    /**
     * 处理喷嚏技能
     */
    private onUseSneezeSkill(): void {
        const damage = this.levelConfig.skills.sneeze.damage;
        
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.active && (enemy as Enemy).receiveDamage) {
                // 造成伤害
                (enemy as Enemy).receiveDamage(damage);
                
                // 使用强大的物理力实现击退
                const body = enemy.body as Phaser.Physics.Arcade.Body;
                body.setVelocityX(-1500); // 强大的向左击退力
                
                // 标记敌人处于击退状态
                const enemyObj = enemy as Enemy;
                enemyObj.isKnockback = true;
                
                // 400ms后恢复正常行为
                this.time.delayedCall(400, () => {
                    if (enemy && enemy.active) {
                        // 清除击退状态
                        enemyObj.isKnockback = false;
                        
                        // 强制敌人重新评估目标并恢复移动
                        enemyObj.findTarget();
                    }
                });
            }
        });
    }

    /**
     * 处理敌人被击败
     */
    private onEnemyDefeated(data: { reward: number }): void {
        this.playerResources += data.reward;
        this.events.emit('resourcesChanged', { resources: this.playerResources });
    }

    /**
     * 处理资源生成
     */
    private onResourceGenerated(data: { amount: number }): void {
        this.playerResources += data.amount;
        this.events.emit('resourcesChanged', { resources: this.playerResources });
    }

    /**
     * 处理器官受伤
     */
    private onOrganDamaged(data: { hp: number; maxHp: number; damage: number }): void {
        // 器官受伤逻辑已在ImmuneOrgan类中处理
    }

    /**
     * 对玩家造成伤害
     */
    public damagePlayer(damage: number): void {
        this.playerHealth = Math.max(0, this.playerHealth - damage);
        this.events.emit('playerHealthChanged', { health: this.playerHealth });
        
        if (this.playerHealth <= 0) {
            this.events.emit('gameOver', { reason: 'healthDepleted' });
        }
    }

    /**
     * 处理游戏结束
     */
    private onGameOver(data: { reason: string }): void {
        this.scene.pause();
        this.events.emit('showGameOver', data);
    }

    /**
     * 更新所有目标列表
     */
    private updateAllTargets(): void {
        this.allTargets = [...this.towers.children.entries as Tower[], this.immuneOrgan];
    }

    /**
     * 获取所有目标
     */
    public getAllTargets(): (Tower | ImmuneOrgan)[] {
        return this.allTargets;
    }

    /**
     * 获取免疫器官
     */
    public getImmuneOrgan(): ImmuneOrgan {
        return this.immuneOrgan;
    }

    /**
     * 获取游戏区域宽度
     */
    public getGameWidth(): number {
        return this.gameWidth;
    }

    /**
     * 检查屏幕上是否有敌人
     */
    private hasVisibleEnemies(): boolean {
        let hasEnemies = false;
        
        this.enemies.children.each((enemy: Enemy) => {
            if (enemy && enemy.active && 
                enemy.x > -50 && enemy.x < this.scale.width + 50 &&
                enemy.y > -50 && enemy.y < this.scale.height + 50) {
                hasEnemies = true;
                return false; // 停止迭代
            }
        });
        
        return hasEnemies;
    }
    
    /**
     * 游戏主循环更新
     */
    public update(time: number, delta: number): void {
        // 检查屏幕上是否有敌人
        const enemiesVisible = this.hasVisibleEnemies();
        
        // 每5秒打印一次状态信息
        if (time % 5000 < 100) {
            console.log(`GameScene update: time=${time}, active enemies=${this.enemies.countActive()}, visible enemies=${enemiesVisible}, active towers=${this.towers.countActive()}`);
        }
        
        // 手动更新免疫器官
        if (this.immuneOrgan && this.immuneOrgan.active) {
            // 传递敌人可见状态，以便控制射击
            this.immuneOrgan.update(time, delta, enemiesVisible);
            
            // 每5秒检查一次免疫器官状态
            if (time % 5000 < 100) {
                console.log(`GameScene update: Immune organ status - active: ${this.immuneOrgan.active}, visible: ${this.immuneOrgan.visible}, alpha: ${this.immuneOrgan.alpha}, hp: ${this.immuneOrgan.getHp()}`);
            }
        } else {
            if (time % 5000 < 100) {
                console.log(`GameScene update: Immune organ not active or not found - immuneOrgan: ${!!this.immuneOrgan}, active: ${this.immuneOrgan?.active}`);
            }
        }
        
        // 确保敌人的update方法被调用
        let enemyCount = 0;
        this.enemies.children.each((enemy: Enemy) => {
            if (enemy && enemy.active) {
                // 敌人始终更新，但可以传递敌人可见状态以控制射击
                enemy.update(time, delta);
                enemyCount++;
            }
        });
        
        // 更新防御塔，传递敌人可见状态
        this.towers.children.each((tower: Tower) => {
            if (tower && tower.active) {
                // 传递敌人可见状态，以便控制射击
                tower.update(time, delta, enemiesVisible);
            }
        });
        
        // 每5秒打印一次敌人数量
        if (time % 5000 < 100) {
            console.log(`GameScene update: Updated ${enemyCount} active enemies`);
        }
    }
}