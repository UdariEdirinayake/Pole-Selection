# Calculation Engine Inputs Specification (Phase 4C)

Every input parameter, configuration field, master data entity, and line-row property read by the calculation engine.
Per Phase 4C constraints: No default fallback values substitute for missing data. If an engineering input is missing, the calculation returns NOT ASSESSED with reason input needed.

| Field / Property | Unit | Description | Classification | Source in System |
| :--- | :--- | :--- | :--- | :--- |
| settings.calc_method | - | Design tension method: standard chart vs clearance-based | **project input** | Project.calc_method (default: standard) |
| settings.config_no | - | Reference pole configuration number | **project input** | Project.config_no or Pole.config_no |
| settings.conductors_by_band | - | Mapping of voltage bands to selected conductors | **project input** | Circuit conductor selections |
| settings.conductor_HH | code | 33 kV default conductor code | **project input** | Circuit.conductor_code |
| settings.conductor_H | code | 11 kV default conductor code | **project input** | Circuit.conductor_code |
| settings.conductor_LV | code | LV default conductor code | **project input** | Circuit.conductor_code |
| settings.wind_pressure_Nm2 | N/m² | Conductor wind pressure | **design parameter** | DesignParameter(wind_conductor = 575 N/m²) |
| settings.wind_pole_Nm2 | N/m² | Pole shaft and equipment wind pressure | **design parameter** | DesignParameter(wind_pole = 750 N/m²) |
| settings.guy_wire_angle_deg | deg | Standard guy wire angle to pole | **design parameter** | DesignParameter(guy_angle = 30 deg) |
| settings.max_stress_pct_uts | % | Maximum allowable tension % of UTS at 15C+wind | **design parameter** | DesignParameter(tension_max_pct = 40 %) |
| settings.eds_pct_uts | % | Everyday stress tension % of UTS at 27C | **design parameter** | DesignParameter(tension_eds_pct = 20 %) |
| settings.ten_mfl_kN | kN | Default mechanical failing load for tension insulator set | **design parameter** | DesignParameter(insulator_mfl = 70 kN) |
| settings.tie_thresholds | deg | Line angle limits for single tie (10 deg) and double tie (20 deg) | **design parameter** | DesignParameter(ttie_limit=10, stie_limit=20) |
| settings.uplift_temp_C | °C | Temperature at which conductor uplift is evaluated | **design parameter** | DesignParameter(uplift_temp = 15 C) |
| settings.uplift_caution_pct | % | Uplift caution threshold percentage of mean span | **design parameter** | DesignParameter(uplift_caution = 20 %) |
| settings.pole_top_fitting_m | m | Allowance for pole top fitting above top crossarm | **design parameter** | DesignParameter(pole_top_fitting = 0.5 m) |
| settings.clearance_source | - | Clearance standards table source (regulatory vs user) | **design parameter** | DesignParameter(clearance_source = regulatory) |
| settings.cb_t_sag | °C | Sag evaluation temperature for clearance-based tension | **design parameter** | DesignParameter(cb_t_sag = 65 C) |
| settings.cb_t_wind | °C | Wind evaluation temperature for clearance-based tension | **design parameter** | DesignParameter(cb_t_wind = 15 C) |
| settings.cb_extra_bottom | m | Extra ground clearance allowance on bottom circuit | **design parameter** | DesignParameter(cb_extra_bottom = 0.0 m) |
| settings.tension_factors | % | Per-circuit or per-section line tension reduction factors | **project input** | Project.tension_factors (default 100%) |
| settings.insulator_HH_desc | - | Preferred 33 kV post/pin insulator catalog description | **project input** | Project.insulator_HH_desc or master table |
| settings.insulator_H_desc | - | Preferred 11 kV post/pin insulator catalog description | **project input** | Project.insulator_H_desc or master table |
| settings.cb_creep_33 | m | Creepage allowance for 33 kV bare conductor | **design parameter** | DesignParameter(cb_creep_33 = 0.35 m) |
| settings.cb_creep_33abc | m | Creepage allowance for 33 kV ABC conductor | **design parameter** | DesignParameter(cb_creep_33abc = 0.35 m) |
| settings.cb_creep_11 | m | Creepage allowance for 11 kV bare conductor | **design parameter** | DesignParameter(cb_creep_11 = 0.25 m) |
| settings.cb_creep_11abc | m | Creepage allowance for 11 kV ABC conductor | **design parameter** | DesignParameter(cb_creep_11abc = 0.25 m) |
| settings.cb_creep_lvbare | m | Creepage allowance for LV bare conductor | **design parameter** | DesignParameter(cb_creep_lvbare = 0.15 m) |
| settings.cb_creep_lvabc | m | Creepage allowance for LV ABC conductor | **design parameter** | DesignParameter(cb_creep_lvabc = 0.15 m) |
| settings.cb_creep_earth | m | Creepage allowance for earth conductor | **design parameter** | DesignParameter(cb_creep_earth = 0.15 m) |
| row.pole_no | int | Sequential pole number | **project input** | Pole.pole_no |
| row.section | int | Strain section number to which pole belongs | **project input** | Pole.section |
| row.aft_span_m | m | Span distance behind this pole | **project input** | Pole.aft_span_m |
| row.fore_span_m | m | Span distance ahead of this pole | **project input** | Pole.fore_span_m |
| row.angle_deg | deg | Line horizontal deviation angle at this pole | **project input** | Pole.angle_deg |
| row.soil_class | int/str | Geotechnical soil class number at this pole location | **project input** | Pole.soil_class_num (1 to 5) |
| row.equipment | - | Equipment or transformer mounted on this pole | **project input** | Pole.equipment |
| row.span_environment | - | Ground profile environment along the ahead span | **project input** | Pole.span_environment |
| row.elev_delta_m | m | Relative elevation rise/fall of next pole relative to this pole | **project input** | Pole.elev_delta_m (default: 0.0 m) |
| row.guy_pole_angle_deg | deg | Actual guy wire angle to pole at this location | **project input** | Pole.guy_pole_angle_deg (default: 30 deg) |
| row.guy_theta_deg | deg | Guy wire offset angle from transverse axis | **project input** | Pole.guy_theta_deg (default: 0 deg) |
| row.survey_points | list | Surveyed profile coordinates (x, y) along span | **project input** | Pole.survey_points (empty if flat) |
| row.circuit_sections | dict | Per-circuit strain section numbers for common-mode routing | **project input** | Pole.circuit_sections |
| data.configs | table | Pole framing arrangements, mounting heights, level counts | **master-data table** | PoleConfig (CrossarmConfig / master table) |
| data.conductors | table | Conductor physical properties: diameter, weight, UTS, area, E, alpha | **master-data table** | Conductor table |
| data.span_tension_tables | table | Conductor sag-tension calibration tables across span range | **master-data table** | SpanTensionPoint table |
| data.capacities | table | Pole structural capacities: working load, buckling, dimensions, breadth | **master-data table** | PoleCapacity table |
| data.soil_classes | table | Soil mechanical properties: bearing capacity, passive pressure factor | **master-data table** | SoilClass table |
| data.equipment | table | Equipment physical dimensions, mass, and wind areas | **master-data table** | Equipment table |
| data.guy_wires | table | Guy wire catalog: working load capacity, breaking load | **master-data table** | GuyWire table |
| data.insulators | table | Insulator catalog: cantilever strength, MFL, nominal height | **master-data table** | Insulator table |
| data.ground_clearances | table | Minimum vertical clearance above ground standards | **master-data table** | GroundClearance table |
| data.circuit_clearances | table | Minimum vertical separation standards between circuits | **master-data table** | CircuitClearance table |
| data.structure_clearances | table | Minimum clearance to structures and objects | **master-data table** | StructureClearance table |
| data.crossarm_spacings | table | Crossarm straight phase separation dimensions | **master-data table** | CrossarmConfig table |
