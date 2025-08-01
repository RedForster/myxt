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
    } as LevelConfig
};