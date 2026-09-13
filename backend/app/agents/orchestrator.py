"""
orchestrator.py (Compatibility Shim)
------------------------------------
The AI Orchestrator has been moved to its canonical location:
    app.workflow.orchestrator

This module re-exports AIOrchestrator and ai_orchestrator for backward compatibility.
"""

from app.workflow.orchestrator import AIOrchestrator, ai_orchestrator

__all__ = ["AIOrchestrator", "ai_orchestrator"]
