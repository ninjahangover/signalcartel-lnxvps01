#!/usr/bin/env python3
"""
GPU-Accelerated Technical Indicators for SignalCartel
Provides CUDA-accelerated calculations for trading indicators like RSI, Bollinger Bands, etc.
"""
import cupy as cp
import numpy as np
from typing import List, Tuple, Union
import time

class GPUIndicators:
    """GPU-accelerated technical indicators using CuPy"""
    
    def __init__(self):
        """Initialize GPU memory pool for efficient memory management"""
        self.mempool = cp.get_default_memory_pool()
        self.pinned_mempool = cp.get_default_pinned_memory_pool()
    
    def clear_memory(self):
        """Clear GPU memory cache"""
        self.mempool.free_all_blocks()
        self.pinned_mempool.free_all_blocks()
    
    def rsi_batch(self, price_data: Union[np.ndarray, List[List[float]]], period: int = 14) -> np.ndarray:
        """
        Calculate RSI for multiple symbols in parallel on GPU
        
        Args:
            price_data: 2D array where each row is a symbol's price history
            period: RSI period (default 14)
            
        Returns:
            2D array of RSI values for each symbol
        """
        if isinstance(price_data, list):
            price_data = np.array(price_data, dtype=np.float32)
        
        # Transfer to GPU
        prices_gpu = cp.asarray(price_data, dtype=cp.float32)
        batch_size, data_length = prices_gpu.shape
        
        # Calculate price differences
        price_diffs = cp.diff(prices_gpu, axis=1)
        
        # Separate gains and losses
        gains = cp.where(price_diffs > 0, price_diffs, 0)
        losses = cp.where(price_diffs < 0, -price_diffs, 0)
        
        # Initialize output array
        rsi_values = cp.full((batch_size, data_length), cp.nan, dtype=cp.float32)
        
        # Calculate initial average gain/loss using SMA
        if data_length >= period:
            avg_gains = cp.mean(gains[:, :period], axis=1, keepdims=True)
            avg_losses = cp.mean(losses[:, :period], axis=1, keepdims=True)
            
            # Calculate RSI for the period point
            rs = avg_gains / (avg_losses + 1e-10)  # Add small epsilon to avoid division by zero
            rsi_values[:, period] = 100 - (100 / (1 + rs)).flatten()
            
            # Use EMA for subsequent values
            alpha = 1.0 / period
            for i in range(period + 1, data_length):
                avg_gains = alpha * gains[:, i-1:i] + (1 - alpha) * avg_gains
                avg_losses = alpha * losses[:, i-1:i] + (1 - alpha) * avg_losses
                
                rs = avg_gains / (avg_losses + 1e-10)
                rsi_values[:, i] = (100 - (100 / (1 + rs))).flatten()
        
        # Transfer back to CPU
        return cp.asnumpy(rsi_values)
    
    def bollinger_bands_batch(self, price_data: Union[np.ndarray, List[List[float]]], 
                            period: int = 20, std_multiplier: float = 2.0) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Calculate Bollinger Bands for multiple symbols in parallel on GPU
        
        Args:
            price_data: 2D array where each row is a symbol's price history
            period: Moving average period (default 20)
            std_multiplier: Standard deviation multiplier (default 2.0)
            
        Returns:
            Tuple of (upper_band, middle_band, lower_band) arrays
        """
        if isinstance(price_data, list):
            price_data = np.array(price_data, dtype=np.float32)
        
        # Transfer to GPU
        prices_gpu = cp.asarray(price_data, dtype=cp.float32)
        batch_size, data_length = prices_gpu.shape
        
        # Initialize output arrays
        upper_band = cp.full((batch_size, data_length), cp.nan, dtype=cp.float32)
        middle_band = cp.full((batch_size, data_length), cp.nan, dtype=cp.float32)
        lower_band = cp.full((batch_size, data_length), cp.nan, dtype=cp.float32)
        
        # Calculate rolling statistics
        for i in range(period - 1, data_length):
            window_data = prices_gpu[:, i-period+1:i+1]
            
            # Moving average (middle band)
            ma = cp.mean(window_data, axis=1)
            middle_band[:, i] = ma
            
            # Standard deviation
            std = cp.std(window_data, axis=1)
            
            # Upper and lower bands
            upper_band[:, i] = ma + (std_multiplier * std)
            lower_band[:, i] = ma - (std_multiplier * std)
        
        # Transfer back to CPU
        return (cp.asnumpy(upper_band), cp.asnumpy(middle_band), cp.asnumpy(lower_band))
    
    def macd_batch(self, price_data: Union[np.ndarray, List[List[float]]], 
                   fast_period: int = 12, slow_period: int = 26, signal_period: int = 9) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Calculate MACD for multiple symbols in parallel on GPU
        
        Args:
            price_data: 2D array where each row is a symbol's price history
            fast_period: Fast EMA period (default 12)
            slow_period: Slow EMA period (default 26)
            signal_period: Signal line EMA period (default 9)
            
        Returns:
            Tuple of (macd_line, signal_line, histogram) arrays
        """
        if isinstance(price_data, list):
            price_data = np.array(price_data, dtype=np.float32)
        
        # Transfer to GPU
        prices_gpu = cp.asarray(price_data, dtype=cp.float32)
        batch_size, data_length = prices_gpu.shape
        
        # Calculate EMAs
        fast_ema = self._ema_gpu(prices_gpu, fast_period)
        slow_ema = self._ema_gpu(prices_gpu, slow_period)
        
        # MACD line
        macd_line = fast_ema - slow_ema
        
        # Signal line (EMA of MACD)
        signal_line = self._ema_gpu(macd_line, signal_period)
        
        # Histogram
        histogram = macd_line - signal_line
        
        # Transfer back to CPU
        return (cp.asnumpy(macd_line), cp.asnumpy(signal_line), cp.asnumpy(histogram))
    
    def _ema_gpu(self, data: cp.ndarray, period: int) -> cp.ndarray:
        """Calculate EMA on GPU"""
        alpha = 2.0 / (period + 1)
        ema = cp.full_like(data, cp.nan)
        
        # Initialize with first value
        ema[:, 0] = data[:, 0]
        
        # Calculate EMA
        for i in range(1, data.shape[1]):
            ema[:, i] = alpha * data[:, i] + (1 - alpha) * ema[:, i-1]
        
        return ema

