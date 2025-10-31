export type Grade = '低' | '中' | '高' | '空';

export interface CodexUnitEntry {
    id: string; // 与 UnitsConfig 中的 id 一致，例如 'neutrophil' / 'commonBacteria'
    category: 'tower' | 'enemy' | 'organ';
    name: string;
    iconTextureKey: string; // 直接使用已加载的纹理 key，例如 'tower_neutrophil_move'
    hp: Grade;
    attack: Grade;
    cost: Grade; // 敌人可填 '空'
    threat: Grade; // 仅敌人需要，塔为 '空'
    skillBrief: string;
    skillDetail: string;
    description: string;
    knowledge: string;
    unlock: string; // 解锁条件文案
}

export interface CodexConfig {
    units: CodexUnitEntry[];
}

export const CODEX_CONFIG: CodexConfig = {
    units: [
        // 免疫细胞 (Towers)
        {
            id: 'neutrophil',
            category: 'tower',
            name: '嗜中性白血球',
            iconTextureKey: 'tower_neutrophil_move',
            hp: '低',
            attack: '高',
            cost: '低',
            threat: '空',
            skillBrief: '快速攻击',
            skillDetail: '以高频率进行远程攻击，适合对付小型病原体。',
            description: '它们不顾性命地冲锋在战场最前线，以敢死队的身姿与病菌厮杀，致敬，伟大的细胞。',
            knowledge: '中性粒细胞（neutrophil）又称嗜中性球，是哺乳动物血液中最主要的白细胞，也是含量最丰富的粒细胞，细胞核常分为2至3叶，含有可被伊红染料染成粉红色的颗粒，胞内富含溶酶体酶等杀菌物质，可随血流迅速动员至感染部位，具活跃的变形运动及吞噬细菌功能，在机体抗感染中发挥重要作用。',
            unlock: '游戏开始时解锁'
        },
        {
            id: 'bcell',
            category: 'tower',
            name: 'B细胞',
            iconTextureKey: 'tower_bcell_move',
            hp: '中',
            attack: '高',
            cost: '中',
            threat: '空',
            skillBrief: '抗体攻击',
            skillDetail: '产生特异性抗体，对特定病原体造成额外伤害。',
            description: 'B细胞是适应性免疫系统的重要组成部分，能够识别并记忆入侵的病原体。',
            knowledge: 'B细胞是淋巴细胞的一种，主要负责体液免疫。当遇到抗原时，B细胞会分化为浆细胞，产生特异性抗体来中和病原体。B细胞还具有免疫记忆功能，能够记住曾经遇到过的病原体。',
            unlock: '通关第1关后解锁'
        },
        {
            id: 'tcell',
            category: 'tower',
            name: 'T细胞',
            iconTextureKey: 'tower_tcell_move',
            hp: '高',
            attack: '中',
            cost: '高',
            threat: '空',
            skillBrief: '细胞免疫',
            skillDetail: '直接攻击被感染的细胞，激活其他免疫细胞。',
            description: 'T细胞是细胞免疫的核心，能够识别并清除被病毒感染的细胞。',
            knowledge: 'T细胞是淋巴细胞的一种，主要负责细胞免疫。包括辅助性T细胞（Th）、细胞毒性T细胞（Tc）和调节性T细胞（Treg）。T细胞通过T细胞受体识别抗原，并激活相应的免疫反应。',
            unlock: '通关第2关后解锁'
        },
        {
            id: 'macrophage',
            category: 'tower',
            name: '巨噬细胞',
            iconTextureKey: 'tower_macrophage_move',
            hp: '高',
            attack: '高',
            cost: '高',
            threat: '空',
            skillBrief: '吞噬攻击',
            skillDetail: '强大的吞噬能力，能够清除大型病原体和细胞碎片。',
            description: '巨噬细胞是免疫系统的清道夫，能够吞噬和消化各种病原体及死亡细胞。',
            knowledge: '巨噬细胞是单核吞噬细胞系统的重要组成部分，具有强大的吞噬能力。它们不仅能够吞噬病原体，还能分泌细胞因子来调节免疫反应，并作为抗原提呈细胞激活其他免疫细胞。',
            unlock: '通关第3关后解锁'
        },

        // 病原体 (Enemies)
        {
            id: 'commonBacteria',
            category: 'enemy',
            name: '普通病菌',
            iconTextureKey: 'enemy_bacteria_move',
            hp: '中',
            attack: '中',
            cost: '空',
            threat: '中',
            skillBrief: '感染',
            skillDetail: '接触玩家单位时造成持续伤害，能够快速繁殖。',
            description: '最常见的病原体，数量众多但个体较弱，需要及时清除。',
            knowledge: '细菌是一大类单细胞原核微生物，广泛分布于自然界。部分细菌对人类健康构成威胁，可引起各种感染性疾病。细菌具有快速繁殖能力，能够在适宜条件下迅速增殖。',
            unlock: '进入任意关卡即可遇到'
        },

        // 免疫器官 (Organ)
        {
            id: 'immuneOrgan',
            category: 'organ',
            name: '免疫器官',
            iconTextureKey: 'immune_organ',
            hp: '高',
            attack: '空',
            cost: '空',
            threat: '空',
            skillBrief: '资源生成',
            skillDetail: '持续生成免疫资源，是免疫系统的重要基地。',
            description: '免疫器官是免疫细胞产生和成熟的场所，也是免疫反应的重要指挥中心。',
            knowledge: '免疫器官包括中枢免疫器官（骨髓、胸腺）和外周免疫器官（淋巴结、脾脏等）。骨髓是造血干细胞的主要来源，胸腺是T细胞发育成熟的场所，淋巴结和脾脏是免疫反应发生的主要场所。',
            unlock: '游戏开始时即可使用'
        }
    ]
};



