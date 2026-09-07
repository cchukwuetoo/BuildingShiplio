import { useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  LifeBuoy,
  MapPin,
  Menu,
  Package,
  PackageCheck,
  Route,
  ShieldCheck,
  Truck,
  Warehouse,
  X,
  Zap,
} from 'lucide-react'
import '../styles/landing.css'

interface LandingPageProps {
  onSignIn: () => void
}

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
]

const STATS = [
  { value: '24–72h', label: 'Typical delivery window' },
  { value: '3+', label: 'Courier partners' },
  { value: '100%', label: 'Shipments tracked' },
]

const STEPS = [
  {
    icon: Package,
    title: 'Tell us about your package',
    body: 'Pickup, delivery, and package details in one short booking flow. It takes about two minutes.',
  },
  {
    icon: Truck,
    title: 'We pick it up',
    body: 'A verified driver collects your parcel and our warehouse team receives and processes it.',
  },
  {
    icon: Route,
    title: 'Track it to the doorstep',
    body: 'Follow every stage live — booked, picked up, at warehouse, and ready for dispatch.',
  },
]

const FEATURES = [
  {
    icon: Route,
    title: 'Live tracking',
    body: 'A real-time timeline for every shipment, from booking to dispatch. No more guessing.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified drivers',
    body: 'Every pickup is handled by a vetted driver, with secure handover codes at collection.',
  },
  {
    icon: Warehouse,
    title: 'Warehouse handling',
    body: 'Parcels are received, processed, and staged by an operations team before dispatch.',
  },
  {
    icon: PackageCheck,
    title: 'Flexible options',
    body: 'Own packaging or professional packing, standard or priority speed — your call.',
  },
  {
    icon: Zap,
    title: 'Fast booking',
    body: 'A guided three-step flow with validation, summaries, and instant confirmation.',
  },
  {
    icon: LifeBuoy,
    title: 'Human support',
    body: 'FAQs, email, and phone support six days a week when you need a hand.',
  },
]

const FAQS = [
  {
    q: 'How do I book a shipment?',
    a: 'Create a free customer account, tap “Book a shipment”, and walk through pickup, delivery, and package details. Your booking goes live for drivers immediately.',
  },
  {
    q: 'How do I track my package?',
    a: 'Open “Track package” in your dashboard and choose a shipment. You will see each stage with timestamps: booked, driver assigned, picked up, warehouse, and dispatch.',
  },
  {
    q: 'Can I cancel a shipment?',
    a: 'Yes — shipments with “Pending pickup” status can be cancelled free of charge from the My shipments page.',
  },
  {
    q: 'How is my delivery fee calculated?',
    a: 'Fees are computed on the backend from estimated weight, dimensions, packaging choice, and fragility — so you never have to guess a declared value.',
  },
]

export default function LandingPage({ onSignIn }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="land">
      <header className="land-nav">
        <div className="land-nav-inner">
          <span className="land-brand">
            <span className="land-brand-mark">S</span>
            Shiplio
          </span>
          <nav className="land-links" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="land-nav-actions">
            <button type="button" className="land-btn-ghost" onClick={onSignIn}>
              Sign in
            </button>
            <button type="button" className="land-btn-primary" onClick={onSignIn}>
              Get started <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="land-menu-btn"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="land-mobile-menu" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
            <button type="button" className="land-btn-primary" onClick={onSignIn}>
              Get started <ArrowRight size={16} />
            </button>
          </nav>
        )}
      </header>

      <main>
        <section className="land-hero">
          <div className="land-hero-inner">
            <div className="land-hero-copy">
              <span className="land-badge">
                <span className="land-pulse" /> Now serving Lagos ↔ Abuja
              </span>
              <h1>Shipping across Nigeria, made visible.</h1>
              <p>
                Book pickups in minutes, follow every parcel from your door to
                dispatch, and talk to humans when it matters. One dashboard for
                everything you ship.
              </p>
              <div className="land-hero-actions">
                <button type="button" className="land-btn-primary land-btn-lg" onClick={onSignIn}>
                  Book a shipment <ArrowRight size={17} />
                </button>
                <button type="button" className="land-btn-ghost land-btn-lg" onClick={onSignIn}>
                  Track a package
                </button>
              </div>
              <dl className="land-stats">
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <dt>{stat.label}</dt>
                    <dd>{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="land-hero-visual" aria-hidden>
              <div className="land-track-card">
                <div className="land-track-head">
                  <span className="land-live">
                    <span className="land-pulse" /> Live shipment
                  </span>
                  <span className="land-track-id">#SHPL-4F2A</span>
                </div>
                <div className="land-track-route">
                  <MapPin size={16} />
                  <div>
                    <span>Lagos, Ikeja</span>
                    <strong>Abuja, Maitama</strong>
                  </div>
                  <span className="land-status-pill">Picked up</span>
                </div>
                <div className="land-progress">
                  <span className="land-progress-track">
                    <span className="land-progress-fill" />
                  </span>
                  <span>3 of 6 stages</span>
                </div>
                <ul className="land-checks">
                  {['Driver assigned', 'Picked up', 'At warehouse'].map((label) => (
                    <li key={label}>
                      <Check size={14} /> {label}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="land-float-card land-float-a">
                <Package size={18} />
                <div>
                  <strong>Box · 2.5 kg</strong>
                  <span>Fragile · handled with care</span>
                </div>
              </div>
              <div className="land-float-card land-float-b">
                <Truck size={18} />
                <div>
                  <strong>Driver en route</strong>
                  <span>Pickup confirmed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="land-section" id="how-it-works">
          <p className="land-kicker">How it works</p>
          <h2>From booking to doorstep in three steps</h2>
          <div className="land-steps">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <article key={step.title} className="land-step-card">
                  <span className="land-step-num">{index + 1}</span>
                  <span className="land-step-icon">
                    <Icon size={22} />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="land-section land-alt" id="features">
          <p className="land-kicker">Features</p>
          <h2>Everything you need to ship with confidence</h2>
          <div className="land-features">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <article key={feature.title} className="land-feature-card">
                  <span className="land-feature-icon">
                    <Icon size={20} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="land-section land-alt" id="faq">
          <p className="land-kicker">FAQ</p>
          <h2>Questions, answered</h2>
          <div className="land-faq">
            {FAQS.map((faq, index) => {
              const open = openFaq === index
              return (
                <div key={faq.q} className="land-faq-item">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : index)}
                  >
                    {faq.q}
                    <ChevronDown size={18} className={open ? 'rotated' : ''} />
                  </button>
                  {open && <p>{faq.a}</p>}
                </div>
              )
            })}
          </div>
        </section>

        <section className="land-cta">
          <h2>Ready to ship your first parcel?</h2>
          <p>Create a free account and book a pickup in about two minutes.</p>
          <button type="button" className="land-btn-light land-btn-lg" onClick={onSignIn}>
            Get started free <ArrowRight size={17} />
          </button>
        </section>
      </main>

      <footer className="land-footer">
        <span className="land-brand">
          <span className="land-brand-mark">S</span>
          Shiplio
        </span>
        <p>© 2026 Shiplio Logistics. Pickup to dispatch, made visible.</p>
        <div className="land-footer-links">
          <button type="button" onClick={onSignIn}>
            Sign in
          </button>
          <a href="#how-it-works">How it works</a>
          <a href="#faq">FAQ</a>
        </div>
      </footer>
    </div>
  )
}