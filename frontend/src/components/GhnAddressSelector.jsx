import { useState, useEffect } from 'react'
import { ghnService } from '@/services/ghnService'

/**
 * GHN Address Selector Component
 * Cascading dropdowns: Province → District → Ward
 * Returns: { province, province_id, district, district_id, ward, ward_code }
 */
export default function GhnAddressSelector({ value, onChange, required = false }) {
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])
  const [loading, setLoading] = useState({ province: false, district: false, ward: false })

  // Load provinces on mount
  useEffect(() => {
    async function loadProvinces() {
      setLoading(prev => ({ ...prev, province: true }))
      try {
        const data = await ghnService.getProvinces()
        setProvinces(data)
      } catch (err) {
        console.error('Failed to load provinces:', err)
      } finally {
        setLoading(prev => ({ ...prev, province: false }))
      }
    }
    loadProvinces()
  }, [])

  // Load districts when province changes
  useEffect(() => {
    if (!value?.province_id) {
      setDistricts([])
      setWards([])
      return
    }
    async function loadDistricts() {
      setLoading(prev => ({ ...prev, district: true }))
      try {
        const data = await ghnService.getDistricts(value.province_id)
        setDistricts(data)
      } catch (err) {
        console.error('Failed to load districts:', err)
      } finally {
        setLoading(prev => ({ ...prev, district: false }))
      }
    }
    loadDistricts()
  }, [value?.province_id])

  // Load wards when district changes
  useEffect(() => {
    if (!value?.district_id) {
      setWards([])
      return
    }
    async function loadWards() {
      setLoading(prev => ({ ...prev, ward: true }))
      try {
        const data = await ghnService.getWards(value.district_id)
        setWards(data)
      } catch (err) {
        console.error('Failed to load wards:', err)
      } finally {
        setLoading(prev => ({ ...prev, ward: false }))
      }
    }
    loadWards()
  }, [value?.district_id])

  const handleProvinceChange = (e) => {
    const id = parseInt(e.target.value)
    const province = provinces.find(p => p.ProvinceID === id)
    onChange({
      province: province?.ProvinceName || '',
      province_id: id || null,
      district: '',
      district_id: null,
      ward: '',
      ward_code: '',
    })
  }

  const handleDistrictChange = (e) => {
    const id = parseInt(e.target.value)
    const district = districts.find(d => d.DistrictID === id)
    onChange({
      ...value,
      district: district?.DistrictName || '',
      district_id: id || null,
      ward: '',
      ward_code: '',
    })
  }

  const handleWardChange = (e) => {
    const code = e.target.value
    const ward = wards.find(w => w.WardCode === code)
    onChange({
      ...value,
      ward: ward?.WardName || '',
      ward_code: code || '',
    })
  }

  return (
    <div className="space-y-4">
      {/* Province */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Province / City {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={value?.province_id || ''}
          onChange={handleProvinceChange}
          required={required}
          disabled={loading.province}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition disabled:bg-slate-100 disabled:cursor-not-allowed"
        >
          <option value="">-- Select Province / City --</option>
          {provinces.map(p => (
            <option key={p.ProvinceID} value={p.ProvinceID}>
              {p.ProvinceName}
            </option>
          ))}
        </select>
      </div>

      {/* District */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          District {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={value?.district_id || ''}
          onChange={handleDistrictChange}
          required={required}
          disabled={!value?.province_id || loading.district}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition disabled:bg-slate-100 disabled:cursor-not-allowed"
        >
          <option value="">-- Select District --</option>
          {districts.map(d => (
            <option key={d.DistrictID} value={d.DistrictID}>
              {d.DistrictName}
            </option>
          ))}
        </select>
      </div>

      {/* Ward */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Ward {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={value?.ward_code || ''}
          onChange={handleWardChange}
          required={required}
          disabled={!value?.district_id || loading.ward}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition disabled:bg-slate-100 disabled:cursor-not-allowed"
        >
          <option value="">-- Select Ward --</option>
          {wards.map(w => (
            <option key={w.WardCode} value={w.WardCode}>
              {w.WardName}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
