import { Link } from '@/utils/compat';
import { Truck, TicketPercent, Zap, Store, ShieldCheck, Gem, CreditCard, RotateCcw } from 'lucide-react';

const QUICK_LINKS = [
  { id: 1, title: 'Free Shipping', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-100', link: '/shop' },
  { id: 2, title: 'Vouchers', icon: TicketPercent, color: 'text-orange-500', bg: 'bg-orange-100', link: '/shop' },
  { id: 3, title: 'Flash Sale', icon: Zap, color: 'text-red-500', bg: 'bg-red-100', link: '/shop' },
  { id: 4, title: 'Official Mall', icon: Store, color: 'text-red-600', bg: 'bg-red-50', link: '/shop' },
  { id: 5, title: '100% Authentic', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-100', link: '/shop' },
  { id: 6, title: 'Premium Deals', icon: Gem, color: 'text-purple-500', bg: 'bg-purple-100', link: '/shop' },
  { id: 7, title: 'Easy Pay', icon: CreditCard, color: 'text-teal-500', bg: 'bg-teal-100', link: '/shop' },
  { id: 8, title: '30 Days Return', icon: RotateCcw, color: 'text-indigo-500', bg: 'bg-indigo-100', link: '/shop' },
];

export default function QuickLinks() {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 py-6 bg-white rounded-xl shadow-sm border border-slate-100 px-4 sm:px-6">
      {QUICK_LINKS.map((item) => {
        const Icon = item.icon;
        return (
          <Link 
            key={item.id} 
            href={item.link}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center group-hover:-translate-y-1 transition-transform duration-300`}>
              <Icon size={24} />
            </div>
            <span className="text-xs font-medium text-slate-700 text-center max-w-[80px] leading-tight group-hover:text-slate-900 transition-colors">
              {item.title}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
