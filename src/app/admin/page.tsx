"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionEndsAt?: string;
  apiKeysVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/login?message=login_required");
      return;
    }
    
    if (session.user.role !== "admin" && session.user.role !== "super_admin") {
      router.push("/auth/login?message=admin_required");
      return;
    }

    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: any) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, updates }),
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
        setEditingUser(null);
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin": return "text-red-400 bg-red-400/20";
      case "admin": return "text-orange-400 bg-orange-400/20";
      default: return "text-gray-400 bg-gray-400/20";
    }
  };

  const getSubscriptionColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-400 bg-green-400/20";
      case "past_due": return "text-yellow-400 bg-yellow-400/20";
      case "cancelled": return "text-red-400 bg-red-400/20";
      default: return "text-gray-400 bg-gray-400/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-300 mt-2">User Management & System Administration</p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="bg-gold-500 hover:bg-gold-600 text-black px-4 py-2 rounded-lg font-semibold transition-colors">
              Trading Dashboard
            </Link>
            <Link href="/" className="border border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-black px-4 py-2 rounded-lg font-semibold transition-colors">
              Home
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="border border-red-400 text-red-400 hover:bg-red-400 hover:text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
            <h3 className="text-lg font-semibold text-white mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-gold-400">{users.length}</p>
          </div>
          <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
            <h3 className="text-lg font-semibold text-white mb-2">Active Subscribers</h3>
            <p className="text-3xl font-bold text-green-400">
              {users.filter(u => u.subscriptionStatus === 'active').length}
            </p>
          </div>
          <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
            <h3 className="text-lg font-semibold text-white mb-2">Verified APIs</h3>
            <p className="text-3xl font-bold text-blue-400">
              {users.filter(u => u.apiKeysVerified).length}
            </p>
          </div>
          <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
            <h3 className="text-lg font-semibold text-white mb-2">Admin Users</h3>
            <p className="text-3xl font-bold text-purple-400">
              {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-black/40 rounded-xl border border-gold-400/20 overflow-hidden">
          <div className="p-6 border-b border-gold-400/20">
            <h2 className="text-2xl font-bold text-white">User Management</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/60">
                <tr className="text-gray-300 text-sm">
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Subscription</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">API Keys</th>
                  <th className="p-4 font-semibold">Joined</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-700 hover:bg-black/20">
                    <td className="p-4">
                      <div>
                        <div className="text-white font-medium">{user.name || "Unknown"}</div>
                        <div className="text-gray-400 text-sm">{user.email}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-white text-sm">{user.subscriptionTier}</div>
                      {user.subscriptionEndsAt && (
                        <div className="text-gray-400 text-xs">
                          Expires: {new Date(user.subscriptionEndsAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSubscriptionColor(user.subscriptionStatus)}`}>
                        {user.subscriptionStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={user.apiKeysVerified ? "text-green-400" : "text-red-400"}>
                        {user.apiKeysVerified ? "✓ Verified" : "✗ Not Verified"}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {editingUser === user.id ? (
                        <div className="flex gap-2">
                          <select
                            onChange={(e) => updateUser(user.id, { subscriptionStatus: e.target.value })}
                            className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600"
                            defaultValue={user.subscriptionStatus}
                          >
                            <option value="inactive">Inactive</option>
                            <option value="active">Active</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="past_due">Past Due</option>
                          </select>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-gray-400 hover:text-white text-xs px-2 py-1"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingUser(user.id)}
                          className="text-gold-400 hover:text-gold-300 text-sm"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}