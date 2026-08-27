"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PaymentPage() {
  const [amount, setAmount] = useState<number>(50);
  const [paymentMethod, setPaymentMethod] = useState<string>("gcash");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      
      const reader = new FileReader();
      reader.onload = () => setProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadProof = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in first!");
        return;
      }

      const { data: teacherData } = await supabase
        .from("teachers")
        .select("first_name, last_name, contact")
        .eq("profile_id", user.id)
        .maybeSingle();

      const fullName = teacherData 
        ? `${teacherData.first_name} ${teacherData.last_name}`
        : "Unknown User";

      let proofUrl = null;
      if (proofFile) {
        proofUrl = await uploadProof(proofFile);
      }

      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          profile_id: user.id,
          user_name: fullName,
          user_email: user.email,
          amount: amount,
          payment_method: paymentMethod,
          status: "pending",
          proof_url: proofUrl,
          reference_number: `REF-${Date.now()}`,
        });

      if (paymentError) {
        throw new Error(`Payment record creation failed: ${paymentError.message}`);
      }

      setMessage("Payment submitted successfully! Your ID will be unlocked once approved.");
      setProofFile(null);
      setProofPreview(null);
    } catch (err) {
      console.error("Payment error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during payment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-xl">
        
        {/* BACK TO LOGIN BUTTON */}
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
          >
            <span>←</span> Back to Login
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg">
          {/* HEADER */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-blue-700">
              NEXUSPASS
            </h1>
            <p className="mt-2 text-gray-600">
              Complete your payment to unlock your ID
            </p>
          </div>

          {/* GCASH ACCOUNT */}
          <div className="mb-8 rounded-xl bg-blue-50 p-6 text-center shadow-sm">
            <h2 className="text-lg font-bold text-blue-800">GCash Account</h2>
            <p className="mt-2 text-2xl font-bold text-blue-700">
              09127808628
            </p>
            <p className="mt-2 text-sm text-blue-600">
              Account Name: <span className="font-semibold">Aljun Fenis</span>
            </p>

            {/* ✅ ITO YUNG BAGONG QR CODE IMAGE */}
            <img
              src="/gcash-qr.png"
              alt="GCash QR Code"
              style={{
                width: "200px",
                height: "200px",
                objectFit: "contain",
                display: "block",
                margin: "16px auto",
                border: "2px solid #e5e7eb",
                borderRadius: "12px"
              }}
            />

            <p className="mt-2 text-xs text-blue-500">
              I-scan ang QR code gamit ang iyong GCash app, o kaya ay manu-manong i-send sa number sa taas. Pagkatapos, i-upload ang screenshot ng transaction receipt sa ibaba.
            </p>
          </div>

          {/* HOW TO PAY */}
          <div className="mb-8 rounded-xl bg-gray-50 p-6">
            <h2 className="mb-3 text-lg font-bold text-gray-800">How to Pay</h2>
            <ol className="list-decimal pl-5 text-sm text-gray-600">
              <li>Open your GCash app.</li>
              <li>I-scan ang QR code o kaya ay i-send sa number sa taas.</li>
              <li>Take a screenshot of the transaction receipt.</li>
              <li>Upload the screenshot below and submit.</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* AMOUNT */}
            <div>
              <label className="mb-2 block font-semibold text-gray-700">
                Amount (PHP)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-lg border px-4 py-3"
                min="1"
                required
              />
            </div>

            {/* PAYMENT METHOD */}
            <div>
              <label className="mb-2 block font-semibold text-gray-700">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              >
                <option value="gcash">GCash</option>
                <option value="maya">Maya</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>

            {/* PROOF OF PAYMENT */}
            <div>
              <label className="mb-2 block font-semibold text-gray-700">
                Proof of Payment (Screenshot)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleProofChange}
                className="w-full rounded-lg border px-4 py-3"
              />
              {proofPreview && (
                <img
                  src={proofPreview}
                  alt="Proof Preview"
                  className="mt-2 h-32 w-32 rounded-lg object-cover"
                />
              )}
            </div>

            {/* ERROR */}
            {error && (
              <div className="rounded-lg bg-red-100 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {message && (
              <div className="rounded-lg bg-green-100 p-4 text-sm text-green-700">
                {message}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Submitting Payment..."
                : "Submit Payment"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}