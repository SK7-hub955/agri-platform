const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const TOKEN_KEY = "agriConnectToken";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error("Network error — is the server running?");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  // Auth
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  verify: (payload) => request("/api/auth/verify", { method: "POST", body: payload }),
  resend: (email) => request("/api/auth/resend", { method: "POST", body: { email } }),
  me: () => request("/api/auth/me", { auth: true }),

  // Products
  getProducts: () => request("/api/products"),
  getMyProducts: () => request("/api/products/mine", { auth: true }),
  addProduct: (payload) => request("/api/products", { method: "POST", body: payload, auth: true }),

  // Orders
  getCustomerOrders: () => request("/api/orders/customer", { auth: true }),
  getSupplierOrders: () => request("/api/orders/supplier", { auth: true }),
  placeOrder: (items) => request("/api/orders", { method: "POST", body: { items }, auth: true }),

  // Deliveries
  getAvailableDeliveries: () => request("/api/deliveries/available", { auth: true }),
  getMyDeliveries: () => request("/api/deliveries/mine", { auth: true }),
  acceptDelivery: (orderId) => request(`/api/deliveries/${orderId}/accept`, { method: "POST", auth: true }),

  // Community
  getPosts: () => request("/api/community/posts"),
  addPost: (payload) => request("/api/community/posts", { method: "POST", body: payload, auth: true }),

  // Reference data
  getCrops: () => request("/api/crops"),
  getMarketPrices: () => request("/api/market-prices"),
  getWeather: (lat, lon) =>
    request(`/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`),
};

export default api;
