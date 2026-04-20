#!/usr/bin/env python3
"""
Interactive Free Deployment Helper
Choose your preferred cloud platform and get step-by-step instructions
"""

import os

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60 + "\n")

def option_flyio():
    print_header("Fly.io Deployment (RECOMMENDED)")
    print("""
✅ BEST FOR THIS PROJECT

Quick Facts:
  • Free tier: Always-on servers (no cold starts)
  • Deploy time: ~15 minutes
  • Database: PostgreSQL included (free)
  • Cost: Always free or ~$2/month for more resources

Setup Steps:

1. SIGN UP
   └─ Go to: https://fly.io
   └─ Click "Sign up with GitHub"
   └─ Authorize connection
   
2. INSTALL FLY CLI (Windows - PowerShell)
   └─ Run: iwr https://fly.io/install.ps1 -useb | iex
   
3. LOGIN
   └─ Run: fly auth login
   └─ Follow browser login
   
4. DEPLOY BACKEND
   └─ cd c:\\Users\\dheer\\Downloads\\setup
   └─ fly launch (answer prompts)
   └─ When asked about database: YES (create new)
   └─ When asked about Redis: NO
   └─ Wait for deployment (~3 min)
   
5. DEPLOY FRONTEND
   └─ cd frontend
   └─ fly launch
   └─ Answer prompts, deploy
   
6. GET URLS
   └─ fly info --app intellitrack-backend
   └─ fly info --app intellitrack-frontend
   
7. VIEW LIVE
   └─ Backend API: https://intellitrack-backend.fly.dev/docs
   └─ Frontend: https://intellitrack-frontend.fly.dev

Next: See FLYIO_DEPLOY.md for detailed guide
    """)

def option_render():
    print_header("Render.com Deployment (EASIEST)")
    print("""
✅ TECHNICALLY EASIEST

Quick Facts:
  • Free tier: 100% free static sites + services
  • Deploy time: ~20 minutes (mostly waiting)
  • Services sleep after 15min inactivity (~30sec to wake up)
  • Cost: FREE for free tier, $7-12/month for always-on

Setup Steps:

1. SIGN UP
   └─ Go to: https://render.com
   └─ Click "Get Started"
   └─ Sign up with GitHub
   
2. PUSH CODE TO GITHUB
   └─ git init
   └─ git add .
   └─ git commit -m "Initial"
   └─ git remote add origin https://github.com/YOUR/repo
   └─ git push
   
3. IN RENDER DASHBOARD
   └─ Click "New +"
   └─ Select "Web Service"
   └─ Connect your GitHub repo
   
4. CONFIGURE BACKEND
   └─ Name: intellitrack-backend
   └─ Start: python -m uvicorn app.main:app --host 0.0.0.0 --port \\$PORT
   └─ Plan: Free
   └─ Deploy
   
5. CONFIGURE FRONTEND
   └─ New +"
   └─ Select "Static Site"
   └─ Build: cd frontend && npm install && npm run build
   └─ Directory: frontend/dist
   └─ Deploy
   
6. VIEW LIVE
   └─ Backend: https://intellitrack-backend.onrender.com/docs
   └─ Frontend: https://intellitrack-frontend.onrender.com

Note: Services sleep after 15 min of no use (cold start ~45 sec)

Next: See RENDER_DEPLOY.md for detailed guide
    """)

def option_oracle():
    print_header("Oracle Cloud Free Tier (BEST VALUE)")
    print("""
✅ BEST FOR LONG-TERM (TRULY FREE FOREVER)

Quick Facts:
  • Free tier: Always-on, generous limits, NO expiration
  • Deploy time: ~45 minutes (more setup, better result)
  • Database: Autonomous PostgreSQL included (free)
  • Cost: COMPLETELY FREE

Setup Steps:

1. SIGN UP
   └─ Go to: https://oracle.com/cloud/free
   └─ Click free tier signup
   └─ Enter credit card (charges $0, verification only)
   
2. CREATE DATABASE
   └─ Dashboard → Autonomous Database
   └─ Create Autonomous Database (PostgreSQL)
   └─ Name: intellitrack-db
   └─ Set admin password
   └─ Wait for provisioning (~5 min)
   
3. CREATE LINUX VM
   └─ Dashboard → Compute → Instances
   └─ Launch Instance (Ubuntu 22.04)
   └─ Shape: Always Free (A1)
   └─ Download SSH key
   
4. SSH INTO VM
   └─ ssh -i your-key.key ubuntu@YOUR_PUBLIC_IP
   
5. INSTALL DOCKER & DEPLOY
   └─ sudo apt update && sudo apt upgrade -y
   └─ curl -fsSL https://get.docker.com | sudo sh
   └─ git clone your-repo
   └─ docker-compose up -d
   
6. SETUP NGINX & SSL
   └─ sudo apt install nginx certbot -y
   └─ Setup Nginx reverse proxy
   └─ Get free SSL with Certbot
   
7. VIEW LIVE
   └─ https://YOUR_PUBLIC_IP
   └─ Or your custom domain

Advantage: Setup once, runs forever FREE

Next: See ORACLE_CLOUD_DEPLOY.md for detailed guide
    """)

def option_compare():
    print_header("All Options Comparison")
    comparison = """
Platform      Cost           Setup Time  Always-On  Cold Start  Best For
─────────────────────────────────────────────────────────────────────────
Fly.io        FREE           15 min      YES        NO          🏆 Recommended
Render        FREE           20 min      NO         30-45sec    Easy demos
Oracle Cloud  FREE FOREVER   45 min      YES        NO          Long-term
Railway       $5/month free  10 min      YES        NO          Prototyping
AWS Free Tier 12mo free      30 min      Variable   Variable    Complex apps
Google Cloud  $300 credit    30 min      Variable   Variable    Complex apps

My Recommendation: **Fly.io** (Best balance of speed and features)
    """
    print(comparison)

def main():
    print_header("IntelliTrack FREE DEPLOYMENT OPTIONS")
    
    print("""
Which deployment would you like to use?

 (1) Fly.io         - Recommended  ⭐⭐⭐⭐⭐
 (2) Render.com     - Easiest      ⭐⭐⭐⭐
 (3) Oracle Cloud   - Best Value   ⭐⭐⭐⭐
 (4) Compare All    - See comparison
 (q) Quit
    """)
    
    choice = input("Enter choice (1-4, q): ").strip().lower()
    
    if choice == "1":
        option_flyio()
    elif choice == "2":
        option_render()
    elif choice == "3":
        option_oracle()
    elif choice == "4":
        option_compare()
    elif choice == "q":
        print("\nGoodbye! Check the deployment guides for more info.\n")
        return
    else:
        print("\n❌ Invalid choice, try again.\n")
        main()
        return
    
    print("\n" + "="*60)
    print("\nReady to deploy? ")
    print("Next step: Follow the instructions above!")
    print("\nFor more details, see the corresponding .md file:")
    print("  • FLYIO_DEPLOY.md")
    print("  • RENDER_DEPLOY.md")
    print("  • ORACLE_CLOUD_DEPLOY.md")
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled.\n")
