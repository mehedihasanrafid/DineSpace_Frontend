import { OrderStatus, PaymentStatus, TableStatus } from "@/lib/Enums";
import { ReactNode } from "react";
import { Files } from "./file";

export interface OrderItem {
    id?: string;
    orderId?: string;
    itemId?: string;
    menu: MenuItem;
    quantity: number;
    price: number;
    resturantId?: string;
    resturantName?:string;
}

export interface MenuItem {
    id: string;
    itemName: string;
    description: string;
    catagory: string;
    images?:Files[] | null;
    price: number;
    isAvailable?: boolean;
    resturentId?: string;
}

export interface Restaurant {
    id: string;
    resturantName: string;
    address: string;
    files: Files[] | null;
    isopen: boolean;
    isBanned?: boolean;
    opening: string;
    phone: string;
    resturantemail: string;
    closing: string;
    payfirst: boolean;
    ownerid: string;
    menu: MenuItem[];
    logoFileId: string | null;
    coverFileId: string | null;
    logoFile: Files | null;
    coverFile: Files | null;
    createdat: string;
    updated: string;
    tables: OrderTable[];
}

export interface OrderTable {
    id: string;
    tableno: number;
    status: TableStatus;
    seatCapacity: number;
    reservationId: string | null;
    resturantid: string;
    resturant: Restaurant;
}

export interface Payment {
     id: string;
    status: PaymentStatus;
	paymentMethode: string;
	transectionId: string | null;
	acountNumber: number;
    amount:number;
	orderId: string;
	walletId: string | null;
    createdat:Date;
}

export interface AddOnOrder {
    id: string;
    orderId: string;
    order?: Order;
    addOnOrderItems?: OrderItem[];
    payable: number;
    discount?: number;
    OrderStatus: OrderStatus;
    payment: Payment;
    OrderTime: string;
}

export interface Order {
    id: string;
    tableId: string;
    table: OrderTable;
    orderitems: OrderItem[];
    addOnOrders?: AddOnOrder[];
    payable: number;
    discount: number;
    payment: Payment;
    OrderStatus: OrderStatus;
    DeliveryTime: string | null;
    customerName: string;
    customerPhone: string;
    OrderTime: string;
}

export interface kpicard{
    title:string,icon?:ReactNode,amount?:number,
}