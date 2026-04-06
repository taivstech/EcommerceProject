import { useState, useEffect } from 'react'
import { useParams, useRouter } from "@/utils/compat"
import { warehouseService } from '@/services/warehouseService'
import { ArrowLeft, UserPlus, X, Mail, Phone, User, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import Loading from '@/components/ui/Loading'

import type { WarehouseResponse, WarehouseEmployeeResponse } from '@/services/warehouseService'

export default function WarehouseEmployeesPage() {
  const params = useParams()
  const router = useRouter()
  const warehouseId = params.id as string

  const [warehouse, setWarehouse] = useState<WarehouseResponse | null>(null)
  const [employees, setEmployees] = useState<WarehouseEmployeeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignInput, setAssignInput] = useState('')
  const [assignRole, setAssignRole] = useState('EMPLOYEE')

  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    loadData()
  }, [warehouseId])

  const loadData = async () => {
    setLoading(true)
    try {
      const wh = await warehouseService.getById(warehouseId)
      setWarehouse(wh)
      setEmployees(wh.employees || [])
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEmployee = async () => {
    if (!createForm.username.trim() || !createForm.password.trim() || !createForm.fullName.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    if (createForm.password !== createForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (createForm.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      await warehouseService.createWarehouseEmployee(warehouseId, {
        username: createForm.username.trim(),
        password: createForm.password,
        fullName: createForm.fullName.trim(),
        email: createForm.email?.trim() || undefined,
        phone: createForm.phone?.trim() || undefined,
      })
      toast.success('Employee account created successfully!')
      setShowCreateModal(false)
      setCreateForm({
        username: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        email: '',
        phone: '',
      })
      loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create account')
    }
  }

  const handleAssignEmployee = async () => {
    if (!assignInput.trim()) {
      toast.error('Please enter a username or email')
      return
    }

    try {
      await warehouseService.assignEmployee(warehouseId, {
        usernameOrEmail: assignInput.trim(),
        role: assignRole,
      })
      toast.success('Employee assigned successfully')
      setShowAssignModal(false)
      setAssignInput('')
      loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign employee')
    }
  }

  const handleRemoveEmployee = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this employee from the warehouse?')) return

    try {
      await warehouseService.removeEmployee(warehouseId, userId)
      toast.success('Employee removed successfully')
      loadData()
    } catch (err) {
      toast.error('Failed to remove employee')
    }
  }

  if (loading) return <Loading />

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/store/warehouses/${warehouseId}`)}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Employee Management</h1>
            <p className="text-sm text-slate-500 mt-1">{warehouse?.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition font-medium"
          >
            <UserPlus size={18} />
            Create Account
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
          >
            <UserPlus size={18} />
            Assign Employee
          </button>
        </div>
      </div>

      {/* Employees List */}
      {employees.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <User size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg">No employees yet</p>
          <p className="text-slate-400 text-sm mt-1">Create or assign employees to get started</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <p className="text-sm font-medium text-slate-700">
              Total: {employees.length} employees
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {employees.map((emp) => (
              <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <User size={24} className="text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{emp.fullName || emp.username}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      {emp.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={14} />
                          {emp.email}
                        </span>
                      )}
                      {emp.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {emp.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Shield size={14} />
                        {emp.role === 'MANAGER' ? 'Manager' : 'Employee'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveEmployee(emp.userId)}
                  className="p-2 hover:bg-red-50 rounded-lg transition text-red-400 hover:text-red-600"
                  title="Remove"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Create Employee Account</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateForm({
                    username: '',
                    password: '',
                    confirmPassword: '',
                    fullName: '',
                    email: '',
                    phone: '',
                  })
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username *</label>
                  <input
                    value={createForm.username}
                    onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="username"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    value={createForm.fullName}
                    onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    value={createForm.confirmPassword}
                    onChange={e => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    value={createForm.phone}
                    onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="0901234567"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateEmployee}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
                >
                  Create Account
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateForm({
                      username: '',
                      password: '',
                      confirmPassword: '',
                      fullName: '',
                      email: '',
                      phone: '',
                    })
                  }}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Employee Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Assign Existing Employee</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setAssignInput('')
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username or Email</label>
                <input
                  value={assignInput}
                  onChange={e => setAssignInput(e.target.value)}
                  placeholder="username or email@example.com"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={assignRole}
                  onChange={e => setAssignRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAssignEmployee}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
                >
                  Assign
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false)
                    setAssignInput('')
                  }}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
