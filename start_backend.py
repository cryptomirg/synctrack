#!/usr/bin/env python3
"""
SyncTracker Backend Startup Script
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    """Start the SyncTracker backend server"""
    
    # Ensure we're in the right directory
    project_root = Path(__file__).parent
    backend_dir = project_root / "backend"
    
    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        print("Make sure you're running this from the SyncTracker root directory.")
        sys.exit(1)
    
    # Check if .env exists
    env_file = project_root / ".env"
    env_example = project_root / "env_example.txt"
    
    if not env_file.exists() and env_example.exists():
        print("⚠️  No .env file found!")
        print("Please copy env_example.txt to .env and configure your AWS credentials:")
        print(f"   cp {env_example} {env_file}")
        print()
        print("Required environment variables:")
        print("   - AWS_ACCESS_KEY_ID")
        print("   - AWS_SECRET_ACCESS_KEY")
        print("   - AWS_DEFAULT_REGION")
        print("   - BEDROCK_MODEL_ID")
        print()
        
        response = input("Continue anyway? (y/N): ").strip().lower()
        if response != 'y':
            sys.exit(1)
    
    # Check if requirements are installed
    try:
        import fastapi
        import uvicorn
        import boto3
        import langchain
        print("✅ Dependencies appear to be installed")
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please install requirements:")
        print("   pip install -r requirements.txt")
        sys.exit(1)
    
    # Change to backend directory
    os.chdir(backend_dir)
    
    print("🚀 Starting SyncTracker Backend...")
    print("📍 Backend will be available at: http://localhost:8000")
    print("📖 API documentation at: http://localhost:8000/docs")
    print("💡 Press Ctrl+C to stop the server")
    print()
    
    # Start the server
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "main:app", 
            "--reload", 
            "--host", "0.0.0.0", 
            "--port", "8000"
        ], check=True)
    except KeyboardInterrupt:
        print("\n👋 SyncTracker backend stopped")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()