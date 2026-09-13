"use client";

import { api } from "@/lib/api/axios";
import { resturantContext } from "@/lib/context/Context";
import { Restaurant } from "@/lib/interfaces/order";
import Result from "@/lib/Result";
import { Search, PenLine, SaveCheck, X, Upload, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import Togglebutton from "@/components/Togglebutton";

export default function RestaurantsPage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Restaurant>>({});
    const [isCreating, setIsCreating] = useState(false);
    const [createForm, setCreateForm] = useState<Partial<Restaurant>>({
        resturantName: "", address: "", opening: "", closing: "", phone: "", resturantemail: "", isopen: false, payfirst: false
    });
    const [createLogoFile, setCreateLogoFile] = useState<File | null>(null);
    const [createCoverFile, setCreateCoverFile] = useState<File | null>(null);

    const { setpopup, setservererror } = useContext(resturantContext);

    const loadRestaurants = async () => {
        setLoading(true);
        try {
            const { data } = await api.get<Result<Restaurant[]>>("/resturant/getMyresturants");
            if (data.Success && data.Data) {
                setRestaurants(data.Data);
                setFilteredRestaurants(data.Data);
            } else {
                setservererror(data.Message || "Failed to load restaurants.");
            }
        } catch (error) {
            console.error(error);
            setservererror("An error occurred while loading restaurants.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRestaurants();
    }, []);

    useEffect(() => {
        const query = searchTerm.trim().toLowerCase();
        setFilteredRestaurants(
            restaurants.filter((res) =>
                [res.resturantName, res.address, res.resturantemail].some((value) =>
                    value?.toLowerCase().includes(query)
                )
            )
        );
    }, [searchTerm, restaurants]);

    const getImageUrl = (path?: string | null) => {
        if (!path) return "/brokenOrderImage.jpg";
        const normalizedPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
        if (normalizedPath.startsWith("http")) return encodeURI(normalizedPath);
        const baseUrl = api.defaults.baseURL?.replace(/\/$/, "");
        return encodeURI(`${baseUrl}/${normalizedPath}`);
    };

    const startEdit = (res: Restaurant) => {
        setEditingId(res.id);
        setEditForm({
            resturantName: res.resturantName,
            address: res.address,
            isopen: res.isopen,
            opening: res.opening,
            closing: res.closing,
            payfirst: res.payfirst,
        });
    };

    const handleSave = async (id: string) => {
        // Validation check for empty strings
        if (!editForm.resturantName || !editForm.opening || !editForm.closing) {
            setpopup("Please fill in all required fields.");
            return;
        }

        // Ensure time format is strictly HH:mm (strip seconds if added by mobile browsers)
        const formatTime = (timeStr?: string) => timeStr ? timeStr.substring(0, 5) : "";

        const payload = {
            id,
            resturantName: editForm.resturantName,
            address: editForm.address,
            isopen: editForm.isopen,
            opening: formatTime(editForm.opening),
            closing: formatTime(editForm.closing),
            payfirst: editForm.payfirst,
        };

        try {
            const { data } = await api.patch<Result<Restaurant>>("/resturant/UpdateResturant", payload);
            if (data.Success) {
                setpopup("Restaurant details updated successfully!");
                setEditingId(null);
                loadRestaurants();
            } else {
                setpopup(data.Message || "Failed to update restaurant.");
            }
        } catch (error) {
            console.error(error);
            setpopup("Error updating restaurant details.");
        }
    };

    const handleCreate = async () => {
        if (!createForm.resturantName || !createForm.opening || !createForm.closing || !createForm.phone || !createForm.resturantemail) {
            setpopup("Please fill in all required fields.");
            return;
        }
        const formatTime = (timeStr?: string) => timeStr ? timeStr.substring(0, 5) : "";
        
        const payload = {
            resturantName: createForm.resturantName,
            address: createForm.address || "",
            isopen: createForm.isopen || false,
            opening: formatTime(createForm.opening),
            closing: formatTime(createForm.closing),
            payfirst: createForm.payfirst || false,
            phone: createForm.phone,
            resturantemail: createForm.resturantemail,
        };

        try {
            const { data } = await api.post<Result<any>>("/resturant/CreateResturant", payload);
            if (data.Success && data.Data?.id) {
                const newId = data.Data.id;
                
                // Upload files if provided
                if (createLogoFile) await handleFileUpload(newId, createLogoFile, "logo", false);
                if (createCoverFile) await handleFileUpload(newId, createCoverFile, "cover", false);

                setpopup("Restaurant created successfully!");
                setIsCreating(false);
                setCreateForm({ resturantName: "", address: "", opening: "", closing: "", phone: "", resturantemail: "", isopen: false, payfirst: false });
                setCreateLogoFile(null);
                setCreateCoverFile(null);
                loadRestaurants();
            } else {
                setpopup(data.Message || "Failed to create restaurant.");
            }
        } catch (error) {
            console.error(error);
            setpopup("Error creating restaurant.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this restaurant? This cannot be undone.")) return;
        try {
            const { data } = await api.delete<Result<any>>(`/resturant/DeleteResturant/${id}`);
            if (data.Success) {
                setpopup("Restaurant deleted successfully!");
                loadRestaurants();
            } else {
                setpopup(data.Message || "Failed to delete restaurant.");
            }
        } catch (error) {
            console.error(error);
            setpopup("Error deleting restaurant.");
        }
    };

    const handleFileUpload = async (id: string, file: File, type: "logo" | "cover", showPopup = true) => {
        if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
            setpopup("Invalid file type. Only JPG and PNG are allowed.");
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            setpopup("Image size must be 3 MB or less.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const { data } = await api.post<Result<any>>(
                `/files/uploadImages?resturantId=${id}&restaurantFileType=${type}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            if (data.Success) {
                if (showPopup) {
                    setpopup(`${type === "logo" ? "Logo" : "Cover"} uploaded successfully!`);
                    loadRestaurants();
                }
            } else {
                setpopup(data.Message || `Failed to upload ${type}.`);
            }
        } catch (error) {
            console.error(error);
            setpopup(`Error uploading ${type}.`);
        }
    };

    return (
        <div className="mt-5 mr-5 md:mr-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col">
                    <div className="text-[30px] font-semibold">Restaurants Management</div>
                    <div className="text-gray-600 ">Manage your restaurant profiles, addresses, and operational status.</div>
                    <span>
                        <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-[#dec0ba] bg-[#fff8f5] px-3 py-1.5 text-sm font-medium text-[#654f48]">
                            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#A13924] px-1.5 text-xs font-bold text-white">
                                {filteredRestaurants.length}
                            </span>
                            {filteredRestaurants.length === 1 ? "restaurant" : "restaurants"} found
                        </span>
                        <label className="relative mt-3 block w-full max-w-sm">
                            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7168]" />
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search restaurants..."
                                aria-label="Search restaurants"
                                className="w-full rounded-lg border border-[#dec0ba] bg-white py-2 pl-10 pr-3 text-sm text-[#28211e] outline-none transition placeholder:text-[#a58d85] focus:border-[#A13924] focus:ring-2 focus:ring-[#A13924]/15"
                            />
                        </label>
                    </span>
                </div>
                {!isCreating && (
                    <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 bg-[#A13924] text-white px-5 py-2.5 rounded-lg font-semibold hover:scale-95 transition-transform">
                        <Plus size={18} /> Add Restaurant
                    </button>
                )}
            </div>

            <div className="mt-8 flex flex-col gap-8 pb-10">
                {isCreating && (
                    /* CREATE MODE */
                    <div className="flex flex-col rounded-xl border-2 border-[#A13924] bg-white overflow-hidden shadow-sm">
                        <div className="bg-[#fff8f5] px-6 py-4 border-b border-[#dec0ba] flex justify-between items-center flex-wrap gap-4">
                            <h3 className="text-lg font-bold text-[#A13924]">Create New Restaurant</h3>
                            <div className="flex gap-2">
                                <button onClick={() => setIsCreating(false)} className="flex items-center gap-2 bg-[#EFEEEB] px-4 py-2 rounded-lg text-[#28211e] font-semibold hover:bg-gray-200 transition-colors">
                                    <X size={18} /> Cancel
                                </button>
                                <button onClick={handleCreate} className="flex items-center gap-2 bg-[#A13924] text-white px-4 py-2 rounded-lg font-semibold hover:scale-95 transition-transform">
                                    <SaveCheck size={18} /> Create
                                </button>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <label className="font-medium text-sm text-[#28211e]">Restaurant Name <span className="text-red-700">*</span></label>
                                    <input
                                        type="text"
                                        value={createForm.resturantName}
                                        onChange={e => setCreateForm({ ...createForm, resturantName: e.target.value })}
                                        className="h-10 rounded-[8px] border border-gray-400 px-3 outline-none focus:border-[#A13924] focus:ring-1 focus:ring-[#A13924]"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-medium text-sm text-[#28211e]">Address</label>
                                    <input
                                        type="text"
                                        value={createForm.address}
                                        onChange={e => setCreateForm({ ...createForm, address: e.target.value })}
                                        className="h-10 rounded-[8px] border border-gray-400 px-3 outline-none focus:border-[#A13924] focus:ring-1 focus:ring-[#A13924]"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="font-medium text-sm text-[#28211e]">Opening Time <span className="text-red-700">*</span></label>
                                        <input
                                            type="time"
                                            value={createForm.opening}
                                            onChange={e => setCreateForm({ ...createForm, opening: e.target.value })}
                                            className="h-10 rounded-[8px] border border-gray-400 px-3 outline-none focus:border-[#A13924] focus:ring-1 focus:ring-[#A13924]"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="font-medium text-sm text-[#28211e]">Closing Time <span className="text-red-700">*</span></label>
                                        <input
                                            type="time"
                                            value={createForm.closing}
                                            onChange={e => setCreateForm({ ...createForm, closing: e.target.value })}
                                            className="h-10 rounded-[8px] border border-gray-400 px-3 outline-none focus:border-[#A13924] focus:ring-1 focus:ring-[#A13924]"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="flex items-center gap-3">
                                        <span onClick={() => setCreateForm({ ...createForm, isopen: !createForm.isopen })} className="cursor-pointer">
                                            <Togglebutton ischecked={createForm.isopen ?? false} />
                                        </span>
                                        <label className="font-medium text-sm text-[#28211e]">Currently Open</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span onClick={() => setCreateForm({ ...createForm, payfirst: !createForm.payfirst })} className="cursor-pointer">
                                            <Togglebutton ischecked={createForm.payfirst ?? false} />
                                        </span>
                                        <label className="font-medium text-sm text-[#28211e]">Pay First</label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <label className="font-medium text-sm text-[#28211e]">Email Address <span className="text-red-700">*</span></label>
                                    <input
                                        type="email"
                                        value={createForm.resturantemail}
                                        onChange={e => setCreateForm({ ...createForm, resturantemail: e.target.value })}
                                        className="h-10 rounded-[8px] border border-gray-400 px-3 outline-none focus:border-[#A13924] focus:ring-1 focus:ring-[#A13924]"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-medium text-sm text-[#28211e]">Phone Number <span className="text-red-700">*</span></label>
                                    <input
                                        type="text"
                                        value={createForm.phone}
                                        onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                                        className="h-10 rounded-[8px] border border-gray-400 px-3 outline-none focus:border-[#A13924] focus:ring-1 focus:ring-[#A13924]"
                                        placeholder="+8801XXXXXXXX"
                                    />
                                </div>
                                <div className="mt-4 flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="font-medium text-sm text-[#28211e]">Restaurant Logo (Max 3MB, JPG/PNG)</label>
                                        <div className="text-xs text-gray-500 mb-1">Recommended dimension: 1:1 ratio (e.g. 500x500px)</div>
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-20 w-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                                                {createLogoFile ? (
                                                    <Image src={URL.createObjectURL(createLogoFile)} alt="Logo Preview" fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">Logo</div>
                                                )}
                                            </div>
                                            <label className="cursor-pointer flex items-center gap-2 bg-[#f7e9e5] text-[#A13924] px-4 py-2 rounded-lg hover:bg-[#ead9d4] transition-colors text-sm font-semibold">
                                                <Upload size={16} /> Choose Logo
                                                <input type="file" className="sr-only" accept="image/jpeg,image/png,image/jpg" onChange={(e) => e.target.files?.[0] && setCreateLogoFile(e.target.files[0])} />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="font-medium text-sm text-[#28211e]">Cover Image (Max 3MB, JPG/PNG)</label>
                                        <div className="text-xs text-gray-500 mb-1">Recommended dimension: 16:9 ratio (e.g. 1920x1080px)</div>
                                        <div className="flex flex-col gap-4">
                                            <div className="relative h-40 w-full max-w-sm rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                                                {createCoverFile ? (
                                                    <Image src={URL.createObjectURL(createCoverFile)} alt="Cover Preview" fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">Cover Image</div>
                                                )}
                                            </div>
                                            <label className="cursor-pointer flex items-center justify-center gap-2 bg-[#f7e9e5] text-[#A13924] px-4 py-2 rounded-lg hover:bg-[#ead9d4] transition-colors text-sm font-semibold w-fit">
                                                <Upload size={16} /> Choose Cover
                                                <input type="file" className="sr-only" accept="image/jpeg,image/png,image/jpg" onChange={(e) => e.target.files?.[0] && setCreateCoverFile(e.target.files[0])} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {loading ? (
                    <div className="flex items-center justify-center p-10 text-[#654f48] font-medium">Loading restaurants...</div>
                ) : filteredRestaurants.length === 0 ? (
                    <div className="flex items-center justify-center p-10 text-[#654f48] font-medium border border-dashed border-[#dec0ba] rounded-xl bg-[#fff8f5]">No restaurants found matching your criteria.</div>
                ) : (
                    filteredRestaurants.map((res) => (
                        <div key={res.id}>
                            {editingId === res.id ? (
                                /* EDIT MODE */
                                <div className="flex flex-col rounded-xl border-2 border-[#A13924] bg-white overflow-hidden shadow-sm">
                                    <div className="bg-[#fff8f5] px-6 py-4 border-b border-[#dec0ba] flex justify-between items-center flex-wrap gap-4">
                                        <h3 className="text-lg font-bold text-[#A13924]">Edit Restaurant: {res.resturantName}</h3>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingId(null)} className="flex items-center gap-2 bg-[#EFEEEB] px-4 py-2 rounded-lg text-[#28211e] font-semibold hover:bg-gray-200 transition-colors">
                                                <X size={18} /> Discard
                                            </button>
                                            <button onClick={() => handleSave(res.id)} className="flex items-center gap-2 bg-[#A13924] text-white px-4 py-2 rounded-lg font-semibold hover:scale-95 transition-transform">
                                                <SaveCheck size={18} /> Save Changes
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="flex flex-col gap-5">
                                            <div className="flex flex-col gap-2">
                                                <label className="font-medium text-sm text-[#28211e]">Restaurant Name <span className="text-red-700">*</span></label>
                                                <input
                                                    type="text"
                                                    value={editForm.resturantName || ""}
                                                    onChange={e => setEditForm({ ...editForm, resturantName: e.target.value })}
                                                    className="h-10 rounded-[8px] border border-gray-400 px-3 outline-none focus:border-[#A13924] focus:ring-1 focus:ring-[#A13924]"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="font-medium text-sm text-[#28211e]">Address</label>
                                                <input
                                                    type="text"
                                                    value={editForm.address || ""}
                                                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                                    className="h-10 rounded-[8px] border border-gray-400 px-3 outline-none focus:border-[#A13924] focus:ring-1 focus:ring-[#A13924]"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-2">
                                                    <label className="font-medium text-sm text-[#28211e]">Opening Time <span className="text-red-700">*</span></label>
                                                    <input
                                                        type="time"
                                                        value={editForm.opening || ""}
                                                        onChange={e => setEditForm({ ...editForm, opening: e.target.value })}
                                                        className="h-10 rounded-[8px] border border-gray-400 px-3 outline-none focus:border-[#A13924] focus:ring-1 focus:ring-[#A13924]"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="font-medium text-sm text-[#28211e]">Closing Time <span className="text-red-700">*</span></label>
                                                    <input
                                                        type="time"
                                                        value={editForm.closing || ""}
                                                        onChange={e => setEditForm({ ...editForm, closing: e.target.value })}
                                                        className="h-10 rounded-[8px] border border-gray-400 px-3 outline-none focus:border-[#A13924] focus:ring-1 focus:ring-[#A13924]"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                <div className="flex items-center gap-3">
                                                    <span onClick={() => setEditForm({ ...editForm, isopen: !editForm.isopen })} className="cursor-pointer">
                                                        <Togglebutton ischecked={editForm.isopen ?? false} />
                                                    </span>
                                                    <label className="font-medium text-sm text-[#28211e]">Currently Open</label>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span onClick={() => setEditForm({ ...editForm, payfirst: !editForm.payfirst })} className="cursor-pointer">
                                                        <Togglebutton ischecked={editForm.payfirst ?? false} />
                                                    </span>
                                                    <label className="font-medium text-sm text-[#28211e]">Pay First</label>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-[#dec0ba] flex flex-col gap-4">
                                                <div className="flex flex-col gap-2">
                                                    <label className="font-medium text-sm text-gray-500">Email (Read-Only)</label>
                                                    <input type="email" value={res.resturantemail} disabled className="h-10 rounded-[8px] border border-gray-200 bg-gray-100 px-3 text-gray-500 cursor-not-allowed" />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="font-medium text-sm text-gray-500">Phone (Read-Only)</label>
                                                    <input type="text" value={res.phone} disabled className="h-10 rounded-[8px] border border-gray-200 bg-gray-100 px-3 text-gray-500 cursor-not-allowed" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-6">
                                            <div className="flex flex-col gap-2">
                                                <label className="font-medium text-sm text-[#28211e]">Restaurant Logo (Max 3MB, JPG/PNG)</label>
                                                <div className="text-xs text-gray-500 mb-1">Recommended dimension: 1:1 ratio (e.g. 500x500px)</div>
                                                <div className="flex items-center gap-4">
                                                    <div className="relative h-20 w-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                                                        <Image src={getImageUrl(res.logoFile?.Path)} alt="Logo" fill className="object-cover" />
                                                    </div>
                                                    <label className="cursor-pointer flex items-center gap-2 bg-[#f7e9e5] text-[#A13924] px-4 py-2 rounded-lg hover:bg-[#ead9d4] transition-colors text-sm font-semibold">
                                                        <Upload size={16} /> Upload New Logo
                                                        <input type="file" className="sr-only" accept="image/jpeg,image/png,image/jpg" onChange={(e) => e.target.files?.[0] && handleFileUpload(res.id, e.target.files[0], "logo")} />
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <label className="font-medium text-sm text-[#28211e]">Cover Image (Max 3MB, JPG/PNG)</label>
                                                <div className="text-xs text-gray-500 mb-1">Recommended dimension: 16:9 ratio (e.g. 1920x1080px)</div>
                                                <div className="flex flex-col gap-4">
                                                    <div className="relative h-40 w-full max-w-sm rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                                                        <Image src={getImageUrl(res.coverFile?.Path)} alt="Cover" fill className="object-cover" />
                                                    </div>
                                                    <label className="cursor-pointer flex items-center justify-center gap-2 bg-[#f7e9e5] text-[#A13924] px-4 py-2 rounded-lg hover:bg-[#ead9d4] transition-colors text-sm font-semibold w-fit">
                                                        <Upload size={16} /> Upload New Cover
                                                        <input type="file" className="sr-only" accept="image/jpeg,image/png,image/jpg" onChange={(e) => e.target.files?.[0] && handleFileUpload(res.id, e.target.files[0], "cover")} />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* DISPLAY MODE */
                                <div className="flex flex-col rounded-xl border border-[#dec0ba] bg-white overflow-hidden shadow-sm hover:shadow transition-shadow">
                                    <div className="relative h-48 w-full bg-[#f3efed]">
                                        <Image src={getImageUrl(res.coverFile?.Path)} alt="Cover" fill className="object-cover" />
                                        <div className="absolute bottom-[-24px] left-6 h-24 w-24 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden flex items-center justify-center">
                                            <Image src={getImageUrl(res.logoFile?.Path)} alt="Logo" fill className="object-cover" />
                                        </div>
                                    </div>
                                    <div className="pt-10 pb-6 px-6 flex flex-col gap-4">
                                        <div className="flex justify-between items-start flex-wrap gap-4">
                                            <div>
                                                <h2 className="text-2xl font-bold text-[#28211e]">{res.resturantName}</h2>
                                                <p className="text-[#654f48]">{res.address}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleDelete(res.id)} className="flex items-center gap-2 bg-[#fbecec] text-red-600 hover:bg-[#fad4d4] px-4 py-2 rounded-lg transition-colors font-medium">
                                                    <Trash2 size={18} /> Delete
                                                </button>
                                                <button onClick={() => startEdit(res)} className="flex items-center gap-2 bg-[#f3efed] text-[#654f48] hover:bg-[#ead9d4] px-4 py-2 rounded-lg transition-colors font-medium">
                                                    <PenLine size={18} /> Edit Details
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-[#8b7168] uppercase font-bold tracking-wider">Contact</span>
                                                <span className="text-sm font-medium text-[#28211e]">{res.resturantemail}</span>
                                                <span className="text-sm font-medium text-[#28211e]">{res.phone}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-[#8b7168] uppercase font-bold tracking-wider">Operating Hours</span>
                                                <span className="text-sm font-medium text-[#28211e]">{res.opening} - {res.closing}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${res.isopen ? 'bg-[#80f1a6] text-black' : 'bg-[#f19780] text-black'}`}>
                                                        {res.isopen ? "Open Now" : "Closed"}
                                                    </span>
                                                    {res.payfirst && <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#e8e4e2] text-[#554742]">Pay First</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
