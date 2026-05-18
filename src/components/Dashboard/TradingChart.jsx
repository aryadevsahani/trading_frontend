// ======================================================
// FILE: TradingChart.jsx
// ======================================================

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createChart,
  CrosshairMode,
} from "lightweight-charts";

import io from "socket.io-client";

// ======================================================
// SOCKET
// ======================================================

const socket = io(
  "http://localhost:5000",
  {
    transports: ["websocket"],
    reconnection: true,
  }
);

// ======================================================
// TIMEFRAMES
// ======================================================

const TIMEFRAMES = [
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "1D",
];

const TradingChart = ({
  symbol = "NSE:NIFTY50-INDEX",
}) => {
  const containerRef =
    useRef(null);

  const chartRef =
    useRef(null);

  const candleSeriesRef =
    useRef(null);

  const volumeSeriesRef =
    useRef(null);

  const [timeframe, setTimeframe] =
    useState("1m");

  // ======================================================
  // INIT CHART
  // ======================================================

  useEffect(() => {
    if (!containerRef.current)
      return;

    // ======================================================
    // REMOVE OLD CHART
    // ======================================================

    if (chartRef.current) {
      chartRef.current.remove();
    }

    // ======================================================
    // CREATE CHART
    // ======================================================

    const chart = createChart(
      containerRef.current,
      {
        autoSize: true,

        width:
          containerRef.current
            .clientWidth,

        height:
          window.innerHeight -
          58,

        // ======================================================
        // TRADINGVIEW STYLE
        // ======================================================

        layout: {
          background: {
            color: "#0a0e17",
          },

          textColor: "#9ca3af",

          fontFamily:
            "Inter, sans-serif",
        },

        watermark: {
          visible: false,
        },

        grid: {
          vertLines: {
            color:
              "rgba(255,255,255,0.04)",
          },

          horzLines: {
            color:
              "rgba(255,255,255,0.04)",
          },
        },

        crosshair: {
          mode:
            CrosshairMode.Normal,

          vertLine: {
            color:
              "rgba(255,255,255,0.12)",

            width: 1,

            labelBackgroundColor:
              "#111827",
          },

          horzLine: {
            color:
              "rgba(255,255,255,0.12)",

            width: 1,

            labelBackgroundColor:
              "#111827",
          },
        },

        rightPriceScale: {
          borderColor:
            "rgba(255,255,255,0.08)",

          scaleMargins: {
            top: 0.1,
            bottom: 0.2,
          },
        },

        leftPriceScale: {
          visible: false,
        },

        // ======================================================
        // TIME SCALE
        // ======================================================

        timeScale: {
          borderColor:
            "rgba(255,255,255,0.08)",

          borderVisible: true,

          timeVisible: true,

          secondsVisible: false,

          rightOffset: 12,

          barSpacing: 8,

          minBarSpacing: 5,

          fixLeftEdge: false,

          fixRightEdge: false,

          lockVisibleTimeRangeOnResize: true,

          rightBarStaysOnScroll: true,

          shiftVisibleRangeOnNewBar: true,

          ticksVisible: true,

          tickMarkMaxCharacterLength: 8,

          allowBoldLabels: true,

          tickMarkFormatter:
            (time) => {
              return new Date(
                time * 1000
              ).toLocaleTimeString(
                "en-IN",
                {
                  timeZone:
                    "Asia/Kolkata",

                  hour:
                    "2-digit",

                  minute:
                    "2-digit",

                  hour12: false,
                }
              );
            },
        },

        localization: {
          locale: "en-IN",

          timeFormatter:
            (time) => {
              return new Date(
                time * 1000
              ).toLocaleString(
                "en-IN",
                {
                  timeZone:
                    "Asia/Kolkata",

                  hour12: false,
                }
              );
            },
        },

        // ======================================================
        // SCROLL + ZOOM
        // ======================================================

        handleScroll: {
          mouseWheel: true,

          pressedMouseMove:
            true,

          horzTouchDrag: true,

          vertTouchDrag: true,
        },

        handleScale: {
          mouseWheel: true,

          pinch: true,

          axisPressedMouseMove:
            true,
        },
      }
    );

    chartRef.current = chart;

    // ======================================================
    // CANDLE SERIES
    // ======================================================

    const candleSeries =
      chart.addCandlestickSeries({
        upColor: "#00c087",

        downColor: "#f23645",

        borderVisible: false,

        wickUpColor:
          "#00c087",

        wickDownColor:
          "#f23645",

        priceLineVisible: true,

        lastValueVisible: true,

        priceFormat: {
          type: "price",

          precision: 2,

          minMove: 0.05,
        },
      });

    candleSeriesRef.current =
      candleSeries;

    // ======================================================
    // VOLUME SERIES
    // ======================================================

    const volumeSeries =
      chart.addHistogramSeries({
        priceFormat: {
          type: "volume",
        },

        priceScaleId: "",

        scaleMargins: {
          top: 0.82,
          bottom: 0,
        },
      });

    volumeSeriesRef.current =
      volumeSeries;

    // ======================================================
    // SOCKET JOIN
    // ======================================================

    socket.emit("join-chart", {
      symbol,
      timeframe,
    });

    // ======================================================
    // HISTORY
    // ======================================================

    const onHistory = (
      candles
    ) => {
      if (
        !Array.isArray(candles)
      )
        return;

      // ======================================================
      // FIX ORDER
      // ======================================================

      const fixed = candles
        .map((c) => ({
          time:
            c.time > 1e12
              ? Math.floor(
                  c.time / 1000
                )
              : c.time,

          open: Number(c.open),

          high: Number(c.high),

          low: Number(c.low),

          close: Number(
            c.close
          ),

          volume: Number(
            c.volume || 0
          ),
        }))

        .filter(
          (c) =>
            c.time &&
            !isNaN(c.time)
        )

        .sort(
          (a, b) =>
            a.time - b.time
        )

        // REMOVE DUPLICATES
        .filter(
          (
            candle,
            index,
            arr
          ) =>
            index === 0 ||
            candle.time !==
              arr[index - 1]
                .time
        );

      candleSeries.setData(
        fixed
      );

      volumeSeries.setData(
        fixed.map((c) => ({
          time: c.time,

          value: c.volume,

          color:
            c.close >= c.open
              ? "rgba(0,192,135,0.5)"
              : "rgba(242,54,69,0.5)",
        }))
      );

      // ======================================================
      // PERFECT ALIGNMENT
      // ======================================================

      chart.timeScale().fitContent();

      setTimeout(() => {
        chart
          .timeScale()
          .scrollToRealTime();
      }, 50);
    };

    // ======================================================
    // LIVE UPDATE
    // ======================================================

    const onUpdate = (
      candle
    ) => {
      if (!candle) return;

      const updated = {
        time:
          candle.time > 1e12
            ? Math.floor(
                candle.time / 1000
              )
            : candle.time,

        open: Number(
          candle.open
        ),

        high: Number(
          candle.high
        ),

        low: Number(
          candle.low
        ),

        close: Number(
          candle.close
        ),

        volume: Number(
          candle.volume || 0
        ),
      };

      candleSeries.update(
        updated
      );

      volumeSeries.update({
        time: updated.time,

        value:
          updated.volume,

        color:
          updated.close >=
          updated.open
            ? "rgba(0,192,135,0.5)"
            : "rgba(242,54,69,0.5)",
      });
    };

    socket.on(
      "chart-history",
      onHistory
    );

    socket.on(
      "candle-update",
      onUpdate
    );

    // ======================================================
    // RESIZE
    // ======================================================

    const handleResize =
      () => {
        if (
          !containerRef.current
        )
          return;

        chart.applyOptions({
          width:
            containerRef.current
              .clientWidth,

          height:
            window.innerHeight -
            58,
        });
      };

    window.addEventListener(
      "resize",
      handleResize
    );

    // ======================================================
    // CLEANUP
    // ======================================================

    return () => {
      socket.off(
        "chart-history",
        onHistory
      );

      socket.off(
        "candle-update",
        onUpdate
      );

      socket.emit(
        "leave-chart",
        {
          symbol,
          timeframe,
        }
      );

      window.removeEventListener(
        "resize",
        handleResize
      );

      chart.remove();

      chartRef.current = null;
    };
  }, [symbol, timeframe]);

  // ======================================================
  // ZOOM
  // ======================================================

  const zoomIn = () => {
    if (!chartRef.current)
      return;

    const scale =
      chartRef.current.timeScale();

    const current =
      scale.options()
        .barSpacing || 8;

    scale.applyOptions({
      barSpacing:
        current + 2,
    });
  };

  const zoomOut = () => {
    if (!chartRef.current)
      return;

    const scale =
      chartRef.current.timeScale();

    const current =
      scale.options()
        .barSpacing || 8;

    scale.applyOptions({
      barSpacing: Math.max(
        3,
        current - 2
      ),
    });
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background:
          "#0a0e17",
        overflow: "hidden",
      }}
    >
      {/* ======================================================
          TOPBAR
      ====================================================== */}

      <div
        style={{
          height: "58px",

          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          padding:
            "0 14px",

          background:
            "#0a0e17",

          borderBottom:
            "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* LEFT */}
        <div
          style={{
            display: "flex",
            gap: "8px",
          }}
        >
          {TIMEFRAMES.map(
            (tf) => (
              <button
                key={tf}
                onClick={() =>
                  setTimeframe(
                    tf
                  )
                }
                style={{
                  padding:
                    "6px 10px",

                  borderRadius:
                    "6px",

                  border:
                    timeframe ===
                    tf
                      ? "1px solid #2962ff"
                      : "1px solid transparent",

                  background:
                    timeframe ===
                    tf
                      ? "#1d4ed8"
                      : "transparent",

                  color:
                    timeframe ===
                    tf
                      ? "#fff"
                      : "#9ca3af",

                  fontSize:
                    "13px",

                  cursor:
                    "pointer",
                }}
              >
                {tf}
              </button>
            )
          )}
        </div>

        {/* RIGHT */}
        <div
          style={{
            display: "flex",
            gap: "8px",
          }}
        >
          <button
            onClick={zoomOut}
            style={{
              width: "32px",
              height: "32px",
              borderRadius:
                "6px",
              border:
                "1px solid rgba(255,255,255,0.08)",
              background:
                "#111827",
              color: "#fff",
              cursor:
                "pointer",
              fontSize: "18px",
            }}
          >
            −
          </button>

          <button
            onClick={zoomIn}
            style={{
              width: "32px",
              height: "32px",
              borderRadius:
                "6px",
              border:
                "1px solid rgba(255,255,255,0.08)",
              background:
                "#111827",
              color: "#fff",
              cursor:
                "pointer",
              fontSize: "18px",
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* ======================================================
          CHART
      ====================================================== */}

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height:
            "calc(100vh - 58px)",
          position: "relative",
          overflow: "hidden",
        }}
      />
    </div>
  );
};

export default TradingChart;