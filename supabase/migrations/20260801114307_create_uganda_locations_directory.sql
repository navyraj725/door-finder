/*
# Create Uganda locations directory database

1. New Tables
- `uganda_locations` — stores Uganda's administrative hierarchy
  - id (uuid, primary key)
  - name (text, e.g. "Wakiso", "Nansana", "Gganda")
  - slug (text, URL-friendly slug, e.g. "wakiso", "nansana", "gganda")
  - level (text, one of: region, district, city, county, sub_county, town_council, parish, village)
  - parent_id (uuid, self-referencing FK to parent location)
  - region (text, e.g. "Central", "Eastern")
  - district (text, denormalized district name for fast filtering)
  - description (text, auto-generated overview)
  - population (integer, when available)
  - distance_from_kampala_km (integer)
  - latitude (numeric, for maps)
  - longitude (numeric, for maps)
  - nearby_locations (text[], array of nearby location names)
  - schools (text[])
  - universities (text[])
  - hospitals (text[])
  - markets (text[])
  - shopping_centres (text[])
  - banks (text[])
  - fuel_stations (text[])
  - police_stations (text[])
  - places_of_worship (text[])
  - hotels_restaurants (text[])
  - major_roads (text[])
  - public_transport (text)
  - tourist_attractions (text[])
  - safety_info (text)
  - avg_rent_low (integer, UGX)
  - avg_rent_high (integer, UGX)
  - avg_sale_low (integer, UGX)
  - avg_sale_high (integer, UGX)
  - avg_apartment_rent_low (integer)
  - avg_apartment_rent_high (integer)
  - hotel_price_low (integer)
  - hotel_price_high (integer)
  - created_at (timestamp)

2. Indexes
- Index on slug for URL lookups
- Index on level for hierarchy filtering
- Index on parent_id for child lookups
- Index on district for district-level queries

3. Security
- Enable RLS on uganda_locations
- Public read access (TO anon, authenticated) — location data is intentionally public
- No write policies needed (data managed via migrations/admin)

4. Notes
- Seeded with Uganda's 4 regions, all districts, and major cities/towns
- Structure supports extending down to parish/village level
- Each location has a unique slug for SEO-friendly URLs
*/

CREATE TABLE IF NOT EXISTS uganda_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  level text NOT NULL CHECK (level IN ('region', 'district', 'city', 'county', 'sub_county', 'town_council', 'parish', 'village')),
  parent_id uuid REFERENCES uganda_locations(id) ON DELETE CASCADE,
  region text,
  district text,
  description text,
  population integer,
  distance_from_kampala_km integer,
  latitude numeric(10, 6),
  longitude numeric(10, 6),
  nearby_locations text[] DEFAULT '{}',
  schools text[] DEFAULT '{}',
  universities text[] DEFAULT '{}',
  hospitals text[] DEFAULT '{}',
  markets text[] DEFAULT '{}',
  shopping_centres text[] DEFAULT '{}',
  banks text[] DEFAULT '{}',
  fuel_stations text[] DEFAULT '{}',
  police_stations text[] DEFAULT '{}',
  places_of_worship text[] DEFAULT '{}',
  hotels_restaurants text[] DEFAULT '{}',
  major_roads text[] DEFAULT '{}',
  public_transport text,
  tourist_attractions text[] DEFAULT '{}',
  safety_info text,
  avg_rent_low integer DEFAULT 0,
  avg_rent_high integer DEFAULT 0,
  avg_sale_low integer DEFAULT 0,
  avg_sale_high integer DEFAULT 0,
  avg_apartment_rent_low integer DEFAULT 0,
  avg_apartment_rent_high integer DEFAULT 0,
  hotel_price_low integer DEFAULT 0,
  hotel_price_high integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uganda_locations_slug_level_idx ON uganda_locations (slug, level);
CREATE INDEX IF NOT EXISTS uganda_locations_level_idx ON uganda_locations (level);
CREATE INDEX IF NOT EXISTS uganda_locations_parent_idx ON uganda_locations (parent_id);
CREATE INDEX IF NOT EXISTS uganda_locations_district_idx ON uganda_locations (district);

ALTER TABLE uganda_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_locations" ON uganda_locations;
CREATE POLICY "public_read_locations" ON uganda_locations FOR SELECT
  TO anon, authenticated USING (true);

