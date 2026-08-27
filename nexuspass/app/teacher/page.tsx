"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Teacher = {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  employee_number: string | null;
  position: string | null;
  school: string | null;
  photo_url: string | null;
  district: string | null;
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
  contact: string | null;
  fb_name: string | null;
  payment_status: string | null;
};

const CANVAS_WIDTH = 1275;
const CANVAS_HEIGHT = 1800;

export default function TeacherPage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const frontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ============================================================
  // LOAD TEACHER
  // ============================================================

  useEffect(() => {
    async function loadTeacher() {
      try {
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
          .select(`
            first_name,
            middle_name,
            last_name,
            employee_number,
            position,
            school,
            photo_url,
            district,
            birth_date,
            address,
            emergency_contact_name,
            emergency_contact_number,
            supervisor_name,
            supervisor_position,
            prc_number,
            philhealth_number,
            tin,
            blood_type,
            contact,
            fb_name,
            payment_status
          `)
          .eq("profile_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Teacher record error:", error);
          setLoading(false);
          return;
        }

        setTeacher(data);
      } catch (error) {
        console.error("Loading teacher failed:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTeacher();
  }, []);

  // ============================================================
  // DRAW WHEN TEACHER IS READY
  // ============================================================

  useEffect(() => {
    if (!teacher) return;
    document.fonts.ready.then(() => {
      drawFront();
      drawBack();
    });
  }, [teacher]);

  // ============================================================
  // HELPERS
  // ============================================================

  function clean(value: string | null | undefined, fallback = "") {
    return value?.trim() || fallback;
  }

  function getMiddleInitial() {
    if (!teacher?.middle_name) return "";
    const cleaned = teacher.middle_name.replace(/\./g, "").trim();
    if (!cleaned) return "";
    return `${cleaned.charAt(0).toUpperCase()}.`;
  }

  function getFullName() {
    if (!teacher) return "";
    const middle = getMiddleInitial();
    return [teacher.first_name, middle, teacher.last_name]
      .filter(Boolean)
      .join(" ")
      .toUpperCase();
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

  function drawImageCover(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const imageRatio = image.width / image.height;
    const boxRatio = width / height;
    let sourceWidth = image.width,
      sourceHeight = image.height,
      sourceX = 0,
      sourceY = 0;
    if (imageRatio > boxRatio) {
      sourceWidth = image.height * boxRatio;
      sourceX = (image.width - sourceWidth) / 2;
    } else {
      sourceHeight = image.width / boxRatio;
      sourceY = (image.height - sourceHeight) / 2;
    }
    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  }

  function drawText(
    ctx: CanvasRenderingContext2D,
    value: string,
    x: number,
    y: number,
    options?: {
      fontSize?: number;
      weight?: number | string;
      color?: string;
      align?: CanvasTextAlign;
      maxWidth?: number;
      shadowColor?: string;
      shadowBlur?: number;
      shadowOffsetX?: number;
      shadowOffsetY?: number;
    }
  ) {
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

  function centerText(
    ctx: CanvasRenderingContext2D,
    value: string,
    centerX: number,
    y: number,
    options?: {
      fontSize?: number;
      weight?: number | string;
      color?: string;
    }
  ) {
    drawText(ctx, value, centerX, y, { ...options, align: "center" });
  }

  // ============================================================
  // DRAW FRONT (MAY DOUBLE BORDER SA PHOTO)
  // ============================================================

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
    const firstName = `${clean(teacher.first_name)} ${getMiddleInitial()}`.trim().toUpperCase();
    const school = clean(teacher.school, "SAN PABLO NATIONAL HIGH SCHOOL").toUpperCase();
    const employeeNumber = clean(teacher.employee_number);
    const position = clean(teacher.position, "Teacher II");

    // ✅ MAY SHADOW NA ANG PANGALAN
    drawText(ctx, `${lastName},`, 76, 648, { fontSize: 114, weight: 900, color: "#ffffff", maxWidth: 850, shadowColor: "rgba(0, 0, 0, 0.8)", shadowBlur: 8, shadowOffsetX: 4, shadowOffsetY: 4 });
    drawText(ctx, firstName, 76, 765, { fontSize: 72, weight: 900, color: "#ffffff", maxWidth: 850, shadowColor: "rgba(0, 0, 0, 0.8)", shadowBlur: 8, shadowOffsetX: 4, shadowOffsetY: 4 });

    // ✅ MAY SHADOW DIN ANG SCHOOL
    drawText(ctx, school, 74, 895, { fontSize: 45, weight: 750, color: "#ffffff", maxWidth: 850, shadowColor: "rgba(0, 0, 0, 0.8)", shadowBlur: 6, shadowOffsetX: 3, shadowOffsetY: 3 });

    // ✅ MAY SHADOW DIN ANG EMPLOYEE NO.
    drawText(ctx, `EMPLOYEE NO. ${employeeNumber}`, 76, 1145, { fontSize: 46, weight: 700, color: "#ffffff", maxWidth: 850, shadowColor: "rgba(0, 0, 0, 0.8)", shadowBlur: 6, shadowOffsetX: 3, shadowOffsetY: 3 });

    // ✅ MAY SHADOW DIN ANG VERTICAL "Teacher II"
    ctx.save();
    ctx.translate(1180, 800); // Ilipat sa kanan at MABABA (dahil paitaas na ang text)
    ctx.rotate(-Math.PI / 2); // -90 degrees (pataas ang text)
    ctx.textAlign = "left"; 
    ctx.textBaseline = "alphabetic"; 
    ctx.font = `900 95px Arial, Helvetica, sans-serif`;
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
        
        // ✅ DOUBLE BORDER SA PHOTO (White inner + Black outer)
        ctx.save();
        ctx.strokeStyle = "#ffffff"; // White inner border
        ctx.lineWidth = 4;
        ctx.strokeRect(700, 1120, 480, 590);
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = "#000000"; // Black outer border
        ctx.lineWidth = 8;
        ctx.strokeRect(692, 1112, 496, 606); // Mas malaki ng kaunti
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

  // ============================================================
  // DRAW BACK (KUHA ANG EMAIL, CONTACT, FB NAME)
  // ============================================================

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

    // ✅ KUNIN ANG EMAIL MULA SA AUTH USER
    const { data: { user } } = await supabase.auth.getUser();
    const email = clean(user?.email, "argie.fenis001@deped.gov.ph");

    const school = clean(teacher.school, "SAN PABLO NATIONAL HIGH SCHOOL").toUpperCase();
    const district = clean(teacher.district, "MANDAON SOUTH");
    const address = clean(teacher.address, "San Pablo, Mandaon, Masbate");
    const supervisorName = clean(teacher.supervisor_name, "JUAN DELA CRUZ").toUpperCase();
    const supervisorPosition = clean(teacher.supervisor_position, "SCHOOL PRINCIPAL").toUpperCase();
    const emergencyName = clean(teacher.emergency_contact_name, "JUAN DELA CRUZ").toUpperCase();
    const emergencyNumber = clean(teacher.emergency_contact_number, "0912 345 6789");
    const prcNumber = clean(teacher.prc_number, "1234567");
    const philhealthNumber = clean(teacher.philhealth_number, "12-345678901-2");
    const tinNumber = clean(teacher.tin, "123-456-789");
    const bloodType = clean(teacher.blood_type, "O+");
    const fullName = getFullName();

    // ✅ KUNIN ANG CONTACT AT FB NAME MULA SA TEACHER RECORD
    const contact = clean(teacher.contact, "09605524683");
    const fbName = clean(teacher.fb_name, "RG Fenis");

    centerText(ctx, "DEPARTMENT OF EDUCATION", CANVAS_WIDTH / 2, 75, { fontSize: 34, weight: 700 });
    centerText(ctx, "REGION V", CANVAS_WIDTH / 2, 118, { fontSize: 34, weight: 700 });
    centerText(ctx, "DIVISION OF MASBATE", CANVAS_WIDTH / 2, 161, { fontSize: 34, weight: 700 });
    centerText(ctx, school, CANVAS_WIDTH / 2, 204, { fontSize: 32, weight: 700 });
    centerText(ctx, "San Pablo, Mandaon, Masbate", CANVAS_WIDTH / 2, 245, { fontSize: 28, weight: 600 });
    centerText(ctx, email, CANVAS_WIDTH / 2, 285, { fontSize: 27, weight: 500 });
    centerText(ctx, `FB Name: ${fbName}`, CANVAS_WIDTH / 2, 320, { fontSize: 27, weight: 500 });
    centerText(ctx, contact, CANVAS_WIDTH / 2, 355, { fontSize: 27, weight: 500 });
    centerText(ctx, supervisorName, CANVAS_WIDTH / 2, 475, { fontSize: 45, weight: 700 });
    centerText(ctx, supervisorPosition, CANVAS_WIDTH / 2, 525, { fontSize: 34, weight: 600 });

    // ✅ GUMAWA NG BOX PARA SA "IN CASE OF EMERGENCY"
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

    // ✅ GUMAWA NG BOX PARA SA "OTHER INFORMATION"
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

  // ============================================================
  // ⭐ DIRECT CANVAS DOWNLOAD
  // ============================================================

  function downloadCanvasAsImage(
    canvas: HTMLCanvasElement,
    filename: string,
    type: "image/png" | "image/jpeg" = "image/png"
  ) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL(type, 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ============================================================
  // DOWNLOAD HANDLERS (MAY PAYMENT GATE)
  // ============================================================

  async function downloadFront() {
    if (!frontCanvasRef.current || !teacher || exporting) return;
    
    // ✅ GATE: Kapag hindi bayad, huwag mag-download
    if (teacher.payment_status !== "paid") {
      alert("Please complete your payment first to download your ID.");
      return;
    }
    
    setExporting(true);
    try {
      await drawFront();
      await new Promise((resolve) => setTimeout(resolve, 100));
      downloadCanvasAsImage(
        frontCanvasRef.current,
        `NEXUSPASS-${teacher.last_name}-ePIC-FRONT.png`,
        "image/png"
      );
    } catch (error) {
      console.error("Download front error:", error);
      alert("Unable to download front image.");
    } finally {
      setExporting(false);
    }
  }

  async function downloadBack() {
    if (!backCanvasRef.current || !teacher || exporting) return;
    
    // ✅ GATE: Kapag hindi bayad, huwag mag-download
    if (teacher.payment_status !== "paid") {
      alert("Please complete your payment first to download your ID.");
      return;
    }
    
    setExporting(true);
    try {
      await drawBack();
      await new Promise((resolve) => setTimeout(resolve, 100));
      downloadCanvasAsImage(
        backCanvasRef.current,
        `NEXUSPASS-${teacher.last_name}-ePIC-BACK.png`,
        "image/png"
      );
    } catch (error) {
      console.error("Download back error:", error);
      alert("Unable to download back image.");
    } finally {
      setExporting(false);
    }
  }

  async function downloadBoth() {
    if (!frontCanvasRef.current || !backCanvasRef.current || !teacher || exporting) return;
    
    // ✅ GATE: Kapag hindi bayad, huwag mag-download
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

      downloadCanvasAsImage(
        frontCanvasRef.current,
        `NEXUSPASS-${teacher.last_name}-ePIC-FRONT.png`,
        "image/png"
      );
      await new Promise((resolve) => setTimeout(resolve, 300));
      downloadCanvasAsImage(
        backCanvasRef.current,
        `NEXUSPASS-${teacher.last_name}-ePIC-BACK.png`,
        "image/png"
      );
    } catch (error) {
      console.error("Download both error:", error);
      alert("Unable to download images.");
    } finally {
      setExporting(false);
    }
  }

  // ============================================================
  // LOADING & NO TEACHER
  // ============================================================

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

  // ============================================================
  // PREVIEW
  // ============================================================

  return (
    <main className="min-h-screen bg-gray-200 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            NEXUSPASS Teacher Electronic Professional Identification Card
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            e-PIC Preview — Fixed {CANVAS_WIDTH} × {CANVAS_HEIGHT} px
          </p>
        </div>

        {/* PAYMENT STATUS */}
        {teacher.payment_status !== "paid" && (
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

        <div className="flex flex-wrap items-start justify-center gap-8">
          {/* FRONT */}
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
              {/* ✅ OVERLAY: Kapag hindi bayad, blurred o may lock */}
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

          {/* BACK */}
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
              {/* ✅ OVERLAY: Kapag hindi bayad, blurred o may lock */}
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

        {/* BUTTONS */}
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

        <div className="mt-7 text-center text-sm text-gray-500">
          <p>Direktang ina-export ang Canvas — Perfect Quality (1275 × 1800 px)</p>
        </div>
      </div>
    </main>
  );
}