"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse";

export default function BulkUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ✅ DOWNLOAD CSV TEMPLATE
  function downloadTemplate() {
    const csvContent = [
      "first_name,middle_name,last_name,student_number,course,school,address,contact,parent_guardian,adviser,school_head,email,password",
      "Juan,Dela,Cruz,123456789012,Grade 7 - Sampaguita,TAGPU NATIONAL HIGH SCHOOL,Tagpu Mandaon Masbate,09123456789,MR. & MRS. JUAN DELA CRUZ,MARILOR F. CARMEN,ANDREW R. ABSALON,juan.delacruz@example.com,password123",
      "Maria,Santos,Lopez,123456789013,Grade 7 - Sampaguita,TAGPU NATIONAL HIGH SCHOOL,Tagpu Mandaon Masbate,09123456790,MR. & MRS. PEDRO SANTOS,MARILOR F. CARMEN,ANDREW R. ABSALON,maria.santos@example.com,password123"
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nexuspass_students_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ✅ HANDLE FILE UPLOAD
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }

  // ✅ PROCESS CSV
  async function handleUpload() {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      // 1. PARSE CSV FILE
      const text = await file.text();
      const result = Papa.parse(text, { header: true });

      const students = result.data as Array<{
        first_name: string;
        middle_name: string;
        last_name: string;
        student_number: string;
        course: string;
        school: string;
        address: string;
        contact: string;
        parent_guardian: string;
        adviser: string;
        school_head: string;
        email: string;
        password: string;
      }>;

      // I-filter ang mga empty rows
      const validStudents = students.filter((s) => s.first_name && s.last_name && s.email && s.password);

      if (validStudents.length === 0) {
        setError("No valid student data found in CSV.");
        setLoading(false);
        return;
      }

      // 2. LOOP SA BAWAT STUDENT PARA MAG-REGISTER
      for (const student of validStudents) {
        // ✅ CREATE AUTH ACCOUNT
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: student.email,
          password: student.password,
        });

        if (authError) {
          console.error(`Error creating account for ${student.email}:`, authError);
          continue;
        }

        const user = authData.user;
        if (!user) continue;

        // ✅ CREATE PROFILE
        await supabase.from("profiles").insert({
          id: user.id,
          role: "student",
        });

        // ✅ CREATE STUDENT RECORD
        await supabase.from("students").insert({
          profile_id: user.id,
          first_name: student.first_name,
          middle_name: student.middle_name,
          last_name: student.last_name,
          student_number: student.student_number,
          course: student.course,
          school: student.school,
          address: student.address,
          contact: student.contact,
          parent_guardian: student.parent_guardian,
          adviser: student.adviser,
          school_head: student.school_head,
          status: "active",
        });
      }

      setMessage(`Successfully registered ${validStudents.length} students!`);
    } catch (err) {
      console.error("Bulk upload error:", err);
      setError("Something went wrong during bulk upload.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin" className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300">
            <span>←</span> Back to Admin
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-blue-700">Bulk Upload Students</h1>
          <p className="mt-2 text-sm text-gray-500">
            I-upload ang CSV file na may listahan ng mga estudyante para automatic silang ma-register.
          </p>

          {/* TEMPLATE DOWNLOAD */}
          <div className="mt-6 rounded-xl bg-blue-50 p-4">
            <h2 className="text-sm font-bold text-blue-800">Step 1: I-download ang Template</h2>
            <p className="mt-1 text-xs text-blue-600">
              Punan ang template ng mga estudyante. Siguraduhing may unique email at password ang bawat isa.
            </p>
            <button
              onClick={downloadTemplate}
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              📥 Download CSV Template
            </button>
          </div>

          {/* FILE UPLOAD */}
          <div className="mt-6">
            <h2 className="text-sm font-bold text-gray-800">Step 2: I-upload ang CSV File</h2>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-2 w-full rounded-lg border border-gray-300 p-3"
            />
          </div>

          {/* BUTTONS */}
          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Processing..." : "🚀 Upload Students"}
          </button>

          {/* MESSAGE */}
          {message && (
            <div className="mt-4 rounded-lg bg-green-100 p-4 text-sm text-green-700">
              ✅ {message}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-lg bg-red-100 p-4 text-sm text-red-700">
              ❌ {error}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}