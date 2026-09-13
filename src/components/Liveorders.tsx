import { api } from "@/lib/api/axios";
import { resturantContext } from "@/lib/context/Context";
import { OrderStatus, PaymentStatus } from "@/lib/Enums";
import { AddOnOrder, Order } from "@/lib/interfaces/order";
import Result from "@/lib/Result";
import { useContext } from "react";

interface params{
    sendorders:Order[];
    handleChange: (id:string , state:OrderStatus , paymentstate?:PaymentStatus)=>void;
}


export  default  function LiveOrders({sendorders , handleChange} :params){

    return<>
    <div className="w-full bg-white h-210 p-5 mb-5 border border-[#DEC0BA] rounded-2xl shadow overflow-hidden ">
        <div className="flex h-full min-h-0 flex-row gap-2 z-auto">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar-none">
                <div className="sticky top-0 z-1 border-b border-[#DEC0BA] bg-white"> New </div>
                {sendorders.map(e=> e.OrderStatus === OrderStatus.Pending ? <OrderCards key={e.id} handler = {handleChange} getOrders={e} /> :"")}
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar-none">
                <div className="sticky top-0 z-10 border-b border-[#DEC0BA] bg-white"> Preparing </div>
                {sendorders.map(e=> e.OrderStatus === OrderStatus.Preparing ? <OrderCards key={e.id} handler={handleChange} getOrders={e} /> :"")}
            </div> 
            
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar-none">
                <div className="sticky top-0 z-10 border-b border-[#DEC0BA] bg-white"> Ready </div>
                {sendorders.map(e=> e.OrderStatus === OrderStatus.Ready ? <OrderCards key={e.id} handler ={handleChange} getOrders={e} /> :"")}

            </div>
        </div>
    </div>
     </>
}

interface OrderCardsProps {
    handler: (id:string , state:OrderStatus , payment?:PaymentStatus)=>void;
    getOrders: Order;
}

export function  OrderCards({ handler , getOrders}: OrderCardsProps){
    // console.log(getOrders);
    // console.log("get orders");
    const {setpopup} = useContext(resturantContext);

    const orderBdTime = new Date(getOrders.OrderTime);
    const minutesAgo = Math.floor(
        (Date.now() - orderBdTime.getTime()) / (1000 * 60)
    );


    // console.log("check 1"+prevState);
 const handleChange = async (e:OrderStatus , declined?:boolean , payment?:PaymentStatus) =>  {
        const prevState = getOrders.OrderStatus ;
        const prevPayment = getOrders.payment.status;
        // console.log("ord state button clicked");
        handler(getOrders.id , e , payment);
        try{
            if( e === OrderStatus.Completed && getOrders.payment.status !== PaymentStatus.Paid){
                setpopup("Can Not Complete the order Without Payment");
                handler(getOrders.id , prevState , payment );
                return;
            }
            if(payment){
                    const res = await api.patch<Result<unknown>>(`payment/updatePayment`, {
                    id:getOrders.payment.id,
                    status:payment
                });
                // console.log("paymet stats");
                // console.log(res.data);
                !res.data.Success ?  handler(getOrders.id , prevState , prevPayment) :"";
                return 0;
            }
            const res = await api.patch<Result<unknown>>(`order/updateOrders/`, {
                    id:getOrders.id,
                    OrderStatus: e,
                });

                if(declined){
                    setpopup(res.data.Message);
                }
                console.log(res.data);
                !res.data.Success ?  handler(getOrders.id , prevState) :"";

    
        }catch(a){console.log(a);  handler(getOrders.id , prevState , prevPayment);  } //console.log("check 2"+prevState);
    }

    return (
       <>
       {getOrders !==null ?
       <div className="flex flex-col gap-1 w-[95%] bg-[#FBF9F6] h-auto mt-4 ml-3 p-5 rounded-2xl shadow border border-[#DEC0BA]">
            <div className="flex flex-row justify-between">
                <div>Table No- <span>{getOrders.table.tableno}</span></div>
                <div className="text-[15px] text-gray-500">#ODR-{getOrders.id.slice(30)}</div>
                <div>{minutesAgo >= 60 ? `${Math.floor(minutesAgo / 60)}h` : `${minutesAgo}m`} ago</div>
            </div>
            <div className="text-[18px] font-semibold">{getOrders.customerName}</div>
            <div className="h-fit">
                {getOrders.orderitems.map((item) => (
                    <span className="mr-2" key={item.id}>{item.quantity}x{item.menu.itemName}</span>
                ))}
            </div>
          <span className="font-semibold">Total bill: {getOrders.payable}</span>
            <div>{getOrders.payment.status === PaymentStatus.Paid ? <span className="text-green-600">Paid Tid- {getOrders.payment.transectionId}</span> :  <span className="flex flex-row justify-between"><span className="text-red-600 ">Payment {getOrders.payment.status} <button onClick={()=>{handleChange( getOrders.OrderStatus ,  false ,PaymentStatus.Paid); console.log("mark as")}} className="text-black pl-1 pr-1 hover:text-green-600 cursor-pointer duration-500">Mark as paid ✓✓</button></span> </span>}</div>
            <div className="flex flex-row justify-between">
                {getOrders.OrderStatus === OrderStatus.Pending ? <>
                    <button onClick={()=>{handleChange(OrderStatus.Preparing);}} className="hover:scale-95 transition-all duration-200 cursor-pointer w-[60%] bg-black rounded h-8 text-white">Accept</button>
                    <button onClick={()=> confirm("Are you sure you want to decline this order?") && handleChange(OrderStatus.Canceled , true)} className="transition-all duration-200 cursor-pointer w-[30%] text-[#A13924] rounded h-8">Decline</button>
                    </> : getOrders.OrderStatus === OrderStatus.Preparing ?
                    <button onClick={()=>handleChange(OrderStatus.Ready)} className="hover:scale-95 transition-all duration-200 cursor-pointer w-full border border-[#A13924] rounded h-8 text-[#A13924]">Mark as ready</button> :
                    getOrders.OrderStatus === OrderStatus.Ready ?
                        <button onClick={()=>handleChange(OrderStatus.Completed)} className="hover:scale-95 transition-all duration-200 cursor-pointer w-full border border-[#A13924] rounded h-8 text-[#A13924]">Mark as Complete</button> : null}
            </div>
        </div>:""
        }
        </>
    );
    
}