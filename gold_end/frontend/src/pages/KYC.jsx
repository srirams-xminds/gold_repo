import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import {
    FileCheck,
    ArrowLeft,
    User,
    Calendar,
    FileText,
    MapPin,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Upload,
    Camera,
    X,
    Check,
} from "lucide-react";

const KYC = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        dateOfBirth: "",
        documentType: "AADHAAR",
        documentNumber: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
    });

    const [idDocument, setIdDocument] = useState(null);
    const [idDocumentData, setIdDocumentData] = useState("");
    const [photo, setPhoto] = useState(null);
    const [photoData, setPhotoData] = useState("");
    const [showWebcam, setShowWebcam] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        fetchKycStatus();
    }, []);

    useEffect(() => {
        return () => {
            stopWebcam();
        };
    }, []);

    // Fix: Attach stream to video element when it becomes available
    useEffect(() => {
        if (showWebcam && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [showWebcam]);

    const fetchKycStatus = async () => {
        try {
            const response = await api.get("/kyc/status");
            setStatus(response.data);
        } catch (error) {
            console.error("Failed to fetch KYC status:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== "application/pdf") {
                alert("Please upload a PDF file");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert("File size must be less than 5MB");
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                setIdDocument(file);
                setIdDocumentData(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            setShowWebcam(true);
        } catch (error) {
            alert("Failed to access webcam: " + error.message);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0);

            const photoUrl = canvas.toDataURL("image/jpeg");
            setPhoto(photoUrl);
            setPhotoData(photoUrl);
            stopWebcam();
            setShowWebcam(false);
        }
    };

    const stopWebcam = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!idDocumentData) {
            alert("Please upload your ID document (PDF)");
            return;
        }

        if (!photoData) {
            alert("Please capture your photo using webcam");
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                ...formData,
                idDocumentData: idDocumentData,
                idDocumentFileName: idDocument?.name || "id_document.pdf",
                photoData: photoData,
                photoFileName: "user_photo.jpg",
            };

            const response = await api.post("/kyc/submit", payload);

            if (response.data.success) {
                alert(response.data.message);
                fetchKycStatus();
            }
        } catch (error) {
            console.error("KYC Submit Error:", error);
            const errorMsg = error.response?.data?.error || error.message || "Failed to submit KYC";
            alert(`Error: ${errorMsg}\nStatus: ${error.response?.status}`);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "VERIFIED":
                return "text-green-400 bg-green-400/10";
            case "SUBMITTED":
                return "text-yellow-400 bg-yellow-400/10";
            case "REJECTED":
                return "text-red-400 bg-red-400/10";
            default:
                return "text-gray-400 bg-gray-400/10";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "VERIFIED":
                return <CheckCircle2 className="w-6 h-6" />;
            case "SUBMITTED":
                return <Clock className="w-6 h-6" />;
            case "REJECTED":
                return <XCircle className="w-6 h-6" />;
            default:
                return <AlertCircle className="w-6 h-6" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
            <header className="p-4 border-b border-gray-700">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="p-2 hover:bg-gray-700 rounded-lg transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">KYC Verification</h1>
                        <p className="text-sm text-gray-400">Complete your identity verification</p>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-6">
                {/* Status Card */}
                <div className={`rounded-2xl p-6 mb-8 ${getStatusColor(status?.status)}`}>
                    <div className="flex items-center gap-4">
                        {getStatusIcon(status?.status)}
                        <div>
                            <p className="font-bold text-lg">
                                {status?.status === "VERIFIED"
                                    ? "KYC Verified ✓"
                                    : status?.status === "SUBMITTED"
                                        ? "Verification Pending"
                                        : status?.status === "REJECTED"
                                            ? "Verification Failed"
                                            : "KYC Not Submitted"}
                            </p>
                            <p className="text-sm opacity-80">
                                {status?.status === "VERIFIED"
                                    ? "Your identity has been verified successfully"
                                    : status?.status === "SUBMITTED"
                                        ? "Your documents are under review"
                                        : status?.status === "REJECTED"
                                            ? status?.rejectionReason || "Please resubmit with correct documents"
                                            : "Upload your ID and photo to verify instantly"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Show form only if not verified */}
                {status?.status !== "VERIFIED" && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* File Uploads Section */}
                        <div className="bg-gray-800 rounded-2xl p-6">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-yellow-500" />
                                Upload Documents
                            </h2>

                            <div className="space-y-4">
                                {/* PDF Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        ID Document (PDF) *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            id="pdf-upload"
                                        />
                                        <label
                                            htmlFor="pdf-upload"
                                            className="flex items-center justify-center gap-2 w-full bg-gray-700 border-2 border-dashed border-gray-600 rounded-xl py-4 px-4 cursor-pointer hover:border-yellow-500 transition"
                                        >
                                            {idDocument ? (
                                                <>
                                                    <Check className="w-5 h-5 text-green-400" />
                                                    <span className="text-green-400">{idDocument.name}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FileText className="w-5 h-5 text-gray-400" />
                                                    <span className="text-gray-400">Click to upload PDF (Max 5MB)</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                {/* Webcam Capture */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Your Photo *
                                    </label>
                                    {!photo ? (
                                        <>
                                            {showWebcam ? (
                                                <div className="relative bg-black rounded-xl overflow-hidden">
                                                    <video
                                                        ref={videoRef}
                                                        autoPlay
                                                        playsInline
                                                        muted
                                                        className="w-full h-64 object-cover transform scale-x-[-1]"
                                                    />
                                                    <canvas ref={canvasRef} className="hidden" />
                                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={capturePhoto}
                                                            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-6 py-2 rounded-lg font-semibold transition"
                                                        >
                                                            <Camera className="w-5 h-5 inline mr-2" />
                                                            Capture
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                stopWebcam();
                                                                setShowWebcam(false);
                                                            }}
                                                            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition"
                                                        >
                                                            <X className="w-5 h-5 inline mr-2" />
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={startWebcam}
                                                    className="flex items-center justify-center gap-2 w-full bg-gray-700 border-2 border-dashed border-gray-600 rounded-xl py-8 hover:border-yellow-500 transition"
                                                >
                                                    <Camera className="w-6 h-6 text-gray-400" />
                                                    <span className="text-gray-400">Click to open webcam</span>
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className="relative">
                                            <img src={photo} alt="Captured" className="w-full rounded-xl" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPhoto(null);
                                                    setPhotoData("");
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div className="bg-gray-800 rounded-2xl p-6">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-yellow-500" />
                                Personal Information
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Full Name (as per ID)</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ID Document */}
                        <div className="bg-gray-800 rounded-2xl p-6">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-yellow-500" />
                                ID Document Details
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Document Type</label>
                                    <select
                                        name="documentType"
                                        value={formData.documentType}
                                        onChange={handleChange}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    >
                                        <option value="AADHAAR">Aadhaar Card</option>
                                        <option value="PAN">PAN Card</option>
                                        <option value="PASSPORT">Passport</option>
                                        <option value="DRIVING_LICENSE">Driving License</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Document Number</label>
                                    <input
                                        type="text"
                                        name="documentNumber"
                                        value={formData.documentNumber}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        placeholder={
                                            formData.documentType === "AADHAAR"
                                                ? "XXXX XXXX XXXX"
                                                : formData.documentType === "PAN"
                                                    ? "ABCDE1234F"
                                                    : "Enter document number"
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="bg-gray-800 rounded-2xl p-6">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-yellow-500" />
                                Address
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                        rows={2}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                                        placeholder="House/Flat No., Street, Locality"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">State</label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={formData.state}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Pincode</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleChange}
                                        required
                                        maxLength={6}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        placeholder="6-digit pincode"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !idDocument || !photo}
                            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-bold rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit KYC (Auto-Verify)"
                            )}
                        </button>
                    </form>
                )}

                {/* Verified Status */}
                {status?.status === "VERIFIED" && (
                    <div className="bg-gray-800 rounded-2xl p-6 text-center">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10 text-green-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">You're All Set!</h2>
                        <p className="text-gray-400 mb-6">
                            Your KYC has been verified. You have full access to all features.
                        </p>
                        <div className="bg-gray-700/50 rounded-xl p-4 text-left">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400">Name</p>
                                    <p className="font-medium">{status.fullName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Document</p>
                                    <p className="font-medium">{status.documentType}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Verified On</p>
                                    <p className="font-medium">
                                        {status.verifiedAt
                                            ? new Date(status.verifiedAt).toLocaleDateString()
                                            : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="mt-6 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default KYC;
