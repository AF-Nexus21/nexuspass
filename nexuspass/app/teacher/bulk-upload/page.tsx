"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse";

export default function TeacherBulkUploadPage() {
  const router = useRouter();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [photoFolder, setPhotoFolder] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentTeacher, setCurrentTeacher] = useState<any>(null);

  // ✅ CHECK IF TEACHER
  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || profile.role !== "teacher") {
        router.push("/");
        return;
      }

      setIsTeacher(true);

      // ✅ Get teacher info
      const { data: teacher } = await supabase
        .from("teachers")
        .select("*")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (teacher) {
        setCurrentTeacher(teacher);
      }
    }
    checkRole();
  }, [router]);

  // ✅ DOWNLOAD CSV TEMPLATE
  function downloadTemplate() {
    const csvContent = [
      "first_name,middle_name,last_name,student_number,school,school_address,course,birth_date,address,contact,parent_guardian,adviser,school_head,photo_filename,email,password",
      "Juan,Dela,Cruz,123456789012,TAGPU NATIONAL HIGH SCHOOL,Tagpu Mandaon Masbate,Grade 7 - Sampaguita,2008-05-15,Tagpu Mandaon Masbate,09123456789,MR. & MRS. JUAN DELA CRUZ,MARILOR F. CARMEN,ANDREW R. ABSALON,123456789012.jpg,juan.delacruz@example.com,password123",
      "Maria,Santos,Lopez,123456789013,TAGPU NATIONAL HIGH SCHOOL,Tagpu Mandaon Masbate,Grade 7 - Sampaguita,2007-08-20,Tagpu Mandaon Masbate,09123456790,MR. & MRS. PEDRO SANTOS,MARILOR F. CARMEN,ANDREW R. ABSALON,123456789013.jpg,maria.santos@example.com,password123"
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

  // ✅ HANDLE CSV FILE UPLOAD
  function handleCsvChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCsvFile(file);
      parseCSV(file);
    }
  }

  // ✅ HANDLE PHOTO FOLDER UPLOAD
  function handlePhotoFolderChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setPhotoFolder(files);
      setMessage(`✅ ${files.length} pictures selected.`);
    }
  }

  // ✅ PARSE CSV FILE
  function parseCSV(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = Papa.parse(text, { header: true });
      const students = result.data as any[];
      
      // I-filter ang mga empty rows
      const validStudents = students.filter((s) => s.first_name && s.last_name && s.email && s.password);
      
      setPreview(validStudents);
      setMessage(`✅ Found ${validStudents.length} students in CSV file.`);
    };
    reader.readAsText(file);
  }

  // ✅ UPLOAD PHOTO TO SUPABASE STORAGE
  async function uploadPhoto(file: File, studentNumber: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentNumber}_${Date.now()}.${fileExt}`;
      const filePath = `student-photos/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }
      
      const { data } = supabase.storage
        .from('student-photos')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    }
  }

  // ✅ PROCESS CSV + FOLDER
  async function handleUpload() {
    if (!csvFile) {
      setError("Please select a CSV file first.");
      return;
    }

    if (photoFolder.length === 0) {
      setError("Please upload the photo folder.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");
    setUploadProgress(0);

    try {
      // 1. PARSE CSV FILE
      const text = await csvFile.text();
      const result = Papa.parse(text, { header: true });

      const students = result.data as Array<{
        first_name: string;
        middle_name: string;
        last_name: string;
        student_number: string;
        school: string;
        school_address: string;
        course: string;
        birth_date: string;
        address: string;
        contact: string;
        parent_guardian: string;
        adviser: string;
        school_head: string;
        photo_filename: string;
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
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < validStudents.length; i++) {
        const student = validStudents[i];
        
        try {
          // ✅ FIND MATCHING PHOTO
          const photoFilename = student.photo_filename || `${student.student_number}.jpg`;
          const photoFile = photoFolder.find(f => f.name === photoFilename);
          
          let photoUrl = null;
          if (photoFile) {
            photoUrl = await uploadPhoto(photoFile, student.student_number);
          }

          // ✅ CREATE AUTH ACCOUNT
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: student.email,
            password: student.password,
          });

          if (authError) {
            console.error(`Error creating account for ${student.email}:`, authError);
            errorCount++;
            continue;
          }

          const user = authData.user;
          if (!user) {
            errorCount++;
            continue;
          }

          // ✅ CREATE PROFILE
          await supabase.from("profiles").insert({
            id: user.id,
            role: "student",
          });

          // ✅ CREATE STUDENT RECORD
          const { error: insertError } = await supabase.from("students").insert({
            profile_id: user.id,
            first_name: student.first_name,
            middle_name: student.middle_name,
            last_name: student.last_name,
            student_number: student.student_number,
            school: student.school,
            school_address: student.school_address,
            course: student.course,
            birth_date: student.birth_date,
            address: student.address,
            contact: student.contact,
            parent_guardian: student.parent_guardian,
            adviser: student.adviser || (currentTeacher ? `${currentTeacher.first_name} ${currentTeacher.last_name}` : ""),
            school_head: student.school_head,
            photo_url: photoUrl,
            status: "active",
          });

          if (insertError) throw insertError;

          successCount++;
        } catch (err) {
          console.error(`Error processing student ${student.student_number}:`, err);
          errorCount++;
        }

        // ✅ UPDATE PROGRESS
        setUploadProgress(Math.round(((i + 1) / validStudents.length) * 100));
      }

      setMessage(`✅ Successfully uploaded ${successCount} students. ${errorCount > 0 ? `⚠️ ${errorCount} students failed.` : ""}`);
      
      // ✅ RESET AFTER SUCCESSFUL UPLOAD
      setCsvFile(null);
      setPhotoFolder([]);
      setPreview([]);
      setUploadProgress(0);
      
    } catch (err) {
      console.error("Bulk upload error:", err);
      setError("Something went wrong during bulk upload.");
    } finally {
      setLoading(false);
    }
  }

  // ✅ DOWNLOAD SAMPLE PICTURES
  function downloadSamplePhotos() {
    // Sample pictures guide
    const guide = [
      "Sample Photo Folder Structure:",
      "",
      "student-photos/",
      "├── 123456789012.jpg",
      "├── 123456789013.jpg",
      "└── 123456789014.jpg",
      "",
      "Rename each picture according to the student's LRN",
      "Example: If LRN is 123456789012, name it 123456789012.jpg"
    ].join("\n");

    const blob = new Blob([guide], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "photo_folder_guide.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (!isTeacher) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Checking role...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/teacher/preview" className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300">
            <span>←</span> Back to Teacher Preview
          </Link>
          <h1 className="text-2xl font-bold text-blue-700">📥 Bulk Upload Students</h1>
        </div>

        {/* INSTRUCTIONS */}
        <div className="mb-8 rounded-xl bg-blue-50 p-6">
          <h2 className="text-lg font-bold text-blue-800">📋 Instructions:</h2>
          <ol className="mt-3 list-decimal pl-5 text-sm text-blue-700">
            <li>I-download ang <strong>CSV template</strong> at punan ang impormasyon ng students</li>
            <li>I-download ang <strong>photo folder guide</strong> para malaman ang tamang pangalan ng pictures</li>
            <li>I-rename ang pictures ayon sa <strong>LRN</strong> ng student</li>
            <li>I-upload ang <strong>CSV file</strong></li>
            <li>I-upload ang <strong>folder ng pictures</strong></li>
            <li>I-click ang <strong>"Upload Students"</strong> button</li>
          </ol>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-gray-800">Bulk Upload Students with Photos</h1>
          <p className="mt-2 text-sm text-gray-500">
            Mag-upload ng CSV file at folder ng pictures para automatic silang ma-register.
          </p>

          {/* TEMPLATE DOWNLOAD */}
          <div className="mt-6 rounded-xl bg-blue-50 p-4">
            <h2 className="text-sm font-bold text-blue-800">Step 1: I-download ang Templates</h2>
            <p className="mt-1 text-xs text-blue-600">
              Punan ang CSV template at i-rename ang pictures ayon sa LRN.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={downloadTemplate}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                📥 Download CSV Template
              </button>
              <button
                onClick={downloadSamplePhotos}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                📷 Photo Folder Guide
              </button>
            </div>
          </div>

          {/* CSV FILE UPLOAD */}
          <div className="mt-6">
            <h2 className="text-sm font-bold text-gray-800">Step 2: I-upload ang CSV File</h2>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvChange}
              className="mt-2 w-full rounded-lg border border-gray-300 p-3"
            />
          </div>

          {/* PHOTO FOLDER UPLOAD */}
          <div className="mt-6">
            <h2 className="text-sm font-bold text-gray-800">Step 3: I-upload ang Photo Folder</h2>
            <p className="mt-1 text-xs text-gray-500">
              I-rename ang bawat picture ayon sa LRN (halimbawa: <code>123456789012.jpg</code>)
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoFolderChange}
              className="mt-2 w-full rounded-lg border border-gray-300 p-3"
            />
            {photoFolder.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700">{photoFolder.length} pictures selected</span>
              </div>
            )}
          </div>

          {/* PREVIEW TABLE */}
          {preview.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-bold text-gray-700">
                📊 Preview ({preview.length} students found)
              </h3>
              <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-gray-600">LRN</th>
                      <th className="px-4 py-2 font-semibold text-gray-600">Name</th>
                      <th className="px-4 py-2 font-semibold text-gray-600">Grade/Strand</th>
                      <th className="px-4 py-2 font-semibold text-gray-600">Photo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.map((student, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 font-mono">{student.student_number}</td>
                        <td className="px-4 py-2">
                          {student.last_name}, {student.first_name}
                        </td>
                        <td className="px-4 py-2">{student.course}</td>
                        <td className="px-4 py-2">
                          {photoFolder.some(f => f.name === student.photo_filename) ? (
                            <span className="text-green-600">✅</span>
                          ) : (
                            <span className="text-yellow-600">⚠️ Missing</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* UPLOAD PROGRESS */}
          {loading && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700">Uploading...</span>
                <span className="text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* BUTTONS */}
          <button
            onClick={handleUpload}
            disabled={loading || preview.length === 0}
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