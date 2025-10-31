/**
 * 精灵图动画配置
 * 定义游戏中所有精灵图的参数和路径
 */

export interface SpriteSheetConfig {
    key: string;
    path: string;
    frameWidth: number;
    frameHeight: number;
    frameRate?: number;
    repeat?: number;
}

export interface AnimationConfig {
    key: string;
    spriteSheetKey: string;
    frameRate: number;
    repeat: number;
}

export const SPRITE_SHEET_CONFIGS: Record<string, SpriteSheetConfig[]> = {
    towers: [
        {
            key: 'tower_neutrophil_idle_spritesheet',
            path: 'assets/units/towers/neutrophil/idle_spritesheet.png',
            frameWidth: 64,
            frameHeight: 64
        },
        {
            key: 'tower_neutrophil_attack_spritesheet',
            path: 'assets/units/towers/neutrophil/attack_spritesheet.png',
            frameWidth: 64,
            frameHeight: 64
        },
        {
            key: 'tower_bcell_idle_spritesheet',
            path: 'assets/units/towers/bcell/idle_spritesheet.png',
            frameWidth: 64,
            frameHeight: 64
        },
        {
            key: 'tower_bcell_attack_spritesheet',
            path: 'assets/units/towers/bcell/attack_spritesheet.png',
            frameWidth: 64,
            frameHeight: 64
        },
        {
            key: 'tower_tcell_idle_spritesheet',
            path: 'assets/units/towers/tcell/idle_spritesheet.png',
            frameWidth: 64,
            frameHeight: 64
        },
        {
            key: 'tower_tcell_attack_spritesheet',
            path: 'assets/units/towers/tcell/attack_spritesheet.png',
            frameWidth: 64,
            frameHeight: 64
        },
        {
            key: 'tower_macrophage_idle_spritesheet',
            path: 'assets/units/towers/macrophage/idle_spritesheet.png',
            frameWidth: 64,
            frameHeight: 64
        },
        {
            key: 'tower_macrophage_attack_spritesheet',
            path: 'assets/units/towers/macrophage/attack_spritesheet.png',
            frameWidth: 64,
            frameHeight: 64
        }
    ],
    enemies: [
        {
            key: 'enemy_commonBacteria_idle_spritesheet',
            path: 'assets/units/enemies/bacteria/common/idle_spritesheet.png',
            frameWidth: 48,
            frameHeight: 48
        },
        {
            key: 'enemy_commonBacteria_move_spritesheet',
            path: 'assets/units/enemies/bacteria/common/move_spritesheet.png',
            frameWidth: 48,
            frameHeight: 48
        },
        {
            key: 'enemy_commonBacteria_attack_spritesheet',
            path: 'assets/units/enemies/bacteria/common/attack_spritesheet.png',
            frameWidth: 48,
            frameHeight: 48
        },
        {
            key: 'enemy_commonBacteria_death_spritesheet',
            path: 'assets/units/enemies/bacteria/common/death_spritesheet.png',
            frameWidth: 48,
            frameHeight: 48
        }
    ],
    fixed: [
        {
            key: 'immune_organ_level1',
            path: 'assets/units/immune_organ/level1.png',
            frameWidth: 192,
            frameHeight: 192
        },
        {
            key: 'level1_background',
            path: 'assets/environment/level1/background.png',
            frameWidth: 1920,
            frameHeight: 1080
        },
        {
            key: 'level1_ctrl_bg',
            path: 'assets/environment/level1/ctrl_bg.png',
            frameWidth: 400,
            frameHeight: 1080
        }
    ]
};

export const ANIMATION_CONFIGS: Record<string, AnimationConfig[]> = {
    towers: [
        {
            key: 'tower_neutrophil_idle',
            spriteSheetKey: 'tower_neutrophil_idle_spritesheet',
            frameRate: 8,
            repeat: -1
        },
        {
            key: 'tower_neutrophil_attack',
            spriteSheetKey: 'tower_neutrophil_attack_spritesheet',
            frameRate: 12,
            repeat: 0
        },
        {
            key: 'tower_bcell_idle',
            spriteSheetKey: 'tower_bcell_idle_spritesheet',
            frameRate: 8,
            repeat: -1
        },
        {
            key: 'tower_bcell_attack',
            spriteSheetKey: 'tower_bcell_attack_spritesheet',
            frameRate: 12,
            repeat: 0
        },
        {
            key: 'tower_tcell_idle',
            spriteSheetKey: 'tower_tcell_idle_spritesheet',
            frameRate: 8,
            repeat: -1
        },
        {
            key: 'tower_tcell_attack',
            spriteSheetKey: 'tower_tcell_attack_spritesheet',
            frameRate: 12,
            repeat: 0
        },
        {
            key: 'tower_macrophage_idle',
            spriteSheetKey: 'tower_macrophage_idle_spritesheet',
            frameRate: 8,
            repeat: -1
        },
        {
            key: 'tower_macrophage_attack',
            spriteSheetKey: 'tower_macrophage_attack_spritesheet',
            frameRate: 12,
            repeat: 0
        }
    ],
    enemies: [
        {
            key: 'enemy_commonBacteria_idle',
            spriteSheetKey: 'enemy_commonBacteria_idle_spritesheet',
            frameRate: 6,
            repeat: -1
        },
        {
            key: 'enemy_commonBacteria_move',
            spriteSheetKey: 'enemy_commonBacteria_move_spritesheet',
            frameRate: 8,
            repeat: -1
        },
        {
            key: 'enemy_commonBacteria_attack',
            spriteSheetKey: 'enemy_commonBacteria_attack_spritesheet',
            frameRate: 10,
            repeat: 0
        },
        {
            key: 'enemy_commonBacteria_death',
            spriteSheetKey: 'enemy_commonBacteria_death_spritesheet',
            frameRate: 8,
            repeat: 0
        }
    ]
};