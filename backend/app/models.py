import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


# ==========================================
# Phase 2: Auth Models
# ==========================================

class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="designer", nullable=False)  # designer, reviewer, admin
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")


# ==========================================
# Phase 2: Project, Circuit, Pole Models
# ==========================================

class Project(Base):
    __tablename__ = "project"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    line_arrangement = Column(String(50), default="11 kV + LV", nullable=False)  # "11 kV", "LV", "11 kV + LV"
    status = Column(String(50), default="draft", nullable=False)
    owner_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="projects")
    circuits = relationship("Circuit", back_populates="project", cascade="all, delete-orphan")
    poles = relationship("Pole", back_populates="project", cascade="all, delete-orphan", order_by="Pole.pole_no")


class Circuit(Base):
    __tablename__ = "circuit"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("project.id"), nullable=False, index=True)
    circuit_name = Column(String(100), nullable=False)  # "C1 (11kV)", "C2 (LV)"
    nominal_voltage_kv = Column(Float, nullable=False)
    circuit_type = Column(String(50), nullable=False)  # "Overhead ABC", "Bare"
    conductor_code = Column(Integer, nullable=True)
    conductor_name = Column(String(255), nullable=True)
    lookup_table = Column(String(50), nullable=True)

    project = relationship("Project", back_populates="circuits")


class Pole(Base):
    __tablename__ = "pole"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("project.id"), nullable=False, index=True)
    section = Column(Integer, default=1, nullable=False)
    pole_no = Column(Integer, nullable=False)
    pole_id_name = Column(String(50), nullable=True)
    aft_span_m = Column(Float, default=0.0, nullable=False)
    fore_span_m = Column(Float, default=0.0, nullable=False)
    angle_deg = Column(Float, default=0.0, nullable=False)
    soil_class_num = Column(Integer, default=4, nullable=False)
    equipment = Column(String(100), nullable=True)
    span_environment = Column(String(255), default="across any road or street", nullable=False)

    project = relationship("Project", back_populates="poles")

    __table_args__ = (
        Index("ix_project_pole_no", "project_id", "pole_no"),
    )


# ==========================================
# Master Data Models (Phase 1)
# ==========================================

class DatasetVersion(Base):
    __tablename__ = "dataset_version"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    imported_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    source_file = Column(String(255), nullable=False)
    file_hash = Column(String(64), nullable=False)

    conductors = relationship("Conductor", back_populates="dataset_version", cascade="all, delete-orphan")
    span_tension_points = relationship("SpanTensionPoint", back_populates="dataset_version", cascade="all, delete-orphan")
    pole_capacities = relationship("PoleCapacity", back_populates="dataset_version", cascade="all, delete-orphan")
    guy_wires = relationship("GuyWire", back_populates="dataset_version", cascade="all, delete-orphan")
    soil_classes = relationship("SoilClass", back_populates="dataset_version", cascade="all, delete-orphan")
    equipments = relationship("Equipment", back_populates="dataset_version", cascade="all, delete-orphan")
    insulators = relationship("Insulator", back_populates="dataset_version", cascade="all, delete-orphan")
    crossarm_configs = relationship("CrossarmConfig", back_populates="dataset_version", cascade="all, delete-orphan")
    ground_clearances = relationship("GroundClearance", back_populates="dataset_version", cascade="all, delete-orphan")
    structure_clearances = relationship("StructureClearance", back_populates="dataset_version", cascade="all, delete-orphan")
    circuit_clearances = relationship("CircuitClearance", back_populates="dataset_version", cascade="all, delete-orphan")
    design_parameters = relationship("DesignParameter", back_populates="dataset_version", cascade="all, delete-orphan")
    sample_line_poles = relationship("SampleLinePole", back_populates="dataset_version", cascade="all, delete-orphan")


class BaseMasterTable:
    id = Column(Integer, primary_key=True, index=True)
    source_sheet = Column(String(100), nullable=False)
    source_row = Column(Integer, nullable=False)
    dataset_version_id = Column(Integer, ForeignKey("dataset_version.id"), nullable=False, index=True)
    needs_confirmation = Column(Boolean, default=False, nullable=False)
    confirmation_note = Column(Text, nullable=True)


