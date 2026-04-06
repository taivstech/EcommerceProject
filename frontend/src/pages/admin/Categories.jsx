import { useState, useEffect } from 'react'
import { adminService, categoryService } from '@/services'
import { Plus, Edit2, Trash2, Search, Image as ImageIcon, Package, BarChart3, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import Loading from '@/components/ui/Loading'

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState(null)
    const [formData, setFormData] = useState({ name: '', description: '', imageUrl: '' })
    const [stats, setStats] = useState({ total: 0, totalProducts: 0, avgProductsPerCategory: 0 })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [cats, catStats] = await Promise.all([
                adminService.getAllCategoriesAdmin().catch(() => categoryService.getAllCategories()),
                adminService.getCategoryStats().catch(() => ({ total: 0, totalProducts: 0, avgProductsPerCategory: 0 }))
            ])
            setCategories(cats || [])
            setStats(catStats || { total: cats?.length || 0, totalProducts: 0, avgProductsPerCategory: 0 })
        } catch (err) {
            console.error(err)
            toast.error('Failed to load categories')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editing) {
                await adminService.updateCategoryAdmin(editing.id, formData)
                toast.success('Category updated')
            } else {
                await adminService.createCategoryAdmin(formData)
                toast.success('Category created')
            }
            setShowModal(false)
            setEditing(null)
            setFormData({ name: '', description: '', imageUrl: '' })
            loadData()
        } catch (err) {
            toast.error(err?.message || 'Failed to save category')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return
        try {
            await adminService.deleteCategoryAdmin(id)
            toast.success('Category deleted')
            loadData()
        } catch (err) {
            toast.error(err?.message || 'Failed to delete category')
        }
    }

    const handleEdit = (cat) => {
        setEditing(cat)
        setFormData({ name: cat.name || '', description: cat.description || '', imageUrl: cat.imageUrl || '' })
        setShowModal(true)
    }

    const filtered = categories.filter(cat =>
        cat.name?.toLowerCase().includes(search.toLowerCase()) ||
        cat.description?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Category Management</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage product categories</p>
                </div>
                <button
                    onClick={() => {
                        setEditing(null)
                        setFormData({ name: '', description: '', imageUrl: '' })
                        setShowModal(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition"
                >
                    <Plus size={16} /> New Category
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-500">Total Categories</p>
                        <Package size={20} className="text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 font-num">{stats.total || categories.length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-500">Total Products</p>
                        <BarChart3 size={20} className="text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 font-num">{stats.totalProducts || 0}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-500">Avg Products/Category</p>
                        <TrendingUp size={20} className="text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 font-num">
                        {stats.avgProductsPerCategory ? stats.avgProductsPerCategory.toFixed(1) : '0.0'}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
            </div>

            {/* Categories table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Image</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Description</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                                        {search ? 'No categories found' : 'No categories yet'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(cat => (
                                    <tr key={cat.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3">
                                            {cat.imageUrl ? (
                                                <img src={cat.imageUrl} alt={cat.name} className="w-12 h-12 rounded object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center">
                                                    <ImageIcon size={18} className="text-slate-400" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-slate-800">{cat.name}</p>
                                            <p className="text-xs text-slate-400 font-num">ID: {cat.id?.slice(0, 8)}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-slate-600 max-w-md truncate">{cat.description || '—'}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(cat)}
                                                    className="p-2 hover:bg-blue-50 rounded-lg transition"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} className="text-blue-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="p-2 hover:bg-red-50 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} className="text-red-600" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
                        <h2 className="text-xl font-bold text-slate-800">
                            {editing ? 'Edit Category' : 'New Category'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                <input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                                <input
                                    type="url"
                                    value={formData.imageUrl}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false)
                                        setEditing(null)
                                        setFormData({ name: '', description: '', imageUrl: '' })
                                    }}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition"
                                >
                                    {editing ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
