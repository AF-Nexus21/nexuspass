"use client";

import Link from "next/link";

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 text-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-lg">
        <p className="text-6xl">🛠️</p>
        <h1 className="mt-4 text-3xl font-bold text-blue-700">System Under Maintenance</h1>
        <p className="mt-4 text-gray-600">
          We are currently updating the system to serve you better.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Please check back in a few minutes. Your payments are safe with us!
        </p>

        <div className="mt-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
          >
            <span>←</span> Try Again
          </Link>
        </div>
      </div>
    </main>
  );
}