"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

type Student = {
  id?: string;
  profile_id?: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  student_number?: string | null;
  school?: string | null;
  school_address?: string | null;
  course?: string | null;
  birth_date?: string | null;
  address?: string | null;
  contact?: string | null;
  parent_guardian?: string | null;
  adviser?: string | null;
  school_head?: string | null;
  photo_url?: string | null;
  status?: string | null;
};

const CANVAS_WIDTH = 1275;
const CANVAS_HEIGHT = 1800;

export default function BulkDownloadPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStudents() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // ✅ Check if teacher
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile || profile.role !== "teacher") {
          router.push("/");
          return;
        }

        // ✅ Get teacher info
        const { data: teacher } = await supabase
          .from("teachers")
          .select("*")
          .eq("profile_id", user.id)
          .maybeSingle();

        if (teacher) {
          setCurrentTeacher(teacher);
          
          // ✅ Get students under this adviser
          const adviserName = `${teacher.first_name} ${teacher.last_name}`;
          const { data: students, error: studentsError } = await supabase
            .from("students")
            .select("*")
            .eq("adviser", adviserName)
            .order("last_name", { ascending: true });

          if (studentsError) {
            console.error("Error fetching students:", studentsError);
            setError("Failed to fetch students.");
          } else {
            setStudents(students || []);
            setMessage(`Found ${students?.length || 0} students under your advisory class.`);
          }
        }
      } catch (error) {
        console.error("Error loading students:", error);
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, [router]);

  // ✅ Load Image
  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
      image.src = src;
    });
  }

  // ✅ Draw Image Cover
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

  // ✅ Draw Text
  function drawText(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, options?: any) {
    const fontSize = options?.fontSize ?? 40;
    const weight = options?.weight ?? 600;
    const color = options?.color ?? "#000000";
    const align = options?.align ?? "left";
    const fontFamily = options?.fontFamily || "Arial, Helvetica, sans-serif";
    ctx.save();
    ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = align;
    ctx.textBaseline = "top";

    if (options?.stroke) {
      ctx.lineJoin = "round";
      ctx.lineWidth = options.strokeWidth || 12;
      ctx.strokeStyle = options.stroke || "rgba(255, 255, 255, 1)";
      ctx.strokeText(value, x, y);
      ctx.lineWidth = (options.strokeWidth || 12) / 2;
      ctx.strokeText(value, x, y);
    }

    if (options?.maxWidth) {
      ctx.fillStyle = color;
      ctx.fillText(value, x, y, options.maxWidth);
    } else {
      ctx.fillStyle = color;
      ctx.fillText(value, x, y);
    }
    ctx.restore();
  }

  // ✅ Center Text
  function centerText(ctx: CanvasRenderingContext2D, value: string, centerX: number, y: number, options?: any) {
    drawText(ctx, value, centerX, y, { ...options, align: "center" });
  }

  // ✅ Get Full Name
  function getFullName(student: Student) {
    if (!student) return "";
    const cleaned = (student.middle_name || "").replace(/\./g, "").trim();
    const middleInitial = cleaned ? `${cleaned.charAt(0).toUpperCase()}.` : "";
    return [student.first_name, middleInitial, student.last_name].filter(Boolean).join(" ").toUpperCase();
  }

  // ✅ Clean
  function clean(value: string | null | undefined, fallback = "") {
    return value?.trim() || fallback;
  }

  // ✅ Draw Student Front ID
  async function drawStudentFront(ctx: CanvasRenderingContext2D, student: Student) {
    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Template
    try {
      const template = await loadImage("/student-id-front-v2.png");
      ctx.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } catch (e) {}

    const school = clean(student.school, "TAGPU NATIONAL HIGH SCHOOL").toUpperCase();
    const studentNumber = clean(student.student_number, "116061140042");
    const course = clean(student.course, "Grade 10 - Alab").toUpperCase();
    const fullName = getFullName(student);
    const blueColor = "#1e3a8a";

    // Header
    centerText(ctx, "Schools Division of Masbate Province", CANVAS_WIDTH / 2, 80, { fontSize: 45, weight: 600, color: "#000000", stroke: "rgba(255, 255, 255, 1)", strokeWidth: 12 });
    centerText(ctx, school, CANVAS_WIDTH / 2, 140, { fontSize: 56, weight: 900, color: blueColor, stroke: "rgba(255, 255, 255, 1)", strokeWidth: 14 });
    centerText(ctx, "Tagpu, Mandaon, Masbate", CANVAS_WIDTH / 2, 210, { fontSize: 35, weight: 600, color: "#000000", stroke: "rgba(255, 255, 255, 1)", strokeWidth: 9 });

    // School ID Capsule
    const schoolIdText = "School ID: 302120";
    const capsuleFontSize = 35;
    ctx.save();
    ctx.font = `700 ${capsuleFontSize}px Arial, Helvetica, sans-serif`;
    const textWidth = ctx.measureText(schoolIdText).width;
    ctx.restore();
    
    const capsulePadding = 60;
    const capsuleW = textWidth + capsulePadding;
    const capsuleH = 60;
    const capsuleX = (CANVAS_WIDTH - capsuleW) / 2;
    const capsuleY = 255;
    
    ctx.fillStyle = blueColor;
    ctx.beginPath();
    ctx.roundRect(capsuleX, capsuleY, capsuleW, capsuleH, 30);
    ctx.fill();
    
    centerText(ctx, schoolIdText, CANVAS_WIDTH / 2, capsuleY + 12, { fontSize: capsuleFontSize, weight: 700, color: "#ffffff" });
    
    // SY
    centerText(ctx, "SY: 2026 - 2027", CANVAS_WIDTH / 2, 345, { fontSize: 45, weight: 600, color: "#000000", stroke: "rgba(255, 255, 255, 1)", strokeWidth: 12 });

    // Photo
    const photoW = 420;
    const photoH = 560;
    const photoX = 152;
    const photoY = 500;

    if (student.photo_url) {
      try {
        const photo = await loadImage(student.photo_url);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(photoX, photoY, photoW, photoH, 20);
        ctx.clip();
        drawImageCover(ctx, photo, photoX, photoY, photoW, photoH);
        ctx.restore();

        ctx.save();
        ctx.lineWidth = 8;
        ctx.strokeStyle = "#1e3a8a";
        ctx.beginPath();
        ctx.roundRect(photoX, photoY, photoW, photoH, 20);
        ctx.stroke();
        
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(photoX - 4, photoY - 4, photoW + 8, photoH + 8, 24);
        ctx.stroke();
        ctx.restore();
      } catch (error) {
        ctx.fillStyle = "#eeeeee";
        ctx.fillRect(photoX, photoY, photoW, photoH);
        centerText(ctx, "PHOTO", photoX + photoW / 2, photoY + photoH / 2 - 20, { fontSize: 30, color: "#999999" });
      }
    } else {
      ctx.fillStyle = "#eeeeee";
      ctx.fillRect(photoX, photoY, photoW, photoH);
      centerText(ctx, "PHOTO", photoX + photoW / 2, photoY + photoH / 2 - 20, { fontSize: 30, color: "#999999" });
    }

    // Logo
    const logoSize = 505;
    const logoX = 618;
    const logoY = 570;

    // LRN
    const lrnFontSize = 45;
    const lrnText = studentNumber;
    const lrnCenterX = logoX + (logoSize / 2);
    const lrnBoxY = 470;

    ctx.save();
    ctx.font = `700 ${lrnFontSize}px Arial, Helvetica, sans-serif`;
    const lrnTextWidth = ctx.measureText(lrnText).width;
    ctx.restore();

    const lrnBoxW = lrnTextWidth + 60;
    const lrnBoxH = 70;
    const lrnBoxX = lrnCenterX - (lrnBoxW / 2);
    
    const lrnLabelW = 80;
    const lrnLabelH = 30;
    const lrnLabelX = lrnBoxX + 20;
    const lrnLabelY = lrnBoxY - lrnLabelH;

    ctx.save();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1e3a8a";
    ctx.beginPath();
    ctx.roundRect(lrnBoxX, lrnBoxY, lrnBoxW, lrnBoxH, 15);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#1e3a8a";
    ctx.beginPath();
    ctx.roundRect(lrnLabelX, lrnLabelY, lrnLabelW, lrnLabelH, lrnLabelH / 2);
    ctx.fill();
    centerText(ctx, "LRN", lrnLabelX + (lrnLabelW / 2), lrnLabelY + 12, { fontSize: 20, weight: 700, color: "#ffffff" });

    centerText(ctx, lrnText, lrnCenterX, lrnBoxY + 15, { fontSize: lrnFontSize, weight: 700 });

    try {
      const depedLogo = await loadImage("/deped-logo.png");
      drawImageCover(ctx, depedLogo, logoX, logoY, logoSize, logoSize);
    } catch (e) {}

    // Name
    const nameY = 1150;
    const nameBoxW = 1115;
    const nameBoxH = 180;
    const nameBoxX = 80;
    const nameBoxY = nameY - 30;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(nameBoxX, nameBoxY, nameBoxW, nameBoxH, 25);
    ctx.fill();

    ctx.save();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1e3a8a";
    ctx.beginPath();
    ctx.roundRect(nameBoxX, nameBoxY, nameBoxW, nameBoxH, 25);
    ctx.stroke();
    ctx.restore();

    // Dynamic font size for name
    let nameFontSize = 90;
    ctx.font = `900 ${nameFontSize}px Arial, Helvetica, sans-serif`;
    let nameWidth = ctx.measureText(fullName).width;
    while (nameWidth > (CANVAS_WIDTH - 200) && nameFontSize > 40) {
      nameFontSize -= 2;
      ctx.font = `900 ${nameFontSize}px Arial, Helvetica, sans-serif`;
      nameWidth = ctx.measureText(fullName).width;
    }

    centerText(ctx, fullName, CANVAS_WIDTH / 2, nameBoxY + (nameBoxH - nameFontSize) / 2, { fontSize: nameFontSize, weight: 900, color: "#000000" });

    // Grade
    const gradeY = nameBoxY + nameBoxH + 76;
    const gradeFontSize = 50;

    ctx.save();
    ctx.font = `900 ${gradeFontSize}px Arial, Helvetica, sans-serif`;
    const gradeTextWidth = ctx.measureText(course).width;
    ctx.restore();

    const gradeBoxPadding = 40;
    const gradeBoxW = gradeTextWidth + gradeBoxPadding;
    const gradeBoxH = 80;
    const gradeBoxX = (CANVAS_WIDTH - gradeBoxW) / 2;
    const gradeBoxY = gradeY - 10;

    const gradeLabelW = 110;
    const gradeLabelH = 30;
    const gradeLabelX = gradeBoxX + (gradeBoxW - gradeLabelW) / 2;
    const gradeLabelY = gradeBoxY - gradeLabelH;

    ctx.save();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1e3a8a";
    ctx.beginPath();
    ctx.roundRect(gradeBoxX, gradeBoxY, gradeBoxW, gradeBoxH, 15);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#1e3a8a";
    ctx.beginPath();
    ctx.roundRect(gradeLabelX, gradeLabelY, gradeLabelW, gradeLabelH, gradeLabelH / 2);
    ctx.fill();
    centerText(ctx, "GRADE", gradeLabelX + (gradeLabelW / 2), gradeLabelY + 12, { fontSize: 20, weight: 700, color: "#ffffff" });

    centerText(ctx, course, CANVAS_WIDTH / 2, gradeBoxY + 20, { fontSize: gradeFontSize, weight: 900, color: "#1e3a8a" });

    // Signature
    const lineY = 1650;
    const lineStartX = 190;
    const lineEndX = 1085;
    
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lineStartX, lineY);
    ctx.lineTo(lineEndX, lineY);
    ctx.stroke();

    centerText(ctx, "Student's Signature", CANVAS_WIDTH / 2, lineY + 40, { fontSize: 40, weight: 600 });
  }

  // ✅ Draw Student Back ID
  async function drawStudentBack(ctx: CanvasRenderingContext2D, student: Student) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    try {
      const template = await loadImage("/student-id-back.png");
      ctx.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } catch (e) {}

    const fullName = getFullName(student);
    const school = clean(student.school, "TAGPU NATIONAL HIGH SCHOOL").toUpperCase();
    const schoolAddress = clean(student.school_address, "Tagpu, Mandaon, Masbate");

    // ✅ SCHOOL INFORMATION BOX
    const schoolBoxX = 150;
    const schoolBoxY = 250;
    const schoolBoxW = 975;
    const schoolBoxH = 200;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#14527d";
    ctx.beginPath();
    ctx.roundRect(schoolBoxX, schoolBoxY, schoolBoxW, schoolBoxH, 15);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#14527d";
    ctx.beginPath();
    ctx.roundRect(schoolBoxX, schoolBoxY, schoolBoxW, 50, [15, 15, 0, 0]);
    ctx.fill();

    centerText(ctx, "SCHOOL INFORMATION", CANVAS_WIDTH / 2, schoolBoxY + 15, { fontSize: 30, weight: 800, color: "#ffffff" });

    const schoolBodyY = schoolBoxY + 70;
    centerText(ctx, school, CANVAS_WIDTH / 2, schoolBodyY, { fontSize: 32, weight: 800, color: "#123f64" });
    centerText(ctx, schoolAddress, CANVAS_WIDTH / 2, schoolBodyY + 45, { fontSize: 28, weight: 600, color: "#263746" });
    centerText(ctx, "School ID: 302120", CANVAS_WIDTH / 2, schoolBodyY + 90, { fontSize: 24, weight: 600, color: "#6b7280" });

    // ✅ EMERGENCY CONTACT BOX
    const boxX = 150;
    const boxY = 500;
    const boxW = 975;
    const boxH = 300;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#14527d";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 15);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#14527d";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, 50, [15, 15, 0, 0]);
    ctx.fill();

    centerText(ctx, "EMERGENCY CONTACT", CANVAS_WIDTH / 2, boxY + 15, { fontSize: 30, weight: 800, color: "#ffffff" });

    const bodyY = boxY + 70;
    centerText(ctx, "IN CASE OF EMERGENCY, PLEASE CONTACT:", CANVAS_WIDTH / 2, bodyY, { fontSize: 24, weight: 600, color: "#6b7280" });
    
    centerText(ctx, fullName, CANVAS_WIDTH / 2, bodyY + 50, { fontSize: 36, weight: 800, color: "#123f64" });
    centerText(ctx, "Student", CANVAS_WIDTH / 2, bodyY + 95, { fontSize: 26, weight: 500, color: "#6b7280", fontStyle: "italic" });

    const rowY = bodyY + 130;
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX + 20, rowY);
    ctx.lineTo(boxX + boxW - 20, rowY);
    ctx.stroke();
    centerText(ctx, `Parent/Guardian: ${student.parent_guardian || "N/A"}`, CANVAS_WIDTH / 2, rowY + 15, { fontSize: 28, weight: 700, color: "#263746" });

    const rowY2 = rowY + 50;
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX + 20, rowY2);
    ctx.lineTo(boxX + boxW - 20, rowY2);
    ctx.stroke();
    centerText(ctx, `Contact No.: ${student.contact || "0912 345 6789"}`, CANVAS_WIDTH / 2, rowY2 + 15, { fontSize: 28, weight: 700, color: "#263746" });

    // ✅ IMPORTANT REMINDERS
    const remindersY = 850;
    const remindersTitle = "IMPORTANT REMINDERS";

    centerText(ctx, remindersTitle, CANVAS_WIDTH / 2, remindersY, { fontSize: 38, weight: 800, color: "#14527d" });

    const reminderText = "This identification card is non-transferable and is valid only for School Year 2026-2027. This card must be worn at all times while inside the school premises. If lost or found, please return this identification card to the Office of the School Head.";

    const maxWidth = 900;
    ctx.font = "600 36px Arial, Helvetica, sans-serif";
    const words = reminderText.split(" ");
    let lines = [];
    let currentLine = "";

    for (let word of words) {
      const testLine = currentLine + word + " ";
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth) {
        lines.push(currentLine.trim());
        currentLine = word + " ";
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());

    let lineY = remindersY + 40;
    for (let line of lines) {
      centerText(ctx, line, CANVAS_WIDTH / 2, lineY, { fontSize: 36, weight: 600, color: "#374151" });
      lineY += 55;
    }

    // ✅ QR CODE
    const qrSize = 330;
    const qrX = (CANVAS_WIDTH - qrSize) / 2;
    const qrY = 1300 - (qrSize / 2);

    try {
      const qrDataUrl = await QRCode.toDataURL(student.student_number || "NEXUSPASS-STUDENT-ID");
      const qrImage = await loadImage(qrDataUrl);
      
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(qrX, qrY, qrSize, qrSize, 5);
      ctx.clip();
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
      ctx.restore();
    } catch (error) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      ctx.strokeStyle = "#cccccc";
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX, qrY, qrSize, qrSize);
      centerText(ctx, "QR", CANVAS_WIDTH / 2, qrY + 130, { fontSize: 40, weight: 700, color: "#000000" });
    }

    centerText(ctx, "SCAN TO VERIFY ID", CANVAS_WIDTH / 2, qrY + qrSize + 15, { fontSize: 28, weight: 800, color: "#14527d" });
    centerText(ctx, "NEXUSPASS DIGITAL ID", CANVAS_WIDTH / 2, qrY + qrSize + 50, { fontSize: 22, weight: 500, color: "#6b7280" });

    // ✅ SIGNATORIES
    const signY = 1620;
    const adviserName = clean(student.adviser, "MARILOR F. CARMEN").toUpperCase();
    const schoolHeadName = clean(student.school_head, "ANDREW R. ABSALON").toUpperCase();

    const leftX = 250;
    centerText(ctx, adviserName, leftX, signY, { fontSize: 33, weight: 800, color: "#263746" });
    ctx.strokeStyle = "#4b5563";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(leftX - 130, signY + 40);
    ctx.lineTo(leftX + 130, signY + 40);
    ctx.stroke();
    centerText(ctx, "Adviser", leftX, signY + 55, { fontSize: 24, weight: 500, color: "#6b7280" });

    const rightX = CANVAS_WIDTH - 250;
    centerText(ctx, schoolHeadName, rightX, signY, { fontSize: 33, weight: 800, color: "#263746" });
    ctx.strokeStyle = "#4b5563";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rightX - 130, signY + 40);
    ctx.lineTo(rightX + 130, signY + 40);
    ctx.stroke();
    centerText(ctx, "School Head", rightX, signY + 55, { fontSize: 24, weight: 500, color: "#6b7280" });
  }

  // ✅ Generate PDF
  async function generatePDF() {
    if (students.length === 0) {
      setError("No students to download.");
      return;
    }

    setExporting(true);
    setMessage("");
    setError("");

    try {
      // ✅ Create PDF in Landscape Letter size
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "in",
        format: [11, 8.5] // Letter size landscape
      });

      let y = 0.5;

      for (let i = 0; i < students.length; i++) {
        const student = students[i];

        // ✅ Create canvas para sa Front
        const frontCanvas = document.createElement("canvas");
        frontCanvas.width = CANVAS_WIDTH;
        frontCanvas.height = CANVAS_HEIGHT;
        const frontCtx = frontCanvas.getContext("2d");
        if (frontCtx) {
          await drawStudentFront(frontCtx, student);
        }
        const frontImage = frontCanvas.toDataURL("image/png");

        // ✅ Create canvas para sa Back
        const backCanvas = document.createElement("canvas");
        backCanvas.width = CANVAS_WIDTH;
        backCanvas.height = CANVAS_HEIGHT;
        const backCtx = backCanvas.getContext("2d");
        if (backCtx) {
          await drawStudentBack(backCtx, student);
        }
        const backImage = backCanvas.toDataURL("image/png");

        // ✅ Add Front Image (4x6 inches)
        doc.addImage(frontImage, "PNG", 0.5, y, 4, 6);

        // ✅ Add Back Image (4x6 inches)
        doc.addImage(backImage, "PNG", 4.5, y, 4, 6);

        // ✅ Move to next row
        y += 6.5;

        // ✅ Add new page if needed
        if (y > 7.5 && i < students.length - 1) {
          doc.addPage();
          y = 0.5;
        }
      }

      // ✅ Save PDF
      const filename = `NEXUSPASS-${currentTeacher?.last_name || "Teacher"}-STUDENT-IDS.pdf`;
      doc.save(filename);

      setMessage(`✅ Successfully generated PDF for ${students.length} students!`);
    } catch (error) {
      console.error("PDF generation error:", error);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  // ✅ Individual Download
  async function downloadIndividual(student: Student) {
    setExporting(true);
    setMessage("");
    setError("");

    try {
      const frontCanvas = document.createElement("canvas");
      frontCanvas.width = CANVAS_WIDTH;
      frontCanvas.height = CANVAS_HEIGHT;
      const frontCtx = frontCanvas.getContext("2d");
      if (frontCtx) {
        await drawStudentFront(frontCtx, student);
      }

      const backCanvas = document.createElement("canvas");
      backCanvas.width = CANVAS_WIDTH;
      backCanvas.height = CANVAS_HEIGHT;
      const backCtx = backCanvas.getContext("2d");
      if (backCtx) {
        await drawStudentBack(backCtx, student);
      }

      // ✅ Download Front
      const frontLink = document.createElement("a");
      frontLink.download = `NEXUSPASS-${student.last_name}-STUDENT-FRONT.png`;
      frontLink.href = frontCanvas.toDataURL("image/png");
      document.body.appendChild(frontLink);
      frontLink.click();
      document.body.removeChild(frontLink);

      // ✅ Download Back
      const backLink = document.createElement("a");
      backLink.download = `NEXUSPASS-${student.last_name}-STUDENT-BACK.png`;
      backLink.href = backCanvas.toDataURL("image/png");
      document.body.appendChild(backLink);
      backLink.click();
      document.body.removeChild(backLink);

      setMessage(`✅ Successfully downloaded ID for ${student.first_name} ${student.last_name}!`);
    } catch (error) {
      console.error("Individual download error:", error);
      setError("Failed to download ID.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-xl bg-white px-8 py-6 shadow-lg">
          <p className="font-semibold text-gray-700">Loading Students...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/teacher/preview"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
          >
            <span>←</span> Back to Teacher Preview
          </Link>
          
          <h1 className="text-2xl font-bold text-blue-700">
            📥 Bulk Download Student IDs
          </h1>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-2xl font-bold text-blue-700">{students.length}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-sm text-gray-500">With Photo</p>
            <p className="text-2xl font-bold text-green-600">
              {students.filter(s => s.photo_url).length}
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-sm text-gray-500">Without Photo</p>
            <p className="text-2xl font-bold text-yellow-600">
              {students.filter(s => !s.photo_url).length}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          {/* Actions */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={generatePDF}
              disabled={exporting || students.length === 0}
              className="rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? "Generating PDF..." : "📥 Download All IDs (PDF)"}
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-4 rounded-lg bg-green-100 p-4 text-sm text-green-700">
              ✅ {message}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-lg bg-red-100 p-4 text-sm text-red-700">
              ❌ {error}
            </div>
          )}

          {/* Student List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">LRN</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Grade/Strand</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Photo</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student, index) => (
                  <tr key={student.id || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{student.student_number}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {student.last_name}, {student.first_name} {student.middle_name ? `${student.middle_name.charAt(0)}.` : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{student.course}</td>
                    <td className="px-4 py-3">
                      {student.photo_url ? (
                        <span className="text-green-600">✅</span>
                      ) : (
                        <span className="text-yellow-600">⚠️ No Photo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => downloadIndividual(student)}
                        disabled={exporting}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                      >
                        📥 Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {students.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-4xl">📭</p>
              <p className="mt-3 text-lg font-semibold text-gray-700">No students found</p>
              <p className="mt-1 text-sm text-gray-500">
                Wala pang students ang advisory class mo. Mag-upload ka muna ng students.
              </p>
              <Link
                href="/teacher/bulk-upload"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                📥 Upload Students
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}