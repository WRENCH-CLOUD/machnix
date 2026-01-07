-- Seed data for vehicle categories, makes, and models
-- This adds demo data for common car manufacturers and their popular models
-- Run with: npx supabase db seed OR psql -f supabase/seed.sql

-- ============================================================================
-- VEHICLE CATEGORIES
-- ============================================================================
INSERT INTO public.vehicle_category (name, description) VALUES
    ('Sedan', 'Four-door passenger car with a separate trunk'),
    ('SUV', 'Sport Utility Vehicle - higher ground clearance and cargo space'),
    ('Truck', 'Light-duty pickup trucks'),
    ('Hatchback', 'Compact car with a rear door that swings upward'),
    ('Minivan', 'Multi-purpose vehicle designed for transporting passengers'),
    ('Sports Car', 'High performance vehicle designed for speed and agility'),
    ('Hybrid', 'Vehicles with both electric and combustion engines'),
    ('Electric', 'Battery Electric Vehicles (BEV)'),
    ('Van', 'Cargo or passenger vans'),
    ('Coupe', 'Two-door car with a fixed roof'),
    ('Convertible', 'Car with a retractable roof'),
    ('Wagon', 'Station wagon with extended cargo area')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- VEHICLE MAKES
-- ============================================================================
INSERT INTO public.vehicle_make (name, code) VALUES
    ('Toyota', 'TOY'),
    ('Honda', 'HON'),
    ('Ford', 'FOR'),
    ('Chevrolet', 'CHV'),
    ('BMW', 'BMW'),
    ('Mercedes-Benz', 'MER'),
    ('Audi', 'AUD'),
    ('Volkswagen', 'VW'),
    ('Nissan', 'NIS'),
    ('Hyundai', 'HYU'),
    ('Kia', 'KIA'),
    ('Mazda', 'MAZ'),
    ('Subaru', 'SUB'),
    ('Tesla', 'TES'),
    ('Jeep', 'JEP'),
    ('Ram', 'RAM'),
    ('Dodge', 'DOD'),
    ('Lexus', 'LEX'),
    ('Acura', 'ACU'),
    ('Infiniti', 'INF'),
    ('Volvo', 'VOL'),
    ('Porsche', 'POR'),
    ('Land Rover', 'LR'),
    ('Jaguar', 'JAG'),
    ('Mini', 'MINI'),
    ('Fiat', 'FIA'),
    ('Alfa Romeo', 'ALF'),
    ('Maserati', 'MAS'),
    ('Ferrari', 'FER'),
    ('Lamborghini', 'LAM'),
    -- Indian Brands
    ('Maruti Suzuki', 'MAR'),
    ('Tata', 'TAT'),
    ('Mahindra', 'MAH'),
    ('MG Motor', 'MG'),
    ('Skoda', 'SKO'),
    ('Renault', 'REN'),
    ('Citroen', 'CIT')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- VEHICLE MODELS
-- We use a DO block to look up IDs dynamically
-- ============================================================================
DO $$
DECLARE
    -- Make IDs
    toyota_id uuid;
    honda_id uuid;
    ford_id uuid;
    chevrolet_id uuid;
    bmw_id uuid;
    mercedes_id uuid;
    audi_id uuid;
    vw_id uuid;
    nissan_id uuid;
    hyundai_id uuid;
    kia_id uuid;
    mazda_id uuid;
    subaru_id uuid;
    tesla_id uuid;
    jeep_id uuid;
    ram_id uuid;
    dodge_id uuid;
    lexus_id uuid;
    acura_id uuid;
    infiniti_id uuid;
    volvo_id uuid;
    porsche_id uuid;
    landrover_id uuid;
    jaguar_id uuid;
    mini_id uuid;
    maruti_id uuid;
    tata_id uuid;
    mahindra_id uuid;
    mg_id uuid;
    skoda_id uuid;
    renault_id uuid;
    
    -- Category IDs
    sedan_id uuid;
    suv_id uuid;
    truck_id uuid;
    hatchback_id uuid;
    minivan_id uuid;
    sports_id uuid;
    hybrid_id uuid;
    electric_id uuid;
    van_id uuid;
