const RAIACCEPT_AUTH_URL = "https://authenticate.raiaccept.com";
const RAIACCEPT_API_URL = "https://trapi.raiaccept.com";
const RAIACCEPT_CLIENT_ID = "kr2gs4117arvbnaperqff5dml";

interface RaiAcceptAuthResult {
  AuthenticationResult: {
    IdToken: string;
    AccessToken: string;
    RefreshToken: string;
    ExpiresIn: number;
    TokenType: string;
  };
}

interface RaiAcceptOrderResponse {
  orderIdentification: string;
  paymentMethodPreference: string;
  merchant: {
    merchantAccountId: string;
    statementDescriptorShortVersion: string;
  };
  createdOn: string;
  isProduction: boolean;
}

interface RaiAcceptSessionResponse {
  sessionId: string;
  paymentRedirectURL: string;
}

interface RaiAcceptOrderDetails {
  orderIdentification: string;
  status: "DRAFT" | "CHECKOUT" | "PAID" | "PARTIALLY_REFUNDED" | "FULLY_REFUNDED" | "FAILED" | "CANCELED" | "ABANDONED";
  invoice: {
    merchantOrderReference: string;
    amount: number;
    currency: string;
  };
  isProduction: boolean;
}

export async function authenticate(): Promise<string> {
  const username = process.env.RAIACCEPT_API_USERNAME;
  const password = process.env.RAIACCEPT_API_PASSWORD;

  if (!username || !password) {
    throw new Error("RAIACCEPT_API_USERNAME or RAIACCEPT_API_PASSWORD is not set");
  }

  const res = await fetch(RAIACCEPT_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    },
    body: JSON.stringify({
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
      ClientId: RAIACCEPT_CLIENT_ID,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`RaiAccept authentication failed: ${res.status} ${errText}`);
  }

  const data: RaiAcceptAuthResult = await res.json();
  return data.AuthenticationResult.IdToken;
}

interface CreateOrderParams {
  merchantOrderReference: string;
  amount: number;
  currency: string;
  description: string;
  items: { description: string; numberOfItems: number; price: number }[];
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressStreet1: string;
    city: string;
    postalCode: string;
    country: string;
  };
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  notificationUrl?: string;
}

export async function createOrder(
  token: string,
  params: CreateOrderParams
): Promise<RaiAcceptOrderResponse> {
  const body = {
    consumer: {
      firstName: params.customer.firstName,
      lastName: params.customer.lastName,
      email: params.customer.email,
      mobilePhone: params.customer.phone,
    },
    billingAddress: {
      firstName: params.customer.firstName,
      lastName: params.customer.lastName,
      addressStreet1: params.shippingAddress.addressStreet1,
      city: params.shippingAddress.city,
      postalCode: params.shippingAddress.postalCode,
      country: params.shippingAddress.country,
    },
    invoice: {
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      merchantOrderReference: params.merchantOrderReference,
      items: params.items,
    },
    paymentMethodPreference: "CARD",
    shippingAddress: {
      firstName: params.shippingAddress.firstName,
      lastName: params.shippingAddress.lastName,
      addressStreet1: params.shippingAddress.addressStreet1,
      city: params.shippingAddress.city,
      postalCode: params.shippingAddress.postalCode,
      country: params.shippingAddress.country,
    },
    urls: {
      successUrl: params.successUrl,
      failUrl: params.failUrl,
      cancelUrl: params.cancelUrl,
      ...(params.notificationUrl && { notificationUrl: params.notificationUrl }),
    },
  };

  const res = await fetch(`${RAIACCEPT_API_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`RaiAccept create order failed: ${res.status} ${errText}`);
  }

  return res.json();
}

export async function createPaymentSession(
  token: string,
  orderIdentification: string,
  params: CreateOrderParams,
  language?: string
): Promise<RaiAcceptSessionResponse> {
  const body = {
    consumer: {
      firstName: params.customer.firstName,
      lastName: params.customer.lastName,
      email: params.customer.email,
      mobilePhone: params.customer.phone,
    },
    billingAddress: {
      firstName: params.customer.firstName,
      lastName: params.customer.lastName,
      addressStreet1: params.shippingAddress.addressStreet1,
      city: params.shippingAddress.city,
      postalCode: params.shippingAddress.postalCode,
      country: params.shippingAddress.country,
    },
    invoice: {
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      merchantOrderReference: params.merchantOrderReference,
      items: params.items,
    },
    paymentMethodPreference: "CARD",
    shippingAddress: {
      firstName: params.shippingAddress.firstName,
      lastName: params.shippingAddress.lastName,
      addressStreet1: params.shippingAddress.addressStreet1,
      city: params.shippingAddress.city,
      postalCode: params.shippingAddress.postalCode,
      country: params.shippingAddress.country,
    },
    urls: {
      successUrl: params.successUrl,
      failUrl: params.failUrl,
      cancelUrl: params.cancelUrl,
      ...(params.notificationUrl && { notificationUrl: params.notificationUrl }),
    },
  };

  const url = language
    ? `${RAIACCEPT_API_URL}/orders/${orderIdentification}/checkout?language=${language}`
    : `${RAIACCEPT_API_URL}/orders/${orderIdentification}/checkout`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`RaiAccept create session failed: ${res.status} ${errText}`);
  }

  return res.json();
}

export async function getOrderDetails(
  token: string,
  orderIdentification: string
): Promise<RaiAcceptOrderDetails> {
  const res = await fetch(`${RAIACCEPT_API_URL}/orders/${orderIdentification}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`RaiAccept get order failed: ${res.status} ${errText}`);
  }

  return res.json();
}
