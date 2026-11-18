from pole_engine.units import m_to_mm, mm_to_m
from pole_engine.models import EvaluationStatus, ValidationResult


def test_unit_conversion():
    assert m_to_mm(1.5) == 1500.0
    assert mm_to_m(1500.0) == 1.5


def test_validation_model():
    res = ValidationResult(is_valid=True, status=EvaluationStatus.PASS, message="Inputs valid")
    assert res.is_valid is True
    assert res.status == EvaluationStatus.PASS
