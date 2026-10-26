import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { Shield, Lock, Mail, AlertCircle, CheckCircle2, Wrench } from "lucide-react";

const AdminLogin = () => {
    const [formData, setFormData] = useState({
        email: "admin@goldmarket.com",
        password: "12345678",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [setupLoading, setSetupLoading] = useState(false);
    const [setupMessage, setSetupMessage] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    // Check if admin exists on mount
    useEffect(() => {
        checkAdminSetup();
    }, []);

    const checkAdminSetup = async () => {
        try {
            const response = await api.get("/public/setup-admin");
            if (response.data.success) {
                setSetupMessage(response.data.message);
            }
        } catch (err) {
            console.error("Setup check failed:", err);
        }
    };

    const handleSetupAdmin = async () => {
        setSetupLoading(true);
        setError("");
        try {
            const response = await api.get("/public/setup-admin");
            if (response.data.success) {
                setSetupMessage(response.data.message);
                alert("Admin setup successful! You can now login with:\nEmail: admin@goldmarket.com\nPassword: 12345678");
            }
        } catch (err) {
            setError("Failed to setup admin: " + (err.response?.data?.error || err.message));
        } finally {
            setSetupLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/admin-login", formData);
            if (response.data.success) {
                // Update auth context
                await api.get("/auth/me").then((res) => {
                    window.location.href = "/admin";
                });
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || "Admin login failed. Please check your credentials.";
            setError(errorMsg);
            console.error("Login error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLThoLTJ2LTRoMnY0em0tOCA4aC0ydi00aDJ2NHptMC04aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md p-8">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
                    <p className="text-gray-400">Secure access for administrators only</p>
                </div>

                {/* Setup Message */}
                {setupMessage && (
                    <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <p className="text-blue-400 text-sm">{setupMessage}</p>
                    </div>
                )}

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-red-400 text-sm">{error}</p>
                            {error.includes("not found") && (
                                <button
                                    onClick={handleSetupAdmin}
                                    disabled={setupLoading}
                                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                                >
                                    {setupLoading ? "Setting up..." : "Click here to create admin user"}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Admin Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                                placeholder="admin@goldmarket.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-3 px-6 rounded-xl hover:from-red-500 hover:to-red-600 transition duration-200 shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Authenticating...
                            </>
                        ) : (
                            <>
                                <Shield className="w-5 h-5" />
                                Access Admin Panel
                            </>
                        )}
                    </button>
                </form>

                {/* Setup Admin Button */}
                <div className="mt-6">
                    <button
                        onClick={handleSetupAdmin}
                        disabled={setupLoading}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-2 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm"
                    >
                        {setupLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                Setting up...
                            </>
                        ) : (
                            <>
                                <Wrench className="w-4 h-4" />
                                Setup/Verify Admin User
                            </>
                        )}
                    </button>
                </div>

                {/* Back Link */}
                <div className="mt-8 text-center">
                    <Link
                        to="/"
                        className="text-gray-400 hover:text-white transition text-sm"
                    >
                        ← Back to Home
                    </Link>
                </div>

                {/* Security Notice */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500">
                        This area is restricted to authorized personnel only.
                        <br />
                        All login attempts are logged and monitored.
                    </p>
                </div>

                {/* Debug Info */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-600">
                        Default: admin@goldmarket.com / 12345678
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
