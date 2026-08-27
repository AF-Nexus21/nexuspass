"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Payment = {
  id: string;
  profile_id: string;
  user_name: string | null;
  user_email: string | null;
  amount: number;
  payment_method: string;
  status: string;
  proof_url: string | null;
  created_at: string;
  download_count: number;
};

type Teacher = {
  profile_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  school: string | null;
  position: string | null;
};

type Student = {
  profile_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  school: string | null;
  course: string | null;
};

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [teachers, setTeachers] = useState<Record<string, Teacher>>({});
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // ✅ BAGONG STATE PARA SA FEEDBACK NOTIFICATION
  const [newFeedbackCount, setNewFeedbackCount] = useState(0);
  
  // ✅ BAGONG STATE PARA SA TABS
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');

  // ✅ BAGONG STATE PARA SA PROOF MODAL
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "admin") {
      router.push("/");
      return;
    }

    setIsAdmin(true);

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load payments error:", error);
      return;
    }

    setPayments(data || []);

    // ✅ KUNIN ANG COUNT NG MGA BAGONG FEEDBACK (status = 'new')
    const { count } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');
    setNewFeedbackCount(count || 0);

    const profileIds = (data || []).map((p) => p.profile_id);
    if (profileIds.length > 0) {
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("profile_id, first_name, last_name, photo_url, school, position")
        .in("profile_id", profileIds);

      const teacherMap: Record<string, Teacher> = {};
      (teacherData || []).forEach((t) => {
        teacherMap[t.profile_id] = t;
      });
      setTeachers(teacherMap);

      const { data: studentData } = await supabase
        .from("students")
        .select("profile_id, first_name, last_name, photo_url, school, course")
        .in("profile_id", profileIds);

      const studentMap: Record<string, Student> = {};
      (studentData || []).forEach((s) => {
        studentMap[s.profile_id] = s;
      });
      setStudents(studentMap);
    }

    setLoading(false);
    setIsRefreshing(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchData();
  }

  const approvePayment = async (payment: Payment) => {
    try {
      const { error: paymentError } = await supabase
        .from("payments")
        .update({ status: "paid" })
        .eq("id", payment.id);

      if (paymentError) {
        console.error("Update payment error:", paymentError);
        return;
      }

      setPayments((prev) =>
        prev.map((p) => (p.id === payment.id ? { ...p, status: "paid" } : p))
      );
    } catch (error) {
      console.error("Approve payment error:", error);
    }
  };

  const approveAll = async () => {
    try {
      const { error: paymentError } = await supabase
        .from("payments")
        .update({ status: "paid" })
        .eq("status", "pending");

      if (paymentError) {
        console.error("Update all payments error:", paymentError);
        return;
      }

      setPayments((prev) =>
        prev.map((p) => (p.status === "pending" ? { ...p, status: "paid" } : p))
      );
    } catch (error) {
      console.error("Approve all error:", error);
    }
  };

  const totalRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalDownloads = payments.reduce((sum, p) => sum + (p.download_count || 0), 0);

  const filteredPayments = payments.filter((p) => {
    if (activeTab === 'pending') return p.status === "pending";
    if (activeTab === 'approved') return p.status === "paid";
    return true;
  });

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-200">
        <div className="rounded-xl bg-white px-8 py-6 shadow-lg">
          <p className="font-semibold text-gray-700">Loading Payments...</p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        
        <div className="mb-6 flex flex-wrap gap-3">
          {/* ✅ ITO YUNG BINAGO NATIN: BACK TO DASHBOARD */}
          <Link href="/admin" className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300">
            <span>←</span> Back to Dashboard
          </Link>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing..." : "↻ Refresh Data"}
          </button>

          {/* ✅ BAGONG FEEDBACK BUTTON NA MAY RED BADGE */}
          <Link href="/admin/feedback" className="relative inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700">
            💬 View Feedbacks
            {newFeedbackCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {newFeedbackCount}
              </span>
            )}
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-700">Admin Payments</h1>
          <p className="mt-2 text-sm text-gray-500">Manage and approve payments (Teachers & Students)</p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-green-50 p-6 text-center shadow-sm border border-green-200">
            <h3 className="text-sm font-semibold text-green-700">Total Sales (Paid)</h3>
            <p className="mt-2 text-3xl font-bold text-green-800">₱{totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-xl bg-yellow-50 p-6 text-center shadow-sm border border-yellow-200">
            <h3 className="text-sm font-semibold text-yellow-700">Pending Approvals</h3>
            <p className="mt-2 text-3xl font-bold text-yellow-800">₱{totalPending.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-6 text-center shadow-sm border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-700">Total Downloads</h3>
            <p className="mt-2 text-3xl font-bold text-blue-800">{totalDownloads}</p>
          </div>
        </div>

        <div className="mb-6 flex justify-center gap-2 border-b border-gray-200 pb-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-t-lg text-sm font-bold transition ${activeTab === 'pending' ? 'bg-yellow-100 text-yellow-800 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🕒 Pending ({payments.filter((p) => p.status === "pending").length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 rounded-t-lg text-sm font-bold transition ${activeTab === 'approved' ? 'bg-green-100 text-green-800 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ✅ Approved ({payments.filter((p) => p.status === "paid").length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-t-lg text-sm font-bold transition ${activeTab === 'all' ? 'bg-gray-100 text-gray-800 border-b-2 border-gray-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            📋 All ({payments.length})
          </button>
        </div>

        <div className="mb-4 text-right">
          <button type="button" onClick={approveAll} className="rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700">Approve All</button>
        </div>

        <div className="space-y-4">
          {filteredPayments.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm">
              {activeTab === 'pending' ? "Walang pending payments!" : activeTab === 'approved' ? "Walang approved payments pa!" : "Walang payments!"}
            </div>
          )}
          {filteredPayments.map((payment) => {
            const teacher = teachers[payment.profile_id];
            const student = students[payment.profile_id];
            const isTeacher = !!teacher;
            const isStudent = !!student;
            
            return (
              <div key={payment.id} className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex flex-wrap gap-8">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800">₱{payment.amount.toFixed(2)}</h3>
                        <p className="mt-1 text-sm text-gray-500">Name: {payment.user_name || "Unknown"}</p>
                        <p className="mt-1 text-sm text-gray-500">Email: {payment.user_email || "Unknown"}</p>
                        <p className="mt-1 text-sm text-gray-500">Method: {payment.payment_method}</p>
                        <p className="mt-1 text-sm text-gray-500">Date: {payment.created_at}</p>
                        <p className="mt-1 text-sm font-bold text-purple-600">Download Count: {payment.download_count || 0}</p>
                        <p className="mt-1 text-sm font-bold text-blue-600">Type: {isTeacher ? "Teacher" : isStudent ? "Student" : "Unknown"}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {payment.status === "paid" ? (
                          <span className="rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">Paid</span>
                        ) : payment.download_count > 0 ? (
                          <span className="rounded-full bg-yellow-100 px-4 py-1 text-sm font-semibold text-yellow-700">Downloaded - Needs Payment</span>
                        ) : (
                          <button type="button" onClick={() => approvePayment(payment)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Approve</button>
                        )}
                      </div>
                    </div>

                    {/* ✅ NANDITO YUNG BAGONG RESIBO VIEWER */}
                    {payment.proof_url && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-semibold text-gray-700">Proof of Payment:</p>
                        <button 
                          type="button" 
                          onClick={() => setSelectedProofUrl(payment.proof_url)}
                          className="group relative block overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition hover:border-blue-400"
                        >
                          <img 
                            src={payment.proof_url} 
                            alt="Proof of Payment" 
                            className="h-32 w-32 object-cover transition group-hover:scale-105"
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-800">🔍 View Full Receipt</span>
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="w-64">
                    <h4 className="mb-2 text-sm font-bold text-gray-700">ID Preview</h4>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      {isTeacher ? (
                        <>
                          <p className="text-center text-sm font-bold text-gray-800">{teacher.first_name} {teacher.last_name}</p>
                          <p className="mt-1 text-center text-xs text-gray-500">{teacher.school || "N/A"}</p>
                          <p className="mt-1 text-center text-xs text-gray-500">{teacher.position || "N/A"}</p>
                          {teacher.photo_url && <img src={teacher.photo_url} alt="Teacher Photo" className="mt-4 h-40 w-full rounded-lg object-contain bg-gray-100 border border-gray-200" />}
                        </>
                      ) : isStudent ? (
                        <>
                          <p className="text-center text-sm font-bold text-gray-800">{student.first_name} {student.last_name}</p>
                          <p className="mt-1 text-center text-xs text-gray-500">{student.school || "N/A"}</p>
                          <p className="mt-1 text-center text-xs text-gray-500">{student.course || "N/A"}</p>
                          {student.photo_url && <img src={student.photo_url} alt="Student Photo" className="mt-4 h-40 w-full rounded-lg object-contain bg-gray-100 border border-gray-200" />}
                        </>
                      ) : (
                        <p className="text-center text-xs text-gray-500">No data found</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ✅ BAGONG MODAL/LIGHTBOX PARA SA BUONG RESIBO */}
      {selectedProofUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedProofUrl(null)}
        >
          <div 
            className="relative max-h-[90vh] max-w-lg overflow-auto rounded-xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Full Receipt</h3>
              <button 
                type="button" 
                onClick={() => setSelectedProofUrl(null)}
                className="rounded-full bg-gray-200 p-2 text-gray-600 transition hover:bg-gray-300"
              >
                ✕
              </button>
            </div>
            <img 
              src={selectedProofUrl} 
              alt="Full Receipt" 
              className="w-full rounded-lg object-contain"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setSelectedProofUrl(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
              >
                Close
              </button>
              <a 
                href={selectedProofUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}