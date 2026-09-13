"use client"
import { api } from "@/lib/api/axios";
import { adminContext } from "@/lib/context/Context";
import { WithdrawalStatus } from "@/lib/Enums";
import { WithdrawalRequest } from "@/lib/interfaces/wallet";
import Result from "@/lib/Result";
import { useContext, useEffect, useState } from "react";

export default function Withdrawals() {
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const { setpopup, setservererror } = useContext(adminContext);
    const [status, setstatus] = useState(WithdrawalStatus.Pending);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const getWithdrawals = async () => {
            try {
                const response = await api.get<Result<WithdrawalRequest[]>>(`/wallet/withdrawals?status=${status}`);
                if (response.data.Success) {
                    setWithdrawals(response.data.Data ?? []);
                } else {
                    setpopup(response.data.Message);
                }
            } catch (error) {
                console.error("Error fetching withdrawals:", error);
                setservererror("Unable to load withdrawals. Please try again.");
            }
        };

        getWithdrawals();
    }, [setpopup, setservererror, status]);

    const filteredWithdrawals = withdrawals.filter((withdrawal) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;

        const restaurantName = withdrawal.wallet?.restaurant?.resturantName ?? withdrawal.restaurantName ?? "";

        return [
            restaurantName,
            withdrawal.id,
            withdrawal.accountNumber,
            withdrawal.paymentMethod,
            withdrawal.status,
        ].some((value) => value.toLowerCase().includes(query));
    });

    const totalAmount = filteredWithdrawals.reduce((total, withdrawal) => total + Number(withdrawal.amount), 0);

    const handleStatusUpdate = async (id: string, nextStatus: WithdrawalStatus) => {
        try {
            const response = await api.patch<Result<WithdrawalRequest>>(`/wallet/withdrawal/${id}/status`, {
                status: nextStatus,
            });

            if (response.data.Success) {
                setWithdrawals((current) => current.filter((withdrawal) => withdrawal.id !== id));
                setpopup(response.data.Message || `Withdrawal ${nextStatus}.`);
                return;
            }

            setpopup(response.data.Message || "Unable to update withdrawal status.");
        } catch (error) {
            console.error("Error updating withdrawal status:", error);
            setpopup("Unable to update withdrawal status. Please try again.");
        }
    };

    return (
        <div className="p-4">
            <div className="mb-4 flex flex-col gap-3">
                <h1 className="text-2xl font-bold text-[#2a2a2d]">Withdrawals</h1>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <button
                            type="button"
                            onClick={() => setstatus(WithdrawalStatus.Pending)}
                            className={`rounded px-3 py-1.5 font-medium ${status === WithdrawalStatus.Pending ? "bg-[#a13924] text-white" : "bg-[#f5e8e5] text-[#5c5c61]"}`}
                        >
                            Pending
                        </button>
                        <button
                            type="button"
                            onClick={() => setstatus(WithdrawalStatus.Approved)}
                            className={`rounded px-3 py-1.5 font-medium ${status === WithdrawalStatus.Approved ? "bg-[#a13924] text-white" : "bg-[#f5e8e5] text-[#5c5c61]"}`}
                        >
                            Approved
                        </button>
                        <button
                            type="button"
                            onClick={() => setstatus(WithdrawalStatus.Rejected)}
                            className={`rounded px-3 py-1.5 font-medium ${status === WithdrawalStatus.Rejected ? "bg-[#a13924] text-white" : "bg-[#f5e8e5] text-[#5c5c61]"}`}
                        >
                            Rejected
                        </button>
                    </div>

                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search restaurant, ID, account"
                        className="w-full max-w-sm rounded border border-[#f0a393] bg-white px-3 py-2 text-sm text-[#2a2a2d] outline-none ring-0 placeholder:text-[#8a8a8d]"
                    />
                </div>

                <p className="text-[#a13924] font-semibold">
                    {filteredWithdrawals.length} {status} withdrawal{filteredWithdrawals.length === 1 ? "" : "s"}
                    {filteredWithdrawals.length > 0 && (
                        <span className="ml-2 text-sm text-[#646468] font-normal">
                            (Total: {totalAmount.toFixed(2)} BDT)
                        </span>
                    )}
                </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#f0a393] bg-white">
                <table className="min-w-full border-collapse text-left">
                    <thead className="bg-[#fdf5f3]">
                        <tr>
                            <th className="border-b border-[#f0a393] px-4 py-3 font-semibold text-[#2a2a2d]">Restaurant</th>
                            <th className="border-b border-[#f0a393] px-4 py-3 font-semibold text-[#2a2a2d]">Restaurant Wallet</th>
                            <th className="border-b border-[#f0a393] px-4 py-3 font-semibold text-[#2a2a2d]">Contact</th>
                            <th className="border-b border-[#f0a393] px-4 py-3 font-semibold text-[#2a2a2d]">Account</th>
                            <th className="border-b border-[#f0a393] px-4 py-3 font-semibold text-[#2a2a2d]">Amount</th>
                            <th className="border-b border-[#f0a393] px-4 py-3 font-semibold text-[#2a2a2d]">Method</th>
                            <th className="border-b border-[#f0a393] px-4 py-3 font-semibold text-[#2a2a2d]">Date</th>
                            <th className="border-b border-[#f0a393] px-4 py-3 font-semibold text-[#2a2a2d]">Status</th>
                            <th className="border-b border-[#f0a393] px-4 py-3 font-semibold text-[#2a2a2d]">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredWithdrawals.map((withdrawal) => {
                            const restaurantName = withdrawal.wallet?.restaurant?.resturantName ?? withdrawal.restaurantName ?? "Restaurant";
                            const createdDate = withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            }) : "-";

                            return (
                                <tr key={withdrawal.id} className="align-top">
                                    <td className="border-b border-[#f0a393] px-4 py-3 text-[#2a2a2d]">{restaurantName}</td>
                                    <td className="border-b border-[#f0a393] px-4 py-3 text-[#2a2a2d]">
                                        {Number(withdrawal.wallet?.balance ?? withdrawal.amount).toFixed(2)} BDT
                                    </td>
                                    <td className="border-b border-[#f0a393] px-4 py-3 text-[#2a2a2d]">
                                        <a href={`tel:${withdrawal.wallet?.restaurant?.phone}`} className="text-blue-500 hover:underline">
                                            {withdrawal.wallet?.restaurant?.phone}
                                        </a>
                                    </td>
                                      <td className="border-b border-[#f0a393] px-4 py-3 font-semibold text-[#2a2a2d]">
                                        {Number(withdrawal.accountNumber)}
                                    </td>
                                    <td className="border-b border-[#f0a393] px-4 py-3 font-semibold text-[#2a2a2d]">
                                        {Number(withdrawal.amount).toFixed(2)} BDT
                                    </td>
                                    <td className="border-b border-[#f0a393] px-4 py-3 capitalize text-[#2a2a2d]">{withdrawal.paymentMethod}</td>
                                    <td className="border-b border-[#f0a393] px-4 py-3 text-[#2a2a2d]">{createdDate}</td>
                                    <td className="border-b border-[#f0a393] px-4 py-3">
                                        <span className="rounded-full bg-[#fef3c7] px-2 py-1 text-xs font-medium uppercase text-[#92400e]">
                                            {withdrawal.status}
                                        </span>
                                    </td>
                                    <td className="border-b border-[#f0a393] px-4 py-3">
                                        {withdrawal.status === WithdrawalStatus.Pending ? (
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusUpdate(withdrawal.id, WithdrawalStatus.Approved)}
                                                    className="rounded bg-[#188260] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#12684d]"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusUpdate(withdrawal.id, WithdrawalStatus.Rejected)}
                                                    className="rounded bg-[#a13924] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#8b2f20]"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-[#646468]">-</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}

                        {filteredWithdrawals.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-[#646468]">
                                    No withdrawals found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}