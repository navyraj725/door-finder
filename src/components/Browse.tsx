import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { MessageCircle, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, type Property, type FeaturedListing, type AdminAd, PROPERTY_CATEGORIES, UGANDA_DISTRICTS } from '@/lib/supabase';
import { CategoryLogo } from './CategoryLogos';
import ListingDetail from './ListingDetail';

const AMENITY_ICONS: Record<string, string> = {
  Parking: '', Garden: '', Security: '', Water: '', Electricity: '',
  Garage: '', Pool: '', AC: '', Balcony: '', Gym: '', WiFi: '',
  Breakfast: '', Restaurant: '', Bar: '', Furnished: '', Borehole: '',
  'Solar Backup': '', CCTV: '', 'Servant Quarters': '', 'Paved Compound': '',
  'Free Wi-Fi': '', 'Swimming Pool': '', 'Air Conditioning': '', '24hr Security': '',
  'TV / DSTV': '', 'En-suite Bathroom': '', Generator: '', 'Conference / Events': '',
  'Airport Pickup': '', 'Spa / Gym': '', 'In-house Bar': '',
  'Full Bar': '', 'Live Music': '', 'TV / Big Screen': '', 'Karaoke': '',
  'Food Menu': '', 'Event Space': '', 'Outdoor Seating': '',
  'Games / Pool Table': '', 'Smoking Area': '',
};

interface BrowseProps {
  onRequireAuth: () => void;
  isLoggedIn: boolean;
}

const CAT_META = [
  {
    key: 'All',
    label: 'All Listings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
    ),
    active: '#1B2B4B',
    pill: '#EEF1F7',
  },
  {
    key: 'Houses',
    label: 'Houses',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
    ),
    active: '#2DBD4E',
    pill: '#E6F7EC',
  },
  {
    key: 'Apartments',
    label: 'Apartments',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="18" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>
    ),
    active: '#2563EB',
    pill: '#E8EEFE',
  },
  {
    key: 'Hotels',
    label: 'Hotels',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 22v-5h4v5"/><path d="M2 17V7l10-5 10 5v10"/><path d="M2 17h20"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M10 14h.01M14 14h.01M18 14h.01"/></svg>
    ),
    active: '#7C3AED',
    pill: '#F3EEFE',
  },
  {
    key: 'Rentals',
    label: 'Rentals',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
    ),
    active: '#0D9488',
    pill: '#E0F5F2',
  },
  {
    key: 'Guest Houses',
    label: 'Guest Houses',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22V4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v18Z"/><path d="M2 14h16"/><path d="M6 14v8"/><path d="M10 14v8"/><path d="M14 14v8"/><path d="M18 6h3a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-3"/></svg>
    ),
    active: '#DB2777',
    pill: '#FCE7F1',
  },
  {
    key: 'Warehouses',
    label: 'Warehouses',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l14-7a2 2 0 0 1 3 1.65v.5"/><path d="M6 18h12"/><path d="M6 14h12"/><path d="M6 10h12"/></svg>
    ),
    active: '#D97706',
    pill: '#FEF3D8',
  },
  {
    key: 'Airbnb',
    label: 'Airbnb',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3C9 3 7 6 6 10C5 14 4 18 4 21C4 22 5 23 6 23C8 23 10 21 12 17C14 21 16 23 18 23C19 23 20 22 20 21C20 18 19 14 18 10C17 6 15 3 12 3Z"/><path d="M12 7C11 7 10 9 9 12C8 15 8 18 8 19C8 20 9 20 10 19C11 18 12 16 12 13C12 16 13 18 14 19C15 20 16 20 16 19C16 18 16 15 15 12C14 9 13 7 12 7Z"/></svg>
    ),
    active: '#FF5A5F',
    pill: '#FFF1F2',
  },
];

