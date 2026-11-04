import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const AUTH_REDIRECT_URL = 'https://html-preview-applica-8uwh.bolt.host';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export type PlanType = 'free' | 'monthly' | 'six_month' | 'annual' | 'premium_6mo' | 'premium_1yr';
export type PaymentStatus = 'pending' | 'verified' | 'declined';
export type SubStatus = 'active' | 'expired' | 'cancelled';

export interface PlanConfig {
  key: PlanType;
  label: string;
  price: number;
  durationDays: number;
  maxListings: number | 'unlimited';
  popular?: boolean;
}

export const PLANS: PlanConfig[] = [
  { key: 'free', label: 'Free', price: 0, durationDays: 30, maxListings: 1 },
  { key: 'monthly', label: 'Monthly', price: 10000, durationDays: 30, maxListings: 'unlimited', popular: true },
  { key: 'six_month', label: '6-Month', price: 60000, durationDays: 180, maxListings: 'unlimited' },
  { key: 'annual', label: 'Annual', price: 120000, durationDays: 365, maxListings: 'unlimited' },
];

export function planConfig(key: string | null | undefined): PlanConfig {
  const normalized = key === 'premium_6mo' ? 'six_month' : key === 'premium_1yr' ? 'annual' : key;
  return PLANS.find((p) => p.key === normalized) || PLANS[0];
}

export function planLabel(key: string | null | undefined): string {
  return planConfig(key).label;
}

export type ProfileRole = 'tenant' | 'landlord' | 'admin' | 'client';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: ProfileRole;
  whatsapp: string;
  avatar_url: string;
  created_at: string;
}

export interface Property {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string;
  price: number;
  area: string;
  district: string;
  beds: number;
  baths: number;
  amenities: string[];
  photos_count: number;
  videos_count: number;
  photo_urls: string[];
  video_urls: string[];
  whatsapp: string;
  status: string;
  expires_at: string | null;
  created_at: string;
  owner_name: string;
  owner_email: string;
  primary_contact: string;
  rooms: number;
  star_rating: number;
  check_in_time: string;
  check_out_time: string;
  minimum_stay: string;
  seating_capacity: number;
  opening_time: string;
  closing_time: string;
  entry_fee: number;
  minimum_spend: number;
  latitude: number | null;
  longitude: number | null;
  street_address: string;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  price_paid: number;
  start_date: string;
  expiry_date: string | null;
  status: SubStatus;
  payment_reference: string;
  created_at: string;
}

export interface FeaturedListing {
  id: string;
  property_id: string;
  user_id: string;
  duration_days: number;
  price_paid: number;
  start_date: string;
  expiry_date: string | null;
  status: string;
  payment_reference: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  reference: string;
  network: string;
  status: PaymentStatus;
  plan_type: string;
  property_id: string | null;
  currency: string;
  created_at: string;
}

