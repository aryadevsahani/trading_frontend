import React, { useEffect, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
import io from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  reconnection: true,
});

const TradingChart = ({ symbol = "NSE:NIFTY50-INDEX" }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log("🟢 INIT CHART");

    // destroy old chart safely
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 500,

      layout: {
        background: { color: "#0f172a" },
        textColor: "#cbd5e1",
      },

      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },

      crosshair: {
        mode: CrosshairMode.Normal,
      },

      rightPriceScale: {
        borderColor: "#334155",
      },

      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    seriesRef.current = candleSeries;

    socket.emit("join-chart", { symbol });

    // =====================
    // HISTORY
    // =====================
    const onHistory = (candles) => {
      if (!Array.isArray(candles) || candles.length === 0) return;

      console.log("📦 HISTORY LOADED");

      // IMPORTANT: ensure time is number (seconds)
      const fixed = candles.map(c => ({
        ...c,
        time: Number(c.time),
      }));

      candleSeries.setData(fixed);

      setTimeout(() => {
        chart.timeScale().fitContent();
      }, 300);
    };

    // =====================
    // LIVE
    // =====================
    const onUpdate = (candle) => {
      if (!candle) return;

      candleSeries.update({
        ...candle,
        time: Number(candle.time),
      });
    };

    socket.on("chart-history", onHistory);
    socket.on("candle-update", onUpdate);

    // resize fix
    const resize = () => {
      chart.applyOptions({
        width: containerRef.current.clientWidth,
      });
    };

    window.addEventListener("resize", resize);

    return () => {
      console.log("🔴 CLEANUP");

      socket.off("chart-history", onHistory);
      socket.off("candle-update", onUpdate);

      socket.emit("leave-chart", { symbol });

      window.removeEventListener("resize", resize);

      chart.remove();
      chartRef.current = null;
    };
  }, [symbol]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "500px",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    />
  );
};

export default TradingChart;