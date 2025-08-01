# Immune Tower Defense (免疫塔防)

A 2D tower defense game that simulates the human immune system, built with Phaser 3 and TypeScript. Deploy immune cells as towers to defend against pathogens and protect your immune organ!

![Game Screenshot](screenshot.png)

## 🎮 Game Overview

**Immune Tower Defense** is an educational tower defense game where players take on the role of the immune system, strategically placing different types of immune cells to defend against invading pathogens.

### 🎯 Game Features

- **Immersive Theme**: Experience the human immune system through engaging tower defense gameplay
- **Multiple Tower Types**: Deploy Neutrophils, B-cells, T-cells, and Macrophages (unlock progressively)
- **Resource Management**: Generate resources from your immune organ to build and upgrade defenses
- **Wave System**: Survive increasingly challenging waves of pathogens for 120 seconds
- **Progressive Unlocking**: New tower types become available as you progress

### 🎮 Gameplay

1. **Build Phase**: Spend resources to place immune cell towers in strategic positions
2. **Defense Phase**: Towers automatically target and attack enemies within range
3. **Survival**: Prevent pathogens from reaching your immune organ for 120 seconds
4. **Victory**: Survive all waves with your health intact!

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) (v16 or higher)
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/myxt.git
cd myxt

# Install dependencies
npm install
```

### Development

```bash
# Start development server (hot-reload enabled)
npm run dev

# Game will be available at http://localhost:8080
```

### Production Build

```bash
# Create optimized production build
npm run build

# Build without analytics
npm run build-nolog
```

## 🏗️ Project Structure

```
myxt/
├── src/
│   ├── game/
│   │   ├── scenes/           # Phaser game scenes
│   │   │   ├── Boot.ts      # Initial setup
│   │   │   ├── Preloader.ts # Asset loading
│   │   │   ├── GameScene.ts # Main game logic
│   │   │   └── UIScene.ts   # UI management
│   │   ├── entities/        # Game entities
│   │   │   ├── Entity.ts    # Base entity class
│   │   │   ├── Tower.ts     # Tower classes
│   │   │   ├── Enemy.ts     # Enemy classes
│   │   │   ├── Projectile.ts # Projectile system
│   │   │   └── ImmuneOrgan.ts # Player base
│   │   ├── config/          # Game configuration
│   │   │   ├── LevelConfig.ts # Wave patterns, timing
│   │   │   └── UnitsConfig.ts  # Unit stats and costs
│   │   └── main.ts          # Game configuration
│   └── main.ts              # Application bootstrap
├── assets/                  # Game assets (sprites, textures)
├── public/                  # Static assets
├── docs/                    # Documentation
├── vite/                    # Vite configuration
└── dist/                    # Production build output
```

## 🎯 Game Mechanics

### Tower Types

| Tower | Description | Unlock Time |
|-------|-------------|--------------|
| **Neutrophil** | Fast-attacking basic defender | Start |
| **B-cell** | Ranged attacker with antibodies | 30 seconds |
| **T-cell** | Specialized targeting system | 60 seconds |
| **Macrophage** | Heavy damage, large area effect | 90 seconds |

### Resource System

- **Immune Organ**: Generates resources over time
- **Tower Costs**: Each tower type has different resource requirements
- **Health**: Decreases when enemies reach the right side

### Combat System

- **Auto-targeting**: Towers automatically engage enemies within range
- **Slot-based Targeting**: Each tower can target multiple enemies simultaneously
- **Projectile System**: Object pooling for optimal performance
- **Damage Types**: Different towers have unique attack patterns

## 🛠️ Development

### Architecture

The game uses a **hybrid architecture** combining:
- **Phaser Scene System** for state management
- **Entity-Component pattern** for game objects
- **Event-driven communication** between systems

### Key Systems

- **Resource Management**: Real-time resource generation and spending
- **Wave Spawning**: Timed enemy waves with increasing difficulty
- **Targeting AI**: Smart enemy selection and engagement
- **UI Integration**: Real-time updates for resources and health

### Customization

#### Adding New Towers

1. Create new tower class in `src/game/entities/Tower.ts`
2. Add configuration to `src/game/config/UnitsConfig.ts`
3. Update UI in `src/game/scenes/UIScene.ts`

#### Modifying Waves

Edit `src/game/config/LevelConfig.ts` to adjust:
- Enemy spawn rates
- Wave timing
- Difficulty progression

## 🎨 Assets

### Game Assets

- **Character Sprites**: Immune cells and pathogens in `assets/unit/`
- **Environment**: Stage backgrounds and barriers in `assets/stage/`
- **UI Elements**: Interface components in `assets/UI/`

### Asset Loading

- **Bundled Assets**: Imported via ES modules for small files
- **Static Assets**: Loaded from `public/assets/` at runtime

## 📦 Deployment

```bash
# Build for production
npm run build

# Deploy contents of dist/ folder to your web server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Phaser 3](https://phaser.io/) - The awesome HTML5 game framework
- Powered by [Vite](https://vitejs.dev/) - Next generation frontend tooling
- TypeScript for type-safe development

## 🎮 Play Online

[Demo Link Coming Soon] - Experience the immune defense battle in your browser!

---

**Made with ❤️ for educational gaming and immune system awareness**