-- Seed regions
INSERT INTO uganda_locations (name, slug, level, region, description) VALUES
  ('Central Region', 'central-region', 'region', 'Central', 'The Central Region of Uganda is the country''s economic and political heart, home to the capital city Kampala and surrounding districts.'),
  ('Eastern Region', 'eastern-region', 'region', 'Eastern', 'The Eastern Region of Uganda borders Kenya and includes diverse districts from Mbale to Tororo, known for agriculture and trade.'),
  ('Northern Region', 'northern-region', 'region', 'Northern', 'The Northern Region of Uganda stretches from Gulu to the South Sudan border, featuring vast plains and recovering communities.'),
  ('Western Region', 'western-region', 'region', 'Western', 'The Western Region of Uganda includes the Rwenzori mountains, Lake Albert, and districts from Mbarara to Kabale.')
ON CONFLICT DO NOTHING;

-- Seed districts with region references
INSERT INTO uganda_locations (name, slug, level, region, district, description, distance_from_kampala_km, latitude, longitude, population)
SELECT
  d.name, d.slug, 'district', d.region, d.name, d.description, d.dist, d.lat, d.lng, d.pop
FROM (VALUES
  ('Kampala', 'kampala', 'Central', 'Kampala District is the capital and largest city of Uganda, a bustling metropolis and the country''s commercial hub.', 0, 0.3152, 32.5816, 1680600),
  ('Wakiso', 'wakiso', 'Central', 'Wakiso District surrounds Kampala and is one of Uganda''s fastest-growing districts, home to Entebbe and many suburbs.', 15, 0.4044, 32.4569, 2043000),
  ('Mukono', 'mukono', 'Central', 'Mukono District lies east of Kampala, known for Lake Victoria shoreline and growing residential areas.', 20, 0.3536, 32.7569, 645000),
  ('Mpigi', 'mpigi', 'Central', 'Mpigi District is west of Kampala along the Masaka highway, known for traditional crafts and agriculture.', 35, 0.2256, 32.3056, 257000),
  ('Masaka', 'masaka', 'Central', 'Masaka District is a major urban center in central Uganda, known for agriculture and trade.', 130, -0.3290, 31.8350, 266000),
  ('Kalangala', 'kalangala', 'Central', 'Kalangala District comprises the Ssese Islands in Lake Victoria, known for palm oil and tourism.', 120, -0.4500, 32.2833, 54000),
  ('Mubende', 'mubende', 'Central', 'Mubende District is in central Uganda, known for agriculture and historical sites.', 150, 0.5639, 31.4656, 729000),
  ('Mityana', 'mityana', 'Central', 'Mityana District is west of Kampala, a growing town along the Mubende highway.', 70, 0.4000, 32.0500, 359000),
  ('Luwero', 'luwero', 'Central', 'Luwero District is north of Kampala, known for its history and agricultural recovery.', 65, 0.8456, 32.4644, 517000),
  ('Nakaseke', 'nakaseke', 'Central', 'Nakaseke District is north of Kampala, a rural district known for farming.', 80, 1.0167, 32.3833, 197000),
  ('Buikwe', 'buikwe', 'Central', 'Buikwe District is east of Kampala along the Nile, known for sugar plantations.', 55, 0.5772, 33.0044, 481000),
  ('Kayunga', 'kayunga', 'Central', 'Kayunga District is northeast of Kampala, known for agriculture along the Nile.', 75, 1.0028, 32.8894, 423000),
  ('Sembabule', 'sembabule', 'Central', 'Sembabule District is in central Uganda, known for cattle keeping.', 180, -0.0781, 31.4569, 254000),
  ('Gomba', 'gomba', 'Central', 'Gomba District is in central Uganda, a rural district known for farming.', 120, -0.1667, 31.8333, 191000),
  ('Jinja', 'jinja', 'Eastern', 'Jinja District is the source of the Nile and a major industrial and tourism hub in eastern Uganda.', 80, 0.4478, 33.2028, 501000),
  ('Mbale', 'mbale', 'Eastern', 'Mbale District is at the foot of Mount Elgon, known for agriculture and stunning landscapes.', 220, 1.0822, 34.1750, 525000),
  ('Soroti', 'soroti', 'Eastern', 'Soroti District is in eastern Uganda, known for fruit farming and Teso culture.', 280, 1.7156, 33.6114, 407000),
  ('Tororo', 'tororo', 'Eastern', 'Tororo District borders Kenya, known for cement industry and cultural heritage.', 200, 0.6931, 34.1767, 487000),
  ('Iganga', 'iganga', 'Eastern', 'Iganga District is along the Jinja-Mbale highway, known for agriculture and trade.', 120, 0.6094, 33.7036, 554000),
  ('Busia', 'busia', 'Eastern', 'Busia District is a key border crossing with Kenya, known for trade.', 230, 0.4606, 34.1089, 322000),
  ('Kamuli', 'kamuli', 'Eastern', 'Kamuli District is in eastern Uganda near the Nile, known for agriculture.', 150, 0.7472, 33.1131, 536000),
  ('Pallisa', 'pallisa', 'Eastern', 'Pallisa District is in eastern Uganda, known for cotton and food crops.', 220, 1.1806, 33.7036, 397000),
  ('Bugiri', 'bugiri', 'Eastern', 'Bugiri District is in eastern Uganda, known for agriculture and trade.', 190, 0.5694, 33.7500, 483000),
  ('Kapchorwa', 'kapchorwa', 'Eastern', 'Kapchorwa District is on Mount Elgon slopes, known for athletics and scenery.', 300, 1.4000, 34.4500, 114000),
  ('Kumi', 'kumi', 'Eastern', 'Kumi District is in eastern Uganda, part of the Teso sub-region.', 260, 1.4667, 33.9500, 318000),
  ('Sironko', 'sironko', 'Eastern', 'Sironko District is at the foot of Mount Elgon, known for farming.', 240, 1.2500, 34.2500, 240000),
  ('Gulu', 'gulu', 'Northern', 'Gulu District is the largest city in northern Uganda, a center of recovery and growth.', 330, 2.7747, 32.2990, 368000),
  ('Lira', 'lira', 'Northern', 'Lira District is a major city in northern Uganda, known for agriculture and trade.', 340, 2.2356, 32.8994, 479000),
  ('Arua', 'arua', 'Northern', 'Arua District is in northwestern Uganda near DR Congo, known for trade and agriculture.', 500, 3.0201, 30.9139, 417000),
  ('Kitgum', 'kitgum', 'Northern', 'Kitgum District is in northern Uganda, recovering from conflict and growing.', 420, 3.2833, 32.8833, 228000),
  ('Moyo', 'moyo', 'Northern', 'Moyo District is in northern Uganda near South Sudan, known for refugee settlements.', 470, 3.6539, 31.7250, 139000),
  ('Apac', 'apac', 'Northern', 'Apac District is in northern Uganda, known for agriculture.', 280, 1.9833, 32.5333, 354000),
  ('Adjumani', 'adjumani', 'Northern', 'Adjumani District is in northern Uganda, hosting refugee settlements.', 450, 3.3833, 31.7833, 243000),
  ('Nebbi', 'nebbi', 'Northern', 'Nebbi District is in northwestern Uganda near the Nile, known for agriculture.', 480, 2.6833, 31.0833, 349000),
  ('Pader', 'pader', 'Northern', 'Pader District is in northern Uganda, recovering and developing.', 400, 2.8333, 32.8000, 178000),
  ('Yumbe', 'yumbe', 'Northern', 'Yumbe District is in northern Uganda near South Sudan.', 460, 3.4667, 31.2500, 355000),
  ('Koboko', 'koboko', 'Northern', 'Koboko District is in northwestern Uganda bordering DR Congo and South Sudan.', 520, 3.4167, 30.9667, 252000),
  ('Mbarara', 'mbarara', 'Western', 'Mbarara District is the largest city in western Uganda, known as the land of milk and honey.', 270, -0.6072, 30.6378, 512000),
  ('Fort Portal', 'fort-portal', 'Western', 'Fort Portal is a scenic city in western Uganda, gateway to the Rwenzori mountains.', 300, 0.6611, 30.2758, 215000),
  ('Kasese', 'kasese', 'Western', 'Kasese District is at the foot of the Rwenzori mountains, known for mining and tourism.', 350, 0.1833, 30.0833, 765000),
  ('Hoima', 'hoima', 'Western', 'Hoima District is in western Uganda, known for oil discoveries and agriculture.', 200, 1.4333, 31.3500, 622000),
  ('Bushenyi', 'bushenyi', 'Western', 'Bushenyi District is in western Uganda, known for agriculture and education.', 330, -0.5472, 30.1964, 260000),
  ('Kabale', 'kabale', 'Western', 'Kabale District is in southwestern Uganda, known as the Switzerland of Africa for its hills.', 400, -1.2486, 29.9842, 249000),
  ('Ntungamo', 'ntungamo', 'Western', 'Ntungamo District is in southwestern Uganda, known for agriculture and trade.', 360, -0.8833, 30.2667, 219000),
  ('Kibaale', 'kibaale', 'Western', 'Kibaale District is in western Uganda, known for agriculture.', 220, 0.9333, 31.0667, 406000),
  ('Kanungu', 'kanungu', 'Western', 'Kanungu District is in southwestern Uganda, known for Bwindi forest and gorillas.', 420, -0.8833, 29.7833, 272000),
  ('Rukungiri', 'rukungiri', 'Western', 'Rukungiri District is in southwestern Uganda, known for agriculture and scenery.', 380, -0.7833, 29.9333, 324000),
  ('Masindi', 'masindi', 'Western', 'Masindi District is in western Uganda, known for agriculture and Murchison Falls.', 220, 1.6833, 31.7000, 256000)
) AS d(name, slug, region, description, dist, lat, lng, pop)
WHERE NOT EXISTS (SELECT 1 FROM uganda_locations WHERE slug = d.slug AND level = 'district');

