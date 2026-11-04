import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, type AdminSettings, type Subscription, type Payment, type FeaturedListing, type Profile, type AdminAd, type Property, type ScamReport } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import AdForm from './AdForm';
import { type UgandaLocation, fetchLocationsByLevel, fetchChildren, fetchLocationsByLevel as fetchByLevel } from '@/lib/locations';

interface AdminDashboardProps {
  settings: AdminSettings | null;
  onSettingsChange: () => void;
}

type Section = 'overview' | 'properties' | 'users' | 'subscriptions' | 'payments' | 'reports' | 'scam_reports' | 'locations' | 'featured' | 'ads' | 'settings';

export default function AdminDashboard({ settings, onSettingsChange }: AdminDashboardProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = 'Admin Dashboard — Door Finder Uganda';
    const meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      const m = document.createElement('meta');
      m.name = 'robots';
      m.content = 'noindex, nofollow';
      document.head.appendChild(m);
    } else {
      meta.setAttribute('content', 'noindex, nofollow');
    }
  }, []);

  useEffect(() => {
    if (!profile || profile.role !== 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [profile, navigate]);

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  const navItems: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: '' },
    { key: 'properties', label: 'Properties', icon: '' },
    { key: 'users', label: 'Users', icon: '' },
    { key: 'subscriptions', label: 'Subscriptions', icon: '' },
    { key: 'payments', label: 'Payments', icon: '' },
    { key: 'reports', label: 'Property Reports', icon: '' },
    { key: 'scam_reports', label: 'Scam Reports', icon: '' },
    { key: 'locations', label: 'Locations', icon: <MapPin size={16} /> },
    { key: 'featured', label: 'Featured', icon: '' },
    { key: 'ads', label: 'Advertisements', icon: '' },
    { key: 'settings', label: 'Settings', icon: '' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? '240px' : '0',
          overflow: 'hidden',
          transition: 'width 0.2s',
          background: '#0f172a',
          color: 'white',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 100,
          flexShrink: 0,
        }}
        className="admin-sidebar"
      >
        <div style={{ padding: '20px', whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px' }}>
            <strong>Door</strong>Finder <span style={{ fontSize: '12px', opacity: 0.6 }}>Admin</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '24px' }}>
            {profile.email}
          </div>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => { setSection(item.key); setSidebarOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '10px 14px', marginBottom: '2px',
                background: section === item.key ? '#1e293b' : 'transparent',
                border: 'none', color: section === item.key ? '#2DBD4E' : '#cbd5e1',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer', borderRadius: '8px',
                textAlign: 'left', font: 'inherit',
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
          <button
            onClick={() => { signOut(); navigate('/'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '10px 14px', marginTop: '16px',
              background: 'transparent', border: 'none', color: '#f87171',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer', borderRadius: '8px',
              textAlign: 'left', font: 'inherit',
            }}
          >
            <span style={{ fontSize: '16px' }}></span> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: sidebarOpen ? '0' : '0', transition: 'margin-left 0.2s', width: '100%' }}>
        {/* Top bar */}
        <div style={{
          background: 'white', padding: '12px 20px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', padding: '4px' }}
          >
            
          </button>
          <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0, flex: 1 }}>
            {navItems.find((n) => n.key === section)?.label}
          </h1>
          <a
            href="/"
            target="_blank"
            style={{ fontSize: '13px', color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}
          >
            View Site 
          </a>
        </div>

        {/* Section content */}
        <div style={{ padding: '24px', maxWidth: '1200px' }}>
          {section === 'overview' && <OverviewSection />}
          {section === 'properties' && <PropertiesSection />}
          {section === 'users' && <UsersSection />}
          {section === 'subscriptions' && <SubscriptionsSection />}
          {section === 'payments' && <PaymentsSection />}
          {section === 'reports' && <ReportsSection />}
          {section === 'scam_reports' && <ScamReportsSection />}
          {section === 'locations' && <LocationsSection />}
          {section === 'featured' && <FeaturedSection />}
          {section === 'ads' && <AdsSection settings={settings} onSettingsChange={onSettingsChange} />}
          {section === 'settings' && <SettingsSection settings={settings} onSettingsChange={onSettingsChange} />}
        </div>
      </div>
    </div>
  );
}

