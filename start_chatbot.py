#!/usr/bin/env python3
"""
Startup script for Blood Donation Chatbot Service
"""

import subprocess
import sys
import os
import time

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 7):
        print("❌ Python 3.7 or higher is required")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True

def install_requirements():
    """Install required packages"""
    print("📦 Installing Python packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "chatbot_requirements.txt"])
        print("✅ Packages installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install packages: {e}")
        return False

def check_dataset():
    """Check if dataset exists"""
    dataset_path = "./blood_donation_1000_qa.csv"
    if os.path.exists(dataset_path):
        print(f"✅ Dataset found: {dataset_path}")
        return True
    else:
        print(f"❌ Dataset not found: {dataset_path}")
        return False

def main():
    """Main startup function"""
    print("🤖 Blood Donation Chatbot Service Setup")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Check dataset
    if not check_dataset():
        return False
    
    # Install requirements
    if not install_requirements():
        return False
    
    print("\n🚀 Starting chatbot service...")
    print("📊 This will take a few moments to load the model and dataset...")
    
    # Start the chatbot service
    try:
        subprocess.run([sys.executable, "chatbot_service.py"])
    except KeyboardInterrupt:
        print("\n👋 Chatbot service stopped")
    except Exception as e:
        print(f"❌ Error starting service: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()