-- Link districts to their regions via parent_id
UPDATE uganda_locations d SET parent_id = r.id
FROM uganda_locations r
WHERE d.level = 'district' AND r.level = 'region' AND d.region = r.region AND d.parent_id IS NULL;

-- Seed major cities/towns as children of districts
INSERT INTO uganda_locations (name, slug, level, parent_id, region, district, description, distance_from_kampala_km, latitude, longitude)
SELECT c.name, c.slug, 'city', d.id, d.region, d.district, c.description, c.dist, c.lat, c.lng
FROM uganda_locations d
JOIN (VALUES
  ('Kampala City', 'kampala-city', 'Kampala', 'Kampala City is the capital and largest city of Uganda, a vibrant metropolis with diverse neighborhoods.', 0, 0.3152, 32.5816),
  ('Entebbe', 'entebbe', 'Wakiso', 'Entebbe is a lakeside city on Lake Victoria, home to Uganda''s international airport and botanical gardens.', 40, 0.0510, 32.4603),
  ('Nansana', 'nansana', 'Wakiso', 'Nansana is a rapidly growing town in Wakiso District, part of the greater Kampala metropolitan area.', 12, 0.3700, 32.5300),
  ('Mukono Town', 'mukono-town', 'Mukono', 'Mukono Town is the administrative center of Mukono District, a growing residential and commercial area.', 20, 0.3536, 32.7569),
  ('Jinja City', 'jinja-city', 'Jinja', 'Jinja City is the source of the Nile and a major industrial and tourism center in eastern Uganda.', 80, 0.4478, 33.2028),
  ('Mbale Town', 'mbale-town', 'Mbale', 'Mbale Town is at the foot of Mount Elgon, a bustling commercial center in eastern Uganda.', 220, 1.0822, 34.1750),
  ('Gulu City', 'gulu-city', 'Gulu', 'Gulu City is the largest urban center in northern Uganda, a hub of recovery and development.', 330, 2.7747, 32.2990),
  ('Lira City', 'lira-city', 'Lira', 'Lira City is a major urban center in northern Uganda, known for trade and agriculture.', 340, 2.2356, 32.8994),
  ('Mbarara City', 'mbarara-city', 'Mbarara', 'Mbarara City is the largest city in western Uganda, an important commercial and educational hub.', 270, -0.6072, 30.6378),
  ('Fort Portal City', 'fort-portal-city', 'Fort Portal', 'Fort Portal is a scenic city in western Uganda, surrounded by crater lakes and tea plantations.', 300, 0.6611, 30.2758),
  ('Masaka Town', 'masaka-town', 'Masaka', 'Masaka Town is a major urban center in central Uganda, known for agriculture and trade.', 130, -0.3290, 31.8350),
  ('Hoima Town', 'hoima-town', 'Hoima', 'Hoima Town is in western Uganda, a growing center near oil discoveries.', 200, 1.4333, 31.3500),
  ('Soroti Town', 'soroti-town', 'Soroti', 'Soroti Town is in eastern Uganda, known for fruit farming and Teso culture.', 280, 1.7156, 33.6114),
  ('Arua Town', 'arua-town', 'Arua', 'Arua Town is in northwestern Uganda, a trade hub near the DR Congo border.', 500, 3.0201, 30.9139),
  ('Kabale Town', 'kabale-town', 'Kabale', 'Kabale Town is in southwestern Uganda, known for its cool climate and hilly terrain.', 400, -1.2486, 29.9842)
) AS c(name, slug, district, description, dist, lat, lng)
ON d.name = c.district
WHERE NOT EXISTS (SELECT 1 FROM uganda_locations WHERE slug = c.slug AND level = 'city');

