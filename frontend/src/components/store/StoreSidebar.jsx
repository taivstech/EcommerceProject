import { usePathname } from "@/utils/compat"
import { HomeIcon, LayoutListIcon, MessageSquareIcon, SquarePenIcon, SquarePlusIcon, TicketIcon, Settings, Warehouse, WalletIcon, PackageCheck } from "lucide-react"
import { Image } from "@/utils/compat"
import { Link } from "@/utils/compat"

const StoreSidebar = ({storeInfo}) => {

    const pathname = usePathname()

    const sidebarLinks = [
        { name: 'Dashboard', href: '/store', icon: HomeIcon },
        { name: 'Add Product', href: '/store/add-product', icon: SquarePlusIcon },
        { name: 'Manage Product', href: '/store/manage-product', icon: SquarePenIcon },
        { name: 'Orders', href: '/store/orders', icon: LayoutListIcon },
        { name: 'Cash Flow', href: '/store/cash-flow', icon: WalletIcon },
        { name: 'Vouchers', href: '/store/vouchers', icon: TicketIcon },
        { name: 'Warehouses', href: '/store/warehouses', icon: Warehouse },
        { name: 'Warehouse Orders', href: '/store/warehouse-dashboard', icon: PackageCheck },
        { name: 'Chat', href: '/store/chat', icon: MessageSquareIcon },
        { name: 'Settings', href: '/store/settings', icon: Settings },
    ]

    const isActive = (href) => {
        if (href === '/store') return pathname === '/store'
        return pathname.startsWith(href)
    }

    return (
        <div className="inline-flex h-full flex-col gap-5 border-r border-slate-200 sm:min-w-60 bg-white">
            <div className="flex flex-col gap-3 justify-center items-center pt-8 max-sm:hidden">
                {storeInfo?.logo ? (
                    <Image className="w-14 h-14 rounded-full shadow-md" src={storeInfo.logo} alt="" width={80} height={80} />
                ) : (
                    <div className="w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
                        {storeInfo?.name?.charAt(0).toUpperCase() || 'S'}
                    </div>
                )}
                <p className="text-slate-700 font-semibold">{storeInfo?.name || 'My Store'}</p>
                {storeInfo?.status && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold tracking-wide">
                        {storeInfo.status}
                    </span>
                )}
            </div>

            <div className="max-sm:mt-6">
                {
                    sidebarLinks.map((link, index) => {
                        const active = isActive(link.href)
                        return (
                            <Link
                                key={index}
                                href={link.href}
                                className={`relative flex items-center gap-3 p-2.5 transition ${
                                    active
                                        ? 'bg-green-50 text-green-700 font-medium'
                                        : 'text-slate-500 hover:bg-green-50/50 hover:text-green-600'
                                }`}
                            >
                                <link.icon size={18} className={`sm:ml-5 ${active ? 'text-green-600' : ''}`} />
                                <p className="max-sm:hidden">{link.name}</p>
                                {active && <span className="absolute bg-green-600 right-0 top-1.5 bottom-1.5 w-1 sm:w-1.5 rounded-l"></span>}
                            </Link>
                        )
                    })
                }
            </div>
        </div>
    )
}

export default StoreSidebar
