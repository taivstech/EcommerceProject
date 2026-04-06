import { usePathname } from "@/utils/compat"
import { LayoutDashboard, MessageSquare, ShieldCheck, Store, TicketPercent, Users, FolderTree, BarChart3 } from "lucide-react"
import { Link } from "@/utils/compat"

const sidebarLinks = [
    { name: 'Dashboard',     href: '/admin',          icon: LayoutDashboard },
    { name: 'Stores',        href: '/admin/stores',   icon: Store },
    { name: 'Approve Store', href: '/admin/approve',  icon: ShieldCheck },
    { name: 'Users',         href: '/admin/users',    icon: Users },
    { name: 'Categories',    href: '/admin/categories', icon: FolderTree },
    { name: 'Coupons',       href: '/admin/coupons',  icon: TicketPercent },
    { name: 'Chat',          href: '/admin/chat',     icon: MessageSquare },
]

const AdminSidebar = () => {
    const pathname = usePathname()

    const isActive = (href) => {
        if (href === '/admin') return pathname === '/admin'
        return pathname.startsWith(href)
    }

    return (
        <div className="inline-flex h-full flex-col border-r border-slate-200 sm:min-w-56 bg-white">
            {/* Avatar block */}
            <div className="flex flex-col items-center gap-2 py-8 border-b border-slate-100 max-sm:hidden">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center text-lg font-bold">
                    A
                </div>
                <p className="text-slate-700 font-medium text-sm">Admin Panel</p>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col mt-2">
                {sidebarLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`relative flex items-center gap-3 p-3 mx-2 my-0.5 rounded-lg transition text-sm ${
                            isActive(link.href)
                                ? 'bg-slate-100 text-slate-800 font-medium'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                    >
                        <link.icon size={17} className={isActive(link.href) ? 'text-slate-700' : ''} />
                        <p className="max-sm:hidden">{link.name}</p>
                        {isActive(link.href) && (
                            <span className="absolute bg-slate-700 right-0 top-1.5 bottom-1.5 w-1 rounded-l" />
                        )}
                    </Link>
                ))}
            </nav>
        </div>
    )
}

export default AdminSidebar