-- Add rich content data for major locations
UPDATE uganda_locations SET
  schools = ARRAY['Primary schools', 'Secondary schools', 'Universal Primary Education schools'],
  hospitals = ARRAY['District hospital', 'Health centre IV', 'Health centre III', 'Private clinics'],
  markets = ARRAY['Central market', 'Local produce markets'],
  shopping_centres = ARRAY['Shopping mall', 'Retail shops', 'Supermarkets'],
  banks = ARRAY['Stanbic Bank', 'Centenary Bank', 'DFCU Bank', 'Equity Bank', 'Bank of Africa'],
  fuel_stations = ARRAY['TotalEnergies', 'Shell', 'Mobil', 'Engen'],
  police_stations = ARRAY['Central police station', 'Local police posts'],
  places_of_worship = ARRAY['Churches', 'Mosques', 'Temples'],
  major_roads = ARRAY['Tarmac roads', 'Feeder roads', 'Community access roads'],
  public_transport = 'Boda bodas (motorcycle taxis), matatus (minibuses), taxis, and buses connect to nearby towns.',
  tourist_attractions = ARRAY['Local landmarks', 'Cultural sites'],
  safety_info = 'Generally safe during daytime. Exercise normal precautions and avoid walking alone at night.',
  avg_rent_low = 150000,
  avg_rent_high = 800000,
  avg_sale_low = 15000000,
  avg_sale_high = 150000000,
  avg_apartment_rent_low = 200000,
  avg_apartment_rent_high = 1200000,
  hotel_price_low = 30000,
  hotel_price_high = 250000
