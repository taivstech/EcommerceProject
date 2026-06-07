import { useState, useEffect } from 'react'
import { warehouseService } from '@/services/warehouseService'
import GhnAddressSelector from '@/components/GhnAddressSelector'
import { Plus, Pencil, Trash2, Users, MapPin, Phone, Star, X, UserPlus, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(null) // warehouseId
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(null) // warehouseId
  const [assignInput, setAssignInput] = useState('')
  const [assignRole, setAssignRole] = useState('EMPLOYEE')
  
  // Form for creating new warehouse employee account
  const [createAccountForm, setCreateAccountForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phone: '',
  })

  const emptyForm = {
    name: '',
    contactName: '',
    contactPhone: '',
    detailAddress: '',
    province: '', province_id: null,
    district: '', district_id: null,
    ward: '', ward_code: '',
    isDefault: false,
  }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    setLoading(true)
    try {
      const data = await warehouseService.getMyWarehouses()
      setWarehouses(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openCreateForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }

  const openEditForm = (wh) => {
    setForm({
      name: wh.name || '',
      contactName: wh.contactName || '',
      contactPhone: wh.contactPhone || '',
      detailAddress: wh.detailAddress || '',
      province: wh.province || '',
      province_id: wh.provinceId ? parseInt(wh.provinceId) : null,
      district: wh.district || '',
      district_id: wh.districtId || null,
      ward: wh.ward || '',
      ward_code: wh.wardCode || '',
      isDefault: wh.isDefault || false,
    })
    setEditingId(wh.id)
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const parts = [form.ward, form.district, form.province].filter(Boolean)
    const payload = {
      name: form.name,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      detailAddress: form.detailAddress,
      fullAddress: parts.join(', '),
      ward: form.ward,
      wardCode: form.ward_code,
      district: form.district,
      districtId: form.district_id,
      province: form.province,
      provinceId: form.province_id ? String(form.province_id) : null,
      isDefault: form.isDefault,
    }

    if (editingId) {
      await warehouseService.update(editingId, payload)
      toast.success('Warehouse updated')
    } else {
      await warehouseService.create(payload)
      toast.success('Warehouse created')
    }

    setShowForm(false)
    setEditingId(null)
    loadWarehouses()
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return
    await warehouseService.delete(id)
    toast.success('Warehouse deleted')
    loadWarehouses()
  }

  const handleAssignEmployee = async (warehouseId) => {
    if (!assignInput.trim()) return
    try {
      await warehouseService.assignEmployee(warehouseId, {
        usernameOrEmail: assignInput.trim(),
        role: assignRole,
      })
      toast.success('Employee assigned')
      setAssignInput('')
      setShowAssignModal(null)
      loadWarehouses()
    } catch (err) {
      toast.error(err?.message || 'Failed to assign employee')
    }
  }

  const handleRemoveEmployee = async (warehouseId, userId) => {
    if (!confirm('Remove this employee from warehouse?')) return
    try {
      await warehouseService.removeEmployee(warehouseId, userId)
      toast.success('Employee removed')
      loadWarehouses()
    } catch (err) {
      toast.error('Failed to remove employee')
    }
  }

  const handleCreateWarehouseEmployee = async (warehouseId) => {
    if (!createAccountForm.username.trim() || !createAccountForm.password.trim() || !createAccountForm.fullName.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    if (createAccountForm.password !== createAccountForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (createAccountForm.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    try {
      await warehouseService.createWarehouseEmployee(warehouseId, {
        username: createAccountForm.username.trim(),
        password: createAccountForm.password,
        fullName: createAccountForm.fullName.trim(),
        email: createAccountForm.email?.trim() || undefined,
        phone: createAccountForm.phone?.trim() || undefined,
      })
      toast.success('Warehouse employee account created successfully!')
      setCreateAccountForm({
        username: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        email: '',
        phone: '',
      })
      setShowCreateAccountModal(null)
      loadWarehouses()
    } catch (err) {
      toast.error(err?.message || 'Failed to create warehouse employee account')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black">Warehouse Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your warehouses and assign employees
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition font-medium"
        >
          <Plus size={18} />
          Add Warehouse
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">
              {editingId ? 'Edit Warehouse' : 'New Warehouse'}
            </h2>
            <button onClick={() => { setShowForm(false); setEditingId(null) }}>
              <X size={20} className="text-slate-400 hover:text-slate-600" />
            </button>
          </div>

          <form onSubmit={(e) => toast.promise(handleSubmit(e), { loading: 'Saving...' })} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="Main Warehouse"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                <input
                  value={form.contactName}
                  onChange={e => setForm({ ...form, contactName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                <input
                  value={form.contactPhone}
                  onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="0901234567"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={e => setForm({ ...form, isDefault: e.target.checked })}
                    className="accent-green-600 w-4 h-4"
                  />
                  <span className="text-sm font-medium text-slate-700">Set as default warehouse</span>
                </label>
              </div>
            </div>

            <GhnAddressSelector
              value={form}
              onChange={(ghnData) => setForm(prev => ({ ...prev, ...ghnData }))}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Detail Address</label>
              <textarea
                value={form.detailAddress}
                onChange={e => setForm({ ...form, detailAddress: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200 resize-none"
                rows={2}
                placeholder="Street, house number..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg transition font-medium"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null) }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-lg transition font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Warehouse List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : warehouses.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <MapPin size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg">No warehouses yet</p>
          <p className="text-slate-400 text-sm mt-1">Create your first warehouse to start managing inventory</p>
        </div>
      ) : (
        <div className="space-y-4">
          {warehouses.map((wh) => (
            <div 
              key={wh.id} 
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = `/store/warehouses/${wh.id}`}
            >
              {/* Warehouse header */}
              <div className="p-5 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-black">{wh.name}</h3>
                    {wh.isDefault && (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        <Star size={12} /> Default
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      wh.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {wh.status}
                    </span>
                    {wh.ghnShopId && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        GHN #{wh.ghnShopId}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-slate-500">
                    {(wh.detailAddress || wh.fullAddress || wh.ward || wh.district || wh.province) && (
                      <div className="flex items-start gap-1">
                        <MapPin size={14} className="mt-0.5 shrink-0" />
                        <div className="flex-1">
                          {wh.detailAddress && <span>{wh.detailAddress}, </span>}
                          {wh.ward && <span>{wh.ward}, </span>}
                          {wh.district && <span>{wh.district}, </span>}
                          {wh.province && <span>{wh.province}</span>}
                          {!wh.detailAddress && !wh.ward && !wh.district && !wh.province && wh.fullAddress && (
                            <span>{wh.fullAddress}</span>
                          )}
                        </div>
                      </div>
                    )}
                    {wh.contactPhone && (
                      <div className="flex items-center gap-1">
                        <Phone size={14} /> {wh.contactPhone}
                      </div>
                    )}
                  </div>

                  {wh.contactName && (
                    <p className="text-sm text-slate-500 mt-1">Contact: {wh.contactName}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openEditForm(wh)}
                    className="p-2 hover:bg-slate-50 rounded-lg transition"
                    title="Edit"
                  >
                    <Pencil size={18} className="text-slate-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(wh.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 size={18} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

