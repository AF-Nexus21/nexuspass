"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Feedback = {
  id: string;
  profile_id: string;
  user_name: string | null;
  comment: string;
  rating: number | null;
  admin_reply: string | null;
  status: string;
  created_at: string;
};

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeedbacks() {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Load feedback error:", error);
        return;
      }
      setFeedbacks(data || []);
      setLoading(false);
    }
    loadFeedbacks();
  }, []);

  async function handleReply(feedbackId: string, reply: string) {
    if (!reply.trim()) return;

    const { error } = await supabase
      .from("feedback")
      .update({ admin_reply: reply, status: "resolved" })
      .eq("id", feedbackId);

    if (error) {
      console.error("Reply error:", error);
    } else {
      setFeedbacks((prev) =>
        prev.map((f) =>
          f.id === feedbackId ? { ...f, admin_reply: reply, status: "resolved" } : f
        )
      );
    }
  }

  // ✅ COMPUTE AVERAGE RATING
  const totalRatings = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0);
  const averageRating = feedbacks.length > 0 ? (totalRatings / feedbacks.length).toFixed(1) : "N/A";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-200">
        <div className="rounded-xl bg-white px-8 py-6 shadow-lg">
          <p className="font-semibold text-gray-700">Loading Feedbacks...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href="/admin/payments" className="text-blue-600 hover:underline">← Back to Payments</Link>
        </div>

        <h1 className="mb-8 text-center text-3xl font-bold text-blue-700">User Feedbacks</h1>

        {/* ✅ AVERAGE RATING CARD */}
        <div className="mb-6 flex items-center justify-center gap-4 rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <span className="text-5xl">⭐</span>
          <div>
            <p className="text-2xl font-bold text-gray-800">{averageRating} / 5</p>
            <p className="text-sm text-gray-500">Average Rating ({feedbacks.length} total)</p>
          </div>
        </div>

        <div className="space-y-4">
          {feedbacks.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm">
              No feedback yet.
            </div>
          )}

          {feedbacks.map((fb) => (
            <div key={fb.id} className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">{fb.user_name || "Anonymous"}</p>
                  <div className="mt-1 text-yellow-400">
                    {"★".repeat(fb.rating || 0)}
                    <span className="text-gray-300">{"★".repeat(5 - (fb.rating || 0))}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{fb.comment}</p>
                  <p className="mt-1 text-xs text-gray-400">{new Date(fb.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4">
                {fb.admin_reply ? (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-xs font-semibold text-blue-700">Your Reply:</p>
                    <p className="mt-1 text-sm text-gray-700">{fb.admin_reply}</p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Reply to this user..."
                      className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                      id={`reply-${fb.id}`}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById(`reply-${fb.id}`) as HTMLInputElement;
                        handleReply(fb.id, input.value);
                        input.value = "";
                      }}
                      className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}