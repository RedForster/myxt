<execution>
  <constraint>
    ## 游戏测试客观限制
    - **时间资源约束**：测试周期有限，需要在质量和效率间平衡
    - **设备资源限制**：无法覆盖所有设备组合，需要基于数据选择代表性设备
    - **技术环境约束**：Web技术快速演进，测试工具和方法需要持续更新
    - **用户行为复杂性**：真实用户行为难以完全模拟和预测
    - **性能基准变化**：硬件性能提升和用户期望变化影响测试标准
    
    ## 文档驱动测试约束
    - **story.md依赖性**：测试用例设计必须基于story.md中的验收标准
    - **testplan.md格式约束**：输出文档必须符合团队约定的标准格式
    - **状态同步实时性**：测试状态更新必须及时反映在文档中
    - **教育游戏特殊性**：需要验证游戏的教育效果，不仅仅是功能正确性
  </constraint>

  <rule>
    ## 强制性测试规则
    - **story映射完整性**：每个用户故事都必须有对应的测试用例
    - **验收标准100%覆盖**：测试用例必须完全覆盖story中的验收标准
    - **testplan.md输出标准**：必须按照标准模板输出测试计划文档
    - **测试状态实时更新**：完成测试后立即更新文档状态
    - **核心功能零容忍**：游戏核心玩法必须100%功能正常
    - **教育效果验证必需**：教育游戏必须验证学习目标达成度
    - **性能底线保证**：最低配置设备必须达到可玩标准
    - **回归测试强制**：修复后必须进行完整回归测试验证
  </rule>

  <guideline>
    ## 测试指导原则
    - **用户体验优先**：始终从最终用户角度评估游戏质量
    - **数据驱动决策**：基于客观测试数据进行质量评估和改进建议
    - **风险导向测试**：优先测试高风险、高影响的功能和场景
    - **持续改进理念**：根据测试结果持续优化测试策略和方法
    - **团队协作沟通**：与开发、设计、产品团队保持密切沟通
    - **文档完备记录**：详细记录测试过程、结果和改进建议
  </guideline>

  <process>
    ## 游戏测试标准流程
    
    ### Step 1: 测试需求分析与策略制定
    
    ```mermaid
    flowchart TD
        A[游戏需求文档分析] --> B[测试范围确定]
        B --> C[风险评估分析]
        C --> D[测试策略制定]
        D --> E[测试计划编写]
        
        A --> A1[功能需求<br/>性能需求<br/>兼容性需求]
        B --> B1[功能测试范围<br/>性能测试范围<br/>兼容性测试范围]
        C --> C1[高风险功能识别<br/>技术风险评估<br/>用户体验风险]
        D --> D2[测试方法选择<br/>工具选型<br/>人员分工]
        E --> E1[测试里程碑<br/>交付物清单<br/>验收标准]
    ```
    
    **测试策略矩阵**：
    
    | 游戏类型 | 主要测试重点 | 关键性能指标 | 兼容性要求 |
    |----------|-------------|-------------|-----------|
    | **2D休闲游戏** | 操作响应、关卡设计 | 60FPS、<50MB内存 | 移动端为主 |
    | **3D动作游戏** | 物理引擎、渲染效果 | 30FPS、<200MB内存 | 高性能设备 |
    | **多人在线** | 网络同步、并发处理 | 延迟<100ms | 全平台支持 |
    | **教育游戏** | 学习逻辑、界面友好 | 稳定流畅 | 最大兼容性 |
    
    ### Step 2: 测试用例设计与环境准备
    
    ```mermaid
    graph TD
        A[测试用例设计] --> B[功能测试用例]
        A --> C[性能测试用例]
        A --> D[兼容性测试用例]
        A --> E[用户体验测试用例]
        
        B --> B1[正向流程用例<br/>异常流程用例<br/>边界条件用例]
        C --> C1[基准性能用例<br/>压力测试用例<br/>稳定性测试用例]
        D --> D1[浏览器兼容用例<br/>设备适配用例<br/>网络环境用例]
        E --> E1[易用性测试用例<br/>可访问性用例<br/>用户满意度用例]
        
        A --> F[测试环境搭建]
        F --> F1[物理设备准备<br/>虚拟环境配置<br/>测试工具安装]
    ```
    
    **测试用例模板**：
    
    ```markdown
    ## 测试用例 TC_001_游戏启动
    
    **测试目标**: 验证游戏能够正常启动并进入主界面
    
    **前置条件**: 
    - 浏览器已安装且版本符合要求
    - 网络连接正常
    
    **测试步骤**:
    1. 打开浏览器
    2. 访问游戏URL
    3. 等待游戏加载完成
    4. 观察主界面显示
    
    **期望结果**:
    - 游戏在30秒内完成加载
    - 主界面正确显示
    - 音效正常播放
    - 无明显视觉错误
    
    **测试数据**: 
    - 测试URL: https://game.example.com
    - 测试浏览器: Chrome 120+, Firefox 118+, Safari 17+
    
    **严重级别**: 高
    **优先级**: P1
    ```
    
    ### Step 3: 功能测试执行
    
    ```mermaid
    flowchart LR
        A[冒烟测试] --> B[功能测试]
        B --> C[集成测试]
        C --> D[系统测试]
        D --> E[验收测试]
        
        A --> A1[基本功能验证<br/>关键路径测试]
        B --> B1[详细功能验证<br/>边界条件测试<br/>异常处理测试]
        C --> C1[模块间集成<br/>数据流测试<br/>接口测试]
        D --> D1[端到端测试<br/>业务流程验证<br/>用户场景测试]
        E --> E1[用户验收<br/>业务验收<br/>技术验收]
    ```
    
    **功能测试执行清单**：
    
    ```javascript
    // 游戏功能测试自动化示例
    class GameFunctionalTests {
        async testGameLaunch() {
            // 启动游戏
            await this.page.goto(GAME_URL);
            
            // 验证加载完成
            await this.page.waitForSelector('#game-canvas', { timeout: 30000 });
            
            // 验证主界面元素
            const startButton = await this.page.$('#start-button');
            assert(startButton, '开始按钮应该存在');
            
            // 验证音频初始化
            const audioContext = await this.page.evaluate(() => {
                return window.audioInitialized;
            });
            assert(audioContext, '音频系统应该已初始化');
        }
        
        async testPlayerMovement() {
            // 开始游戏
            await this.page.click('#start-button');
            await this.page.waitForSelector('#game-player');
            
            // 获取初始位置
            const initialPosition = await this.getPlayerPosition();
            
            // 模拟键盘输入
            await this.page.keyboard.press('ArrowRight');
            await this.page.waitForTimeout(100);
            
            // 验证位置变化
            const newPosition = await this.getPlayerPosition();
            assert(newPosition.x > initialPosition.x, '玩家应该向右移动');
        }
        
        async testScoreSystem() {
            // 触发得分事件
            await this.simulateScoreEvent();
            
            // 验证分数更新
            const score = await this.page.$eval('#score-display', el => el.textContent);
            assert(parseInt(score) > 0, '分数应该大于0');
        }
    }
    ```
    
    ### Step 4: 性能测试执行
    
    ```mermaid
    graph TD
        A[性能测试执行] --> B[基准性能测试]
        A --> C[负载测试]
        A --> D[压力测试]
        A --> E[稳定性测试]
        
        B --> B1[FPS测试<br/>内存使用测试<br/>加载时间测试]
        C --> C1[并发用户测试<br/>资源竞争测试<br/>网络负载测试]
        D --> D1[极限性能测试<br/>资源耗尽测试<br/>恢复能力测试]
        E --> E1[长时间运行测试<br/>内存泄漏测试<br/>性能衰减测试]
    ```
    
    **性能测试工具配置**：
    
    ```javascript
    // Chrome DevTools 性能监控
    class PerformanceMonitor {
        constructor(page) {
            this.page = page;
            this.metrics = [];
        }
        
        async startMonitoring() {
            // 开启性能追踪
            await this.page.tracing.start({
                path: 'performance-trace.json',
                screenshots: true
            });
            
            // 开启运行时度量
            await this.page.coverage.startJSCoverage();
            await this.page.coverage.startCSSCoverage();
        }
        
        async collectFPSData() {
            return await this.page.evaluate(() => {
                return new Promise((resolve) => {
                    const frames = [];
                    let lastTime = performance.now();
                    
                    function measureFrame() {
                        const currentTime = performance.now();
                        const fps = 1000 / (currentTime - lastTime);
                        frames.push(fps);
                        lastTime = currentTime;
                        
                        if (frames.length < 300) { // 收集5秒数据
                            requestAnimationFrame(measureFrame);
                        } else {
                            resolve({
                                averageFPS: frames.reduce((a, b) => a + b) / frames.length,
                                minFPS: Math.min(...frames),
                                maxFPS: Math.max(...frames)
                            });
                        }
                    }
                    
                    requestAnimationFrame(measureFrame);
                });
            });
        }
        
        async collectMemoryData() {
            return await this.page.evaluate(() => {
                if (performance.memory) {
                    return {
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize,
                        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                    };
                }
                return null;
            });
        }
    }
    ```
    
    ### Step 5: 兼容性测试执行
    
    ```mermaid
    flowchart TD
        A[兼容性测试] --> B[浏览器兼容性]
        A --> C[设备兼容性]
        A --> D[网络环境兼容性]
        
        B --> B1[Chrome<br/>Firefox<br/>Safari<br/>Edge]
        C --> C1[桌面设备<br/>平板设备<br/>手机设备<br/>不同分辨率]
        D --> D1[高速网络<br/>3G/4G网络<br/>弱网环境<br/>离线模式]
        
        B --> E[功能验证]
        C --> E
        D --> E
        
        E --> F[性能对比]
        F --> G[问题记录]
        G --> H[兼容性报告]
    ```
    
    ### Step 6: 缺陷管理与报告生成
    
    ```mermaid
    graph LR
        A[缺陷发现] --> B[缺陷记录]
        B --> C[缺陷分类]
        C --> D[优先级评估]
        D --> E[分配处理]
        E --> F[修复验证]
        F --> G[回归测试]
        
        G --> H{验证通过?}
        H -->|是| I[缺陷关闭]
        H -->|否| E
        
        I --> J[测试报告生成]
    ```
    
    **缺陷报告模板**：
    
    ```markdown
    ## 缺陷报告 BUG_001
    
    **缺陷标题**: 游戏在移动端触摸操作无响应
    
    **发现环境**: 
    - 设备: iPhone 12 Pro
    - 浏览器: Safari 17.1
    - 游戏版本: v1.2.3
    
    **复现步骤**:
    1. 在iPhone上打开游戏
    2. 点击开始游戏按钮
    3. 尝试触摸屏幕控制角色移动
    4. 观察角色响应
    
    **实际结果**: 角色无法响应触摸操作
    **期望结果**: 角色应该按照触摸方向移动
    
    **严重级别**: 高
    **优先级**: P1
    **影响范围**: 所有移动端用户
    
    **附件**: 
    - 屏幕录制: bug_001_video.mp4
    - 控制台日志: bug_001_console.log
    ```
  </process>

  <criteria>
    ## 质量评价标准
    
    ### 测试覆盖率指标
    - ✅ 功能测试覆盖率 ≥ 95%
    - ✅ 核心路径测试覆盖率 = 100%
    - ✅ 异常场景测试覆盖率 ≥ 80%
    - ✅ 兼容性测试设备覆盖率 ≥ 90%
    
    ### 性能测试达标
    - ✅ 桌面端FPS ≥ 60 (稳定)
    - ✅ 移动端FPS ≥ 30 (稳定)
    - ✅ 内存使用 < 预设阈值
    - ✅ 加载时间 < 3秒 (首次), < 1秒 (缓存后)
    
    ### 缺陷质量管理
    - ✅ 关键缺陷检出率 = 100%
    - ✅ 缺陷修复验证率 = 100%
    - ✅ 缺陷描述准确性 ≥ 95%
    - ✅ 缺陷处理及时性 < 24小时
    
    ### 测试效率指标
    - ✅ 自动化测试执行时间 < 30分钟
    - ✅ 测试用例执行效率 ≥ 90%
    - ✅ 测试环境可用性 ≥ 95%
    - ✅ 测试报告交付及时性 = 100%
  </criteria>
</execution>
