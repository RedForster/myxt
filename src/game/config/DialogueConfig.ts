/**
 * 对话系统配置
 * 定义触发时机、概率和对话内容
 */

export interface DialogueContent {
    /** 对话内容数组 */
    messages: string[];
    /** 触发概率 (0-1) */
    probability: number;
    /** 是否只触发一次 */
    onceOnly?: boolean;
}

export interface DialogueTrigger {
    /** 触发器ID */
    id: string;
    /** 触发类型 */
    type: 'levelStart' | 'firstDeploy' | 'deploy';
    /** 触发条件 */
    condition?: {
        /** 塔类型（用于部署触发） */
        towerType?: string;
        /** 关卡ID（用于关卡开始触发） */
        levelId?: string;
        /** 是否为首次部署 */
        isFirstTime?: boolean;
    };
    /** 对话内容配置 */
    dialogue: DialogueContent;
}

export const DIALOGUE_CONFIG: DialogueTrigger[] = [
    // 2.1）进入关卡1；100%；a)该版本为demo版本，仅作关卡框架展示与流程演示。
    {
        id: 'levelStart_demo',
        type: 'levelStart',
        condition: {
            levelId: 'level_1'
        },
        dialogue: {
            messages: [
                '欢迎来到免疫塔防游戏！\n该版本为demo版本，仅作关卡框架展示与流程演示。\n祝您游戏愉快！'
            ],
            probability: 1.0,
            onceOnly: true
        }
    },
    
    // 2.2）第一次部署嗜中性白血球；100%；a)嗜中性白血球是优秀的前线士兵，它们适合对抗中小型病原体。
    {
        id: 'firstDeploy_neutrophil',
        type: 'firstDeploy',
        condition: {
            towerType: 'neutrophil',
            isFirstTime: true
        },
        dialogue: {
            messages: [
                '嗜中性白血球是优秀的前线士兵！\n它们适合对抗中小型病原体，拥有快速反应能力和强大的攻击力。\n是您免疫系统中的第一道防线。'
            ],
            probability: 1.0,
            onceOnly: true
        }
    },
    
    // 2.3）第一次部署B细胞；100%；a)B细胞是能在远处发射抗体进行攻击的淋巴细胞。属于免疫的精锐部队它们能够产生抗体，通过抗体击中病原体，使病原体失去毒性。
    {
        id: 'firstDeploy_bcell',
        type: 'firstDeploy',
        condition: {
            towerType: 'bcell',
            isFirstTime: true
        },
        dialogue: {
            messages: [
                'B细胞是能在远处发射抗体进行攻击的淋巴细胞。\n属于免疫的精锐部队，它们能够产生抗体，\n通过抗体击中病原体，使病原体失去毒性。'
            ],
            probability: 1.0,
            onceOnly: true
        }
    },
    
    // 2.4）非第一次部署嗜中性白血球；10%；a)嗜中性白血球的速度很快，且数量很多。有很高的杀伤效率。b)嗜中性白血球擅长人海战术，如果数量占据优势的话，能发挥很大的作用。
    {
        id: 'deploy_neutrophil',
        type: 'deploy',
        condition: {
            towerType: 'neutrophil',
            isFirstTime: false
        },
        dialogue: {
            messages: [
                '嗜中性白血球的速度很快，且数量很多。有很高的杀伤效率。',
                '嗜中性白血球擅长人海战术，如果数量占据优势的话，能发挥很大的作用。'
            ],
            probability: 0.1,
            onceOnly: false
        }
    },
    
    // 2.5）非第一次部署B细胞；10%；a)B细胞能从远处发起攻击，是免疫系统的精锐。b)B细胞的抗体能够让病毒失去毒性，失去威胁。
    {
        id: 'deploy_bcell',
        type: 'deploy',
        condition: {
            towerType: 'bcell',
            isFirstTime: false
        },
        dialogue: {
            messages: [
                'B细胞能从远处发起攻击，是免疫系统的精锐。',
                'B细胞的抗体能够让病毒失去毒性，失去威胁。'
            ],
            probability: 0.1,
            onceOnly: false
        }
    }
];

/**
 * 对话管理器类
 */
export class DialogueManager {
    private triggeredDialogues: Set<string> = new Set();
    private deploymentCount: Map<string, number> = new Map();
    
    /**
     * 重置对话状态
     */
    reset(): void {
        this.triggeredDialogues.clear();
        this.deploymentCount.clear();
    }
    
    /**
     * 检查并触发对话
     * @param triggerType 触发类型
     * @param context 触发上下文
     * @returns 触发的对话内容，如果没有触发则返回null
     */
    checkTrigger(triggerType: 'levelStart' | 'deploy', context: any): string | null {
        for (const trigger of DIALOGUE_CONFIG) {
            if (this.shouldTrigger(trigger, triggerType, context)) {
                return this.triggerDialogue(trigger);
            }
        }
        return null;
    }
    
    /**
     * 判断是否应该触发对话
     */
    private shouldTrigger(trigger: DialogueTrigger, triggerType: string, context: any): boolean {
        // 检查触发类型
        if (trigger.type !== triggerType && !(trigger.type === 'firstDeploy' && triggerType === 'deploy')) {
            return false;
        }
        
        // 检查是否已经触发过（如果设置为只触发一次）
        if (trigger.dialogue.onceOnly && this.triggeredDialogues.has(trigger.id)) {
            return false;
        }
        
        // 检查具体条件
        if (trigger.condition) {
            if (triggerType === 'levelStart') {
                if (trigger.condition.levelId && trigger.condition.levelId !== context.levelId) {
                    return false;
                }
            } else if (triggerType === 'deploy') {
                if (trigger.condition.towerType && trigger.condition.towerType !== context.towerType) {
                    return false;
                }
                
                // 检查是否为首次部署 - 注意：这里需要检查当前部署次数，因为recordDeployment已经被调用了
                const deployCount = this.deploymentCount.get(context.towerType) || 0;
                const isFirstTime = deployCount === 1; // 如果当前计数是1，说明这是首次部署
                
                if (trigger.type === 'firstDeploy' && !isFirstTime) {
                    return false;
                }
                
                if (trigger.type === 'deploy' && trigger.condition.isFirstTime === false && isFirstTime) {
                    return false;
                }
            }
        }
        
        // 检查概率
        return Math.random() < trigger.dialogue.probability;
    }
    
    /**
     * 触发对话
     */
    private triggerDialogue(trigger: DialogueTrigger): string {
        // 记录已触发的对话
        this.triggeredDialogues.add(trigger.id);
        
        // 从对话内容数组中随机选择一条
        const messages = trigger.dialogue.messages;
        const randomIndex = Math.floor(Math.random() * messages.length);
        return messages[randomIndex];
    }
    
    /**
     * 记录部署事件
     */
    recordDeployment(towerType: string): void {
        const count = this.deploymentCount.get(towerType) || 0;
        this.deploymentCount.set(towerType, count + 1);
    }
    
    /**
     * 获取塔类型的部署次数
     */
    getDeploymentCount(towerType: string): number {
        return this.deploymentCount.get(towerType) || 0;
    }
}
