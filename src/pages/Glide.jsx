import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CorridorCanvas from '../components/CorridorCanvas';

// 常數定義
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';
const SIMULATION_MODES = [
  { id: 'fixed', name: '固定時制', color: 'bg-gray-500' },
  { id: 'glide', name: 'GLIDE 綠波', color: 'bg-blue-500' },
  { id: 'glide_tsp', name: 'GLIDE + TSP', color: 'bg-green-500' }
];

// 設定 axios 預設值
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 300000; // 5 分鐘超時

export default function Glide() {
  // 狀態管理
  const [parameters, setParameters] = useState({
    cycle: 90,
    v_prog_kmh: 40,
    steps: 180,
    mode: 'fixed'
  });
  
  const [plan, setPlan] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [isComputing, setIsComputing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [frames, setFrames] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);

  // 檢查 API 健康狀態
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await axios.get('/health');
      setApiHealth(response.data);
      console.log('API Health:', response.data);
    } catch (err) {
      console.error('API health check failed:', err);
      setError('無法連接到後端 API，請確認服務是否啟動');
    }
  };

  // 計算 Offsets
  const computeOffsets = async () => {
    if (isComputing) return;
    
    setIsComputing(true);
    setError(null);
    
    try {
      const response = await axios.post('/glide/plan', {
        cycle: parameters.cycle,
        v_prog_kmh: parameters.v_prog_kmh
      });
      
      setPlan(response.data);
      console.log('Offsets computed:', response.data);
    } catch (err) {
      console.error('Error computing offsets:', err);
      setError(`計算 Offsets 失敗: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsComputing(false);
    }
  };

  // 執行模擬
  const runSimulation = async (mode = parameters.mode) => {
    if (isRunning) return;
    
    setIsRunning(true);
    setError(null);
    setFrames([]);
    setCurrentFrame(0);
    setIsPlaying(false);
    
    try {
      console.log(`Starting ${mode} simulation...`);
      
      const response = await axios.post('/glide/sim', {
        mode: mode,
        cycle: parameters.cycle,
        v_prog_kmh: parameters.v_prog_kmh,
        steps: parameters.steps,
        seed: 42
      });
      
      setSimulation(response.data);
      setFrames(response.data.frames || []);
      
      console.log(`${mode} simulation completed:`, {
        frames: response.data.frames?.length,
        kpis: response.data.kpis,
        events: response.data.events?.length
      });
      
    } catch (err) {
      console.error('Error running simulation:', err);
      setError(`模擬執行失敗: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // 播放控制
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        if (prev >= frames.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000); // 1 Hz 播放
    
    return () => clearInterval(interval);
  }, [isPlaying, frames.length]);

  const togglePlayback = () => {
    if (frames.length === 0) return;
    
    if (currentFrame >= frames.length - 1) {
      setCurrentFrame(0);
    }
    setIsPlaying(!isPlaying);
  };

  const resetPlayback = () => {
    setCurrentFrame(0);
    setIsPlaying(false);
  };

  // Demo 劇本 - 三模式連續播放
  const runDemoSequence = async () => {
    if (isRunning) return;
    
    for (const mode of ['fixed', 'glide', 'glide_tsp']) {
      setParameters(prev => ({ ...prev, mode }));
      await new Promise(resolve => setTimeout(resolve, 500)); // 短暫延遲
      await runSimulation(mode);
      
      if (error) {
        console.error(`Demo sequence stopped at ${mode} due to error`);
        break;
      }
      
      // 等待一段時間後繼續下一個模式
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  // 取得當前幀數據
  const getCurrentFrameData = () => {
    if (frames.length === 0 || currentFrame >= frames.length) return null;
    return frames[currentFrame];
  };

  // 格式化 KPI 數值
  const formatKpiValue = (key, value) => {
    if (typeof value !== 'number') return value;
    
    switch (key) {
      case 'progression_rate':
        return `${(value * 100).toFixed(1)}%`;
      case 'bus_headway_std_s':
      case 'avg_stops_main':
        return value.toFixed(1);
      default:
        return Math.round(value);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* 標題與狀態 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GLIDE-Lite 幹道綠波系統
          </h1>
          <p className="text-gray-600">
            三號誌廊道綠波控制與公車不群聚演示
          </p>
          
          {/* API 狀態指示器 */}
          <div className="mt-2 flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              apiHealth?.status === 'healthy' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                apiHealth?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span>
                {apiHealth?.status === 'healthy' ? 'API 連線正常' : 'API 連線異常'}
              </span>
            </div>
            
            {apiHealth?.sumo_available && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>SUMO 就緒</span>
              </div>
            )}
          </div>
        </div>

        {/* 錯誤提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 左側控制面板 */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* 參數設定 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">參數設定</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    週期 (秒)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="180"
                    value={parameters.cycle}
                    onChange={(e) => setParameters(prev => ({
                      ...prev,
                      cycle: parseInt(e.target.value) || 90
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    目標速度 (km/h)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="80"
                    value={parameters.v_prog_kmh}
                    onChange={(e) => setParameters(prev => ({
                      ...prev,
                      v_prog_kmh: parseInt(e.target.value) || 40
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    模擬步數
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="1800"
                    value={parameters.steps}
                    onChange={(e) => setParameters(prev => ({
                      ...prev,
                      steps: parseInt(e.target.value) || 180
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* 操作按鈕 */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={computeOffsets}
                  disabled={isComputing}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isComputing ? '計算中...' : '計算 Offsets'}
                </button>
                
                <button
                  onClick={runDemoSequence}
                  disabled={isRunning}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning ? '執行中...' : '🎬 Demo 劇本 (三模式)'}
                </button>
              </div>
            </div>

            {/* 模式選擇與執行 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">模式控制</h2>
              
              <div className="space-y-3">
                {SIMULATION_MODES.map(mode => (
                  <div key={mode.id} className="flex items-center space-x-3">
                    <button
                      onClick={() => runSimulation(mode.id)}
                      disabled={isRunning}
                      className={`flex-1 px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${mode.color}`}
                    >
                      {isRunning && parameters.mode === mode.id ? '執行中...' : mode.name}
                    </button>
                    
                    {simulation?.mode === mode.id && (
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Offsets 計劃 */}
            {plan && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">綠波計劃</h2>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Offsets</h3>
                    <div className="space-y-1">
                      {Object.entries(plan.offsets).map(([node, offset]) => (
                        <div key={node} className="flex justify-between text-sm">
                          <span>{node}:</span>
                          <span className="font-mono">{offset}s</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">綠帶時窗</h3>
                    <div className="space-y-1">
                      {plan.green_band?.map(band => (
                        <div key={band.node} className="flex justify-between text-sm">
                          <span>{band.node}:</span>
                          <span className="font-mono">{band.start}-{band.end}s</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* KPI 卡片 */}
            {simulation?.kpis && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">
                  績效指標 - {SIMULATION_MODES.find(m => m.id === simulation.mode)?.name}
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(simulation.kpis).map(([key, value]) => {
                    const labels = {
                      progression_rate: '進帶率',
                      avg_stops_main: '平均停等',
                      bus_headway_std_s: '頭距標準差',
                      tsp_grants: 'TSP 授予',
                      bus_holds: '公車保留',
                      throughput: '通過量'
                    };
                    
                    if (!labels[key]) return null;
                    
                    return (
                      <div key={key} className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatKpiValue(key, value)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {labels[key]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 右側視覺化區域 */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 廊道動畫 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">廊道動畫</h2>
                
                {frames.length > 0 && (
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      {currentFrame + 1} / {frames.length}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={togglePlayback}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        {isPlaying ? '⏸' : '▶'}
                      </button>
                      
                      <button
                        onClick={resetPlayback}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        ⏹
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <CorridorCanvas 
                  frameData={getCurrentFrameData()}
                  offsets={plan?.offsets}
                  events={simulation?.events}
                />
              </div>
              
              {/* 進度條 */}
              {frames.length > 0 && (
                <div className="mt-4">
                  <input
                    type="range"
                    min="0"
                    max={frames.length - 1}
                    value={currentFrame}
                    onChange={(e) => {
                      setCurrentFrame(parseInt(e.target.value));
                      setIsPlaying(false);
                    }}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* TSP 事件日誌 */}
            {simulation?.events && simulation.events.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">TSP 事件</h2>
                
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {simulation.events.slice(-10).map((event, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded text-sm ${
                        event.type === 'TSP_EXTEND' 
                          ? 'bg-green-50 border-l-4 border-green-400'
                          : 'bg-yellow-50 border-l-4 border-yellow-400'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {event.type === 'TSP_EXTEND' ? '🟢 延綠' : '🟡 保留'}
                            @ {event.node}
                          </div>
                          <div className="text-gray-600">
                            {event.sec}秒 (頭距: {event.headway?.toFixed(0)}s)
                          </div>
                        </div>
                        <div className="text-gray-500 text-xs">
                          t={event.t}s
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}