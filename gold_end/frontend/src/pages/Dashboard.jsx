import React from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import TradePanel from "../components/TradePanel";
import OrderHistory from "../components/OrderHistory";
import Wallet from "../components/Wallet";
import AIRecommendations from "../components/AIRecommendations";
import PriceTriggers from "../components/PriceTriggers";
import KYCBanner from "../components/KYCBanner";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "home";
  const [livePrice, setLivePrice] = React.useState(0);

  React.useEffect(() => {
    const handler = (event) => {
      if (event.data?.type === "GOLD_PRICE") {
        setLivePrice(event.data.price);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleSearch = (query) => {
    console.log("Searching for:", query);
  };

  const renderContent = () => {
    switch (currentTab) {
      case "history":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Transaction History</h2>
              <p className="text-gray-400 text-sm">
                View all your past transactions
              </p>
            </div>
            <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-xl">
              <OrderHistory />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* KYC Banner */}
            <KYCBanner />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-xl">
                <Wallet />
              </div>
              <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-xl">
                <AIRecommendations />
              </div>
            </div>

            {/* Price Triggers Section */}
            <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-xl">
              <PriceTriggers />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-2 bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-xl flex flex-col"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold flex items-center text-gray-900">
                    <TrendingUp className="w-5 h-5 mr-2 text-yellow-500" />
                    Gold Market (Live)
                  </h2>
                </div>

                <div className="w-full h-[420px] rounded-xl overflow-hidden border">
                  <iframe
                    src={`${import.meta.env.BASE_URL}gold.html`}
                    title="Gold Prices"
                    className="w-full h-full border-0"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="lg:col-span-1 h-full"
              >
                <TradePanel price={livePrice} />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold mb-4 flex items-center text-gray-900">
                <span className="w-1.5 h-6 bg-blue-500 rounded-full mr-3"></span>
                Recent Activity
              </h2>
              <OrderHistory />
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-200 to-transparent pointer-events-none z-0"></div>

        <Header onSearch={handleSearch} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 z-10 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
