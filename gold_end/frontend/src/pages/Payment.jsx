import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import {
    CreditCard,
    Smartphone,
    ArrowLeft,
    Check,
    Loader2,
    QrCode,
    Copy,
    CheckCircle2,
} from "lucide-react";

const Payment = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialAmount = searchParams.get("amount") || "";

    const [step, setStep] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [amount, setAmount] = useState(initialAmount);
    const [cardDetails, setCardDetails] = useState({
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        cardType: "DEBIT",
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [upiData, setUpiData] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleAmountSubmit = () => {
        if (parseFloat(amount) <= 0) {
            alert("Please enter a valid amount");
            return;
        }
        setStep(2);
    };

    const handlePaymentMethodSelect = async (method) => {
        setPaymentMethod(method);
        if (method === "upi") {
            // Get UPI QR data
            try {
                const response = await api.get(`/payment/generate-upi-qr?amount=${amount}`);
                setUpiData(response.data);
            } catch (error) {
                console.error("Failed to generate UPI data:", error);
            }
        }
        setStep(3);
    };

    const handleCardChange = (e) => {
        let { name, value } = e.target;

        if (name === "cardNumber") {
            value = value.replace(/\D/g, "").slice(0, 16);
            value = value.replace(/(\d{4})(?=\d)/g, "$1 ");
        } else if (name === "expiryDate") {
            value = value.replace(/\D/g, "").slice(0, 4);
            if (value.length >= 2) {
                value = value.slice(0, 2) + "/" + value.slice(2);
            }
        } else if (name === "cvv") {
            value = value.replace(/\D/g, "").slice(0, 4);
        }

        setCardDetails({ ...cardDetails, [name]: value });
    };

    const processPayment = async () => {
        setLoading(true);
        try {
            let response;
            if (paymentMethod === "upi") {
                response = await api.post("/payment/upi", {
                    amount: parseFloat(amount),
                    upiId: upiData?.upiId,
                });
            } else {
                response = await api.post("/payment/card", {
                    amount: parseFloat(amount),
                    cardNumber: cardDetails.cardNumber.replace(/\s/g, ""),
                    expiryDate: cardDetails.expiryDate,
                    cvv: cardDetails.cvv,
                    cardType: cardDetails.cardType,
                });
            }

            if (response.data.success) {
                setSuccess(response.data);
                setStep(4);

                // Notify all windows/tabs to refresh balance
                window.postMessage({
                    type: 'BALANCE_UPDATE',
                    balance: response.data.newBalance
                }, '*');

                // Also send to parent if in iframe
                if (window.parent !== window) {
                    window.parent.postMessage({
                        type: 'BALANCE_UPDATE',
                        balance: response.data.newBalance
                    }, '*');
                }
            }
        } catch (error) {
            alert(error.response?.data?.error || "Payment failed");
        } finally {
            setLoading(false);
        }
    };

    const copyUpiId = () => {
        navigator.clipboard.writeText(upiData?.upiId || "goldmarket@upi");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleBackToDashboard = () => {
        // Force a page reload to ensure balance updates
        window.location.href = "/dashboard";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
            {/* Header */}
            <header className="p-4 border-b border-gray-700">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : navigate("/dashboard")}
                        className="p-2 hover:bg-gray-700 rounded-lg transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">Add Money</h1>
                        <p className="text-sm text-gray-400">Step {step} of 4</p>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-6">
                {/* Step 1: Enter Amount */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">Enter Amount</h2>
                            <p className="text-gray-400">How much would you like to add?</p>
                        </div>

                        <div className="bg-gray-800 rounded-2xl p-6">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-gray-400">₹</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-transparent text-4xl font-bold text-center py-4 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-2 mt-6">
                                {[100, 500, 1000, 5000].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => setAmount(val.toString())}
                                        className="py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition font-medium"
                                    >
                                        ₹{val}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleAmountSubmit}
                            disabled={!amount || parseFloat(amount) <= 0}
                            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-bold rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue
                        </button>
                    </div>
                )}

                {/* Step 2: Select Payment Method */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">Payment Method</h2>
                            <p className="text-gray-400">Choose how you want to pay</p>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => handlePaymentMethodSelect("upi")}
                                className="w-full p-6 bg-gray-800 hover:bg-gray-700 rounded-2xl transition flex items-center gap-4 border-2 border-transparent hover:border-yellow-500"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                                    <Smartphone className="w-7 h-7" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-bold text-lg">UPI Payment</p>
                                    <p className="text-sm text-gray-400">Pay using any UPI app</p>
                                </div>
                                <span className="text-green-400 text-sm font-medium px-2 py-1 bg-green-400/10 rounded">Instant</span>
                            </button>

                            <button
                                onClick={() => handlePaymentMethodSelect("card")}
                                className="w-full p-6 bg-gray-800 hover:bg-gray-700 rounded-2xl transition flex items-center gap-4 border-2 border-transparent hover:border-yellow-500"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                    <CreditCard className="w-7 h-7" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-bold text-lg">Debit/Credit Card</p>
                                    <p className="text-sm text-gray-400">Visa, Mastercard, RuPay</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Payment Details */}
                {step === 3 && (
                    <div className="space-y-6">
                        {paymentMethod === "upi" ? (
                            <>
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold mb-2">Scan QR Code</h2>
                                    <p className="text-gray-400">Pay ₹{amount} using any UPI app</p>
                                </div>

                                <div className="bg-gray-800 rounded-2xl p-8 text-center">
                                    {/* Mock QR Code */}
                                    <div className="w-48 h-48 mx-auto bg-white rounded-xl p-4 mb-6">
                                        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center">
                                            <QrCode className="w-24 h-24 text-white" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-2 bg-gray-700 rounded-lg px-4 py-3 mb-4">
                                        <span className="text-gray-300">{upiData?.upiId || "goldmarket@upi"}</span>
                                        <button onClick={copyUpiId} className="p-1 hover:bg-gray-600 rounded">
                                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    <p className="text-sm text-gray-400 mb-6">
                                        Open any UPI app and scan this QR code to pay
                                    </p>

                                    <button
                                        onClick={processPayment}
                                        disabled={loading}
                                        className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-400 hover:to-green-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Confirming Payment...
                                            </>
                                        ) : (
                                            "I've Made the Payment"
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold mb-2">Card Details</h2>
                                    <p className="text-gray-400">Enter your card information</p>
                                </div>

                                <div className="bg-gray-800 rounded-2xl p-6 space-y-4">
                                    <div className="flex gap-2 mb-4">
                                        {["DEBIT", "CREDIT"].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setCardDetails({ ...cardDetails, cardType: type })}
                                                className={`flex-1 py-3 rounded-xl font-medium transition ${cardDetails.cardType === type
                                                        ? "bg-yellow-500 text-gray-900"
                                                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                    }`}
                                            >
                                                {type} Card
                                            </button>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Card Number</label>
                                        <input
                                            type="text"
                                            name="cardNumber"
                                            value={cardDetails.cardNumber}
                                            onChange={handleCardChange}
                                            placeholder="1234 5678 9012 3456"
                                            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Expiry Date</label>
                                            <input
                                                type="text"
                                                name="expiryDate"
                                                value={cardDetails.expiryDate}
                                                onChange={handleCardChange}
                                                placeholder="MM/YY"
                                                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">CVV</label>
                                            <input
                                                type="password"
                                                name="cvv"
                                                value={cardDetails.cvv}
                                                onChange={handleCardChange}
                                                placeholder="•••"
                                                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-700">
                                        <div className="flex justify-between mb-4">
                                            <span className="text-gray-400">Amount</span>
                                            <span className="font-bold text-xl">₹{parseFloat(amount).toLocaleString()}</span>
                                        </div>
                                        <button
                                            onClick={processPayment}
                                            disabled={loading || !cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv}
                                            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-bold rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                `Pay ₹${parseFloat(amount).toLocaleString()}`
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Step 4: Success */}
                {step === 4 && success && (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Payment Successful!</h2>
                        <p className="text-gray-400 mb-8">
                            ₹{parseFloat(amount).toLocaleString()} has been added to your wallet
                        </p>

                        <div className="bg-gray-800 rounded-2xl p-6 mb-8 text-left">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Transaction ID</span>
                                    <span className="font-mono">{success.transactionId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Amount Added</span>
                                    <span className="font-bold text-green-400">+₹{parseFloat(amount).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">New Balance</span>
                                    <span className="font-bold">₹{Number(success.newBalance).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Payment Method</span>
                                    <span>{success.paymentMethod}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleBackToDashboard}
                            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-bold rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Payment;
