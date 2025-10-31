import { Scene } from 'phaser';

/**
 * 射弹类
 * 处理攻击射弹的移动和碰撞
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
    private speed: number;
    private damage: number;
    private target: Phaser.GameObjects.GameObject | null;
    public isEnemyProjectile: boolean = false; // 标记是否为敌人发射的子弹
    private originX: number; // 发射起点X坐标
    private originY: number; // 发射起点Y坐标
    private maxRange: number = 0; // 最大射程，超过后子弹消失

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'projectile');
        
        scene.add.existing(this);
        scene.physics.world.enable(this);
        
        this.speed = 1200;
        this.damage = 0;
        this.target = null;
        
        // 设置为非活跃状态，等待复用
        this.setActive(false);
        this.setVisible(false);
    }

    /**
     * 发射射弹
     * @param target 目标对象
     * @param damage 伤害值
     * @param speed 射弹速度
     * @param isEnemyProjectile 是否为敌人发射的子弹
     * @param range 射程范围，仅对敌人子弹生效
     */
    public fire(target: Phaser.GameObjects.GameObject, damage: number, speed: number = 1200, isEnemyProjectile: boolean = false, range: number = 0): void {
        this.target = target;
        this.damage = damage;
        this.speed = speed;
        this.isEnemyProjectile = isEnemyProjectile;
        
        // 记录发射起点坐标
        this.originX = this.x;
        this.originY = this.y;
        
        // 设置最大射程 - 所有的子弹都有射程限制
        this.maxRange = range > 0 ? range : 0;
        
        this.setActive(true);
        this.setVisible(true);
        
        // 设置不同颜色区分敌人和防御塔的子弹
        if (isEnemyProjectile) {
            this.setTint(0xff0000); // 敌人子弹为红色
        } else {
            this.setTint(0x00ff00); // 防御塔子弹为绿色
        }
        
        // 设置碰撞体
        const body = this.body as Phaser.Physics.Arcade.Body;
        const collisionRadius = Math.max(this.width / 2, 8); // 增大碰撞体积
        body.setCircle(collisionRadius);
        body.setEnable(true);  // 确保物理体已启用
        body.setBounce(0);     // 禁止反弹
        body.setAllowGravity(false);  // 禁用重力
        
        
        // 朝目标移动
        this.scene.physics.moveToObject(this, target, this.speed);
        
        // 计算朝向
        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        this.setRotation(angle);
    }

    /**
     * 获取伤害值
     */
    public getDamage(): number {
        return this.damage;
    }

    /**
     * 更新射弹状态
     */
    public update(time: number, delta: number): void {
        if (!this.active || !this.scene || !this.body) return;
        
        // 检查是否超出屏幕边界
        const { width, height } = this.scene.scale;
        if (this.y < -50 || this.y > height + 50 || 
            this.x < -50 || this.x > width + 50) {
            this.recycleProjectile();
            return;
        }
        
        // 检查子弹是否超出最大射程
        if (this.maxRange > 0) {
            const distanceFromOrigin = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.originX, this.originY
            );
            
            if (distanceFromOrigin > this.maxRange) {
                this.recycleProjectile();
            }
        }
    }

    /**
     * 回收射弹到对象池
     */
    public recycleProjectile(): void {
        this.setActive(false);
        this.setVisible(false);
        this.body.setVelocity(0, 0);
        this.target = null;
        this.isEnemyProjectile = false;
        this.clearTint(); // 清除颜色
    }
    
    /**
     * 获取是否为敌人射弹
     */
    public getIsEnemyProjectile(): boolean {
        return this.isEnemyProjectile;
    }
}