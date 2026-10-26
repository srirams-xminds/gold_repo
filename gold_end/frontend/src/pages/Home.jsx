import React from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Shield, User } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Navigation Bar with Login Portals */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#ffffff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ color: "#d4a017", fontWeight: 700, fontSize: 20 }}>
            AI Assisted DigitalGold MarketPlace
          </div>

          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <span
              style={{ cursor: "pointer", color: "#333", fontWeight: 500 }}
              onClick={() => navigate("/")}
            >
              Home
            </span>

            <span
              style={{ cursor: "pointer", color: "#333", fontWeight: 500 }}
              onClick={() => navigate("/how-it-works")}
            >
              How It Works
            </span>

            {/* Investor Login Button */}
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "8px 16px",
                background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                color: "#fff",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <User style={{ width: 16, height: 16 }} />
              Investor Login
            </button>

            {/* Admin Login Button */}
            <button
              onClick={() => navigate("/admin-login")}
              style={{
                padding: "8px 16px",
                background: "linear-gradient(135deg, #dc2626, #991b1b)",
                color: "#fff",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Shield style={{ width: 16, height: 16 }} />
              Admin Login
            </button>

            <button
              onClick={() => navigate("/signup")}
              style={{
                padding: "8px 16px",
                background: "#f4b400",
                color: "#fff",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Register
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        background: "linear-gradient(135deg, #fff7e6, #ffffff)",
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "80px 24px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 40,
          alignItems: "center",
        }}>
          <div>
            <h1 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.2 }}>
              Buy & Sell Digital Gold with AI Assistance
            </h1>
            <p style={{ marginTop: 12, fontSize: 18, color: "#555" }}>
              24K pure gold, secure, instant, and smart investment
            </p>
            <button
              style={{
                marginTop: 24,
                padding: "12px 20px",
                background: "#f4b400",
                color: "#fff",
                borderRadius: 16,
                border: "none",
                cursor: "pointer",
                fontSize: 16,
              }}
              onClick={() => navigate("/signup")}
            >
              Get Started
            </button>
          </div>
          <div style={{
            height: 260,
            borderRadius: 20,
            background: "#ffe9b3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#b8860b",
            fontSize: 20,
          }}>
            <img
              src="https://github.com/user-attachments/assets/5b59edda-37b9-45f5-9ed2-404fb373d59a"
              alt="Digital Gold"
              style={{ width: "100%", borderRadius: 24 }}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works">
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "80px 24px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 40,
          alignItems: "center",
        }}>
          <img
            src="https://github.com/user-attachments/assets/02ed0d91-f422-4648-911e-4d789936b892"
            alt="Digital Gold"
            style={{ width: "100%", borderRadius: 24 }}
          />
          <div style={{
            background: "#fff",
            borderRadius: 24,
            padding: 32,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>
              WHAT IS DIGITAL GOLD
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "#444" }}>
              Digital Gold is a trusted and transparent way to purchase 24K pure
              gold. It helps you begin your savings journey with confidence and
              security. You can start investing with a small amount and grow
              steadily.
              <br />
              <br />
              Your gold is stored safely in insured vaults and can be bought or
              sold anytime at live market prices. Our AI assistance helps you
              make smarter decisions and track your growth effortlessly.
            </p>
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: 32 }}>Why Choose Us</h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
        }}>
          {[
            "24K Pure Gold – Government certified gold",
            "Instant Buy/Sell – Real-time price",
            "Safe & Secure – Stored in insured vaults",
            "AI Guidance – Smart investment tips",
          ].map((t, i) => (
            <div key={i} style={{
              padding: 20,
              borderRadius: 16,
              border: "1px solid #eee",
              boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            }}>
              <strong>{t.split(" – ")[0]}</strong>
              <p style={{ marginTop: 8, color: "#555" }}>{t.split(" – ")[1]}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{
        background: "#111",
        color: "#bbb",
        padding: 20,
        textAlign: "center",
      }}>
        © {new Date().getFullYear()} AI Assisted DigitalGold MarketPlace. All
        rights reserved.
      </footer>
    </div>
  );
};

export default Home;
