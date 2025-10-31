/**
 * 关卡配置数据
 * 基于游戏设计文档的关卡设计
 */

export interface WaveConfig {
    startTime: number; // 开始时间（秒）
    endTime: number;   // 结束时间（秒）
    interval: number;  // 生成间隔（毫秒）
    enemyType: string; // 敌人类型ID
}

export interface TowerUnlock {
    time: number;    // 解锁时间（秒）
    towerId: string; // 塔ID
}

export interface SkillConfig {
    name: string;
    cooldown: number; // 冷却时间（毫秒）
    damage: number;
}

export interface LevelConfig {
    name: string;
    initialPlayerHealth: number;
    initialResources: number;
    initialEnemies: {
        count: number;
        enemyType: string;
    };
    waves: WaveConfig[];
    towerUnlocks: TowerUnlock[];
    skills: {
        sneeze: SkillConfig;
    };
    /**
     * 本关卡允许同时存活的防御塔最大数量
     * 可选：未设置时表示不限制
     */
    maxTowers?: number;
}

export const LEVELS_CONFIG = {
    // Demo关卡
    demo: {
        name: 'Demo关卡',
        initialPlayerHealth: 500,
        initialResources: 40,
        initialEnemies: {
            count: 5,
            enemyType: 'commonBacteria'
        },
        waves: [
            {
                startTime: 0,
                endTime: 60,
                interval: 1000, // 1.0秒/个
                enemyType: 'commonBacteria'
            },
            {
                startTime: 60,
                endTime: 120,
                interval: 700, // 0.7秒/个
                enemyType: 'commonBacteria'
            }
        ],
        towerUnlocks: [
            { time: 0, towerId: 'neutrophil' },
            { time: 30, towerId: 'bcell' }
        ],
        skills: {
            sneeze: {
                name: '喷嚏',
                cooldown: 20000, // 20秒
                damage: 30
            }
        }
    } as LevelConfig,
    
    // 第1关 - 120秒
    level_1: {
        name: '初级防御',
        initialPlayerHealth: 300,
        initialResources: 50,
        initialEnemies: {
            count: 3,
            enemyType: 'commonBacteria'
        },
        waves: [
            {
                startTime: 0,
                endTime: 60,
                interval: 1000, // 1.0秒/个
                enemyType: 'commonBacteria'
            },
            {
                startTime: 60,
                endTime: 120,
                interval: 700, // 0.7秒/个
                enemyType: 'commonBacteria'
            }
        ],
        towerUnlocks: [
            { time: 0, towerId: 'neutrophil' },
            { time: 30, towerId: 'bcell' }
        ],
        skills: {
            sneeze: {
                name: '喷嚏',
                cooldown: 30000,
                damage: 25
            }
        },
        maxTowers: 15
    } as LevelConfig,
    
    // 第2关 - 150秒
    level_2: {
        name: '细菌大爆发',
        initialPlayerHealth: 400,
        initialResources: 60,
        initialEnemies: {
            count: 5,
            enemyType: 'commonBacteria'
        },
        waves: [
            {
                startTime: 0,
                endTime: 150,
                interval: 1500,
                enemyType: 'commonBacteria'
            }
        ],
        towerUnlocks: [
            { time: 0, towerId: 'neutrophil' },
            { time: 20, towerId: 'bcell' }
        ],
        skills: {
            sneeze: {
                name: '喷嚏',
                cooldown: 25000,
                damage: 30
            }
        }
    } as LevelConfig,
    
    // 第3关 - 180秒
    level_3: {
        name: '免疫强化',
        initialPlayerHealth: 500,
        initialResources: 70,
        initialEnemies: {
            count: 7,
            enemyType: 'commonBacteria'
        },
        waves: [
            {
                startTime: 0,
                endTime: 180,
                interval: 1200,
                enemyType: 'commonBacteria'
            }
        ],
        towerUnlocks: [
            { time: 0, towerId: 'neutrophil' },
            { time: 15, towerId: 'bcell' },
            { time: 45, towerId: 'tcell' }
        ],
        skills: {
            sneeze: {
                name: '喷嚏',
                cooldown: 20000,
                damage: 35
            }
        }
    } as LevelConfig,
    
    // 第4关 - 200秒
    level_4: {
        name: '终极防御',
        initialPlayerHealth: 600,
        initialResources: 80,
        initialEnemies: {
            count: 10,
            enemyType: 'commonBacteria'
        },
        waves: [
            {
                startTime: 0,
                endTime: 200,
                interval: 1000,
                enemyType: 'commonBacteria'
            }
        ],
        towerUnlocks: [
            { time: 0, towerId: 'neutrophil' },
            { time: 10, towerId: 'bcell' },
            { time: 30, towerId: 'tcell' },
            { time: 60, towerId: 'macrophage' }
        ],
        skills: {
            sneeze: {
                name: '喷嚏',
                cooldown: 15000,
                damage: 40
            }
        }
    } as LevelConfig,
    
    // 第5关 - 300秒
    level_5: {
        name: '无尽挑战',
        initialPlayerHealth: 800,
        initialResources: 100,
        initialEnemies: {
            count: 15,
            enemyType: 'commonBacteria'
        },
        waves: [
            {
                startTime: 0,
                endTime: 300,
                interval: 800,
                enemyType: 'commonBacteria'
            }
        ],
        towerUnlocks: [
            { time: 0, towerId: 'neutrophil' },
            { time: 5, towerId: 'bcell' },
            { time: 20, towerId: 'tcell' },
            { time: 40, towerId: 'macrophage' }
        ],
        skills: {
            sneeze: {
                name: '喷嚏',
                cooldown: 10000,
                damage: 50
            }
        }
    } as LevelConfig
};