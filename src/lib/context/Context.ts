import { createContext, Dispatch, SetStateAction } from "react";
import { OrderItem } from "../interfaces/order";

interface RestaurantContextValue {
	defaultResturant: string;
	setpopup: Dispatch<SetStateAction<string>>;
	  refreshOrders: number;
	setservererror: Dispatch<SetStateAction<string>>;
	resturants?: { id: string; resturantName?: string }[];
}

export const resturantContext = createContext<RestaurantContextValue>({
	defaultResturant: "",
	setpopup: () => undefined,
	refreshOrders: 0,
	setservererror:() => undefined,
	resturants: [],
});

interface Usercontext{
	setActiveLink:Dispatch<SetStateAction<string>>;
	setNavinfo:Dispatch<SetStateAction<{ icon1?: React.ReactNode; icon2?: React.ReactNode; title: string , goback?:boolean }>>;
	setPopup: Dispatch<SetStateAction<string>>;
	setservererror: Dispatch<SetStateAction<string>>;
	setbowl:Dispatch<SetStateAction<OrderItem[] >>
	myBowl?:OrderItem[] | null
}
export const userContext = createContext<Usercontext>({
	setActiveLink:() => undefined,
	setNavinfo:() => undefined,
	setPopup: () => undefined,
	setservererror:() => undefined,
	setbowl: () => undefined,
	myBowl: [],
});

interface AdminContextValue {
	setpopup: Dispatch<SetStateAction<string>>;
	setservererror: Dispatch<SetStateAction<string>>;
}

export const adminContext = createContext<AdminContextValue>({
	setpopup: () => undefined,
	setservererror: () => undefined,
});
