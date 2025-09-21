import React, { useRef, useEffect, useState } from 'react';

// 常數定義 - 避免 magic numbers
const CANVAS_CONFIG = {
  WIDTH: 800,
  HEIGHT: 200,
  MARGIN: 20,
  
  // 座標映射：SUMO x ∈ [-600, 600] → Canvas x ∈ [20, 780]
  SUMO_MIN_X: -600,
  SUMO_MAX_X: 600,
  CANVAS_MIN_X: 20,
  CANVAS_MAX_X: 780,
  
  // 顏色配置
  COLORS: {
    road: '#444444',
    roadLine: '#ffffff',
    junction: '#666666',
    signalGreen: '#00ff00',
    signalYellow: '#ffff00',
    signalRed: '#ff0000',
    car: '#4285f4',
    bus: '#ff8c00',
    background: '#f8f9fa',
    text: '#333333',
    greenBand: 'rgba(0, 255, 0, 0.2)',
    tspEvent: '#ff1744'
  }
};

// 座標轉換函數
const sumoToCanvas = (sumoX) => {
  const ratio = (sumoX - CANVAS_CONFIG.SUMO_MIN_X) / 
                (CANVAS_CONFIG.SUMO_MAX_X - CANVAS_CONFIG.SUMO_MIN_X);
  return CANVAS_CONFIG.CANVAS_MIN_X + ratio * 
         (CANVAS_CONFIG.CANVAS_MAX_X - CANVAS_CONFIG.CANVAS_MIN_X);
};

// 繪製函數
const drawRoad = (ctx) => {
  const y = CANVAS_CONFIG.HEIGHT / 2;
  const roadWidth = 40;
  
  // 主幹道
  ctx.fillStyle = CANVAS_CONFIG.COLORS.road;
  ctx.fillRect(
    CANVAS_CONFIG.CANVAS_MIN_X, 
    y - roadWidth/2, 
    CANVAS_CONFIG.CANVAS_MAX_X - CANVAS_CONFIG.CANVAS_MIN_X, 
    roadWidth
  );
  
  // 道路中線
  ctx.strokeStyle = CANVAS_CONFIG.COLORS.roadLine;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(CANVAS_CONFIG.CANVAS_MIN_X, y);
  ctx.lineTo(CANVAS_CONFIG.CANVAS_MAX_X, y);
  ctx.stroke();
  ctx.setLineDash([]);
};

const drawJunction = (ctx, x, nodeId) => {
  const y = CANVAS_CONFIG.HEIGHT / 2;
  const junctionSize = 60;
  
  // 路口背景
  ctx.fillStyle = CANVAS_CONFIG.COLORS.junction;
  ctx.fillRect(x - junctionSize/2, y - junctionSize/2, junctionSize, junctionSize);
  
  // 路口標籤
  ctx.fillStyle = CANVAS_CONFIG.COLORS.text;
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(nodeId, x, y - junctionSize/2 - 10);
};

const drawSignal = (ctx, x, state, phase = 0) => {
  const y = CANVAS_CONFIG.HEIGHT / 2;
  const signalY = y - 50;
  const signalSize = 12;
  
  // 信號燈背景
  ctx.fillStyle = '#333333';
  ctx.fillRect(x - 8, signalY - 40, 16, 50);
  
  // 信號燈狀態
  let color = CANVAS_CONFIG.COLORS.signalRed;
  if (state === 'G' || state === 'g') {
    color = CANVAS_CONFIG.COLORS.signalGreen;
  } else if (state === 'y' || state === 'Y') {
    color = CANVAS_CONFIG.COLORS.signalYellow;
  }
  
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, signalY - 20, signalSize/2, 0, 2 * Math.PI);
  ctx.fill();
  
  // 信號燈邊框
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // 相位資訊
  ctx.fillStyle = CANVAS_CONFIG.COLORS.text;
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`P${phase}`, x, signalY + 10);
};

const drawVehicle = (ctx, vehicle) => {
  const canvasX = sumoToCanvas(vehicle.x);
  const y = CANVAS_CONFIG.HEIGHT / 2;
  
  // 車輛尺寸
  const width = vehicle.kind === 'bus' ? 20 : 12;
  const height = vehicle.kind === 'bus' ? 8 : 6;
  
  // 車輛顏色
  const color = vehicle.kind === 'bus' 
    ? CANVAS_CONFIG.COLORS.bus 
    : CANVAS_CONFIG.COLORS.car;
  
  // 繪製車輛
  ctx.fillStyle = color;
  ctx.fillRect(canvasX - width/2, y - height/2, width, height);
  
  // 車輛邊框
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(canvasX - width/2, y - height/2, width, height);
  
  // 車輛 ID (僅公車)
  if (vehicle.kind === 'bus') {
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BUS', canvasX, y + 2);
  }
};

