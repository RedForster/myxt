/**
 * 单位配置数据
 * 基于游戏设计文档的数值设计
 */

export interface IconConfig {
    emoji: string;
    bgColor: number;
    size: number;
}

export interface TowerConfig {
    id: string;
    name: string;
    texture: string;
    cost: number;
    hp: number;
    damage: number;
    range: number;
    detectionRange: number; // 敌人检测范围，用于锁定敌人
    fireRate: number;
    projectileSpeed: number;
    attractionSlots: number;
    deployCount?: number; // 部署数量，默认为1
    canMove?: boolean; // 是否可以移动
    moveSpeed?: number; // 移动速度（像素/秒）
    icon: IconConfig;
}

export interface EnemyConfig {
    id: string;
    name: string;
    texture: string;
    hp: number;
    speed: number;
    reward: number;
    damage: number;
    attackRange: number;
    fireRate: number;
    damageToPlayer: number;
    targetedBySlots: number;
    icon: IconConfig;
}

export interface OrganConfig {
    id: string;
    name: string;
    texture: string;
    initialLevel: number;
    maxLevel: number;
    upgradeCost: number;
    baseHp: number;
    hpPerLevel: number;
    baseResourceGen: number;
    resourceGenPerLevel: number;
    attractionSlots: number;
    icon: IconConfig;
}

export const UNITS_CONFIG = {
    towers: {
        // 嗜中性白血球
        neutrophil: {
            id: 'neutrophil',
            name: '嗜中性白血球',
            texture: 'tower_neutrophil',
            cost: 15,
            hp: 30,
            damage: 15,
            range: 144 * 1.5, 
            detectionRange: 144 * 10, // 检测范围比攻击范围大
            fireRate: 800, // 0.8秒/次
            projectileSpeed: 1200,
            attractionSlots: 3,
            deployCount: 3, // 部署3个塔
            canMove: true,
            moveSpeed: 120, // 120像素/秒
            icon: {
                emoji: '🩸',
                bgColor: 0x3498db,
                size: 64
            }
        } as TowerConfig,
        
        // B细胞
        bcell: {
            id: 'bcell',
            name: 'B细胞',
            texture: 'tower_bcell',
            cost: 20,
            hp: 50,
            damage: 30,
            range: 144 * 3, // 5个单位 = 720px
            detectionRange: 144 * 10, // 检测范围比攻击范围大
            fireRate: 600, // 0.6秒/次
            projectileSpeed: 1200,
            attractionSlots: 3,
            canMove: true,
            moveSpeed: 100, // 100像素/秒
            icon: {
                emoji: '🔬',
                bgColor: 0x9b59b6,
                size: 64
            }
        } as TowerConfig,
        
        // T细胞
        tcell: {
            id: 'tcell',
            name: 'T细胞',
            texture: 'tower_tcell',
            cost: 40,
            hp: 80,
            damage: 20,
            range: 144 * 6, // 6个单位 = 864px
            detectionRange: 144 * 8, // 检测范围比攻击范围大
            fireRate: 300, // 0.3秒/次
            projectileSpeed: 1500,
            attractionSlots: 3,
            canMove: true,
            moveSpeed: 150, // 150像素/秒
            icon: {
                emoji: '🛡️',
                bgColor: 0xe74c3c,
                size: 64
            }
        } as TowerConfig,
        
        // 巨噬细胞
        macrophage: {
            id: 'macrophage',
            name: '巨噬细胞',
            texture: 'tower_macrophage',
            cost: 50,
            hp: 150,
            damage: 80,
            range: 144 * 7, // 7个单位 = 1008px
            detectionRange: 144 * 9, // 检测范围比攻击范围大
            fireRate: 1000, // 1.0秒/次
            projectileSpeed: 1000,
            attractionSlots: 3,
            canMove: true,
            moveSpeed: 80, // 80像素/秒
            icon: {
                emoji: '🦠',
                bgColor: 0xf1c40f,
                size: 64
            }
        } as TowerConfig
    },
    
    enemies: {
        // 普通病菌
        commonBacteria: {
            id: 'commonBacteria',
            name: '普通病菌',
            texture: 'enemy_bacteria',
            hp: 60,
            speed: 80 * 144 / 1000, // 80单位/秒转换为像素/ms
            reward: 5,
            damage: 15,
            attackRange: 144*1.5, // 增加攻击范围，原来的50可能太小
            fireRate: 1000,
            damageToPlayer: 15,
            targetedBySlots: 3,
            icon: {
                emoji: '🦠',
                bgColor: 0x2ecc71,
                size: 48
            }
        } as EnemyConfig
    },
    
    fixed: {
        // 免疫器官
        immuneOrgan: {
            id: 'immuneOrgan',
            name: '免疫器官',
            texture: 'immune_organ',
            initialLevel: 1,
            maxLevel: 5,
            upgradeCost: 40,
            baseHp: 50,
            hpPerLevel: 25,
            baseResourceGen: 5,
            resourceGenPerLevel: 2,
            attractionSlots: 5,
            icon: {
                emoji: '❤️',
                bgColor: 0xff69b4,
                size: 128
            }
        } as OrganConfig
    },
    
    ui: {
        sneezeSkill: {
            id: 'sneeze',
            name: '喷嚏技能',
            texture: 'icon_sneeze',
            icon: {
                emoji: '🤧',
                bgColor: 0x1abc9c,
                size: 96
            }
        },
        codex: {
            id: 'codex',
            name: '图鉴',
            texture: 'icon_codex',
            icon: {
                emoji: '📚',
                bgColor: 0x2980b9,
                size: 96
            }
        }
    }
};