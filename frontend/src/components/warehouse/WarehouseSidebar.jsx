import { usePathname } from "@/utils/compat"
import { LayoutDashboard, Package, ClipboardList, Users, BarChart3, Settings } from "lucide-react"
import { Link } from "@/utils/compat"

const sidebarLinks = [
    { name: 'Dashboard',   href: '/warehouse',            icon: LayoutDashboard },
    { name: 'Orders',      href: '/warehouse/orders',     icon: ClipboardList },
    { name: 'Inventory',   href: '/warehouse/inventory',  icon: Package },
    { name: 'Staff',       href: '/warehouse/staff',      icon: Users },
    { name: 'Reports',     href: '/warehouse/reports',    icon: BarChart3 },
    { name: 'Settings',    href: '/warehouse/settings',   icon: Settings },
]

const WarehouseSidebar = () => {
    const pathname = usePathname()

    const isActive = (href) => {
        if (href === '/warehouse') return pathname === '/warehouse'
        return pathname.startsWith(href)
    }

    return (
        <div className="inline-flex h-full flex-col border-r border-slate-200 sm:min-w-56 bg-white">
            <div className="flex flex-col gap-1 justify-center items-center py-8 max-sm:hidden border-b border-slate-100">
                <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center text-lg font-bold">
                    W
                </div>
                <p className="text-slate-700 font-medium text-sm mt-2">Warehouse Staff</p>
            </div>

            <nav className="flex flex-col mt-2">
                {sidebarLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`relative flex items-center gap-3 p-3 transition mx-2 my-0.5 rounded-lg ${
                            isActive(link.href)
                                ? 'bg-green-50 text-green-700 font-medium'
                                : 'text-slate-500 hover:bg-green-50 hover:text-green-700'
                        }`}
                    >
                        <link.icon size={18} className={isActive(link.href) ? 'text-green-600' : ''} />
                        <p className="max-sm:hidden text-sm">{link.name}</p>
                        {isActive(link.href) && (
                            <span className="absolute bg-green-600 right-0 top-1.5 bottom-1.5 w-1 rounded-l" />
                        )}
                    </Link>
                ))}
            </nav>
        </div>
    )
}

export default WarehouseSidebar
