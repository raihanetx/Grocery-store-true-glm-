/**
 * Steadfast Courier Integration Service
 * API Documentation: https://portal.packzy.com/api/v1
 */

const STEADFAST_BASE_URL = 'https://portal.packzy.com/api/v1';

// Get API credentials from environment variables (secure)
const getApiKey = () => process.env.STEADFAST_API_KEY || '';
const getSecretKey = () => process.env.STEADFAST_SECRET_KEY || '';

interface SteadfastOrder {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
  item_description?: string;
  alternative_phone?: string;
  delivery_type?: number; // 0 = home delivery, 1 = point delivery
}

interface SteadfastResponse {
  status: number;
  message: string;
  consignment?: {
    consignment_id: number;
    invoice: string;
    tracking_code: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    cod_amount: number;
    status: string;
    note?: string;
    created_at: string;
    updated_at: string;
  };
}

interface BulkOrderResponse {
  invoice: string;
  recipient_name: string;
  recipient_address: string;
  recipient_phone: string;
  cod_amount: string;
  note: string | null;
  consignment_id: number | null;
  tracking_code: string | null;
  status: string;
}

interface DeliveryStatusResponse {
  status: number;
  delivery_status: string;
}

interface BalanceResponse {
  status: number;
  current_balance: number;
}

/**
 * Create a single order in Steadfast Courier
 */
export async function createOrder(order: SteadfastOrder): Promise<SteadfastResponse> {
  const response = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
    method: 'POST',
    headers: {
      'Api-Key': getApiKey(),
      'Secret-Key': getSecretKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(order),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Steadfast API error: ${errorText}`);
  }

  return response.json();
}

/**
 * Create multiple orders in bulk (max 500)
 */
export async function createBulkOrder(orders: SteadfastOrder[]): Promise<BulkOrderResponse[]> {
  const response = await fetch(`${STEADFAST_BASE_URL}/create_order/bulk-order`, {
    method: 'POST',
    headers: {
      'Api-Key': getApiKey(),
      'Secret-Key': getSecretKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: JSON.stringify(orders) }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Steadfast bulk API error: ${errorText}`);
  }

  return response.json();
}

/**
 * Check delivery status by consignment ID
 */
export async function getStatusByConsignmentId(consignmentId: string): Promise<DeliveryStatusResponse> {
  const response = await fetch(`${STEADFAST_BASE_URL}/status_by_cid/${consignmentId}`, {
    method: 'GET',
    headers: {
      'Api-Key': getApiKey(),
      'Secret-Key': getSecretKey(),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Steadfast status API error: ${errorText}`);
  }

  return response.json();
}

/**
 * Check delivery status by invoice number
 */
export async function getStatusByInvoice(invoice: string): Promise<DeliveryStatusResponse> {
  const response = await fetch(`${STEADFAST_BASE_URL}/status_by_invoice/${invoice}`, {
    method: 'GET',
    headers: {
      'Api-Key': getApiKey(),
      'Secret-Key': getSecretKey(),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Steadfast status API error: ${errorText}`);
  }

  return response.json();
}

/**
 * Check delivery status by tracking code
 */
export async function getStatusByTrackingCode(trackingCode: string): Promise<DeliveryStatusResponse> {
  const response = await fetch(`${STEADFAST_BASE_URL}/status_by_trackingcode/${trackingCode}`, {
    method: 'GET',
    headers: {
      'Api-Key': getApiKey(),
      'Secret-Key': getSecretKey(),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Steadfast status API error: ${errorText}`);
  }

  return response.json();
}

/**
 * Get current balance
 */
export async function getBalance(): Promise<BalanceResponse> {
  const response = await fetch(`${STEADFAST_BASE_URL}/get_balance`, {
    method: 'GET',
    headers: {
      'Api-Key': getApiKey(),
      'Secret-Key': getSecretKey(),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Steadfast balance API error: ${errorText}`);
  }

  return response.json();
}

/**
 * Steadfast delivery status meanings
 */
export const STEADFAST_STATUSES: Record<string, { label: string; color: string; description: string }> = {
  'pending': {
    label: 'Pending',
    color: 'yellow',
    description: 'Consignment is not delivered or cancelled yet.',
  },
  'delivered_approval_pending': {
    label: 'Delivered (Pending Approval)',
    color: 'blue',
    description: 'Consignment is delivered but waiting for admin approval.',
  },
  'partial_delivered_approval_pending': {
    label: 'Partial Delivery (Pending Approval)',
    color: 'orange',
    description: 'Consignment is delivered partially and waiting for admin approval.',
  },
  'cancelled_approval_pending': {
    label: 'Cancelled (Pending Approval)',
    color: 'red',
    description: 'Consignment is cancelled and waiting for admin approval.',
  },
  'unknown_approval_pending': {
    label: 'Unknown Status (Pending Approval)',
    color: 'gray',
    description: 'Unknown Pending status. Need contact with the support team.',
  },
  'delivered': {
    label: 'Delivered',
    color: 'green',
    description: 'Consignment is delivered and balance added.',
  },
  'partial_delivered': {
    label: 'Partial Delivered',
    color: 'orange',
    description: 'Consignment is partially delivered and balance added.',
  },
  'cancelled': {
    label: 'Cancelled',
    color: 'red',
    description: 'Consignment is cancelled and balance updated.',
  },
  'hold': {
    label: 'On Hold',
    color: 'yellow',
    description: 'Consignment is held.',
  },
  'in_review': {
    label: 'In Review',
    color: 'blue',
    description: 'Order is placed and waiting to be reviewed.',
  },
  'unknown': {
    label: 'Unknown',
    color: 'gray',
    description: 'Unknown status. Need contact with the support team.',
  },
};

/**
 * Get status info with fallback
 */
export function getStatusInfo(status: string | null | undefined) {
  if (!status) {
    return {
      label: 'Not Sent to Courier',
      color: 'gray',
      description: 'Order has not been sent to courier yet.',
    };
  }
  return STEADFAST_STATUSES[status] || {
    label: status,
    color: 'gray',
    description: 'Status information not available.',
  };
}

/**
 * Generate unique invoice number
 */
export function generateInvoice(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
}
