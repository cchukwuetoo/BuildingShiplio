import { MapPin, Navigation, Package } from 'lucide-react'
import { WizardData } from './wizard.js'

export type DetailsSection = 'pickup' | 'delivery' | 'package' | 'all'

export type FieldChangeEvent = React.ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>

interface DetailsStepProps {
  data: WizardData
  onChange: (e: FieldChangeEvent) => void
  section: DetailsSection
}

export default function DetailsStep({ data, onChange, section }: DetailsStepProps) {
  const showPickup = section === 'all' || section === 'pickup'
  const showDelivery = section === 'all' || section === 'delivery'
  const showPackage = section === 'all' || section === 'package'

  return (
    <>
      {showPickup && (
        <div className="form-container">
          <h3>
            <MapPin size={18} /> Pickup details
          </h3>
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pickupContactName">Contact name</label>
                <input
                  id="pickupContactName"
                  type="text"
                  name="pickupContactName"
                  value={data.pickupContactName}
                  onChange={onChange}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="form-group">
                <label htmlFor="pickupPhone">Phone number</label>
                <input
                  id="pickupPhone"
                  type="tel"
                  name="pickupPhone"
                  value={data.pickupPhone}
                  onChange={onChange}
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="pickupAddress">Address line</label>
              <input
                id="pickupAddress"
                type="text"
                name="pickupAddress"
                value={data.pickupAddress}
                onChange={onChange}
                placeholder="123 Main St, Apt 4B"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pickupCity">City</label>
                <input
                  id="pickupCity"
                  type="text"
                  name="pickupCity"
                  value={data.pickupCity}
                  onChange={onChange}
                  placeholder="Lagos"
                />
              </div>
              <div className="form-group">
                <label htmlFor="pickupState">State/Province</label>
                <input
                  id="pickupState"
                  type="text"
                  name="pickupState"
                  value={data.pickupState}
                  onChange={onChange}
                  placeholder="LA"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showDelivery && (
        <div className="form-container">
          <h3>
            <Navigation size={18} /> Delivery details
          </h3>
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="recipientName">Recipient name</label>
                <input
                  id="recipientName"
                  type="text"
                  name="recipientName"
                  value={data.recipientName}
                  onChange={onChange}
                  placeholder="John Smith"
                />
              </div>
              <div className="form-group">
                <label htmlFor="recipientPhone">Recipient phone number</label>
                <input
                  id="recipientPhone"
                  type="tel"
                  name="recipientPhone"
                  value={data.recipientPhone}
                  onChange={onChange}
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="deliveryAddress">Delivery address</label>
              <input
                id="deliveryAddress"
                type="text"
                name="deliveryAddress"
                value={data.deliveryAddress}
                onChange={onChange}
                placeholder="456 Market St, Suite 200"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="deliveryCity">City</label>
                <input
                  id="deliveryCity"
                  type="text"
                  name="deliveryCity"
                  value={data.deliveryCity}
                  onChange={onChange}
                  placeholder="Abuja"
                />
              </div>
              <div className="form-group">
                <label htmlFor="deliveryState">State/Province</label>
                <input
                  id="deliveryState"
                  type="text"
                  name="deliveryState"
                  value={data.deliveryState}
                  onChange={onChange}
                  placeholder="FC"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showPackage && (
        <div className="form-container">
          <h3>
            <Package size={18} /> Package details
          </h3>
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="packageType">Package type</label>
              <select id="packageType" name="packageType" value={data.packageType} onChange={onChange}>
                <option>Document</option>
                <option>Parcel</option>
                <option>Box</option>
                <option>Envelope</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="description">Package description</label>
              <input
                id="description"
                type="text"
                name="description"
                value={data.description}
                onChange={onChange}
                placeholder="e.g. 2 laptops and accessories"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="estimatedWeight">Estimated weight</label>
                <div className="wiz-input-group">
                  <input
                    id="estimatedWeight"
                    type="number"
                    name="estimatedWeight"
                    value={data.estimatedWeight}
                    onChange={onChange}
                    step="0.1"
                    min="0"
                  />
                  <select name="weightUnit" value={data.weightUnit} onChange={onChange} aria-label="Weight unit">
                    <option>kg</option>
                    <option>lbs</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Dimensions (L × W × H)</label>
                <div className="wiz-input-group wiz-dims">
                  <input
                    type="number"
                    name="length"
                    value={data.length || ''}
                    onChange={onChange}
                    step="0.1"
                    min="0"
                    placeholder="L"
                    aria-label="Length"
                  />
                  <input
                    type="number"
                    name="width"
                    value={data.width || ''}
                    onChange={onChange}
                    step="0.1"
                    min="0"
                    placeholder="W"
                    aria-label="Width"
                  />
                  <input
                    type="number"
                    name="height"
                    value={data.height || ''}
                    onChange={onChange}
                    step="0.1"
                    min="0"
                    placeholder="H"
                    aria-label="Height"
                  />
                  <select
                    name="dimensionUnit"
                    value={data.dimensionUnit}
                    onChange={onChange}
                    aria-label="Dimension unit"
                  >
                    <option>cm</option>
                    <option>in</option>
                  </select>
                </div>
              </div>
            </div>
            <label className="wiz-switch-row">
              <span className="wiz-switch-text">
                <strong>Handle with extra care</strong>
                <span>Mark as fragile</span>
              </span>
              <span className="wiz-switch">
                <input
                  type="checkbox"
                  name="isFragile"
                  checked={data.isFragile}
                  onChange={onChange}
                />
                <span className="wiz-slider" aria-hidden />
              </span>
            </label>
          </div>
        </div>
      )}
    </>
  )
}