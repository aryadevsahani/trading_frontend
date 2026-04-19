import { io } from "socket.io-client";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const socket = io(BACKEND_URL, {
  transports: ["websocket", "polling"],
  reconnectionAttempts: 5,
  timeout: 10000,
});

// Connection events
socket.on("connect", () => {
  console.debug("[socket] connected to", BACKEND_URL);
});

socket.on("connect_error", (err) => {
  console.warn("[socket] connect_error", err?.message || err);
});

socket.on("disconnect", (reason) => {
  console.debug("[socket] disconnected", reason);
});

// TBT Market Depth events
socket.on("tbt-connected", () => {
  console.log("[socket] TBT WebSocket connected");
});

socket.on("tbt-disconnected", () => {
  console.log("[socket] TBT WebSocket disconnected");
});

socket.on("market-depth-update", (data) => {
  console.log("[socket] Market depth update:", data);
  // Emit custom event for React components
  window.dispatchEvent(new CustomEvent("marketDepthUpdate", { detail: data }));
});

socket.on("market-depth-error", (error) => {
  console.error("[socket] Market depth error:", error);
  window.dispatchEvent(new CustomEvent("marketDepthError", { detail: error }));
});

socket.on("market-depth-subscribed", (data) => {
  console.log("[socket] Market depth subscribed:", data);
});

socket.on("market-depth-unsubscribed", (data) => {
  console.log("[socket] Market depth unsubscribed:", data);
});

socket.on("market-depth-channel-switched", (data) => {
  console.log("[socket] Market depth channel switched:", data);
});

socket.on("market-depth-data", (data) => {
  console.log("[socket] Market depth data:", data);
  window.dispatchEvent(new CustomEvent("marketDepthData", { detail: data }));
});

export default socket;