class Conductor(Base, BaseMasterTable):
    __tablename__ = "conductor"

    code = Column(Integer, nullable=True)
    description = Column(String(255), nullable=True)
    lookup_table = Column(String(50), nullable=True, index=True)
    conductor_type = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

    diameter_mm = Column(Float, nullable=True)
    stress_area_mm2 = Column(Float, nullable=True)
    everyday_tension_dan = Column(Float, nullable=True)
    weight_kg_per_m = Column(Float, nullable=True)
    modulus_elasticity_kg_per_mm2 = Column(Float, nullable=True)
    breaking_load_kg = Column(Float, nullable=True)
    thermal_expansion_coeff_per_c = Column(Float, nullable=True)
    ultimate_tensile_strength_dan = Column(Float, nullable=True)

    diameter_m = Column(Float, nullable=True)
    diameter_m_unit = Column(String(20), default="m")

    stress_area_m2 = Column(Float, nullable=True)
    stress_area_m2_unit = Column(String(20), default="m²")

    everyday_tension_kn = Column(Float, nullable=True)
    everyday_tension_kn_unit = Column(String(20), default="kN")

    weight_n_per_m = Column(Float, nullable=True)
    weight_n_per_m_unit = Column(String(20), default="N/m")

    modulus_elasticity_n_per_m2 = Column(Float, nullable=True)
    modulus_elasticity_n_per_m2_unit = Column(String(20), default="N/m²")

    breaking_load_n = Column(Float, nullable=True)
    breaking_load_n_unit = Column(String(20), default="N")

    ultimate_tensile_strength_kn = Column(Float, nullable=True)
    ultimate_tensile_strength_kn_unit = Column(String(20), default="kN")

    dataset_version = relationship("DatasetVersion", back_populates="conductors")


class SpanTensionPoint(Base, BaseMasterTable):
    __tablename__ = "span_tension_point"

    table_id = Column(String(50), nullable=False, index=True)
    span_m = Column(Float, nullable=False, index=True)

    tension_kn = Column(Float, nullable=True)
    tension_kn_unit = Column(String(20), default="kN")

    tension_27_kn = Column(Float, nullable=True)
    tension_27_kn_unit = Column(String(20), default="kN")

    sag_15_m = Column(Float, nullable=True)
    sag_15_m_unit = Column(String(20), default="m")

    sag_27_m = Column(Float, nullable=True)
    sag_27_m_unit = Column(String(20), default="m")

    sag_65_m = Column(Float, nullable=True)
    sag_65_m_unit = Column(String(20), default="m")

    dataset_version = relationship("DatasetVersion", back_populates="span_tension_points")

    __table_args__ = (
        Index("ix_span_tension_table_span", "dataset_version_id", "table_id", "span_m"),
    )


class PoleCapacity(Base, BaseMasterTable):
    __tablename__ = "pole_capacity"

    height_m = Column(Float, nullable=False, index=True)
    mount_type = Column(String(50), nullable=False, index=True)
    class_label = Column(String(50), nullable=False, index=True)

    capacity_dan = Column(Float, nullable=True)
    capacity_kn = Column(Float, nullable=True)
    capacity_kn_unit = Column(String(20), default="kN")

    cost_rank = Column(Integer, nullable=True)
    avg_breadth_m = Column(Float, nullable=True)
    avg_breadth_m_unit = Column(String(20), default="m")

    critical_buckling_kn = Column(Float, nullable=True)
    critical_buckling_kn_unit = Column(String(20), default="kN")

    below_gl_breadth_m = Column(Float, nullable=True)
    below_gl_breadth_m_unit = Column(String(20), default="m")

    weight_kg = Column(Float, nullable=True)
    weight_n = Column(Float, nullable=True)
    weight_n_unit = Column(String(20), default="N")

    footprint_mm = Column(String(50), nullable=True)

    dataset_version = relationship("DatasetVersion", back_populates="pole_capacities")

    __table_args__ = (
        Index("ix_pole_capacity_key", "dataset_version_id", "height_m", "mount_type", "class_label"),
    )


class GuyWire(Base, BaseMasterTable):
    __tablename__ = "guy_wire"

    code = Column(String(20), nullable=False, index=True)
    description = Column(String(255), nullable=True)

    working_load_dan = Column(Float, nullable=True)
    working_load_kn = Column(Float, nullable=True)
    working_load_kn_unit = Column(String(20), default="kN")

    angle_deg = Column(Float, nullable=True)
    angle_deg_unit = Column(String(20), default="deg")

    notes = Column(Text, nullable=True)

    dataset_version = relationship("DatasetVersion", back_populates="guy_wires")


