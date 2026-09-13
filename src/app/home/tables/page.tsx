"use client";

import { api } from "@/lib/api/axios";
import { resturantContext } from "@/lib/context/Context";
import { TableStatus } from "@/lib/Enums";
import { OrderTable } from "@/lib/interfaces/order";
import Result from "@/lib/Result";
import {
    Armchair,
    Edit3,
    Plus,
    Search,
    Trash2,
    Users,
    X,
} from "lucide-react";
import {
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

type StatusFilter = "All" | TableStatus;

interface TableForm {
    tableno: string;
    seatCapacity: string;
}

const emptyForm: TableForm = {
    tableno: "",
    seatCapacity: "",
};

export default function TablesPage() {
    const { defaultResturant, setpopup } =
        useContext(resturantContext);

    const [tables, setTables] = useState<OrderTable[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("All");

    const [showForm, setShowForm] = useState(false);
    const [editingTable, setEditingTable] =
        useState<OrderTable | null>(null);

    const [form, setForm] = useState<TableForm>(emptyForm);
    const [saving, setSaving] = useState(false);

    // --------------------------------------------------
    // Load tables
    // --------------------------------------------------

    const getTables = async () => {
        if (!defaultResturant) {
            setTables([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const { data } = await api.get<Result<OrderTable[]>>(
                `/tables/getTablesByResturantId/${defaultResturant}`
            );

            if (data.Success) {
                setTables(
                    (data.Data ?? []).sort(
                        (a, b) => a.tableno - b.tableno
                    )
                );
            } else {
                setpopup(data.Message);
            }
        } catch (error) {
            console.error(error);
            setpopup("Could not load tables");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getTables();
    }, [defaultResturant]);

    // --------------------------------------------------
    // Statistics
    // --------------------------------------------------

    const statistics = useMemo(() => {
        return {
            total: tables.length,

            available: tables.filter(
                (table) =>
                    table.status === TableStatus.Available
            ).length,

            occupied: tables.filter(
                (table) =>
                    table.status === TableStatus.Occupied
            ).length,

            reserved: tables.filter(
                (table) =>
                    table.status === TableStatus.Reserved
            ).length,

            cleaning: tables.filter(
                (table) =>
                    table.status === TableStatus.Cleaning
            ).length,
        };
    }, [tables]);

    // --------------------------------------------------
    // Search + filter
    // --------------------------------------------------

    const filteredTables = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return tables.filter((table) => {
            const matchesSearch =
                table.tableno
                    .toString()
                    .includes(search) ||
                table.seatCapacity
                    .toString()
                    .includes(search);

            const matchesStatus =
                statusFilter === "All" ||
                table.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [tables, searchTerm, statusFilter]);

    // --------------------------------------------------
    // Open Add Table form
    // --------------------------------------------------

    const openAddForm = () => {
        setEditingTable(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    // --------------------------------------------------
    // Open Edit Table form
    // --------------------------------------------------

    const openEditForm = (table: OrderTable) => {
        setEditingTable(table);

        setForm({
            tableno: table.tableno.toString(),
            seatCapacity: table.seatCapacity.toString(),
        });

        setShowForm(true);
    };

    const closeForm = () => {
        if (saving) return;

        setShowForm(false);
        setEditingTable(null);
        setForm(emptyForm);
    };

    // --------------------------------------------------
    // Add / Update table
    // --------------------------------------------------

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!defaultResturant) {
            setpopup("Please select a restaurant first");
            return;
        }

        const tableNumber = Number(form.tableno);
        const seatCapacity = Number(form.seatCapacity);

        if (
            !Number.isInteger(tableNumber) ||
            tableNumber < 1
        ) {
            setpopup("Please enter a valid table number");
            return;
        }

        if (
            !Number.isInteger(seatCapacity) ||
            seatCapacity < 1
        ) {
            setpopup("Seat capacity must be at least 1");
            return;
        }

        try {
            setSaving(true);

            // ---------------- ADD ----------------
            if (!editingTable) {
                const payload = [
                    {
                        tableno: tableNumber,
                        seatCapacity,
                        status: TableStatus.Available,
                        resturantid: defaultResturant,
                    },
                ];

                const { data } = await api.post<
                    Result<OrderTable[]>
                >("/tables/creatTable", payload);

                if (!data.Success) {
                    setpopup(data.Message);
                    return;
                }

                setpopup("Table added successfully");
            }

            // ---------------- UPDATE ----------------
            else {
                const payload = [
                    {
                        id: editingTable.id,
                        tableno: tableNumber,
                        seatCapacity,
                        status: editingTable.status,
                        resturantid: defaultResturant,
                    },
                ];

                const { data } = await api.patch<
                    Result<OrderTable[]>
                >("/tables/update", payload);

                if (!data.Success) {
                    setpopup(data.Message);
                    return;
                }

                setpopup("Table updated successfully");
            }

            closeForm();
            await getTables();
        } catch (error) {
            console.error(error);
            setpopup(
                editingTable
                    ? "Could not update table"
                    : "Could not add table"
            );
        } finally {
            setSaving(false);
        }
    };

    // --------------------------------------------------
    // Delete table
    // --------------------------------------------------

    const deleteTable = async (table: OrderTable) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete Table ${table.tableno}?`
        );

        if (!confirmed) return;

        try {
            const { data } = await api.delete<Result<unknown>>(
                `/tables/DeleteTable/${table.id}`
            );

            if (!data.Success) {
                setpopup(data.Message);
                return;
            }

            setTables((previous) =>
                previous.filter(
                    (currentTable) =>
                        currentTable.id !== table.id
                )
            );

            setpopup("Table deleted successfully");
        } catch (error) {
            console.error(error);
            setpopup("Could not delete table");
        }
    };

    // --------------------------------------------------
    // Change table status
    // --------------------------------------------------

    const changeStatus = async (
        table: OrderTable,
        newStatus: TableStatus
    ) => {
        const previousStatus = table.status;

        setTables((previous) =>
            previous.map((currentTable) =>
                currentTable.id === table.id
                    ? {
                          ...currentTable,
                          status: newStatus,
                      }
                    : currentTable
            )
        );

        let endpoint = "";

        switch (newStatus) {
            case TableStatus.Available:
                endpoint = `/tables/TableMakeaAvailable/${table.id}`;
                break;

            case TableStatus.Occupied:
                endpoint = `/tables/TableMakeaoccupied/${table.id}`;
                break;

            case TableStatus.Reserved:
                endpoint = `/tables/TableMakereserved/${table.id}`;
                break;

            case TableStatus.Cleaning:
                endpoint = `/tables/TableMakeCleaning/${table.id}`;
                break;
        }

        try {
            const { data } = await api.patch<
                Result<OrderTable>
            >(endpoint);

            if (!data.Success) {
                throw new Error(data.Message);
            }
        } catch (error) {
            console.error(error);

            // rollback
            setTables((previous) =>
                previous.map((currentTable) =>
                    currentTable.id === table.id
                        ? {
                              ...currentTable,
                              status: previousStatus,
                          }
                        : currentTable
                )
            );

            setpopup("Could not change table status");
        }
    };

    return (
        <div className="mt-5 pr-5">
            {/* Header */}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-[30px] font-semibold text-[#27221E]">
                        Table Management
                    </h1>

                    <p className="text-sm text-gray-600">
                        Add tables, manage seating capacity and
                        update table availability.
                    </p>
                </div>

                <button
                    onClick={openAddForm}
                    className="flex w-fit cursor-pointer items-center gap-2 rounded-[10px] bg-[#A13924] px-4 py-2 text-white transition hover:scale-[0.98]"
                >
                    <Plus size={20} strokeWidth={3} />
                    Add Table
                </button>
            </div>

            {/* Statistics */}

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard
                    title="Total Tables"
                    value={statistics.total}
                    icon={<Armchair size={20} />}
                />

                <StatCard
                    title="Available"
                    value={statistics.available}
                />

                <StatCard
                    title="Occupied"
                    value={statistics.occupied}
                />

                <StatCard
                    title="Reserved"
                    value={statistics.reserved}
                />

                <StatCard
                    title="Cleaning"
                    value={statistics.cleaning}
                />
            </div>

            {/* Search and filter */}

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
                <label className="relative block w-full max-w-sm">
                    <Search
                        size={18}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7168]"
                    />

                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(
                                event.target.value
                            )
                        }
                        placeholder="Search table..."
                        className="w-full rounded-lg border border-[#dec0ba] bg-white py-2 pl-10 pr-3 text-sm text-[#28211e] outline-none transition placeholder:text-[#a58d85] focus:border-[#A13924] focus:ring-2 focus:ring-[#A13924]/15"
                    />
                </label>

                <select
                    value={statusFilter}
                    onChange={(event) =>
                        setStatusFilter(
                            event.target
                                .value as StatusFilter
                        )
                    }
                    className="w-full rounded-lg border border-[#dec0ba] bg-white px-3 py-2 text-sm outline-none focus:border-[#A13924] md:w-48"
                >
                    <option value="All">
                        All Status
                    </option>

                    {Object.values(TableStatus).map(
                        (status) => (
                            <option
                                key={status}
                                value={status}
                            >
                                {status}
                            </option>
                        )
                    )}
                </select>

                <span className="rounded-full border border-[#dec0ba] bg-[#fff8f5] px-3 py-2 text-sm text-[#654f48]">
                    {filteredTables.length}{" "}
                    {filteredTables.length === 1
                        ? "table"
                        : "tables"}{" "}
                    found
                </span>
            </div>

            {/* Table list */}

            <div className="mt-5 h-[58vh] overflow-auto rounded-xl border border-[#dec0ba] bg-white scrollbar-none">
                <table className="w-full min-w-[850px] table-fixed text-left">
                    <thead className="sticky top-0 z-10 border-b border-[#dec0ba] bg-white text-[14px] uppercase tracking-wide text-[#654f48]">
                        <tr>
                            <th className="px-5 py-4 font-semibold">
                                Table No.
                            </th>

                            <th className="px-5 py-4 font-semibold">
                                Seats
                            </th>

                            <th className="px-5 py-4 font-semibold">
                                Status
                            </th>

                            <th className="px-5 py-4 font-semibold">
                                Reservation
                            </th>

                            <th className="px-5 py-4 text-right font-semibold">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-5 py-12 text-center text-gray-500"
                                >
                                    Loading tables...
                                </td>
                            </tr>
                        ) : filteredTables.length ===
                          0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-5 py-12 text-center text-gray-500"
                                >
                                    No tables found
                                </td>
                            </tr>
                        ) : (
                            filteredTables.map(
                                (table) => (
                                    <tr
                                        key={table.id}
                                        className="border-b border-[#ead9d4] transition last:border-0 hover:bg-[#fcf7f4]"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-[#28211e]">
                                                Table{" "}
                                                {
                                                    table.tableno
                                                }
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <Users
                                                    size={
                                                        17
                                                    }
                                                    className="text-[#A13924]"
                                                />

                                                <span>
                                                    {
                                                        table.seatCapacity
                                                    }{" "}
                                                    seats
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-2">
                                                <StatusBadge
                                                    status={
                                                        table.status
                                                    }
                                                />

                                                <select
                                                    value={
                                                        table.status
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        changeStatus(
                                                            table,
                                                            event
                                                                .target
                                                                .value as TableStatus
                                                        )
                                                    }
                                                    className="w-36 rounded-lg border border-[#dec0ba] bg-white px-2 py-1.5 text-xs outline-none focus:border-[#A13924]"
                                                >
                                                    {Object.values(
                                                        TableStatus
                                                    ).map(
                                                        (
                                                            status
                                                        ) => (
                                                            <option
                                                                key={
                                                                    status
                                                                }
                                                                value={
                                                                    status
                                                                }
                                                            >
                                                                {
                                                                    status
                                                                }
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            {table.reservationId ? (
                                                <span className="rounded-md bg-[#fff0cf] px-3 py-1 text-xs font-medium text-[#8b6100]">
                                                    Reserved
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400">
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() =>
                                                        openEditForm(
                                                            table
                                                        )
                                                    }
                                                    title="Edit table"
                                                    className="cursor-pointer text-[#A13924] transition hover:scale-90"
                                                >
                                                    <Edit3
                                                        size={
                                                            20
                                                        }
                                                    />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        deleteTable(
                                                            table
                                                        )
                                                    }
                                                    title="Delete table"
                                                    className="cursor-pointer text-red-600 transition hover:scale-90"
                                                >
                                                    <Trash2
                                                        size={
                                                            20
                                                        }
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add / Edit Modal */}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-[#dec0ba] bg-white p-6 shadow-xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-[#27221E]">
                                    {editingTable
                                        ? "Edit Table"
                                        : "Add Table"}
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    {editingTable
                                        ? "Update table number or seating capacity."
                                        : "Create a new restaurant table."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                className="cursor-pointer rounded-lg p-1 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="mt-6 flex flex-col gap-4"
                        >
                            <label>
                                <span className="mb-1 block text-sm font-medium text-[#554742]">
                                    Table Number
                                </span>

                                <input
                                    type="number"
                                    min="1"
                                    value={form.tableno}
                                    onChange={(event) =>
                                        setForm(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,
                                                tableno:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    required
                                    placeholder="Example: 5"
                                    className="w-full rounded-lg border border-[#dec0ba] px-3 py-2 outline-none focus:border-[#A13924] focus:ring-2 focus:ring-[#A13924]/15"
                                />
                            </label>

                            <label>
                                <span className="mb-1 block text-sm font-medium text-[#554742]">
                                    Seat Capacity
                                </span>

                                <input
                                    type="number"
                                    min="1"
                                    value={
                                        form.seatCapacity
                                    }
                                    onChange={(event) =>
                                        setForm(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,
                                                seatCapacity:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    required
                                    placeholder="Example: 4"
                                    className="w-full rounded-lg border border-[#dec0ba] px-3 py-2 outline-none focus:border-[#A13924] focus:ring-2 focus:ring-[#A13924]/15"
                                />
                            </label>

                            <div className="mt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={saving}
                                    className="cursor-pointer rounded-lg border border-[#dec0ba] px-4 py-2 text-sm text-[#554742] hover:bg-[#fcf7f4]"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="cursor-pointer rounded-lg bg-[#A13924] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingTable
                                        ? "Update Table"
                                        : "Add Table"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// --------------------------------------------------
// Small components used only by your Tables page
// --------------------------------------------------

function StatCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: number;
    icon?: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-[#dec0ba] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-sm text-[#654f48]">
                    {title}
                </span>

                {icon && (
                    <span className="text-[#A13924]">
                        {icon}
                    </span>
                )}
            </div>

            <div className="mt-2 text-2xl font-bold text-[#27221E]">
                {value}
            </div>
        </div>
    );
}

function StatusBadge({
    status,
}: {
    status: TableStatus;
}) {
    const styles: Record<TableStatus, string> = {
        [TableStatus.Available]:
            "bg-green-100 text-green-700",

        [TableStatus.Occupied]:
            "bg-red-100 text-red-700",

        [TableStatus.Reserved]:
            "bg-amber-100 text-amber-700",

        [TableStatus.Cleaning]:
            "bg-blue-100 text-blue-700",
    };

    return (
        <span
            className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
        >
            {status}
        </span>
    );
}