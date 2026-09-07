import { Briefcase, CalendarDays, PackageCheck, Zap } from 'lucide-react'
import { PackagingChoice, SpeedChoice, WizardData } from './wizard.js'

interface OptionsStepProps {
  data: WizardData
  onSelect: (field: 'packaging' | 'speed', value: PackagingChoice | SpeedChoice) => void
}

export default function OptionsStep({ data, onSelect }: OptionsStepProps) {
  return (
    <>
      <div className="form-container">
        <h3>
          <PackageCheck size={18} /> Packaging service
        </h3>
        <p className="form-lede">How is your item prepared for shipping?</p>
        <div className="wiz-option-group" role="radiogroup" aria-label="Packaging service">
          <button
            type="button"
            role="radio"
            aria-checked={data.packaging === 'own'}
            className={`wiz-option-card ${data.packaging === 'own' ? 'selected' : ''}`}
            onClick={() => onSelect('packaging', 'own')}
          >
            <span className="wiz-radio" aria-hidden />
            <span className="wiz-option-text">
              <strong>I have my own packaging</strong>
              <span>Item is boxed, sealed, and ready for labels.</span>
            </span>
            <PackageCheck size={20} className="wiz-option-icon" />
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={data.packaging === 'professional'}
            className={`wiz-option-card ${data.packaging === 'professional' ? 'selected' : ''}`}
            onClick={() => onSelect('packaging', 'professional')}
          >
            <span className="wiz-radio" aria-hidden />
            <span className="wiz-option-text">
              <strong>Professional packing needed</strong>
              <span>We will bring materials and pack it for you.</span>
            </span>
            <Briefcase size={20} className="wiz-option-icon" />
          </button>
        </div>
      </div>

      <div className="form-container">
        <h3>
          <Zap size={18} /> Delivery speed
        </h3>
        <p className="form-lede">Select your preferred delivery timeline.</p>
        <div className="wiz-option-grid" role="radiogroup" aria-label="Delivery speed">
          <button
            type="button"
            role="radio"
            aria-checked={data.speed === 'standard'}
            className={`wiz-option-card ${data.speed === 'standard' ? 'selected' : ''}`}
            onClick={() => onSelect('speed', 'standard')}
          >
            <span className="wiz-radio" aria-hidden />
            <span className="wiz-option-text">
              <strong>
                <CalendarDays size={16} /> Standard
              </strong>
              <span>2–3 business days · base rate</span>
            </span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={data.speed === 'priority'}
            className={`wiz-option-card ${data.speed === 'priority' ? 'selected' : ''}`}
            onClick={() => onSelect('speed', 'priority')}
          >
            <span className="wiz-radio" aria-hidden />
            <span className="wiz-option-text">
              <strong>
                <Zap size={16} /> Priority
              </strong>
              <span>Next-day delivery</span>
            </span>
          </button>
        </div>
      </div>
    </>
  )
}