BEGIN
    -- Get category IDs
    SELECT id INTO sedan_id FROM public.vehicle_category WHERE name = 'Sedan';
    SELECT id INTO suv_id FROM public.vehicle_category WHERE name = 'SUV';
    SELECT id INTO truck_id FROM public.vehicle_category WHERE name = 'Truck';
    SELECT id INTO hatchback_id FROM public.vehicle_category WHERE name = 'Hatchback';
    SELECT id INTO minivan_id FROM public.vehicle_category WHERE name = 'Minivan';
    SELECT id INTO sports_id FROM public.vehicle_category WHERE name = 'Sports Car';
    SELECT id INTO hybrid_id FROM public.vehicle_category WHERE name = 'Hybrid';
    SELECT id INTO electric_id FROM public.vehicle_category WHERE name = 'Electric';
    SELECT id INTO van_id FROM public.vehicle_category WHERE name = 'Van';

    -- Get make IDs
    SELECT id INTO toyota_id FROM public.vehicle_make WHERE name = 'Toyota';
    SELECT id INTO honda_id FROM public.vehicle_make WHERE name = 'Honda';
    SELECT id INTO ford_id FROM public.vehicle_make WHERE name = 'Ford';
    SELECT id INTO chevrolet_id FROM public.vehicle_make WHERE name = 'Chevrolet';
    SELECT id INTO bmw_id FROM public.vehicle_make WHERE name = 'BMW';
    SELECT id INTO mercedes_id FROM public.vehicle_make WHERE name = 'Mercedes-Benz';
    SELECT id INTO audi_id FROM public.vehicle_make WHERE name = 'Audi';
    SELECT id INTO vw_id FROM public.vehicle_make WHERE name = 'Volkswagen';
    SELECT id INTO nissan_id FROM public.vehicle_make WHERE name = 'Nissan';
    SELECT id INTO hyundai_id FROM public.vehicle_make WHERE name = 'Hyundai';
    SELECT id INTO kia_id FROM public.vehicle_make WHERE name = 'Kia';
    SELECT id INTO mazda_id FROM public.vehicle_make WHERE name = 'Mazda';
    SELECT id INTO subaru_id FROM public.vehicle_make WHERE name = 'Subaru';
    SELECT id INTO tesla_id FROM public.vehicle_make WHERE name = 'Tesla';
    SELECT id INTO jeep_id FROM public.vehicle_make WHERE name = 'Jeep';
    SELECT id INTO ram_id FROM public.vehicle_make WHERE name = 'Ram';
    SELECT id INTO dodge_id FROM public.vehicle_make WHERE name = 'Dodge';
    SELECT id INTO lexus_id FROM public.vehicle_make WHERE name = 'Lexus';
    SELECT id INTO acura_id FROM public.vehicle_make WHERE name = 'Acura';
    SELECT id INTO infiniti_id FROM public.vehicle_make WHERE name = 'Infiniti';
    SELECT id INTO volvo_id FROM public.vehicle_make WHERE name = 'Volvo';
    SELECT id INTO porsche_id FROM public.vehicle_make WHERE name = 'Porsche';
    SELECT id INTO landrover_id FROM public.vehicle_make WHERE name = 'Land Rover';
    SELECT id INTO jaguar_id FROM public.vehicle_make WHERE name = 'Jaguar';
    SELECT id INTO mini_id FROM public.vehicle_make WHERE name = 'Mini';
    SELECT id INTO maruti_id FROM public.vehicle_make WHERE name = 'Maruti Suzuki';
    SELECT id INTO tata_id FROM public.vehicle_make WHERE name = 'Tata';
    SELECT id INTO mahindra_id FROM public.vehicle_make WHERE name = 'Mahindra';
    SELECT id INTO mg_id FROM public.vehicle_make WHERE name = 'MG Motor';
    SELECT id INTO skoda_id FROM public.vehicle_make WHERE name = 'Skoda';
    SELECT id INTO renault_id FROM public.vehicle_make WHERE name = 'Renault';

    -- ========================================================================
    -- Toyota Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (toyota_id, 'Camry', 'CAM', sedan_id),
        (toyota_id, 'Corolla', 'COR', sedan_id),
        (toyota_id, 'RAV4', 'RAV4', suv_id),
        (toyota_id, 'Highlander', 'HIGH', suv_id),
        (toyota_id, '4Runner', '4RUN', suv_id),
        (toyota_id, 'Tacoma', 'TAC', truck_id),
        (toyota_id, 'Tundra', 'TUN', truck_id),
        (toyota_id, 'Prius', 'PRI', hybrid_id),
        (toyota_id, 'Sienna', 'SIE', minivan_id),
        (toyota_id, 'Avalon', 'AVA', sedan_id),
        (toyota_id, 'Supra', 'SUP', sports_id),
        (toyota_id, 'GR86', 'GR86', sports_id),
        (toyota_id, 'Fortuner', 'FORT', suv_id),
        (toyota_id, 'Innova Crysta', 'INN', minivan_id),
        (toyota_id, 'Glanza', 'GLA', hatchback_id),
        (toyota_id, 'Urban Cruiser', 'UC', suv_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Honda Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (honda_id, 'Accord', 'ACC', sedan_id),
        (honda_id, 'Civic', 'CIV', sedan_id),
        (honda_id, 'CR-V', 'CRV', suv_id),
        (honda_id, 'Pilot', 'PIL', suv_id),
        (honda_id, 'Odyssey', 'ODY', minivan_id),
        (honda_id, 'Ridgeline', 'RID', truck_id),
        (honda_id, 'HR-V', 'HRV', suv_id),
        (honda_id, 'Passport', 'PAS', suv_id),
        (honda_id, 'City', 'CITY', sedan_id),
        (honda_id, 'Amaze', 'AMZ', sedan_id),
        (honda_id, 'Elevate', 'ELV', suv_id),
        (honda_id, 'WR-V', 'WRV', suv_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Ford Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (ford_id, 'F-150', 'F150', truck_id),
        (ford_id, 'Mustang', 'MUS', sports_id),
        (ford_id, 'Explorer', 'EXP', suv_id),
        (ford_id, 'Escape', 'ESC', suv_id),
        (ford_id, 'Edge', 'EDG', suv_id),
        (ford_id, 'Expedition', 'EXPE', suv_id),
        (ford_id, 'Bronco', 'BRO', suv_id),
        (ford_id, 'Ranger', 'RAN', truck_id),
        (ford_id, 'Maverick', 'MAV', truck_id),
        (ford_id, 'Transit', 'TRA', van_id),
        (ford_id, 'Endeavour', 'END', suv_id),
        (ford_id, 'EcoSport', 'ECO', suv_id),
        (ford_id, 'Figo', 'FIG', hatchback_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Chevrolet Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (chevrolet_id, 'Silverado', 'SIL', truck_id),
        (chevrolet_id, 'Tahoe', 'TAH', suv_id),
        (chevrolet_id, 'Suburban', 'SUBR', suv_id),
        (chevrolet_id, 'Equinox', 'EQU', suv_id),
        (chevrolet_id, 'Traverse', 'TRAV', suv_id),
        (chevrolet_id, 'Malibu', 'MAL', sedan_id),
        (chevrolet_id, 'Camaro', 'CAMA', sports_id),
        (chevrolet_id, 'Corvette', 'CORV', sports_id),
        (chevrolet_id, 'Blazer', 'BLA', suv_id),
        (chevrolet_id, 'Colorado', 'COL', truck_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- BMW Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (bmw_id, '3 Series', '3SER', sedan_id),
        (bmw_id, '5 Series', '5SER', sedan_id),
        (bmw_id, '7 Series', '7SER', sedan_id),
        (bmw_id, 'X1', 'X1', suv_id),
        (bmw_id, 'X3', 'X3', suv_id),
        (bmw_id, 'X5', 'X5', suv_id),
        (bmw_id, 'X7', 'X7', suv_id),
        (bmw_id, 'M3', 'M3', sports_id),
        (bmw_id, 'M5', 'M5', sports_id),
        (bmw_id, 'i4', 'I4', electric_id),
        (bmw_id, 'iX', 'IX', electric_id),
        (bmw_id, '2 Series Gran Coupe', '2GC', sedan_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Mercedes-Benz Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (mercedes_id, 'C-Class', 'C-CL', sedan_id),
        (mercedes_id, 'E-Class', 'E-CL', sedan_id),
        (mercedes_id, 'S-Class', 'S-CL', sedan_id),
        (mercedes_id, 'A-Class', 'A-CL', sedan_id),
        (mercedes_id, 'GLA', 'GLA', suv_id),
        (mercedes_id, 'GLC', 'GLC', suv_id),
        (mercedes_id, 'GLE', 'GLE', suv_id),
        (mercedes_id, 'GLS', 'GLS', suv_id),
        (mercedes_id, 'G-Class', 'G-CL', suv_id),
        (mercedes_id, 'EQS', 'EQS', electric_id),
        (mercedes_id, 'EQE', 'EQE', electric_id),
        (mercedes_id, 'AMG GT', 'AMGT', sports_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Audi Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (audi_id, 'A3', 'A3', sedan_id),
        (audi_id, 'A4', 'A4', sedan_id),
        (audi_id, 'A6', 'A6', sedan_id),
        (audi_id, 'A8', 'A8', sedan_id),
        (audi_id, 'Q3', 'Q3', suv_id),
        (audi_id, 'Q5', 'Q5', suv_id),
        (audi_id, 'Q7', 'Q7', suv_id),
        (audi_id, 'Q8', 'Q8', suv_id),
        (audi_id, 'e-tron', 'ETR', electric_id),
        (audi_id, 'R8', 'R8', sports_id),
        (audi_id, 'TT', 'TT', sports_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Volkswagen Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (vw_id, 'Polo', 'POL', hatchback_id),
        (vw_id, 'Virtus', 'VIR', sedan_id),
        (vw_id, 'Taigun', 'TAI', suv_id),
        (vw_id, 'Tiguan', 'TIG', suv_id),
        (vw_id, 'Jetta', 'JET', sedan_id),
        (vw_id, 'Passat', 'PAS', sedan_id),
        (vw_id, 'Atlas', 'ATL', suv_id),
        (vw_id, 'Golf', 'GOL', hatchback_id),
        (vw_id, 'ID.4', 'ID4', electric_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Hyundai Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (hyundai_id, 'i10', 'I10', hatchback_id),
        (hyundai_id, 'i20', 'I20', hatchback_id),
        (hyundai_id, 'Grand i10 Nios', 'GI10', hatchback_id),
        (hyundai_id, 'Aura', 'AUR', sedan_id),
        (hyundai_id, 'Verna', 'VER', sedan_id),
        (hyundai_id, 'Elantra', 'ELA', sedan_id),
        (hyundai_id, 'Venue', 'VEN', suv_id),
        (hyundai_id, 'Creta', 'CRE', suv_id),
        (hyundai_id, 'Alcazar', 'ALC', suv_id),
        (hyundai_id, 'Tucson', 'TUC', suv_id),
        (hyundai_id, 'Kona Electric', 'KONE', electric_id),
        (hyundai_id, 'Ioniq 5', 'ION5', electric_id),
        (hyundai_id, 'Ioniq 6', 'ION6', electric_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Kia Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (kia_id, 'Seltos', 'SEL', suv_id),
        (kia_id, 'Sonet', 'SON', suv_id),
        (kia_id, 'Carens', 'CAR', minivan_id),
        (kia_id, 'Carnival', 'CARN', minivan_id),
        (kia_id, 'EV6', 'EV6', electric_id),
        (kia_id, 'Sportage', 'SPO', suv_id),
        (kia_id, 'Sorento', 'SOR', suv_id),
        (kia_id, 'Telluride', 'TEL', suv_id),
        (kia_id, 'K5', 'K5', sedan_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Maruti Suzuki Models (India-specific)
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (maruti_id, 'Alto', 'ALT', hatchback_id),
        (maruti_id, 'Alto K10', 'ALTK', hatchback_id),
        (maruti_id, 'S-Presso', 'SPR', hatchback_id),
        (maruti_id, 'Celerio', 'CEL', hatchback_id),
        (maruti_id, 'WagonR', 'WAG', hatchback_id),
        (maruti_id, 'Swift', 'SWI', hatchback_id),
        (maruti_id, 'Baleno', 'BAL', hatchback_id),
        (maruti_id, 'Dzire', 'DZI', sedan_id),
        (maruti_id, 'Ciaz', 'CIZ', sedan_id),
        (maruti_id, 'Brezza', 'BRZ', suv_id),
        (maruti_id, 'Grand Vitara', 'GV', suv_id),
        (maruti_id, 'Fronx', 'FRO', suv_id),
        (maruti_id, 'Jimny', 'JIM', suv_id),
        (maruti_id, 'Ertiga', 'ERT', minivan_id),
        (maruti_id, 'XL6', 'XL6', minivan_id),
        (maruti_id, 'Invicto', 'INV', minivan_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Tata Motors Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (tata_id, 'Tiago', 'TIA', hatchback_id),
        (tata_id, 'Altroz', 'ALT', hatchback_id),
        (tata_id, 'Punch', 'PUN', suv_id),
        (tata_id, 'Nexon', 'NEX', suv_id),
        (tata_id, 'Nexon EV', 'NEXE', electric_id),
        (tata_id, 'Harrier', 'HAR', suv_id),
        (tata_id, 'Safari', 'SAF', suv_id),
        (tata_id, 'Tigor', 'TIG', sedan_id),
        (tata_id, 'Tigor EV', 'TIGE', electric_id),
        (tata_id, 'Tiago EV', 'TIAE', electric_id),
        (tata_id, 'Curvv', 'CUR', suv_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Mahindra Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (mahindra_id, 'Thar', 'THA', suv_id),
        (mahindra_id, 'Scorpio-N', 'SCN', suv_id),
        (mahindra_id, 'Scorpio Classic', 'SCC', suv_id),
        (mahindra_id, 'XUV700', 'X700', suv_id),
        (mahindra_id, 'XUV400', 'X400', electric_id),
        (mahindra_id, 'XUV300', 'X300', suv_id),
        (mahindra_id, 'Bolero', 'BOL', suv_id),
        (mahindra_id, 'Bolero Neo', 'BOLN', suv_id),
        (mahindra_id, 'Marazzo', 'MAR', minivan_id),
        (mahindra_id, 'BE 6', 'BE6', electric_id),
        (mahindra_id, 'XEV 9e', 'XEV9', electric_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- MG Motor Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (mg_id, 'Hector', 'HEC', suv_id),
        (mg_id, 'Hector Plus', 'HECP', suv_id),
        (mg_id, 'Astor', 'AST', suv_id),
        (mg_id, 'ZS EV', 'ZSEV', electric_id),
        (mg_id, 'Comet EV', 'COM', electric_id),
        (mg_id, 'Gloster', 'GLO', suv_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Skoda Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (skoda_id, 'Slavia', 'SLA', sedan_id),
        (skoda_id, 'Kushaq', 'KUS', suv_id),
        (skoda_id, 'Kodiaq', 'KOD', suv_id),
        (skoda_id, 'Superb', 'SUP', sedan_id),
        (skoda_id, 'Octavia', 'OCT', sedan_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Renault Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (renault_id, 'Kwid', 'KWI', hatchback_id),
        (renault_id, 'Triber', 'TRI', minivan_id),
        (renault_id, 'Kiger', 'KIG', suv_id),
        (renault_id, 'Duster', 'DUS', suv_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Tesla Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (tesla_id, 'Model 3', 'M3', electric_id),
        (tesla_id, 'Model Y', 'MY', electric_id),
        (tesla_id, 'Model S', 'MS', electric_id),
        (tesla_id, 'Model X', 'MX', electric_id),
        (tesla_id, 'Cybertruck', 'CYB', electric_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Jeep Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (jeep_id, 'Compass', 'COM', suv_id),
        (jeep_id, 'Meridian', 'MER', suv_id),
        (jeep_id, 'Wrangler', 'WRA', suv_id),
        (jeep_id, 'Grand Cherokee', 'GC', suv_id),
        (jeep_id, 'Gladiator', 'GLA', truck_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Lexus Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (lexus_id, 'ES', 'ES', sedan_id),
        (lexus_id, 'LS', 'LS', sedan_id),
        (lexus_id, 'NX', 'NX', suv_id),
        (lexus_id, 'RX', 'RX', suv_id),
        (lexus_id, 'LX', 'LX', suv_id),
        (lexus_id, 'LC', 'LC', sports_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Volvo Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (volvo_id, 'S60', 'S60', sedan_id),
        (volvo_id, 'S90', 'S90', sedan_id),
        (volvo_id, 'XC40', 'XC40', suv_id),
        (volvo_id, 'XC60', 'XC60', suv_id),
        (volvo_id, 'XC90', 'XC90', suv_id),
        (volvo_id, 'XC40 Recharge', 'XC40E', electric_id),
        (volvo_id, 'C40 Recharge', 'C40', electric_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Porsche Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (porsche_id, '911', '911', sports_id),
        (porsche_id, 'Cayenne', 'CAY', suv_id),
        (porsche_id, 'Macan', 'MAC', suv_id),
        (porsche_id, 'Panamera', 'PAN', sedan_id),
        (porsche_id, 'Taycan', 'TAY', electric_id),
        (porsche_id, '718 Cayman', '718C', sports_id),
        (porsche_id, '718 Boxster', '718B', sports_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Land Rover Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (landrover_id, 'Range Rover', 'RR', suv_id),
        (landrover_id, 'Range Rover Sport', 'RRS', suv_id),
        (landrover_id, 'Range Rover Evoque', 'RRE', suv_id),
        (landrover_id, 'Range Rover Velar', 'RRV', suv_id),
        (landrover_id, 'Defender', 'DEF', suv_id),
        (landrover_id, 'Discovery', 'DIS', suv_id),
        (landrover_id, 'Discovery Sport', 'DSP', suv_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Jaguar Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (jaguar_id, 'XE', 'XE', sedan_id),
        (jaguar_id, 'XF', 'XF', sedan_id),
        (jaguar_id, 'F-PACE', 'FP', suv_id),
        (jaguar_id, 'E-PACE', 'EP', suv_id),
        (jaguar_id, 'I-PACE', 'IP', electric_id),
        (jaguar_id, 'F-TYPE', 'FT', sports_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    -- ========================================================================
    -- Mini Models
    -- ========================================================================
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (mini_id, 'Cooper', 'COOP', hatchback_id),
        (mini_id, 'Cooper S', 'COOPS', hatchback_id),
        (mini_id, 'Countryman', 'COUN', suv_id),
        (mini_id, 'Clubman', 'CLUB', hatchback_id),
        (mini_id, 'Electric', 'ELEC', electric_id)
    ON CONFLICT (make_id, name) DO NOTHING;

    RAISE NOTICE 'Vehicle seed data inserted successfully!';
END $$;
