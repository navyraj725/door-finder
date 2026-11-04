import { supabase } from '@/lib/supabase';

export interface UgandaLocation {
  id: string;
  name: string;
  slug: string;
  level: string;
  parent_id: string | null;
  region: string | null;
  district: string | null;
  description: string | null;
  population: number | null;
  distance_from_kampala_km: number | null;
  latitude: number | null;
  longitude: number | null;
  nearby_locations: string[];
  schools: string[];
  universities: string[];
  hospitals: string[];
  markets: string[];
  shopping_centres: string[];
  banks: string[];
  fuel_stations: string[];
  police_stations: string[];
  places_of_worship: string[];
  hotels_restaurants: string[];
  major_roads: string[];
  public_transport: string | null;
  tourist_attractions: string[];
  safety_info: string | null;
  avg_rent_low: number;
  avg_rent_high: number;
  avg_sale_low: number;
  avg_sale_high: number;
  avg_apartment_rent_low: number;
  avg_apartment_rent_high: number;
  hotel_price_low: number;
  hotel_price_high: number;
  is_active: boolean;
  created_at: string;
}

export const LOCATION_LEVELS = [
  'region', 'district', 'city', 'county', 'sub_county', 'town_council', 'parish', 'village',
] as const;

export const SEO_CATEGORIES = [
  { slug: 'houses-for-rent', label: 'Houses for Rent', dbCategory: 'Houses' },
  { slug: 'houses-for-sale', label: 'Houses for Sale', dbCategory: 'Houses' },
  { slug: 'apartments', label: 'Apartments', dbCategory: 'Apartments' },
  { slug: 'hotels', label: 'Hotels', dbCategory: 'Hotels' },
  { slug: 'rentals', label: 'Rentals', dbCategory: 'Rentals' },
  { slug: 'guest-houses', label: 'Guest Houses', dbCategory: 'Guest Houses' },
  { slug: 'warehouses', label: 'Warehouses', dbCategory: 'Warehouses' },
  { slug: 'airbnb', label: 'Airbnb', dbCategory: 'Airbnb' },
] as const;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function formatUGX(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M UGX`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}K UGX`;
  return `${amount} UGX`;
}

export async function fetchLocationBySlug(slug: string): Promise<UgandaLocation | null> {
  const { data, error } = await supabase
    .from('uganda_locations')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) console.error('fetchLocationBySlug:', error.message);
  return (data as UgandaLocation) || null;
}

export async function fetchChildren(parentId: string): Promise<UgandaLocation[]> {
  const { data, error } = await supabase
    .from('uganda_locations')
    .select('*')
    .eq('parent_id', parentId)
    .order('name');
  if (error) console.error('fetchChildren:', error.message);
  return (data as UgandaLocation[]) || [];
}

export async function fetchLocationsByLevel(level: string): Promise<UgandaLocation[]> {
  const { data, error } = await supabase
    .from('uganda_locations')
    .select('*')
    .eq('level', level)
    .order('name');
  if (error) console.error('fetchLocationsByLevel:', error.message);
  return (data as UgandaLocation[]) || [];
}

export async function fetchAllLocations(): Promise<UgandaLocation[]> {
  const { data, error } = await supabase
    .from('uganda_locations')
    .select('*')
    .order('name');
  if (error) console.error('fetchAllLocations:', error.message);
  return (data as UgandaLocation[]) || [];
}

export async function searchLocations(query: string): Promise<UgandaLocation[]> {
  const { data, error } = await supabase
    .from('uganda_locations')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(20);
  if (error) console.error('searchLocations:', error.message);
  return (data as UgandaLocation[]) || [];
}

export function buildLocationPath(loc: UgandaLocation): string {
  const parts: string[] = ['uganda'];
  if (loc.region && loc.level !== 'region') parts.push(slugify(loc.region));
  if (loc.district && loc.level !== 'district') parts.push(slugify(loc.district));
  parts.push(loc.slug);
  return '/' + parts.join('/') + '/';
}

export function buildCategoryPath(loc: UgandaLocation, categorySlug: string): string {
  return buildLocationPath(loc).replace(/\/$/, '') + '/' + categorySlug;
}

export function generateSeoTitle(loc: UgandaLocation, category?: string): string {
  const catLabel = category
    ? SEO_CATEGORIES.find((c) => c.slug === category)?.label || ''
    : '';
  if (catLabel) {
    return `${catLabel} in ${loc.name} ${loc.level === 'district' ? 'District' : ''} | DoorFinder Uganda`;
  }
  return `${loc.name} ${loc.level === 'district' ? 'District' : ''} - Property, Hotels & Real Estate | DoorFinder Uganda`;
}

