"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (error || !profile || profile.role !== "admin") {
          router.push("/");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Admin check failed:", error);
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-200">
        <div className="rounded-xl bg-white px-8 py-6 shadow-lg">
          <p className="font-semibold text-gray-700">Loading Admin Dashboard...</p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300">
            <span>←</span> Back to Login
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-700">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-500">Manage all NEXUSPASS features</p>
        </div>

        {/* ✅ ADMIN CARDS */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* ✅ ADMIN PAYMENTS */}
          <Link
            href="/admin/payments"
            className="rounded-2xl bg-white p-6 shadow-lg transition hover:scale-105 hover:shadow-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
              💰
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-800">Admin Payments</h2>
            <p className="mt-2 text-sm text-gray-500">
              Approve payments, view receipts, at i-monitor ang revenue.
            </p>
          </Link>

          {/* ✅ BULK UPLOAD */}
          <Link
            href="/admin/bulk-upload"
            className="rounded-2xl bg-white p-6 shadow-lg transition hover:scale-105 hover:shadow-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl">
              📥
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-800">Bulk Upload</h2>
            <p className="mt-2 text-sm text-gray-500">
              I-upload ang CSV file ng mga estudyante para automatic silang ma-register.
            </p>
          </Link>

          {/* ✅ VIEW FEEDBACKS */}
          <Link
            href="/admin/feedback"
            className="rounded-2xl bg-white p-6 shadow-lg transition hover:scale-105 hover:shadow-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-2xl">
              💬
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-800">View Feedbacks</h2>
            <p className="mt-2 text-sm text-gray-500">
              Basahin ang mga feedback at suggestions ng mga users.
            </p>
          </Link>

          {/* ✅ ID PREVIEW */}
          <Link
            href="/admin/id-preview"
            className="rounded-2xl bg-white p-6 shadow-lg transition hover:scale-105 hover:shadow-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-2xl">
              👁️
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-800">ID Preview</h2>
            <p className="mt-2 text-sm text-gray-500">
              I-preview ang mga ID ng students at teachers para ma-verify ang details.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}