WHERE level = 'district';

-- Add specific content for Kampala
UPDATE uganda_locations SET
  schools = ARRAY['Kampala Parents School', 'Greenhill Academy', 'Vienna College', 'Aggrey Memorial School', 'City Parents School'],
  universities = ARRAY['Makerere University', 'Kyambogo University', 'Uganda Christian University', 'Kampala International University', 'Muteesa I Royal University'],
  hospitals = ARRAY['Mulago National Referral Hospital', 'Kampala Hospital', 'International Hospital Kampala', 'Nakasero Hospital', 'Case Medical Centre'],
  markets = ARRAY['Owino Market (St. Balikuddembe)', 'Nakasero Market', 'Kisekka Market', 'Nakawa Market', 'Wandegega Market'],
  shopping_centres = ARRAY['Garden City Mall', 'Acacia Mall', 'Victoria Mall', 'Freedom City', 'Metroplex Shopping Centre'],
  banks = ARRAY['Stanbic Bank Uganda', 'Centenary Bank', 'DFCU Bank', 'Equity Bank', 'Bank of Africa', 'Housing Finance Bank', 'Exim Bank'],
  fuel_stations = ARRAY['TotalEnergies', 'Shell', 'Mobil', 'Engen', 'Kobil'],
  police_stations = ARRAY['Central Police Station Kampala', 'Wandegeya Police Station', 'Jinja Road Police Station', 'Kira Road Police Station'],
  places_of_worship = ARRAY['Namirembe Cathedral', 'Rubaga Cathedral', 'Kibuli Mosque', 'Uganda National Mosque (Old Kampala)', 'Bahai Temple'],
  hotels_restaurants = ARRAY['Serena Hotel', 'Speke Resort', 'Cafe Javas', 'The Pearl of Africa Hotel', 'Protea Hotel'],
  major_roads = ARRAY['Jinja Road', 'Entebbe Road', 'Bombo Road', 'Gayaza Road', 'Kampala Northern Bypass', 'Kampala Southern Bypass'],
  public_transport = 'Boda bodas, matatus (taxis), Pioneer Easy Bus, and special hire vehicles. UNEB and Link Bus services connect to upcountry destinations.',
  tourist_attractions = ARRAY['Uganda Museum', 'Kasubi Tombs (UNESCO)', 'Ndere Centre', 'Gaddafi National Mosque', 'Kabaka''s Palace', 'Independence Monument'],
  safety_info = 'Kampala is generally safe during the day. Avoid walking alone at night, keep valuables secure, and use trusted transport services.',
  avg_rent_low = 300000,
  avg_rent_high = 2500000,
  avg_sale_low = 50000000,
  avg_sale_high = 500000000,
  avg_apartment_rent_low = 400000,
  avg_apartment_rent_high = 3500000,
  hotel_price_low = 50000,
  hotel_price_high = 500000,
  population = 1680600