export interface AdminAd {
  id: string;
  title: string;
  description: string;
  link_url: string;
  poster_url: string;
  video_url: string;
  is_active: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSettings {
  id: string;
  premium_6mo_price: number;
  premium_1yr_price: number;
  monthly_price: number;
  six_month_price: number;
  annual_price: number;
  featured_7d_price: number;
  featured_30d_price: number;
  free_enabled: boolean;
  premium_6mo_enabled: boolean;
  premium_1yr_enabled: boolean;
  promo_text: string;
  updated_at: string;
}

export interface ScamReport {
  id: string;
  reporter_id: string | null;
  reported_phone: string;
  reported_name: string;
  location: string;
  report_type: string;
  reason: string;
  evidence_urls: string[];
  status: string;
  admin_notes: string;
  created_at: string;
}

export const REPORT_TYPES = [
  'Scam / Fraud',
  'Fake Listing',
  'Impersonation',
  'Harassment',
  'Misleading Information',
  'Other',
] as const;

export const PROPERTY_CATEGORIES = [
  'Houses',
  'Apartments',
  'Hotels',
  'Rentals',
  'Guest Houses',
  'Warehouses',
  'Airbnb',
] as const;

export const UGANDA_DISTRICTS = [
  'Kampala', 'Wakiso', 'Mukono', 'Entebbe', 'Mpigi', 'Luwero', 'Mityana', 'Mubende',
  'Masaka', 'Kalangala', 'Kayunga', 'Buikwe', 'Nakaseke', 'Sembabule', 'Gomba',
  'Jinja', 'Mbale', 'Soroti', 'Tororo', 'Iganga', 'Busia', 'Kamuli', 'Pallisa',
  'Bugiri', 'Kapchorwa', 'Kumi', 'Sironko',
  'Gulu', 'Lira', 'Arua', 'Kitgum', 'Moyo', 'Apac', 'Adjumani', 'Nebbi', 'Pader',
  'Yumbe', 'Koboko',
  'Mbarara', 'Fort Portal', 'Kasese', 'Hoima', 'Bushenyi', 'Kabale', 'Ntungamo',
  'Kibaale', 'Kanungu', 'Rukungiri', 'Masindi',
] as const;

export const KAMPALA_AREAS = [
  'Bukoto', 'Ntinda', 'Kololo', 'Muyenga', 'Najjera', 'Kyanja', 'Kisaasi',
  'Makindye', 'Kira', 'Naalya', 'Nakasero', 'Bugolobi', 'Naguru', 'Mengo', 'Rubaga',
  'Kawempe', 'Nansana', 'Wandegeya', 'Kamwokya', 'Katwe', 'Kisenyi', 'Bweyogerere',
  'Namugongo', 'Kireka', 'Banda', 'Najjanankumbi', 'Lubowa', 'Mutungo', 'Akright City',
  'Kitende', 'Bwebajja', 'Kajjansi', 'Katabi', 'Nkumba',
] as const;

export const DISTRICT_AREAS: Record<string, string[]> = {
  Kampala: ['Bukoto', 'Ntinda', 'Kololo', 'Muyenga', 'Najjera', 'Kyanja', 'Kisaasi', 'Makindye', 'Kira', 'Naalya', 'Nakasero', 'Bugolobi', 'Naguru', 'Mengo', 'Rubaga', 'Kawempe', 'Wandegeya', 'Kamwokya', 'Katwe', 'Najjanankumbi', 'Lubowa', 'Mutungo', 'Bweyogerere', 'Namugongo', 'Kireka', 'Banda'],
  Wakiso: ['Nansana', 'Bweyogerere', 'Namugongo', 'Kira', 'Kireka', 'Banda', 'Akright City', 'Kitende', 'Bwebajja', 'Kajjansi', 'Katabi', 'Nkumba', 'Buloba', 'Hoima Road', 'Gayaza', 'Kasangati', 'Matugga', 'Nansana Town'],
  Mukono: ['Mukono Town', 'Seeta', 'Namanve', 'Najjembe', 'Kyetume', 'Goma', 'Najjanankumbi', 'Lweza', 'Kigungu', 'Namilyango', 'Kawolo', 'Nyenga'],
  Entebbe: ['Entebbe Town', 'Kigungu', 'Nakiwogo', 'Lugonjo', 'Nkumba', 'Katabi', 'Abaita Ababiri', 'Kiwafwe', 'Bwerenga'],
  Mpigi: ['Mpigi Town', 'Buddo', 'Kammengo', 'Kibibi', 'Buwama', 'Nkozi', 'Kituntu', 'Gombe'],
  Luwero: ['Luwero Town', 'Bombo', 'Wobulenzi', 'Bamunanika', 'Zirobwe', 'Kikyusa', 'Nyimbwa', 'Kasana'],
  Mityana: ['Mityana Town', 'Busujju', 'Maanyi', 'Bulera', 'Ssekanyonyi', 'Ttamu', 'Bulimbi'],
  Mubende: ['Mubende Town', 'Mityana', 'Kibalinga', 'Kiganda', 'Buluya', 'Madudu', 'Kibuye', 'Bageza'],
  Masaka: ['Masaka Town', 'Nyendo', 'Ssenya', 'Kyanamukaaka', 'Bukakata', 'Mukungwe', 'Kabonera', 'Katwe-Butego', 'Kimanya'],
  Jinja: ['Jinja Town', 'Bugembe', 'Njeru', 'Masese', 'Wairaka', 'Mpumudde', 'Walukuba', 'Bugungu', 'Kimaka', 'Nalufenya'],
  Mbale: ['Mbale Town', 'Wanale', 'Industrial Division', 'Nkoma', 'Busamaga', 'Namakwekwe', 'Mooni', 'Cells'],
  Soroti: ['Soroti Town', 'Agriculture Division', 'Eastern Division', 'Western Division', 'Kamod', 'Asuret', 'Opiya'],
  Tororo: ['Tororo Town', 'Nyangoro', 'Mawale', 'Pentagon', 'Ngero', 'Mukuju', 'Osia', 'Kirewa'],
  Iganga: ['Iganga Town', 'Buseywa', 'Nawanyingi', 'Bulamagi', 'Igangaza', 'Namale', 'Nabitende'],
  Busia: ['Busia Town', 'Masafu', 'Buteba', 'Lunyo', 'Budumba', 'Majiya', 'Bwiri'],
  Gulu: ['Gulu Town', 'Layibi', 'Bardege', 'Pece', 'Laroo', 'Bobi', 'Palaro', 'Koro'],
  Lira: ['Lira Town', 'Ojuku', 'Aler', 'Otim', 'Barr', 'Ogur', 'Aromo', 'Agweng'],
  Arua: ['Arua Town', 'Arua Hill', 'River Oli', 'Mvara', 'Biafra', 'Oluko', 'Manibe', 'Aroi'],
  Mbarara: ['Mbarara Town', 'Kakoba', 'Nyamitanga', 'Kamukuzi', 'Ruharo', 'Booma', 'Kashari', 'Nyakayojo'],
  'Fort Portal': ['Fort Portal Town', 'Bukuuku', 'Kicwamba', 'Kabusi', 'Ruteete', 'Kasenda', 'Kiko', 'Karangura'],
  Kasese: ['Kasese Town', 'Bwera', 'Mpondwe', 'Kilembe', 'Katwe', 'Mubuku', 'Bugoyi', 'Nyakiyumbi'],
  Hoima: ['Hoima Town', 'Kiziranfumbi', 'Buhimba', 'Kitoba', 'Busaasi', 'Buhuka', 'Kyangwali'],
  Kabale: ['Kabale Town', 'Kyanamira', 'Kamuganguzi', 'Kitumba', 'Buhara', 'Nyarurambi', 'Kabale Central'],
  Kalangala: ['Kalangala Town', 'Kalangala Landing Site', 'Bubeke', 'Bufumira', 'Mwena'],
  Kayunga: ['Kayunga Town', 'Bbaale', 'Kangulumira', 'Nazigo', 'Busaana', 'Kitimbwa', 'Nabiseke'],
  Buikwe: ['Buikwe Town', 'Njeru', 'Najjembe', 'Lugazi', 'Buwanyi', 'Kiyaya', 'Wakisi'],
  Nakaseke: ['Nakaseke Town', 'Wakyaaya', 'Kikamula', 'Ngoma', 'Kapeeka', 'Sekanyonyi', 'Kasangombe'],
  Sembabule: ['Sembabule Town', 'Lwebitakuli', 'Mateete', 'Mijwala', 'Lugusulu', 'Ntuusi'],
  Gomba: ['Gomba Town', 'Kyegonza', 'Kabulasoke', 'Kanoni', 'Mpenja', 'Maddu'],
  Kamuli: ['Kamuli Town', 'Namasagali', 'Nabwigulu', 'Balawoli', 'Mbulamuti', 'Nankandulo'],
  Pallisa: ['Pallisa Town', 'Agule', 'Apapai', 'Kabwangasi', 'Kakisenge', 'Namale'],
  Bugiri: ['Bugiri Town', 'Buwuni', 'Nankoma', 'Iwemba', 'Kabworo', 'Lugola', 'Nabukalu'],
  Kapchorwa: ['Kapchorwa Town', 'Teryet', 'Kawowo', 'Binyiny', 'Cheptongei', 'Kaserem'],
  Kumi: ['Kumi Town', 'Atutur', 'Kanyum', 'Mukongoro', 'Ongino', 'Nyero', 'Anyara'],
  Sironko: ['Sironko Town', 'Bugwere', 'Budadiri', 'Mafudu', 'Nabongo', 'Bulambuli'],
  Kitgum: ['Kitgum Town', 'Acholibur', 'Mucwini', 'Palabek', 'Lamwo', 'Pader'],
  Moyo: ['Moyo Town', 'Metu', 'Lefori', 'Dufile', 'Laropi', 'Afoji'],
  Apac: ['Apac Town', 'Arocha', 'Chegere', 'Ibuje', 'Kwania', 'Nambesie', 'Apeduru'],
  Adjumani: ['Adjumani Town', 'Pakele', 'Ciforo', 'Dzaipi', 'Adropi', 'Borobo'],
  Nebbi: ['Nebbi Town', 'Pakwach', 'Alwi', 'Kucwiny', 'Nyamir', 'Wadelai', 'Panyimur'],
  Pader: ['Pader Town', 'Lapul', 'Pajule', 'Acholibur', 'Lamwo', 'Lira Palwo'],
  Yumbe: ['Yumbe Town', 'Kululu', 'Drajini', 'Kei', 'Midigo', 'Romogi', 'Odravu'],
  Koboko: ['Koboko Town', 'Midia', 'Kuluba', 'Lobule', 'Abuku', 'Dranya'],
  Bushenyi: ['Bushenyi Town', 'Ishaka', 'Bumbaire', 'Kakanju', 'Kyeizoba', 'Bitooma'],
  Ntungamo: ['Ntungamo Town', 'Rukoni', 'Nyabihoko', 'Itojo', 'Rubare', 'Ruhama', 'Kajara'],
  Kibaale: ['Kibaale Town', 'Kagadi', 'Mpeefu', 'Bwikara', 'Kyanaisoke', 'Nalweyo'],
  Kanungu: ['Kanungu Town', 'Kihiihi', 'Kambuga', 'Nyamirama', 'Butogota', 'Rutenga'],
  Rukungiri: ['Rukungiri Town', 'Buyanja', 'Bwambara', 'Kebisoni', 'Nyakagyeme', 'Kashenshero'],
  Masindi: ['Masindi Town', 'Kigulya', 'Pakanyi', 'Karujubu', 'Miirya', 'Bikoni', 'Bujenje'],
} as const;

export const WAREHOUSE_AMENITIES = [
  'Loading Bay', 'Roller Shutter Door', '24hr Security', 'CCTV', 'Backup Generator',
  'Water', 'Electricity (3-Phase)', 'Borehole', 'Solar Backup', 'Fire Safety System',
  'Office Space', 'Toilets', 'Parking for Trucks', 'Fenced Compound', 'Paved Access Road',
] as const;

export const COMMON_AMENITIES = [
  'Parking', 'Garden', 'Security', 'Water', 'Electricity', 'Garage', 'Pool',
  'AC', 'Balcony', 'Gym', 'WiFi', 'Breakfast', 'Restaurant', 'Bar', 'Furnished',
  'Borehole', 'Solar Backup', 'CCTV', 'Servant Quarters', 'Paved Compound',
] as const;

export const HOTEL_AMENITIES = [
  'Free Wi-Fi', 'Parking', 'Breakfast', 'Restaurant', 'Swimming Pool',
  'Air Conditioning', '24hr Security', 'TV / DSTV', 'En-suite Bathroom',
  'Generator', 'Conference / Events', 'Airport Pickup', 'Spa / Gym', 'In-house Bar',
] as const;

export const GUEST_HOUSE_FACILITIES = [
  'Full Bar', 'Live Music', 'TV / Big Screen', 'Karaoke', 'Food Menu',
  'Parking', 'Security', 'Event Space', 'Free Wi-Fi', 'Outdoor Seating',
  'Games / Pool Table', 'Smoking Area', 'Generator', 'Air Conditioning',
] as const;
