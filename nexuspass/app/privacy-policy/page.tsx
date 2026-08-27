"use client";

import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-blue-700">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: August 2026</p>

        <div className="mt-6 space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-bold text-gray-800">1. Information We Collect</h2>
            <p className="mt-2 text-sm">
              When you register for NEXUSPASS, we collect the following personal information:
              Full name, photo (selfie), school, employee/student number, contact number, email address, address, birthdate, and other relevant ID information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800">2. How We Use Your Information</h2>
            <p className="mt-2 text-sm">
              Your personal information is used exclusively for generating your digital ID card, processing payments, and providing customer support. We do not sell, rent, or share your personal information with any third party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800">3. Data Security</h2>
            <p className="mt-2 text-sm">
              We use industry-standard security measures including Row-Level Security (RLS) and secure databases to protect your data. Only the admin and the account owner can access their own personal records.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800">4. Storage</h2>
            <p className="mt-2 text-sm">
              Your data is stored securely in our cloud database. Proof of payment screenshots are only visible to the admin for verification purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800">5. Your Rights</h2>
            <p className="mt-2 text-sm">
              You have the right to request access to, correction of, or deletion of your personal data. Please contact us if you wish to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800">6. Contact Us</h2>
            <p className="mt-2 text-sm">
              If you have any questions about this Privacy Policy, please contact us at <span className="font-semibold">fensgie@gmail.com</span>.
            </p>
          </section>
        </div>

        {/* BACK BUTTON */}
        <div className="mt-8">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
          >
            <span>←</span> Back to Register
          </Link>
        </div>
      </div>
    </main>
  );
}