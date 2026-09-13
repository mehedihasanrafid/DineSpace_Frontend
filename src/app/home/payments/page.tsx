"use client"
import { api } from "@/lib/api/axios"
import { resturantContext } from "@/lib/context/Context"
import { Payment } from "@/lib/interfaces/payment"
import Result from "@/lib/Result"
import { ArrowDownUp, CalendarSearch, Landmark, Search } from "lucide-react"
import { useContext, useEffect, useState } from "react"
import KPICard from "@/components/KPICards"
import { paymentMethods, PaymentStatus } from "@/lib/Enums"
export default function PaymentsPage() {
    const [payments , setpayments ] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [newestFirst, setNewestFirst] = useState(true);
    const {defaultResturant , setpopup} = useContext(resturantContext);
    const [monthdata , setMonthData] = useState<Date>(new Date());
    const [calendarOpen, setCalendarOpen] = useState(false);

    useEffect(() => {
        import("cally");
    }, []);

    const getpayments = async()=>{
        if (!defaultResturant) return;
        setLoading(true);
        setLoadError("");
        try{
            const {data} = await api.get<Result<Payment[]>>(`payment/monthly/${defaultResturant}?month=${monthdata.getMonth()+1}&&year=${monthdata.getFullYear()}`)
            if(data.Success){
                setpayments(data.Data ?? []);
                console.log(data.Data);
                console.log("Payments data loaded successfully.");
            } else {
                setLoadError(data.Message || "Unable to load payments.");
            }
        }catch(e){
            console.log(e);
            setLoadError("Unable to load payments.");
        } finally {
            setLoading(false);
        }
     }
     useEffect(()=>{
        getpayments();
     }, [defaultResturant , monthdata.getMonth() , monthdata.getFullYear()]);

      const formatDate = (date: Date) => new Date(date).toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
      });

     const statusStyle = (status: string) => status.toLowerCase() === "paid"
        ? "bg-[#d9f7e3] text-[#176b37]"
        : status.toLowerCase() === "failed"
            ? "bg-[#f9e5e0] text-[#a13924]"
            : "bg-[#fff2cc] text-[#806500]";

     const filteredPayments = payments.filter((payment) => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return true;
        return [
            payment.transectionId,
            payment.id,
            payment.orderId,
            payment.paymentMethode,
            payment.acountNumber,
            payment.status,
        ].some((value) => String(value ?? "").toLowerCase().includes(query));
     });

     const handleRefund = async (paymentId: string) => {
        const payment = payments.find((item) => item.id === paymentId);
        if (!payment) return;

        const previousStatus = payment.status;
        setpayments((currentPayments) => currentPayments.map((item) =>
            item.id === paymentId ? { ...item, status: PaymentStatus.ProcessingRefund } : item,
        ));

        const revertRefundStatus = () => {
            setpayments((currentPayments) => currentPayments.map((item) =>
                item.id === paymentId ? { ...item, status: previousStatus } : item,
            ));
        };

        // console.log(`Applying for refund for payment ID: ${paymentId}`);
        try {
            const { data } = await api.post<Result<unknown>>(`wallet/refund/${paymentId}`);
            console.log(data);
            console.log("Refund request result:");
            if (!data.Success) {
                revertRefundStatus();
                setpopup(data.Message || "Failed to apply refund.");
            }
                // setpopup("applyed for refund successfully. Willbe notifyed when the refund is processed.");
        }catch (error) {
            console.error("Error applying refund:", error);
            revertRefundStatus();
            setpopup("An error occurred while applying the refund.");
        }
     }

      const sortedPayments = [...filteredPayments].sort((first, second) => {
          const firstDate = new Date(first.createdat).getTime();
          const secondDate = new Date(second.createdat).getTime();
          return newestFirst ? secondDate - firstDate : firstDate - secondDate;
      });

      const totalPayments = payments.reduce(
          (total, payment) => total + Math.round(Number(payment.amount) * 100),
          0,
      ) / 100;

      const totalRefunds = payments.filter((payment) => payment.status === PaymentStatus.Refund).reduce(
          (total, payment) => total + Math.round(Number(payment.amount) * 100),
          0,
      ) / 100;

      const totalRefundsCount = payments.filter((payment) => payment.status === PaymentStatus.Refund).length;
      const totalPaymentsCount = payments.length;
      const refundPercentage = Math.round(totalPayments > 0 ? (totalRefundsCount / payments.length) * 100 : 0);
      const onnlinepaymentsCount = payments.filter((payment) => payment.paymentMethode.toLowerCase() !== "cash").length;
      const totalOnlinePayments = payments.filter((payment) => payment.paymentMethode.toLowerCase() !== "cash").reduce(
          (total, payment) => total + Math.round(Number(payment.amount) * 100),
          0,
      ) / 100;
      const onlinePaymentsPercentage = Math.round(totalPaymentsCount > 0 ? (onnlinepaymentsCount / totalPaymentsCount) * 100 : 0);
      const handleCalendarClick = (event: React.MouseEvent<HTMLElement>) => {
          const value = (event.currentTarget as HTMLElement & { value: string }).value;
          const selectedDate = new Date(value);

          if (!Number.isNaN(selectedDate.getTime())) {
              setMonthData(selectedDate);
              setCalendarOpen(false);
          }
      };

    return (
        <>
        <div className="flex flex-row items-center justify-between mr-5">
            <div className="mt-5 ">
                <h1 className="text-[30px] font-semibold flex flex-row gap-3">Payment History <span onClick={() => {setCalendarOpen(!calendarOpen)}}  
                title="Filter By Month and Year" className="text-[#A13924] flex flex-row gap-2 items-center cursor-pointer">{monthdata.toLocaleString("en-US", { month: "long" , year: "numeric" })} <CalendarSearch /></span> 
                
                {calendarOpen ?  

                    <calendar-date onclick={handleCalendarClick} className=" cally fixed left-210 top-25 z-50 rounded-xl border border-[#DEC0BA] bg-white text-[#514947] shadow-xl [--color-accent:#A13924] [--color-text-on-accent:#FFFFFF]">
                    <svg aria-label="Previous" className="size-5 rounded-md bg-[#A13924] p-1 text-white transition hover:bg-[#7E2C1C] hover:text-white" slot="previous" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M15.75 19.5 8.25 12l7.5-7.5"></path></svg>
                    <svg aria-label="Next" className="size-5 rounded-md bg-[#A13924] p-1 text-white transition hover:bg-[#7E2C1C] hover:text-white" slot="next" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="m8.25 4.5 7.5 7.5-7.5 7.5"></path></svg>
                    <calendar-month></calendar-month>
                    </calendar-date>: ""}

                </h1>
                <p className="text-gray-600">Manage your resturants finances, refunds and transaction history</p>
            </div>
            {/* <Link href={"payment/withdraw"} className="h-fit hover:scale-95 flex flex-row w-fit gap-2 font-semibold rounded-[10px] bg-[#A13924] text-white p-3 duration-150"> <Landmark color="#ffffff" size={20}/>Withdraw Funds</Link> */}
        </div>
        <div className="mr-5 mt-6 flex items-center gap-4">
            <label className="relative block w-full max-w-md">
                <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7168]" />
                <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search payments..."
                    aria-label="Search payments"
                    className="w-full rounded-lg border border-[#dec0ba] bg-white py-2.5 pl-10 pr-3 text-sm text-[#28211e] outline-none transition placeholder:text-[#a58d85] focus:border-[#A13924] focus:ring-2 focus:ring-[#A13924]/15"
                />
            </label>
            <span className="shrink-0 text-sm text-[#8b7168]">{filteredPayments.length} result{filteredPayments.length === 1 ? "" : "s"}</span>
        </div>
        {/* table */}
        <div className="flex flex-row gap-5">
        <div className="mr-5 mt-6 overflow-x-auto rounded-xl border border-[#dec0ba] bg-white h-[70vh] scrollbar-none">
            <table className="w-full min-w-[980px] text-left">
                <thead className="border-b border-[#dec0ba] bg-[#fff8f5] text-xs uppercase tracking-wide text-[#654f48] sticky top-0">
                    <tr>
                        <th className="px-5 py-4 font-semibold">
                            <button
                                type="button"
                                onClick={() => setNewestFirst((current) => !current)}
                                className="group inline-flex items-center gap-2 rounded-md outline-none transition-colors hover:text-[#A13924] focus-visible:ring-2 focus-visible:ring-[#A13924]"
                                title={`Sort ${newestFirst ? "oldest" : "newest"} first`}>
                                Date
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#f3efed] px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-[#8b7168] group-hover:bg-[#ead9d4] group-hover:text-[#A13924]">
                                    <ArrowDownUp size={11} />
                                    {newestFirst ? "Newest" : "Oldest"}
                                </span>
                            </button>
                        </th>
                        <th className="px-5 py-4 font-semibold">Transaction</th>
                        <th className="px-5 py-4 font-semibold">Payment method</th>
                        <th className="px-5 py-4 font-semibold">Account</th>
                        <th className="px-5 py-4 font-semibold">Status</th>
                        <th className="px-5 py-4 text-right font-semibold">Amount</th>
                        <th className="px-5 py-4 text-right font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-[#8b7168]">Loading payments...</td></tr>
                    ) : loadError ? (
                        <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-[#a13924]">{loadError}</td></tr>
                    ) : filteredPayments.length === 0 ? (
                        <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-[#8b7168]">No payments found.</td></tr>
                    ) : sortedPayments.map((payment) => (
                        <tr key={payment.id} className="border-b border-[#ead9d4] last:border-0 hover:bg-[#fcf7f4]">
                            <td className="px-5 py-4 text-sm text-[#554742]">{formatDate(payment.createdat)}</td>
                            <td className="px-5 py-4 font-mono text-xs text-[#554742]">{payment.transectionId || payment.id}</td>
                            <td className="px-5 py-4 text-sm capitalize text-[#28211e]">{payment.paymentMethode}</td>
                            <td className="px-5 py-4 text-sm text-[#554742]">{payment.acountNumber}</td>
                            <td className="px-5 py-4">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle(String(payment.status))}`}>
                                    {payment.status ? String(payment.status).toLowerCase()  : payment.status === PaymentStatus.Refund ? "Refunded" : payment.status === PaymentStatus.ProcessingRefund ? "Processing" : "Unknown"}
                                </span>
                            </td>
                            <td className="px-5 py-4 text-right text-sm font-semibold text-[#28211e]">${Number(payment.amount).toFixed(2)}</td>
                            <td className="px-5 py-4 text-right">
                                {payment.status !== PaymentStatus.Refund && payment.paymentMethode !== paymentMethods.Cash && payment.status !== PaymentStatus.ProcessingRefund && (
                                    <button
                                        type="button"
                                        className="rounded-lg border border-[#A13924] px-3 py-1.5 text-xs font-semibold text-[#A13924] transition-colors hover:bg-[#A13924] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A13924]"
                                        title="Apply for refund"
                                        onClick={() => handleRefund(payment.id)}>
                                        Apply Refund
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
            <div className="flex flex-row gap-5 items-start justify-self-start h-fit w-[30%] flex-wrap mt-5">
                <KPICard title="Total Payments " amount={totalPayments??0} subtitle={"BDT"} />
                <KPICard title="Total Transactions" amount={totalPaymentsCount ?? 0}  subtitle={""}/>
                <KPICard title="Total Refunds" amount={totalRefundsCount ?? 0} subtitle={"orders"}/>
                <KPICard title="Refund Percentage" amount={refundPercentage ?? 0} subtitle={"%"} icon={<ArrowDownUp size={20} />} />
                <KPICard title="Online Payments Percentage" amount={onlinePaymentsPercentage ?? 0} subtitle={"%"} icon={<ArrowDownUp size={20} />} />
                <KPICard title="Total Online Payments" amount={totalOnlinePayments ?? 0} subtitle={"BDT"} />
            </div>

        </div> 
        </>
    )
}
