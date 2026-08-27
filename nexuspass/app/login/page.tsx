"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ITO YUNG BAGONG FUNCTION PARA I-VALIDATE ANG EMAIL
  function validateEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Invalid email format.";
    }
    return null;
  }

  // ITO YUNG BAGONG FUNCTION PARA I-VALIDATE ANG PASSWORD
  function validatePassword(password: string): string | null {
    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    return null;
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    // SANITIZE ANG EMAIL
    const sanitizedEmail = email.trim().replace(/[<>]/g, "");

    // VALIDATE ANG EMAIL AT PASSWORD
    const emailError = validateEmail(sanitizedEmail);
    if (emailError) {
      setMessage(emailError);
      setLoading(false);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setMessage(passwordError);
      setLoading(false);
      return;
    }

    // LOGIN TO SUPABASE AUTH
    const { data: authData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

    if (loginError) {
      setMessage("Login failed. Please check your email and password.");
      setLoading(false);
      return;
    }

    const user = authData.user;

    if (!user) {
      setMessage("Login failed. User account not found.");
      setLoading(false);
      return;
    }

    // GET USER ROLE FROM PROFILES
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile error:", profileError);
      setMessage("Unable to retrieve your account role.");
      setLoading(false);
      await supabase.auth.signOut();
      return;
    }

    if (!profile) {
      setMessage("Profile record not found.");
      setLoading(false);
      await supabase.auth.signOut();
      return;
    }

    // ✅ ROLE-BASED REDIRECT
    if (profile.role === "admin") {
      router.push("/admin");
      return;
    }

    if (profile.role === "teacher") {
      router.push("/teacher/preview");
      return;
    }

    if (profile.role === "student") {
      router.push("/student/preview");
      return;
    }

    setMessage(`Unknown account role: ${profile.role}`);
    setLoading(false);
    await supabase.auth.signOut();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-6 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-700">AF-NEXUS</h1>
          <p className="mt-2 text-gray-600">Login to your account</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200" />
          </div>

          {/* ✅ FORGOT PASSWORD LINK */}
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && (
          <div className="mt-5 rounded-lg bg-gray-100 p-3 text-center text-sm text-gray-700">{message}</div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">Don't have an account?</p>
          <Link href="/register" className="mt-2 inline-block font-semibold text-blue-600 hover:text-blue-700">Create Your ID</Link>
        </div>
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-blue-600">← Back to Home</Link>
        </div>
      </div>
    </main>
  );
}