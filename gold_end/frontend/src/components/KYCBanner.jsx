import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { FileCheck, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

const KYCBanner = () => {
    const [kycStatus, setKycStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchKycStatus();
    }, []);

    const fetchKycStatus = async () => {
        try {
            const response = await api.get("/kyc/status");
            setKycStatus(response.data);
        } catch (error) {
            console.error("Failed to fetch KYC status:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || kycStatus?.status === "VERIFIED") {
        return null; // Don't show banner if verified
    }

    const getStatusConfig = () => {
        switch (kycStatus?.status) {
            case "SUBMITTED":
                return {
                    bg: "from-yellow-500 to-yellow-600",
                    icon: <FileCheck className="w-6 h-6" />,
                    title: "KYC Under Review",
                    message: "Your KYC documents are being verified. You'll be notified once approved.",
                    showAction: false,
                };
            case "REJECTED":
                return {
                    bg: "from-red-500 to-red-600",
                    icon: <AlertCircle className="w-6 h-6" />,
                    title: "KYC Rejected",
                    message: kycStatus.rejectionReason || "Please resubmit your KYC documents with correct information.",
                    showAction: true,
                    actionText: "Resubmit KYC",
                };
            default:
                return {
                    bg: "from-orange-500 to-orange-600",
                    icon: <AlertCircle className="w-6 h-6" />,
                    title: "Complete Your KYC",
                    message: "Upload your ID and photo to verify your account and start trading gold.",
                    showAction: true,
                    actionText: "Complete KYC Now",
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div className={`bg-gradient-to-r ${config.bg} rounded-2xl p-6 text-white shadow-xl mb-6`}>
            <div className="flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm flex-shrink-0">
                    {config.icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">{config.title}</h3>
                    <p className="text-white/90 text-sm mb-4">{config.message}</p>
                    {config.showAction && (
                        <button
                            onClick={() => navigate("/kyc")}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                        >
                            {config.actionText}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KYCBanner;
