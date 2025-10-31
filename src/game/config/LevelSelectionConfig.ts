/**
 * 关卡选择配置数据
 * 用于关卡选择界面的显示和管理
 */
export interface LevelSelectionConfig {
    id: string;
    name: string;
    title: string;
    description: string;
    previewImage: string;
    difficulty: 'easy' | 'medium' | 'hard';
    unlocked: boolean;
    completed: boolean;
    bestScore?: number;
    duration: number; // 游戏时长（秒）
    enemyWaves: {
        type: string;
        count: number;
        interval: number;
        delay: number;
    }[];
    towers: string[]; // 可用的塔类型
    rewards?: {
        resources: number;
        unlocks?: string[];
    };
}

/**
 * 关卡选择配置
 */
export const LEVEL_SELECTION_CONFIGS: LevelSelectionConfig[] = [
    {
        id: 'level_1',
        name: '第一关',
        title: '初级防御',
        description: '学习基础防御策略，抵御第一批入侵的细菌。只有中性粒细胞可用。',
        previewImage: 'level1_background',
        difficulty: 'easy',
        unlocked: true,
        completed: false,
        duration: 120,
        enemyWaves: [
            { type: 'bacteria', count: 5, interval: 2000, delay: 1000 },
            { type: 'bacteria', count: 8, interval: 1500, delay: 15000 },
            { type: 'bacteria', count: 12, interval: 1000, delay: 30000 }
        ],
        towers: ['neutrophil'],
        rewards: {
            resources: 100,
            unlocks: ['b_cell']
        }
    },
    {
        id: 'level_2',
        name: '第二关',
        title: '细菌大爆发',
        description: '细菌数量激增！现在可以使用B细胞进行远程攻击了。',
        previewImage: 'level_preview_2',
        difficulty: 'medium',
        unlocked: false,
        completed: false,
        duration: 150,
        enemyWaves: [
            { type: 'bacteria', count: 10, interval: 1500, delay: 1000 },
            { type: 'bacteria', count: 15, interval: 1200, delay: 20000 },
            { type: 'bacteria', count: 20, interval: 1000, delay: 40000 }
        ],
        towers: ['neutrophil', 'b_cell'],
        rewards: {
            resources: 200,
            unlocks: ['t_cell']
        }
    },
    {
        id: 'level_3',
        name: '第三关',
        title: '免疫强化',
        description: 'T细胞加入战斗！它们的特殊targeting系统能更有效地消灭敌人。',
        previewImage: 'level_preview_3',
        difficulty: 'medium',
        unlocked: false,
        completed: false,
        duration: 180,
        enemyWaves: [
            { type: 'bacteria', count: 15, interval: 1200, delay: 1000 },
            { type: 'bacteria', count: 20, interval: 1000, delay: 25000 },
            { type: 'bacteria', count: 25, interval: 800, delay: 50000 }
        ],
        towers: ['neutrophil', 'b_cell', 't_cell'],
        rewards: {
            resources: 300,
            unlocks: ['macrophage']
        }
    },
    {
        id: 'level_4',
        name: '第四关',
        title: '终极防御',
        description: '所有免疫细胞集结！巨噬细胞将用其强大的区域攻击能力清除一切威胁。',
        previewImage: 'level_preview_1',
        difficulty: 'hard',
        unlocked: false,
        completed: false,
        duration: 200,
        enemyWaves: [
            { type: 'bacteria', count: 20, interval: 1000, delay: 1000 },
            { type: 'bacteria', count: 30, interval: 800, delay: 30000 },
            { type: 'bacteria', count: 40, interval: 600, delay: 60000 }
        ],
        towers: ['neutrophil', 'b_cell', 't_cell', 'macrophage'],
        rewards: {
            resources: 500
        }
    },
    {
        id: 'level_5',
        name: '第五关',
        title: '无尽挑战',
        description: '无尽的敌人浪潮！测试你的防御策略的极限。',
        previewImage: 'level_preview_2',
        difficulty: 'hard',
        unlocked: false,
        completed: false,
        duration: 300,
        enemyWaves: [
            { type: 'bacteria', count: 25, interval: 800, delay: 1000 },
            { type: 'bacteria', count: 35, interval: 600, delay: 20000 },
            { type: 'bacteria', count: 50, interval: 500, delay: 40000 },
            { type: 'bacteria', count: 999, interval: 400, delay: 80000 } // 无尽模式
        ],
        towers: ['neutrophil', 'b_cell', 't_cell', 'macrophage'],
        rewards: {
            resources: 1000
        }
    }
];

/**
 * 关卡选择管理器
 */
export class LevelSelectionManager {
    private static instance: LevelSelectionManager;
    private levels: LevelSelectionConfig[] = [];
    private currentLevel: LevelSelectionConfig | null = null;

    constructor() {
        this.levels = JSON.parse(JSON.stringify(LEVEL_SELECTION_CONFIGS)); // 深拷贝
        this.loadProgress();
    }

    static getInstance(): LevelSelectionManager {
        if (!LevelSelectionManager.instance) {
            LevelSelectionManager.instance = new LevelSelectionManager();
        }
        return LevelSelectionManager.instance;
    }

    /**
     * 获取所有关卡
     */
    getAllLevels(): LevelSelectionConfig[] {
        return this.levels;
    }

    /**
     * 获取关卡
     */
    getLevel(id: string): LevelSelectionConfig | undefined {
        return this.levels.find(level => level.id === id);
    }

    /**
     * 获取已解锁的关卡
     */
    getUnlockedLevels(): LevelSelectionConfig[] {
        return this.levels.filter(level => level.unlocked);
    }

    /**
     * 完成关卡
     */
    completeLevel(levelId: string, score: number): void {
        const level = this.getLevel(levelId);
        if (level && !level.completed) {
            level.completed = true;
            level.bestScore = Math.max(level.bestScore || 0, score);
            
            // 解锁下一关
            const currentIndex = this.levels.findIndex(l => l.id === levelId);
            if (currentIndex < this.levels.length - 1) {
                const nextLevel = this.levels[currentIndex + 1];
                nextLevel.unlocked = true;
            }
            
            this.saveProgress();
        }
    }

    /**
     * 设置当前关卡
     */
    setCurrentLevel(level: LevelSelectionConfig): void {
        this.currentLevel = level;
    }

    /**
     * 获取当前关卡
     */
    getCurrentLevel(): LevelSelectionConfig | null {
        return this.currentLevel;
    }

    /**
     * 重置进度
     */
    resetProgress(): void {
        this.levels.forEach((level, index) => {
            level.unlocked = index === 0; // 只有第一关解锁
            level.completed = false;
            level.bestScore = undefined;
        });
        this.saveProgress();
    }

    /**
     * 保存进度
     */
    private saveProgress(): void {
        try {
            const progress = {
                levels: this.levels.map(level => ({
                    id: level.id,
                    unlocked: level.unlocked,
                    completed: level.completed,
                    bestScore: level.bestScore
                }))
            };
            localStorage.setItem('immune_td_level_selection_progress', JSON.stringify(progress));
        } catch (error) {
        }
    }

    /**
     * 加载进度
     */
    private loadProgress(): void {
        try {
            const saved = localStorage.getItem('immune_td_level_selection_progress');
            if (saved) {
                const progress = JSON.parse(saved);
                progress.levels.forEach((savedLevel: any) => {
                    const level = this.getLevel(savedLevel.id);
                    if (level) {
                        level.unlocked = savedLevel.unlocked;
                        level.completed = savedLevel.completed;
                        level.bestScore = savedLevel.bestScore;
                    }
                });
            }
        } catch (error) {
        }
    }
}