-- Seed data for vehicle makes and models
-- This adds demo data for common car manufacturers and their popular models

-- Insert vehicle makes
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
    ('Lamborghini', 'LAM')
ON CONFLICT (name) DO NOTHING;

-- Get make IDs for inserting models
DO $$
DECLARE
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
BEGIN
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

    -- Insert Toyota models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (toyota_id, 'Camry', 'CAM', 'Sedan'),
        (toyota_id, 'Corolla', 'COR', 'Sedan'),
        (toyota_id, 'RAV4', 'RAV4', 'SUV'),
        (toyota_id, 'Highlander', 'HIGH', 'SUV'),
        (toyota_id, '4Runner', '4RUN', 'SUV'),
        (toyota_id, 'Tacoma', 'TAC', 'Truck'),
        (toyota_id, 'Tundra', 'TUN', 'Truck'),
        (toyota_id, 'Prius', 'PRI', 'Hybrid'),
        (toyota_id, 'Sienna', 'SIE', 'Minivan'),
        (toyota_id, 'Avalon', 'AVA', 'Sedan'),
        (toyota_id, 'Supra', 'SUP', 'Sports Car'),
        (toyota_id, 'GR86', 'GR86', 'Sports Car')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Honda models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (honda_id, 'Accord', 'ACC', 'Sedan'),
        (honda_id, 'Civic', 'CIV', 'Sedan'),
        (honda_id, 'CR-V', 'CRV', 'SUV'),
        (honda_id, 'Pilot', 'PIL', 'SUV'),
        (honda_id, 'Odyssey', 'ODY', 'Minivan'),
        (honda_id, 'Ridgeline', 'RID', 'Truck'),
        (honda_id, 'HR-V', 'HRV', 'SUV'),
        (honda_id, 'Passport', 'PAS', 'SUV'),
        (honda_id, 'Insight', 'INS', 'Hybrid')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Ford models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (ford_id, 'F-150', 'F150', 'Truck'),
        (ford_id, 'Mustang', 'MUS', 'Sports Car'),
        (ford_id, 'Explorer', 'EXP', 'SUV'),
        (ford_id, 'Escape', 'ESC', 'SUV'),
        (ford_id, 'Edge', 'EDG', 'SUV'),
        (ford_id, 'Expedition', 'EXPE', 'SUV'),
        (ford_id, 'Bronco', 'BRO', 'SUV'),
        (ford_id, 'Ranger', 'RAN', 'Truck'),
        (ford_id, 'Maverick', 'MAV', 'Truck'),
        (ford_id, 'Transit', 'TRA', 'Van')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Chevrolet models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (chevrolet_id, 'Silverado', 'SIL', 'Truck'),
        (chevrolet_id, 'Tahoe', 'TAH', 'SUV'),
        (chevrolet_id, 'Suburban', 'SUB', 'SUV'),
        (chevrolet_id, 'Equinox', 'EQU', 'SUV'),
        (chevrolet_id, 'Traverse', 'TRA', 'SUV'),
        (chevrolet_id, 'Malibu', 'MAL', 'Sedan'),
        (chevrolet_id, 'Camaro', 'CAM', 'Sports Car'),
        (chevrolet_id, 'Corvette', 'COR', 'Sports Car'),
        (chevrolet_id, 'Blazer', 'BLA', 'SUV'),
        (chevrolet_id, 'Colorado', 'COL', 'Truck')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert BMW models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (bmw_id, '3 Series', '3SER', 'Sedan'),
        (bmw_id, '5 Series', '5SER', 'Sedan'),
        (bmw_id, '7 Series', '7SER', 'Sedan'),
        (bmw_id, 'X3', 'X3', 'SUV'),
        (bmw_id, 'X5', 'X5', 'SUV'),
        (bmw_id, 'X7', 'X7', 'SUV'),
        (bmw_id, 'M3', 'M3', 'Sports Car'),
        (bmw_id, 'M5', 'M5', 'Sports Car'),
        (bmw_id, 'i4', 'I4', 'Electric'),
        (bmw_id, 'iX', 'IX', 'Electric')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Mercedes-Benz models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (mercedes_id, 'C-Class', 'C-CL', 'Sedan'),
        (mercedes_id, 'E-Class', 'E-CL', 'Sedan'),
        (mercedes_id, 'S-Class', 'S-CL', 'Sedan'),
        (mercedes_id, 'GLE', 'GLE', 'SUV'),
        (mercedes_id, 'GLC', 'GLC', 'SUV'),
        (mercedes_id, 'GLS', 'GLS', 'SUV'),
        (mercedes_id, 'A-Class', 'A-CL', 'Sedan'),
        (mercedes_id, 'G-Class', 'G-CL', 'SUV'),
        (mercedes_id, 'EQS', 'EQS', 'Electric'),
        (mercedes_id, 'EQE', 'EQE', 'Electric')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Audi models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (audi_id, 'A4', 'A4', 'Sedan'),
        (audi_id, 'A6', 'A6', 'Sedan'),
        (audi_id, 'A8', 'A8', 'Sedan'),
        (audi_id, 'Q3', 'Q3', 'SUV'),
        (audi_id, 'Q5', 'Q5', 'SUV'),
        (audi_id, 'Q7', 'Q7', 'SUV'),
        (audi_id, 'Q8', 'Q8', 'SUV'),
        (audi_id, 'e-tron', 'ETR', 'Electric'),
        (audi_id, 'R8', 'R8', 'Sports Car'),
        (audi_id, 'TT', 'TT', 'Sports Car')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Volkswagen models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (vw_id, 'Jetta', 'JET', 'Sedan'),
        (vw_id, 'Passat', 'PAS', 'Sedan'),
        (vw_id, 'Tiguan', 'TIG', 'SUV'),
        (vw_id, 'Atlas', 'ATL', 'SUV'),
        (vw_id, 'Golf', 'GOL', 'Hatchback'),
        (vw_id, 'ID.4', 'ID4', 'Electric'),
        (vw_id, 'Arteon', 'ART', 'Sedan'),
        (vw_id, 'Taos', 'TAO', 'SUV')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Nissan models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (nissan_id, 'Altima', 'ALT', 'Sedan'),
        (nissan_id, 'Maxima', 'MAX', 'Sedan'),
        (nissan_id, 'Rogue', 'ROG', 'SUV'),
        (nissan_id, 'Pathfinder', 'PATH', 'SUV'),
        (nissan_id, 'Armada', 'ARM', 'SUV'),
        (nissan_id, 'Frontier', 'FRO', 'Truck'),
        (nissan_id, 'Titan', 'TIT', 'Truck'),
        (nissan_id, 'Sentra', 'SEN', 'Sedan'),
        (nissan_id, 'Kicks', 'KIC', 'SUV'),
        (nissan_id, 'Murano', 'MUR', 'SUV'),
        (nissan_id, 'Z', 'Z', 'Sports Car'),
        (nissan_id, 'GT-R', 'GTR', 'Sports Car')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Hyundai models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (hyundai_id, 'Elantra', 'ELA', 'Sedan'),
        (hyundai_id, 'Sonata', 'SON', 'Sedan'),
        (hyundai_id, 'Tucson', 'TUC', 'SUV'),
        (hyundai_id, 'Santa Fe', 'SAN', 'SUV'),
        (hyundai_id, 'Palisade', 'PAL', 'SUV'),
        (hyundai_id, 'Kona', 'KON', 'SUV'),
        (hyundai_id, 'Ioniq 5', 'ION5', 'Electric'),
        (hyundai_id, 'Ioniq 6', 'ION6', 'Electric'),
        (hyundai_id, 'Venue', 'VEN', 'SUV')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Kia models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (kia_id, 'Forte', 'FOR', 'Sedan'),
        (kia_id, 'K5', 'K5', 'Sedan'),
        (kia_id, 'Sportage', 'SPO', 'SUV'),
        (kia_id, 'Sorento', 'SOR', 'SUV'),
        (kia_id, 'Telluride', 'TEL', 'SUV'),
        (kia_id, 'Soul', 'SOU', 'SUV'),
        (kia_id, 'Seltos', 'SEL', 'SUV'),
        (kia_id, 'EV6', 'EV6', 'Electric'),
        (kia_id, 'Carnival', 'CAR', 'Minivan'),
        (kia_id, 'Stinger', 'STI', 'Sports Car')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Mazda models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (mazda_id, 'Mazda3', 'MAZ3', 'Sedan'),
        (mazda_id, 'Mazda6', 'MAZ6', 'Sedan'),
        (mazda_id, 'CX-5', 'CX5', 'SUV'),
        (mazda_id, 'CX-9', 'CX9', 'SUV'),
        (mazda_id, 'CX-30', 'CX30', 'SUV'),
        (mazda_id, 'CX-50', 'CX50', 'SUV'),
        (mazda_id, 'MX-5 Miata', 'MX5', 'Sports Car')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Subaru models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (subaru_id, 'Outback', 'OUT', 'SUV'),
        (subaru_id, 'Forester', 'FOR', 'SUV'),
        (subaru_id, 'Ascent', 'ASC', 'SUV'),
        (subaru_id, 'Crosstrek', 'CRO', 'SUV'),
        (subaru_id, 'Legacy', 'LEG', 'Sedan'),
        (subaru_id, 'Impreza', 'IMP', 'Sedan'),
        (subaru_id, 'WRX', 'WRX', 'Sports Car'),
        (subaru_id, 'BRZ', 'BRZ', 'Sports Car')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Tesla models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (tesla_id, 'Model 3', 'M3', 'Electric'),
        (tesla_id, 'Model Y', 'MY', 'Electric'),
        (tesla_id, 'Model S', 'MS', 'Electric'),
        (tesla_id, 'Model X', 'MX', 'Electric'),
        (tesla_id, 'Cybertruck', 'CYB', 'Electric')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Jeep models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (jeep_id, 'Wrangler', 'WRA', 'SUV'),
        (jeep_id, 'Grand Cherokee', 'GC', 'SUV'),
        (jeep_id, 'Cherokee', 'CHE', 'SUV'),
        (jeep_id, 'Compass', 'COM', 'SUV'),
        (jeep_id, 'Renegade', 'REN', 'SUV'),
        (jeep_id, 'Gladiator', 'GLA', 'Truck'),
        (jeep_id, 'Grand Wagoneer', 'GW', 'SUV')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Ram models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (ram_id, '1500', 'R1500', 'Truck'),
        (ram_id, '2500', 'R2500', 'Truck'),
        (ram_id, '3500', 'R3500', 'Truck'),
        (ram_id, 'ProMaster', 'PRO', 'Van')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Dodge models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (dodge_id, 'Challenger', 'CHA', 'Sports Car'),
        (dodge_id, 'Charger', 'CHG', 'Sedan'),
        (dodge_id, 'Durango', 'DUR', 'SUV')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Lexus models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (lexus_id, 'ES', 'ES', 'Sedan'),
        (lexus_id, 'IS', 'IS', 'Sedan'),
        (lexus_id, 'LS', 'LS', 'Sedan'),
        (lexus_id, 'RX', 'RX', 'SUV'),
        (lexus_id, 'NX', 'NX', 'SUV'),
        (lexus_id, 'GX', 'GX', 'SUV'),
        (lexus_id, 'LX', 'LX', 'SUV'),
        (lexus_id, 'UX', 'UX', 'SUV'),
        (lexus_id, 'LC', 'LC', 'Sports Car')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Acura models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (acura_id, 'Integra', 'INT', 'Sedan'),
        (acura_id, 'TLX', 'TLX', 'Sedan'),
        (acura_id, 'MDX', 'MDX', 'SUV'),
        (acura_id, 'RDX', 'RDX', 'SUV'),
        (acura_id, 'NSX', 'NSX', 'Sports Car')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Infiniti models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (infiniti_id, 'Q50', 'Q50', 'Sedan'),
        (infiniti_id, 'Q60', 'Q60', 'Sports Car'),
        (infiniti_id, 'QX50', 'QX50', 'SUV'),
        (infiniti_id, 'QX60', 'QX60', 'SUV'),
        (infiniti_id, 'QX80', 'QX80', 'SUV')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Volvo models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (volvo_id, 'S60', 'S60', 'Sedan'),
        (volvo_id, 'S90', 'S90', 'Sedan'),
        (volvo_id, 'XC40', 'XC40', 'SUV'),
        (volvo_id, 'XC60', 'XC60', 'SUV'),
        (volvo_id, 'XC90', 'XC90', 'SUV'),
        (volvo_id, 'C40 Recharge', 'C40', 'Electric')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Porsche models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (porsche_id, '911', '911', 'Sports Car'),
        (porsche_id, 'Cayenne', 'CAY', 'SUV'),
        (porsche_id, 'Macan', 'MAC', 'SUV'),
        (porsche_id, 'Panamera', 'PAN', 'Sedan'),
        (porsche_id, 'Taycan', 'TAY', 'Electric'),
        (porsche_id, '718 Cayman', '718C', 'Sports Car'),
        (porsche_id, '718 Boxster', '718B', 'Sports Car')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Land Rover models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (landrover_id, 'Range Rover', 'RR', 'SUV'),
        (landrover_id, 'Range Rover Sport', 'RRS', 'SUV'),
        (landrover_id, 'Range Rover Evoque', 'RRE', 'SUV'),
        (landrover_id, 'Range Rover Velar', 'RRV', 'SUV'),
        (landrover_id, 'Defender', 'DEF', 'SUV'),
        (landrover_id, 'Discovery', 'DIS', 'SUV')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Jaguar models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (jaguar_id, 'XE', 'XE', 'Sedan'),
        (jaguar_id, 'XF', 'XF', 'Sedan'),
        (jaguar_id, 'F-PACE', 'FP', 'SUV'),
        (jaguar_id, 'E-PACE', 'EP', 'SUV'),
        (jaguar_id, 'I-PACE', 'IP', 'Electric'),
        (jaguar_id, 'F-TYPE', 'FT', 'Sports Car')
    ON CONFLICT (make_id, name) DO NOTHING;

    -- Insert Mini models
    INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
        (mini_id, 'Cooper', 'COOP', 'Hatchback'),
        (mini_id, 'Cooper S', 'COOPS', 'Hatchback'),
        (mini_id, 'Countryman', 'COUN', 'SUV'),
        (mini_id, 'Clubman', 'CLUB', 'Hatchback'),
        (mini_id, 'Electric', 'ELEC', 'Electric')
    ON CONFLICT (make_id, name) DO NOTHING;

END $$;
