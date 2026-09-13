import { resturantContext } from "@/lib/context/Context";
import { useContext, useEffect, useState, type ChangeEvent } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface Resturant{
    id:string;
    resturantName?:string;
}

interface func{
    handleDefaultResturant:(id:string)=> void;
    socConnect:boolean;
}

export default function ResturantNav({handleDefaultResturant , socConnect}:func) {
    const [defaultResturant, setdefaultResturant] = useState<Resturant>({ id: "", resturantName: "No resturant Found" });
    const { resturants } = useContext(resturantContext);
    const router = useRouter();


    useEffect(() => {
        if(!resturants?.length) return;
        const defaultResturant = localStorage.getItem("defaultres");
        const allres = localStorage.getItem("resids");

  
        if (!defaultResturant) {
            setdefaultResturant({ id: "", resturantName: "No resturant Found" });
            return;
        }

        try {
            const parsedRes = JSON.parse(defaultResturant);
            setdefaultResturant(parsedRes);
        } catch {
            setdefaultResturant({ id: "", resturantName: "No resturant Found" });
        }
        console.log("res loadin..")
        
    }, [resturants]);

    useEffect(()=>{
        handleDefaultResturant(defaultResturant.id);
    },[defaultResturant.id]);

    const handleresturantchange = (id:string) => {
        if(!resturants?.length) return;
        const selectedRestaurant = resturants?.find((restaurant) => restaurant.id === id);
        if (!selectedRestaurant) return;

        console.log("hit resturant toggle")
        console.log(id);
        setdefaultResturant(selectedRestaurant);
        localStorage.setItem("defaultres", JSON.stringify(selectedRestaurant));
    };

    const handleLogout = () => {
        localStorage.removeItem("accesstoken");
        document.cookie = "accesstoken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        router.replace("/auth");
    };


    return (
        // <resturantContext.Provider value={defaultResturant}>
        <>
            <div className="fixed left-0 right-0 top-0 z-40 flex min-h-20 flex-row items-center gap-3 border-b border-[#DEC0BA] bg-[#FBF9F6] p-4 font-black shadow-sm sm:min-h-21 sm:gap-5 sm:p-5 md:left-[14%]">
                <span className="relative block">
                <select
                    name="resturentName"
                    className="w-56 appearance-none rounded-xl border border-[#DEC0BA] bg-white px-4 py-2.5 pr-10 text-sm font-bold tracking-wide text-[#514947] shadow-sm outline-none transition hover:border-[#C77A6A] focus:border-[#A13924] focus:ring-2 focus:ring-[#A13924]/15"
                    value={defaultResturant.id}
                    onChange={(e)=> handleresturantchange(e.target.value)}
                    id="resturent-name"
                >
                    <option value={defaultResturant.id}>{(defaultResturant.resturantName ?? "Unnamed restaurant").toUpperCase()}</option>
                    {resturants && resturants!
                        .filter((restaurant) => restaurant.id !== defaultResturant.id)
                        .map((restaurant) => (
                            <option  key={restaurant.id} value={restaurant.id}>
                                {(restaurant.resturantName ?? "Unnamed restaurant").toUpperCase()}
                            </option>
                        ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#A13924]" size={18}/>
                </span>
                <span
                    role="status"
                    aria-live="polite"
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold tracking-wide shadow-sm ${
                        socConnect
                            ? "border-[#B9E8C8] bg-[#ECFAF0] text-[#168044]"
                            : "border-[#F1C4BE] bg-[#FFF0EE] text-[#B42318]"
                    }`}
                >
                    <span
                        aria-hidden="true"
                        className={`h-2.5 w-2.5 rounded-full ${
                            socConnect ? "bg-[#22A05A] shadow-[0_0_0_3px_rgba(34,160,90,0.15)]" : "bg-[#D0443E]"
                        }`}
                    />
                    {socConnect ? "You are live" : "You are offline"}
                </span>
                <button
                    type="button"
                    onClick={handleLogout}
                    aria-label="Log out"
                    className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#DEC0BA] bg-white px-3 py-2 text-sm font-bold text-[#A13924] shadow-sm transition hover:border-[#A13924] hover:bg-[#F5F3F0] focus:outline-none focus:ring-2 focus:ring-[#A13924]/20"
                >
                    <LogOut size={18} aria-hidden="true" />
                    <span className="hidden sm:inline">Log out</span>
                </button>
            </div>
        </>
        // </resturantContext.Provider>
    );
}
