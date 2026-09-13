"use client";

import { api } from "@/lib/api/axios";
import { adminContext } from "@/lib/context/Context";
import { Restaurant } from "@/lib/interfaces/order";
import Result from "@/lib/Result";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";

export default function Restaurants() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [search, setSearch] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const { setpopup, setservererror } = useContext(adminContext);

    useEffect(() => {
        const getRestaurants = async () => {
            try {
                const response = await api.get<Result<Restaurant[]>>("resturant/getAllResturants");
                if (response.data.Success) {
                    setRestaurants(response.data.Data ?? []);
                    console.log("Fetched restaurants:", response.data.Data);
                } else {
                    setpopup(response.data.Message);
                }
            } catch (error) {
                console.error("Error fetching restaurants:", error);
                setservererror("Unable to load restaurants. Please try again.");
            }
        };

        void getRestaurants();
    }, [setpopup, setservererror]);

    const filteredRestaurants = restaurants.filter((restaurant) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;

        return [
            restaurant.resturantName,
            restaurant.id,
            restaurant.resturantemail,
            restaurant.phone,
            restaurant.address,
        ].some((value) => value?.toLowerCase().includes(query));
    });

    const handleBanToggle = async (restaurant: Restaurant) => {
        const nextBannedState = !restaurant.isBanned;
        setUpdatingId(restaurant.id);

        try {
            const response = await api.patch<Result<Restaurant>>("/resturant/UpdateResturant", {
                id: restaurant.id,
                isBanned: nextBannedState,
            });

            if (response.data.Success) {
                setRestaurants((current) =>
                    current.map((item) =>
                        item.id === restaurant.id
                            ? { ...item, isBanned: nextBannedState }
                            : item,
                    ),
                );
                setpopup(response.data.Message || `Restaurant ${nextBannedState ? "banned" : "unbanned"} successfully.`);
            } else {
                setpopup(response.data.Message || "Unable to update restaurant status.");
            }
        } catch (error) {
            console.error("Error updating restaurant ban status:", error);
            setservererror("Unable to update restaurant status. Please try again.");
        } 
    };

    return (
        <div className="p-4">
            <div className="mb-5 flex flex-col gap-3">
                <h1 className="text-2xl font-bold text-[#2a2a2d]">Restaurants</h1>
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search restaurants..."
                    aria-label="Search restaurants"
                    className="w-full max-w-sm rounded border border-[#f0a393] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#8a8a8d]"
                />
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#f0a393] bg-white">
                <table className="min-w-full border-collapse text-left">
                    <thead className="bg-[#fdf5f3]">
                        <tr>
                            <th className="border-b border-[#f0a393] px-4 py-3">Restaurant</th>
                            <th className="border-b border-[#f0a393] px-4 py-3">Contact</th>
                            <th className="border-b border-[#f0a393] px-4 py-3">Address</th>
                            <th className="border-b border-[#f0a393] px-4 py-3">Status</th>
                            <th className="border-b border-[#f0a393] px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRestaurants.map((restaurant) => (
                            <tr key={restaurant.id} className="align-top">
                                <td className="border-b border-[#f0a393] px-4 py-3 font-semibold text-[#2a2a2d]">
                                    {restaurant.resturantName}
                                </td>
                                <td className="border-b border-[#f0a393] px-4 py-3 text-[#2a2a2d]">
                                    <div>{restaurant.resturantemail}</div>
                                    <div className="text-sm text-[#646468]">{restaurant.phone}</div>
                                </td>
                                <td className="border-b border-[#f0a393] px-4 py-3 text-[#2a2a2d]">
                                    {restaurant.address}
                                </td>
                                <td className="border-b border-[#f0a393] px-4 py-3">
                                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                        restaurant.isBanned
                                            ? "bg-[#f8d7da] text-[#721c24]"
                                            : "bg-[#e4f7ef] text-[#188260]"
                                    }`}>
                                        {restaurant.isBanned ? "Banned" : "Active"}
                                    </span>
                                </td>
                                <td className="border-b border-[#f0a393] px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Link
                                            href={`/user/Resturant/${restaurant.id}`}
                                            className="rounded bg-[#a13924] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#8b2f20]"
                                        >
                                            Visit Restaurant
                                        </Link>
                                        <Link
                                            href={`/admin/restaurants/${restaurant.id}`}
                                            className="rounded border border-[#a13924] px-3 py-1.5 text-sm font-semibold text-[#a13924] hover:bg-[#fdf5f3]"
                                        >
                                            Stats
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => void handleBanToggle(restaurant)}
                                            disabled={updatingId === restaurant.id}
                                            className={`rounded px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                                                restaurant.isBanned
                                                    ? "bg-[#188260] hover:bg-[#12684d]"
                                                    : "bg-[#646468] hover:bg-[#4d4d50]"
                                            }`}
                                        >
                                            {restaurant.isBanned ? "Unban" : "Ban"}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredRestaurants.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-[#646468]">
                                    No restaurants found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
