import logging
from datetime import datetime, timezone, timedelta
from sqlmodel import Session, select
from app.database import engine
from app.models import MachineAsset, SparePartInventory, WorkOrderHistory, OEMManualChunk

logger = logging.getLogger("plantpulse.seed")

def seed_database():
    with Session(engine) as session:
        # 1. Check if already seeded
        existing_assets = session.exec(select(MachineAsset)).first()
        if existing_assets:
            logger.info("Database already seeded with ontology assets. Skipping seed.")
            return

        logger.info("Seeding Enterprise Ontology, ERP Inventory, CMMS History, and OEM Manuals...")

        # -----------------------------------------------------------------
        # 1. Machine Assets (Dirty IoT ID <-> Clean SAP ERP <-> ServiceNow)
        # -----------------------------------------------------------------
        assets = [
            MachineAsset(
                id="CNC_04",
                name="Haas VF-2 Vertical Machining Center",
                iot_stream_id="CNC_04",
                erp_asset_id="Milling_Unit_4",
                cmms_asset_id="ASSET-104",
                model="Haas VF-2",
                line="Line A - Precision Milling Cell",
                downtime_cost_per_hour=4200.0,
                status="HEALTHY",
                health_score=97.8,
                current_vibration=1.42,
                current_temp=42.5,
                current_current=12.1,
                current_rpm=8250.0,
            ),
            MachineAsset(
                id="PRESS_02",
                name="Schuler 500T Hydraulic Stamping Press",
                iot_stream_id="PRESS_02",
                erp_asset_id="Hydraulic_Press_B",
                cmms_asset_id="ASSET-202",
                model="Schuler 500T",
                line="Line B - Heavy Stamping Bay",
                downtime_cost_per_hour=8500.0,
                status="HEALTHY",
                health_score=99.2,
                current_vibration=0.88,
                current_temp=48.2,
                current_current=28.4,
                current_rpm=1450.0,
            ),
            MachineAsset(
                id="ROBOT_09",
                name="Fanuc M-20iA 6-Axis Welding Robot",
                iot_stream_id="ROBOT_09",
                erp_asset_id="Welder_Arm_09",
                cmms_asset_id="ASSET-309",
                model="Fanuc M-20iA",
                line="Line C - Robotic Assembly",
                downtime_cost_per_hour=3100.0,
                status="HEALTHY",
                health_score=98.9,
                current_vibration=0.65,
                current_temp=38.4,
                current_current=8.7,
                current_rpm=3100.0,
            ),
            MachineAsset(
                id="PACK_01",
                name="Bosch High-Speed Flow Wrapper",
                iot_stream_id="PACK_01",
                erp_asset_id="Wrapper_Line_1",
                cmms_asset_id="ASSET-401",
                model="Bosch Wrapper",
                line="Line D - Final Packaging & Seal",
                downtime_cost_per_hour=2400.0,
                status="HEALTHY",
                health_score=99.5,
                current_vibration=0.45,
                current_temp=35.1,
                current_current=5.2,
                current_rpm=2400.0,
            ),
        ]
        for asset in assets:
            session.add(asset)

        # -----------------------------------------------------------------
        # 2. ERP Spare Parts Inventory (10 Items)
        # -----------------------------------------------------------------
        parts = [
            SparePartInventory(
                sku="BRG-6205-2RS",
                name="Deep Groove Spindle Ball Bearing 6205-2RS",
                category="Bearings",
                compatible_machine_id="CNC_04",
                warehouse_bin="BIN-A-12-04",
                stock_count=14,
                reserved_count=0,
                unit_cost=145.0,
                lead_time="2 days",
                min_threshold=3,
                supplier="SKF Industrial Bearings Inc."
            ),
            SparePartInventory(
                sku="SPN-CER-7014",
                name="Ceramic High-Speed Spindle Bearing 7014-C",
                category="Bearings",
                compatible_machine_id="CNC_04",
                warehouse_bin="BIN-A-14-01",
                stock_count=4,
                reserved_count=0,
                unit_cost=890.0,
                lead_time="5 days",
                min_threshold=1,
                supplier="NSK Precision Machine Components"
            ),
            SparePartInventory(
                sku="SEAL-VIT-45",
                name="Viton Hydraulic High-Temp Cylinder Seal Kit",
                category="Hydraulics",
                compatible_machine_id="PRESS_02",
                warehouse_bin="BIN-B-04-18",
                stock_count=8,
                reserved_count=0,
                unit_cost=320.0,
                lead_time="3 days",
                min_threshold=2,
                supplier="Parker Hannifin O-Rings"
            ),
            SparePartInventory(
                sku="VALV-PROP-D1F",
                name="Proportional Directional Control Valve D1FB",
                category="Hydraulics",
                compatible_machine_id="PRESS_02",
                warehouse_bin="BIN-B-02-09",
                stock_count=3,
                reserved_count=0,
                unit_cost=1450.0,
                lead_time="6 days",
                min_threshold=1,
                supplier="Bosch Rexroth Hydraulics"
            ),
            SparePartInventory(
                sku="FLT-HYD-10MIC",
                name="High-Pressure Hydraulic Filter Element 10 Micron",
                category="Filtration",
                compatible_machine_id="PRESS_02",
                warehouse_bin="BIN-B-07-03",
                stock_count=16,
                reserved_count=0,
                unit_cost=115.0,
                lead_time="2 days",
                min_threshold=4,
                supplier="Donaldson Filtration Solutions"
            ),
            SparePartInventory(
                sku="SRV-DRV-FAN",
                name="Fanuc Alpha iSV Servo Drive Amplifier 40A",
                category="Electronics",
                compatible_machine_id="ROBOT_09",
                warehouse_bin="BIN-E-01-02",
                stock_count=2,
                reserved_count=0,
                unit_cost=1850.0,
                lead_time="7 days",
                min_threshold=1,
                supplier="Fanuc Robotics North America"
            ),
            SparePartInventory(
                sku="ENC-OPT-RES",
                name="Optical Rotary Encoder 1024 PPR Heavy Duty",
                category="Sensors",
                compatible_machine_id="ROBOT_09",
                warehouse_bin="BIN-E-03-05",
                stock_count=5,
                reserved_count=0,
                unit_cost=420.0,
                lead_time="4 days",
                min_threshold=2,
                supplier="Heidenhain Automation"
            ),
            SparePartInventory(
                sku="BLT-HTD-8M",
                name="Synchronous Timing Belt 8M-50 Neoprene",
                category="Transmission",
                compatible_machine_id="PACK_01",
                warehouse_bin="BIN-C-09-11",
                stock_count=18,
                reserved_count=0,
                unit_cost=85.0,
                lead_time="1 day",
                min_threshold=4,
                supplier="Gates Power Transmission"
            ),
            SparePartInventory(
                sku="HEAT-CART-800",
                name="Industrial Cartridge Heater 800W 240V",
                category="Heating",
                compatible_machine_id="PACK_01",
                warehouse_bin="BIN-C-02-08",
                stock_count=22,
                reserved_count=0,
                unit_cost=65.0,
                lead_time="1 day",
                min_threshold=5,
                supplier="Watlow Electric Manufacturing"
            ),
            SparePartInventory(
                sku="LUB-SYN-ISO68",
                name="Mobil SHC 626 Synthetic Spindle Lubricant 20L",
                category="Lubrication",
                compatible_machine_id="CNC_04",
                warehouse_bin="BIN-D-08-01",
                stock_count=12,
                reserved_count=0,
                unit_cost=210.0,
                lead_time="2 days",
                min_threshold=3,
                supplier="ExxonMobil Industrial"
            )
        ]
        for p in parts:
            session.add(p)

        # -----------------------------------------------------------------
        # 3. Historical CMMS Work Orders (8 Records)
        # -----------------------------------------------------------------
        now = datetime.now(timezone.utc)
        work_orders = [
            WorkOrderHistory(
                id="WO-2024-8812",
                machine_id="CNC_04",
                title="Spindle bearing early fatigue replacement",
                symptom="Vibration exceeded 3.8 mm/s with high pitch whine at 8000 RPM",
                root_cause="Inner race micro-spalling on spindle bearing 6205 due to coolant contamination",
                resolution="Flushed spindle quill, replaced bearing BRG-6205-2RS, re-torqued preload",
                technician_name="Marcus Vance (Senior Millwright)",
                duration_hours=2.5,
                cost_total=10645.0,
                part_sku_used="BRG-6205-2RS",
                created_at=now - timedelta(days=120),
                completed_at=now - timedelta(days=120) + timedelta(hours=2.5)
            ),
            WorkOrderHistory(
                id="WO-2024-9104",
                machine_id="CNC_04",
                title="Spindle chiller fluid flush & thermocouple check",
                symptom="Thermal rise above 55C after 40 min rough milling cycle",
                root_cause="Particulate buildup in heat exchanger bypass valve",
                resolution="Flushed chiller loop with solvent and replenished synthetic lubricant",
                technician_name="Elena Rostova",
                duration_hours=1.8,
                cost_total=7770.0,
                part_sku_used="LUB-SYN-ISO68",
                created_at=now - timedelta(days=75),
                completed_at=now - timedelta(days=75) + timedelta(hours=2)
            ),
            WorkOrderHistory(
                id="WO-2024-9240",
                machine_id="PRESS_02",
                title="Main cylinder piston seal rebuild",
                symptom="Pressure drop of 14 bar during bottom dead center dwell",
                root_cause="Viton seal extrusion failure caused by thermal cycling",
                resolution="Extracted ram piston, fitted new seal kit SEAL-VIT-45, pressure tested to 350 bar",
                technician_name="Karl Schmidt (Master Hydraulic Tech)",
                duration_hours=3.5,
                cost_total=30070.0,
                part_sku_used="SEAL-VIT-45",
                created_at=now - timedelta(days=60),
                completed_at=now - timedelta(days=60) + timedelta(hours=3.5)
            ),
            WorkOrderHistory(
                id="WO-2024-9411",
                machine_id="PRESS_02",
                title="Proportional valve spool stickiness inspection",
                symptom="Erratic ram descent speed and intermittent jerkiness",
                root_cause="Silting in proportional spool sleeve due to aged filter cartridge",
                resolution="Replaced 10-micron filter element and calibrated spool feedback LVDT",
                technician_name="Karl Schmidt",
                duration_hours=2.0,
                cost_total=17115.0,
                part_sku_used="FLT-HYD-10MIC",
                created_at=now - timedelta(days=32),
                completed_at=now - timedelta(days=32) + timedelta(hours=2)
            ),
            WorkOrderHistory(
                id="WO-2024-9550",
                machine_id="ROBOT_09",
                title="J2 axis servo current surge diagnostic",
                symptom="Overcurrent trip during rapid traverse in weld cell",
                root_cause="Harmonic reducer grease dry-out causing excessive back-EMF",
                resolution="Degreased reducer cavity, re-packed with Molykote, recalibrated zero master",
                technician_name="Devin Chen (Robotics Specialist)",
                duration_hours=1.5,
                cost_total=4860.0,
                part_sku_used="ENC-OPT-RES",
                created_at=now - timedelta(days=45),
                completed_at=now - timedelta(days=45) + timedelta(hours=1.5)
            ),
            WorkOrderHistory(
                id="WO-2024-9780",
                machine_id="ROBOT_09",
                title="Wrist cable harness continuity inspection",
                symptom="Intermittent encoder pulse drop on J5 axis rotation",
                root_cause="Flex fatigue strain on internal sensor loom",
                resolution="Replaced internal dress pack and adjusted spring retractor tension",
                technician_name="Devin Chen",
                duration_hours=2.2,
                cost_total=7240.0,
                part_sku_used="SRV-DRV-FAN",
                created_at=now - timedelta(days=18),
                completed_at=now - timedelta(days=18) + timedelta(hours=2.2)
            ),
            WorkOrderHistory(
                id="WO-2024-9892",
                machine_id="PACK_01",
                title="Sealer jaw timing belt tension adjustment",
                symptom="Wrapper foil crimp misregistration at 220 packs/min",
                root_cause="Belt tooth wear and 4mm slack stretch on timing belt",
                resolution="Installed replacement 8M-50 timing belt and set sonic tension meter to 140Hz",
                technician_name="Sarah Jenkins",
                duration_hours=1.2,
                cost_total=2965.0,
                part_sku_used="BLT-HTD-8M",
                created_at=now - timedelta(days=22),
                completed_at=now - timedelta(days=22) + timedelta(hours=1.2)
            ),
            WorkOrderHistory(
                id="WO-2024-9988",
                machine_id="PACK_01",
                title="End-seal jaw cartridge heater replacement",
                symptom="Temperature oscillation +- 18C resulting in unsealed seams",
                root_cause="Internal resistance coil oxidation in 800W heater element",
                resolution="Extracted blown cartridge, inserted HEAT-CART-800, verified PID auto-tune",
                technician_name="Sarah Jenkins",
                duration_hours=1.0,
                cost_total=2465.0,
                part_sku_used="HEAT-CART-800",
                created_at=now - timedelta(days=9),
                completed_at=now - timedelta(days=9) + timedelta(hours=1.0)
            ),
        ]
        for wo in work_orders:
            session.add(wo)

        # -----------------------------------------------------------------
        # 4. OEM Manual Chunks (6 Knowledge Excerpts)
        # -----------------------------------------------------------------
        manuals = [
            OEMManualChunk(
                id="DOC-HAAS-01",
                machine_model="Haas VF-2",
                document_title="Haas VF-2 Series Maintenance & Spindle Manual",
                document_ref="MAN-HAAS-VF2-REV4",
                section_title="Section 4.3: High-Frequency Vibration in Spindle Bearings",
                page_number=84,
                keywords="vibration bearing spindle race spalling 6205 micro-inch noise harmonic",
                content_excerpt=(
                    "When spindle root-mean-square (RMS) vibration velocity exceeds 2.80 mm/s "
                    "at nominal RPM (>7,500 RPM), suspect inner or outer raceway fatigue in the front tandem angular "
                    "contact bearing assembly (SKU BRG-6205-2RS). Continued operation above 3.50 mm/s will cause "
                    "catastrophic seizure of the motorized cartridge spindle within 8 to 24 hours of operation, "
                    "costing upwards of $25,000 in secondary tooling and rotor collision damage. "
                    "Procedure: Quarantine spindle, verify quill runout (<0.005mm), replace bearing assembly, "
                    "and apply 4.2 Nm precision locknut torque."
                )
            ),
            OEMManualChunk(
                id="DOC-HAAS-02",
                machine_model="Haas VF-2",
                document_title="Haas VF-2 Series Maintenance & Spindle Manual",
                document_ref="MAN-HAAS-VF2-REV4",
                section_title="Section 5.1: Spindle Temperature Thresholds & Chiller Diagnostics",
                page_number=112,
                keywords="spindle temp thermal runaway chiller coolant lubrication overheating",
                content_excerpt=(
                    "Normal operational spindle casing temperature must not exceed 52.0°C during continuous heavy cuts. "
                    "If temperature climbs with positive rate-of-change greater than 0.8°C/min while vibration remains "
                    "under 2.0 mm/s, check for chiller loop stagnation or degraded synthetic lubricant (LUB-SYN-ISO68). "
                    "Immediate shutdown is mandated if casing reaches 65.0°C to preserve ceramic balls and bearing seals."
                )
            ),
            OEMManualChunk(
                id="DOC-SCHULER-01",
                machine_model="Schuler 500T",
                document_title="Schuler 500T Hydraulic Stamping Press Service Architecture",
                document_ref="MAN-SCHULER-500T-SYS",
                section_title="Section 8.2: Pressure Drop Anomalies & Proportional Valve Faults",
                page_number=147,
                keywords="hydraulic pressure valve proportional spool cavitation flow drop",
                content_excerpt=(
                    "Proportional valve D1FB regulates high-speed closing velocity and tonnage dwell. "
                    "Telemetry exhibiting current draw variations exceeding 15% combined with pressure oscillation "
                    "indicates spool silting or coil thermal degradation. Replace valve SKU VALV-PROP-D1F or swap "
                    "upstream 10-micron filter element (FLT-HYD-10MIC) to prevent main cylinder pressure lockup."
                )
            ),
            OEMManualChunk(
                id="DOC-SCHULER-02",
                machine_model="Schuler 500T",
                document_title="Schuler 500T Hydraulic Stamping Press Service Architecture",
                document_ref="MAN-SCHULER-500T-SYS",
                section_title="Section 9.4: Cylinder Fluid Blow-by & Seal Replacement",
                page_number=182,
                keywords="seal cylinder blow-by leakage viton pressure loss o-ring rebuild",
                content_excerpt=(
                    "Fluid blow-by past the main 500-ton ram results in slow tonnage build and elevated return line temperatures. "
                    "Seal pack wear is accelerated by thermal oxidation above 60°C. When bypass volume exceeds 2.5 L/min, "
                    "schedule immediate replacement with high-temp Viton seal kit (SEAL-VIT-45). Unplanned failure "
                    "risks cylinder wall scoring with replacement costs exceeding $60,000."
                )
            ),
            OEMManualChunk(
                id="DOC-FANUC-01",
                machine_model="Fanuc M-20iA",
                document_title="Fanuc M-20iA Robot Mechanical Unit Maintenance",
                document_ref="MAN-FANUC-M20IA-MAINT",
                section_title="Section 3.6: Motor Overcurrent & Harmonic Drive Backlash",
                page_number=63,
                keywords="robot servo motor overcurrent harmonic drive backlash jitter encoder",
                content_excerpt=(
                    "Uncharacteristic motor current surges on axes J1-J3 exceeding 14.5 Amps during standard tool paths "
                    "point to either mechanical harmonic drive bind or encoder feedback jitter. Inspect optical encoder "
                    "coupling (ENC-OPT-RES). If torque ripple persists, check servo amplifier output (SRV-DRV-FAN) "
                    "for phase current imbalance."
                )
            ),
            OEMManualChunk(
                id="DOC-BOSCH-01",
                machine_model="Bosch Wrapper",
                document_title="Bosch High-Speed Flow Wrapper Technical Service Manual",
                document_ref="MAN-BOSCH-WRAP-2023",
                section_title="Section 6.2: Belt Slip, Synchronous Jitter & Sealer Drift",
                page_number=95,
                keywords="wrapper timing belt slip crimper temperature tension vibration",
                content_excerpt=(
                    "Film feed sync relies on synchronous belt 8M-50. Sensor vibration spikes in the 400-600Hz harmonic band "
                    "indicate tooth profile deformation or under-tensioning. Replace belt (BLT-HTD-8M) and recalibrate "
                    "crimper seal velocity profile to prevent foil tearing at line speeds above 200 units/min."
                )
            ),
        ]
        for m in manuals:
            session.add(m)

        session.commit()
        logger.info("Successfully seeded 4 Assets, 10 Spare Parts, 8 Work Orders, and 6 OEM Manuals!")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    from app.database import init_db
    init_db()
    seed_database()
