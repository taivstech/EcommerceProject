import { useState, useEffect, useRef } from "react"
import { useRouter } from "@/utils/compat"
import { useAuth } from "@/hooks/useAuth"
import type { User } from "@/utils/auth"
import { DEV_MODE_ENABLED } from "@/utils/dev-mode"
import { userService } from "@/services"
import { Image } from "@/utils/compat"
import Navbar from "@/components/layout/Navbar"
import toast from "react-hot-toast"
import { Camera, MapPin } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, loading, refetchUser } = useAuth()
  const [formData, setFormData] = useState<Partial<User>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !DEV_MODE_ENABLED && !isAuthenticated) {
      router.push("/login")
      return
    }
    if (user) {
      setFormData(user)
    }
  }, [user, isAuthenticated, loading, router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveProfile = async () => {
    setSaveLoading(true)
    try {
      await userService.updateProfile(
        {
          username: formData.username,
          full_name: formData.fullName,
          phone: formData.phone || undefined,
          dob: formData.dob || undefined,
        },
        avatarFile
      )

      toast.success("Profile updated successfully")
      setIsEditing(false)
      setAvatarFile(null)
      setAvatarPreview(null)
      refetchUser?.()
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-40 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0].name : "USER"
  const displayAvatar = avatarPreview || user.profilePicture

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-slate-800">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Avatar Section */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-6">
              <div className="relative">
                {displayAvatar ? (
                  <Image
                    src={displayAvatar}
                    alt="Avatar"
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-slate-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-green-600 text-white flex items-center justify-center text-2xl font-bold ring-2 ring-slate-200">
                    {user.fullName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 bg-slate-800 text-white p-1.5 rounded-full hover:bg-slate-900 transition"
                  >
                    <Camera size={14} />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  hidden
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800">{user.fullName || user.username}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
                {avatarFile && (
                  <p className="text-xs text-green-600 mt-1">New photo selected — press Save to update</p>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">Personal Information</h2>
                <button
                  onClick={() => {
                    setIsEditing(!isEditing)
                    if (isEditing) {
                      setAvatarFile(null)
                      setAvatarPreview(null)
                    }
                  }}
                  className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                >
                  {isEditing ? "Cancel" : "Edit"}
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">Username</label>
                    {isEditing ? (
                      <input
                        value={formData.username || ""}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full bg-slate-100 border border-slate-200 px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition"
                      />
                    ) : (
                      <p className="py-2 px-3 bg-slate-100 rounded-lg text-slate-700">{user.username}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">Role</label>
                    <p className="py-2 px-3 bg-slate-100 rounded-lg">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                        {primaryRole}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Full Name</label>
                  {isEditing ? (
                    <input
                      value={formData.fullName || ""}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-slate-100 border border-slate-200 px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition"
                    />
                  ) : (
                    <p className="py-2 px-3 bg-slate-100 rounded-lg text-slate-700">{user.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Email</label>
                  <p className="py-2 px-3 bg-slate-100 rounded-lg text-slate-700">{user.email}</p>
                </div>

                {isEditing && (
                  <button
                    onClick={handleSaveProfile}
                    disabled={saveLoading}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-lg transition mt-4 disabled:opacity-60"
                  >
                    {saveLoading ? "Saving..." : "Save Changes"}
                  </button>
                )}
              </div>
            </div>

            {/* Security Section */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-slate-800">Security</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Password</label>
                  <p className="text-sm text-slate-500">
                    Password change functionality is available via the backend endpoint.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <h3 className="font-bold text-lg mb-2 text-slate-800">Summary</h3>
              <p className="text-sm text-slate-600">
                You are signed in as: <span className="font-semibold text-slate-800">{primaryRole}</span>
              </p>
            </div>

            <button
              onClick={() => router.push('/profile/addresses')}
              className="w-full p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-green-300 hover:shadow transition flex items-center gap-3 text-left group"
            >
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-100 transition">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">My Addresses</h3>
                <p className="text-xs text-slate-500">Manage shipping addresses</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
