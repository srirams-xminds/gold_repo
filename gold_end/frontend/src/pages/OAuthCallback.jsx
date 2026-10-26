import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { Loader2 } from "lucide-react";

const OAuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setUser } = useAuth();
    const [error, setError] = useState(null);
    const [status, setStatus] = useState("Verifying login...");
    const called = React.useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            if (called.current) return;
            called.current = true;

            const errorParam = searchParams.get("error");
            if (errorParam) {
                setError("OAuth login failed. Please try again.");
                setTimeout(() => navigate("/login"), 3000);
                return;
            }

            const token = searchParams.get("token");
            if (!token) {
                setError("No authentication token received.");
                setTimeout(() => navigate("/login"), 3000);
                return;
            }

            try {
                setStatus("Exchanging token...");

                // Exchange the token for a session
                const response = await api.get(`/auth/oauth-exchange?token=${token}`);

                if (response.data.success) {
                    setStatus("Login successful! Redirecting...");

                    // Set user directly from the response instead of calling checkAuth
                    // This avoids race conditions with session establishment
                    setUser(response.data.user);

                    // Navigate to dashboard
                    setTimeout(() => navigate("/dashboard"), 500);
                } else {
                    throw new Error(response.data.error || "Token exchange failed");
                }
            } catch (err) {
                console.error("OAuth callback error:", err);
                setError(err.response?.data?.error || err.message || "Authentication failed");
                setTimeout(() => navigate("/login"), 3000);
            }
        };

        handleCallback();
    }, [navigate, searchParams, setUser]);

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 text-lg mb-4">{error}</p>
                    <p className="text-gray-400">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
                <p className="text-white text-lg">{status}</p>
                <p className="text-gray-400 text-sm mt-2">Please wait...</p>
            </div>
        </div>
    );
};

export default OAuthCallback;
