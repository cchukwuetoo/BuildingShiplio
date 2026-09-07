import { useState } from 'react'
import { ArrowLeft, ArrowRight, PackagePlus, Route } from 'lucide-react'
import { shipmentsAPI } from '../../api.js'
import { useIsMobile } from '../../hooks/useIsMobile.js'
import { CustomerView } from '../../components/CustomerSidebar.js'
import Stepper from './book/Stepper.js'
import SummaryPanel from './book/SummaryPanel.js'
import DetailsStep, { DetailsSection, FieldChangeEvent } from './book/DetailsStep.js'
import OptionsStep from './book/OptionsStep.js'
import ReviewStep from './book/ReviewStep.js'
import {
  defaultWizardData,
  PackagingChoice,
  SpeedChoice,
  toCreatePayload,
  validateDelivery,
  validateDetails,
  validatePackage,
  validatePickup,
  WizardData,
} from './book/wizard.js'

interface BookShipmentProps {
  onNavigate: (view: CustomerView, opts?: { shipmentId?: string }) => void
}

const MOBILE_SECTIONS: DetailsSection[] = ['pickup', 'delivery', 'package']
const MOBILE_SECTION_TITLES: Record<string, string> = {
  pickup: 'Pickup details',
  delivery: 'Delivery details',
  package: 'Package details',
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    return axiosError.response?.data?.message || ''
  }
  return ''
}

export default function BookShipment({ onNavigate }: BookShipmentProps) {
  const [data, setData] = useState<WizardData>(defaultWizardData)
  const [step, setStep] = useState(0)
  const [sub, setSub] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState<string | null>(null)
  const isMobile = useIsMobile(768)

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const handleChange = (e: FieldChangeEvent) => {
    const { name, value, type } = e.target
    setData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? value === ''
              ? undefined
              : Number(value)
            : value,
    }))
  }

  const handleSelect = (field: 'packaging' | 'speed', value: PackagingChoice | SpeedChoice) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const validateCurrentDetails = (): string | null => {
    if (!isMobile) return validateDetails(data)
    if (sub === 0) return validatePickup(data)
    if (sub === 1) return validateDelivery(data)
    return validatePackage(data)
  }

  const handleNext = () => {
    setError('')
    if (step === 0) {
      const problem = validateCurrentDetails()
      if (problem) {
        setError(problem)
        return
      }
      if (isMobile && sub < MOBILE_SECTIONS.length - 1) {
        setSub(sub + 1)
        scrollTop()
        return
      }
      setStep(1)
      scrollTop()
      return
    }
    if (step === 1) {
      setStep(2)
      scrollTop()
      return
    }
    void handleSubmit()
  }

  const handleBack = () => {
    setError('')
    if (step === 0) {
      if (isMobile && sub > 0) {
        setSub(sub - 1)
        scrollTop()
      }
      return
    }
    if (step === 1) {
      setStep(0)
      setSub(isMobile ? MOBILE_SECTIONS.length - 1 : 0)
      scrollTop()
      return
    }
    setStep(1)
    scrollTop()
  }

  const handleStepperGo = (target: number) => {
    if (target >= step) return
    setError('')
    setStep(target)
    setSub(0)
    scrollTop()
  }

  const handleSubmit = async () => {
    const problem = validateDetails(data)
    if (problem) {
      setError(problem)
      setStep(0)
      setSub(0)
      scrollTop()
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await shipmentsAPI.create(toCreatePayload(data))
      const created = response.data?.shipment ?? response.data
      setCreatedId(created?.id ?? null)
      scrollTop()
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to book the shipment')
    } finally {
      setLoading(false)
    }
  }

  if (createdId) {
    return (
      <div>
        <div className="cust-hello">
          <h2>Shipment booked 🎉</h2>
          <p>A driver can now accept the pickup request.</p>
        </div>
        <div className="message success">
          We&apos;ve created shipment <strong>#{createdId.slice(0, 8).toUpperCase()}</strong>. You can follow
          it in real time.
        </div>
        <div className="cust-quick-actions">
          <button
            className="action-btn btn-primary"
            onClick={() => onNavigate('track', { shipmentId: createdId })}
          >
            <Route size={17} /> Track it now
          </button>
          <button
            className="action-btn btn-secondary"
            onClick={() => {
              setCreatedId(null)
              setData(defaultWizardData)
              setStep(0)
              setSub(0)
            }}
          >
            Book another shipment
          </button>
        </div>
      </div>
    )
  }

  const showBack = step > 0 || (isMobile && step === 0 && sub > 0)
  const nextLabel =
    step === 2 ? (loading ? 'Booking…' : 'Book shipment') : step === 0 && isMobile && sub < 2 ? 'Continue' : step === 0 ? 'Continue to delivery options' : step === 1 ? 'Continue to review' : 'Continue'
  const currentSection: DetailsSection = isMobile && step === 0 ? MOBILE_SECTIONS[sub] : 'all'

  return (
    <div>
      <div className="cust-hello">
        <h2>Create a shipment</h2>
        <p>Tell us about your package and where you want it delivered.</p>
      </div>

      <Stepper step={step} onGo={handleStepperGo} />

      {isMobile && step === 0 && (
        <p className="wiz-subprogress">
          Part {sub + 1} of {MOBILE_SECTIONS.length}: {MOBILE_SECTION_TITLES[MOBILE_SECTIONS[sub]]}
        </p>
      )}

      {isMobile && step === 2 && (
        <div className="wiz-summary-mobile">
          <SummaryPanel data={data} />
        </div>
      )}

      {error && <div className="message error">{error}</div>}

      <div className="wiz-layout">
        <div className="wiz-main">
          {step === 0 && <DetailsStep data={data} onChange={handleChange} section={currentSection} />}
          {step === 1 && <OptionsStep data={data} onSelect={handleSelect} />}
          {step === 2 && <ReviewStep data={data} onEdit={handleStepperGo} />}

          <div className="wiz-footer">
            <div className="wiz-footer-left">
              {showBack && (
                <button type="button" className="action-btn btn-secondary" onClick={handleBack}>
                  <ArrowLeft size={16} /> Back
                </button>
              )}
            </div>
            <div className="wiz-footer-right">
              <button
                type="button"
                className="action-btn btn-primary"
                onClick={handleNext}
                disabled={loading}
              >
                {step === 2 ? <PackagePlus size={17} /> : null}
                {nextLabel}
                {step !== 2 ? <ArrowRight size={16} /> : null}
              </button>
            </div>
          </div>
        </div>

        <div className="wiz-side">
          <SummaryPanel data={data} />
        </div>
      </div>
    </div>
  )
}