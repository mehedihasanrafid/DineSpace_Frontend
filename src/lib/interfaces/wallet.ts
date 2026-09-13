import { WithdrawalStatus } from "../Enums";
import { Restaurant } from "./order";

export interface WithdrawalRequest {
    id: string;
    walletId: string;
    paymentId: string | null;
    orderId: string | null;
    wallet?: {
        id: string;
        balance: string;
        restaurantId: string;
        restaurant?: Restaurant;
        createdAt: string;
        updatedAt: string;
    };
    amount: string;
    status: WithdrawalStatus;
    type: string;
    paymentMethod: string;
    accountNumber: string;
    processedAt: string | null;
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    restaurantName?: string;
}

export interface Wallet {
    id: string;
    balance: string;
    createdAt: string;
    restaurantId: string;
    updatedAt: string;
    withdrawalRequests: WithdrawalRequest[];
    restaurant?: Restaurant;
}

