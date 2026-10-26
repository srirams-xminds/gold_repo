import React, { useState } from "react";
import api from "../api";
import { ArrowRightLeft, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TradePanel = ({ price }) => {
  const [type, setType] = useState("BUY");
  const [weightGrams, setWeightGrams] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleTrade = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post("/trade/execute", {
        type,
        symbol: "GOLD",
        amount: parseFloat(weightGrams),
        price: pricePerGram,
      });
      setMessage({ type: "success", text: "Trade executed successfully!" });
      setWeightGrams("");
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message || "Trade failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const weight = parseFloat(weightGrams) || 0;
  const pricePerGram = price || 0;
  const total = weight * pricePerGram;

  return (
    <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <ArrowRightLeft className="w-5 h-5 mr-2 text-yellow-500" />
          Quick Trade (24K)
        </h3>
        <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-mono text-green-500">
          Live
        </div>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => setType("BUY")}
          className={`flex-1 py-2.5 rounded-lg font-bold text-sm ${
            type === "BUY" ? "bg-green-500 text-white" : "text-gray-500"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setType("SELL")}
          className={`flex-1 py-2.5 rounded-lg font-bold text-sm ${
            type === "SELL" ? "bg-red-500 text-white" : "text-gray-500"
          }`}
        >
          Sell
        </button>
      </div>

      <form onSubmit={handleTrade} className="space-y-5 flex-1 flex flex-col">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Weight (Grams)
          </label>
          <input
            type="number"
            step="0.01"
            value={weightGrams}
            onChange={(e) => setWeightGrams(e.target.value)}
            className="w-full bg-gray-100 border rounded-xl px-4 py-3"
            placeholder="0.00"
            required
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border mt-auto space-y-3">
          <div className="flex justify-between text-sm">
            <span>Price per Gram (24K)</span>
            <span>₹{pricePerGram.toLocaleString("en-IN")}</span>
          </div>

          <div className="flex justify-between items-end border-t pt-2">
            <span>Total Amount</span>
            <span className="text-2xl font-bold text-yellow-500">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div className="text-sm">{message.text}</motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading || !weightGrams}
          className="w-full py-4 rounded-xl font-bold text-white bg-green-500"
        >
          {type} GOLD NOW
        </button>
      </form>
    </div>
  );
};

export default TradePanel;
