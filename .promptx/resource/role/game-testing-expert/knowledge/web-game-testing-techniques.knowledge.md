<knowledge>
  ## Web游戏测试技术与方法
  
  ### 浏览器自动化测试工具对比
  
  | 工具 | 优势 | 适用场景 | 学习成本 | 性能 |
  |------|------|----------|----------|------|
  | **Selenium WebDriver** | 跨浏览器支持好 | 兼容性测试 | 中 | 中 |
  | **Puppeteer** | Chrome专用，性能好 | Chrome性能测试 | 低 | 高 |
  | **Playwright** | 现代化，功能完整 | 全面自动化测试 | 中 | 高 |
  | **Cypress** | 开发友好，调试便利 | 开发阶段测试 | 低 | 中 |
  
  ### Puppeteer游戏测试实现
  
  ```javascript
  const puppeteer = require('puppeteer');
  
  class WebGameTester {
      constructor() {
          this.browser = null;
          this.page = null;
      }
      
      async setup() {
          this.browser = await puppeteer.launch({
              headless: false, // 可视化测试
              args: ['--no-sandbox', '--disable-web-security']
          });
          this.page = await this.browser.newPage();
          
          // 设置视口大小
          await this.page.setViewport({ width: 1920, height: 1080 });
          
          // 监听控制台消息
          this.page.on('console', msg => {
              console.log('游戏控制台:', msg.text());
          });
          
          // 监听错误
          this.page.on('pageerror', err => {
              console.error('页面错误:', err.message);
          });
      }
      
      // 游戏加载性能测试
      async testGameLoadingPerformance(gameUrl) {
          const startTime = Date.now();
          
          // 开始性能追踪
          await this.page.tracing.start({
              path: 'game-loading-trace.json',
              screenshots: true
          });
          
          // 导航到游戏页面
          await this.page.goto(gameUrl, { waitUntil: 'networkidle0' });
          
          // 等待游戏加载完成标志
          await this.page.waitForFunction(() => {
              return window.gameLoaded === true;
          }, { timeout: 30000 });
          
          const loadTime = Date.now() - startTime;
          
          // 停止追踪
          await this.page.tracing.stop();
          
          return {
              loadTime: loadTime,
              performanceMetrics: await this.getPerformanceMetrics()
          };
      }
      
      // 获取性能指标
      async getPerformanceMetrics() {
          return await this.page.evaluate(() => {
              const navigation = performance.getEntriesByType('navigation')[0];
              const memory = performance.memory;
              
              return {
                  // 加载时间指标
                  domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                  loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                  
                  // 内存使用指标
                  usedJSHeapSize: memory ? memory.usedJSHeapSize : 0,
                  totalJSHeapSize: memory ? memory.totalJSHeapSize : 0,
                  
                  // 资源加载指标
                  resourceCount: performance.getEntriesByType('resource').length
              };
          });
      }
      
      // FPS测试
      async testGameFPS(duration = 10000) {
          const fpsData = await this.page.evaluate((testDuration) => {
              return new Promise((resolve) => {
                  const fps = [];
                  let lastTime = performance.now();
                  const startTime = lastTime;
                  
                  function measureFrame(currentTime) {
                      if (currentTime - startTime < testDuration) {
                          const frameFPS = 1000 / (currentTime - lastTime);
                          fps.push(frameFPS);
                          lastTime = currentTime;
                          requestAnimationFrame(measureFrame);
                      } else {
                          resolve({
                              averageFPS: fps.reduce((a, b) => a + b) / fps.length,
                              minFPS: Math.min(...fps),
                              maxFPS: Math.max(...fps),
                              frameCount: fps.length,
                              samples: fps
                          });
                      }
                  }
                  
                  requestAnimationFrame(measureFrame);
              });
          }, duration);
          
          return fpsData;
      }
      
      // 内存泄漏测试
      async testMemoryLeak(testCycles = 10) {
          const memorySnapshots = [];
          
          for (let i = 0; i < testCycles; i++) {
              // 触发游戏操作
              await this.simulateGameplay();
              
              // 强制垃圾回收（需要Chrome启动参数支持）
              await this.page.evaluate(() => {
                  if (window.gc) window.gc();
              });
              
              // 等待GC完成
              await this.page.waitForTimeout(1000);
              
              // 记录内存使用
              const memoryUsage = await this.page.evaluate(() => {
                  return performance.memory ? {
                      used: performance.memory.usedJSHeapSize,
                      total: performance.memory.totalJSHeapSize,
                      cycle: arguments[0]
                  } : null;
              });
              
              memorySnapshots.push({
                  cycle: i + 1,
                  memory: memoryUsage,
                  timestamp: Date.now()
              });
          }
          
          return this.analyzeMemoryTrend(memorySnapshots);
      }
      
      // 分析内存趋势
      analyzeMemoryTrend(snapshots) {
          const memoryValues = snapshots.map(s => s.memory.used);
          const firstValue = memoryValues[0];
          const lastValue = memoryValues[memoryValues.length - 1];
          const growthRate = ((lastValue - firstValue) / firstValue) * 100;
          
          return {
              snapshots: snapshots,
              memoryGrowth: growthRate,
              isLeaking: growthRate > 20, // 增长超过20%认为可能有泄漏
              analysis: growthRate > 20 ? '检测到可能的内存泄漏' : '内存使用正常'
          };
      }
      
      // 模拟游戏操作
      async simulateGameplay() {
          // 模拟各种游戏操作
          await this.page.mouse.move(400, 300);
          await this.page.mouse.click(400, 300);
          await this.page.keyboard.press('Space');
          await this.page.waitForTimeout(100);
          
          // 模拟连续操作
          for (let i = 0; i < 10; i++) {
              await this.page.keyboard.press('ArrowLeft');
              await this.page.waitForTimeout(50);
              await this.page.keyboard.press('ArrowRight');
              await this.page.waitForTimeout(50);
          }
      }
      
      // 网络性能测试
      async testNetworkPerformance() {
          // 监听网络请求
          const requests = [];
          
          this.page.on('request', request => {
              requests.push({
                  url: request.url(),
                  method: request.method(),
                  timestamp: Date.now()
              });
          });
          
          this.page.on('response', response => {
              const request = requests.find(req => req.url === response.url());
              if (request) {
                  request.status = response.status();
                  request.size = response.headers()['content-length'];
                  request.responseTime = Date.now() - request.timestamp;
              }
          });
          
          // 执行游戏操作触发网络请求
          await this.simulateGameplay();
          
          // 等待网络请求完成
          await this.page.waitForLoadState('networkidle');
          
          return {
              totalRequests: requests.length,
              averageResponseTime: requests.reduce((sum, req) => sum + (req.responseTime || 0), 0) / requests.length,
              failedRequests: requests.filter(req => req.status >= 400).length,
              requests: requests
          };
      }
  }
  ```
  
  ### Chrome DevTools Protocol集成
  
  ```javascript
  class ChromeDevToolsMonitor {
      constructor(page) {
          this.page = page;
          this.client = null;
      }
      
      async connect() {
          this.client = await this.page.target().createCDPSession();
          
          // 启用必要的域
          await this.client.send('Runtime.enable');
          await this.client.send('Performance.enable');
          await this.client.send('Network.enable');
      }
      
      async startProfiling() {
          // 开始CPU分析
          await this.client.send('Profiler.enable');
          await this.client.send('Profiler.start');
          
          // 开始内存分析
          await this.client.send('HeapProfiler.enable');
          await this.client.send('HeapProfiler.startSampling');
      }
      
      async stopProfiling() {
          // 停止CPU分析
          const cpuProfile = await this.client.send('Profiler.stop');
          
          // 停止内存分析
          const heapProfile = await this.client.send('HeapProfiler.stopSampling');
          
          return {
              cpu: cpuProfile,
              heap: heapProfile
          };
      }
      
      async getPerformanceMetrics() {
          const metrics = await this.client.send('Performance.getMetrics');
          
          // 转换为可读格式
          const metricsMap = {};
          metrics.metrics.forEach(metric => {
              metricsMap[metric.name] = metric.value;
          });
          
          return metricsMap;
      }
  }
  ```
  
  ### 跨浏览器兼容性测试框架
  
  ```javascript
  class CrossBrowserTester {
      constructor() {
          this.browsers = [
              { name: 'chrome', version: 'latest' },
              { name: 'firefox', version: 'latest' },
              { name: 'safari', version: 'latest' },
              { name: 'edge', version: 'latest' }
          ];
      }
      
      async runCrossBrowserTests(gameUrl, testSuite) {
          const results = [];
          
          for (const browserConfig of this.browsers) {
              try {
                  const result = await this.runTestsInBrowser(browserConfig, gameUrl, testSuite);
                  results.push({
                      browser: browserConfig,
                      success: true,
                      results: result
                  });
              } catch (error) {
                  results.push({
                      browser: browserConfig,
                      success: false,
                      error: error.message
                  });
              }
          }
          
          return this.generateCompatibilityReport(results);
      }
      
      async runTestsInBrowser(browserConfig, gameUrl, testSuite) {
          const browser = await this.launchBrowser(browserConfig);
          const page = await browser.newPage();
          
          try {
              await page.goto(gameUrl);
              
              const testResults = {};
              
              // 执行功能测试
              testResults.functionality = await this.testGameFunctionality(page);
              
              // 执行性能测试
              testResults.performance = await this.testGamePerformance(page);
              
              // 执行渲染测试
              testResults.rendering = await this.testGameRendering(page);
              
              return testResults;
          } finally {
              await browser.close();
          }
      }
      
      generateCompatibilityReport(results) {
          const compatibilityMatrix = {};
          
          results.forEach(result => {
              const browserName = result.browser.name;
              compatibilityMatrix[browserName] = {
                  supported: result.success,
                  functionality: result.results?.functionality || null,
                  performance: result.results?.performance || null,
                  rendering: result.results?.rendering || null,
                  issues: result.error ? [result.error] : []
              };
          });
          
          return {
              summary: {
                  totalBrowsers: results.length,
                  supportedBrowsers: results.filter(r => r.success).length,
                  compatibilityRate: (results.filter(r => r.success).length / results.length) * 100
              },
              details: compatibilityMatrix,
              recommendations: this.generateRecommendations(compatibilityMatrix)
          };
      }
  }
  ```
</knowledge>
