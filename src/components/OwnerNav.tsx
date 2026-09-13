"use client";

import {
    Bell,
    CalendarDays,
    ClipboardList,
    CreditCard,
    LayoutDashboard,
    Store,
    Table2,
    Utensils,
    Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ResturantNav from "./ResturantNav";

interface OwnerNavProps {
    handleDefaultResturant: (id:string)=> void;
    socConnect:boolean;
};

const navItems = [
    { name: "Overview", href: "/home", icon: LayoutDashboard },
    { name: "Orders", href: "/home/orders", icon: ClipboardList },
    { name: "Booking", href: "/home/bookings", icon: CalendarDays },
    { name: "Menu", href: "/home/menu", icon: Utensils },
    { name: "Tables", href: "/home/tables", icon: Table2 },
    { name: "Restaurants", href: "/home/restaurants", icon: Store },
    { name: "Payment", href: "/home/payments", icon: CreditCard },
    { name: "Wallet", href: "/home/wallet", icon: Wallet },
    { name: "Notification", href: "/home/notifications", icon: Bell },
];

export default function OwnerNav({ handleDefaultResturant , socConnect}: OwnerNavProps) {
    const pathname = usePathname();

    return <>
    <ResturantNav handleDefaultResturant={handleDefaultResturant} socConnect ={socConnect} />
    <div className="fixed left-0 top-0 z-30 flex h-full min-w-50 w-[14%] flex-col items-start gap-2 border-r-2 border-[#DEC0BA] bg-[#F5F3F0] p-7 font-semibold text-[#646468]" >
    <div> <Image src="/Header_margin.svg" alt="logo" className="ml-7 mt-5 scale-140 " width={2000} height={10000} quality={100}/></div> 

    {navItems.map((item)=><Link
        key={item.href}
        href={item.href}
        type="button"
        className={`${(item.href === "/home" ? pathname === item.href : pathname.startsWith(item.href)) ? "bg-[#EAE8E5] border-r-5 border-[#A13924] text-[#A13924] ml-2" : ""} hover:bg-[#EAE8E5] rounded hover:border-r-5 hover:border-[#A13924] hover:text-[#A13924] hover:ml-2 w-full p-2 h-auto transition-all duration-200 flex flex-row gap-2 items-center cursor-pointer`}
    > <item.icon size={20} strokeWidth={2} aria-hidden="true" /> {item.name}</Link>
    )}
    </div>
    </>

}