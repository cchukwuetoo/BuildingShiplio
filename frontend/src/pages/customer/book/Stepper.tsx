import { Check } from 'lucide-react'

export const WIZARD_STEPS = [
  { label: 'Shipment details', short: 'Details' },
  { label: 'Delivery options', short: 'Options' },
  { label: 'Courier & price', short: 'Courier' },
  { label: 'Review & book', short: 'Review' },
]

interface StepperProps {
  step: number
  onGo: (step: number) => void
}

export default function Stepper({ step, onGo }: StepperProps) {
  return (
    <ol className="wiz-stepper" aria-label="Booking progress">
      {WIZARD_STEPS.map((item, index) => {
        const state = index < step ? 'done' : index === step ? 'current' : 'todo'
        return (
          <li key={item.label} className={`wiz-step-item ${state}`}>
            <button
              type="button"
              className="wiz-step"
              disabled={index >= step}
              onClick={() => onGo(index)}
              aria-current={index === step ? 'step' : undefined}
            >
              <span className="wiz-step-num">
                {index < step ? <Check size={14} /> : index + 1}
              </span>
              <span className="wiz-step-label">{item.label}</span>
            </button>
            {index < WIZARD_STEPS.length - 1 && (
              <span className={`wiz-step-connector ${index < step ? 'done' : ''}`} aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}