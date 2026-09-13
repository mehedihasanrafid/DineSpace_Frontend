"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/axios";
import Result from "@/lib/Result";
import { Restaurant } from "@/lib/interfaces/order";
import { resturantContext } from "@/lib/context/Context";
import AlerPopup from "@/components/alertPopup";
import OwnerNav from "@/components/OwnerNav";
import ServerError from "@/components/serverError";
import { socket } from "@/lib/websock/socket";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    const [defaultResturant, setDefaultResturant] = useState("");
    const [popup, setPopup] = useState("");
    const [servererror , setservererror] = useState("");
    const [Today , settoday] = useState<Date>();
    const [refreshOrders, setRefreshOrders] = useState(0);
    const [socConnect, setSocConnect] = useState(false);
    const [resturants, setResturants] = useState<{ id: string; resturantName?: string }[]>([]);
    // for fetching users data
    useEffect(() => {
        async function getUserData() {
            try {
                const { data } = await api.get<Result<{ resturants: Restaurant[] }>>("/user/Getme");
                const restaurants = data.Data?.resturants;

                if (!data.Success || !restaurants?.length) return;

                const restaurantOptions = restaurants.map((restaurant) => ({
                    id: restaurant.id,
                    resturantName: restaurant.resturantName,
                }));
                setResturants(restaurantOptions);
                localStorage.setItem("resids", JSON.stringify(restaurantOptions));

                const storedRestaurant = localStorage.getItem("defaultres");
                const restaurant = storedRestaurant
                    ? JSON.parse(storedRestaurant)
                    : { resturantName: restaurants[0].resturantName, id: restaurants[0].id };

                localStorage.setItem("defaultres", JSON.stringify(restaurant));
                setDefaultResturant(restaurant.id);
            } catch (error) {
                console.error(error);
            }
        }

        getUserData();
    }, []);


    // for websock resturent 
    useEffect(()=>{
        if(!defaultResturant) return;
        const handleConnect = ()=>{
           setSocConnect(true);
           console.log("soc connected" , socket.id);
           socket.emit(
                "subscribeRestaurant",
                {
                resturantId: defaultResturant,
                },
                (response: { success: boolean; message: string }) => {
                console.log("Subscription response:", response);
                },
            );
        }
        const handleDisconnect = ()=>{
           setSocConnect(false);
           console.log("soc Disconnected" );
        }
        const handleConnectError = (error: Error) => {
        console.error("WebSocket connection failed:", error.message);
        };

        const handleOrderChanged = (data: { orderId: string }) => {
            console.log("Order changed:", data);
            setRefreshOrders((p)=>p+1);
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.on("newOrder", handleOrderChanged);
        socket.auth = {
        token: localStorage.getItem("accesstoken"),
        };

        socket.connect();
        

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
            socket.off("newOrder", handleOrderChanged);
            socket.disconnect();
        };

    },[defaultResturant])



    // useEffect(()=>{
    //     settoday(new Date());
    // },[new Date().getMilliseconds])

    return (
        <resturantContext.Provider value={{ defaultResturant, setpopup: setPopup , setservererror , refreshOrders , resturants }}>
            <OwnerNav handleDefaultResturant={setDefaultResturant} socConnect = {socConnect} />
            {popup && <AlerPopup setpopup={() => setPopup("")} Message={popup} />}
            {servererror && <ServerError error={servererror} setservererror={() => setservererror("")}  />}
            <main className="relative z-0 ml-[max(16%,12.5rem)] mt-25 min-w-0">{children}</main>
        </resturantContext.Provider>
    );
}
