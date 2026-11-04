import { useState, useEffect } from 'react';
import {
  type UgandaLocation,
  fetchLocationBySlug,
  fetchChildren,
  fetchLocationsByLevel,
  SEO_CATEGORIES,
  formatUGX,
  buildLocationPath,
  generateFaq,
  generateSeoTitle,
  generateSeoDescription,
} from '@/lib/locations';
import { supabase, type Property } from '@/lib/supabase';

interface LocationDirectoryProps {
  slug: string;
  categorySlug?: string;
  onNavigate: (path: string) => void;
}

export default function LocationDirectory({ slug, categorySlug, onNavigate }: LocationDirectoryProps) {
  const [location, setLocation] = useState<UgandaLocation | null>(null);
  const [children, setChildren] = useState<UgandaLocation[]>([]);
  const [nearby, setNearby] = useState<UgandaLocation[]>([]);
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const loc = await fetchLocationBySlug(slug);
      if (!active || !loc) { setLoading(false); return; }
      setLocation(loc);

      const [childLocs, nearbyLocs] = await Promise.all([
        fetchChildren(loc.id),
        loc.nearby_locations.length > 0
          ? supabase.from('uganda_locations').select('*').in('name', loc.nearby_locations).order('name')
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (!active) return;
      setChildren(childLocs);
      setNearby((nearbyLocs.data as UgandaLocation[]) || []);

      let propQuery = supabase.from('properties').select('*').eq('status', 'available');
      if (categorySlug) {
        const seoCat = SEO_CATEGORIES.find((c) => c.slug === categorySlug);
        if (seoCat) propQuery = propQuery.eq('category', seoCat.dbCategory);
      }
      if (loc.district) propQuery = propQuery.eq('district', loc.district);
      const { data: props } = await propQuery.order('created_at', { ascending: false }).limit(12);
      if (!active) return;
      setListings((props as Property[]) || []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [slug, categorySlug]);

  useEffect(() => {
    if (location) {
      document.title = generateSeoTitle(location, categorySlug);
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', generateSeoDescription(location, categorySlug));
    }
  }, [location, categorySlug]);

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading location data...</div>;
  }

  if (!location) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <h2>Location not found</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>This location page doesn't exist yet.</p>
        <button className="submit-btn green-btn" style={{ marginTop: '16px' }} onClick={() => onNavigate('/browse')}>
          Browse All Listings
        </button>
      </div>
    );
  }

  const faqs = generateFaq(location);
  const catLabel = categorySlug ? SEO_CATEGORIES.find((c) => c.slug === categorySlug)?.label : null;

  const breadcrumb = [
    { label: 'Home', path: '/' },
    { label: 'Uganda', path: '/uganda/' },
  ];
  if (location.region && location.level !== 'region') {
    breadcrumb.push({ label: location.region + ' Region', path: `/uganda/${location.region.toLowerCase().replace(/\s+/g, '-')}/` });
  }
  if (location.district && location.level !== 'district') {
    breadcrumb.push({ label: location.district, path: `/uganda/${location.district.toLowerCase().replace(/\s+/g, '-')}/` });
  }
  breadcrumb.push({ label: catLabel || location.name, path: '#' });

  return (
    <div className="location-directory">
      {/* Breadcrumbs */}
      <nav className="breadcrumbs" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>
        {breadcrumb.map((b, i) => (
          <span key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {i > 0 && <span>›</span>}
            {b.path === '#' ? (
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{b.label}</span>
            ) : (
              <button
                style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', padding: 0, font: 'inherit' }}
                onClick={() => onNavigate(b.path)}
              >
                {b.label}
              </button>
            )}
          </span>
        ))}
      </nav>

      {/* Hero */}
      <div className="loc-hero" style={{ background: 'linear-gradient(135deg, var(--navy) 0%, #1a3a5c 100%)', color: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
          {catLabel ? `${catLabel} in ${location.name}` : `${location.name} ${location.level === 'district' ? 'District' : ''}`}
        </h1>
        <p style={{ fontSize: '15px', opacity: 0.9, maxWidth: '700px', lineHeight: 1.6 }}>
          {location.description || generateSeoDescription(location, categorySlug)}
        </p>
        {location.distance_from_kampala_km !== null && location.distance_from_kampala_km > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', opacity: 0.85 }}>
            <span>{location.distance_from_kampala_km} km from Kampala</span>
            {location.population && <span>{location.population.toLocaleString()} population</span>}
            {location.region && <span>{location.region} Region</span>}
          </div>
        )}
      </div>

      {/* Category tabs */}
      {!categorySlug && (
        <div className="loc-categories" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {SEO_CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              className="tab-btn"
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--gray-light)', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              onClick={() => onNavigate(buildLocationPath(location).replace(/\/$/, '') + '/' + cat.slug)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      <div className="location-main-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '24px', alignItems: 'start' }}>
        {/* Main content */}
        <div>
          {/* Property listings */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
              {catLabel ? `Available ${catLabel}` : 'Latest Property Listings'} in {location.name}
            </h2>
            {listings.length > 0 ? (
              <div className="browse-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {listings.map((p) => (
                  <div key={p.id} className="property-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('/browse')}>
                    <div className="card-media" style={{ background: 'var(--gray-light)' }}>
                      {p.photo_urls && p.photo_urls.length > 0 ? (
                        <img src={p.photo_urls[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center' }}>{p.category}</div>
                      )}
                    </div>
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 700, marginTop: '4px' }}>
                        {p.price > 0 ? `${Number(p.price).toLocaleString()} UGX` : 'Price on request'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', background: 'var(--gray-light)', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No listings available in {location.name} yet. Be the first to post!</p>
                <button className="submit-btn green-btn" style={{ marginTop: '12px' }} onClick={() => onNavigate('/dashboard')}>
                  Post Your Property
                </button>
              </div>
            )}
          </section>

          {/* Local information */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>About {location.name}</h2>
            <div className="location-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
              {location.schools.length > 0 && <InfoCard title="Schools" items={location.schools} />}
              {location.universities.length > 0 && <InfoCard title="Universities" items={location.universities} />}
              {location.hospitals.length > 0 && <InfoCard title="Hospitals & Health Centres" items={location.hospitals} />}
              {location.markets.length > 0 && <InfoCard title="Markets" items={location.markets} />}
              {location.shopping_centres.length > 0 && <InfoCard title="Shopping Centres" items={location.shopping_centres} />}
              {location.banks.length > 0 && <InfoCard title="Banks & ATMs" items={location.banks} />}
              {location.fuel_stations.length > 0 && <InfoCard title="Fuel Stations" items={location.fuel_stations} />}
              {location.police_stations.length > 0 && <InfoCard title="Police Stations" items={location.police_stations} />}
              {location.places_of_worship.length > 0 && <InfoCard title="Places of Worship" items={location.places_of_worship} />}
              {location.hotels_restaurants.length > 0 && <InfoCard title="Hotels & Restaurants" items={location.hotels_restaurants} />}
              {location.major_roads.length > 0 && <InfoCard title="Major Roads" items={location.major_roads} />}
              {location.tourist_attractions.length > 0 && <InfoCard title="Tourist Attractions" items={location.tourist_attractions} />}
            </div>
          </section>

          {/* Transport & Safety */}
          <section style={{ marginBottom: '32px' }}>
            {location.public_transport && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Public Transport</h3>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text)' }}>{location.public_transport}</p>
              </div>
            )}
            {location.safety_info && (
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Safety Information</h3>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text)' }}>{location.safety_info}</p>
              </div>
            )}
          </section>

          {/* Price guide */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Property Price Guide - {location.name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {location.avg_rent_low > 0 && (
                <PriceCard label="House Rent (monthly)" low={location.avg_rent_low} high={location.avg_rent_high} />
              )}
              {location.avg_sale_low > 0 && (
                <PriceCard label="House Sale Price" low={location.avg_sale_low} high={location.avg_sale_high} />
              )}
              {location.avg_apartment_rent_low > 0 && (
                <PriceCard label="Apartment Rent (monthly)" low={location.avg_apartment_rent_low} high={location.avg_apartment_rent_high} />
              )}
              {location.hotel_price_low > 0 && (
                <PriceCard label="Hotel Rate (per night)" low={location.hotel_price_low} high={location.hotel_price_high} />
              )}
            </div>
          </section>

          {/* Interactive map */}
          {location.latitude && location.longitude && (
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Map of {location.name}</h2>
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--gray-light)' }}>
                <iframe
                  title={`Map of ${location.name}`}
                  width="100%"
                  height="300"
                  loading="lazy"
                  style={{ border: 0, display: 'block' }}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.1}%2C${location.latitude - 0.1}%2C${location.longitude + 0.1}%2C${location.latitude + 0.1}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`}
                />
              </div>
            </section>
          )}

          {/* FAQ */}
          {faqs.length > 0 && (
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Frequently Asked Questions about {location.name}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {faqs.map((faq, i) => (
                  <details key={i} style={{ border: '1px solid var(--gray-light)', borderRadius: '8px', padding: '12px 16px' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>{faq.q}</summary>
                    <p style={{ marginTop: '8px', fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)' }}>{faq.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* CTA */}
          <div style={{ background: 'var(--green)', color: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Have a property in {location.name}?</h3>
            <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '12px' }}>List it on DoorFinder and reach thousands of potential clients.</p>
            <button
              onClick={() => onNavigate('/dashboard')}
              style={{ background: 'white', color: 'var(--green)', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
            >
              Post Your Property
            </button>
          </div>

          {/* Child locations */}
          {children.length > 0 && (
            <div style={{ background: 'white', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>Locations within {location.name}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onNavigate(buildLocationPath(c))}
                    style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontSize: '13px', color: 'var(--green)', font: 'inherit' }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nearby locations */}
          {nearby.length > 0 && (
            <div style={{ background: 'white', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>Nearby Locations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {nearby.slice(0, 10).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onNavigate(buildLocationPath(n))}
                    style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontSize: '13px', color: 'var(--green)', font: 'inherit' }}
                  >
                    {n.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All districts quick links */}
          <div style={{ background: 'white', border: '1px solid var(--gray-light)', borderRadius: '12px', padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>Browse by District</h3>
            <DistrictsQuickLinks onNavigate={onNavigate} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ border: '1px solid var(--gray-light)', borderRadius: '10px', padding: '14px' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>{title}</h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: '13px', color: 'var(--text-muted)' }}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

function PriceCard({ label, low, high }: { label: string; low: number; high: number }) {
  return (
    <div style={{ border: '1px solid var(--gray-light)', borderRadius: '10px', padding: '14px' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--green)' }}>
        {formatUGX(low)} - {formatUGX(high)}
      </div>
    </div>
  );
}

function DistrictsQuickLinks({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [districts, setDistricts] = useState<UgandaLocation[]>([]);
  useEffect(() => {
    fetchLocationsByLevel('district').then(setDistricts);
  }, []);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {districts.slice(0, 20).map((d) => (
        <button
          key={d.id}
          onClick={() => onNavigate(buildLocationPath(d))}
          style={{ background: 'var(--gray-light)', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', color: 'var(--text)', font: 'inherit' }}
        >
          {d.name}
        </button>
      ))}
    </div>
  );
}