export default function Browse({ isLoggedIn }: BrowseProps) {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [featured, setFeatured] = useState<FeaturedListing[]>([]);
  const [ads, setAds] = useState<AdminAd[]>([]);
  const [category, setCategory] = useState<string>('All');
  const [district, setDistrict] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeAd, setActiveAd] = useState<AdminAd | null>(null);
  const resultsRef = useRef<HTMLElement>(null);

  function selectCategory(nextCategory: string) {
    setCategory(nextCategory);
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  useEffect(() => {
    async function load() {
      const [{ data: propsData, error: pErr }, { data: featData, error: fErr }, { data: adsData, error: aErr }] = await Promise.all([
        supabase.from('properties').select('*').order('created_at', { ascending: false }),
        supabase.from('featured_listings').select('*').eq('status', 'active'),
        supabase.from('admin_ads').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      ]);
      if (pErr) console.error('Properties error:', pErr.message);
      if (fErr) console.error('Featured error:', fErr.message);
      if (aErr) console.error('Ads error:', aErr.message);
      setProperties((propsData as Property[]) || []);
      setFeatured((featData as FeaturedListing[]) || []);
      setAds((adsData as AdminAd[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const featuredIds = new Set(featured.map((f) => f.property_id));

  let filtered = properties;
  if (category !== 'All') filtered = filtered.filter((p) => p.category === category);
  if (district) filtered = filtered.filter((p) => p.district === district);

  // Price range filter — uses the relevant price field per category
  if (priceRange !== 'all') {
    filtered = filtered.filter((p) => {
      const price = p.category === 'Guest Houses' ? p.entry_fee : p.price;
      if (priceRange === 'under300') return price > 0 && price < 300000;
      if (priceRange === '300to600') return price >= 300000 && price < 600000;
      if (priceRange === '600to1m') return price >= 600000 && price < 1000000;
      if (priceRange === 'above1m') return price >= 1000000;
      return true;
    });
  }

  filtered = [...filtered].sort((a, b) => {
    const af = featuredIds.has(a.id) ? 1 : 0;
    const bf = featuredIds.has(b.id) ? 1 : 0;
    return bf - af;
  });

  function priceLabel(p: Property): string {
    if (p.category === 'Guest Houses') {
      if (p.entry_fee > 0) return `${Number(p.entry_fee).toLocaleString()} <span>UGX entry</span>`;
      return '<span>Free entry</span>';
    }
    if (p.category === 'Hotels' || p.category === 'Rentals' || p.category === 'Airbnb') {
      return p.price > 0 ? `${Number(p.price).toLocaleString()} <span>UGX/night</span>` : '<span>Price on request</span>';
    }
    if (p.category === 'Warehouses') {
      return p.price > 0 ? `${Number(p.price).toLocaleString()} <span>UGX/month</span>` : '<span>Price on request</span>';
    }
    return p.price > 0 ? `${Number(p.price).toLocaleString()} <span>UGX/month</span>` : '<span>Price on request</span>';
  }

  function metaLabel(p: Property): string[] {
    const items: string[] = [];
    if (p.category === 'Hotels' || p.category === 'Rentals' || p.category === 'Airbnb') {
      if (p.rooms > 0) items.push(` ${p.rooms} rooms`);
      if (p.star_rating > 0) items.push(` ${p.star_rating}`);
    } else if (p.category === 'Guest Houses') {
      if (p.seating_capacity > 0) items.push(` ${p.seating_capacity} seats`);
      if (p.opening_time) items.push(` ${p.opening_time}`);
    }
    return items;
  }

  function locationText(p: Property): { primary: string; secondary: string } {
    const area = p.area || '';
    const district = p.district || '';
    if (area && district) {
      return { primary: district, secondary: area };
    } else if (district) {
      return { primary: district, secondary: '' };
    }
    return { primary: 'Uganda', secondary: '' };
  }

  return (
    <>
      <div className="hero-banner">
        <h1>Find Your Next Home, Stay or Vibe in Uganda</h1>
        <p>Houses, Apartments, Hotels &amp; Guest Houses — all in one place. Browse verified listings across Kampala and all districts of Uganda.</p>
        <div className="search-bar">
          <div className="search-field">
            <select value={category} onChange={(e) => selectCategory(e.target.value)}>
              <option value="All">All Categories</option>
              {PROPERTY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="search-field" style={{ borderRight: 'none' }}>
            <select value={district} onChange={(e) => setDistrict(e.target.value)}>
              <option value="">All Districts</option>
              {UGANDA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button className="search-btn">Search</button>
        </div>
      </div>

      <div className="cat-pill-nav">
        {CAT_META.map(({ key, label, icon, active, pill }) => (
          <button
            key={key}
            className={`cat-pill ${category === key ? 'cat-pill--on' : ''}`}
            style={category === key ? { background: active, borderColor: active } : { '--cat-hover': active } as CSSProperties}
            data-pill={pill}
            onClick={() => selectCategory(key)}
          >
            <span className="cat-pill-icon">{icon}</span>
            <span className="cat-pill-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="price-range-bar">
        <span className="price-range-label">Price:</span>
        {[
          { key: 'all', label: 'All Prices' },
          { key: 'under300', label: 'Under 300K UGX' },
          { key: '300to600', label: '300K – 600K UGX' },
          { key: '600to1m', label: '600K – 1M UGX' },
          { key: 'above1m', label: 'Above 1M UGX' },
        ].map((r) => (
          <button
            key={r.key}
            className={`price-pill ${priceRange === r.key ? 'active' : ''}`}
            onClick={() => setPriceRange(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="loc-quick-links" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '12px 0', borderBottom: '1px solid var(--gray-light)', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', alignSelf: 'center' }}>Browse by Location:</span>
        {['Kampala', 'Wakiso', 'Jinja', 'Mbarara', 'Gulu', 'Mbale', 'Kabale', 'Masaka', 'Arua', 'Lira'].map((d) => (
          <button
            key={d}
            onClick={() => navigate(`/uganda/central/${d.toLowerCase().replace(/\s+/g, '-')}`)}
            style={{ background: 'var(--gray-light)', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', color: 'var(--text)', font: 'inherit' }}
          >
            {d}
          </button>
        ))}
      </div>

      <section className="section" ref={resultsRef}>
        <div className="section-header">
          <div className="section-icon" style={{ background: 'var(--green-light)' }}>
            {category === 'All' ? '' : <CategoryLogo category={category} size={28} />}
          </div>
          <h2 className="section-title">
            {category === 'All' ? 'All Listings' : category}
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '8px' }}>
              ({filtered.length})
            </span>
          </h2>
        </div>

        {ads.length > 0 && (
          <div className="admin-ads-section" style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ background: 'var(--navy)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>AD</span>
              Sponsored
            </div>
            <div className="property-grid">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="property-card"
                  style={{ cursor: 'pointer', border: '2px solid var(--navy)' }}
                  onClick={() => setActiveAd(ad)}
                >
                  <div className="card-media" style={{ background: 'var(--gray-light)' }}>
                    {ad.poster_url ? (
                      <img
                        src={ad.poster_url}
                        alt={ad.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <span style={{ fontSize: '42px' }}></span>
                      </div>
                    )}
                    {ad.video_url && (
                      <div className="card-badges">
                        <span className="badge videos"> Video</span>
                      </div>
                    )}
                  </div>
                  <div className="card-body">
                    <div className="card-location" style={{ fontWeight: 700 }}>{ad.title}</div>
                    {ad.description && (
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {ad.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="empty-state"><div className="empty-icon"></div><div className="empty-text">Loading listings...</div></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon"></div><div className="empty-text">No listings found. Try a different category or district.</div></div>
        ) : (
          <div className="property-grid">
            {filtered.map((p) => {
              const isFeatured = featuredIds.has(p.id);
              const isExpired = p.expires_at && new Date(p.expires_at) < new Date();
              const meta = metaLabel(p);
              return (
                <div
                  key={p.id}
                  className={`property-card ${isFeatured ? 'featured-strip' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedId(p.id)}
                >
                  <div className="card-media" style={{ background: 'var(--gray-light)' }}>
                    <div className="card-badges">
                      {p.photos_count > 0 && <span className="badge photos"> {p.photos_count}</span>}
                      {p.videos_count > 0 && <span className="badge videos"> {p.videos_count}</span>}
                      {isFeatured && <span className="badge featured"> Featured</span>}
                    </div>
                    {p.photo_urls && p.photo_urls.length > 0 ? (
                      <img
                        src={p.photo_urls[0]}
                        alt={p.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                      />
                    ) : (
                      <>
                        <div style={{ marginTop: '4px' }}><CategoryLogo category={p.category} size={42} /></div>
                        <div className="media-label">{p.category}</div>
                      </>
                    )}
                  </div>
                  <div className="card-body">
                    <div className="card-meta">
                      {meta.map((m, i) => <span key={i} className="meta-item">{m}</span>)}
                    </div>
                  </div>
                  <div className="card-location">{p.title}</div>
                  <div className="card-location-text">
                    <span className="loc-primary">{locationText(p).primary}</span>
                    {locationText(p).secondary && <span className="loc-secondary"> • {locationText(p).secondary}</span>}
                    {p.latitude && p.longitude && <span className="loc-secondary" style={{ color: 'var(--green)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}> • <MapPin size={12} /> Directions available</span>}
                  </div>
                  <div className="card-amenities">
                    {(p.amenities || []).slice(0, 4).map((a) => (
                      <span key={a} className="a-tag">{AMENITY_ICONS[a] || ''} {a}</span>
                    ))}
                  </div>
                  <div className="card-price" dangerouslySetInnerHTML={{ __html: priceLabel(p) }} />
                  <div className="card-wa-row" onClick={(e) => e.stopPropagation()}>
                    <a
                      className="wa-contact-btn"
                      href={`https://wa.me/256${(p.whatsapp || '700123456').replace(/^0/, '')}?text=Hi%2C+I%27m+interested+in+${encodeURIComponent(p.title)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                    {p.whatsapp && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {p.whatsapp}
                      </span>
                    )}
                    {isExpired && <span className="badge" style={{ background: '#FEE2E2', color: '#991B1B' }}>Expired</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ListingDetail propertyId={selectedId} onClose={() => setSelectedId(null)} />

      {activeAd && (
        <div className="modal-overlay" onClick={() => setActiveAd(null)}>
          <div className="modal-box" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveAd(null)}></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ background: 'var(--navy)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px' }}>SPONSORED</span>
            </div>
            <h3 style={{ marginBottom: '8px' }}>{activeAd.title}</h3>
            {activeAd.poster_url && (
              <img
                src={activeAd.poster_url}
                alt={activeAd.title}
                style={{ width: '100%', borderRadius: '12px', marginBottom: '16px', maxHeight: '400px', objectFit: 'cover' }}
              />
            )}
            {activeAd.video_url && (
              <video
                src={activeAd.video_url}
                controls
                style={{ width: '100%', borderRadius: '12px', marginBottom: '16px', maxHeight: '400px' }}
              />
            )}
            {activeAd.description && (
              <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{activeAd.description}</p>
            )}
            {activeAd.link_url && (
              <a
                href={activeAd.link_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-block', marginTop: '16px',
                  background: 'var(--navy)', color: 'white', fontWeight: 600,
                  padding: '12px 24px', borderRadius: '8px', textDecoration: 'none',
                }}
              >
                Learn More
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
