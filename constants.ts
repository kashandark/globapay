
import { Currency, PayoutMethod, Bank } from './types';

// 1LINK Credentials (Primary Switch)
export const ONELINK_CLIENT_ID = "f0e9fac36efc76b4c07adb71c144a8d8";
export const ONELINK_CLIENT_SECRET = "b1b7c5fb4d8c5c1c712fc9410064bcc2";
export const ONELINK_BASE_URL = "https://sandboxapi.1link.net.pk/uat-1link/sandbox/funds-transfer-rest-service";

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰' },
];

export const PAK_BANKS: Bank[] = [
  { id: 'hbl', name: 'Habib Bank Limited (HBL)', code: '001' },
  { id: 'mcb', name: 'MCB Bank Limited', code: '002' },
  { id: 'uabl', name: 'United Bank Limited (UBL)', code: '003' },
  { id: 'alf', name: 'Bank Alfalah', code: '004' },
  { id: 'mezn', name: 'Meezan Bank', code: '005' },
  { id: 'allied', name: 'Allied Bank Limited', code: '006' },
  { id: 'ep', name: 'Telenor Microfinance (Easypaisa)', code: '037' },
  { id: 'jc', name: 'Mobilink Microfinance (JazzCash)', code: '038' },
];

export const PKR_PROVIDERS: PayoutMethod[] = [
  { 
    id: 'BANK', 
    name: 'Bank Transfer', 
    icon: 'fa-building-columns', 
    color: 'bg-slate-800',
    description: 'Direct IBFT to any Pakistani bank account.' 
  },
  { 
    id: 'JAZZCASH', 
    name: 'JazzCash', 
    icon: 'fa-mobile-screen-button', 
    color: 'bg-red-600',
    description: 'Instant payout via 1LINK JazzCash gateway.' 
  },
  { 
    id: 'EASYPAISA', 
    name: 'Easypaisa', 
    icon: 'fa-wallet', 
    color: 'bg-emerald-500',
    description: 'Real-time disbursement to Easypaisa account.' 
  }
];

export const MOCK_RATES: Record<string, number> = {
  'USD-PKR': 278.45,
};
