#!/usr/bin/env python3
"""
Script to validate deployment configuration
"""

import os
import sys
from pathlib import Path

def check_files():
    """Check if required files exist"""
    required_files = [
        'Dockerfile.backend',
        'Dockerfile.frontend',
        'docker-compose.yml',
        '.dockerignore',
        'requirements.txt',
        'frontend/package.json',
    ]
    
    missing = []
    for f in required_files:
        if not Path(f).exists():
            missing.append(f)
    
    if missing:
        print(f"❌ Missing files: {', '.join(missing)}")
        return False
    
    print("✓ All required files present")
    return True

def check_docker():
    """Check if Docker is installed"""
    ret = os.system("docker --version > /dev/null 2>&1")
    if ret != 0:
        print("❌ Docker not installed")
        return False
    
    ret = os.system("docker-compose --version > /dev/null 2>&1")
    if ret != 0:
        print("❌ Docker Compose not installed")
        return False
    
    print("✓ Docker and Docker Compose installed")
    return True

def check_env():
    """Check environment files"""
    env_files = ['.env.dev', '.env.test', '.env.prod']
    missing = []
    
    for env in env_files:
        if not Path(env).exists():
            missing.append(env)
    
    if missing:
        print(f"⚠ Missing env files (can be created): {', '.join(missing)}")
    else:
        print("✓ Environment files present")
    
    return True

def main():
    print("🔍 Validating IntelliTrack deployment setup...\n")
    
    checks = [
        ("Files", check_files),
        ("Docker", check_docker),
        ("Environment", check_env),
    ]
    
    results = []
    for name, check in checks:
        print(f"\n{name}:")
        results.append(check())
    
    print("\n" + "="*50)
    if all(results):
        print("✅ All checks passed!")
        print("\nNext steps:")
        print("1. Copy .env.example to .env.dev")
        print("2. Run: ./deploy/deploy.sh dev")
        return 0
    else:
        print("❌ Some checks failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