export function generateSeoDescription(loc: UgandaLocation, category?: string): string {
  if (category) {
    const catLabel = SEO_CATEGORIES.find((c) => c.slug === category)?.label || '';
    return `Find ${catLabel.toLowerCase()} in ${loc.name}, ${loc.region || 'Uganda'}. Browse verified property listings, compare prices, and contact owners directly on DoorFinder Uganda.`;
  }
  return `Discover ${loc.name} ${loc.level === 'district' ? 'District' : ''} with DoorFinder Uganda. Find houses, apartments, hotels, and real estate for rent and sale. Explore schools, hospitals, markets, and local information.`;
}

export function generateKeywords(loc: UgandaLocation): string {
  const base = [
    `${loc.name} property`, `${loc.name} real estate`, `${loc.name} houses`,
    `${loc.name} apartments`, `${loc.name} hotels`, `${loc.name} rent`,
    `${loc.name} for sale`, 'Uganda property', 'DoorFinder',
  ];
  if (loc.district && loc.district !== loc.name) base.push(`${loc.district} property`);
  if (loc.region) base.push(`${loc.region} Uganda property`);
  return base.join(', ');
}

export function generateFaq(loc: UgandaLocation): { q: string; a: string }[] {
  const faqs: { q: string; a: string }[] = [];

  if (loc.avg_rent_low > 0) {
    faqs.push({
      q: `What is the average house rent in ${loc.name}?`,
      a: `House rents in ${loc.name} typically range from ${formatUGX(loc.avg_rent_low)} to ${formatUGX(loc.avg_rent_high)} per month, depending on size, location, and amenities.`,
    });
  }

  if (loc.avg_sale_low > 0) {
    faqs.push({
      q: `How much does it cost to buy a house in ${loc.name}?`,
      a: `House prices in ${loc.name} range from approximately ${formatUGX(loc.avg_sale_low)} to ${formatUGX(loc.avg_sale_high)}, depending on location, land size, and property type.`,
    });
  }

  if (loc.avg_apartment_rent_low > 0) {
    faqs.push({
      q: `What are apartment rental prices in ${loc.name}?`,
      a: `Apartment rents in ${loc.name} range from ${formatUGX(loc.avg_apartment_rent_low)} to ${formatUGX(loc.avg_apartment_rent_high)} per month.`,
    });
  }

  if (loc.hotel_price_low > 0) {
    faqs.push({
      q: `What is the price range for hotels in ${loc.name}?`,
      a: `Hotel rates in ${loc.name} range from ${formatUGX(loc.hotel_price_low)} to ${formatUGX(loc.hotel_price_high)} per night, depending on the hotel category and season.`,
    });
  }

  if (loc.distance_from_kampala_km !== null) {
    faqs.push({
      q: `How far is ${loc.name} from Kampala?`,
      a: `${loc.name} is approximately ${loc.distance_from_kampala_km} km from Kampala${loc.distance_from_kampala_km > 0 ? `, about ${Math.ceil(loc.distance_from_kampala_km / 60)} hours by road` : ''}.`,
    });
  }

  if (loc.population && loc.population > 0) {
    faqs.push({
      q: `What is the population of ${loc.name}?`,
      a: `The population of ${loc.name} is approximately ${loc.population.toLocaleString()} people.`,
    });
  }

  if (loc.safety_info) {
    faqs.push({
      q: `Is ${loc.name} safe for visitors and residents?`,
      a: loc.safety_info,
    });
  }

  faqs.push({
    q: `How can I list my property in ${loc.name}?`,
    a: `You can list your property in ${loc.name} on DoorFinder Uganda by creating an account, choosing a subscription plan, and posting your listing. It takes just a few minutes to reach thousands of potential clients.`,
  });

  return faqs;
}

export function generateSchemaOrg(loc: UgandaLocation, category?: string): object {
  const faqs = generateFaq(loc);
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: loc.name,
    description: loc.description || generateSeoDescription(loc, category),
    address: {
      '@type': 'PostalAddress',
      addressRegion: loc.region || undefined,
      addressCountry: 'UG',
    },
  };

  if (loc.latitude && loc.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: loc.latitude,
      longitude: loc.longitude,
    };
  }

  if (faqs.length > 0) {
    schema.mainEntity = faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    }));
  }

  return schema;
}
