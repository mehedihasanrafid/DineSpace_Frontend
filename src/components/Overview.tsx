"use client"
import KPICard from "@/components/KPICards"
import LiveOrders from "@/components/Liveorders";
import { api } from "@/lib/api/axios";
import Result from "@/lib/Result";
import { socket } from "@/lib/websock/socket";
import { kpicard, Order, OrderTable } from "@/lib/interfaces/order";
import { useContext, useEffect, useState } from "react";
import { resturantContext } from "@/lib/context/Context";
import { OrderStatus, PaymentStatus, TableStatus } from "@/lib/Enums";
import { CheckCircle2, Clock3, CookingPot, CreditCard, HandCoins, RotateCwFadingClock, Subtitles, Table, Utensils } from "lucide-react";
import Inlinemessage from "./Inlinemessage";
import { Payment } from "@/lib/interfaces/payment";

export default function Overview() {
    const [socConnect , setSocConnect] = useState(false);
    const [getorders , setgetorders] = useState<Order[]>([]);
    const [getTables , setGettables] = useState<OrderTable[]>([]);
    const [orderkpi , setorderkpi] = useState<kpicard[]>()
    const [tablekpi , settablekpi] = useState<kpicard[]>()
    const [totalamount, settotalamount] = useState(0);
    const [kpicards , setkpicard ] = useState<kpicard[]>();
    const {defaultResturant, setpopup , refreshOrders} = useContext(resturantContext);
    const [sendorders , setSendorders] = useState<Order[]>([]);
    // const [date , setdate] = useState(()=> new Date());

    const handleChange = (id:string , state:OrderStatus , paymentstate?:PaymentStatus)=>{
        console.log("odr state change");
        // console.log(id , paymentstate , state);
    setgetorders((odr)=>odr.map(e=> e.id === id ? {
        ...e,
        OrderStatus: state,
        payment: paymentstate ? { ...e.payment, status: paymentstate } : e.payment,
    } : e));
    }

    useEffect(()=>{
         loadkpis()
    },[getorders, getTables]);
    //populating orders data for live order and the overviews
       const getNewOrders = async ()=>{
            
        try {
            const res = await api.get<Result<Order[]>>(`/order/todaysOrders/${defaultResturant}`);
            console.log(res)
            const data = res.data.Data;
            setgetorders(data ?? []);
        }catch(e){console.error(e)}
        }

        const loadkpis = ()=>{
            if (getorders !== null ){
            let amount:number = 0;
            const payable = getorders?.map((e)=> { e.OrderStatus == OrderStatus.Completed ? amount += Number(e.payable) : amount; return e; });
            // console.log("payable");
            // console.log(payable);

            const kpicard = [{title:"Today's Orders",icon:<CookingPot  />,amount:getorders?.length ,subtitle:""}  , 
                        {title:"Pending Orders" ,icon:<RotateCwFadingClock />,amount:getorders?.filter((e)=> e.OrderStatus == OrderStatus.Pending).length ,subtitle:"Orders"} ,
                        {title: "Today's Revenue" , icon:<HandCoins/>,amount:amount ,subtitle:"BDT"}];
                    
                        setorderkpi(kpicard);
            }else{
                 const kpicard = [{title:"Today's Orders",icon:<CookingPot  />,amount:0 , Subtitle:""} , 
                        {title:"Pending Orders" ,icon:<RotateCwFadingClock />,amount:0 ,subtitle:"Orders"} ,
                        {title: "Today's Revenue" , icon:<HandCoins/>,amount:0 ,subtitle:"BDT"} ];
                        setorderkpi(kpicard);
            }

            if (getTables){
            const kpicard = [{title:"Active Bookings",icon:<Table />,amount:getTables.filter((e)=> e.reservationId).length } , 
                        {title: "Available Table" , icon:<Utensils/>,amount:getTables.filter((e)=> e.status == TableStatus.Available).length}];
                        settablekpi(kpicard);
            }else{
                 const kpicard = [{title:"Active Bookings",icon:<Table />,amount:0} , 
                        {title: "Available Table" , icon:<Utensils/>,amount:0}];
                        setkpicard(kpicard);
            }
        }

        //populating tables data 

        const Gettables = async ()=>{
            try{
            const res = await api.get<Result<OrderTable[]>>(`tables/getTablesByResturantId/${defaultResturant}`);
            const data = res.data.Data;
            setGettables(data ?? []);
            // console.log("table data")
            // console.log(data);
           
            }catch(e){console.log(e)}
            
        }
        const loadOverview = async ()=>{
                const [orders, tables] = await Promise.all([
                getNewOrders(),
                Gettables(),
                loadkpis(),
            ]);

        }

        useEffect(()=>{
         if(defaultResturant === undefined || defaultResturant === null || defaultResturant === "" ){return}
        loadOverview();
        },[defaultResturant , refreshOrders]);

        useEffect(() => {
        setkpicard([
            ...(orderkpi ?? []),
            ...(tablekpi ?? []),
        ]);
        }, [orderkpi, tablekpi]);

        const handlesTableState = (id:string , state:TableStatus)=>{
            setGettables((tables) =>
                tables.map((table) =>
                    table.id === id ? { ...table, status: state } : table
                )
            );
        }
   
        const searchOrder = (query: string) => {
            if(!query){
                setSendorders(getorders);
                return;
            }
            const filteredOrders = getorders.filter((order) => {
                const orderIdMatch = order.id.toLowerCase().includes(query.toLowerCase());
                const customerNameMatch = order.customerName.toLowerCase().includes(query.toLowerCase());
                return orderIdMatch || customerNameMatch;
            });
            setSendorders(filteredOrders);
        }
useEffect(()=>{
    setSendorders(getorders);
}, [getorders]);


    return <>
    <div className="">
        <div className="text-[40px]">Today's Overview</div>
        <span className="flex flex-row gap-10 mt-10">{kpicards ? kpicards?.map((e,i)=>
        <KPICard  key={i} {...e} />): "No data found "}</span> 
        <div className="mt-15  flex flex-row gap-6 ">
            <section className="w-[70%] " >
                <div className="mb- flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-baseline gap-3">
                        <span className="text-[30px]">Live Orders</span>
                        <span className="cursor-pointer text-[12px] font-bold text-[#A13924]">View all Orders</span>
                    </div>
                    <input
                       onChange={(e)=>{searchOrder(e.target.value)}}
                        type="text"
                        placeholder="Search by Order ID or Customer Name"
                        className="w-full rounded-lg border border-[#DEC0BA] bg-[#F5F3F0] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A13924] sm:max-w-xs"
                    />
                </div>
                
            
                <LiveOrders sendorders = {sendorders} handleChange = {handleChange} />
            </section>

            <section className="w-[25%]">
                <section className="flex flex-col gap-3">
                    <div>
                <div className="text-[30px] mb-3">Table status</div>
                <div className="bg-white min-h-40 p-5 w-[90%] max-h-100 border border-[#DEC0BA] rounded-2xl shadow overflow-y-auto overflow-x-hidden scrollbar-none">
                   {getTables ? getTables.sort((a,b)=> a.tableno - b.tableno).map(e=> <Tables key={e.id} handlesTableState = {handlesTableState} table={e}/>):"No data Found"} 
                </div>
                    </div>

                    <div>
                <div className="text-[30px] mb-3">Live transactions</div>
                <div className="bg-white min-h-40 p-5 w-[90%] max-h-100 border border-[#DEC0BA] rounded-2xl shadow overflow-y-auto overflow-x-hidden scrollbar-none">
                    <Transactions/>
                </div>
                    </div>
                </section>
            </section>
        </div>
    </div>

    </>
}


