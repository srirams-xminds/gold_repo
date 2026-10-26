import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import {
    Users,
    DollarSign,
    Shield,
    FileCheck,
    Trash2,
    Edit,
    LogOut,
    ChevronDown,
    Check,
    X,
    RefreshCw,
    TrendingUp,
} from "lucide-react";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({});
    const [pendingKyc, setPendingKyc] = useState([]);
    const [unsubmittedKyc, setUnsubmittedKyc] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [editBalance, setEditBalance] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, statsRes, kycRes, unsubmittedRes] = await Promise.all([
                api.get("/admin/users"),
                api.get("/admin/stats"),
                api.get("/admin/kyc/pending"),
                api.get("/admin/kyc/unsubmitted"),
            ]);
            setUsers(usersRes.data);
            setStats(statsRes.data);
            setPendingKyc(kycRes.data);
            setUnsubmittedKyc(unsubmittedRes.data);
        } catch (error) {
            console.error("Failed to fetch admin data:", error);
            if (error.response?.status === 401 || error.response?.status === 400) {
                navigate("/admin-login");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await api.post("/auth/logout");
        navigate("/");
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to delete user");
        }
    };

    const handleUpdateBalance = async (userId) => {
        try {
            await api.put(`/admin/users/${userId}/balance`, {
                balance: parseFloat(editBalance),
            });
            setEditingUser(null);
            setEditBalance("");
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to update balance");
        }
    };

    const handleApproveKyc = async (kycId) => {
        try {
            await api.put(`/admin/kyc/${kycId}/approve`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to approve KYC");
        }
    };

    const handleRejectKyc = async (kycId) => {
        const reason = window.prompt("Enter rejection reason:");
        if (!reason) return;
        try {
            await api.put(`/admin/kyc/${kycId}/reject`, { reason });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to reject KYC");
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            await api.put(`/admin/users/${userId}`, { role: newRole });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to update role");
        }
    };



    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Admin Dashboard</h1>
                            <p className="text-sm text-gray-400">Gold Marketplace Management</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6">
                        <Users className="w-8 h-8 mb-2" />
                        <p className="text-3xl font-bold">{stats.totalUsers || 0}</p>
                        <p className="text-blue-200">Total Users</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6">
                        <TrendingUp className="w-8 h-8 mb-2" />
                        <p className="text-3xl font-bold">{stats.totalInvestors || 0}</p>
                        <p className="text-green-200">Investors</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6">
                        <DollarSign className="w-8 h-8 mb-2" />
                        <p className="text-3xl font-bold">
                            ₹{Number(stats.totalBalance || 0).toLocaleString()}
                        </p>
                        <p className="text-yellow-200">Total Balance</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6">
                        <FileCheck className="w-8 h-8 mb-2" />
                        <div className="flex justify-between items-baseline mb-1">
                            <p className="text-3xl font-bold">{stats.pendingKyc || 0}</p>
                            <span className="text-sm bg-black/20 px-2 py-1 rounded">
                                {stats.notSubmittedKyc || 0} Not Started
                            </span>
                        </div>
                        <p className="text-purple-200">Pending Approval</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-700">
                    {["overview", "users", "kyc"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 font-medium transition border-b-2 -mb-px ${activeTab === tab
                                ? "border-red-500 text-red-500"
                                : "border-transparent text-gray-400 hover:text-white"
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Users Tab */}
                {activeTab === "users" && (
                    <div className="bg-gray-800 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-lg font-semibold">User Management</h2>
                            <button
                                onClick={fetchData}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">User</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Role</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Balance</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">KYC</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-700/30">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-sm text-gray-400">{user.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                                                >
                                                    <option value="INVESTOR">Investor</option>
                                                    <option value="ADMIN">Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                {editingUser === user.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={editBalance}
                                                            onChange={(e) => setEditBalance(e.target.value)}
                                                            className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                                                            placeholder="Amount"
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateBalance(user.id)}
                                                            className="p-1 bg-green-600 rounded hover:bg-green-500"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingUser(null)}
                                                            className="p-1 bg-gray-600 rounded hover:bg-gray-500"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span>₹{Number(user.balance || 0).toLocaleString()}</span>
                                                        <button
                                                            onClick={() => {
                                                                setEditingUser(user.id);
                                                                setEditBalance(user.balance || "0");
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-white"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-2 py-1 rounded text-xs font-medium ${user.kycStatus === "VERIFIED"
                                                        ? "bg-green-500/20 text-green-400"
                                                        : user.kycStatus === "SUBMITTED"
                                                            ? "bg-yellow-500/20 text-yellow-400"
                                                            : user.kycStatus === "REJECTED"
                                                                ? "bg-red-500/20 text-red-400"
                                                                : "bg-gray-500/20 text-gray-400"
                                                        }`}
                                                >
                                                    {user.kycStatus}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* KYC Tab */}
                {activeTab === "kyc" && (<>
                    <div className="bg-gray-800 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-700">
                            <h2 className="text-lg font-semibold">Pending KYC Approvals</h2>
                        </div>
                        {pendingKyc.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No pending KYC requests</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-700">
                                {pendingKyc.map((kyc) => (
                                    <div key={kyc.id} className="p-4 hover:bg-gray-700/30">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{kyc.fullName}</p>
                                                <p className="text-sm text-gray-400">{kyc.userEmail}</p>
                                                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-400">Document: </span>
                                                        {kyc.documentType}
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Number: </span>
                                                        {kyc.documentNumber}
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">DOB: </span>
                                                        {kyc.dateOfBirth}
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">City: </span>
                                                        {kyc.city}, {kyc.state}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApproveKyc(kyc.id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-sm transition"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRejectKyc(kyc.id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm transition"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-800 rounded-xl overflow-hidden mt-6">
                        <div className="p-4 border-b border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-400">Users To Be Verified (Not Started)</h2>
                        </div>
                        {unsubmittedKyc.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <p>All users have started KYC</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-700">
                                {unsubmittedKyc.map((user) => (
                                    <div key={user.userId} className="p-4 hover:bg-gray-700/30">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{user.userName}</p>
                                                <p className="text-sm text-gray-400">{user.userEmail}</p>
                                            </div>
                                            <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded text-xs">
                                                Not Started
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
                )}

                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-800 rounded-xl p-6">
                            <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
                            <div className="space-y-3">
                                {users.slice(0, 5).map((user) => (
                                    <div key={user.id} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-sm text-gray-400">{user.email}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs ${user.role === "ADMIN" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                                            }`}>
                                            {user.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-xl p-6">
                            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setActiveTab("users")}
                                    className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-left"
                                >
                                    <Users className="w-6 h-6 mb-2 text-blue-400" />
                                    <p className="font-medium">Manage Users</p>
                                    <p className="text-sm text-gray-400">View and edit users</p>
                                </button>
                                <button
                                    onClick={() => setActiveTab("kyc")}
                                    className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-left"
                                >
                                    <FileCheck className="w-6 h-6 mb-2 text-green-400" />
                                    <p className="font-medium">KYC Approvals</p>
                                    <p className="text-sm text-gray-400">
                                        {stats.pendingKyc || 0} waiting, {stats.notSubmittedKyc || 0} unverified
                                    </p>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
