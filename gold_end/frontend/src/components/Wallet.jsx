import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet as WalletIcon,
  Plus,
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
} from "lucide-react";
import api from "../api";

const Wallet = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = useCallback(async () => {
    try {
      const response = await api.get("/trade/wallet");
      setBalance(response.data.balance || 0);

      const historyResponse = await api.get("/trade/history");
      setTransactions(historyResponse.data || []);
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();

    // Poll for balance updates every 10 seconds for real-time feel
    const interval = setInterval(fetchWalletData, 10000);
    return () => clearInterval(interval);
  }, [fetchWalletData]);

  // Listen for balance update events from other components
  useEffect(() => {
    const handleBalanceUpdate = (event) => {
      if (event.data?.type === "BALANCE_UPDATE") {
        setBalance(event.data.balance);
      }
    };
    window.addEventListener("message", handleBalanceUpdate);
    return () => window.removeEventListener("message", handleBalanceUpdate);
  }, []);

  const handleAddMoney = () => {
    navigate("/payment");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Wallet</h2>
          <p className="text-gray-400">Manage your funds and transactions</p>
        </div>
        <button
          onClick={fetchWalletData}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-gray-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <WalletIcon className="w-8 h-8 mr-3" />
            <div>
              <p className="text-sm opacity-80">Available Balance</p>
              <h3 className="text-3xl font-bold">
                ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
          <button
            onClick={handleAddMoney}
            className="bg-gray-900 text-yellow-200 px-3.5 py-2 rounded-xl font-semibold hover:bg-gray-800 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Money
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Recent Transactions
        </h3>

        <div className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No transactions yet
            </p>
          ) : (
            transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition text-white"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "BUY" ? "bg-red-500/20" : "bg-green-500/20"
                      }`}
                  >
                    {tx.type === "BUY" ? (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {tx.type === "BUY"
                        ? `Bought ${tx.symbol}`
                        : `Sold ${tx.symbol}`}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`font-bold ${tx.type === "BUY" ? "text-red-500" : "text-green-500"
                      }`}
                  >
                    {tx.type === "BUY" ? "-" : "+"}₹
                    {(tx.amount * tx.price).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-sm text-gray-400">
                    {tx.amount}g @ ₹{tx.price.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
