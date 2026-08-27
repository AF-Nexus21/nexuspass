"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Teacher = {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  school: string | null;
  district: string | null;
  region: string | null;
  department: string | null;
  birth_date: string | null;
  address: string | null;

  emergency_contact_name: string | null;
  emergency_contact_number: string | null;

  supervisor_name: string | null;
  supervisor_position: string | null;

  prc_number: string | null;
  philhealth_number: string | null;
  tin: string | null;
  blood_type: string | null;
};

export default function TeacherBackPage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeacher() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("No logged-in user.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("teachers")
        .select(
          `
          first_name,
          middle_name,
          last_name,
          school,
          district,
          region,
          department,
          birth_date,
          address,
          emergency_contact_name,
          emergency_contact_number,
          supervisor_name,
          supervisor_position,
          prc_number,
          philhealth_number,
          tin,
          blood_type
          `
        )
        .eq("profile_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Teacher record error:", error);
        setLoading(false);
        return;
      }

      setTeacher(data);
      setLoading(false);
    }

    loadTeacher();
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-200">
        <p className="font-semibold text-gray-600">
          Loading Teacher ID Back...
        </p>
      </main>
    );
  }

  // ==========================================
  // TEACHER NOT FOUND
  // ==========================================

  if (!teacher) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-200 px-4">
        <div className="rounded-xl bg-white p-6 text-center shadow-lg">
          <h2 className="text-lg font-bold text-red-600">
            Teacher record not found
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Please make sure your teacher profile is properly connected.
          </p>

          <Link
            href="/teacher"
            className="mt-4 inline-block font-semibold text-blue-600 hover:underline"
          >
            ← Back to Teacher ID
          </Link>
        </div>
      </main>
    );
  }

  // ==========================================
  // FORMAT BIRTHDATE
  // ==========================================

  const formattedBirthDate = teacher.birth_date
    ? (() => {
        const [year, month, day] = teacher.birth_date.split("-");

        if (year && month && day) {
          return `${month}/${day}/${year}`;
        }

        return teacher.birth_date;
      })()
    : "";

  // ==========================================
  // FULL NAME
  // ==========================================

  const fullName = [
    teacher.first_name,
    teacher.middle_name
      ? `${teacher.middle_name.replace(/\./g, "").charAt(0)}.`
      : "",
    teacher.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  return (
    <main className="min-h-screen bg-gray-200 px-4 py-10">
      <div className="mx-auto w-fit">

        {/* =====================================
            TEACHER ID BACK
        ===================================== */}

        <div className="relative overflow-hidden shadow-2xl">

          {/* BACKGROUND TEMPLATE */}

          <img
            src="/teacher-id-back.png"
            alt="NEXUSPASS Teacher ID Back"
            className="block h-auto w-[425px]"
          />

          {/* =====================================
              SUPERVISOR NAME
          ===================================== */}

          <div
            className="absolute overflow-hidden whitespace-nowrap text-black"
            style={{
              left: "12%",
              top: "26.2%",
              width: "76%",
              fontSize: "15px",
              lineHeight: "1.1",
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            {teacher.supervisor_name || "JUAN DELA CRUZ"}
          </div>

          {/* =====================================
              SUPERVISOR POSITION
          ===================================== */}

          <div
            className="absolute overflow-hidden whitespace-nowrap text-black"
            style={{
              left: "12%",
              top: "29.2%",
              width: "76%",
              fontSize: "12px",
              lineHeight: "1.1",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {teacher.supervisor_position || "SCHOOL PRINCIPAL"}
          </div>

          {/* =====================================
              EMERGENCY CONTACT NAME
          ===================================== */}

          <div
            className="absolute overflow-hidden whitespace-nowrap text-black"
            style={{
              left: "13%",
              top: "38.8%",
              width: "74%",
              fontSize: "12px",
              lineHeight: "1.2",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {teacher.emergency_contact_name || "JUAN DELA CRUZ"}
          </div>

          {/* =====================================
              EMERGENCY CONTACT NUMBER
          ===================================== */}

          <div
            className="absolute overflow-hidden whitespace-nowrap text-black"
            style={{
              left: "13%",
              top: "41.3%",
              width: "74%",
              fontSize: "12px",
              lineHeight: "1.2",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {teacher.emergency_contact_number || "0912 345 6789"}
          </div>

          {/* =====================================
              SCHOOL
          ===================================== */}

          <div
            className="absolute overflow-hidden whitespace-nowrap text-black"
            style={{
              left: "39%",
              top: "51.7%",
              width: "54%",
              fontSize: "12px",
              lineHeight: "1.2",
              fontWeight: 600,
            }}
          >
            {teacher.school || ""}
          </div>

          {/* =====================================
              DISTRICT
          ===================================== */}

          <div
            className="absolute overflow-hidden whitespace-nowrap text-black"
            style={{
              left: "39%",
              top: "55.7%",
              width: "54%",
              fontSize: "12px",
              lineHeight: "1.2",
              fontWeight: 600,
            }}
          >
            {teacher.district || ""}
          </div>

          {/* =====================================
              BIRTHDATE
          ===================================== */}

          <div
            className="absolute overflow-hidden whitespace-nowrap text-black"
            style={{
              left: "39%",
              top: "59.6%",
              width: "54%",
              fontSize: "12px",
              lineHeight: "1.2",
              fontWeight: 600,
            }}
          >
            {formattedBirthDate}
          </div>

          {/* =====================================
              ADDRESS
          ===================================== */}

          <div
            className="absolute overflow-hidden text-black"
            style={{
              left: "39%",
              top: "63.6%",
              width: "54%",
              fontSize: "11px",
              lineHeight: "1.15",
              fontWeight: 600,
            }}
          >
            {teacher.address || ""}
          </div>

          {/* =====================================
              PRC NUMBER
          ===================================== */}

          <div
            className="absolute overflow-hidden whitespace-nowrap text-black"
            style={{
              left: "39%",
              top: "67.5%",
              width: "54%",
              fontSize: "12px",
              lineHeight: "1.2",
              fontWeight: 600,
            }}
          >
            {teacher.prc_number || "1234567"}
          </div>

          {/* =====================================
              PHILHEALTH NUMBER
          ===================================== */}

          <div
            className="absolute overflow-hidden whitespace-nowrap text-black"
            style={{
              left: "39%",
              top: "71.5%",
              width: "54%",
              fontSize: "12px",
              lineHeight: "1.2",
              fontWeight: 600,
            }}
          >
            {teacher.philhealth_number || "12-345678901-2"}
          </div>

          {/* =====================================
              TIN
          ===================================== */}

          <div
            className="absolute overflow-hidden whitespace-nowrap text-black"
            style={{
              left: "39%",
              top: "75.5%",
              width: "54%",
              fontSize: "12px",
              lineHeight: "1.2",
              fontWeight: 600,
            }}
          >
            {teacher.tin || "123-456-789"}
          </div>

          {/* =====================================
              BLOOD TYPE
          ===================================== */}

          <div
            className="absolute overflow-hidden whitespace-nowrap font-bold text-black"
            style={{
              left: "39%",
              top: "79.5%",
              width: "54%",
              fontSize: "13px",
              lineHeight: "1.2",
            }}
          >
            {teacher.blood_type || "O+"}
          </div>

          {/* =====================================
              EMPLOYEE NAME
              ABOVE SIGNATURE LINE
          ===================================== */}

          <div
            className="absolute overflow-hidden whitespace-nowrap text-black"
            style={{
              left: "12%",
              top: "88.5%",
              width: "76%",
              fontSize: "13px",
              lineHeight: "1.1",
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            {fullName}
          </div>

        </div>

        {/* =====================================
            NAVIGATION
        ===================================== */}

        <div className="mt-5 flex justify-center gap-3">
          <Link
            href="/teacher"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            ← View Front
          </Link>
        </div>

        <p className="mt-3 text-center text-xs text-gray-500">
          NEXUSPASS Teacher ID — Back
        </p>

      </div>
    </main>
  );
}