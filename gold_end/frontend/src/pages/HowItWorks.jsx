import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const HowItWorks = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("buy");

  const buySteps = [
    {
      step: "01",
      title: "Login",
      desc: "Login or Register. Complete your account setup with eKYC.",
    },
    {
      step: "02",
      title: "Enter Amount",
      desc: "Enter your amount in rupees or gold in grams to buy.",
    },
    {
      step: "03",
      title: "Payment",
      desc: "Choose your payment method like card, UPI, or wallet.",
    },
  ];

  const sellSteps = [
    {
      step: "01",
      title: "Enter Amount",
      desc: "Enter the amount in rupees or gold in grams to sell.",
    },
    {
      step: "02",
      title: "Bank Details",
      desc: "Fill in your bank account details for verification.",
    },
    {
      step: "03",
      title: "Amount Credit",
      desc: "Amount will be credited to your bank within 5–7 working days.",
    },
  ];

  const steps = activeTab === "buy" ? buySteps : sellSteps;

  return (
    <section style={{ padding: "80px 24px", position: "relative" }}>
      {/* Home Button */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          padding: "8px 16px",
          background: "#f4b400",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Home
      </button>

      <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800 }}>How it works</h1>
        <p style={{ color: "#f4b400", marginTop: 8 }}>
          Bringing convenience and safety to buying Gold!
        </p>

        {/* Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            marginTop: 40,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            onClick={() => setActiveTab("buy")}
            style={{
              padding: 16,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "buy" ? "#f4b400" : "#000",
              color: activeTab === "buy" ? "#000" : "#f4b400",
            }}
          >
            Buy
          </div>

          <div
            onClick={() => setActiveTab("sell")}
            style={{
              padding: 16,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "sell" ? "#f4b400" : "#000",
              color: activeTab === "sell" ? "#000" : "#f4b400",
            }}
          >
            Sell
          </div>
        </div>

        {/* Steps */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 40,
            marginTop: 60,
          }}
        >
          {steps.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  margin: "0 auto",
                  background: "#fff",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "#f4b400", fontWeight: 700 }}>STEP</span>
                <span
                  style={{ fontSize: 36, color: "#f4b400", fontWeight: 800 }}
                >
                  {s.step}
                </span>
              </div>

              <h3 style={{ marginTop: 20 }}>{s.title}</h3>
              <p style={{ color: "#666", marginTop: 8 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
