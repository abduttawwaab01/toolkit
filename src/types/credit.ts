export interface BankDetail {
  id: string;
  accountName: string;
  accountNo: string;
  bankName: string;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceNaira: number;
  bonusCredits: number;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreditPurchaseRequest {
  id: string;
  userId: string;
  packageId?: string;
  credits: number;
  amountNaira: number;
  accountName: string;
  accountNo?: string;
  bankName?: string;
  reference?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name?: string; email?: string };
  package?: CreditPackage;
}

export interface FeatureCreditCost {
  id: string;
  featureKey: string;
  featureLabel: string;
  creditsCost: number;
  isEnabled: boolean;
  description?: string;
  updatedAt: string;
}

export interface CreditSpendLog {
  id: string;
  userId: string;
  feature: string;
  credits: number;
  reason?: string;
  balance: number;
  createdAt: string;
}

export interface CreditSettings {
  creditPriceNaira: number; // default 500
  minPurchaseCredits: number;
  maxPurchaseCredits: number;
}
