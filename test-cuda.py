#!/usr/bin/env python3
"""
Test CUDA installation and GPU capabilities for SignalCartel
"""
import torch
import cupy as cp
import numpy as np
import time

def test_pytorch_cuda():
    print("=== PyTorch CUDA Test ===")
    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        print(f"CUDA version: {torch.version.cuda}")
        print(f"cuDNN version: {torch.backends.cudnn.version()}")
        print(f"Device count: {torch.cuda.device_count()}")
        print(f"Device name: {torch.cuda.get_device_name(0)}")
        print(f"Device memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
        
        # Simple tensor test
        x = torch.randn(1000, 1000).cuda()
        y = torch.randn(1000, 1000).cuda()
        start = time.time()
        z = torch.matmul(x, y)
        torch.cuda.synchronize()
        gpu_time = time.time() - start
        print(f"GPU matrix multiplication (1000x1000): {gpu_time:.4f}s")
        
        return True
    else:
        print("CUDA not available for PyTorch")
        return False

def test_cupy():
    print("\n=== CuPy Test ===")
    print(f"CuPy version: {cp.__version__}")
    
    try:
        # Simple array test
        x_gpu = cp.random.randn(1000, 1000, dtype=cp.float32)
        y_gpu = cp.random.randn(1000, 1000, dtype=cp.float32)
        
        start = time.time()
        z_gpu = cp.dot(x_gpu, y_gpu)
        cp.cuda.Stream.null.synchronize()
        gpu_time = time.time() - start
        
        print(f"CuPy matrix multiplication (1000x1000): {gpu_time:.4f}s")
        print(f"GPU memory info: {cp.cuda.MemoryPool().used_bytes() / 1024**2:.1f} MB used")
        
        return True
    except Exception as e:
        print(f"CuPy test failed: {e}")
        return False

def test_performance_comparison():
    print("\n=== Performance Comparison ===")
    size = 2000
    
    # CPU test with NumPy
    x_cpu = np.random.randn(size, size).astype(np.float32)
    y_cpu = np.random.randn(size, size).astype(np.float32)
    
    start = time.time()
    z_cpu = np.dot(x_cpu, y_cpu)
    cpu_time = time.time() - start
    print(f"CPU (NumPy) time ({size}x{size}): {cpu_time:.4f}s")
    
    # GPU test with CuPy
    x_gpu = cp.asarray(x_cpu)
    y_gpu = cp.asarray(y_cpu)
    
    start = time.time()
    z_gpu = cp.dot(x_gpu, y_gpu)
    cp.cuda.Stream.null.synchronize()
    gpu_time = time.time() - start
    print(f"GPU (CuPy) time ({size}x{size}): {gpu_time:.4f}s")
    
    speedup = cpu_time / gpu_time if gpu_time > 0 else 0
    print(f"Speedup: {speedup:.2f}x")
    
    return speedup

if __name__ == "__main__":
    print("SignalCartel CUDA Installation Test")
    print("=" * 50)
    
    pytorch_ok = test_pytorch_cuda()
    cupy_ok = test_cupy()
    
    if pytorch_ok and cupy_ok:
        speedup = test_performance_comparison()
        print(f"\n✅ CUDA setup successful!")
        print(f"🚀 Ready for GPU-accelerated trading strategies")
        print(f"📈 Expected performance boost: {speedup:.1f}x for large computations")
    else:
        print(f"\n❌ CUDA setup incomplete")
        print(f"🔧 Check NVIDIA driver and CUDA installation")