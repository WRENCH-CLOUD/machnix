-- Auto-generated seed file from CSV data
-- Generated at: 2026-01-20T06:51:00.739Z

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
    ('Wagon', 'Station wagon with extended cargo area'),
    ('Bike', 'Two-wheeled motor vehicle'),
    ('Scooter', 'Two-wheeled vehicle with a step-through frame')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- VEHICLE MAKES
-- ============================================================================
INSERT INTO public.vehicle_make (name, code) VALUES
    ('Tata', 'TAT'),
    ('Datsun', 'DAT'),
    ('Renault', 'REN'),
    ('Maruti Suzuki', 'MAR'),
    ('Hyundai', 'HYU'),
    ('Premier', 'PRE'),
    ('Toyota', 'TOY'),
    ('Nissan', 'NIS'),
    ('Volkswagen', 'VOL'),
    ('Ford', 'FOR'),
    ('Mahindra', 'MAH'),
    ('Fiat', 'FIA'),
    ('Honda', 'HON'),
    ('Jeep', 'JEE'),
    ('Isuzu', 'ISU'),
    ('Skoda', 'SKO'),
    ('Audi', 'AUD'),
    ('Dc', 'DC'),
    ('Mini', 'MIN'),
    ('Volvo', 'VOL'),
    ('Jaguar', 'JAG'),
    ('Bmw', 'BMW'),
    ('Land Rover', 'LAN'),
    ('Porsche', 'POR'),
    ('Lexus', 'LEX'),
    ('Maserati', 'MAS'),
    ('Lamborghini', 'LAM'),
    ('Bentley', 'BEN'),
    ('Ferrari', 'FER'),
    ('Aston Martin', 'AST'),
    ('Bugatti', 'BUG'),
    ('Bajaj', 'BAJ'),
    ('Icml', 'ICM'),
    ('Force', 'FOR'),
    ('Mg', 'MG'),
    ('Kia', 'KIA'),
    ('Land Rover Rover', 'LAN'),
    ('Mitsubishi', 'MIT'),
    ('Maruti Suzuki R', 'MAR'),
    ('Royal Enfield', 'ROY'),
    ('KTM', 'KTM'),
    ('Kawasaki', 'KAW'),
    ('Yamaha', 'YAM'),
    ('Hero', 'HER'),
    ('TVS', 'TVS')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- VEHICLE MODELS
-- ============================================================================
DO $$
DECLARE
    -- Category IDs
    cat_sedan uuid;
    cat_suv uuid;
    cat_truck uuid;
    cat_hatchback uuid;
    cat_minivan uuid;
    cat_sports uuid;
    cat_hybrid uuid;
    cat_electric uuid;
    cat_van uuid;
    cat_coupe uuid;
    cat_convertible uuid;
    cat_wagon uuid;
    cat_bike uuid;
    cat_scooter uuid;
    
    -- Make ID variable
    curr_make_id uuid;