interface func{
    handlesTableState:(id:string , state:TableStatus)=>void;
    table:OrderTable;
}


function Tables({handlesTableState , table}:func){

    const[error , setError] = useState(false);

    const allStatus: TableStatus[] = [
        TableStatus.Available,
        TableStatus.Occupied,
        TableStatus.Reserved,
        TableStatus.Cleaning,
    ];

    const statusStyles: Record<string, string> = {
        Available: "bg-green-100 text-green-700",
        Occupied: "bg-red-100 text-red-700",
        Reserved: "bg-amber-100 text-amber-700",
        Cleaning: "bg-blue-100 text-blue-700",
    };

     
    const handleStatechange = async (state: TableStatus) => {
        const saveState = table.status;
        
        handlesTableState(table.id, state);
        try{
            if(state === TableStatus.Available){
                const res = await api.patch<Result<unknown>>(`tables/TableMakeaAvailable/${table.id}`);
                res.data.Success === true ? "" :()=> { handlesTableState(table.id , saveState ) ; setError(true)};
        }else if(state === TableStatus.Occupied){
                const res = await api.patch<Result<unknown>>(`tables/TableMakeaoccupied/${table.id}`);
                res.data.Success === true ? "" : ()=> { handlesTableState(table.id , saveState ) ; setError(true)};
        }
        else if(state === TableStatus.Reserved){
                const res = await api.patch<Result<unknown>>(`tables/TableMakereserved/${table.id}`);
                res.data.Success === true ? "" : ()=> { handlesTableState(table.id , saveState ) ; setError(true)};
        }
        else if(state === TableStatus.Cleaning){
                const res = await api.patch<Result<unknown>>(`tables/TableMakeCleaning/${table.id}`);
                res.data.Success === true ? "" : ()=> { handlesTableState(table.id , saveState ) ; setError(true)};
        }
        }catch(e){console.error(e) ; handlesTableState (table.id , saveState ); setError(true)}
    }

    return(
        <div className="mt-2">
            <Inlinemessage Message={"Couldn't Change the state" } error={error}/>
            {table ? (
                <div
                    key={table.tableno}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-[#FAFAF9] p-3">
                    <span className="font-semibold text-gray-700">
                        Table {table.tableno}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[table.status]}`}>
                        {table.status}
                    </span>
                    <select
                        name="tableStatus"
                        value={table.status}
                        className="w-35 rounded-xl border border-[#DEC0BA] bg-[#FAFAF9]"
                        onChange={(e) => handleStatechange(e.target.value as TableStatus)} >
                        {allStatus.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                "No data Found"
            )}
        </div>
    )
}

function Transactions(){
    const { defaultResturant } = useContext(resturantContext);
    const [payment , setPayment] = useState<Payment[]>();
   const getpayment = async ()=>{  
    try{
    const get = await api.get<Result<Payment[]>>(`payment/GetpaymentByResturentId/${defaultResturant}`);
        get.data.Data ? setPayment(get.data.Data) : "";
    } catch(e){console.error(e)}
    
}
    useEffect(()=>{
            if(defaultResturant === ""){return}
            getpayment();
        
        },[defaultResturant]);
    return (
        <div className="flex flex-col gap-3 h-85">
            {payment?.length ? [...payment]
                .sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime())
                .map((transaction) => {
                    const isPaid = transaction.status.toLowerCase() === "paid";
                    const amount = Number(transaction.amount);
                    const formattedAmount = Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
                    const accountNumber = String(transaction.acountNumber);
                    const maskedAccount = accountNumber.length > 4
                        ? `**** ${accountNumber.slice(-4)}`
                        : accountNumber;

                    return (
                        <span key={transaction.id} className="rounded-xl border border-[#E8E2DA] bg-[#FFFCF8] p-3 shadow-sm ">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F3E5DE] text-[#A13924]">
                                        <CreditCard size={16} strokeWidth={2.2} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-semibold text-[#27221E]">{transaction.paymentMethode}</p>
                                        <p className="truncate text-[10px] text-[#8A8179]">{transaction.transectionId ?? "No transaction ID"}</p>
                                    </div>
                                </div>
                                <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${isPaid ? "bg-[#E5F5EA] text-[#277A42]" : "bg-[#FFF1D6] text-[#A66A00]"}`}>
                                    {isPaid ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                                    {transaction.status}
                                </span>
                            </div>
                            <div className="mt-3 flex items-end justify-between border-t border-[#EEE8E1] pt-2">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wide text-[#9A9189]">Amount</p>
                                    <p className="text-lg font-bold text-[#A13924]">BDT {formattedAmount}</p>
                                </div>
                                <div className="text-right text-[10px] text-[#766D65]">
                                    <p>Account</p>
                                    <p className="font-medium text-[#413A34]">{maskedAccount}</p>
                                </div>
                            </div>
                        </span>
                    );
                }) : "No Data Found"}
        </div>
    )
}