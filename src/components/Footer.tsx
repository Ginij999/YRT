import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { useSite } from '../context/SiteContext';

export const Footer: React.FC = () => {
  const { settings, navigation } = useSite();

  const companyLinks = navigation
    .filter((n) => n.location === 'footer_company' && n.visible)
    .sort((a, b) => a.order - b.order);

  const serviceLinks = navigation
    .filter((n) => n.location === 'footer_services' && n.visible)
    .sort((a, b) => a.order - b.order);

  const logoSrc = settings?.logoDarkUrl || settings?.logoLightUrl || '/logo.png';
  const socials = settings?.socialLinks || {};

  return (
    <footer
      className="relative overflow-hidden border-t pt-16 pb-10 bg-transparent"
      style={{
        borderColor: 'var(--brand-border)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-14 border-b" style={{ borderColor: 'var(--brand-border)' }}>
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-5">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <img
                src={logoSrc}
                alt={settings?.organizationName || 'YRT Esports'}
                className="h-12 w-12 object-contain transition-transform duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                {settings?.organizationName || 'YRT Esports'}
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-md" style={{ color: 'var(--brand-muted)' }}>
              {settings?.footerBio || settings?.description}
            </p>
            <div className="text-xs space-y-2" style={{ color: 'var(--brand-muted)' }}>
              <p className="inline-flex items-center gap-2 text-neutral-200 font-medium">
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--brand-accent)' }} />
                <span>{settings?.headquarters || 'Kathmandu, Nepal (KTM HQ)'}</span>
              </p>
              {settings?.contactEmail && (
                <p>
                  <a href={`mailto:${settings.contactEmail}`} className="hover:text-white transition-colors">
                    {settings.contactEmail}
                  </a>
                  {settings?.contactPhone ? ` · ${settings.contactPhone}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Organization Column */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-xs font-semibold tracking-wider text-white">Organization</h3>
            <ul className="space-y-2.5 text-sm" style={{ color: 'var(--brand-muted)' }}>
              {companyLinks.map((item) => (
                <li key={item._id}>
                  <Link to={item.path} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Capabilities Column */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-xs font-semibold tracking-wider text-white">Capabilities</h3>
            <ul className="space-y-2.5 text-sm" style={{ color: 'var(--brand-muted)' }}>
              {serviceLinks.map((item) => (
                <li key={item._id}>
                  <Link to={item.path} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Channels Column */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-xs font-semibold tracking-wider text-white">Channels</h3>
            <ul className="space-y-2.5 text-sm" style={{ color: 'var(--brand-muted)' }}>
              {socials.twitter && (
                <li>
                  <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white transition-colors">
                    X / Twitter <ArrowUpRight className="w-3 h-3" />
                  </a>
                </li>
              )}
              {socials.youtube && (
                <li>
                  <a href={socials.youtube} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white transition-colors">
                    YouTube <ArrowUpRight className="w-3 h-3" />
                  </a>
                </li>
              )}
              {socials.twitch && (
                <li>
                  <a href={socials.twitch} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white transition-colors">
                    Twitch <ArrowUpRight className="w-3 h-3" />
                  </a>
                </li>
              )}
              {socials.linkedin && (
                <li>
                  <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white transition-colors">
                    LinkedIn <ArrowUpRight className="w-3 h-3" />
                  </a>
                </li>
              )}
              {socials.discord && (
                <li>
                  <a href={socials.discord} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white transition-colors">
                    Discord <ArrowUpRight className="w-3 h-3" />
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Legal Bar (Admin/CMS links completely removed) */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs" style={{ color: 'var(--brand-muted)' }}>
          <p>
            © {new Date().getFullYear()} {settings?.footerCopyright || 'YRT Esports & YRT Production.'}
          </p>
          <div className="flex items-center gap-6">
            <Link to="/reviews" className="hover:text-white transition-colors">
              Client Reviews
            </Link>
            <Link to="/contact" className="hover:text-white transition-colors">
              Press &amp; Inquiries
            </Link>
            <Link to="/careers" className="hover:text-white transition-colors">
              Recruitment
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
