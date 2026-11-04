import { useEffect, useState } from 'react';
import { MapPin, Smartphone, Cookie } from 'lucide-react';

type InfoPage = 'about' | 'terms' | 'privacy' | 'cookies';

interface InfoPagesProps {
  page: InfoPage;
  onNavigate: (page: InfoPage) => void;
}

const CONTACT = {
  email: 'doorfinderug@gmail.com',
  phone: '0731 028 626 / 0743 8249 88',
  location: 'Kampala, Uganda',
};

function PageNav({ page, onNavigate }: { page: InfoPage; onNavigate: (p: InfoPage) => void }) {
  const tabs: { key: InfoPage; label: string }[] = [
    { key: 'about', label: 'About Us' },
    { key: 'terms', label: 'Terms of Service' },
    { key: 'privacy', label: 'Privacy Policy' },
    { key: 'cookies', label: 'Cookie Policy' },
  ];
  return (
    <div className="info-tab-nav">
      {tabs.map((t) => (
        <button
          key={t.key}
          className={`info-tab-btn ${page === t.key ? 'active' : ''}`}
          onClick={() => onNavigate(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function ContactCard() {
  return (
    <div className="info-contact-card">
      <h3 className="info-contact-title">Contact Us</h3>
      <div className="info-contact-grid">
        <div className="info-contact-item">
          <div className="info-contact-icon"></div>
          <div className="info-contact-label">Email</div>
          <a href={`mailto:${CONTACT.email}`} className="info-contact-value">{CONTACT.email}</a>
        </div>
        <div className="info-contact-item">
          <div className="info-contact-icon"><Smartphone size={22} /></div>
          <div className="info-contact-label">Phone / WhatsApp</div>
          <span className="info-contact-value">{CONTACT.phone}</span>
        </div>
        <div className="info-contact-item">
          <div className="info-contact-icon"><MapPin size={22} /></div>
          <div className="info-contact-label">Location</div>
          <span className="info-contact-value">{CONTACT.location}</span>
        </div>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="info-content">
      <div className="info-hero">
        <h1 className="info-hero-title">About DoorFinder</h1>
        <p className="info-hero-sub">Connecting Uganda to better homes, stays &amp; transport</p>
      </div>

      <div className="info-body">
        <p className="info-lead">
          Welcome to DoorFinder, a platform that connects property owners, agents, and people
          looking for houses, apartments, shops, and land in Uganda.
        </p>
        <p>
          Our mission is to make property searching simple, fast, and reliable. We provide a
          convenient platform where property owners can advertise their properties and potential
          tenants or buyers can easily find suitable homes and commercial spaces.
        </p>

        <h2 className="info-h2">We Strive To</h2>
        <ul className="info-check-list">
          <li><span className="info-check"></span> Provide accurate property listings</li>
          <li><span className="info-check"></span> Connect property owners with potential tenants and buyers</li>
          <li><span className="info-check"></span> Offer an easy-to-use and secure platform</li>
          <li><span className="info-check"></span> Help users make informed property decisions</li>
        </ul>

        <p className="info-closing">
          Whether you are looking for a place to rent, buy, or advertise — DoorFinder is here to help.
        </p>
      </div>

      <ContactCard />
    </div>
  );
}

function TermsPage() {
  const sections = [
    { n: '1', title: 'Acceptance of Terms', body: 'By using our website, you agree to comply with these terms and all applicable laws and regulations.' },
    { n: '2', title: 'User Accounts', body: 'Users may be required to create an account to access certain features. You are responsible for maintaining the security of your account and password.' },
    { n: '3', title: 'Property Listings', body: 'Users who upload property listings agree that the information provided is accurate and truthful, they have the legal right to advertise the property, and the listings do not contain misleading, fraudulent, or illegal content.' },
    { n: '4', title: 'Prohibited Activities', body: 'Users must not upload false or misleading property information, impersonate another person or business, use the platform for unlawful purposes, or attempt to interfere with the website\'s operation or security.' },
    { n: '5', title: 'Content Responsibility', body: 'Users are solely responsible for the content they post, including property descriptions, images, and contact information.' },
    { n: '6', title: 'Removal of Listings', body: 'DoorFinder reserves the right to remove listings that violate these terms or applicable laws without prior notice.' },
    { n: '7', title: 'Disclaimer', body: 'DoorFinder acts as a platform connecting property owners, agents, buyers, and tenants. We do not guarantee the accuracy of listings and are not a party to transactions between users.' },
    { n: '8', title: 'Limitation of Liability', body: 'DoorFinder shall not be liable for any loss, damage, or dispute arising from the use of the platform or interactions between users.' },
    { n: '9', title: 'Privacy', body: 'Your use of the platform is also governed by our Privacy Policy.' },
    { n: '10', title: 'Changes to Terms', body: 'We may update these Terms of Service from time to time. Continued use of the website after changes are posted constitutes acceptance of the revised terms.' },
    { n: '11', title: 'Contact Information', body: 'If you have any questions regarding these Terms of Service, please contact us at doorfinderug@gmail.com or call +25 731 028 626 / +256 743 824988.' },
  ];
  return (
    <div className="info-content">
      <div className="info-hero">
        <h1 className="info-hero-title">Terms of Service</h1>
        <p className="info-hero-sub">Last Updated: June 2026</p>
      </div>
      <div className="info-body">
        <p className="info-lead">By accessing or using DoorFinder, you agree to these Terms of Service.</p>
        {sections.map((s) => (
          <div key={s.n} className="info-legal-section">
            <h3 className="info-legal-h">{s.n}. {s.title}</h3>
            <p className="info-legal-p">{s.body}</p>
          </div>
        ))}
      </div>
      <ContactCard />
    </div>
  );
}

function PrivacyPage() {
  const sections = [
    { n: '1', title: 'Information We Collect', body: 'Name, email address, phone number, property listing details, photos uploaded to listings, login and account information, and website usage information (pages visited and actions taken).' },
    { n: '2', title: 'How We Use Your Information', body: 'Create and manage your account, display property listings, connect property owners with potential tenants or buyers, improve our website and services, respond to inquiries and customer support requests, and maintain website security and prevent fraud.' },
    { n: '3', title: 'Sharing of Information', body: 'We do not sell your personal information. We may share information when required by law, to protect our rights and users, or with trusted service providers that help operate the website.' },
    { n: '4', title: 'Property Listings', body: 'Information you include in a property listing — such as contact details and property descriptions — may be publicly visible to website visitors.' },
    { n: '5', title: 'Data Security', body: 'We take reasonable measures to protect your information from unauthorized access, misuse, or disclosure.' },
    { n: '6', title: 'Your Rights', body: 'You may access your personal information, request corrections, and request deletion of your account and personal data where applicable.' },
    { n: '7', title: 'Changes to This Policy', body: 'We may update this Privacy Policy from time to time. Updates will be posted on this page.' },
  ];
  return (
    <div className="info-content">
      <div className="info-hero">
        <h1 className="info-hero-title">Privacy Policy</h1>
        <p className="info-hero-sub">Last Updated: June 2026</p>
      </div>
      <div className="info-body">
        <p className="info-lead">Welcome to DoorFinder. We respect your privacy and are committed to protecting your personal information.</p>
        {sections.map((s) => (
          <div key={s.n} className="info-legal-section">
            <h3 className="info-legal-h">{s.n}. {s.title}</h3>
            <p className="info-legal-p">{s.body}</p>
          </div>
        ))}
        <div className="info-legal-section">
          <h3 className="info-legal-h">8. Contact Us</h3>
          <p className="info-legal-p">
            Email: {CONTACT.email} &nbsp;•&nbsp; Phone: {CONTACT.phone} &nbsp;•&nbsp; Location: {CONTACT.location}
          </p>
        </div>
      </div>
    </div>
  );
}

function CookiesPage() {
  const cookieTypes = [
    { title: 'Essential Cookies', desc: 'Necessary for the website to function properly.' },
    { title: 'Performance Cookies', desc: 'Help us understand how visitors use the website so we can improve it.' },
    { title: 'Functional Cookies', desc: 'Remember your preferences and settings.' },
    { title: 'Analytics Cookies', desc: 'Help us measure website traffic and user interactions.' },
  ];
  return (
    <div className="info-content">
      <div className="info-hero">
        <h1 className="info-hero-title">Cookie Policy</h1>
        <p className="info-hero-sub">Last Updated: June 2026</p>
      </div>
      <div className="info-body">
        <p className="info-lead">This Cookie Policy explains how DoorFinder uses cookies and similar technologies.</p>

        <h2 className="info-h2">What Are Cookies?</h2>
        <p>Cookies are small text files stored on your device when you visit a website. They help websites function properly and improve the user experience.</p>

        <h2 className="info-h2">How We Use Cookies</h2>
        <ul className="info-check-list">
          <li><span className="info-check"><Cookie size={16} /></span> Keep users logged in</li>
          <li><span className="info-check"><Cookie size={16} /></span> Remember user preferences</li>
          <li><span className="info-check"><Cookie size={16} /></span> Improve website performance</li>
          <li><span className="info-check"><Cookie size={16} /></span> Analyze website traffic and usage</li>
          <li><span className="info-check"><Cookie size={16} /></span> Enhance security</li>
        </ul>

        <h2 className="info-h2">Types of Cookies We Use</h2>
        <div className="cookie-type-grid">
          {cookieTypes.map((c) => (
            <div key={c.title} className="cookie-type-card">
              <h4 className="cookie-type-title">{c.title}</h4>
              <p className="cookie-type-desc">{c.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="info-h2">Managing Cookies</h2>
        <p>Most web browsers allow you to view, delete, block, and control cookie preferences. Please note that disabling certain cookies may affect website functionality.</p>

        <h2 className="info-h2">Third-Party Services</h2>
        <p>We may use third-party services such as analytics or hosting providers that may place cookies on your device.</p>

        <h2 className="info-h2">Changes to This Cookie Policy</h2>
        <p>We may update this Cookie Policy periodically. Any updates will be posted on this page.</p>
      </div>
      <ContactCard />
    </div>
  );
}

export default function InfoPages({ page, onNavigate }: InfoPagesProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  return (
    <div className="info-page-wrapper">
      <PageNav page={page} onNavigate={onNavigate} />
      {page === 'about' && <AboutPage />}
      {page === 'terms' && <TermsPage />}
      {page === 'privacy' && <PrivacyPage />}
      {page === 'cookies' && <CookiesPage />}
    </div>
  );
}

export type { InfoPage };
