import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface MonthlyEarning {
    month: string;
    revenue: number;
    refunded: number;
    profit: number;
    orders: number;
}

interface AdminAnalytics {
    averageMonthlyProfit?: number;
    averageOrderValue?: number;
    cancelledOrders?: number;
    completedOrders?: number;
    pendingOrders?: number;
    monthlyEarnings?: MonthlyEarning[];
    totalOrders?: number;
    totalProfit?: number;
    totalRevenue?: number;
    restaurant?: {
        resturantName?: string;
        address?: string;
        phone?: string;
        resturantemail?: string;
        isBanned?: boolean;
    };
}

interface ApiResponse {
    Success: boolean;
    Data?: AdminAnalytics;
}

const formatAmount = (value: number | undefined) =>
    `${Number(value ?? 0).toLocaleString("en-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} BDT`;

async function getAnalytics(id: string) {
    const token = (await cookies()).get("accesstoken")?.value;
    const response = await fetch(`${apiUrl}/resturant/AdminAnalytics/${id}`, {
        headers: token
            ? { Authorization: `Bearer ${decodeURIComponent(token)}` }
            : undefined,
        cache: "no-store",
    });

    if (!response.ok) return null;

    const result = await response.json() as ApiResponse;
    return result.Success ? result.Data ?? null : null;
}

export default async function RestaurantStatsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const analytics = await getAnalytics(id);

    if (!analytics) notFound();

    const restaurant = analytics.restaurant;
    const cards = [
        ["Total Revenue", formatAmount(analytics.totalRevenue)],
        ["Total Profit", formatAmount(analytics.totalProfit)],
        ["Total Orders", Number(analytics.totalOrders ?? 0).toLocaleString()],
        ["Pending Orders", Number(analytics.pendingOrders ?? 0).toLocaleString()],
        ["Completed Orders", Number(analytics.completedOrders ?? 0).toLocaleString()],
        ["Cancelled Orders", Number(analytics.cancelledOrders ?? 0).toLocaleString()],
    ];

    return (
        <div className="p-4">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <Link href="/admin/restaurants" className="text-sm font-semibold text-[#a13924] hover:underline">
                        ← Back to restaurants
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold text-[#2a2a2d]">
                        {restaurant?.resturantName || "Restaurant statistics"}
                    </h1>
                    <p className="mt-1 text-sm text-[#646468]">
                        {restaurant?.resturantemail || "—"} · {restaurant?.phone || "—"}
                    </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    restaurant?.isBanned ? "bg-[#f8d7da] text-[#721c24]" : "bg-[#e4f7ef] text-[#188260]"
                }`}>
                    {restaurant?.isBanned ? "Banned" : "Active"}
                </span>
            </div>

            <div className="mb-6 rounded-2xl border border-[#DEC0BA] bg-white p-5 shadow-sm">
                <p className="text-sm text-[#646468]">Address</p>
                <p className="mt-1 text-[#2a2a2d]">{restaurant?.address || "—"}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map(([title, value]) => (
                    <div key={title} className="rounded-2xl border border-[#DEC0BA] bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-[#646468]">{title}</p>
                        <p className="mt-4 text-2xl font-bold text-[#2a2a2d]">{value}</p>
                    </div>
                ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#DEC0BA] bg-white p-5 shadow-sm">
                    <p className="text-sm text-[#646468]">Average monthly profit</p>
                    <p className="mt-2 text-xl font-bold text-[#a13924]">{formatAmount(analytics.averageMonthlyProfit)}</p>
                </div>
                <div className="rounded-2xl border border-[#DEC0BA] bg-white p-5 shadow-sm">
                    <p className="text-sm text-[#646468]">Average order value</p>
                    <p className="mt-2 text-xl font-bold text-[#a13924]">{formatAmount(analytics.averageOrderValue)}</p>
                </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-[#DEC0BA] bg-white shadow-sm">
                <h2 className="border-b border-[#DEC0BA] px-5 py-4 font-semibold text-[#2a2a2d]">Monthly earnings</h2>
                <table className="min-w-full border-collapse text-left">
                    <thead className="bg-[#fdf5f3]">
                        <tr>
                            <th className="border-b border-[#DEC0BA] px-5 py-3 text-sm">Month</th>
                            <th className="border-b border-[#DEC0BA] px-5 py-3 text-sm">Revenue</th>
                            <th className="border-b border-[#DEC0BA] px-5 py-3 text-sm">Refunded</th>
                            <th className="border-b border-[#DEC0BA] px-5 py-3 text-sm">Profit</th>
                            <th className="border-b border-[#DEC0BA] px-5 py-3 text-sm">Orders</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(analytics.monthlyEarnings ?? []).map((earning) => (
                            <tr key={earning.month}>
                                <td className="border-b border-[#DEC0BA] px-5 py-3 text-sm">{earning.month}</td>
                                <td className="border-b border-[#DEC0BA] px-5 py-3 text-sm">{formatAmount(earning.revenue)}</td>
                                <td className="border-b border-[#DEC0BA] px-5 py-3 text-sm">{formatAmount(earning.refunded)}</td>
                                <td className="border-b border-[#DEC0BA] px-5 py-3 text-sm font-semibold text-[#188260]">{formatAmount(earning.profit)}</td>
                                <td className="border-b border-[#DEC0BA] px-5 py-3 text-sm">{earning.orders}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
