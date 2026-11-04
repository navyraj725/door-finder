import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditProfileModal({ open, onClose, onUpdated }: EditProfileModalProps) {
  const { profile } = useAuth();
  const [full_name, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!open || !profile) return null;

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          full_name: full_name.trim(),
          whatsapp: whatsapp.trim(),
        })
        .eq('id', profile.id);

      if (updateErr) throw updateErr;

      // Update email in auth if changed
      if (email.trim() !== profile.email) {
        const { error: authErr } = await supabase.auth.updateUser({ email: email.trim() });
        if (authErr) throw authErr;
      }

      setSuccess(true);
      onUpdated();
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}></button>
        <h3 style={{ marginBottom: '4px' }}>Edit My Profile</h3>
        <div className="modal-sub">Update your name, email, and WhatsApp number.</div>

        {error && <div className="auth-err" style={{ marginTop: '12px' }}>{error}</div>}
        {success && (
          <div style={{ background: '#DCFCE7', color: '#166534', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 600, marginTop: '12px' }}>
            Profile updated successfully!
          </div>
        )}

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label>Full Name</label>
          <input
            type="text"
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Changing your email will require re-verification.
          </div>
        </div>

        <div className="form-group">
          <label>WhatsApp Number</label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="e.g. 0772 123 456"
          />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            This number appears on your listings for clients to contact you.
          </div>
        </div>

        <button
          className="submit-btn green-btn"
          style={{ marginTop: '16px' }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
