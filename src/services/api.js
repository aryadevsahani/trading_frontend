const API_URL = "http://localhost:5000";

/**
 * हेल्पर्स: हेडर्स में Bearer टोकन जोड़ने के लिए
 */
const getHeaders = (token) => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}` // ✅ 'Bearer ' जोड़ना बहुत ज़रूरी है
});

export async function fetchPortfolio(token) {
  try {
    const res = await fetch(`${API_URL}/portfolio`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.status === 401) throw new Error("Unauthorized");
    return await res.json();
  } catch (err) {
    console.error("Portfolio Fetch Error:", err);
    return [];
  }
}

export async function fetchOrders(token) {
  try {
    const res = await fetch(`${API_URL}/orders`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.status === 401) throw new Error("Unauthorized");
    return await res.json();
  } catch (err) {
    console.error("Orders Fetch Error:", err);
    return [];
  }
}

