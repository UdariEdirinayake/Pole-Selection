"""Pole Engine - Pure Python Calculation and Evaluation Package."""
from pole_engine.clearances import (
    calculate_required_phase_separation_m,
    calculate_separation_at_angle_m,
    calculate_max_crossarm_angle_deg,
    evaluate_phase_separation,
    calculate_lowest_ground_clearance_m,
    evaluate_ground_clearance,
    evaluate_circuit_clearance,
    PoleClearanceResult,
)
from pole_engine.units import (
    m_to_mm,
    mm_to_m,
    dan_to_kn,
    kn_to_dan,
    kg_to_n,
    n_to_kn,
    kn_to_n,
    STANDARD_GRAVITY_M_PER_S2,
)
from pole_engine.models import (
    EvaluationStatus,
    ValidationResult,
)
from pole_engine.sag_tension import (
    TableLookupPoint,
    TableLookupResult,
    calculate_equivalent_span_m,
    lookup_sag_tension_table,
    get_pole_sag_span_m,
    scale_sag_to_actual_span_m,
    calculate_tension_pct_of_uts,
    default_eds_assessment,
    assess_eds_check,
    assess_max_stress_15c_wind,
)

__all__ = [
    "m_to_mm",
    "mm_to_m",
    "dan_to_kn",
    "kn_to_dan",
    "kg_to_n",
    "n_to_kn",
    "kn_to_n",
    "STANDARD_GRAVITY_M_PER_S2",
    "EvaluationStatus",
    "ValidationResult",
    "TableLookupPoint",
    "TableLookupResult",
    "calculate_equivalent_span_m",
    "lookup_sag_tension_table",
    "get_pole_sag_span_m",
    "scale_sag_to_actual_span_m",
    "calculate_tension_pct_of_uts",
    "default_eds_assessment",
    "assess_eds_check",
    "assess_max_stress_15c_wind",
    # Phase 4B – Clearances
    "calculate_required_phase_separation_m",
    "calculate_separation_at_angle_m",
    "calculate_max_crossarm_angle_deg",
    "evaluate_phase_separation",
    "calculate_lowest_ground_clearance_m",
    "evaluate_ground_clearance",
    "evaluate_circuit_clearance",
    "PoleClearanceResult",
]
