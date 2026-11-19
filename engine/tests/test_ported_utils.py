from pole_engine.utils import num, is_missing, to_rad, dia_m
import math

def test_utils_num():
    assert num("12.5") == 12.5
    assert num(12.5) == 12.5
    assert num(None, 5.0) == 5.0
    assert num("", 5.0) == 5.0
    assert num("invalid", 5.0) == 5.0
    assert num(float("nan"), 5.0) == 5.0

def test_utils_is_missing():
    assert is_missing(None) is True
    assert is_missing("") is True
    assert is_missing("abc") is True
    assert is_missing(float("nan")) is True
    assert is_missing(0) is False
    assert is_missing("12.3") is False

def test_utils_to_rad():
    assert math.isclose(to_rad(180), math.pi)
    assert math.isclose(to_rad(90), math.pi / 2)

def test_utils_dia_m():
    assert dia_m({"diameter_mm": 10.5}) == 0.0105
    assert dia_m(None) == 0.0
    assert dia_m({}) == 0.0