/* ==================== OVERVIEW ==================== */
function OverviewSection() {
  const [stats, setStats] = useState({
    totalUsers: 0, totalLandlords: 0, totalProperties: 0, activeListings: 0,
    expiredListings: 0, pendingListings: 0, reportedListings: 0,
    activeSubscriptions: 0, totalRevenue: 0,
  });
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [recentProps, setRecentProps] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [usersRes, propsRes, subsRes, payRes, reportsRes, landlordsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('properties').select('*').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*').eq('status', 'active'),
        supabase.from('payments').select('*').eq('status', 'verified'),
        supabase.from('property_reports').select('*').eq('status', 'pending'),
        supabase.from('properties').select('user_id'),
      ]);
      const users = (usersRes.data as Profile[]) || [];
      const props = (propsRes.data as Property[]) || [];
      const subs = (subsRes.data as Subscription[]) || [];
      const pays = (payRes.data as Payment[]) || [];
      const reports = reportsRes.data || [];
      const landlordIds = new Set(((landlordsRes.data as { user_id: string }[]) || []).map((p) => p.user_id));

      const now = new Date();
      setStats({
        totalUsers: users.length,
        totalLandlords: landlordIds.size,
        totalProperties: props.length,
        activeListings: props.filter((p) => p.status === 'available' && (!p.expires_at || new Date(p.expires_at) > now)).length,
        expiredListings: props.filter((p) => p.expires_at && new Date(p.expires_at) < now).length,
        pendingListings: props.filter((p) => p.status === 'pending').length,
        reportedListings: reports.length,
        activeSubscriptions: subs.length,
        totalRevenue: pays.reduce((sum, p) => sum + Number(p.amount), 0),
      });
      setRecentUsers(users.slice(0, 5));
      setRecentProps(props.slice(0, 5));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading dashboard...</div>;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '', color: '#3b82f6' },
    { label: 'Landlords', value: stats.totalLandlords, icon: '', color: '#8b5cf6' },
    { label: 'Total Properties', value: stats.totalProperties, icon: '', color: '#10b981' },
    { label: 'Active Listings', value: stats.activeListings, icon: '', color: '#22c55e' },
    { label: 'Expired Listings', value: stats.expiredListings, icon: '', color: '#f59e0b' },
    { label: 'Pending Listings', value: stats.pendingListings, icon: '', color: '#eab308' },
    { label: 'Reported Listings', value: stats.reportedListings, icon: '', color: '#ef4444' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: '', color: '#06b6d4' },
    { label: 'Revenue (UGX)', value: stats.totalRevenue.toLocaleString(), icon: '', color: '#10b981' },
  ];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {statCards.map((s) => (
          <div key={s.label} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                {s.icon}
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#1e293b' }}>Recent Registrations</h3>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {recentUsers.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No users yet.</div>
            ) : recentUsers.map((u, i) => (
              <div key={u.id} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: i < recentUsers.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#0369a1' }}>
                  {(u.full_name || u.email).charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{u.full_name || u.email}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{u.email} • {new Date(u.created_at).toLocaleDateString()}</div>
                </div>
                {u.role === 'admin' && <span style={{ fontSize: '10px', fontWeight: 700, background: '#0f172a', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>ADMIN</span>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#1e293b' }}>Recent Property Submissions</h3>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {recentProps.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No properties yet.</div>
            ) : recentProps.map((p, i) => (
              <div key={p.id} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: i < recentProps.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                  
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{p.category} • {p.area || p.district} • {new Date(p.created_at).toLocaleDateString()}</div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: p.status === 'available' ? '#dcfce7' : '#fef3c7', color: p.status === 'available' ? '#166534' : '#92400e' }}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ==================== PROPERTIES ==================== */
function PropertiesSection() {
  const [properties, setProperties] = useState<(Property & { profiles?: { email: string; full_name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('properties')
        .select('*, profiles!inner(email, full_name)')
        .order('created_at', { ascending: false });
      if (error) console.error(error.message);
      setProperties((data as (Property & { profiles: { email: string; full_name: string } })[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = properties.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.area?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterDistrict && p.district !== filterDistrict) return false;
    return true;
  });

  async function updateStatus(id: string, status: string) {
    await supabase.from('properties').update({ status }).eq('id', id);
    setProperties((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
  }

  async function deleteProperty(id: string) {
    if (!confirm('Delete this property? This cannot be undone.')) return;
    await supabase.from('properties').delete().eq('id', id);
    setProperties((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading properties...</div>;

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <input placeholder="Search properties..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: '200px', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
          <option value="">All Categories</option>
          {['Houses', 'Apartments', 'Hotels', 'Rentals', 'Guest Houses', 'Warehouses'].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="rented">Rented</option>
          <option value="sold">Sold</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
          <option value="">All Districts</option>
          {['Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Mbarara', 'Gulu', 'Mbale', 'Kabale', 'Masaka', 'Arua', 'Lira'].map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>{filtered.length} properties found</div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div className="admin-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Title</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Category</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Location</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Owner</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Expiry</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isExpired = p.expires_at && new Date(p.expires_at) < new Date();
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{p.category}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{p.area || p.district || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{p.profiles?.email || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: isExpired ? '#fee2e2' : p.status === 'available' ? '#dcfce7' : '#fef3c7', color: isExpired ? '#991b1b' : p.status === 'available' ? '#166534' : '#92400e' }}>
                        {isExpired ? 'expired' : p.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {p.status !== 'available' && (
                          <button onClick={() => updateStatus(p.id, 'available')} style={actionBtn('#dcfce7', '#166534')}>Approve</button>
                        )}
                        {p.status !== 'suspended' && (
                          <button onClick={() => updateStatus(p.id, 'suspended')} style={actionBtn('#fef3c7', '#92400e')}>Suspend</button>
                        )}
                        <button onClick={() => deleteProperty(p.id)} style={actionBtn('#fee2e2', '#991b1b')}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ==================== USERS ==================== */
function UsersSection() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setUsers((data as Profile[]) || []);
      setLoading(false);
    });
  }, []);

  async function updateRole(id: string, role: Extract<Profile['role'], 'admin' | 'tenant' | 'landlord'>) {
    const { error } = await supabase.rpc('set_profile_role', { p_user_id: id, p_role: role });
    if (error) return;
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
  }

  const filtered = users.filter((u) =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading users...</div>;

  return (
    <>
      <input placeholder="Search users by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '20px' }} />
      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>{filtered.length} users</div>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div className="admin-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Name</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Email</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>WhatsApp</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Role</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Joined</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>{u.full_name || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{u.email}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{u.whatsapp || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: u.role === 'admin' ? '#0f172a' : '#e0f2fe', color: u.role === 'admin' ? 'white' : '#0369a1' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      {u.role !== 'admin' ? (
                        <button onClick={() => updateRole(u.id, 'admin')} style={actionBtn('#e0e7ff', '#3730a3')}>Make Admin</button>
                      ) : (
                        <button onClick={() => updateRole(u.id, 'tenant')} style={actionBtn('#f1f5f9', '#475569')}>Remove Admin</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ==================== SUBSCRIPTIONS ==================== */
function SubscriptionsSection() {
  const [subs, setSubs] = useState<(Subscription & { profiles: Profile })[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('subscriptions').select('*, profiles!inner(*)').order('created_at', { ascending: false }).then(({ data }) => {
      setSubs((data as (Subscription & { profiles: Profile })[]) || []);
      setLoading(false);
    });
  }, []);

  const filtered = filter === 'all' ? subs : subs.filter((s) => s.status === filter);

  async function extend(id: string, days: number) {
    const sub = subs.find((s) => s.id === id);
    if (!sub?.expiry_date) return;
    const newExpiry = new Date(new Date(sub.expiry_date).getTime() + days * 86400000).toISOString();
    await supabase.from('subscriptions').update({ expiry_date: newExpiry, status: 'active' }).eq('id', id);
    setSubs((prev) => prev.map((s) => s.id === id ? { ...s, expiry_date: newExpiry, status: 'active' } : s));
  }

  async function cancel(id: string) {
    if (!confirm('Cancel this subscription?')) return;
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', id);
    setSubs((prev) => prev.map((s) => s.id === id ? { ...s, status: 'cancelled' } : s));
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>;

  return (
    <>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {['all', 'active', 'expired', 'cancelled'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: filter === f ? '#1e293b' : 'white',
            color: filter === f ? 'white' : '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div className="admin-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>User</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Plan</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Paid</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Expiry</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>{s.profiles?.full_name || s.profiles?.email}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{s.plan_type}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{Number(s.price_paid).toLocaleString()} UGX</td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>{s.expiry_date ? new Date(s.expiry_date).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: s.status === 'active' ? '#dcfce7' : s.status === 'expired' ? '#fee2e2' : '#f1f5f9', color: s.status === 'active' ? '#166534' : s.status === 'expired' ? '#991b1b' : '#475569' }}>{s.status}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button onClick={() => extend(s.id, 30)} style={actionBtn('#dcfce7', '#166534')}>+30d</button>
                      <button onClick={() => extend(s.id, 180)} style={actionBtn('#e0f2fe', '#0369a1')}>+180d</button>
                      {s.status === 'active' && <button onClick={() => cancel(s.id)} style={actionBtn('#fee2e2', '#991b1b')}>Cancel</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ==================== PAYMENTS ==================== */
function PaymentsSection() {
  const [payments, setPayments] = useState<(Payment & { profiles: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('payments').select('*, profiles!inner(*)').order('created_at', { ascending: false }).then(({ data }) => {
      setPayments((data as (Payment & { profiles: Profile })[]) || []);
      setLoading(false);
    });
  }, []);

  async function verify(id: string) {
    await supabase.from('payments').update({ status: 'verified' }).eq('id', id);
    setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: 'verified' } : p));
  }
  async function decline(id: string) {
    await supabase.from('payments').update({ status: 'declined' }).eq('id', id);
    setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: 'declined' } : p));
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>;

  const totalRevenue = payments.filter((p) => p.status === 'verified').reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <>
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Total Verified Revenue</div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>{totalRevenue.toLocaleString()} UGX</div>
      </div>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div className="admin-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Date</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>User</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Type</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Amount</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Reference</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>{p.profiles?.email}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b', textTransform: 'capitalize' }}>{p.type}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{Number(p.amount).toLocaleString()} UGX</td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>{p.reference || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: p.status === 'verified' ? '#dcfce7' : p.status === 'pending' ? '#fef3c7' : '#fee2e2', color: p.status === 'verified' ? '#166534' : p.status === 'pending' ? '#92400e' : '#991b1b' }}>{p.status}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {p.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button onClick={() => verify(p.id)} style={actionBtn('#dcfce7', '#166534')}>Verify</button>
                        <button onClick={() => decline(p.id)} style={actionBtn('#fee2e2', '#991b1b')}>Decline</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ==================== REPORTS ==================== */
function ReportsSection() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('property_reports').select('*, properties(title, category), profiles(email, full_name)').order('created_at', { ascending: false }).then(({ data }) => {
      setReports(data || []);
      setLoading(false);
    });
  }, []);

  async function updateStatus(id: string, status: string) {
    await supabase.from('property_reports').update({ status }).eq('id', id);
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>;

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      {reports.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No reports found.</div>
      ) : (
        <div className="admin-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Property</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Reason</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Reporter</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Date</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>{r.properties?.title || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{r.reason}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{r.profiles?.email || 'Anonymous'}</td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: r.status === 'pending' ? '#fef3c7' : r.status === 'resolved' ? '#dcfce7' : '#fee2e2', color: r.status === 'pending' ? '#92400e' : r.status === 'resolved' ? '#166534' : '#991b1b' }}>{r.status}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      {r.status === 'pending' && <button onClick={() => updateStatus(r.id, 'resolved')} style={actionBtn('#dcfce7', '#166534')}>Resolve</button>}
                      {r.status !== 'dismissed' && <button onClick={() => updateStatus(r.id, 'dismissed')} style={actionBtn('#f1f5f9', '#475569')}>Dismiss</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ==================== SCAM REPORTS ==================== */
function ScamReportsSection() {
  const [reports, setReports] = useState<(ScamReport & { profiles?: { email: string; full_name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<(ScamReport & { profiles?: { email: string; full_name: string } }) | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('scam_reports')
        .select('*, profiles(email, full_name)')
        .order('created_at', { ascending: false });
      setReports((data as (ScamReport & { profiles?: { email: string; full_name: string } })[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === 'all' ? reports : reports.filter((r) => r.status === filter);

  async function updateStatus(id: string, status: string) {
    await supabase.from('scam_reports').update({ status }).eq('id', id);
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    if (selectedReport?.id === id) setSelectedReport({ ...selectedReport, status });
  }

  async function saveNotes(id: string, notes: string) {
    await supabase.from('scam_reports').update({ admin_notes: notes }).eq('id', id);
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, admin_notes: notes } : r));
    if (selectedReport?.id === id) setSelectedReport({ ...selectedReport, admin_notes: notes });
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading scam reports...</div>;

  return (
    <>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['all', 'pending', 'reviewing', 'resolved', 'dismissed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: filter === f ? '#1e293b' : 'white',
            color: filter === f ? 'white' : '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
          }}>{f}</button>
        ))}
      </div>
      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>{filtered.length} scam reports</div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No scam reports found.</div>
        ) : (
          <div className="admin-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Type</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Reported Phone</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Reported Name</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Location</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Evidence</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Date</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>{r.report_type}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{r.reported_phone || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{r.reported_name || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{r.location || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {r.evidence_urls.length > 0 ? (
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1' }}>
                          {r.evidence_urls.length} file{r.evidence_urls.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: r.status === 'pending' ? '#fef3c7' : r.status === 'reviewing' ? '#e0f2fe' : r.status === 'resolved' ? '#dcfce7' : '#fee2e2', color: r.status === 'pending' ? '#92400e' : r.status === 'reviewing' ? '#0369a1' : r.status === 'resolved' ? '#166534' : '#991b1b' }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => setSelectedReport(r)} style={actionBtn('#e0f2fe', '#0369a1')}>View</button>
                        {r.status === 'pending' && <button onClick={() => updateStatus(r.id, 'reviewing')} style={actionBtn('#e0f2fe', '#0369a1')}>Review</button>}
                        {r.status !== 'resolved' && <button onClick={() => updateStatus(r.id, 'resolved')} style={actionBtn('#dcfce7', '#166534')}>Resolve</button>}
                        {r.status !== 'dismissed' && <button onClick={() => updateStatus(r.id, 'dismissed')} style={actionBtn('#f1f5f9', '#475569')}>Dismiss</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-box" style={{ maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedReport(null)}></button>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--navy)', marginBottom: '4px' }}>
              Scam Report Details
            </h3>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              Submitted {new Date(selectedReport.created_at).toLocaleString()}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '3px' }}>Report Type</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{selectedReport.report_type}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '3px' }}>Reported By</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{selectedReport.profiles?.email || 'Unknown'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '3px' }}>Reported Phone</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{selectedReport.reported_phone || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '3px' }}>Reported Name</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{selectedReport.reported_name || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '3px' }}>Location</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{selectedReport.location || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '3px' }}>Status</div>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', background: selectedReport.status === 'pending' ? '#fef3c7' : selectedReport.status === 'resolved' ? '#dcfce7' : '#fee2e2', color: selectedReport.status === 'pending' ? '#92400e' : selectedReport.status === 'resolved' ? '#166534' : '#991b1b' }}>
                  {selectedReport.status}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Description</div>
              <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, background: '#f8fafc', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
                {selectedReport.reason}
              </div>
            </div>

            {selectedReport.evidence_urls.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Evidence Files</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {selectedReport.evidence_urls.map((url, i) => {
                    const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    if (isImage) {
                      return (
                        <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: 'block', width: '100px', height: '100px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                          <img src={url} alt={`Evidence ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </a>
                      );
                    }
                    return (
                      <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', borderRadius: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: '24px', textDecoration: 'none', color: '#475569' }}>
                        
                        <span style={{ fontSize: '10px', fontWeight: 600, marginTop: '4px' }}>View</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Admin Notes</div>
              <textarea
                defaultValue={selectedReport.admin_notes}
                onBlur={(e) => saveNotes(selectedReport.id, e.target.value)}
                placeholder="Add internal notes about this report..."
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', fontSize: '13px', minHeight: '70px', resize: 'vertical' }}
              />
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Notes are saved automatically when you click away.</div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {selectedReport.status === 'pending' && <button onClick={() => updateStatus(selectedReport.id, 'reviewing')} style={actionBtn('#e0f2fe', '#0369a1')}>Mark as Reviewing</button>}
              {selectedReport.status !== 'resolved' && <button onClick={() => updateStatus(selectedReport.id, 'resolved')} style={actionBtn('#dcfce7', '#166534')}>Mark Resolved</button>}
              {selectedReport.status !== 'dismissed' && <button onClick={() => updateStatus(selectedReport.id, 'dismissed')} style={actionBtn('#f1f5f9', '#475569')}>Dismiss</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ==================== LOCATIONS ==================== */
function LocationsSection() {
  const [locations, setLocations] = useState<UgandaLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newLoc, setNewLoc] = useState({ name: '', level: 'district', parent_id: '', region: '', district: '', description: '' });
  const [parents, setParents] = useState<UgandaLocation[]>([]);

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    const { data } = await supabase.from('uganda_locations').select('*').order('name', { ascending: true });
    setLocations((data as UgandaLocation[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    if (newLoc.level === 'region') { setParents([]); return; }
    const levels = ['region', 'district', 'city', 'county', 'sub_county', 'town_council', 'parish', 'village'];
    const parentLevel = levels[Math.max(0, levels.indexOf(newLoc.level) - 1)];
    fetchByLevel(parentLevel).then(setParents);
  }, [newLoc.level]);

  async function addLocation() {
    if (!newLoc.name) return;
    const slug = newLoc.name.toLowerCase().replace(/\s+/g, '-');
    const { error } = await supabase.from('uganda_locations').insert({
      name: newLoc.name, slug, level: newLoc.level,
      parent_id: newLoc.parent_id || null,
      region: newLoc.region || null, district: newLoc.district || null,
      description: newLoc.description || null,
    });
    if (error) { alert(error.message); return; }
    setNewLoc({ name: '', level: 'district', parent_id: '', region: '', district: '', description: '' });
    setShowAdd(false);
    loadLocations();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('uganda_locations').update({ is_active: !current }).eq('id', id);
    setLocations((prev) => prev.map((l) => l.id === id ? { ...l, is_active: !current } : l));
  }

  const filtered = filterLevel ? locations.filter((l) => l.level === filterLevel) : locations;

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading locations...</div>;

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', flex: 1, minWidth: '150px' }}>
          <option value="">All Levels</option>
          {['region', 'district', 'city', 'county', 'sub_county', 'town_council', 'parish', 'village'].map((l) => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
        </select>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '10px 20px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          {showAdd ? 'Cancel' : '+ Add Location'}
        </button>
      </div>

      {showAdd && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Add New Location</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            <input placeholder="Name" value={newLoc.name} onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })} style={inputStyle} />
            <select value={newLoc.level} onChange={(e) => setNewLoc({ ...newLoc, level: e.target.value })} style={inputStyle}>
              {['region', 'district', 'city', 'county', 'sub_county', 'town_council', 'parish', 'village'].map((l) => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
            </select>
            {parents.length > 0 && (
              <select value={newLoc.parent_id} onChange={(e) => setNewLoc({ ...newLoc, parent_id: e.target.value })} style={inputStyle}>
                <option value="">No parent</option>
                {parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <input placeholder="Region" value={newLoc.region} onChange={(e) => setNewLoc({ ...newLoc, region: e.target.value })} style={inputStyle} />
            <input placeholder="District" value={newLoc.district} onChange={(e) => setNewLoc({ ...newLoc, district: e.target.value })} style={inputStyle} />
            <input placeholder="Description" value={newLoc.description} onChange={(e) => setNewLoc({ ...newLoc, description: e.target.value })} style={inputStyle} />
          </div>
          <button onClick={addLocation} style={{ marginTop: '12px', padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Save Location</button>
        </div>
      )}

      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>{filtered.length} locations</div>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div className="admin-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Name</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Level</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Region</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>District</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Active</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>{l.name}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{l.level.replace('_', ' ')}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{l.region || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{l.district || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => toggleActive(l.id, l.is_active)} style={{
                      ...actionBtn(l.is_active ? '#dcfce7' : '#f1f5f9', l.is_active ? '#166534' : '#94a3b8'),
                      minWidth: '60px',
                    }}>
                      {l.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ==================== FEATURED ==================== */
function FeaturedSection() {
  const [featured, setFeatured] = useState<(FeaturedListing & { properties: { title: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('featured_listings').select('*, properties!inner(title)').order('created_at', { ascending: false }).then(({ data }) => {
      setFeatured((data as (FeaturedListing & { properties: { title: string } })[]) || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>;

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      {featured.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No featured listings.</div>
      ) : (
        <div className="admin-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Property</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Duration</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Paid</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Expiry</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {featured.map((f) => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>{f.properties?.title || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{f.duration_days} days</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{Number(f.price_paid).toLocaleString()} UGX</td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>{f.expiry_date ? new Date(f.expiry_date).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: f.status === 'active' ? '#dcfce7' : '#fee2e2', color: f.status === 'active' ? '#166534' : '#991b1b' }}>{f.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ==================== ADS ==================== */
function AdsSection({ settings, onSettingsChange }: { settings: AdminSettings | null; onSettingsChange: () => void }) {
  const [ads, setAds] = useState<AdminAd[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editAd, setEditAd] = useState<AdminAd | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    supabase.from('admin_ads').select('*').order('sort_order', { ascending: true }).then(({ data }) => {
      setAds((data as AdminAd[]) || []);
    });
  }, [refreshKey]);

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('admin_ads').update({ is_active: !current, updated_at: new Date().toISOString() }).eq('id', id);
    setRefreshKey((k) => k + 1);
  }
  async function deleteAd(id: string) {
    if (!confirm('Delete this ad?')) return;
    await supabase.from('admin_ads').delete().eq('id', id);
    setRefreshKey((k) => k + 1);
  }

  return (
    <>
      <button onClick={() => { setEditAd(null); setShowForm(true); }} style={{ padding: '10px 20px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', marginBottom: '16px' }}>+ Post New Ad</button>
      {ads.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>No ads yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ads.map((ad) => (
            <div key={ad.id} style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{ad.title}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Order: {ad.sort_order} • {ad.is_active ? 'Active' : 'Hidden'}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => { setEditAd(ad); setShowForm(true); }} style={actionBtn('#e0f2fe', '#0369a1')}>Edit</button>
                <button onClick={() => toggleActive(ad.id, ad.is_active)} style={actionBtn('#f1f5f9', '#475569')}>{ad.is_active ? 'Hide' : 'Show'}</button>
                <button onClick={() => deleteAd(ad.id)} style={actionBtn('#fee2e2', '#991b1b')}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <AdForm editAd={editAd} onDone={() => { setShowForm(false); setEditAd(null); setRefreshKey((k) => k + 1); }} onClose={() => { setShowForm(false); setEditAd(null); }} />
      )}
    </>
  );
}

/* ==================== SETTINGS ==================== */
function SettingsSection({ settings, onSettingsChange }: { settings: AdminSettings | null; onSettingsChange: () => void }) {
  const [form, setForm] = useState({
    premium_6mo_price: 50000, premium_1yr_price: 90000,
    featured_7d_price: 10000, featured_30d_price: 30000,
    free_enabled: true, premium_6mo_enabled: true, premium_1yr_enabled: true, promo_text: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setForm({
      premium_6mo_price: settings.premium_6mo_price, premium_1yr_price: settings.premium_1yr_price,
      featured_7d_price: settings.featured_7d_price, featured_30d_price: settings.featured_30d_price,
      free_enabled: settings.free_enabled, premium_6mo_enabled: settings.premium_6mo_enabled,
      premium_1yr_enabled: settings.premium_1yr_enabled, promo_text: settings.promo_text,
    });
  }, [settings]);

  async function save() {
    setSaving(true);
    const { data } = await supabase.from('admin_settings').select('id').limit(1).maybeSingle();
    if (data) {
      await supabase.from('admin_settings').update({ ...form, updated_at: new Date().toISOString() }).eq('id', data.id);
    }
    onSettingsChange();
    setSaving(false);
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', maxWidth: '600px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Pricing &amp; Plan Settings</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Premium 6 Months (UGX)</label>
          <input type="number" value={form.premium_6mo_price} onChange={(e) => setForm({ ...form, premium_6mo_price: Number(e.target.value) })} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Premium 1 Year (UGX)</label>
          <input type="number" value={form.premium_1yr_price} onChange={(e) => setForm({ ...form, premium_1yr_price: Number(e.target.value) })} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Featured 7 Days (UGX)</label>
          <input type="number" value={form.featured_7d_price} onChange={(e) => setForm({ ...form, featured_7d_price: Number(e.target.value) })} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Featured 30 Days (UGX)</label>
          <input type="number" value={form.featured_30d_price} onChange={(e) => setForm({ ...form, featured_30d_price: Number(e.target.value) })} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Free Plan Enabled</label>
          <select value={form.free_enabled ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, free_enabled: e.target.value === 'yes' })} style={inputStyle}>
            <option value="yes">Yes</option><option value="no">No</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Promo Text</label>
          <input type="text" value={form.promo_text} onChange={(e) => setForm({ ...form, promo_text: e.target.value })} style={inputStyle} placeholder="e.g. Pay for 30 days, get 5 days free!" />
        </div>
      </div>
      <button onClick={save} disabled={saving} style={{ marginTop: '20px', padding: '12px 24px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}

/* ==================== HELPERS ==================== */
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginTop: '4px',
};

function actionBtn(bg: string, color: string): React.CSSProperties {
  return {
    padding: '4px 10px', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
    cursor: 'pointer', background: bg, color, whiteSpace: 'nowrap',
  };
}
