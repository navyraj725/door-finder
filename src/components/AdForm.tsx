import { useState, useRef } from 'react';
import { supabase, type AdminAd } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface AdFormProps {
  editAd?: AdminAd | null;
  onDone: () => void;
  onClose: () => void;
}

export default function AdForm({ editAd, onDone, onClose }: AdFormProps) {
  const { profile } = useAuth();
  const isEditing = !!editAd;
  const [title, setTitle] = useState(editAd?.title || '');
  const [description, setDescription] = useState(editAd?.description || '');
  const [linkUrl, setLinkUrl] = useState(editAd?.link_url || '');
  const [posterUrl, setPosterUrl] = useState(editAd?.poster_url || '');
  const [videoUrl, setVideoUrl] = useState(editAd?.video_url || '');
  const [sortOrder, setSortOrder] = useState(editAd?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(editAd?.is_active ?? true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  async function handlePosterSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `admin-ads/${profile.id}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('listing-media')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('listing-media').getPublicUrl(fileName);
      setPosterUrl(urlData.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Poster upload failed.');
    } finally {
      setUploading(false);
      if (posterInputRef.current) posterInputRef.current.value = '';
    }
  }

  async function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'mp4';
      const fileName = `admin-ads/${profile.id}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('listing-media')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('listing-media').getPublicUrl(fileName);
      setVideoUrl(urlData.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video upload failed.');
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!profile) { setError('You must be signed in.'); return; }
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        link_url: linkUrl.trim(),
        poster_url: posterUrl,
        video_url: videoUrl,
        sort_order: Number(sortOrder),
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };
      let opError;
      if (isEditing && editAd) {
        ({ error: opError } = await supabase.from('admin_ads').update(payload).eq('id', editAd.id));
      } else {
        ({ error: opError } = await supabase.from('admin_ads').insert({
          ...payload,
          created_by: profile.id,
        }));
      }
      if (opError) throw opError;
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save ad.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}></button>
        <h3 style={{ marginBottom: '4px' }}>{isEditing ? 'Edit Ad' : 'Post New Ad'}</h3>
        <div className="modal-sub">Create an advertisement with a poster image and optional video. Ads appear at the top of the listings page.</div>
        {error && <div className="auth-err" style={{ marginTop: '12px' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ marginTop: '8px' }}>
          <div className="form-group">
            <label>Ad Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Special Promotion - Free Installation"
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write your ad message here..."
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Link URL <span className="opt">(optional)</span></label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="section-divider">Poster Image</div>
          <div className="form-group">
            <div className="upload-area">
              {posterUrl ? (
                <div className="upload-thumb">
                  <img src={posterUrl} alt="Ad poster" />
                  <button type="button" className="upload-remove" onClick={() => setPosterUrl('')}></button>
                </div>
              ) : (
                <div className="upload-add" onClick={() => posterInputRef.current?.click()}>
                  <span style={{ fontSize: '28px' }}>+</span>
                  <span style={{ fontSize: '11px' }}>Add Poster</span>
                </div>
              )}
            </div>
            <input
              ref={posterInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePosterSelect}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              JPG, PNG, WebP — landscape images work best
            </div>
          </div>

          <div className="section-divider">Video <span className="opt">(optional)</span></div>
          <div className="form-group">
            <div className="upload-area">
              {videoUrl ? (
                <div className="upload-thumb video-thumb">
                  <video src={videoUrl} />
                  <button type="button" className="upload-remove" onClick={() => setVideoUrl('')}></button>
                  <span className="video-badge">VIDEO</span>
                </div>
              ) : (
                <div className="upload-add" onClick={() => videoInputRef.current?.click()}>
                  <span style={{ fontSize: '28px' }}>+</span>
                  <span style={{ fontSize: '11px' }}>Add Video</span>
                </div>
              )}
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={handleVideoSelect}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              MP4, WebM, MOV (max 100MB)
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                min="0"
                placeholder="0"
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Lower numbers appear first. Ads always show above regular listings.
              </div>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={isActive ? 'yes' : 'no'}
                onChange={(e) => setIsActive(e.target.value === 'yes')}
              >
                <option value="yes">Active (visible)</option>
                <option value="no">Inactive (hidden)</option>
              </select>
            </div>
          </div>

          {uploading && (
            <div style={{ fontSize: '13px', color: 'var(--navy)', fontWeight: 600, marginBottom: '12px' }}>
              Uploading file... please wait.
            </div>
          )}

          <button type="submit" className="submit-btn green-btn" disabled={submitting || uploading}>
            {submitting
              ? (isEditing ? 'Saving...' : 'Publishing...')
              : isEditing
                ? 'Save Changes'
                : 'Publish Ad'}
          </button>
        </form>
      </div>
    </div>
  );
}
