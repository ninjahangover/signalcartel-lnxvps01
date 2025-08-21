# CUDA Setup & Integration Guide for SignalCartel

## 🎮 Your Hardware
- **GPU**: NVIDIA GTX 1080 (Pascal Architecture)
- **CUDA Capability**: 6.1
- **Max CUDA Version**: 11.8
- **VRAM**: 8GB GDDR5X

## 🔧 Current Setup
You have CUDA 11.8 installed via conda environment, which is perfect for your GTX 1080.

### Verify CUDA Installation
```bash
# Check CUDA is working
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"
python -c "import torch; print(f'GPU: {torch.cuda.get_device_name(0)}')"

# Check CUDA version
nvcc --version  # Should show 11.8

# Monitor GPU usage
nvidia-smi
```

## 🚀 How SignalCartel Can Leverage CUDA

### 1. **AI-Enhanced Strategy Optimization**
Train neural networks to optimize trading parameters:

```python
# ai-strategy-optimizer.py
import torch
import torch.nn as nn
import numpy as np
from typing import List, Dict

class TradingStrategyNN(nn.Module):
    """Neural network for predicting optimal strategy parameters"""
    def __init__(self, input_features=10, hidden_size=64):
        super().__init__()
        self.fc1 = nn.Linear(input_features, hidden_size)
        self.fc2 = nn.Linear(hidden_size, 32)
        self.fc3 = nn.Linear(32, 4)  # Output: RSI_buy, RSI_sell, stop_loss, take_profit
        
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return torch.sigmoid(self.fc3(x))

def optimize_strategy_cuda(market_data: np.ndarray):
    """Use GPU to optimize strategy parameters"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = TradingStrategyNN().to(device)
    
    # Convert market data to tensor and move to GPU
    data = torch.FloatTensor(market_data).to(device)
    
    # Get predictions (runs on GPU)
    with torch.no_grad():
        optimal_params = model(data)
    
    return optimal_params.cpu().numpy()
```

### 2. **Technical Indicator Calculation Acceleration**
Parallelize indicator calculations across multiple symbols:

```python
# cuda-indicators.py
import cupy as cp  # GPU-accelerated NumPy
import numpy as np

def calculate_rsi_cuda(prices: np.ndarray, period: int = 14):
    """Calculate RSI using CUDA for multiple symbols simultaneously"""
    # Move data to GPU
    gpu_prices = cp.asarray(prices)
    
    # Calculate price changes
    deltas = cp.diff(gpu_prices, axis=1)
    gains = cp.where(deltas > 0, deltas, 0)
    losses = cp.where(deltas < 0, -deltas, 0)
    
    # Calculate average gains/losses (parallel for all symbols)
    avg_gains = cp.convolve(gains, cp.ones(period)/period, mode='valid')
    avg_losses = cp.convolve(losses, cp.ones(period)/period, mode='valid')
    
    # Calculate RSI
    rs = avg_gains / (avg_losses + 1e-10)
    rsi = 100 - (100 / (1 + rs))
    
    # Move back to CPU
    return cp.asnumpy(rsi)

# Process 1000 symbols at once
prices = np.random.randn(1000, 200)  # 1000 symbols, 200 time periods
rsi_values = calculate_rsi_cuda(prices)  # Much faster than CPU
```

### 3. **Pattern Recognition with Deep Learning**
Identify chart patterns using convolutional neural networks:

```python
# pattern-recognition.py
import torch
import torch.nn as nn
import torchvision.transforms as transforms

class ChartPatternCNN(nn.Module):
    """CNN for recognizing trading patterns in price charts"""
    def __init__(self, num_patterns=10):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3)
        self.fc1 = nn.Linear(64 * 6 * 6, 128)
        self.fc2 = nn.Linear(128, num_patterns)
        
    def forward(self, x):
        x = torch.relu(self.conv1(x))
        x = torch.max_pool2d(x, 2)
        x = torch.relu(self.conv2(x))
        x = torch.max_pool2d(x, 2)
        x = x.view(x.size(0), -1)
        x = torch.relu(self.fc1(x))
        return torch.softmax(self.fc2(x), dim=1)

def detect_patterns_cuda(chart_image):
    """Detect trading patterns using GPU"""
    device = torch.device('cuda')
    model = ChartPatternCNN().to(device)
    
    # Process image
    img_tensor = transforms.ToTensor()(chart_image).unsqueeze(0).to(device)
    
    # Detect patterns (runs on GPU)
    patterns = model(img_tensor)
    
    pattern_names = ['Head&Shoulders', 'Double Top', 'Triangle', 'Flag', 'Wedge']
    results = {name: prob.item() for name, prob in zip(pattern_names, patterns[0])}
    
    return results
```