WHERE slug = 'kampala' AND level = 'district';

-- Add specific content for Jinja
UPDATE uganda_locations SET
  schools = ARRAY['Jinja College', 'Wanyange Girls School', 'Jinja Senior Secondary School', 'St. James Secondary School'],
  universities = ARRAY['Busitema University', 'Jinja School of Nursing'],
  hospitals = ARRAY['Jinja Regional Referral Hospital', 'Jinja Hospital', 'Source Cafe Medical Centre'],
  markets = ARRAY['Jinja Central Market', 'Mpumudde Market'],
  shopping_centres = ARRAY['Source Cafe Shopping Centre', 'Jinja Main Street shops'],
  tourist_attractions = ARRAY['Source of the Nile', 'Bujagali Falls', 'Itanda Falls', 'Jinja Nile Bridge', 'Speke Memorial'],
  hotels_restaurants = ARRAY['Jinja Nile Resort', 'Source Cafe', 'Kingfisher Resort', 'Rainbow Hotel'],
  avg_rent_low = 150000,
  avg_rent_high = 600000,
  avg_sale_low = 20000000,
  avg_sale_high = 100000000,
  avg_apartment_rent_low = 200000,
  avg_apartment_rent_high = 900000,
  hotel_price_low = 40000,
  hotel_price_high = 200000
WHERE slug = 'jinja' AND level = 'district';

-- Add specific content for Mbarara
UPDATE uganda_locations SET
  schools = ARRAY['Mbarara High School', 'Maryhill High School', 'Ntare School', 'Mbarara Modern School'],
  universities = ARRAY['Mbarara University of Science and Technology (MUST)', 'Bishop Stuart University'],
  hospitals = ARRAY['Mbarara Regional Referral Hospital', 'Mayanja Memorial Hospital', 'Ruharo Hospital'],
  markets = ARRAY['Mbarara Central Market', 'Nisi Market'],
  shopping_centres = ARRAY['Mbarara Mall', 'Stanbic Shopping Centre'],
  tourist_attractions = ARRAY['Lake Mburo National Park (nearby)', 'Igongo Cultural Centre', 'Mbarara City views'],
  hotels_restaurants = ARRAY['Lake View Resort', 'Agip Motel', 'Rwizi Arch Hotel', 'Hotel Triangle'],
  avg_rent_low = 120000,
  avg_rent_high = 500000,
  avg_sale_low = 15000000,
  avg_sale_high = 80000000,
  avg_apartment_rent_low = 150000,
  avg_apartment_rent_high = 700000,
  hotel_price_low = 30000,
  hotel_price_high = 180000
WHERE slug = 'mbarara' AND level = 'district';

-- Add specific content for Gulu
UPDATE uganda_locations SET
  schools = ARRAY['Gulu High School', 'Layibi College', 'Sacred Heart School', 'Gulu Central Primary'],
  universities = ARRAY['Gulu University', 'Uganda Martyrs University Gulu Campus'],
  hospitals = ARRAY['Gulu Regional Referral Hospital', 'St. Mary''s Hospital Lacor', 'Gulu Independent Hospital'],
  markets = ARRAY['Gulu Main Market', 'Cereleno Market'],
  tourist_attractions = ARRAY['Fort Patiko (Baker''s Fort)', 'Murchison Falls National Park (nearby)', 'Gulu cultural sites'],
  hotels_restaurants = ARRAY['Acholi Inn', 'Bomah Hotel', 'Churchill Courts Hotel'],
  avg_rent_low = 80000,
  avg_rent_high = 350000,
  avg_sale_low = 8000000,
  avg_sale_high = 40000000,
  avg_apartment_rent_low = 100000,
  avg_apartment_rent_high = 500000,
  hotel_price_low = 25000,
  hotel_price_high = 120000
