"""
LLM Integration Module for IntelliTrack

This module provides integration with the IntelliTrack LLM service
for analyzing project progress and task completion status.
"""

import os
import requests
from typing import List, Optional, Dict
from pydantic import BaseModel

# LLM Service Configuration
LLM_SERVICE_URL = os.getenv("LLM_SERVICE_URL", "http://localhost:8001")


class LLMProgressRequest(BaseModel):
    repo_url: str
    github_token: Optional[str] = None
    tasks: str


class TaskProgress(BaseModel):
    task: str
    progress: str


class LLMResponse(BaseModel):
    results: List[TaskProgress]
    progress_percent: int


async def analyze_project_progress(
    repo_url: str,
    tasks: str,
    github_token: Optional[str] = None,
) -> Optional[LLMResponse]:
    """
    Analyze project progress using the LLM service.
    
    Args:
        repo_url: GitHub repository URL
        tasks: Semicolon-separated list of tasks to analyze
        github_token: Optional GitHub token for private repos
        
    Returns:
        LLMResponse with analysis results or None if service unavailable
    """
    try:
        payload = {
            "repo_url": repo_url,
            "tasks": tasks,
            "github_token": github_token,
        }
        
        response = requests.post(
            f"{LLM_SERVICE_URL}/progress",
            json=payload,
            timeout=300  # 5 minutes for LLM analysis
        )
        
        if response.status_code == 200:
            return LLMResponse(**response.json())
        else:
            print(f"LLM Service Error: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print(f"Could not connect to LLM Service at {LLM_SERVICE_URL}")
        return None
    except requests.exceptions.Timeout:
        print("LLM Service request timeout")
        return None
    except Exception as e:
        print(f"Error calling LLM Service: {str(e)}")
        return None


async def check_llm_service_health() -> bool:
    """Check if LLM service is available."""
    try:
        response = requests.get(
            f"{LLM_SERVICE_URL}/health",
            timeout=5
        )
        return response.status_code == 200
    except Exception:
        return False
