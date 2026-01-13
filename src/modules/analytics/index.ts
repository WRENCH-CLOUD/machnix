// Analytics module types and exports

export interface Payment {
  id: string;
  tenant_name: string;
  amount: number;
  payment_method: string;
  payment_date?: string;
  paid_at?: string;
  invoice?: {
    invoice_number?: string;
  };
}

export interface GlobalAnalytics {
  activeTenants: number;
  totalRevenue: number;
  totalPayments: number;
  recentPayments: Payment[];
  revenueByPaymentMethod: Record<string, number>;
}
