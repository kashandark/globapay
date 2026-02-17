
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export interface Bank {
  id: string;
  name: string;
  code: string;
}

export type PayoutMethodType = 'BANK' | 'JAZZCASH' | 'EASYPAISA';

export interface PayoutMethod {
  id: PayoutMethodType;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface RecipientDetails {
  name: string;
  mobile?: string;
  iban?: string;
  currency: string;
  method: PayoutMethodType;
  bankId?: string;
  isVerified?: boolean;
}

export type TransferStatus = 'PENDING' | '1LINK_HANDSHAKE' | 'IBFT_DISBURSING' | 'COMPLETED' | 'FAILED';

export interface Transfer {
  id: string;
  amount: number;
  sourceCurrency: string;
  targetCurrency: string;
  recipientName: string;
  status: TransferStatus;
  date: string;
  estimatedArrival: string;
  payoutMethod: PayoutMethodType;
  orchestrator: '1LINK_IBFT';
  referenceNumber: string; // This will map to RRN
  stan: string; // System Trace Audit Number
}

export interface AIInsight {
  sentiment: 'positive' | 'negative' | 'neutral';
  advice: string;
  reasoning: string;
  potentialSavings: string;
}

export interface SupportMessage {
  role: 'user' | 'model';
  text: string;
}
