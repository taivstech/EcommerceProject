import { useState, useEffect } from 'react'
import { adminService } from '@/services'
import { Search, UserCheck, UserX, Shield, Mail, Phone, Calendar, Edit2, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import Loading from '@/components/ui/Loading'

const ROLE_COLORS = {
    ADMIN: 'bg-red-100 text-red-700',
    SELLER: 'bg-blue-100 text-blue-700',
    USER: 'bg-green-100 text-green-700',
    WAREHOUSE_EMPLOYEE: 'bg-purple-100 text-purple-700',
    WAREHOUSE_MANAGER: 'bg-indigo-100 text-indigo-700',
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [stats, setStats] = useState({
        total: 0, active: 0, inactive: 0,
        byRole: {}, recentRegistrations: 0
    })
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    useEffect(() => {
        loadData()
    }, [page])

    const loadData = async () => {
        setLoading(true)
        try {
            const [usersRes, userStats] = await Promise.all([
                adminService.getAllUsers(page, 50),
                adminService.getUserStats().catch(() => ({}))
            ])
            setUsers(usersRes.content || usersRes || [])
            setTotalPages(usersRes.totalPages || 0)
            setStats(userStats || {
                total: usersRes.totalElements || usersRes.length || 0,
                active: 0, inactive: 0, byRole: {}, recentRegistrations: 0
            })
        } catch (err) {
            console.error(err)
            toast.error('Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    const handleActivate = async (id) => {
        try {
            await adminService.activateUser(id)
            toast.success('User activated')
            loadData()
        } catch (err) {
            toast.error(err?.message || 'Failed to activate user')
        }
    }

    const handleDeactivate = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this user?')) return
        try {
            await adminService.deactivateUser(id)
            toast.success('User deactivated')
            loadData()
        } catch (err) {
            toast.error(err?.message || 'Failed to deactivate user')
        }
    }

    const filtered = users.filter(user => {
        const matchSearch = !search || 
            user.username?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase()) ||
            user.full_name?.toLowerCase().includes(search.toLowerCase())
        const matchRole = roleFilter === 'ALL' || 
            user.roles?.some(r => (r?.name || '').toUpperCase() === roleFilter)
        const matchStatus = statusFilter === 'ALL' ||
            (statusFilter === 'ACTIVE' && user.active !== false) ||
            (statusFilter === 'INACTIVE' && user.active === false)
        return matchSearch && matchRole && matchStatus
    })

    const allRoles = [...new Set(users.flatMap(u => u.roles?.map(r => r?.name?.toUpperCase()) || []))]

    if (loading && page === 0) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage platform users</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-500">Total Users</p>
                        <Shield size={20} className="text-slate-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 font-num">{stats.total || users.length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-500">Active</p>
                        <UserCheck size={20} className="text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600 font-num">
                        {stats.active || filtered.filter(u => u.active !== false).length}
                    </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-500">Inactive</p>
                        <UserX size={20} className="text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-600 font-num">
                        {stats.inactive || filtered.filter(u => u.active === false).length}
                    </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-500">Recent (7d)</p>
                        <Calendar size={20} className="text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 font-num">
                        {stats.recentRegistrations || 0}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, email, username..."
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                    <option value="ALL">All Roles</option>
                    {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                </select>
            </div>

            {/* Users table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">User</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Contact</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Roles</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                                        {search || roleFilter !== 'ALL' || statusFilter !== 'ALL' 
                                            ? 'No users found' 
                                            : 'No users yet'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                                    <span className="text-slate-600 font-semibold text-sm">
                                                        {user.full_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">{user.full_name || user.username || '—'}</p>
                                                    <p className="text-xs text-slate-400 font-num">@{user.username || '—'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="space-y-1">
                                                {user.email && (
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                        <Mail size={12} className="text-slate-400" />
                                                        <span className="truncate max-w-[200px]">{user.email}</span>
                                                    </div>
                                                )}
                                                {user.phone && (
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                        <Phone size={12} className="text-slate-400" />
                                                        <span className="font-num">{user.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles?.length > 0 ? (
                                                    user.roles.map((role, i) => (
                                                        <span
                                                            key={i}
                                                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                                ROLE_COLORS[role?.name?.toUpperCase()] || 'bg-slate-100 text-slate-600'
                                                            }`}
                                                        >
                                                            {role.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-400">No roles</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                user.active !== false
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {user.active !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                {user.active !== false ? (
                                                    <button
                                                        onClick={() => handleDeactivate(user.id)}
                                                        className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition"
                                                    >
                                                        Deactivate
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleActivate(user.id)}
                                                        className="px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition"
                                                    >
                                                        Activate
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-slate-600 font-num">
                        Page {page + 1} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}