const drawTspEvent = (ctx, event, nodePositions) => {
  const nodeX = nodePositions[event.node];
  if (!nodeX) return;
  
  const y = CANVAS_CONFIG.HEIGHT / 2;
  const eventY = y - 80;
  
  // TSP 事件背景
  const bgColor = event.type === 'TSP_EXTEND' 
    ? 'rgba(0, 255, 0, 0.8)' 
    : 'rgba(255, 193, 7, 0.8)';
  
  ctx.fillStyle = bgColor;
  ctx.fillRect(nodeX - 25, eventY - 15, 50, 30);
  
  // TSP 事件文字
  ctx.fillStyle = '#000000';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  const text = event.type === 'TSP_EXTEND' 
    ? `+${event.sec}s` 
    : `Hold ${event.sec}s`;
  ctx.fillText(text, nodeX, eventY);
};

const drawGreenBand = (ctx, offsets, cycle = 90) => {
  if (!offsets) return;
  
  const nodePositions = {
    'J1': sumoToCanvas(-300),
    'J2': sumoToCanvas(0),
    'J3': sumoToCanvas(300)
  };
  
  const y = CANVAS_CONFIG.HEIGHT / 2;
  const bandHeight = 100;
  
  // 繪製綠帶 (簡化版本)
  ctx.fillStyle = CANVAS_CONFIG.COLORS.greenBand;
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
  ctx.lineWidth = 2;
  
  Object.entries(offsets).forEach(([nodeId, offset]) => {
    const x = nodePositions[nodeId];
    if (!x) return;
    
    // 綠帶時間窗 (假設綠燈時間為週期的 60%)
    const greenDuration = cycle * 0.6;
    const bandWidth = (greenDuration / cycle) * 60; // 映射到像素寬度
    
    ctx.fillRect(x - bandWidth/2, y + 30, bandWidth, 10);
    ctx.strokeRect(x - bandWidth/2, y + 30, bandWidth, 10);
    
    // 顯示 offset 數值
    ctx.fillStyle = CANVAS_CONFIG.COLORS.text;
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${offset}s`, x, y + 55);
  });
};

const drawTimeInfo = (ctx, frameData) => {
  if (!frameData) return;
  
  ctx.fillStyle = CANVAS_CONFIG.COLORS.text;
  ctx.font = '16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`時間: ${frameData.t}s`, 10, 30);
  
  // 車輛統計
  const vehicles = frameData.vehicles || [];
  const carCount = vehicles.filter(v => v.kind === 'car').length;
  const busCount = vehicles.filter(v => v.kind === 'bus').length;
  
  ctx.font = '12px Arial';
  ctx.fillText(`車輛: ${carCount} 輛車, ${busCount} 台公車`, 10, 50);
};

const drawLegend = (ctx) => {
  const legendX = CANVAS_CONFIG.WIDTH - 150;
  const legendY = 20;
  
  ctx.fillStyle = CANVAS_CONFIG.COLORS.text;
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('圖例:', legendX, legendY);
  
  // 車輛圖例
  ctx.fillStyle = CANVAS_CONFIG.COLORS.car;
  ctx.fillRect(legendX, legendY + 10, 12, 6);
  ctx.fillStyle = CANVAS_CONFIG.COLORS.text;
  ctx.fillText('汽車', legendX + 20, legendY + 16);
  
  ctx.fillStyle = CANVAS_CONFIG.COLORS.bus;
  ctx.fillRect(legendX, legendY + 25, 20, 8);
  ctx.fillStyle = CANVAS_CONFIG.COLORS.text;
  ctx.fillText('公車', legendX + 25, legendY + 31);
  
  // 信號燈圖例
  ctx.fillStyle = CANVAS_CONFIG.COLORS.signalGreen;
  ctx.beginPath();
  ctx.arc(legendX + 5, legendY + 45, 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = CANVAS_CONFIG.COLORS.text;
  ctx.fillText('綠燈', legendX + 15, legendY + 50);
  
  ctx.fillStyle = CANVAS_CONFIG.COLORS.signalRed;
  ctx.beginPath();
  ctx.arc(legendX + 5, legendY + 60, 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = CANVAS_CONFIG.COLORS.text;
  ctx.fillText('紅燈', legendX + 15, legendY + 65);
};

export default function CorridorCanvas({ frameData, offsets, events }) {
  const canvasRef = useRef(null);
  const [animationId, setAnimationId] = useState(null);
  
  // 節點位置映射
  const nodePositions = {
    'J1': sumoToCanvas(-300),
    'J2': sumoToCanvas(0),
    'J3': sumoToCanvas(300)
  };
  
  // 重繪畫布
  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 清空畫布
    ctx.fillStyle = CANVAS_CONFIG.COLORS.background;
    ctx.fillRect(0, 0, CANVAS_CONFIG.WIDTH, CANVAS_CONFIG.HEIGHT);
    
    // 繪製靜態元素
    drawRoad(ctx);
    
    // 繪製路口
    Object.entries(nodePositions).forEach(([nodeId, x]) => {
      drawJunction(ctx, x, nodeId);
    });
    
    // 繪製綠帶
    drawGreenBand(ctx, offsets);
    
    // 繪製動態元素
    if (frameData) {
      // 繪製信號燈
      frameData.signals?.forEach(signal => {
        const x = nodePositions[signal.node];
        if (x) {
          drawSignal(ctx, x, signal.state, signal.phase);
        }
      });
      
      // 繪製車輛
      frameData.vehicles?.forEach(vehicle => {
        // 只繪製在畫布範圍內的車輛
        const canvasX = sumoToCanvas(vehicle.x);
        if (canvasX >= CANVAS_CONFIG.CANVAS_MIN_X - 30 && 
            canvasX <= CANVAS_CONFIG.CANVAS_MAX_X + 30) {
          drawVehicle(ctx, vehicle);
        }
      });
      
      // 繪製 TSP 事件
      frameData.events?.forEach(event => {
        drawTspEvent(ctx, event, nodePositions);
      });
      
      // 繪製時間資訊
      drawTimeInfo(ctx, frameData);
    }
    
    // 繪製圖例
    drawLegend(ctx);
  };
  
  // 畫布更新效果
  useEffect(() => {
    redraw();
  }, [frameData, offsets, events]);
  
  // 處理畫布大小變化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 設定畫布解析度
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_CONFIG.WIDTH * dpr;
    canvas.height = CANVAS_CONFIG.HEIGHT * dpr;
    canvas.style.width = `${CANVAS_CONFIG.WIDTH}px`;
    canvas.style.height = `${CANVAS_CONFIG.HEIGHT}px`;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    redraw();
  }, []);
  
  // 滑鼠懸停效果
  const handleMouseMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas || !frameData) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 檢查是否懸停在車輛上
    let hoveredVehicle = null;
    frameData.vehicles?.forEach(vehicle => {
      const vehicleX = sumoToCanvas(vehicle.x);
      const vehicleY = CANVAS_CONFIG.HEIGHT / 2;
      
      if (Math.abs(x - vehicleX) < 15 && Math.abs(y - vehicleY) < 15) {
        hoveredVehicle = vehicle;
      }
    });
    
    // 更新游標樣式
    canvas.style.cursor = hoveredVehicle ? 'pointer' : 'default';
  };
  
  // 點擊事件處理
  const handleClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas || !frameData) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 檢查點擊的車輛
    frameData.vehicles?.forEach(vehicle => {
      const vehicleX = sumoToCanvas(vehicle.x);
      const vehicleY = CANVAS_CONFIG.HEIGHT / 2;
      
      if (Math.abs(x - vehicleX) < 15 && Math.abs(y - vehicleY) < 15) {
        console.log('Vehicle clicked:', vehicle);
        // 可以在這裡添加車輛詳細資訊的顯示
      }
    });
  };
  
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_CONFIG.WIDTH}
        height={CANVAS_CONFIG.HEIGHT}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="border rounded shadow-sm bg-gray-50"
        style={{
          maxWidth: '100%',
          height: 'auto'
        }}
      />
      
      {/* 狀態覆蓋層 */}
      {!frameData && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded">
          <div className="text-center text-gray-600">
            <div className="text-lg font-medium">等待模擬數據</div>
            <div className="text-sm">點擊上方按鈕開始模擬</div>
          </div>
        </div>
      )}
      
      {/* 效能指標 (開發用) */}
      {frameData && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          Vehicles: {frameData.vehicles?.length || 0} | 
          FPS: 1Hz
        </div>
      )}
    </div>
  );
}