import { Helmet } from "react-helmet-async"
import { Link } from "@/utils/compat"
import {
    Store, ShieldCheck, TrendingUp, Package,
    CheckCircle2, ArrowRight, BarChart3, Users, Star, Zap, Globe
} from "lucide-react"

const TIERS = [
    {
        name: "Starter",
        tag: "Starter",
        commission: "8%",
        monthlyFee: "Free",
        color: "from-slate-100 to-slate-50",
        accent: "bg-slate-800 text-white",
        features: [
            "Post up to 50 products",
            "Email support",
            "Basic sales reports",
            "Shipping via partner GHN",
            "Payout every 7 days",
        ],
        cta: "Open a Shop",
        href: "/seller/register",
        highlighted: false,
    },
    {
        name: "Professional",
        tag: "Most Popular",
        commission: "5%",
        monthlyFee: "$8.00/month",
        color: "from-emerald-600 to-teal-500",
        accent: "bg-white text-emerald-700",
        features: [
            "Unlimited products",
            "24/7 priority support",
            "Advanced analytics & AI insights",
            "Priority search visibility",
            "Payout every 3 days",
            "Shop vouchers & Flash sales",
            "Warehouse API integration",
        ],
        cta: "Start 30-Day Free Trial",
        href: "/seller/register?plan=pro",
        highlighted: true,
    },
    {
        name: "Enterprise",
        tag: "Enterprise",
        commission: "3%",
        monthlyFee: "Contact us",
        color: "from-slate-100 to-slate-50",
        accent: "bg-indigo-700 text-white",
        features: [
            "All Professional features",
            "Dedicated account manager",
            "99.9% uptime SLA commitment",
            "Custom shop branding page",
            "Immediate payout upon order completion",
            "ERP/WMS integration",
            "Custom real-time reports",
        ],
        cta: "Contact Sales",
        href: "/contact",
        highlighted: false,
    },
]

const FLOW_STEPS = [
    {
        icon: <Store size={28} />,
        title: "1. Register your shop",
        desc: "Fill in shop details, ID, and business license (if any). Approved within 1–2 business days.",
    },
    {
        icon: <Package size={28} />,
        title: "2. List products",
        desc: "Upload photos, descriptions, pricing, and stock. Our AI system suggests optimized categories and tags.",
    },
    {
        icon: <TrendingUp size={28} />,
        title: "3. Process orders",
        desc: "Automatic warehouse routing to GHN. Seller confirms, packs, and hands over to carrier.",
    },
    {
        icon: <ShieldCheck size={28} />,
        title: "4. Receive payouts",
        desc: "Once buyers confirm receipt, the platform pays out the net amount (minus commission) to your bank account.",
    },
]

const STATS = [
    { icon: <Users size={24} />, value: "2,000+", label: "Active Buyers" },
    { icon: <Store size={24} />, value: "150+", label: "Active Stores" },
    { icon: <Star size={24} />, value: "4.7★", label: "Average Rating" },
    { icon: <Globe size={24} />, value: "63", label: "Cities/Provinces Covered" },
]

