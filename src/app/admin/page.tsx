"use client"
import Overview from "@/components/Overview"
import PageLoader from "@/components/PageLoader";
import { useEffect, useState } from "react";

export default function Home() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timeout = window.setTimeout(() => setLoading(false), 500);
        return () => window.clearTimeout(timeout);
    }, []);

    return (
        <>
            {/* {loading && <PageLoader load={true} time={500} />} */}
            <Overview />
        </>
    );
}
