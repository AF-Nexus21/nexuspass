"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/cropImage";

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<"student" | "teacher">("student");
  
  // ✅ BAGONG STATE PARA SA ROLE NG TEACHER
  const [teacherRole, setTeacherRole] = useState<"teacher" | "adviser">("teacher");

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    birthDate: "",
    address: "",
    contact: "",
    email: "",
    password: "",
    studentNumber: "",
    course: "",
    employeeNumber: "",
    position: "",
    district: "",
    region: "",
    department: "",
    fbName: "",
    tin: "",
    prcNumber: "",
    philhealthNumber: "",
    bloodType: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
    supervisorName: "",
    supervisorPosition: "",
    school: "",
    // ✅ BAGONG FIELD - SCHOOL ADDRESS
    schoolAddress: "",
    // ✅ BAGONG FIELDS PARA SA BACK PAGE
    parentGuardian: "",
    adviser: "",
    schoolHead: "",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setOriginalImageSrc(reader.result as string);
        setIsCropOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!originalImageSrc || !croppedAreaPixels) return;

    try {
      const croppedImageUrl = await getCroppedImg(originalImageSrc, croppedAreaPixels);
      setPhotoPreview(croppedImageUrl);
      
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], "cropped-photo.jpg", { type: "image/jpeg" });
      setPhotoFile(file);
      
      setIsCropOpen(false);
    } catch (error) {
      console.error("Crop error:", error);
      alert("Error cropping photo. Please try again.");
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `teacher-photos/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('teacher-photos')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) { console.error('Upload error:', uploadError); return null; }
      const { data } = supabase.storage
        .from('teacher-photos')
        .getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) { console.error('Upload failed:', error); return null; }
  };

  const handleDateChange = (date: Date | null) => {
    const formatted = date ? date.toISOString().split('T')[0] : "";
    setForm({ ...form, birthDate: formatted });
  };

  const validateForm = () => {
    if (!form.firstName.trim()) return "First Name is required.";
    if (!form.lastName.trim()) return "Last Name is required.";
    if (!form.birthDate) return "Birth Date is required.";
    if (!form.email.trim()) return "Email Address is required.";
    if (!form.password.trim()) return "Password is required.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (!form.contact.trim()) return "Contact Number is required.";
    if (!form.address.trim()) return "Address is required.";
    if (!form.school.trim()) return "School Name is required.";
    if (!form.schoolAddress.trim()) return "School Address is required.";

    if (accountType === "student") {
      if (!form.studentNumber.trim()) return "LRN is required.";
      if (!form.course.trim()) return "Grade / Strand is required.";
      if (!form.parentGuardian.trim()) return "Parent / Guardian Name is required.";
      if (!form.adviser.trim()) return "Adviser Name is required.";
      if (!form.schoolHead.trim()) return "School Head Name is required.";
    }

    if (accountType === "teacher") {
      if (!form.employeeNumber.trim()) return "Employee Number is required.";
      if (!form.position.trim()) return "Position is required.";
      if (!form.district.trim()) return "District is required.";
      if (!form.region.trim()) return "Region is required.";
      if (!form.department.trim()) return "Department is required.";
      if (!form.fbName.trim()) return "Facebook Name is required.";
      if (!form.tin.trim()) return "TIN is required.";
      if (!form.prcNumber.trim()) return "PRC Number is required.";
      if (!form.philhealthNumber.trim()) return "PhilHealth Number is required.";
      if (!form.bloodType.trim()) return "Blood Type is required.";
      if (!form.emergencyContactName.trim()) return "Emergency Contact Name is required.";
      if (!form.emergencyContactNumber.trim()) return "Emergency Contact Number is required.";
      if (!form.supervisorName.trim()) return "Supervisor Name is required.";
      if (!form.supervisorPosition.trim()) return "Supervisor Position is required.";
    }

    return null;
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    const validationErrorMsg = validateForm();
    if (validationErrorMsg) {
      setValidationError(validationErrorMsg);
      return;
    }

    if (!agreed) {
      alert("Please agree to the Terms and Conditions and Privacy Policy.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");
    setValidationError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (authError) throw new Error(authError.message);
      const user = authData.user;
      if (!user) throw new Error("Unable to create user account.");

      const { error: profileError } = await supabase.from("profiles").insert({ id: user.id, role: accountType });
      if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);

      let photoUrl = null;
      if (photoFile) photoUrl = await uploadPhoto(photoFile);

      if (accountType === "student") {
        const { error: studentError } = await supabase.from("students").insert({
          profile_id: user.id, first_name: form.firstName, middle_name: form.middleName, last_name: form.lastName,
          student_number: form.studentNumber,
          school: form.school, 
          // ✅ I-SAVE ANG SCHOOL ADDRESS
          school_address: form.schoolAddress,
          course: form.course,
          birth_date: form.birthDate,
          address: form.address, contact: form.contact, photo_url: photoUrl, status: "active",
          parent_guardian: form.parentGuardian,
          adviser: form.adviser,
          school_head: form.schoolHead,
        });
        if (studentError) throw new Error(`Student record creation failed: ${studentError.message}`);
      } else {
        // ✅ I-SAVE ANG ROLE NG TEACHER (teacher o adviser)
        const { error: teacherError } = await supabase.from("teachers").insert({
          profile_id: user.id, first_name: form.firstName, middle_name: form.middleName, last_name: form.lastName,
          employee_number: form.employeeNumber, position: form.position, school: form.school, 
          // ✅ I-SAVE ANG SCHOOL ADDRESS
          school_address: form.schoolAddress,
          district: form.district,
          region: form.region, department: form.department, birth_date: form.birthDate, address: form.address,
          contact: form.contact, fb_name: form.fbName, photo_url: photoUrl, status: "active",
          tin: form.tin, prc_number: form.prcNumber, philhealth_number: form.philhealthNumber, blood_type: form.bloodType,
          emergency_contact_name: form.emergencyContactName, emergency_contact_number: form.emergencyContactNumber,
          supervisor_name: form.supervisorName, supervisor_position: form.supervisorPosition,
          // ✅ BAGONG FIELDS
          role: teacherRole, // "teacher" o "adviser"
          is_adviser: teacherRole === "adviser", // true kung adviser
        });
        if (teacherError) throw new Error(`Teacher record creation failed: ${teacherError.message}`);
      }

      setMessage(`Registration successful! Your ${accountType} account has been created.`);
      setForm({ 
        firstName: "", middleName: "", lastName: "", birthDate: "", address: "", contact: "", email: "", 
        password: "", studentNumber: "", course: "", employeeNumber: "", position: "", district: "", 
        region: "", department: "", fbName: "", tin: "", prcNumber: "", philhealthNumber: "", 
        bloodType: "", emergencyContactName: "", emergencyContactNumber: "", supervisorName: "", 
        supervisorPosition: "", school: "", 
        // ✅ I-RESET DIN ANG SCHOOL ADDRESS
        schoolAddress: "",
        parentGuardian: "", adviser: "", schoolHead: "" 
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      setAgreed(false);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
        
        {/* ✅ BACK TO HOME BUTTON */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
          >
            <span>←</span> Back to Home
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-700">AF-NEXUS</h1>
          <p className="mt-2 text-gray-600">Create your digital ID account</p>
        </div>

        <div className="mb-8">
          <label className="mb-2 block font-semibold text-gray-700">Account Type</label>
          <select name="accountType" value={accountType} onChange={(e) => setAccountType(e.target.value as "student" | "teacher")} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        {/* ✅ BAGONG SECTION PARA SA TEACHER ROLE */}
        {accountType === "teacher" && (
          <div className="mb-8 rounded-xl bg-blue-50 p-5">
            <label className="mb-2 block font-semibold text-gray-700">Teacher Role</label>
            <select 
              name="teacherRole" 
              value={teacherRole} 
              onChange={(e) => setTeacherRole(e.target.value as "teacher" | "adviser")} 
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="teacher">Regular Teacher</option>
              <option value="adviser">Class Adviser</option>
            </select>
            <p className="mt-2 text-xs text-gray-500">
              💡 Piliin ang "Class Adviser" kung ikaw ay may advisory class. Ang mga adviser ay may access sa bulk upload ng students.
            </p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          {/* PERSONAL INFORMATION */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-gray-800">Personal Information</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name" required className="rounded-lg border px-4 py-3" />
              <input name="middleName" value={form.middleName} onChange={handleChange} placeholder="Middle Name" className="rounded-lg border px-4 py-3" />
              <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name" required className="rounded-lg border px-4 py-3" />
            </div>
          </section>

          {/* PHOTO UPLOAD */}
          <section className="rounded-xl bg-yellow-50 p-5">
            <h2 className="mb-4 text-xl font-bold text-yellow-800">Photo Upload (Passport Size 3:4)</h2>
            <div>
              <label className="mb-2 block text-sm font-semibold">Photo (Selfie)</label>
              <input type="file" accept="image/*" capture="user" onChange={handlePhotoChange} className="w-full rounded-lg border px-4 py-3" />
              {photoPreview && <img src={photoPreview} alt="Cropped Photo Preview" className="mt-2 h-32 w-24 rounded-lg object-cover" />}
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm font-semibold text-red-700">⚠️ Important Reminder:</p>
                <p className="mt-1 text-xs text-red-600">Para sa pormal na ID, mangyaring magsuot ng maayos na damit (Barong, Polo, o Collared Shirt). Ang mga naka-sando o walang pang-itaas ay hindi tatanggapin.</p>
              </div>
            </div>
          </section>

          {/* ✅ SCHOOL INFORMATION - PARA SA LAHAT NG ACCOUNT TYPE */}
          <section className="rounded-xl bg-orange-50 p-5">
            <h2 className="mb-4 text-xl font-bold text-orange-800">School Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input name="school" value={form.school} onChange={handleChange} placeholder="School Name" required className="rounded-lg border px-4 py-3" />
              <input name="schoolAddress" value={form.schoolAddress} onChange={handleChange} placeholder="School Address" required className="rounded-lg border px-4 py-3" />
            </div>
          </section>

          {/* STUDENT INFORMATION */}
          {accountType === "student" && (
            <section className="rounded-xl bg-blue-50 p-5">
              <h2 className="mb-4 text-xl font-bold text-blue-800">Student Information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <input name="studentNumber" value={form.studentNumber} onChange={handleChange} placeholder="LRN" required className="rounded-lg border px-4 py-3" />
                <input name="course" value={form.course} onChange={handleChange} placeholder="Grade / Strand" required className="rounded-lg border px-4 py-3" />
              </div>
            </section>
          )}

          {/* EMERGENCY CONTACT */}
          {accountType === "student" && (
            <section className="rounded-xl bg-green-50 p-5">
              <h2 className="mb-4 text-xl font-bold text-green-800">Emergency Contact</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <input name="parentGuardian" value={form.parentGuardian} onChange={handleChange} placeholder="Parent / Guardian Name" required className="rounded-lg border px-4 py-3" />
                <input name="adviser" value={form.adviser} onChange={handleChange} placeholder="Adviser Name" required className="rounded-lg border px-4 py-3" />
                <input name="schoolHead" value={form.schoolHead} onChange={handleChange} placeholder="School Head Name" required className="rounded-lg border px-4 py-3" />
              </div>
            </section>
          )}

          {/* TEACHER INFORMATION */}
          {accountType === "teacher" && (
            <section className="rounded-xl bg-green-50 p-5">
              <h2 className="mb-4 text-xl font-bold text-green-800">Teacher Information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <input name="employeeNumber" value={form.employeeNumber} onChange={handleChange} placeholder="Employee Number" required className="rounded-lg border px-4 py-3" />
                <input name="position" value={form.position} onChange={handleChange} placeholder="Position" required className="rounded-lg border px-4 py-3" />
                <input name="district" value={form.district} onChange={handleChange} placeholder="District" required className="rounded-lg border px-4 py-3" />
                <input name="region" value={form.region} onChange={handleChange} placeholder="Region" required className="rounded-lg border px-4 py-3" />
                <input name="department" value={form.department} onChange={handleChange} placeholder="Department" required className="rounded-lg border px-4 py-3" />
                <input name="fbName" value={form.fbName} onChange={handleChange} placeholder="Facebook Name" required className="rounded-lg border px-4 py-3" />
              </div>
            </section>
          )}

          {/* TEACHER ADDITIONAL INFO */}
          {accountType === "teacher" && (
            <section className="rounded-xl bg-purple-50 p-5">
              <h2 className="mb-4 text-xl font-bold text-purple-800">Teacher Additional Info</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <input name="tin" value={form.tin} onChange={handleChange} placeholder="TIN" required className="rounded-lg border px-4 py-3" />
                <input name="prcNumber" value={form.prcNumber} onChange={handleChange} placeholder="PRC Number" required className="rounded-lg border px-4 py-3" />
                <input name="philhealthNumber" value={form.philhealthNumber} onChange={handleChange} placeholder="PhilHealth Number" required className="rounded-lg border px-4 py-3" />
                <input name="bloodType" value={form.bloodType} onChange={handleChange} placeholder="Blood Type" required className="rounded-lg border px-4 py-3" />
                <input name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} placeholder="Emergency Contact Name" required className="rounded-lg border px-4 py-3" />
                <input name="emergencyContactNumber" value={form.emergencyContactNumber} onChange={handleChange} placeholder="Emergency Contact Number" required className="rounded-lg border px-4 py-3" />
                <input name="supervisorName" value={form.supervisorName} onChange={handleChange} placeholder="Supervisor Name" required className="rounded-lg border px-4 py-3" />
                <input name="supervisorPosition" value={form.supervisorPosition} onChange={handleChange} placeholder="Supervisor Position" required className="rounded-lg border px-4 py-3" />
              </div>
            </section>
          )}

          {/* OTHER INFORMATION */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-gray-800">Other Information</h2>
            <div className="space-y-4">
              <DatePicker selected={form.birthDate ? new Date(form.birthDate) : null} onChange={handleDateChange} placeholderText="Birth Date" className="w-full rounded-lg border px-4 py-3" dateFormat="MM/dd/yyyy" required />
              <input name="address" value={form.address} onChange={handleChange} placeholder="Address" required className="w-full rounded-lg border px-4 py-3" />
              <input name="contact" value={form.contact} onChange={handleChange} placeholder="Contact Number" required className="w-full rounded-lg border px-4 py-3" />
            </div>
          </section>

          {/* LOGIN INFORMATION */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-gray-800">Login Information</h2>
            <div className="space-y-4">
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email Address" required className="w-full rounded-lg border px-4 py-3" />
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Password" required minLength={6} className="w-full rounded-lg border px-4 py-3" />
            </div>
          </section>

          {/* CONSENT CHECKBOX */}
          <div className="flex items-start gap-3">
            <input type="checkbox" id="agreed" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4" />
            <label htmlFor="agreed" className="text-sm text-gray-600">
              I have read and agree to the{" "}
              <Link href="/terms" className="font-semibold text-blue-600 hover:underline">Terms &amp; Conditions</Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="font-semibold text-blue-600 hover:underline">Privacy Policy</Link>.
            </label>
          </div>

          {/* VALIDATION ERROR */}
          {validationError && (
            <div className="rounded-lg bg-red-100 p-4 text-sm text-red-700">
              ⚠️ {validationError}
            </div>
          )}

          {/* ERROR */}
          {error && <div className="rounded-lg bg-red-100 p-4 text-sm text-red-700">{error}</div>}
          {/* SUCCESS */}
          {message && <div className="rounded-lg bg-green-100 p-4 text-sm text-green-700">{message}</div>}

          {/* REGISTER BUTTON */}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Creating Account..." : `Create ${accountType === "student" ? "Student" : "Teacher"} Account`}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">Login here</Link>
        </div>
      </div>

      {/* CROP MODAL */}
      {isCropOpen && originalImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative w-full max-w-lg rounded-lg bg-white p-4">
            <h3 className="mb-4 text-lg font-bold">Crop Your Photo</h3>
            <div className="relative h-96 w-full bg-gray-200">
              <Cropper
                image={originalImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={3 / 4}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setIsCropOpen(false)} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button>
              <button onClick={handleCropSave} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Crop & Save</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}