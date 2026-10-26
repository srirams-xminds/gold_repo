import React, { useState, useEffect } from "react";
import api from "../api";
import {
    TrendingUp,
    TrendingDown,
    Plus,
    X,
    Check,
    Clock,
    XCircle,
    AlertTriangle,
    Loader2,
} from "lucide-react";

const PriceTriggers = () => {
    const [triggers, setTriggers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        triggerPrice: "",
        action: "BUY",
        goldAmount: "",
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTriggers();
        // Refresh triggers every 15 seconds
        const interval = setInterval(fetchTriggers, 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchTriggers = async () => {
        try {
            const response = await api.get("/price-trigger/list");
            setTriggers(response.data || []);
        } catch (error) {
            console.error("Failed to fetch triggers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await api.post("/price-trigger/create", {
                triggerPrice: parseFloat(formData.triggerPrice),
                action: formData.action,
                goldAmount: parseFloat(formData.goldAmount),
            });

            if (response.data.success) {
                alert("Price trigger created successfully!");
                setFormData({ triggerPrice: "", action: "BUY", goldAmount: "" });
                setShowForm(false);
                fetchTriggers();
            }
        } catch (error) {
            alert(error.response?.data?.error || "Failed to create trigger");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        if (!confirm("Are you sure you want to cancel this trigger?")) return;

        try {
            await api.delete(`/price-trigger/${id}`);
            fetchTriggers();
        } catch (error) {
            alert("Failed to cancel trigger");
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
            EXECUTED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            CANCELLED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
            FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
        };

        const icons = {
            ACTIVE: <Clock className="w-3 h-3" />,
            EXECUTED: <Check className="w-3 h-3" />,
            CANCELLED: <X className="w-3 h-3" />,
            FAILED: <XCircle className="w-3 h-3" />,
        };

        return (
            <span className={`px-2 py-1 rounded-lg text-xs font-medium border inline-flex items-center gap-1 ${styles[status]}`}>
                {icons[status]}
                {status}
            </span>
        );
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
                    <h2 className="text-2xl font-bold mb-2">Price Triggers</h2>
                    <p className="text-gray-400">Set target prices for automatic buy/sell</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-gray-900 rounded-xl font-semibold hover:bg-yellow-600 transition"
                >
                    {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {showForm ? "Cancel" : "New Trigger"}
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4">Create Price Trigger</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Action */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Action</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, action: "BUY" })}
                                    className={`py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${formData.action === "BUY"
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                        }`}
                                >
                                    <TrendingDown className="w-5 h-5" />
                                    Buy
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, action: "SELL" })}
                                    className={`py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${formData.action === "SELL"
                                            ? "bg-red-500 text-white"
                                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                        }`}
                                >
                                    <TrendingUp className="w-5 h-5" />
                                    Sell
                                </button>
                            </div>
                        </div>

                        {/* Trigger Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Target Price (₹/gram)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.triggerPrice}
                                onChange={(e) => setFormData({ ...formData, triggerPrice: e.target.value })}
                                required
                                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder="e.g., 6400"
                            />
                        </div>

                        {/* Gold Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Gold Amount (grams)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.goldAmount}
                                onChange={(e) => setFormData({ ...formData, goldAmount: e.target.value })}
                                required
                                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder="e.g., 1.5"
                            />
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-blue-300">
                                    {formData.action === "BUY" ? (
                                        <>
                                            This trigger will <strong>BUY {formData.goldAmount || "X"}g gold</strong> when
                                            the price <strong>drops to or below ₹{formData.triggerPrice || "X"}/gram</strong>.
                                        </>
                                    ) : (
                                        <>
                                            This trigger will <strong>SELL {formData.goldAmount || "X"}g gold</strong> when
                                            the price <strong>reaches or exceeds ₹{formData.triggerPrice || "X"}/gram</strong>.
                                        </>
                                    )}
                                </p>
                                <p className="text-xs text-blue-400 mt-1">
                                    Est. value: ₹{((formData.goldAmount || 0) * (formData.triggerPrice || 0)).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-yellow-500 text-gray-900 rounded-xl font-bold hover:bg-yellow-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Trigger"
                        )}
                    </button>
                </form>
            )}

            {/* Triggers List */}
            <div className="bg-gray-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-700">
                    <h3 className="font-semibold">Your Price Triggers</h3>
                </div>

                {triggers.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No price triggers set</p>
                        <p className="text-sm mt-2">Create a trigger to automate your trades</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700">
                        {triggers.map((trigger) => (
                            <div key={trigger.id} className="p-4 hover:bg-gray-700/30 transition">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${trigger.action === "BUY" ? "bg-green-500/20" : "bg-red-500/20"
                                                    }`}
                                            >
                                                {trigger.action === "BUY" ? (
                                                    <TrendingDown className="w-5 h-5 text-green-400" />
                                                ) : (
                                                    <TrendingUp className="w-5 h-5 text-red-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold">
                                                    {trigger.action} {trigger.goldAmount}g at ₹{trigger.triggerPrice}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Value: ₹{(trigger.goldAmount * trigger.triggerPrice).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-sm">
                                            {getStatusBadge(trigger.status)}
                                            <span className="text-gray-400">
                                                Created: {new Date(trigger.createdAt).toLocaleDateString()}
                                            </span>
                                            {trigger.executedAt && (
                                                <span className="text-gray-400">
                                                    Executed: {new Date(trigger.executedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>

                                        {trigger.executionDetails && (
                                            <p className="text-xs text-gray-500 mt-2">{trigger.executionDetails}</p>
                                        )}
                                    </div>

                                    {trigger.status === "ACTIVE" && (
                                        <button
                                            onClick={() => handleCancel(trigger.id)}
                                            className="ml-4 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                            title="Cancel trigger"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Active Triggers Summary */}
            {triggers.filter((t) => t.status === "ACTIVE").length > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-400">
                        <Clock className="w-5 h-5" />
                        <p className="font-medium">
                            {triggers.filter((t) => t.status === "ACTIVE").length} active trigger(s) monitoring price
                        </p>
                    </div>
                    <p className="text-sm text-green-300 mt-1">
                        Triggers are checked every 10 seconds and execute automatically when conditions are met.
                    </p>
                </div>
            )}
        </div>
    );
};

export default PriceTriggers;
