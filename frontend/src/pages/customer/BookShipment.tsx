import { useState } from 'react'
import { ArrowLeft, ArrowRight, CreditCard, PackagePlus, Route } from 'lucide-react'
import { shipmentsAPI } from '../../api.js'
import { useIsMobile } from '../../hooks/useIsMobile.js'
import { formatNaira } from '../../lib/shipments.js'
import { CustomerView } from '../../components/CustomerSidebar.js'
import Stepper from './book/Stepper.js'
import SummaryPanel from './book/SummaryPanel.js'
import DetailsStep, { DetailsSection, FieldChangeEvent } from './book/DetailsStep.js'
import OptionsStep from './book/OptionsStep.js'
import CourierStep from './book/CourierStep.js'
import ReviewStep from './book/ReviewStep.js'
import {
  CarrierRate,
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

interface CreatedShipment {
  id: string
  status: string
  totalCost?: number
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
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [created, setCreated] = useState<CreatedShipment | null>(null)
  const isMobile = useIsMobile(768)

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const handleChange = (e: FieldChangeEvent) => {
    const { name, value, type } = e.target
    // A changed parcel invalidates the previously selected quote.
    setData((prev) => ({
      ...prev,
      selectedRate: null,
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

  const handleSelectRate = (rate: CarrierRate, dropOffHub: string | null) => {
    setData((prev) => ({ ...prev, selectedRate: rate, dropOffHub }))
    setError('')
  }

  const validateCurrentDetails = (): string | null => {
    if (!isMobile) return validateDetails(data)
    if (sub === 0) return validatePickup(data)
    if (sub === 1) return validateDelivery(data)
    return validatePackage(data)
  }

  const handleNext = () => {
    setError('')
    setInfo('')
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
    if (step === 2) {
      if (!data.selectedRate) {
        setError('Choose a courier to continue.')
        return
      }
      setStep(3)
      scrollTop()
      return
    }
    void handleSubmit()
  }

  const handleBack = () => {
    setError('')
    setInfo('')
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
    setStep(step - 1)
    scrollTop()
  }

  const handleStepperGo = (target: number) => {
    if (target >= step) return
    setError('')
    setInfo('')
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
    if (!data.selectedRate) {
      setError('Choose a courier before booking.')
      setStep(2)
      scrollTop()
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await shipmentsAPI.create(toCreatePayload(data))
      const shipment = response.data?.shipment ?? response.data
      setCreated({
        id: shipment?.id,
        status: shipment?.status ?? 'PENDING_PAYMENT',
        totalCost: shipment?.totalCost,
      })
      scrollTop()
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to book the shipment')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!created) return
    setConfirming(true)
    setError('')
    try {
      const response = await shipmentsAPI.confirmPayment(created.id)
      const shipment = response.data?.shipment ?? response.data
      setCreated({
        id: shipment?.id ?? created.id,
        status: shipment?.status ?? 'PENDING',
        totalCost: shipment?.totalCost ?? created.totalCost,
      })
      setInfo('Payment confirmed. A driver can now accept the pickup.')
      scrollTop()
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Could not confirm payment.')
    } finally {
      setConfirming(false)
    }
  }

  if (created) {
    const awaitingPayment = created.status === 'PENDING_PAYMENT'
    return (
      <div>
        <div className="cust-hello">
          <h2>{awaitingPayment ? 'Almost there 💳' : 'Shipment booked 🎉'}</h2>
          <p>
            {awaitingPayment
              ? 'Your booking is held while payment completes.'
              : 'A driver can now accept the pickup request.'}
          </p>
        </div>
        {error && <div className="message error">{error}</div>}
        {info && <div className="message success">{info}</div>}
        <div className="message success">
          Shipment <strong>#{created.id.slice(0, 8).toUpperCase()}</strong>
          {created.totalCost ? (
            <>
              {' '}· total <strong>{formatNaira(created.totalCost)}</strong>
            </>
          ) : null}
          {awaitingPayment ? ' · awaiting payment.' : '.'}
        </div>
        <div className="cust-quick-actions">
          {awaitingPayment && (
            <button
              className="action-btn btn-primary"
              onClick={() => void handleConfirmPayment()}
              disabled={confirming}
            >
              <CreditCard size={17} /> {confirming ? 'Confirming…' : 'Confirm payment'}
            </button>
          )}
          <button
            className="action-btn btn-secondary"
            onClick={() => onNavigate('track', { shipmentId: created.id })}
          >
            <Route size={17} /> Track it now
          </button>
          <button
            className="action-btn btn-secondary"
            onClick={() => {
              setCreated(null)
              setData(defaultWizardData)
              setStep(0)
              setSub(0)
              setError('')
              setInfo('')
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
    step === 3
      ? loading
        ? 'Booking…'
        : 'Book shipment'
      : step === 0 && isMobile && sub < 2
        ? 'Continue'
        : step === 0
          ? 'Continue to delivery options'
          : step === 1
            ? 'Continue to courier & price'
            : 'Continue to review'
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

      {isMobile && step === 3 && (
        <div className="wiz-summary-mobile">
          <SummaryPanel data={data} />
        </div>
      )}

      {error && <div className="message error">{error}</div>}

      <div className="wiz-layout">
        <div className="wiz-main">
          {step === 0 && <DetailsStep data={data} onChange={handleChange} section={currentSection} />}
          {step === 1 && <OptionsStep data={data} onSelect={handleSelect} />}
          {step === 2 && <CourierStep data={data} onSelectRate={handleSelectRate} />}
          {step === 3 && <ReviewStep data={data} onEdit={handleStepperGo} />}

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
                {step === 3 ? <PackagePlus size={17} /> : null}
                {nextLabel}
                {step !== 3 ? <ArrowRight size={16} /> : null}
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