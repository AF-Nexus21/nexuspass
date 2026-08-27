"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-blue-700">Terms and Conditions</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: August 2026</p>

        <div className="mt-6 space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-bold text-gray-800">1. Acceptance of Terms</h2>
            <p className="mt-2 text-sm">
              By registering and using NEXUSPASS, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800">2. Fees and Payments</h2>
            <p className="mt-2 text-sm">
              A non-refundable fee of ₱50 is required per ID card download. Payment is made through GCash. Once a payment is submitted, it will be reviewed and approved by the admin.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800">3. User Responsibilities</h2>
            <p className="mt-2 text-sm">
              You are responsible for providing accurate information and a proper photo (dress code applies). Any misuse of the platform or false information may result in account suspension.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800">4. Downloads</h2>
            <p className="mt-2 text-sm">
              Each successful payment allows for one (1) ID download. Once downloaded, the payment status resets to unpaid, requiring a new payment for the next download.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800">5. Privacy</h2>
            <p className="mt-2 text-sm">
              By using our service, you agree to our Privacy Policy. Your personal data will only be used for ID generation and payment processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800">6. Contact</h2>
            <p className="mt-2 text-sm">
              For questions or concerns, please contact us at <span className="font-semibold">fensgie@gmail.com</span>.
            </p>
          </section>
        </div>

        <div className="mt-8">
          <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300">
            <span>←</span> Back to Register
          </Link>
        </div>
      </div>
    </main>
  );
}