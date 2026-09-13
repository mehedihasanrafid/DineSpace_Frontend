"use client";

import { useState } from "react";
import { adminContext } from "@/lib/context/Context";
import AlerPopup from "@/components/alertPopup";
import ServerError from "@/components/serverError";
import AdminNav from "@/components/admin/adminnav";

export default function Admin({ children }: { children: React.ReactNode }) {
    const [popup, setPopup] = useState("");
    const [servererror, setServerError] = useState("");

    return (
        <adminContext.Provider value={{ setpopup: setPopup, setservererror: setServerError }}>
            <AdminNav />
            {popup && <AlerPopup Message={popup} setpopup={() => setPopup("")} />}
            {servererror && <ServerError error={servererror} setservererror={() => setServerError("")} />}
            <main className="ml-[14%] p-7">{children}</main>
        </adminContext.Provider>
    );
}