def benchmark_rsi_performance():
    """Benchmark GPU vs CPU RSI calculation performance"""
    print("=== RSI Performance Benchmark ===")
    
    # Generate test data (100 symbols, 1000 price points each)
    num_symbols = 100
    data_length = 1000
    np.random.seed(42)
    
    # Simulate price data with realistic movements
    base_prices = np.random.uniform(50, 200, (num_symbols, 1))
    returns = np.random.normal(0, 0.02, (num_symbols, data_length - 1))
    
    price_data = np.zeros((num_symbols, data_length))
    price_data[:, 0] = base_prices.flatten()
    
    for i in range(1, data_length):
        price_data[:, i] = price_data[:, i-1] * (1 + returns[:, i-1])
    
    # GPU benchmark
    gpu_indicators = GPUIndicators()
    
    start_time = time.time()
    gpu_rsi = gpu_indicators.rsi_batch(price_data, period=14)
    gpu_time = time.time() - start_time
    
    print(f"GPU RSI calculation ({num_symbols} symbols, {data_length} points each):")
    print(f"  Time: {gpu_time:.4f}s")
    print(f"  Throughput: {num_symbols * data_length / gpu_time:.0f} calculations/second")
    
    # Verify results are reasonable
    final_rsi = gpu_rsi[:, -1]
    valid_rsi = final_rsi[~np.isnan(final_rsi)]
    print(f"  Sample RSI values: {valid_rsi[:5].round(2)}")
    print(f"  RSI range: {valid_rsi.min():.2f} - {valid_rsi.max():.2f}")
    
    # Memory cleanup
    gpu_indicators.clear_memory()
    
    return gpu_time

if __name__ == "__main__":
    print("SignalCartel GPU-Accelerated Indicators Test")
    print("=" * 50)
    
    # Run benchmark
    gpu_time = benchmark_rsi_performance()
    
    print(f"\n✅ GPU indicators module ready!")
    print(f"🚀 Ready to integrate with SignalCartel trading strategies")