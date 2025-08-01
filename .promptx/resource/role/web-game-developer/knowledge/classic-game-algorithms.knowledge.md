<knowledge>
  ## 经典游戏算法实现库
  
  ### A*寻路算法完整实现
  
  ```javascript
  class AStarPathfinder {
      constructor(grid) {
          this.grid = grid;
          this.openSet = [];
          this.closedSet = [];
      }
      
      findPath(start, goal) {
          this.openSet = [start];
          this.closedSet = [];
          
          start.gScore = 0;
          start.fScore = this.heuristic(start, goal);
          
          while (this.openSet.length > 0) {
              // 选择f值最小的节点
              let current = this.openSet.reduce((min, node) => 
                  node.fScore < min.fScore ? node : min
              );
              
              if (current === goal) {
                  return this.reconstructPath(current);
              }
              
              this.openSet = this.openSet.filter(node => node !== current);
              this.closedSet.push(current);
              
              // 检查邻居节点
              const neighbors = this.getNeighbors(current);
              for (let neighbor of neighbors) {
                  if (this.closedSet.includes(neighbor) || !neighbor.walkable) {
                      continue;
                  }
                  
                  const tentativeGScore = current.gScore + this.distance(current, neighbor);
                  
                  if (!this.openSet.includes(neighbor)) {
                      this.openSet.push(neighbor);
                  } else if (tentativeGScore >= neighbor.gScore) {
                      continue;
                  }
                  
                  neighbor.parent = current;
                  neighbor.gScore = tentativeGScore;
                  neighbor.fScore = neighbor.gScore + this.heuristic(neighbor, goal);
              }
          }
          
          return []; // 无路径
      }
      
      heuristic(a, b) {
          // 曼哈顿距离
          return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      }
      
      reconstructPath(current) {
          const path = [];
          while (current) {
              path.unshift(current);
              current = current.parent;
          }
          return path;
      }
  }
  ```
  
  ### 高效碰撞检测系统
  
  ```javascript
  // 四叉树空间分割优化
  class QuadTree {
      constructor(bounds, maxObjects = 10, maxLevels = 5, level = 0) {
          this.maxObjects = maxObjects;
          this.maxLevels = maxLevels;
          this.level = level;
          this.bounds = bounds;
          this.objects = [];
          this.nodes = [];
      }
      
      split() {
          const subWidth = this.bounds.width / 2;
          const subHeight = this.bounds.height / 2;
          const x = this.bounds.x;
          const y = this.bounds.y;
          
          this.nodes[0] = new QuadTree({
              x: x + subWidth, y: y, width: subWidth, height: subHeight
          }, this.maxObjects, this.maxLevels, this.level + 1);
          
          this.nodes[1] = new QuadTree({
              x: x, y: y, width: subWidth, height: subHeight
          }, this.maxObjects, this.maxLevels, this.level + 1);
          
          this.nodes[2] = new QuadTree({
              x: x, y: y + subHeight, width: subWidth, height: subHeight
          }, this.maxObjects, this.maxLevels, this.level + 1);
          
          this.nodes[3] = new QuadTree({
              x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight
          }, this.maxObjects, this.maxLevels, this.level + 1);
      }
      
      insert(obj) {
          if (this.nodes.length > 0) {
              const index = this.getIndex(obj);
              if (index !== -1) {
                  this.nodes[index].insert(obj);
                  return;
              }
          }
          
          this.objects.push(obj);
          
          if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
              if (this.nodes.length === 0) {
                  this.split();
              }
              
              let i = 0;
              while (i < this.objects.length) {
                  const index = this.getIndex(this.objects[i]);
                  if (index !== -1) {
                      this.nodes[index].insert(this.objects.splice(i, 1)[0]);
                  } else {
                      i++;
                  }
              }
          }
      }
  }
  
  // 精确碰撞检测
  class CollisionSystem {
      static checkAABB(rect1, rect2) {
          return rect1.x < rect2.x + rect2.width &&
                 rect1.x + rect1.width > rect2.x &&
                 rect1.y < rect2.y + rect2.height &&
                 rect1.y + rect1.height > rect2.y;
      }
      
      static checkCircleCircle(circle1, circle2) {
          const dx = circle1.x - circle2.x;
          const dy = circle1.y - circle2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < circle1.radius + circle2.radius;
      }
      
      static checkCircleRect(circle, rect) {
          const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
          const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
          
          const dx = circle.x - closestX;
          const dy = circle.y - closestY;
          
          return (dx * dx + dy * dy) < (circle.radius * circle.radius);
      }
      
      // SAT (Separating Axis Theorem) 多边形碰撞
      static checkSAT(poly1, poly2) {
          const axes1 = this.getAxes(poly1);
          const axes2 = this.getAxes(poly2);
          
          for (let axis of [...axes1, ...axes2]) {
              const proj1 = this.project(poly1, axis);
              const proj2 = this.project(poly2, axis);
              
              if (!this.overlap(proj1, proj2)) {
                  return false; // 分离轴存在，无碰撞
              }
          }
          
          return true; // 所有轴都重叠，发生碰撞
      }
  }
  ```
  
  ### AI行为树系统
  
  ```javascript
  // 行为树节点基类
  class BehaviorNode {
      constructor() {
          this.status = 'READY'; // READY, RUNNING, SUCCESS, FAILURE
      }
      
      execute(blackboard) {
          throw new Error('Execute method must be implemented');
      }
      
      reset() {
          this.status = 'READY';
      }
  }
  
  // 复合节点：序列节点
  class SequenceNode extends BehaviorNode {
      constructor(children = []) {
          super();
          this.children = children;
          this.currentIndex = 0;
      }
      
      execute(blackboard) {
          while (this.currentIndex < this.children.length) {
              const child = this.children[this.currentIndex];
              const result = child.execute(blackboard);
              
              if (result === 'RUNNING') {
                  this.status = 'RUNNING';
                  return 'RUNNING';
              } else if (result === 'FAILURE') {
                  this.reset();
                  this.status = 'FAILURE';
                  return 'FAILURE';
              } else if (result === 'SUCCESS') {
                  this.currentIndex++;
              }
          }
          
          this.reset();
          this.status = 'SUCCESS';
          return 'SUCCESS';
      }
      
      reset() {
          super.reset();
          this.currentIndex = 0;
          this.children.forEach(child => child.reset());
      }
  }
  
  // 选择节点
  class SelectorNode extends BehaviorNode {
      constructor(children = []) {
          super();
          this.children = children;
          this.currentIndex = 0;
      }
      
      execute(blackboard) {
          while (this.currentIndex < this.children.length) {
              const child = this.children[this.currentIndex];
              const result = child.execute(blackboard);
              
              if (result === 'RUNNING') {
                  this.status = 'RUNNING';
                  return 'RUNNING';
              } else if (result === 'SUCCESS') {
                  this.reset();
                  this.status = 'SUCCESS';
                  return 'SUCCESS';
              } else if (result === 'FAILURE') {
                  this.currentIndex++;
              }
          }
          
          this.reset();
          this.status = 'FAILURE';
          return 'FAILURE';
      }
  }
  
  // 条件节点示例
  class IsEnemyNearby extends BehaviorNode {
      constructor(detectionRange) {
          super();
          this.detectionRange = detectionRange;
      }
      
      execute(blackboard) {
          const aiEntity = blackboard.get('aiEntity');
          const enemies = blackboard.get('enemies');
          
          for (let enemy of enemies) {
              const distance = this.calculateDistance(aiEntity.position, enemy.position);
              if (distance < this.detectionRange) {
                  this.status = 'SUCCESS';
                  return 'SUCCESS';
              }
          }
          
          this.status = 'FAILURE';
          return 'FAILURE';
      }
      
      calculateDistance(pos1, pos2) {
          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          return Math.sqrt(dx * dx + dy * dy);
      }
  }
  ```
  
  ### 状态机系统
  
  ```javascript
  // 有限状态机
  class StateMachine {
      constructor(initialState) {
          this.states = new Map();
          this.currentState = null;
          this.previousState = null;
          
          if (initialState) {
              this.currentState = initialState;
          }
      }
      
      addState(name, state) {
          this.states.set(name, state);
      }
      
      changeState(stateName) {
          const newState = this.states.get(stateName);
          if (!newState) {
              console.warn(`State ${stateName} not found`);
              return;
          }
          
          if (this.currentState) {
              this.currentState.exit();
              this.previousState = this.currentState;
          }
          
          this.currentState = newState;
          this.currentState.enter();
      }
      
      update(deltaTime) {
          if (this.currentState) {
              this.currentState.update(deltaTime);
          }
      }
  }
  
  // 状态基类
  class State {
      constructor(name) {
          this.name = name;
      }
      
      enter() {
          // 进入状态时的逻辑
      }
      
      update(deltaTime) {
          // 状态更新逻辑
      }
      
      exit() {
          // 退出状态时的逻辑
      }
  }
  
  // 具体状态实现示例
  class IdleState extends State {
      constructor() {
          super('Idle');
      }
      
      enter() {
          console.log('Entering Idle state');
      }
      
      update(deltaTime) {
          // 检查条件，可能转换到其他状态
          if (this.shouldAttack()) {
              this.stateMachine.changeState('Attack');
          } else if (this.shouldPatrol()) {
              this.stateMachine.changeState('Patrol');
          }
      }
  }
  ```
  
  ### 物理引擎集成
  
  ```javascript
  // Matter.js物理引擎集成示例
  class PhysicsWorld {
      constructor() {
          this.engine = Matter.Engine.create();
          this.world = this.engine.world;
          this.render = null;
          
          // 设置重力
          this.engine.world.gravity.y = 1;
      }
      
      createBox(x, y, width, height, options = {}) {
          const box = Matter.Bodies.rectangle(x, y, width, height, options);
          Matter.World.add(this.world, box);
          return box;
      }
      
      createCircle(x, y, radius, options = {}) {
          const circle = Matter.Bodies.circle(x, y, radius, options);
          Matter.World.add(this.world, circle);
          return circle;
      }
      
      addConstraint(bodyA, bodyB, options = {}) {
          const constraint = Matter.Constraint.create({
              bodyA: bodyA,
              bodyB: bodyB,
              ...options
          });
          Matter.World.add(this.world, constraint);
          return constraint;
      }
      
      update() {
          Matter.Engine.update(this.engine);
      }
      
      onCollision(callback) {
          Matter.Events.on(this.engine, 'collisionStart', callback);
      }
  }
  ```
  
  ### 粒子系统
  
  ```javascript
  // 高性能粒子系统
  class ParticleSystem {
      constructor(maxParticles = 1000) {
          this.particles = [];
          this.maxParticles = maxParticles;
          this.pool = [];
          
          // 预创建粒子池
          for (let i = 0; i < maxParticles; i++) {
              this.pool.push(new Particle());
          }
      }
      
      emit(x, y, config) {
          if (this.pool.length === 0) return;
          
          const particle = this.pool.pop();
          particle.reset(x, y, config);
          this.particles.push(particle);
      }
      
      update(deltaTime) {
          for (let i = this.particles.length - 1; i >= 0; i--) {
              const particle = this.particles[i];
              particle.update(deltaTime);
              
              if (particle.isDead()) {
                  this.particles.splice(i, 1);
                  this.pool.push(particle);
              }
          }
      }
      
      render(renderer) {
          for (let particle of this.particles) {
              particle.render(renderer);
          }
      }
  }
  
  class Particle {
      constructor() {
          this.reset(0, 0, {});
      }
      
      reset(x, y, config) {
          this.x = x;
          this.y = y;
          this.vx = config.vx || (Math.random() - 0.5) * 10;
          this.vy = config.vy || (Math.random() - 0.5) * 10;
          this.life = config.life || 1.0;
          this.maxLife = this.life;
          this.size = config.size || 2;
          this.color = config.color || '#ffffff';
      }
      
      update(deltaTime) {
          this.x += this.vx * deltaTime;
          this.y += this.vy * deltaTime;
          this.life -= deltaTime;
          
          // 重力效果
          this.vy += 500 * deltaTime;
      }
      
      isDead() {
          return this.life <= 0;
      }
      
      render(ctx) {
          const alpha = this.life / this.maxLife;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = this.color;
          ctx.fillRect(this.x, this.y, this.size, this.size);
          ctx.globalAlpha = 1;
      }
  }
  ```
</knowledge>
