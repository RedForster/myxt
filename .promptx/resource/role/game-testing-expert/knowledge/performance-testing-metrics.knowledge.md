<knowledge>
  ## 游戏性能测试关键指标体系
  
  ### 核心性能指标定义
  
  | 指标类别 | 关键指标 | 目标值 | 测量方法 | 业务影响 |
  |----------|----------|--------|----------|----------|
  | **渲染性能** | FPS (帧率) | 桌面≥60, 移动≥30 | requestAnimationFrame | 直接影响游戏流畅度 |
  | **内存性能** | 堆内存使用 | <200MB (复杂游戏) | performance.memory | 影响设备稳定性 |
  | **加载性能** | 首屏时间 | <3秒 | Navigation Timing | 影响用户留存率 |
  | **网络性能** | 资源加载时间 | <2秒 | Resource Timing | 影响游戏启动体验 |
  | **响应性能** | 输入延迟 | <100ms | 自定义计时 | 影响操作体验 |
  
  ### FPS性能监控实现
  
  ```javascript
  class FPSMonitor {
      constructor() {
          this.frameCount = 0;
          this.lastTime = performance.now();
          this.fps = 0;
          this.fpsHistory = [];
          this.isMonitoring = false;
      }
      
      start() {
          this.isMonitoring = true;
          this.frameCount = 0;
          this.lastTime = performance.now();
          this.fpsHistory = [];
          this.measureFrame();
      }
      
      stop() {
          this.isMonitoring = false;
          return this.getStatistics();
      }
      
      measureFrame() {
          if (!this.isMonitoring) return;
          
          const currentTime = performance.now();
          this.frameCount++;
          
          // 每秒计算一次FPS
          if (currentTime - this.lastTime >= 1000) {
              this.fps = (this.frameCount * 1000) / (currentTime - this.lastTime);
              this.fpsHistory.push({
                  fps: this.fps,
                  timestamp: currentTime
              });
              
              this.frameCount = 0;
              this.lastTime = currentTime;
          }
          
          requestAnimationFrame(() => this.measureFrame());
      }
      
      getStatistics() {
          if (this.fpsHistory.length === 0) return null;
          
          const fpsValues = this.fpsHistory.map(item => item.fps);
          
          return {
              averageFPS: fpsValues.reduce((sum, fps) => sum + fps, 0) / fpsValues.length,
              minFPS: Math.min(...fpsValues),
              maxFPS: Math.max(...fpsValues),
              frameDrops: fpsValues.filter(fps => fps < 30).length,
              stability: this.calculateStability(fpsValues),
              history: this.fpsHistory
          };
      }
      
      calculateStability(fpsValues) {
          const mean = fpsValues.reduce((sum, fps) => sum + fps, 0) / fpsValues.length;
          const variance = fpsValues.reduce((sum, fps) => sum + Math.pow(fps - mean, 2), 0) / fpsValues.length;
          const standardDeviation = Math.sqrt(variance);
          
          // 稳定性评分：标准差越小，稳定性越好
          return Math.max(0, 100 - (standardDeviation / mean) * 100);
      }
  }
  ```
  
  ### 内存性能监控体系
  
  ```javascript
  class MemoryMonitor {
      constructor() {
          this.samples = [];
          this.isMonitoring = false;
          this.intervalId = null;
      }
      
      start(sampleInterval = 1000) {
          this.isMonitoring = true;
          this.samples = [];
          
          this.intervalId = setInterval(() => {
              this.collectSample();
          }, sampleInterval);
      }
      
      stop() {
          this.isMonitoring = false;
          if (this.intervalId) {
              clearInterval(this.intervalId);
              this.intervalId = null;
          }
          
          return this.analyzeMemoryUsage();
      }
      
      collectSample() {
          if (!this.isMonitoring) return;
          
          const sample = {
              timestamp: performance.now(),
              memory: this.getMemoryInfo(),
              gameObjects: this.getGameObjectCount()
          };
          
          this.samples.push(sample);
      }
      
      getMemoryInfo() {
          if (performance.memory) {
              return {
                  used: performance.memory.usedJSHeapSize,
                  total: performance.memory.totalJSHeapSize,
                  limit: performance.memory.jsHeapSizeLimit
              };
          }
          return null;
      }
      
      getGameObjectCount() {
          // 如果游戏引擎暴露了对象计数接口
          if (window.gameEngine && window.gameEngine.getObjectCount) {
              return window.gameEngine.getObjectCount();
          }
          return null;
      }
      
      analyzeMemoryUsage() {
          if (this.samples.length < 2) return null;
          
          const memoryValues = this.samples
              .filter(s => s.memory)
              .map(s => s.memory.used);
          
          if (memoryValues.length === 0) return null;
          
          const initialMemory = memoryValues[0];
          const finalMemory = memoryValues[memoryValues.length - 1];
          const peakMemory = Math.max(...memoryValues);
          const memoryGrowth = ((finalMemory - initialMemory) / initialMemory) * 100;
          
          return {
              initialMemory: this.formatBytes(initialMemory),
              finalMemory: this.formatBytes(finalMemory),
              peakMemory: this.formatBytes(peakMemory),
              memoryGrowth: memoryGrowth,
              isLeaking: this.detectMemoryLeak(memoryValues),
              samples: this.samples,
              analysis: this.generateMemoryAnalysis(memoryValues, memoryGrowth)
          };
      }
      
      detectMemoryLeak(memoryValues) {
          // 简单的内存泄漏检测算法
          const windowSize = Math.min(10, Math.floor(memoryValues.length / 3));
          if (windowSize < 3) return false;
          
          const recentAvg = this.average(memoryValues.slice(-windowSize));
          const earlyAvg = this.average(memoryValues.slice(windowSize, windowSize * 2));
          
          const growthRate = ((recentAvg - earlyAvg) / earlyAvg) * 100;
          
          return growthRate > 10; // 增长超过10%可能有泄漏
      }
      
      average(array) {
          return array.reduce((sum, val) => sum + val, 0) / array.length;
      }
      
      formatBytes(bytes) {
          if (bytes === 0) return '0 B';
          const k = 1024;
          const sizes = ['B', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      }
      
      generateMemoryAnalysis(memoryValues, growthRate) {
          if (growthRate > 20) {
              return '严重：检测到显著内存增长，可能存在内存泄漏';
          } else if (growthRate > 10) {
              return '警告：内存增长较快，建议进一步监控';
          } else if (growthRate > 5) {
              return '注意：内存有轻微增长，属于正常范围';
          } else {
              return '良好：内存使用稳定';
          }
      }
  }
  ```
  
  ### 网络性能分析工具
  
  ```javascript
  class NetworkPerformanceAnalyzer {
      constructor() {
          this.requests = new Map();
          this.observer = null;
      }
      
      start() {
          // 使用Performance Observer监控资源加载
          this.observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                  if (entry.entryType === 'resource') {
                      this.analyzeResourceTiming(entry);
                  }
              }
          });
          
          this.observer.observe({ entryTypes: ['resource'] });
          
          // 监控现有的资源
          const existingEntries = performance.getEntriesByType('resource');
          existingEntries.forEach(entry => this.analyzeResourceTiming(entry));
      }
      
      stop() {
          if (this.observer) {
              this.observer.disconnect();
              this.observer = null;
          }
          
          return this.generateReport();
      }
      
      analyzeResourceTiming(entry) {
          const resourceInfo = {
              name: entry.name,
              type: this.getResourceType(entry.name),
              startTime: entry.startTime,
              duration: entry.duration,
              transferSize: entry.transferSize || 0,
              
              // 详细时间分解
              dns: entry.domainLookupEnd - entry.domainLookupStart,
              tcp: entry.connectEnd - entry.connectStart,
              ssl: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
              ttfb: entry.responseStart - entry.requestStart, // Time to First Byte
              download: entry.responseEnd - entry.responseStart,
              
              // 性能评级
              isSlowResource: entry.duration > 1000, // 超过1秒认为慢
              isCritical: this.isCriticalResource(entry.name)
          };
          
          this.requests.set(entry.name, resourceInfo);
      }
      
      getResourceType(url) {
          if (url.match(/\.(js)$/i)) return 'script';
          if (url.match(/\.(css)$/i)) return 'stylesheet';
          if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) return 'image';
          if (url.match(/\.(mp3|ogg|wav|m4a)$/i)) return 'audio';
          if (url.match(/\.(mp4|webm|ogv)$/i)) return 'video';
          if (url.match(/\.(json|xml)$/i)) return 'data';
          if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
          return 'other';
      }
      
      isCriticalResource(url) {
          // 判断是否为关键资源
          const criticalPatterns = [
              /game\.js$/,
              /engine\.js$/,
              /main\.css$/,
              /critical\.css$/
          ];
          
          return criticalPatterns.some(pattern => pattern.test(url));
      }
      
      generateReport() {
          const resources = Array.from(this.requests.values());
          
          // 按类型分组
          const byType = this.groupBy(resources, 'type');
          
          // 性能统计
          const stats = {
              total: {
                  count: resources.length,
                  totalSize: resources.reduce((sum, r) => sum + r.transferSize, 0),
                  totalTime: Math.max(...resources.map(r => r.startTime + r.duration)) - Math.min(...resources.map(r => r.startTime)),
                  averageLoadTime: resources.reduce((sum, r) => sum + r.duration, 0) / resources.length
              },
              
              byType: Object.keys(byType).reduce((acc, type) => {
                  const typeResources = byType[type];
                  acc[type] = {
                      count: typeResources.length,
                      totalSize: typeResources.reduce((sum, r) => sum + r.transferSize, 0),
                      averageLoadTime: typeResources.reduce((sum, r) => sum + r.duration, 0) / typeResources.length,
                      slowResources: typeResources.filter(r => r.isSlowResource).length
                  };
                  return acc;
              }, {}),
              
              issues: this.identifyPerformanceIssues(resources),
              
              recommendations: this.generateRecommendations(resources)
          };
          
          return {
              resources: resources,
              statistics: stats,
              detailedAnalysis: this.generateDetailedAnalysis(resources)
          };
      }
      
      groupBy(array, key) {
          return array.reduce((groups, item) => {
              const group = item[key];
              groups[group] = groups[group] || [];
              groups[group].push(item);
              return groups;
          }, {});
      }
      
      identifyPerformanceIssues(resources) {
          const issues = [];
          
          // 检查慢加载资源
          const slowResources = resources.filter(r => r.isSlowResource);
          if (slowResources.length > 0) {
              issues.push({
                  type: 'slow_loading',
                  severity: 'high',
                  description: `发现${slowResources.length}个加载缓慢的资源`,
                  resources: slowResources.map(r => r.name)
              });
          }
          
          // 检查大文件
          const largeResources = resources.filter(r => r.transferSize > 1024 * 1024); // >1MB
          if (largeResources.length > 0) {
              issues.push({
                  type: 'large_files',
                  severity: 'medium',
                  description: `发现${largeResources.length}个大文件`,
                  resources: largeResources.map(r => ({ name: r.name, size: r.transferSize }))
              });
          }
          
          // 检查关键资源性能
          const slowCriticalResources = resources.filter(r => r.isCritical && r.duration > 500);
          if (slowCriticalResources.length > 0) {
              issues.push({
                  type: 'slow_critical_resources',
                  severity: 'high',
                  description: `关键资源加载缓慢`,
                  resources: slowCriticalResources.map(r => r.name)
              });
          }
          
          return issues;
      }
      
      generateRecommendations(resources) {
          const recommendations = [];
          
          // 资源压缩建议
          const uncompressedImages = resources.filter(r => 
              r.type === 'image' && r.transferSize > 100 * 1024 // >100KB
          );
          if (uncompressedImages.length > 0) {
              recommendations.push('建议压缩大尺寸图片资源');
          }
          
          // 脚本优化建议
          const largeScripts = resources.filter(r => 
              r.type === 'script' && r.transferSize > 500 * 1024 // >500KB
          );
          if (largeScripts.length > 0) {
              recommendations.push('建议对大型JavaScript文件进行代码分割');
          }
          
          // CDN建议
          const slowExternalResources = resources.filter(r => 
              !r.name.includes(location.hostname) && r.duration > 1000
          );
          if (slowExternalResources.length > 0) {
              recommendations.push('建议使用CDN加速外部资源加载');
          }
          
          return recommendations;
      }
      
      generateDetailedAnalysis(resources) {
          return {
              waterfall: this.generateWaterfallData(resources),
              timeline: this.generateTimelineData(resources),
              bottlenecks: this.identifyBottlenecks(resources)
          };
      }
      
      generateWaterfallData(resources) {
          return resources
              .sort((a, b) => a.startTime - b.startTime)
              .map(resource => ({
                  name: resource.name.split('/').pop(),
                  start: resource.startTime,
                  duration: resource.duration,
                  type: resource.type,
                  size: resource.transferSize
              }));
      }
      
      generateTimelineData(resources) {
          const timeline = [];
          const timeSlots = {};
          
          resources.forEach(resource => {
              const startSlot = Math.floor(resource.startTime / 100) * 100; // 100ms时间槽
              if (!timeSlots[startSlot]) {
                  timeSlots[startSlot] = { time: startSlot, count: 0, totalSize: 0 };
              }
              timeSlots[startSlot].count++;
              timeSlots[startSlot].totalSize += resource.transferSize;
          });
          
          return Object.values(timeSlots).sort((a, b) => a.time - b.time);
      }
      
      identifyBottlenecks(resources) {
          const bottlenecks = [];
          
          // DNS查询瓶颈
          const slowDNS = resources.filter(r => r.dns > 200);
          if (slowDNS.length > 0) {
              bottlenecks.push({
                  type: 'DNS',
                  description: 'DNS查询缓慢',
                  affectedResources: slowDNS.length
              });
          }
          
          // TCP连接瓶颈
          const slowTCP = resources.filter(r => r.tcp > 300);
          if (slowTCP.length > 0) {
              bottlenecks.push({
                  type: 'TCP',
                  description: 'TCP连接建立缓慢',
                  affectedResources: slowTCP.length
              });
          }
          
          // TTFB瓶颈
          const slowTTFB = resources.filter(r => r.ttfb > 500);
          if (slowTTFB.length > 0) {
              bottlenecks.push({
                  type: 'TTFB',
                  description: '服务器响应缓慢',
                  affectedResources: slowTTFB.length
              });
          }
          
          return bottlenecks;
      }
  }
  ```
  
  ### 性能测试报告生成器
  
  ```javascript
  class PerformanceReporter {
      generateReport(fpsData, memoryData, networkData) {
          const report = {
              summary: this.generateSummary(fpsData, memoryData, networkData),
              details: {
                  rendering: this.analyzeRenderingPerformance(fpsData),
                  memory: this.analyzeMemoryPerformance(memoryData),
                  network: this.analyzeNetworkPerformance(networkData)
              },
              recommendations: this.generateRecommendations(fpsData, memoryData, networkData),
              score: this.calculateOverallScore(fpsData, memoryData, networkData)
          };
          
          return report;
      }
      
      generateSummary(fpsData, memoryData, networkData) {
          return {
              testDate: new Date().toISOString(),
              averageFPS: fpsData?.averageFPS || 0,
              memoryUsage: memoryData?.finalMemory || 'N/A',
              loadTime: networkData?.statistics?.total?.totalTime || 0,
              overallGrade: this.getPerformanceGrade(fpsData, memoryData, networkData)
          };
      }
      
      calculateOverallScore(fpsData, memoryData, networkData) {
          let score = 0;
          let weights = { fps: 0.4, memory: 0.3, network: 0.3 };
          
          // FPS评分
          if (fpsData) {
              const fpsScore = Math.min(100, (fpsData.averageFPS / 60) * 100);
              score += fpsScore * weights.fps;
          }
          
          // 内存评分
          if (memoryData) {
              const memoryScore = memoryData.isLeaking ? 30 : 90;
              score += memoryScore * weights.memory;
          }
          
          // 网络评分
          if (networkData) {
              const avgLoadTime = networkData.statistics.total.averageLoadTime;
              const networkScore = Math.max(0, 100 - (avgLoadTime / 10)); // 10ms = 1分
              score += networkScore * weights.network;
          }
          
          return Math.round(score);
      }
  }
  ```
</knowledge>