export default function Pricing() {
    return (
        <>
            <Helmet>
                <title>Sell on EcommerceWeb - Low Commission, Powerful Features</title>
                <meta
                    name="description"
                    content="Open a shop on EcommerceWeb. Commissions from only 3-8%, fast payouts, 24/7 support, no hidden fees. Build your business with us!"
                />
                <meta property="og:title" content="Sell on EcommerceWeb - Low Commission, Powerful Features" />
                <meta property="og:type" content="website" />
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    name: "Sell on EcommerceWeb",
                    description: "Low commissions starting at 3%, fast payouts, nationwide shipping",
                })}</script>
            </Helmet>

            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

                {/* ── Hero ──────────────────────────────────────────── */}
                <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-600 text-white py-24 px-6">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
                    </div>
                    <div className="relative max-w-5xl mx-auto text-center">
                        <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                            <Zap size={14} className="text-yellow-300" />
                            Fastest-Growing E-commerce Platform 2025
                        </span>
                        <h1 className="text-5xl font-extrabold leading-tight tracking-tight mb-5">
                            Open a store, <br />
                            <span className="text-yellow-300">start selling today</span>
                        </h1>
                        <p className="text-xl text-white/85 max-w-2xl mx-auto mb-10">
                            Transparent commission starting at 3%, no hidden fees. Reach thousands of buyers with AI recommendations
                            tailored directly to their search intent.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                href="/seller/register"
                                className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-8 py-4 rounded-2xl hover:bg-yellow-50 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Store size={20} />
                                Open a Free Store
                            </Link>
                            <Link
                                href="/shop"
                                className="inline-flex items-center gap-2 border border-white/40 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all"
                            >
                                Explore Marketplace
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── Platform Stats ─────────────────────────────────── */}
                <section className="py-12 px-6 border-b border-slate-100 bg-white">
                    <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {STATS.map((s) => (
                            <div key={s.label} className="space-y-2">
                                <div className="flex justify-center text-emerald-600">{s.icon}</div>
                                <p className="text-3xl font-extrabold text-slate-900">{s.value}</p>
                                <p className="text-sm text-slate-500">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Seller Flow ────────────────────────────────────── */}
                <section className="py-20 px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-14">
                            <h2 className="text-3xl font-extrabold text-slate-900">Start Selling Easily</h2>
                            <p className="text-slate-500 mt-3 text-lg">4 simple steps from registration to payout</p>
                        </div>
                        <div className="grid md:grid-cols-4 gap-6">
                            {FLOW_STEPS.map((step) => (
                                <div
                                    key={step.title}
                                    className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                                        {step.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-1">{step.title}</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Pricing Tiers ──────────────────────────────────── */}
                <section id="pricing" className="py-20 px-6 bg-gradient-to-b from-white to-slate-50">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-14">
                            <h2 className="text-3xl font-extrabold text-slate-900">Commission & Pricing Plans</h2>
                            <p className="text-slate-500 mt-3 text-lg">
                                Commissions are calculated as a percentage of actual sales. No listing fees, no hidden costs.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 items-stretch">
                            {TIERS.map((tier) => (
                                <div
                                    key={tier.name}
                                    className={`relative rounded-3xl overflow-hidden border flex flex-col transition-transform hover:-translate-y-1 ${tier.highlighted
                                        ? "border-transparent shadow-2xl shadow-emerald-200 scale-[1.03]"
                                        : "border-slate-200 shadow-sm"
                                        }`}
                                >
                                    {/* Card header */}
                                    <div className={`bg-gradient-to-br ${tier.color} p-7`}>
                                        {tier.highlighted && (
                                            <span className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                                                ★ {tier.tag}
                                            </span>
                                        )}
                                        {!tier.highlighted && (
                                            <span className="inline-block bg-slate-200 text-slate-600 text-xs font-medium px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                                                {tier.tag}
                                            </span>
                                        )}
                                        <h3 className={`text-2xl font-extrabold mb-1 ${tier.highlighted ? "text-white" : "text-slate-900"}`}>
                                            {tier.name}
                                        </h3>
                                        <div className={`flex items-baseline gap-1 ${tier.highlighted ? "text-white" : "text-slate-800"}`}>
                                            <span className="text-4xl font-black">{tier.commission}</span>
                                            <span className="text-sm opacity-70">commission</span>
                                        </div>
                                        <p className={`text-sm mt-1 ${tier.highlighted ? "text-white/70" : "text-slate-500"}`}>
                                            Monthly fee: <span className="font-semibold">{tier.monthlyFee}</span>
                                        </p>
                                    </div>

                                    {/* Features */}
                                    <div className="bg-white flex-1 p-7 flex flex-col">
                                        <ul className="space-y-3 flex-1 mb-8">
                                            {tier.features.map((f) => (
                                                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                        <Link
                                            href={tier.href}
                                            className={`w-full text-center py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${tier.highlighted
                                                ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:opacity-90 shadow-lg"
                                                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                                                }`}
                                        >
                                            {tier.cta}
                                            <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Commission disclaimer */}
                        <div className="mt-10 bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-800 text-center">
                            <BarChart3 className="inline-block mr-2 text-blue-500" size={18} />
                            Commissions are calculated based on the <strong>product subtotal</strong> (excluding shipping fees).
                            Automated payouts are sent to your registered bank account.
                        </div>
                    </div>
                </section>

                {/* ── FAQ ────────────────────────────────────────────── */}
                <section className="py-20 px-6">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-10">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {[
                                {
                                    q: "Do I need a business license to open a store?",
                                    a: "Not required for individual seller accounts. Registered businesses and merchants must provide business registration documents when signing up for Professional or Enterprise plans."
                                },
                                {
                                    q: "How is commission calculated?",
                                    a: "Commission = Product Subtotal × Commission Rate. For example: for an order subtotal of $100.00 with a 5% commission, the platform fee is $5.00, and the seller receives $95.00 (excluding shipping fees)."
                                },
                                {
                                    q: "How is shipping handled?",
                                    a: "We integrate directly with GHN. The system automatically calculates shipping fees and assigns the nearest warehouse for each order to optimize fulfillment time."
                                },
                                {
                                    q: "When do I receive my payouts?",
                                    a: "Funds are disbursed once buyers click 'Order Received'. Starter plan: 7 days, Professional plan: 3 days, Enterprise plan: instantly upon fulfillment completion."
                                },
                            ].map(({ q, a }) => (
                                <details
                                    key={q}
                                    className="group bg-white border border-slate-100 rounded-2xl p-5 shadow-sm cursor-pointer hover:border-emerald-200 transition-colors"
                                >
                                    <summary className="font-semibold text-slate-900 flex items-center justify-between list-none">
                                        {q}
                                        <span className="text-emerald-500 group-open:rotate-180 transition-transform text-lg">▾</span>
                                    </summary>
                                    <p className="text-slate-600 text-sm mt-3 leading-relaxed">{a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA Banner ────────────────────────────────────── */}
                <section className="py-20 px-6 bg-gradient-to-r from-emerald-600 to-teal-500">
                    <div className="max-w-3xl mx-auto text-center text-white">
                        <h2 className="text-3xl font-extrabold mb-4">Ready to grow your sales?</h2>
                        <p className="text-white/80 mb-8 text-lg">
                            Thousands of customers are searching for your products. Open your shop today for free.
                        </p>
                        <Link
                            href="/seller/register"
                            className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-10 py-4 rounded-2xl hover:bg-yellow-50 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] text-lg"
                        >
                            <Store size={22} />
                            Register Now — Get 30 Days of Pro Free
                        </Link>
                    </div>
                </section>
            </div>
        </>
    )
}