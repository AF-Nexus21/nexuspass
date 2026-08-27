"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Teacher = {
  profile_id?: string; 
  first_name?: string | null; 
  middle_name?: string | null;
  last_name?: string | null;
  employee_number?: string | null;
  position?: string | null;
  school?: string | null;
  school_address?: string | null;
  photo_url?: string | null;
  district?: string | null;
  birth_date?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_number?: string | null;
  supervisor_name?: string | null;
  supervisor_position?: string | null;
  prc_number?: string | null;
  philhealth_number?: string | null;
  tin?: string | null;
  blood_type?: string | null;
  contact?: string | null;
  fb_name?: string | null;
  payment_status?: string | null;
  role?: string | null;
  is_adviser?: boolean;
};

const CANVAS_WIDTH = 1275;
const CANVAS_HEIGHT = 1800;

export default function TeacherPage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [isAdviser, setIsAdviser] = useState(false);

  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const feedbackRef = useRef<HTMLDivElement | null>(null);

  const frontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    async function loadTeacher() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error("No logged-in user.");
          setLoading(false);
          return;
        }

        const { data: teacher, error: teacherError } = await supabase
          .from("teachers")
          .select("*")
          .eq("profile_id", user.id)
          .maybeSingle();

        if (teacherError) {
          console.error("Teacher record error:", teacherError);
          setLoading(false);
          return;
        }

        if (!teacher) {
          console.error("Teacher record not found.");
          setLoading(false);
          return;
        }

        console.log("Fetched teacher data:", teacher);

        const currentRole = (teacher.role || "").toUpperCase();
        const positionRole = (teacher.position || "").toUpperCase();
        
        setIsAdviser(
          teacher.is_adviser === true || 
          currentRole === "ADVISER" ||
          currentRole.includes("ADVISER") ||
          positionRole.includes("ADVISER") ||
          positionRole.includes("CLASS ADVISER") ||
          positionRole.includes("HOMEROOM ADVISER")
        );

        console.log("Is Adviser:", isAdviser);

        const { data: paymentData } = await supabase
          .from("payments")
          .select("status")
          .eq("profile_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setTeacher({
          ...teacher,
          payment_status: paymentData?.status || "unpaid",
        });
      } catch (error) {
        console.error("Loading teacher failed:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTeacher();
  }, []);

  useEffect(() => {
    if (!teacher) return;
    document.fonts.ready.then(() => {
      drawFront();
      drawBack();
    });
  }, [teacher]);

  function clean(value: string | null | undefined, fallback = "") {
    return value?.trim() || fallback;
  }

  function getBirthDate() {
    if (!teacher?.birth_date) return "";
    const parts = teacher.birth_date.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${month}/${day}/${year}`;
    }
    return teacher.birth_date;
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
      image.src = src;
    });
  }

  function drawImageCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
    ctx.save();
    ctx.filter = "brightness(1.2) contrast(1.2) saturate(1.4)";
    const imageRatio = image.width / image.height;
    const boxRatio = width / height;
    let sourceWidth = image.width, sourceHeight = image.height, sourceX = 0, sourceY = 0;
    if (imageRatio > boxRatio) {
      sourceWidth = image.height * boxRatio;
      sourceX = (image.width - sourceWidth) / 2;
    } else {
      sourceHeight = image.width / boxRatio;
      sourceY = (image.height - sourceHeight) / 2;
    }
    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
    ctx.restore();
  }

  function drawText(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, options?: any) {
    const fontSize = options?.fontSize ?? 40;
    const weight = options?.weight ?? 600;
    const color = options?.color ?? "#000000";
    const align = options?.align ?? "left";
    const fontFamily = "Arial, Helvetica, sans-serif";

    ctx.save();
    ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "top";
    ctx.imageSmoothingEnabled = true;

    if (options?.shadowColor) {
      ctx.shadowColor = options.shadowColor;
      ctx.shadowBlur = options.shadowBlur ?? 4;
      ctx.shadowOffsetX = options.shadowOffsetX ?? 2;
      ctx.shadowOffsetY = options.shadowOffsetY ?? 2;
    }

    if (options?.maxWidth) {
      ctx.fillText(value, x, y, options.maxWidth);
    } else {
      ctx.fillText(value, x, y);
    }
    ctx.restore();
  }

  function centerText(ctx: CanvasRenderingContext2D, value: string, centerX: number, y: number, options?: any) {
    drawText(ctx, value, centerX, y, { ...options, align: "center" });
  }

  async function drawFront() {
    if (!teacher || !frontCanvasRef.current) return;
    const canvas = frontCanvasRef.current;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    try {
      const template = await loadImage("/teacher-id-front.png");
      ctx.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } catch (error) {
      console.error("Front template error:", error);
    }

    const lastName = clean(teacher.last_name).toUpperCase();
    const firstName = clean(teacher.first_name).toUpperCase();
    const middleName = clean(teacher.middle_name).toUpperCase();
    const school = clean(teacher.school, "SAN PABLO NATIONAL HIGH SCHOOL").toUpperCase();
    const employeeNumber = clean(teacher.employee_number);
    const position = clean(teacher.position, "Teacher II");

    drawText(ctx, `${lastName},`, 76, 620, { fontSize: 110, weight: 900, color: "#ffffff", maxWidth: 850, shadowColor: "rgba(0, 0, 0, 0.8)", shadowBlur: 8, shadowOffsetX: 4, shadowOffsetY: 4 });
    drawText(ctx, firstName, 76, 740, { fontSize: 72, weight: 900, color: "#ffffff", maxWidth: 850, shadowColor: "rgba(0, 0, 0, 0.8)", shadowBlur: 8, shadowOffsetX: 4, shadowOffsetY: 4 });
    
    if (middleName) {
      drawText(ctx, middleName, 76, 840, { fontSize: 65, weight: 900, color: "#ffffff", maxWidth: 850, shadowColor: "rgba(0, 0, 0, 0.8)", shadowBlur: 8, shadowOffsetX: 4, shadowOffsetY: 4 });
    }

    drawText(ctx, school, 74, 950, { fontSize: 45, weight: 750, color: "#ffffff", maxWidth: 850, shadowColor: "rgba(0, 0, 0, 0.8)", shadowBlur: 6, shadowOffsetX: 3, shadowOffsetY: 3 });

    drawText(ctx, `EMPLOYEE NO. ${employeeNumber}`, 76, 1145, { fontSize: 46, weight: 700, color: "#ffffff", maxWidth: 850, shadowColor: "rgba(0, 0, 0, 0.8)", shadowBlur: 6, shadowOffsetX: 3, shadowOffsetY: 3 });

    ctx.save();
    ctx.translate(1200, 560);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let fontSize = 90;
    ctx.font = `900 ${fontSize}px Arial, Helvetica, sans-serif`;
    const textWidth = ctx.measureText(position).width;
    const maxHeight = 900;
    if (textWidth > maxHeight) {
      fontSize = Math.max(40, fontSize * (maxHeight / textWidth));
      ctx.font = `900 ${fontSize}px Arial, Helvetica, sans-serif`;
    }
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.fillText(position, 0, 0);
    ctx.restore();

    drawText(ctx, "REGION V", 76, 1260, { fontSize: 57, weight: 700, color: "#111111" });
    drawText(ctx, "Division of Masbate", 76, 1330, { fontSize: 50, weight: 600, color: "#111111" });

    if (teacher.photo_url) {
      try {
        const photo = await loadImage(teacher.photo_url);
        drawImageCover(ctx, photo, 700, 1120, 480, 590);
        ctx.save();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.strokeRect(700, 1120, 480, 590);
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 8;
        ctx.strokeRect(692, 1112, 496, 606);
        ctx.restore();
      } catch (error) {
        console.error("Photo error:", error);
        ctx.fillStyle = "#eeeeee";
        ctx.fillRect(700, 1120, 480, 590);
        centerText(ctx, "TEACHER PHOTO", 940, 1390, { fontSize: 35, weight: 700, color: "#999999" });
      }
    } else {
      ctx.fillStyle = "#eeeeee";
      ctx.fillRect(700, 1120, 480, 590);
      centerText(ctx, "TEACHER PHOTO", 940, 1390, { fontSize: 35, weight: 700, color: "#999999" });
    }
  }

  async function drawBack() {
    if (!teacher || !backCanvasRef.current) return;
    const canvas = backCanvasRef.current;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    try {
      const template = await loadImage("/teacher-id-back.png");
      ctx.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } catch (error) {
      console.error("Back template error:", error);
    }

    const school = clean(teacher.school, "SAN PABLO NATIONAL HIGH SCHOOL").toUpperCase();
    const schoolAddress = clean(teacher.school_address, "N/A");
    const district = clean(teacher.district, "MANDAON SOUTH");
    const address = clean(teacher.address, "N/A");
    const supervisorName = clean(teacher.supervisor_name, "JUAN DELA CRUZ").toUpperCase();
    const supervisorPosition = clean(teacher.supervisor_position, "SCHOOL PRINCIPAL").toUpperCase();
    const emergencyName = clean(teacher.emergency_contact_name, "JUAN DELA CRUZ").toUpperCase();
    const emergencyNumber = clean(teacher.emergency_contact_number, "0912 345 6789");
    const prcNumber = clean(teacher.prc_number, "1234567");
    const philhealthNumber = clean(teacher.philhealth_number, "12-345678901-2");
    const tinNumber = clean(teacher.tin, "123-456-789");
    const bloodType = clean(teacher.blood_type, "O+");
    
    const firstName = clean(teacher.first_name).toUpperCase();
    const lastName = clean(teacher.last_name).toUpperCase();
    const middleName = clean(teacher.middle_name).replace(/\./g, "").trim();
    const middleInitial = middleName ? `${middleName.charAt(0).toUpperCase()}.` : "";
    const fullName = [firstName, middleInitial, lastName].filter(Boolean).join(" ").toUpperCase();

    const { data: { user } } = await supabase.auth.getUser();
    const email = clean(user?.email, "argie.fenis001@deped.gov.ph");

    const contact = clean(teacher.contact, "09605524683");
    const fbName = clean(teacher.fb_name, "RG Fenis");

    centerText(ctx, "DEPARTMENT OF EDUCATION", CANVAS_WIDTH / 2, 75, { fontSize: 34, weight: 700 });
    centerText(ctx, "REGION V", CANVAS_WIDTH / 2, 118, { fontSize: 34, weight: 700 });
    centerText(ctx, "DIVISION OF MASBATE", CANVAS_WIDTH / 2, 161, { fontSize: 34, weight: 700 });
    centerText(ctx, school, CANVAS_WIDTH / 2, 204, { fontSize: 32, weight: 700 });
    centerText(ctx, schoolAddress, CANVAS_WIDTH / 2, 245, { fontSize: 28, weight: 600 });
    centerText(ctx, email, CANVAS_WIDTH / 2, 285, { fontSize: 27, weight: 500 });
    centerText(ctx, `FB Name: ${fbName}`, CANVAS_WIDTH / 2, 320, { fontSize: 27, weight: 500 });
    centerText(ctx, contact, CANVAS_WIDTH / 2, 355, { fontSize: 27, weight: 500 });
    centerText(ctx, supervisorName, CANVAS_WIDTH / 2, 475, { fontSize: 45, weight: 700 });
    centerText(ctx, supervisorPosition, CANVAS_WIDTH / 2, 525, { fontSize: 34, weight: 600 });

    const emergencyBoxX = 150;
    const emergencyBoxY = 580;
    const emergencyBoxWidth = 975;
    const emergencyBoxHeight = 210;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.strokeRect(emergencyBoxX, emergencyBoxY, emergencyBoxWidth, emergencyBoxHeight);

    centerText(ctx, "In case of emergency, please contact:", CANVAS_WIDTH / 2, 620, { fontSize: 38, weight: 700 });
    centerText(ctx, emergencyName, CANVAS_WIDTH / 2, 680, { fontSize: 38, weight: 700 });
    centerText(ctx, `CP No.: ${emergencyNumber}`, CANVAS_WIDTH / 2, 730, { fontSize: 36, weight: 600 });

    const infoBoxX = 150;
    const infoBoxY = 880;
    const infoBoxWidth = 975;
    const infoBoxHeight = 620;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.strokeRect(infoBoxX, infoBoxY, infoBoxWidth, infoBoxHeight);

    centerText(ctx, "Other Information", CANVAS_WIDTH / 2, 920, { fontSize: 38, weight: 700 });

    drawText(ctx, `HOME ADDRESS: ${address}`, 200, 1000, { fontSize: 32, weight: 700, maxWidth: 900 });
    drawText(ctx, `BIRTHDAY: ${getBirthDate()}`, 200, 1070, { fontSize: 32, weight: 700 });
    drawText(ctx, `DISTRICT: ${district}`, 200, 1140, { fontSize: 32, weight: 700 });
    drawText(ctx, `PRC NO.: ${prcNumber}`, 200, 1210, { fontSize: 32, weight: 700 });
    drawText(ctx, `PHILHEALTH NO.: ${philhealthNumber}`, 200, 1280, { fontSize: 32, weight: 700 });
    drawText(ctx, `TIN: ${tinNumber}`, 200, 1350, { fontSize: 32, weight: 700 });
    drawText(ctx, `BLOOD TYPE: ${bloodType}`, 200, 1420, { fontSize: 32, weight: 700 });
    centerText(ctx, fullName, CANVAS_WIDTH / 2, 1600, { fontSize: 38, weight: 700 });
    centerText(ctx, "Name and Signature of Employee", CANVAS_WIDTH / 2, 1655, { fontSize: 30, weight: 600 });
  }

  async function markAsDownloaded() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: paymentData } = await supabase
      .from("payments")
      .select("id, download_count, status")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paymentData) {
      await supabase
        .from("payments")
        .update({ 
          download_count: (paymentData.download_count || 0) + 1, 
          status: "unpaid" 
        })
        .eq("id", paymentData.id);

      setTeacher({ ...teacher, payment_status: "unpaid" });
      alert("ID downloaded successfully! You must pay again for the next download.");
    }
  }

  async function submitFeedback() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (!feedbackComment.trim()) {
      alert("Please write a comment.");
      return;
    }
    
    setIsSubmittingFeedback(true);
    
    const { error } = await supabase.from("feedback").insert({
      profile_id: user.id,
      user_name: `${teacher?.first_name} ${teacher?.last_name}`,
      comment: feedbackComment,
      rating: feedbackRating || null,
      status: "new"
    });

    setIsSubmittingFeedback(false);

    if (error) {
      console.error("Feedback error:", error);
      alert("Failed to send feedback. Please try again.");
    } else {
      alert("Thank you for your feedback!");
      setFeedbackComment("");
      setFeedbackRating(0);
    }
  }

  function downloadCanvasAsImage(canvas: HTMLCanvasElement, filename: string, type: "image/png" | "image/jpeg" = "image/png") {
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL(type, 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function downloadFront() {
    if (!frontCanvasRef.current || !teacher || exporting) return;
    if (teacher.payment_status !== "paid") {
      alert("Please complete your payment first to download your ID.");
      return;
    }
    setExporting(true);
    try {
      await drawFront();
      await new Promise((resolve) => setTimeout(resolve, 100));
      downloadCanvasAsImage(frontCanvasRef.current, `NEXUSPASS-${teacher.last_name}-ePIC-FRONT.png`, "image/png");
      await markAsDownloaded();
      
      setTimeout(() => {
        const facebookPostUrl = "https://www.facebook.com/permalink.php?story_fbid=pfbid02CbuLVobVDeXggw5S6AjCdVMY6QikXbx6RTPRxzFwUBg5FmgeGVrXE8QHFCojjr4yl&id=61568906948339";
        window.location.href = facebookPostUrl;
      }, 2000);
      
    } catch (error) {
      console.error("Download front error:", error);
      alert("Unable to download front image.");
    } finally {
      setExporting(false);
    }
  }

  async function downloadBack() {
    if (!backCanvasRef.current || !teacher || exporting) return;
    if (teacher.payment_status !== "paid") {
      alert("Please complete your payment first to download your ID.");
      return;
    }
    setExporting(true);
    try {
      await drawBack();
      await new Promise((resolve) => setTimeout(resolve, 100));
      downloadCanvasAsImage(backCanvasRef.current, `NEXUSPASS-${teacher.last_name}-ePIC-BACK.png`, "image/png");
      await markAsDownloaded();

      setTimeout(() => {
        const facebookPostUrl = "https://www.facebook.com/permalink.php?story_fbid=pfbid02CbuLVobVDeXggw5S6AjCdVMY6QikXbx6RTPRxzFwUBg5FmgeGVrXE8QHFCojjr4yl&id=61568906948339";
        window.location.href = facebookPostUrl;
      }, 2000);

    } catch (error) {
      console.error("Download back error:", error);
      alert("Unable to download back image.");
    } finally {
      setExporting(false);
    }
  }

  async function downloadBoth() {
    if (!frontCanvasRef.current || !backCanvasRef.current || !teacher || exporting) return;
    if (teacher.payment_status !== "paid") {
      alert("Please complete your payment first to download your ID.");
      return;
    }
    setExporting(true);
    try {
      await drawFront();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await drawBack();
      await new Promise((resolve) => setTimeout(resolve, 100));
      downloadCanvasAsImage(frontCanvasRef.current, `NEXUSPASS-${teacher.last_name}-ePIC-FRONT.png`, "image/png");
      await new Promise((resolve) => setTimeout(resolve, 300));
      downloadCanvasAsImage(backCanvasRef.current, `NEXUSPASS-${teacher.last_name}-ePIC-BACK.png`, "image/png");
      await markAsDownloaded();

      setTimeout(() => {
        const facebookPostUrl = "https://www.facebook.com/permalink.php?story_fbid=pfbid02CbuLVobVDeXggw5S6AjCdVMY6QikXbx6RTPRxzFwUBg5FmgeGVrXE8QHFCojjr4yl&id=61568906948339";
        window.location.href = facebookPostUrl;
      }, 2000);

    } catch (error) {
      console.error("Download both error:", error);
      alert("Unable to download images.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-200">
        <div className="rounded-xl bg-white px-8 py-6 shadow-lg">
          <p className="font-semibold text-gray-700">Loading Teacher e-PIC...</p>
        </div>
      </main>
    );
  }

  if (!teacher) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-200 px-4">
        <div className="rounded-xl bg-white p-8 text-center shadow-lg">
          <h2 className="text-xl font-bold text-red-600">Teacher record not found</h2>
          <p className="mt-3 text-sm text-gray-600">
            Please make sure the teacher profile is properly connected.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-200 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
          >
            <span>←</span> Back to Login
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {/* ✅ BULK UPLOAD BUTTON - ADVISER LANG ANG MAKAKAKITA */}
            {isAdviser && (
              <Link
                href="/teacher/bulk-upload"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
              >
                📥 Bulk Upload Students
              </Link>
            )}

            {/* ✅ BULK DOWNLOAD BUTTON - ADVISER LANG ANG MAKAKAKITA */}
            {isAdviser && (
              <Link
                href="/teacher/bulk-download"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-green-700"
              >
                📥 Bulk Download IDs
              </Link>
            )}

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            NEXUSPASS Teacher School Identification Card
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            e-PIC Preview — Fixed {CANVAS_WIDTH} × {CANVAS_HEIGHT} px
          </p>
          <p className="mt-2 text-xs font-bold text-green-600 bg-green-100 inline-block px-3 py-1 rounded-full">
            BETA VERSION - Live Update
          </p>
        </div>

        {teacher.payment_status === "unpaid" && (
          <div className="mb-8 rounded-xl bg-yellow-50 p-6 text-center shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-800">
              Payment Required
            </h2>
            <p className="mt-2 text-sm text-yellow-700">
              Please complete your payment to unlock the full preview and download.
            </p>
            <button
              type="button"
              onClick={() => window.location.href = "/payment"}
              className="mt-4 rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-green-700"
            >
              Pay Now
            </button>
          </div>
        )}

        {teacher.payment_status === "pending" && (
          <div className="mb-8 rounded-xl bg-blue-50 p-6 text-center shadow-lg">
            <h2 className="text-2xl font-bold text-blue-800">
              Payment Under Review
            </h2>
            <p className="mt-2 text-sm text-blue-700">
              Your payment has been submitted. Please wait for the admin's approval to unlock your ID.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-start justify-center gap-8">
          <div>
            <h2 className="mb-3 text-center text-lg font-bold text-gray-700">FRONT</h2>
            <div
              className="overflow-hidden rounded-xl bg-white shadow-xl"
              style={{
                width: "425px",
                height: "600px",
                position: "relative",
              }}
            >
              <canvas
                ref={frontCanvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{
                  width: "425px",
                  height: "600px",
                  display: "block",
                }}
              />
              {teacher.payment_status !== "paid" && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md"
                  style={{ pointerEvents: "none" }}
                >
                  <div className="text-center">
                    <p className="text-4xl">🔒</p>
                    <p className="mt-2 text-lg font-bold text-white">
                      Locked Preview
                    </p>
                    <p className="mt-1 text-sm text-gray-300">
                      Complete your payment to unlock
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-center text-lg font-bold text-gray-700">BACK</h2>
            <div
              className="overflow-hidden rounded-xl bg-white shadow-xl"
              style={{
                width: "425px",
                height: "600px",
                position: "relative",
              }}
            >
              <canvas
                ref={backCanvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{
                  width: "425px",
                  height: "600px",
                  display: "block",
                }}
              />
              {teacher.payment_status !== "paid" && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md"
                  style={{ pointerEvents: "none" }}
                >
                  <div className="text-center">
                    <p className="text-4xl">🔒</p>
                    <p className="mt-2 text-lg font-bold text-white">
                      Locked Preview
                    </p>
                    <p className="mt-1 text-sm text-gray-300">
                      Complete your payment to unlock
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {teacher.payment_status === "paid" ? (
            <>
              <button
                type="button"
                onClick={downloadFront}
                disabled={exporting}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting ? "Downloading..." : "Download Front PNG"}
              </button>

              <button
                type="button"
                onClick={downloadBack}
                disabled={exporting}
                className="rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting ? "Downloading..." : "Download Back PNG"}
              </button>

              <button
                type="button"
                onClick={downloadBoth}
                disabled={exporting}
                className="rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting ? "Downloading..." : "Download Both PNG"}
              </button>
            </>
          ) : (
            <div className="rounded-lg bg-red-50 p-4 text-center text-sm font-semibold text-red-600">
              <p>Payment required to download.</p>
              <p className="mt-1 text-xs text-red-500">Please complete your payment first.</p>
            </div>
          )}
        </div>

        <div ref={feedbackRef} className="mt-10 scroll-mt-20 rounded-xl bg-white p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800">Leave a Feedback</h2>
          <p className="mt-2 text-sm text-gray-500">How satisfied are you with your ID output and our service?</p>
          
          <div className="mt-4 flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFeedbackRating(star)}
                className={`text-3xl ${star <= feedbackRating ? "text-yellow-400" : "text-gray-300"}`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            placeholder="Share your experience or suggestions..."
            className="mt-4 w-full rounded-lg border border-gray-300 p-4 outline-none focus:border-blue-500"
            rows={3}
          />

          <button
            type="button"
            onClick={submitFeedback}
            disabled={isSubmittingFeedback}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmittingFeedback ? "Sending..." : "Send Feedback"}
          </button>
        </div>

        <div className="mt-7 text-center text-sm text-gray-500">
          <p>Direktang ina-export ang Canvas — Perfect Quality (1275 × 1800 px)</p>
        </div>
      </div>
    </main>
  );
}