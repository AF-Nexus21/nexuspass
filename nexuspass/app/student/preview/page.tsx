"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import QRCode from "qrcode";

type Student = {
  profile_id?: string; 
  first_name?: string | null; 
  middle_name?: string | null;
  last_name?: string | null;
  student_number?: string | null;
  course?: string | null;
  school?: string | null;
  school_address?: string | null;
  photo_url?: string | null;
  birth_date?: string | null;
  address?: string | null;
  contact?: string | null;
  payment_status?: string | null; 
  parent_guardian?: string | null;
  adviser?: string | null;
  school_head?: string | null;
};

const CANVAS_WIDTH = 1275;
const CANVAS_HEIGHT = 1800;

export default function StudentPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const frontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    async function loadStudent() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data: student, error } = await supabase
          .from("students")
          .select("*")
          .eq("profile_id", user.id)
          .maybeSingle();
        if (error) { console.error("Student record error:", error); setLoading(false); return; }
        if (!student) { console.error("Student record not found."); setLoading(false); return; }
        const { data: paymentData } = await supabase
          .from("payments")
          .select("status")
          .eq("profile_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setStudent({ ...student, payment_status: paymentData?.status || "unpaid" });
      } catch (error) { console.error("Loading student failed:", error); }
      finally { setLoading(false); }
    }
    loadStudent();
  }, []);

  useEffect(() => {
    if (!student) return;
    document.fonts.ready.then(() => { drawFront(); drawBack(); });
  }, [student]);

  function clean(value: string | null | undefined, fallback = "") { return value?.trim() || fallback; }
  function getMiddleInitial() {
    if (!student?.middle_name) return "";
    const cleaned = student.middle_name.replace(/\./g, "").trim();
    if (!cleaned) return "";
    return `${cleaned.charAt(0).toUpperCase()}.`;
  }
  function getFullName() {
    if (!student) return "";
    const middle = getMiddleInitial();
    return [student.first_name, middle, student.last_name].filter(Boolean).join(" ").toUpperCase();
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

  function centerText(ctx: CanvasRenderingContext2D, value: string, centerX: number, y: number, options?: any) {
    drawText(ctx, value, centerX, y, { ...options, align: "center" });
  }

  function getDynamicFontSize(text: string, maxWidth: number, baseSize: number, minSize: number) {
    let fontSize = baseSize;
    const fontFamily = "Arial, Helvetica, sans-serif";
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return baseSize;
    
    while (fontSize > minSize) {
      ctx.font = `900 ${fontSize}px ${fontFamily}`;
      const textWidth = ctx.measureText(text).width;
      if (textWidth <= maxWidth) {
        return fontSize;
      }
      fontSize -= 2;
    }
    return minSize;
  }

  function drawLabelCapsule(ctx: CanvasRenderingContext2D, labelText: string, boxX: number, boxY: number, labelWidth: number, labelHeight: number) {
    ctx.fillStyle = "#1e3a8a";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, labelWidth, labelHeight, labelHeight / 2);
    ctx.fill();

    centerText(ctx, labelText, boxX + (labelWidth / 2), boxY + 12, { fontSize: 20, weight: 700, color: "#ffffff" });
  }

  function drawRoundedBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
    ctx.save();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(x - 4, y - 4, w + 8, h + 8, radius + 4);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1e3a8a";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.stroke();
    ctx.restore();
  }

  async function drawFront() {
    if (!student || !frontCanvasRef.current) return;
    const canvas = frontCanvasRef.current;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    try {
      const template = await loadImage("/student-id-front-v2.png");
      ctx.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } catch (error) { console.error("Front template error:", error); }

    const school = clean(student.school, "TAGPU NATIONAL HIGH SCHOOL").toUpperCase();
    const studentNumber = clean(student.student_number, "116061140042");
    const course = clean(student.course, "Grade 10 - Alab").toUpperCase();
    const fullName = getFullName();

    const blueColor = "#1e3a8a";
    
    centerText(ctx, "Schools Division of Masbate Province", CANVAS_WIDTH / 2, 80, { fontSize: 45, weight: 600, color: "#000000", stroke: "rgba(255, 255, 255, 1)", strokeWidth: 12 });
    centerText(ctx, school, CANVAS_WIDTH / 2, 140, { fontSize: 56, weight: 900, color: blueColor, stroke: "rgba(255, 255, 255, 1)", strokeWidth: 14 });
    centerText(ctx, "Tagpu, Mandaon, Masbate", CANVAS_WIDTH / 2, 210, { fontSize: 35, weight: 600, color: "#000000", stroke: "rgba(255, 255, 255, 1)", strokeWidth: 9 });
    
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
    
    centerText(ctx, "SY: 2026 - 2027", CANVAS_WIDTH / 2, 345, { fontSize: 45, weight: 600, color: "#000000", stroke: "rgba(255, 255, 255, 1)", strokeWidth: 12 });

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

    const logoSize = 505;
    const logoX = 618;
    const logoY = 570;

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

    drawRoundedBox(ctx, lrnBoxX, lrnBoxY, lrnBoxW, lrnBoxH, 15);
    drawLabelCapsule(ctx, "LRN", lrnLabelX, lrnLabelY, lrnLabelW, lrnLabelH);
    centerText(ctx, lrnText, lrnCenterX, lrnBoxY + 15, { fontSize: lrnFontSize, weight: 700 });

    try {
      const depedLogo = await loadImage("/deped-logo.png");
      drawImageCover(ctx, depedLogo, logoX, logoY, logoSize, logoSize);
    } catch (e) {}

    const nameY = 1150;
    const dynamicFontSize = getDynamicFontSize(fullName, CANVAS_WIDTH - 200, 90, 40);

    const nameBoxW = 1115;
    const nameBoxH = 180;
    const nameBoxX = 80;
    const nameBoxY = nameY - 30;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(nameBoxX, nameBoxY, nameBoxW, nameBoxH, 25);
    ctx.fill();

    drawRoundedBox(ctx, nameBoxX, nameBoxY, nameBoxW, nameBoxH, 25);

    centerText(ctx, fullName, CANVAS_WIDTH / 2, nameBoxY + (nameBoxH - dynamicFontSize) / 2, { fontSize: dynamicFontSize, weight: 900, color: "#000000", fontFamily: "Arial, Helvetica, sans-serif" });

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

    drawRoundedBox(ctx, gradeBoxX, gradeBoxY, gradeBoxW, gradeBoxH, 15);
    drawLabelCapsule(ctx, "GRADE", gradeLabelX, gradeLabelY, gradeLabelW, gradeLabelH);
    centerText(ctx, course, CANVAS_WIDTH / 2, gradeBoxY + 20, { fontSize: gradeFontSize, weight: 900, color: "#1e3a8a", fontFamily: "Arial, Helvetica, sans-serif" });

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

  async function drawBack() {
    if (!student || !backCanvasRef.current) return;
    const canvas = backCanvasRef.current;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    try {
      const template = await loadImage("/student-id-back.png");
      ctx.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } catch (error) { console.error("Back template error:", error); }

    const fullName = getFullName();
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
      console.error("QR Code generation error:", error);
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
        .update({ download_count: (paymentData.download_count || 0) + 1, status: "unpaid" })
        .eq("id", paymentData.id);
      setStudent({ ...student, payment_status: "unpaid" });
      alert("ID downloaded successfully! You must pay again for the next download.");
    }
  }

  async function submitFeedback() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (!feedbackComment.trim()) { alert("Please write a comment."); return; }
    setIsSubmittingFeedback(true);
    const { error } = await supabase.from("feedback").insert({
      profile_id: user.id,
      user_name: `${student?.first_name} ${student?.last_name}`,
      comment: feedbackComment,
      rating: feedbackRating || null,
      status: "new"
    });
    setIsSubmittingFeedback(false);
    if (error) { console.error("Feedback error:", error); alert("Failed to send feedback."); }
    else { alert("Thank you for your feedback!"); setFeedbackComment(""); setFeedbackRating(0); }
  }

  function downloadCanvasAsImage(canvas: HTMLCanvasElement, filename: string, type: "image/png" | "image/jpeg" = "image/png") {
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL(type, 1.0);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }

  async function downloadFront() {
    if (!frontCanvasRef.current || !student || exporting) return;
    if (student.payment_status !== "paid") { alert("Please complete your payment first to download your ID."); return; }
    setExporting(true);
    try {
      await drawFront(); await new Promise((resolve) => setTimeout(resolve, 100));
      downloadCanvasAsImage(frontCanvasRef.current, `NEXUSPASS-${student.last_name}-STUDENT-FRONT.png`, "image/png");
      await markAsDownloaded();
      
      // ✅ REDIRECT SA FACEBOOK POST (HINDI NA MA-BLOCK)
      setTimeout(() => {
        const facebookPostUrl = "https://www.facebook.com/permalink.php?story_fbid=pfbid02CbuLVobVDeXggw5S6AjCdVMY6QikXbx6RTPRxzFwUBg5FmgeGVrXE8QHFCojjr4yl&id=61568906948339";
        window.location.href = facebookPostUrl;
      }, 2000);
      
    } catch (error) { console.error("Download front error:", error); alert("Unable to download front image."); }
    finally { setExporting(false); }
  }

  async function downloadBack() {
    if (!backCanvasRef.current || !student || exporting) return;
    if (student.payment_status !== "paid") { alert("Please complete your payment first to download your ID."); return; }
    setExporting(true);
    try {
      await drawBack(); await new Promise((resolve) => setTimeout(resolve, 100));
      downloadCanvasAsImage(backCanvasRef.current, `NEXUSPASS-${student.last_name}-STUDENT-BACK.png`, "image/png");
      await markAsDownloaded();
      
      // ✅ REDIRECT SA FACEBOOK POST (HINDI NA MA-BLOCK)
      setTimeout(() => {
        const facebookPostUrl = "https://www.facebook.com/permalink.php?story_fbid=pfbid02CbuLVobVDeXggw5S6AjCdVMY6QikXbx6RTPRxzFwUBg5FmgeGVrXE8QHFCojjr4yl&id=61568906948339";
        window.location.href = facebookPostUrl;
      }, 2000);
      
    } catch (error) { console.error("Download back error:", error); alert("Unable to download back image."); }
    finally { setExporting(false); }
  }

  async function downloadBoth() {
    if (!frontCanvasRef.current || !backCanvasRef.current || !student || exporting) return;
    if (student.payment_status !== "paid") { alert("Please complete your payment first to download your ID."); return; }
    setExporting(true);
    try {
      await drawFront(); await new Promise((resolve) => setTimeout(resolve, 100));
      await drawBack(); await new Promise((resolve) => setTimeout(resolve, 100));
      downloadCanvasAsImage(frontCanvasRef.current, `NEXUSPASS-${student.last_name}-STUDENT-FRONT.png`, "image/png");
      await new Promise((resolve) => setTimeout(resolve, 300));
      downloadCanvasAsImage(backCanvasRef.current, `NEXUSPASS-${student.last_name}-STUDENT-BACK.png`, "image/png");
      await markAsDownloaded();
      
      // ✅ REDIRECT SA FACEBOOK POST (HINDI NA MA-BLOCK)
      setTimeout(() => {
        const facebookPostUrl = "https://www.facebook.com/permalink.php?story_fbid=pfbid02CbuLVobVDeXggw5S6AjCdVMY6QikXbx6RTPRxzFwUBg5FmgeGVrXE8QHFCojjr4yl&id=61568906948339";
        window.location.href = facebookPostUrl;
      }, 2000);
      
    } catch (error) { console.error("Download both error:", error); alert("Unable to download images."); }
    finally { setExporting(false); }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-200">
        <div className="rounded-xl bg-white px-8 py-6 shadow-lg"><p className="font-semibold text-gray-700">Loading Student e-PIC...</p></div>
      </main>
    );
  }

  if (!student) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-200 px-4">
        <div className="rounded-xl bg-white p-8 text-center shadow-lg">
          <h2 className="text-xl font-bold text-red-600">Student record not found</h2>
          <p className="mt-3 text-sm text-gray-600">Please make sure the student profile is properly connected.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-200 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"><span>←</span> Back to Login</Link>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">Logout</button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">NEXUSPASS Student School Identification Card</h1>
          <p className="mt-2 text-sm text-gray-500">e-PIC Preview — Fixed {CANVAS_WIDTH} × {CANVAS_HEIGHT} px</p>
        </div>

        {student.payment_status === "unpaid" && (
          <div className="mb-8 rounded-xl bg-yellow-50 p-6 text-center shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-800">Payment Required</h2>
            <p className="mt-2 text-sm text-yellow-700">Please complete your payment to unlock the full preview and download.</p>
            <button type="button" onClick={() => window.location.href = "/payment"} className="mt-4 rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-green-700">Pay Now</button>
          </div>
        )}

        {student.payment_status === "pending" && (
          <div className="mb-8 rounded-xl bg-blue-50 p-6 text-center shadow-lg">
            <h2 className="text-2xl font-bold text-blue-800">Payment Under Review</h2>
            <p className="mt-2 text-sm text-blue-700">Your payment has been submitted. Please wait for the admin's approval to unlock your ID.</p>
          </div>
        )}

        <div className="flex flex-wrap items-start justify-center gap-8">
          <div>
            <h2 className="mb-3 text-center text-lg font-bold text-gray-700">FRONT</h2>
            <div className="overflow-hidden rounded-xl bg-white shadow-xl" style={{ width: "425px", height: "600px", position: "relative" }}>
              <canvas ref={frontCanvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ width: "425px", height: "600px", display: "block" }} />
              {student.payment_status !== "paid" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md" style={{ pointerEvents: "none" }}>
                  <div className="text-center"><p className="text-4xl">🔒</p><p className="mt-2 text-lg font-bold text-white">Locked Preview</p><p className="mt-1 text-sm text-gray-300">Complete your payment to unlock</p></div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-center text-lg font-bold text-gray-700">BACK</h2>
            <div className="overflow-hidden rounded-xl bg-white shadow-xl" style={{ width: "425px", height: "600px", position: "relative" }}>
              <canvas ref={backCanvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ width: "425px", height: "600px", display: "block" }} />
              {student.payment_status !== "paid" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md" style={{ pointerEvents: "none" }}>
                  <div className="text-center"><p className="text-4xl">🔒</p><p className="mt-2 text-lg font-bold text-white">Locked Preview</p><p className="mt-1 text-sm text-gray-300">Complete your payment to unlock</p></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {student.payment_status === "paid" ? (
            <>
              <button type="button" onClick={downloadFront} disabled={exporting} className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{exporting ? "Downloading..." : "Download Front PNG"}</button>
              <button type="button" onClick={downloadBack} disabled={exporting} className="rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50">{exporting ? "Downloading..." : "Download Back PNG"}</button>
              <button type="button" onClick={downloadBoth} disabled={exporting} className="rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">{exporting ? "Downloading..." : "Download Both PNG"}</button>
            </>
          ) : (
            <div className="rounded-lg bg-red-50 p-4 text-center text-sm font-semibold text-red-600">
              <p>Payment required to download.</p>
              <p className="mt-1 text-xs text-red-500">Please complete your payment first.</p>
            </div>
          )}
        </div>

        <div className="mt-10 rounded-xl bg-white p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800">Leave a Feedback</h2>
          <p className="mt-2 text-sm text-gray-500">How satisfied are you with your ID output and our service?</p>
          <div className="mt-4 flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setFeedbackRating(star)} className={`text-3xl ${star <= feedbackRating ? "text-yellow-400" : "text-gray-300"}`}>★</button>
            ))}
          </div>
          <textarea value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} placeholder="Share your experience or suggestions..." className="mt-4 w-full rounded-lg border border-gray-300 p-4 outline-none focus:border-blue-500" rows={3} />
          <button type="button" onClick={submitFeedback} disabled={isSubmittingFeedback} className="mt-4 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">{isSubmittingFeedback ? "Sending..." : "Send Feedback"}</button>
        </div>

        <div className="mt-7 text-center text-sm text-gray-500">
          <p>Direktang ina-export ang Canvas — Perfect Quality (1275 × 1800 px)</p>
        </div>
      </div>
    </main>
  );
}