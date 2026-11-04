import { useState, useRef } from 'react';
import { supabase, REPORT_TYPES } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface ReportPageProps {
  onRequireAuth: () => void;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export default function ReportPage({ onRequireAuth }: ReportPageProps) {
  const { profile } = useAuth();
  const [reportType, setReportType] = useState<string>(REPORT_TYPES[0]);
  const [reportedPhone, setReportedPhone] = useState('');
  const [reportedName, setReportedName] = useState('');
  const [location, setLocation] = useState('');
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    const maxFiles = [...files, ...selected].slice(0, 5);
    setFiles(maxFiles);
    const previews = maxFiles.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : ''));
    setFilePreviews(previews);
  }

  function removeFile(index: number) {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = filePreviews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setFilePreviews(newPreviews);
  }

  function handleSubmit() {
    if (!profile) { onRequireAuth(); return; }
    if (!reason.trim()) { setErrorMsg('Please describe what happened.'); return; }
    if (!reportedPhone.trim() && !reportedName.trim()) {
      setErrorMsg('Please provide the phone number or name of the person you are reporting.');
      return;
    }
    setErrorMsg('');
    setSubmitState('submitting');
    submitReport();
  }

  async function submitReport() {
    try {
      const evidenceUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop() || 'bin';
        const fileName = `${profile!.id}/${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('scam-evidence')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (uploadError) {
          console.error('Upload error:', uploadError.message);
        } else {
          const { data: urlData } = supabase.storage.from('scam-evidence').getPublicUrl(fileName);
          if (urlData.publicUrl) evidenceUrls.push(urlData.publicUrl);
        }
      }

      const { error: insertError } = await supabase.from('scam_reports').insert({
        reporter_id: profile!.id,
        report_type: reportType,
        reported_phone: reportedPhone.trim(),
        reported_name: reportedName.trim(),
        location: location.trim(),
        reason: reason.trim(),
        evidence_urls: evidenceUrls,
        status: 'pending',
      });

      if (insertError) throw insertError;

      setSubmitState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit report. Please try again.');
      setSubmitState('error');
    }
  }

  function resetForm() {
    setReportType(REPORT_TYPES[0]);
    setReportedPhone('');
    setReportedName('');
    setLocation('');
    setReason('');
    setFiles([]);
    setFilePreviews([]);
    setSubmitState('idle');
    setErrorMsg('');
  }

  if (submitState === 'success') {
    return (
      <section className="section" style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div className="form-card" style={{ textAlign: 'center', padding: '48px 34px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}></div>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '22px', fontWeight: 800, color: 'var(--navy)', marginBottom: '10px' }}>
            Report Submitted
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.6 }}>
            Thank you for helping keep Door Finder safe. Our team will review your report and take appropriate action.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            You can track the status of your report from your dashboard.
          </p>
          <button className="submit-btn green-btn" onClick={resetForm}>Submit Another Report</button>
        </div>
      </section>
    );
  }

  return (
    <section className="section" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div className="scam-warning-image-wrap">
          <img className="scam-warning-image" src="/image%20copy.png" alt="Scam warning" />
        </div>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--navy)', marginBottom: '8px' }}>
          Report a Scammer or Misbehaving Account
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
          Help us protect the community. Report scammers, fake listings, impersonators, or anyone behaving suspiciously.
          Provide as much detail as you can — including photos or videos as evidence.
        </p>
      </div>

      <div className="form-card">
        {/* Report type */}
        <div className="form-group">
          <label>Type of Report</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="form-row">
          {/* Reported phone */}
          <div className="form-group">
            <label>Phone Number of Reported Person <span className="opt">(if known)</span></label>
            <input
              type="tel"
              value={reportedPhone}
              onChange={(e) => setReportedPhone(e.target.value)}
              placeholder="e.g. 0772 123 456"
            />
          </div>

          {/* Reported name */}
          <div className="form-group">
            <label>Name / Username <span className="opt">(if known)</span></label>
            <input
              type="text"
              value={reportedName}
              onChange={(e) => setReportedName(e.target.value)}
              placeholder="Name or account name"
            />
          </div>
        </div>

        {/* Location */}
        <div className="form-group">
          <label>Location <span className="opt">(where it happened or where they operate)</span></label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Kampala, Nakawa division"
          />
        </div>

        {/* Reason */}
        <div className="form-group">
          <label>Describe What Happened <span style={{ color: 'var(--red)' }}>*</span></label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a detailed description of what happened, why you are reporting this person, and any other relevant information..."
            style={{ minHeight: '130px' }}
          />
        </div>

        {/* Evidence upload */}
        <div className="form-group">
          <label>Upload Evidence (Photos or Videos) <span className="opt">(up to 5 files)</span></label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border)', borderRadius: '12px', padding: '24px',
              textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '6px' }}></div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Click to upload photos or videos
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Screenshots of conversations, fake listings, or any proof
            </div>
          </div>

          {files.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
              {files.map((file, i) => (
                <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid var(--border)' }}>
                  {filePreviews[i] ? (
                    <img src={filePreviews[i]} alt={`Evidence ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-bg)', fontSize: '24px' }}>
                      
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    style={{
                      position: 'absolute', top: '2px', right: '2px',
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: 'rgba(0,0,0,0.65)', color: 'white',
                      border: 'none', fontSize: '12px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    
                  </button>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(0,0,0,0.6)', color: 'white',
                    fontSize: '9px', fontWeight: 600, padding: '2px 4px',
                    textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="auth-err" style={{ marginBottom: '14px' }}>{errorMsg}</div>
        )}

        <button
          className="submit-btn navy-btn"
          onClick={handleSubmit}
          disabled={submitState === 'submitting'}
          style={{ opacity: submitState === 'submitting' ? 0.6 : 1 }}
        >
          {submitState === 'submitting' ? 'Submitting Report...' : 'Submit Report'}
        </button>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '14px', textAlign: 'center', lineHeight: 1.5 }}>
          Your report is confidential and will only be seen by our admin team.
          False reports may result in account suspension.
        </div>
      </div>
    </section>
  );
}
