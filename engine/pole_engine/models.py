"""Evaluation status and validation rules.

Rule: PASS only when all inputs are valid.
Calculations are not yet implemented.
"""
from enum import Enum
from pydantic import BaseModel, Field


class EvaluationStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    INVALID = "INVALID"


class ValidationResult(BaseModel):
    is_valid: bool = Field(..., description="True only if every required input is strictly valid")
    status: EvaluationStatus = Field(..., description="PASS only when all inputs are valid and verified")
    message: str = Field(..., description="Evaluation summary or reason for failure")