BEGIN
    -- Get category IDs
    SELECT id INTO cat_sedan FROM public.vehicle_category WHERE name = 'Sedan';
    SELECT id INTO cat_suv FROM public.vehicle_category WHERE name = 'SUV';
    SELECT id INTO cat_truck FROM public.vehicle_category WHERE name = 'Truck';
    SELECT id INTO cat_hatchback FROM public.vehicle_category WHERE name = 'Hatchback';
    SELECT id INTO cat_minivan FROM public.vehicle_category WHERE name = 'Minivan';
    SELECT id INTO cat_sports FROM public.vehicle_category WHERE name = 'Sports Car';
    SELECT id INTO cat_hybrid FROM public.vehicle_category WHERE name = 'Hybrid';
    SELECT id INTO cat_electric FROM public.vehicle_category WHERE name = 'Electric';
    SELECT id INTO cat_van FROM public.vehicle_category WHERE name = 'Van';
    SELECT id INTO cat_coupe FROM public.vehicle_category WHERE name = 'Coupe';
    SELECT id INTO cat_convertible FROM public.vehicle_category WHERE name = 'Convertible';
    SELECT id INTO cat_wagon FROM public.vehicle_category WHERE name = 'Wagon';
    SELECT id INTO cat_bike FROM public.vehicle_category WHERE name = 'Bike';
    SELECT id INTO cat_scooter FROM public.vehicle_category WHERE name = 'Scooter';

    -- Tata
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Tata';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Nano Genx', 'NANO', cat_hatchback),
            (curr_make_id, 'Tiago', 'TIAG', cat_hatchback),
            (curr_make_id, 'Bolt', 'BOLT', cat_hatchback),
            (curr_make_id, 'Altroz', 'ALTR', cat_hatchback),
            (curr_make_id, 'Tigor', 'TIGO', cat_sedan),
            (curr_make_id, 'Zest', 'ZEST', cat_sedan),
            (curr_make_id, 'Nexon', 'NEXO', cat_suv),
            (curr_make_id, 'Tigor Ev', 'TIGO', cat_sedan),
            (curr_make_id, 'Hexa', 'HEXA', cat_suv),
            (curr_make_id, 'Safari Storme', 'SAFA', cat_suv),
            (curr_make_id, 'Nexon Ev', 'NEXO', cat_suv),
            (curr_make_id, 'Harrier', 'HARR', cat_suv),
            (curr_make_id, 'Tiago Nrg', 'TIAG', cat_sedan),
            (curr_make_id, 'Winger', 'WING', cat_minivan)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Datsun
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Datsun';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Redi-Go', 'REDI', cat_hatchback),
            (curr_make_id, 'Go', 'GO', cat_hatchback)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Renault
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Renault';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Kwid', 'KWID', cat_hatchback),
            (curr_make_id, 'Triber', 'TRIB', cat_minivan),
            (curr_make_id, 'Duster', 'DUST', cat_suv),
            (curr_make_id, 'Lodgy', 'LODG', cat_minivan),
            (curr_make_id, 'Captur', 'CAPT', cat_suv)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Maruti Suzuki
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Maruti Suzuki';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Eeco', 'EECO', cat_minivan),
            (curr_make_id, 'Alto K10', 'ALTO', cat_hatchback),
            (curr_make_id, 'Celerio Tour', 'CELE', cat_hatchback),
            (curr_make_id, 'Celerio X', 'CELE', cat_hatchback),
            (curr_make_id, 'Ignis', 'IGNI', cat_hatchback),
            (curr_make_id, 'Dzire Tour', 'DZIR', cat_sedan),
            (curr_make_id, 'Dzire', 'DZIR', cat_sedan),
            (curr_make_id, 'Alto', 'ALTO', cat_hatchback),
            (curr_make_id, 'S-Presso', 'SPR', cat_hatchback),
            (curr_make_id, 'Celerio', 'CELE', cat_hatchback),
            (curr_make_id, 'Swift', 'SWIF', cat_hatchback),
            (curr_make_id, 'Gypsy', 'GYPS', cat_suv),
            (curr_make_id, 'Vitara Brezza', 'VITA', cat_suv),
            (curr_make_id, 'Xl6', 'XL6', cat_minivan),
            (curr_make_id, 'Omni', 'OMNI', cat_minivan),
            (curr_make_id, 'Baleno', 'BALE', cat_hatchback),
            (curr_make_id, 'Ertiga', 'ERTI', cat_minivan),
            (curr_make_id, 'Baleno Rs', 'BALE', cat_hatchback),
            (curr_make_id, 'S-Cross', 'SCR', cat_sedan),
            (curr_make_id, 'Alto 800 Tour', 'ALTO', cat_hatchback),
            (curr_make_id, 'Ciaz', 'CIAZ', cat_sedan)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Hyundai
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Hyundai';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Santro', 'SANT', cat_hatchback),
            (curr_make_id, 'Xcent Prime', 'XCEN', cat_sedan),
            (curr_make_id, 'Elite I20', 'ELIT', cat_hatchback),
            (curr_make_id, 'Aura', 'AURA', cat_sedan),
            (curr_make_id, 'Grand I10 Prime', 'GRAN', cat_hatchback),
            (curr_make_id, 'Venue', 'VENU', cat_suv),
            (curr_make_id, 'I20 Active', 'I20', cat_hatchback),
            (curr_make_id, 'Verna', 'VERN', cat_sedan),
            (curr_make_id, 'Grand I10', 'GRAN', cat_hatchback),
            (curr_make_id, 'Elantra', 'ELAN', cat_sedan),
            (curr_make_id, 'Tucson', 'TUCS', cat_suv),
            (curr_make_id, 'Grand I10 Nios', 'GRAN', cat_hatchback),
            (curr_make_id, 'Xcent', 'XCEN', cat_sedan),
            (curr_make_id, 'Creta', 'CRET', cat_suv),
            (curr_make_id, 'Kona Electric', 'KONA', cat_suv)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Premier
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Premier';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Rio', 'RIO', cat_suv)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Toyota
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Toyota';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Etios Liva', 'ETIO', cat_hatchback),
            (curr_make_id, 'Platinum Etios', 'PLAT', cat_sedan),
            (curr_make_id, 'Etios Cross', 'ETIO', cat_hatchback),
            (curr_make_id, 'Glanza', 'GLAN', cat_hatchback),
            (curr_make_id, 'Land Cruiser Prado', 'LAND', cat_suv),
            (curr_make_id, 'Innova Crysta', 'INNO', cat_minivan),
            (curr_make_id, 'Corolla Altis', 'CORO', cat_sedan),
            (curr_make_id, 'Fortuner', 'FORT', cat_suv),
            (curr_make_id, 'Land Cruiser', 'LAND', cat_suv),
            (curr_make_id, 'Prius', 'PRIU', cat_sedan),
            (curr_make_id, 'Camry', 'CAMR', cat_sedan),
            (curr_make_id, 'Yaris', 'YARI', cat_sedan)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Nissan
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Nissan';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Micra Active', 'MICR', cat_hatchback),
            (curr_make_id, 'Sunny', 'SUNN', cat_sedan),
            (curr_make_id, 'Terrano', 'TERR', cat_suv),
            (curr_make_id, 'Gtr', 'GTR', cat_coupe),
            (curr_make_id, 'Micra', 'MICR', cat_hatchback),
            (curr_make_id, 'Kicks', 'KICK', cat_suv)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Volkswagen
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Volkswagen';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Polo', 'POLO', cat_hatchback),
            (curr_make_id, 'Ameo', 'AMEO', cat_sedan),
            (curr_make_id, 'Tiguan', 'TIGU', cat_suv),
            (curr_make_id, 'Vento', 'VENT', cat_sedan),
            (curr_make_id, 'Passat', 'PASS', cat_sedan)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Ford
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Ford';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Freestyle', 'FREE', cat_sedan),
            (curr_make_id, 'Aspire', 'ASPI', cat_sedan),
            (curr_make_id, 'Mustang', 'MUST', cat_sedan),
            (curr_make_id, 'Ecosport', 'ECOS', cat_suv),
            (curr_make_id, 'Endeavour', 'ENDE', cat_suv),
            (curr_make_id, 'Figo', 'FIGO', cat_hatchback)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Mahindra
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Mahindra';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Verito Vibe', 'VERI', cat_hatchback),
            (curr_make_id, 'Alturas G4', 'ALTU', cat_sedan),
            (curr_make_id, 'Kuv100 Nxt', 'KUV1', cat_hatchback),
            (curr_make_id, 'Bolero Power Plus', 'BOLE', cat_suv),
            (curr_make_id, 'Xuv300', 'XUV3', cat_suv),
            (curr_make_id, 'E2O Plus', 'E2O', cat_hatchback),
            (curr_make_id, 'Thar', 'THAR', cat_suv),
            (curr_make_id, 'Tuv300 Plus', 'TUV3', cat_suv),
            (curr_make_id, 'Marazzo', 'MARA', cat_minivan),
            (curr_make_id, 'Scorpio', 'SCOR', cat_suv),
            (curr_make_id, 'Xuv500', 'XUV5', cat_suv),
            (curr_make_id, 'E Verito', 'EVE', cat_sedan),
            (curr_make_id, 'Tuv300', 'TUV3', cat_suv),
            (curr_make_id, 'Xylo', 'XYLO', cat_suv),
            (curr_make_id, 'Bolero', 'BOLE', cat_suv),
            (curr_make_id, 'Nuvosport', 'NUVO', cat_suv),
            (curr_make_id, 'Verito', 'VERI', cat_sedan)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Fiat
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Fiat';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Urban Cross', 'URBA', cat_sedan),
            (curr_make_id, 'Avventura', 'AVVE', cat_sedan),
            (curr_make_id, 'Linea', 'LINE', cat_sedan),
            (curr_make_id, 'Abarth Avventura', 'ABAR', cat_sedan),
            (curr_make_id, 'Punto Evo Pure', 'PUNT', cat_hatchback),
            (curr_make_id, 'Linea Classic', 'LINE', cat_sedan),
            (curr_make_id, 'Abarth Punto', 'ABAR', cat_hatchback),
            (curr_make_id, 'Punto Evo', 'PUNT', cat_hatchback)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Honda
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Honda';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Jazz', 'JAZZ', cat_hatchback),
            (curr_make_id, 'Cr-V', 'CRV', cat_suv),
            (curr_make_id, 'Amaze', 'AMAZ', cat_sedan),
            (curr_make_id, 'Brv', 'BRV', cat_suv),
            (curr_make_id, 'Civic', 'CIVI', cat_sedan),
            (curr_make_id, 'Wr-V', 'WRV', cat_suv),
            (curr_make_id, 'Accord Hybrid', 'ACCO', cat_sedan),
            (curr_make_id, 'City', 'CITY', cat_sedan),
            (curr_make_id, 'Activa', 'ACTI', cat_scooter),
            (curr_make_id, 'Unicorn', 'UNIC', cat_bike),
            (curr_make_id, 'Shine', 'SHIN', cat_bike),
            (curr_make_id, 'Dio', 'DIO', cat_scooter),
            (curr_make_id, 'CBR 650R', 'CBR', cat_bike)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Jeep
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Jeep';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Compass Trailhawk', 'COMP', cat_suv),
            (curr_make_id, 'Grand Cherokee', 'GRAN', cat_suv),
            (curr_make_id, 'Compass', 'COMP', cat_suv),
            (curr_make_id, 'Wrangler', 'WRAN', cat_suv)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Isuzu
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Isuzu';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Mu-X', 'MUX', cat_suv),
            (curr_make_id, 'Dmax V-Cross', 'DMAX', cat_sedan)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Skoda
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Skoda';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Superb Sportline', 'SUPE', cat_sedan),
            (curr_make_id, 'Kodiaq', 'KODI', cat_suv),
            (curr_make_id, 'Monte Carlo', 'MONT', cat_sedan),
            (curr_make_id, 'Superb', 'SUPE', cat_sedan),
            (curr_make_id, 'Kodiaq Scout', 'KODI', cat_suv),
            (curr_make_id, 'Rapid', 'RAPI', cat_sedan),
            (curr_make_id, 'Octavia', 'OCTA', cat_sedan)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Audi
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Audi';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'A3', 'A3', cat_sedan),
            (curr_make_id, 'Q3', 'Q3', cat_suv),
            (curr_make_id, 'A4', 'A4', cat_sedan),
            (curr_make_id, 'A3 Cabriolet', 'A3C', cat_convertible),
            (curr_make_id, 'A6', 'A6', cat_sedan),
            (curr_make_id, 'S5', 'S5', cat_sedan),
            (curr_make_id, 'Rs5', 'RS5', cat_coupe),
            (curr_make_id, 'Q8', 'Q8', cat_suv),
            (curr_make_id, 'A8 L', 'A8L', cat_sedan),
            (curr_make_id, 'R8', 'R8', cat_coupe),
            (curr_make_id, 'Q5', 'Q5', cat_suv),
            (curr_make_id, 'Q7', 'Q7', cat_suv),
            (curr_make_id, 'Rs7', 'RS7', cat_sedan),
            (curr_make_id, 'A5 Cabriolet', 'A5C', cat_convertible),
            (curr_make_id, 'A5', 'A5', cat_sedan)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Dc
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Dc';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Avanti', 'AVAN', cat_coupe)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Mini
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Mini';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Cooper 5 Door', 'COOP', cat_hatchback),
            (curr_make_id, 'Convertible', 'CONV', cat_convertible),
            (curr_make_id, 'Clubman', 'CLUB', cat_hatchback),
            (curr_make_id, 'John Cooper Works', 'JOHN', cat_hatchback),
            (curr_make_id, 'Cooper 3 Door', 'COOP', cat_hatchback),
            (curr_make_id, 'Countryman', 'COUN', cat_hatchback)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Volvo
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Volvo';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Xc40', 'XC40', cat_suv),
            (curr_make_id, 'S90', 'S90', cat_sedan),
            (curr_make_id, 'V40', 'V40', cat_hatchback),
            (curr_make_id, 'S60', 'S60', cat_sedan),
            (curr_make_id, 'S60 Cross Country', 'S60', cat_sedan),
            (curr_make_id, 'Xc60', 'XC60', cat_suv),
            (curr_make_id, 'Xc90', 'XC90', cat_suv),
            (curr_make_id, 'V40 Cross Country', 'V40', cat_hatchback),
            (curr_make_id, 'V90 Cross Country', 'V90', cat_suv)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Jaguar
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Jaguar';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Xe', 'XE', cat_sedan),
            (curr_make_id, 'Xf', 'XF', cat_sedan),
            (curr_make_id, 'Xj', 'XJ', cat_sedan),
            (curr_make_id, 'F-Pace', 'FPA', cat_suv),
            (curr_make_id, 'F-Type', 'FTY', cat_convertible)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Bmw
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Bmw';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'X3', 'X3', cat_suv),
            (curr_make_id, 'X5', 'X5', cat_suv),
            (curr_make_id, 'M2 Competition', 'M2C', cat_coupe),
            (curr_make_id, '7-Series', '7SE', cat_sedan),
            (curr_make_id, 'X1', 'X1', cat_suv),
            (curr_make_id, '3-Series', '3SE', cat_sedan),
            (curr_make_id, 'X4', 'X4', cat_suv),
            (curr_make_id, 'Z4 Roadster', 'Z4R', cat_convertible),
            (curr_make_id, 'X7', 'X7', cat_suv),
            (curr_make_id, 'M4', 'M4', cat_coupe),
            (curr_make_id, '5-Series', '5SE', cat_sedan),
            (curr_make_id, '6-Series', '6SE', cat_sedan),
            (curr_make_id, 'M5', 'M5', cat_sedan)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Land Rover
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Land Rover';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Discovery Sport', 'DISC', cat_suv),
            (curr_make_id, 'Discovery', 'DISC', cat_suv)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Porsche
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Porsche';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, '718', '718', cat_convertible),
            (curr_make_id, 'Panamera', 'PANA', cat_sedan),
            (curr_make_id, 'Cayenne', 'CAYE', cat_suv),
            (curr_make_id, '911', '911', cat_coupe),
            (curr_make_id, 'Macan', 'MACA', cat_suv),
            (curr_make_id, 'Cayenne Coupe', 'CAYE', cat_sedan)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Lexus
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Lexus';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Rx 450H', 'RX4', cat_suv),
            (curr_make_id, 'Lc 500H', 'LC5', cat_coupe),
            (curr_make_id, 'Lx 450D', 'LX4', cat_suv),
            (curr_make_id, 'Es', 'ES', cat_sedan),
            (curr_make_id, 'Nx 300H', 'NX3', cat_suv),
            (curr_make_id, 'Lx 570', 'LX5', cat_suv),
            (curr_make_id, 'Ls 500H', 'LS5', cat_suv)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Maserati
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Maserati';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Levante', 'LEVA', cat_suv),
            (curr_make_id, 'Granturismo', 'GRAN', cat_coupe),
            (curr_make_id, 'Quattroporte', 'QUAT', cat_sedan),
            (curr_make_id, 'Ghibli', 'GHIB', cat_sedan),
            (curr_make_id, 'Grancabrio', 'GRAN', cat_convertible)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Lamborghini
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Lamborghini';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Urus', 'URUS', cat_suv),
            (curr_make_id, 'Huracan', 'HURA', cat_coupe),
            (curr_make_id, 'Aventador', 'AVEN', cat_convertible)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Bentley
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Bentley';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Continental Gt', 'CONT', cat_coupe),
            (curr_make_id, 'Bentayga', 'BENT', cat_suv),
            (curr_make_id, 'Mulsanne', 'MULS', cat_sedan),
            (curr_make_id, 'Flying Spur', 'FLYI', cat_sedan)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Ferrari
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Ferrari';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Portofino', 'PORT', cat_convertible),
            (curr_make_id, '458 Speciale', '458', cat_coupe),
            (curr_make_id, '488 Gtb', '488', cat_coupe),
            (curr_make_id, 'Gtc4 Lusso', 'GTC4', cat_coupe),
            (curr_make_id, '812 Superfast', '812', cat_coupe),
            (curr_make_id, '458 Spider', '458', cat_coupe)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Aston Martin
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Aston Martin';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Db 11', 'DB1', cat_coupe),
            (curr_make_id, 'Vantage', 'VANT', cat_coupe),
            (curr_make_id, 'Rapide', 'RAPI', cat_sedan)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Bugatti
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Bugatti';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Chiron', 'CHIR', cat_sedan)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Bajaj
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Bajaj';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Qute (Re60)', 'QUTE', cat_hatchback),
            (curr_make_id, 'Dominar 400', 'DOMI', cat_bike),
            (curr_make_id, 'Avenger 220', 'AVEN', cat_bike),
            (curr_make_id, 'Platina 110', 'PLAT', cat_bike),
            (curr_make_id, 'Pulsar 150', 'PULS', cat_bike),
            (curr_make_id, 'CT 100', 'CT1', cat_bike)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Icml
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Icml';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Extreme', 'EXTR', cat_suv)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Force
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Force';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Gurkha', 'GURK', cat_suv)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Mg
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Mg';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Zs Ev', 'ZSE', cat_suv),
            (curr_make_id, 'Hector', 'HECT', cat_suv)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Kia
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Kia';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Carnival', 'CARN', cat_minivan),
            (curr_make_id, 'Seltos', 'SELT', cat_suv)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Land Rover Rover
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Land Rover Rover';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Range Evoque', 'RANG', cat_suv),
            (curr_make_id, 'Range Evoque Convertible', 'RANG', cat_convertible),
            (curr_make_id, 'Range Velar', 'RANG', cat_suv),
            (curr_make_id, 'Range Sport', 'RANG', cat_suv),
            (curr_make_id, 'Range', 'RANG', cat_suv)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Mitsubishi
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Mitsubishi';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Outlander', 'OUTL', cat_suv),
            (curr_make_id, 'Pajero Sport', 'PAJE', cat_suv),
            (curr_make_id, 'Montero', 'MONT', cat_suv)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Maruti Suzuki R
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Maruti Suzuki R';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Wagon', 'WAGO', cat_hatchback)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Royal Enfield
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Royal Enfield';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Hunter 350', 'HUNT', cat_bike),
            (curr_make_id, 'Meteor 350', 'METE', cat_bike),
            (curr_make_id, 'Classic 350', 'CLAS', cat_bike),
            (curr_make_id, 'Interceptor 650', 'INTE', cat_bike),
            (curr_make_id, 'Himalayan', 'HIMA', cat_bike)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- KTM
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'KTM';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, '125 Duke', '125', cat_bike),
            (curr_make_id, '390 Adventure', '390', cat_bike),
            (curr_make_id, 'Duke 200', 'DUKE', cat_bike),
            (curr_make_id, 'RC 390', 'RC3', cat_bike),
            (curr_make_id, '250 Duke', '250', cat_bike)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Kawasaki
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Kawasaki';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Ninja 300', 'NINJ', cat_bike),
            (curr_make_id, 'Vulcan S', 'VULC', cat_bike),
            (curr_make_id, 'Z650', 'Z650', cat_bike),
            (curr_make_id, 'Versys 650', 'VERS', cat_bike),
            (curr_make_id, 'Ninja 400', 'NINJ', cat_bike)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Yamaha
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Yamaha';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'FZ V3', 'FZV', cat_bike),
            (curr_make_id, 'Fascino 125', 'FASC', cat_scooter),
            (curr_make_id, 'MT-15', 'MT1', cat_bike),
            (curr_make_id, 'Ray ZR', 'RAY', cat_bike),
            (curr_make_id, 'R15 V4', 'R15', cat_bike)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- Hero
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'Hero';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Splendor Plus', 'SPLE', cat_bike),
            (curr_make_id, 'HF Deluxe', 'HFD', cat_bike),
            (curr_make_id, 'Xtreme 160R', 'XTRE', cat_bike),
            (curr_make_id, 'Glamour', 'GLAM', cat_bike),
            (curr_make_id, 'Passion Pro', 'PASS', cat_bike)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;

    -- TVS
    SELECT id INTO curr_make_id FROM public.vehicle_make WHERE name = 'TVS';
    IF curr_make_id IS NOT NULL THEN
        INSERT INTO public.vehicle_model (make_id, name, model_code, vehicle_category) VALUES
            (curr_make_id, 'Jupiter', 'JUPI', cat_scooter),
            (curr_make_id, 'NTorq 125', 'NTOR', cat_scooter),
            (curr_make_id, 'Ronin', 'RONI', cat_bike),
            (curr_make_id, 'Sport', 'SPOR', cat_bike),
            (curr_make_id, 'Apache RTR 160', 'APAC', cat_bike)
        ON CONFLICT (make_id, name) DO NOTHING;
    END IF;


    RAISE NOTICE 'Vehicle seed data from CSV inserted successfully!';
END $$;
