export const NEXT_PUBLIC_NSC_API_BASE_URL = process.env.NEXT_PUBLIC_NSC_API_BASE_URL;

export async function getAuthorizeUrl() {
  const response = await fetch(`${NEXT_PUBLIC_NSC_API_BASE_URL}/oauth/authorizeUrl?provider=Google`);
  if (!response.ok) {
    throw new Error(`Failed to fetch authorize URL: ${response.statusText}`);
  }
  return await response.json();
}

export async function searchProducts(query: string) {
  const response = await fetch(
    `${NEXT_PUBLIC_NSC_API_BASE_URL}/mcp-search/search?query=${encodeURIComponent(
      query
    )}`
  );
  if (!response.ok) {
    throw new Error(`Failed to search: ${response.statusText}`);
  }
  return await response.json();
}

export async function getProductDetail(productName: string) {
  const response = await fetch(`${NEXT_PUBLIC_NSC_API_BASE_URL}/mcp-commerce/get-product?productName=${encodeURIComponent(productName)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch product detail: ${response.statusText}`);
  }
  return await response.json();
}

export async function getOrderHistory(token: string, customerId: string) {
  const url = `${NEXT_PUBLIC_NSC_API_BASE_URL}/mcp-commerce/order-history`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ customerId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch order history: ${response.statusText}`);
  }
  return await response.json();
}

export async function getUserInfo(token: string) {
  const response = await fetch(`${NEXT_PUBLIC_NSC_API_BASE_URL}/oauth/userinfo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

export async function getCart(customerId: string) {
  const response = await fetch(`${NEXT_PUBLIC_NSC_API_BASE_URL}/mcp-commerce/get-cart?customerId=${customerId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch cart: ${response.statusText}`);
  }
  return await response.json();
}

export async function addToCart(customerId: string, variantCode: string, quantity: number) {
  const url = `${NEXT_PUBLIC_NSC_API_BASE_URL}/mcp-commerce/add-to-cart`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ customerId, code: variantCode, quantity }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Backend error in addToCart: ${response.status} ${response.statusText} - ${errorText}`);
    throw new Error(`Failed to add to cart: ${response.statusText} (${errorText})`);
  }
  return await response.json();
}

