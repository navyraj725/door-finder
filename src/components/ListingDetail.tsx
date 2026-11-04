import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { supabase, type Property } from '@/lib/supabase';
import { CategoryLogo } from './CategoryLogos';
import PropertyMap from './PropertyMap';

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

interface ListingDetailProps {
  propertyId: string | null;
  onClose: () => void;
}

export default function ListingDetail({ propertyId, onClose }: ListingDetailProps) {
  const [prop, setProp] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMedia, setActiveMedia] = useState<{ type: 'photo' | 'video'; url: string } | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    setActiveMedia(null);
    supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single()
      .then(({ data, error }) => {
        if (error) console.error('Detail load error:', error.message);
        setProp((data as Property) || null);
        setLoading(false);
      });
  }, [propertyId]);

  if (!propertyId) return null;

  const photos = prop?.photo_urls || [];
  const videos = prop?.video_urls || [];

  const allMedia: { type: 'photo' | 'video'; url: string }[] = [
    ...videos.map((url) => ({ type: 'video' as const, url })),
    ...photos.map((url) => ({ type: 'photo' as const, url })),
  ];

  const initial = allMedia[0] || null;
  const current = activeMedia || initial;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '720px', padding: '0', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} style={{ zIndex: 10 }}></button>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : !prop ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Listing not found.</div>
        ) : (
          <>
            {/* Main media viewer */}
            <div style={{ background: '#0f172a', position: 'relative', aspectRatio: '16/9', maxHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {current?.type === 'video' ? (
                <video
                  key={current.url}
                  src={current.url}
                  controls
                  autoPlay
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : current?.type === 'photo' ? (
                <img
                  src={current.url}
                  alt={prop.title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ color: 'white', opacity: 0.5, fontSize: '48px' }}>
                  <CategoryLogo category={prop.category} size={64} />
                </div>
              )}
              {allMedia.length > 1 && (
                <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                  {allMedia.indexOf(current) + 1} / {allMedia.length}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {allMedia.length > 1 && (
              <div style={{ display: 'flex', gap: '6px', padding: '10px 16px', overflowX: 'auto', background: 'var(--gray-light)' }}>
                {allMedia.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveMedia(m)}
                    style={{
                      flexShrink: 0,
                      width: '64px', height: '48px',
                      borderRadius: '6px', overflow: 'hidden',
                      border: current === m ? '2px solid var(--navy)' : '2px solid transparent',
                      cursor: 'pointer', padding: 0, background: '#000',
                      position: 'relative',
                    }}
                  >
                    {m.type === 'video' ? (
                      <>
                        <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '16px' }}></span>
                      </>
                    ) : (
                      <img src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            <div style={{ padding: '24px', maxHeight: '40vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CategoryLogo category={prop.category} size={22} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{prop.category}</span>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>{prop.title}</h2>

              {/* Location section */}
              <div style={{ marginBottom: '16px', padding: '14px 16px', background: 'var(--gray-bg)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Location</h3>
                <div style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--text)' }}>
                  <div><strong style={{ color: 'var(--navy)' }}>{prop.district || 'Uganda'}</strong>{prop.area ? `, ${prop.area}` : ''}</div>
                  {prop.street_address && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{prop.street_address}</div>}
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Uganda, East Africa</div>
                </div>
                {prop.latitude && prop.longitude ? (
                  <div style={{ marginTop: '10px' }}>
                    <PropertyMap latitude={prop.latitude} longitude={prop.longitude} title={prop.title} />
                  </div>
                ) : (
                  <div style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--gray-light)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    The owner hasn't pinned an exact location on the map yet. Use the district and area above to find the property, or contact them on WhatsApp for directions.
                  </div>
                )}
              </div>

              {/* Price */}
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--green)', marginBottom: '12px' }}>
                {prop.category === 'Guest Houses'
                  ? prop.entry_fee > 0 ? `${Number(prop.entry_fee).toLocaleString()} UGX entry` : 'Free entry'
                  : prop.price > 0
                    ? `${Number(prop.price).toLocaleString()} UGX${prop.category === 'Hotels' || prop.category === 'Rentals' || prop.category === 'Airbnb' ? '/night' : '/month'}`
                    : 'Price on request'}
              </div>

              {/* Key specs */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {(prop.category === 'Hotels' || prop.category === 'Rentals' || prop.category === 'Airbnb') && (
                  <>
                    {prop.rooms > 0 && <span style={{ fontSize: '14px' }}> {prop.rooms} rooms</span>}
                    {prop.star_rating > 0 && <span style={{ fontSize: '14px' }}> {prop.star_rating} stars</span>}
                  </>
                )}
                {prop.category === 'Guest Houses' && (
                  <>
                    {prop.seating_capacity > 0 && <span style={{ fontSize: '14px' }}> {prop.seating_capacity} seats</span>}
                    {prop.opening_time && <span style={{ fontSize: '14px' }}> {prop.opening_time}</span>}
                  </>
                )}
                {prop.category === 'Warehouses' && (
                  <>
                    {prop.rooms > 0 && <span style={{ fontSize: '14px' }}> {prop.rooms} sqm</span>}
                    {prop.minimum_stay && <span style={{ fontSize: '14px' }}> {prop.minimum_stay}</span>}
                  </>
                )}
                {prop.beds > 0 && <span style={{ fontSize: '14px' }}> {prop.beds} beds</span>}
                {prop.baths > 0 && <span style={{ fontSize: '14px' }}> {prop.baths} baths</span>}
              </div>

              {/* Description */}
              {prop.description && (
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>DESCRIPTION</h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{prop.description}</p>
                </div>
              )}

              {/* Amenities */}
              {prop.amenities && prop.amenities.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>AMENITIES & FEATURES</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {prop.amenities.map((a) => (
                      <span key={a} className="a-tag" style={{ fontSize: '13px' }}>{AMENITY_ICONS[a] || '•'} {a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Media counts */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}> {photos.length} photos</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}> {videos.length} videos</span>
              </div>

              {/* Contact */}
              <div style={{ borderTop: '1px solid var(--gray-light)', paddingTop: '16px' }}>
                <a
                  className="wa-contact-btn"
                  href={`https://wa.me/256${(prop.whatsapp || '700123456').replace(/^0/, '')}?text=Hi%2C+I%27m+interested+in+${encodeURIComponent(prop.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                >
                  <MessageCircle size={16} /> WhatsApp {prop.whatsapp || ''}
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