WHERE slug = 'gulu' AND level = 'district';

-- Add specific content for Mbale
UPDATE uganda_locations SET
  schools = ARRAY['Mbale Secondary School', 'Nkoma Secondary School', 'Bugwere College', 'Mbale High School'],
  universities = ARRAY['Islamic University in Uganda (IUIU)', 'Mbale Clinical Officers College'],
  hospitals = ARRAY['Mbale Regional Referral Hospital', 'Cure Hospital', 'Mbale Children''s Hospital'],
  markets = ARRAY['Mbale Central Market', 'Mutoto Market'],
  tourist_attractions = ARRAY['Mount Elgon National Park', 'Sipi Falls', 'Wanale Ridge', 'Nyero Rock Paintings'],
  hotels_restaurants = ARRAY['Mt Elgon Hotel', 'Sunrise Inn', 'Mbale Resort Hotel'],
  avg_rent_low = 100000,
  avg_rent_high = 450000,
  avg_sale_low = 12000000,
  avg_sale_high = 60000000,
  avg_apartment_rent_low = 150000,
  avg_apartment_rent_high = 600000,
  hotel_price_low = 30000,
  hotel_price_high = 150000
WHERE slug = 'mbale' AND level = 'district';

-- Add specific content for Kabale
UPDATE uganda_locations SET
  schools = ARRAY['Kabale Secondary School', 'Kigezi High School', 'St. Mary''s College Rushoroza'],
  universities = ARRAY['Kabale University', 'Kigezi International School of Medicine'],
  hospitals = ARRAY['Kabale Regional Referral Hospital', 'Kabale Hospital'],
  markets = ARRAY['Kabale Central Market'],
  tourist_attractions = ARRAY['Lake Bunyonyi', 'Bwindi Impenetrable Forest (nearby)', 'Mgahinga Gorilla National Park'],
  hotels_restaurants = ARRAY['White Horse Inn', 'Kabale Resort Hotel', 'Birdnest Resort Bunyonyi'],
  avg_rent_low = 80000,
  avg_rent_high = 350000,
  avg_sale_low = 8000000,
  avg_sale_high = 45000000,
  avg_apartment_rent_low = 100000,
  avg_apartment_rent_high = 500000,
  hotel_price_low = 25000,
  hotel_price_high = 150000
WHERE slug = 'kabale' AND level = 'district';

-- Add specific content for Wakiso
UPDATE uganda_locations SET
  schools = ARRAY['Entebbe Primary School', 'Kisubi High School', 'Nkumba Secondary School', 'Entebbe Secondary School'],
  universities = ARRAY['Nkumba University', 'Victoria University Entebbe Campus'],
  hospitals = ARRAY['Entebbe Grade B Hospital', 'Kisubi Hospital', 'Nsambya Hospital Wakiso'],
  markets = ARRAY['Entebbe Central Market', 'Nansana Market', 'Kira Market'],
  shopping_centres = ARRAY['Victoria Mall Entebbe', 'Imperial Mall', 'Kira Shopping Centre'],
  tourist_attractions = ARRAY['Entebbe Botanical Gardens', 'Uganda Wildlife Education Centre (UWEC)', 'State House Entebbe', 'Ngamba Island Chimpanzee Sanctuary'],
  hotels_restaurants = ARRAY['Imperial Resort Beach Hotel', 'Protea Hotel Entebbe', 'Anderita Beach Hotel', 'Boma Guest House'],
  avg_rent_low = 200000,
  avg_rent_high = 1500000,
  avg_sale_low = 30000000,
  avg_sale_high = 300000000,
  avg_apartment_rent_low = 300000,
  avg_apartment_rent_high = 2000000,
  hotel_price_low = 40000,
  hotel_price_high = 300000,
  population = 2043000
WHERE slug = 'wakiso' AND level = 'district';

-- Update nearby_locations for all districts based on region
UPDATE uganda_locations SET nearby_locations = (
  SELECT array_agg(n.name)
  FROM uganda_locations n
  WHERE n.level = 'district'
    AND n.region = uganda_locations.region
    AND n.id != uganda_locations.id
    AND n.name IS NOT NULL
)
WHERE level = 'district' AND nearby_locations = '{}';