class SoilClass(Base, BaseMasterTable):
    __tablename__ = "soil_class"

    soil_class_num = Column(Integer, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    bearing_raw = Column(String(50), nullable=True)
    bearing_min_kn_per_m2 = Column(Float, nullable=True)
    bearing_max_kn_per_m2 = Column(Float, nullable=True)
    bearing_unit = Column(String(20), default="kN/m²")

    subgrade_kn_per_m3 = Column(Float, nullable=True)
    subgrade_unit = Column(String(20), default="kN/m³")

    dataset_version = relationship("DatasetVersion", back_populates="soil_classes")


class Equipment(Base, BaseMasterTable):
    __tablename__ = "equipment"

    equipment_name = Column(String(100), nullable=False, index=True)
    width_m = Column(Float, nullable=True)
    height_m = Column(Float, nullable=True)
    depth_m = Column(Float, nullable=True)
    delh_m = Column(Float, nullable=True)

    weight_kg = Column(Float, nullable=True)
    weight_n = Column(Float, nullable=True)
    weight_n_unit = Column(String(20), default="N")

    area_m2 = Column(Float, nullable=True)
    area_m2_unit = Column(String(20), default="m²")

    tfh_11m_pole_m = Column(Float, nullable=True)
    tfh_13m_pole_m = Column(Float, nullable=True)

    dataset_version = relationship("DatasetVersion", back_populates="equipments")


class Insulator(Base, BaseMasterTable):
    __tablename__ = "insulator"

    description = Column(String(100), nullable=False, index=True)
    voltage_level_kv = Column(Float, nullable=True)
    nominal_height_m = Column(Float, nullable=True)
    cantilever_strength_kn = Column(Float, nullable=True)
    tension_mfl_kn = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    dataset_version = relationship("DatasetVersion", back_populates="insulators")


class CrossarmConfig(Base, BaseMasterTable):
    __tablename__ = "crossarm_config"

    config_no = Column(Integer, nullable=False, index=True)
    description = Column(String(100), nullable=True)
    left_pin_to_middle_m = Column(Float, nullable=True)
    middle_pin_to_right_m = Column(Float, nullable=True)
    minimum_separation_m = Column(Float, nullable=True)

    dataset_version = relationship("DatasetVersion", back_populates="crossarm_configs")


class GroundClearance(Base, BaseMasterTable):
    __tablename__ = "ground_clearance"

    voltage_band = Column(String(50), nullable=False, index=True)
    environment = Column(String(255), nullable=False)
    min_clearance_m = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)

    dataset_version = relationship("DatasetVersion", back_populates="ground_clearances")


class StructureClearance(Base, BaseMasterTable):
    __tablename__ = "structure_clearance"

    voltage_band = Column(String(50), nullable=False, index=True)
    description = Column(String(255), nullable=True)
    min_clearance_m = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)

    dataset_version = relationship("DatasetVersion", back_populates="structure_clearances")


class CircuitClearance(Base, BaseMasterTable):
    __tablename__ = "circuit_clearance"

    upper_band = Column(String(50), nullable=False, index=True)
    lower_band = Column(String(50), nullable=False, index=True)
    min_vertical_m = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)

    dataset_version = relationship("DatasetVersion", back_populates="circuit_clearances")


class DesignParameter(Base, BaseMasterTable):
    __tablename__ = "design_parameter"

    parameter_name = Column(String(100), nullable=False, index=True)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    source = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)

    dataset_version = relationship("DatasetVersion", back_populates="design_parameters")


class SampleLinePole(Base, BaseMasterTable):
    __tablename__ = "sample_line_pole"

    section = Column(Integer, nullable=True)
    pole_no = Column(Integer, nullable=False, index=True)
    aft_span_m = Column(Float, nullable=True)
    fore_span_m = Column(Float, nullable=True)
    angle_deg = Column(Float, nullable=True)
    soil_class_num = Column(Integer, nullable=True)
    equipment = Column(String(100), nullable=True)
    span_environment = Column(String(255), nullable=True)

    dataset_version = relationship("DatasetVersion", back_populates="sample_line_poles")


class PoleCatalogItem(Base):
    __tablename__ = "pole_catalog"

    id = Column(Integer, primary_key=True, index=True)
    catalog_code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