### 4. **Backtesting Acceleration**
Run thousands of strategy backtests in parallel:

```python
# cuda-backtest.py
import cupy as cp

def backtest_strategies_cuda(prices, strategies):
    """Backtest multiple strategies in parallel on GPU"""
    gpu_prices = cp.asarray(prices)
    results = []
    
    for strategy in strategies:
        # Each strategy runs in parallel on GPU
        signals = generate_signals_gpu(gpu_prices, strategy)
        returns = calculate_returns_gpu(gpu_prices, signals)
        sharpe = calculate_sharpe_gpu(returns)
        results.append(sharpe)
    
    return cp.asnumpy(cp.array(results))
```

## 📦 Required Python Packages

```bash
# Install in your conda environment
conda activate cuda11
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install cupy-cuda11x  # GPU-accelerated NumPy
pip install rapids  # NVIDIA's data science libraries (optional)
```

## 🔌 Integration with SignalCartel

### Add CUDA Strategy Optimizer
Create `src/lib/cuda-optimizer.ts`:

```typescript
import { spawn } from 'child_process';

export class CudaStrategyOptimizer {
  async optimizeParameters(marketData: number[][]): Promise<any> {
    return new Promise((resolve, reject) => {
      const python = spawn('python', [
        'scripts/cuda/optimize_strategy.py',
        JSON.stringify(marketData)
      ]);
      
      let result = '';
      python.stdout.on('data', (data) => {
        result += data.toString();
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          resolve(JSON.parse(result));
        } else {
          reject(new Error('CUDA optimization failed'));
        }
      });
    });
  }
}
```

### Monitor GPU Usage
```bash
# Watch GPU utilization
watch -n 1 nvidia-smi

# Check GPU memory
nvidia-smi --query-gpu=memory.used,memory.free --format=csv

# Monitor in Python
import GPUtil
GPUs = GPUtil.getGPUs()
gpu = GPUs[0]
print(f"GPU load: {gpu.load*100}%")
print(f"GPU memory: {gpu.memoryUsed}/{gpu.memoryTotal} MB")
```

## 🎯 Best Use Cases for Your GTX 1080

1. **Strategy Parameter Optimization** - Train neural networks to find optimal RSI thresholds, stop-loss levels, etc.
2. **Pattern Recognition** - Identify chart patterns across multiple timeframes
3. **Bulk Indicator Calculation** - Calculate indicators for hundreds of symbols simultaneously
4. **Backtesting** - Run thousands of strategy variations in parallel
5. **Market Prediction Models** - Train LSTM/GRU models for price prediction

## ⚡ Performance Tips

1. **Batch Operations**: Process multiple symbols/strategies at once
2. **Memory Management**: Your 8GB VRAM can handle ~2-3GB models comfortably
3. **Mixed Precision**: Use FP16 for 2x speed boost where precision isn't critical
4. **Async Processing**: Run CUDA operations in background while CPU handles other tasks

## 🚀 Quick Start Example

```python
# cuda-trading-test.py
import torch
import time

def test_cuda_speedup():
    """Compare CPU vs GPU performance"""
    size = 10000
    
    # CPU timing
    cpu_tensor = torch.randn(size, size)
    start = time.time()
    result_cpu = torch.matmul(cpu_tensor, cpu_tensor)
    cpu_time = time.time() - start
    
    # GPU timing
    if torch.cuda.is_available():
        cuda_tensor = cpu_tensor.cuda()
        torch.cuda.synchronize()
        start = time.time()
        result_gpu = torch.matmul(cuda_tensor, cuda_tensor)
        torch.cuda.synchronize()
        gpu_time = time.time() - start
        
        print(f"CPU Time: {cpu_time:.3f}s")
        print(f"GPU Time: {gpu_time:.3f}s")
        print(f"Speedup: {cpu_time/gpu_time:.1f}x")
    else:
        print("CUDA not available")

test_cuda_speedup()
```

## 📊 Expected Performance Gains

- **Technical Indicators**: 10-50x faster for bulk calculations
- **Neural Network Training**: 20-100x faster than CPU
- **Backtesting**: 10-30x faster for parallel strategy testing
- **Pattern Recognition**: 15-40x faster for image-based analysis

Your GTX 1080 is still a very capable card for these tasks! While not the latest, it will give you significant speedups for parallel computations.