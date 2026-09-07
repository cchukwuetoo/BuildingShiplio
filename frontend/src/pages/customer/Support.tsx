import { useState } from 'react'
import { ChevronDown, Mail, Phone, Clock } from 'lucide-react'

const FAQS = [
  {
    q: 'How do I book a shipment?',
    a: 'Head to “Book a shipment” in the menu, fill in the pickup, delivery, and package details, then submit. A driver can then accept the pickup request.',
  },
  {
    q: 'How do I track my package?',
    a: 'Open “Track package” and paste your tracking ID, or pick one of your existing shipments from the dropdown. You’ll see each stage: booked, driver assigned, picked up, received at warehouse, processing, and ready for dispatch.',
  },
  {
    q: 'Can I cancel a shipment?',
    a: 'Shipments with status “Pending pickup” can be cancelled from the My shipments page. Once a driver has accepted the pickup, cancellation is no longer available.',
  },
  {
    q: 'What counts as a fragile package?',
    a: 'Tick “Fragile handling” when booking and the operations team will keep extra care moving your package.',
  },
  {
    q: 'How fast can I get updates?',
    a: 'Shipment status updates in real time as drivers and warehouse staff move it through each step. You can refresh “My shipments” to see the latest.',
  },
]

export default function Support() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div>
      <div className="cust-hello">
        <h2>Help & support</h2>
        <p>We&apos;re here if you need us.</p>
      </div>

      <div className="cust-contact-cards">
        <div className="cust-contact-card">
          <span className="cust-contact-icon">
            <Mail size={20} />
          </span>
          <div>
            <strong>Email us</strong>
            <span>support@shiplio.com</span>
          </div>
        </div>
        <div className="cust-contact-card">
          <span className="cust-contact-icon">
            <Phone size={20} />
          </span>
          <div>
            <strong>Call us</strong>
            <span>+234 800 SHIPLIO</span>
          </div>
        </div>
        <div className="cust-contact-card">
          <span className="cust-contact-icon">
            <Clock size={20} />
          </span>
          <div>
            <strong>Hours</strong>
            <span>Mon – Sat, 8am – 6pm WAT</span>
          </div>
        </div>
      </div>

      <div className="cust-section-title">
        <h3>Frequently asked questions</h3>
      </div>

      <div className="cust-accordion">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div key={faq.q} className="cust-accordion-item">
              <button
                className="cust-accordion-btn"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                {faq.q}
                <ChevronDown size={18} />
              </button>
              {isOpen && <div className="cust-accordion-panel">{faq.a}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}