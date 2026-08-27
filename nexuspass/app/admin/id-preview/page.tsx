"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import QRCode from "qrcode";

type User = {
  id?: string;
  profile_id?: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  student_number?: string | null;
  employee_number?: string | null;
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
  position?: string | null;
  role?: string | null;
  // ✅ BAGONG FIELDS
  emergency_contact_name?: string | null;
  emergency_contact_number?: string | null;
};

const CANVAS_WIDTH = 1275;
const CANVAS_HEIGHT = 1800;

export default function AdminIDPreviewPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // ✅ Check if admin
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile || profile.role !== "admin") {
          router.push("/");
          return;
        }

        // ✅ Load students
        const { data: students } = await supabase
          .from("students")
          .select("*")
          .order("last_name", { ascending: true });

        // ✅ Load teachers
        const { data: teachers } = await supabase
          .from("teachers")
          .select("*")
          .order("last_name", { ascending: true });

        const allUsers = [
          ...(students || []).map(s => ({ ...s, role: "student" })),
          ...(teachers || []).map(t => ({ ...t, role: "teacher" }))
        ];

        setUsers(allUsers);
      } catch (error) {
        console.error("Error loading users:", error);
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [router]);

  // ✅ Preview ID Modal
  function showIDPreview(user: User) {
    setSelectedUser(user);
    setShowPreview(true);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-xl bg-white px-8 py-6 shadow-lg">
          <p className="font-semibold text-gray-700">Loading Users...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/admin" className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300">
            <span>←</span> Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-blue-700">ID Preview</h1>
        </div>

        {/* Users List */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-bold text-gray-800">All Users</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Role</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">ID Number</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Photo</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user, index) => (
                  <tr key={user.id || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        user.role === "student" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                      }`}>
                        {user.role === "student" ? "Student" : "Teacher"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {user.last_name}, {user.first_name} {user.middle_name ? `${user.middle_name.charAt(0)}.` : ""}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">
                      {user.student_number || user.employee_number || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      {user.photo_url ? (
                        <span className="text-green-600">✅</span>
                      ) : (
                        <span className="text-yellow-600">⚠️</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => showIDPreview(user)}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                      >
                        👁️ Preview ID
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ✅ ID PREVIEW MODAL */}
      {showPreview && selectedUser && (
        <IDPreviewModal user={selectedUser} onClose={() => setShowPreview(false)} />
      )}
    </main>
  );
}

// ✅ ID PREVIEW MODAL - GAMIT ANG CANVAS DRAWING
function IDPreviewModal({ user, onClose }: { user: User; onClose: () => void }) {
  const frontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!user) return;
    document.fonts.ready.then(() => {
      drawFront();
      drawBack();
    });
  }, [user]);

  // ✅ DRAW FRONT
  async function drawFront() {
    if (!frontCanvasRef.current) return;
    const canvas = frontCanvasRef.current;
    canvas.width = 1275;
    canvas.height = 1800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 1275, 1800);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1275, 1800);

    // ✅ TAMANG TEMPLATE BASE SA ROLE
    const templatePath = user.role === "teacher" 
      ? "/teacher-id-front.png" 
      : "/student-id-front-v2.png";

    try {
      const template = await loadImage(templatePath);
      ctx.drawImage(template, 0, 0, 1275, 1800);
    } catch (e) {}

    const fullName = getFullName(user);
    const school = clean(user.school, "TAGPU NATIONAL HIGH SCHOOL").toUpperCase();
    const blueColor = "#1e3a8a";

    // ✅ HEADER
    centerText(ctx, "Schools Division of Masbate Province", 637, 80, { fontSize: 45, weight: 600, color: "#000000", stroke: "rgba(255, 255, 255, 1)", strokeWidth: 12 });
    centerText(ctx, school, 637, 140, { fontSize: 56, weight: 900, color: blueColor, stroke: "rgba(255, 255, 255, 1)", strokeWidth: 14 });
    centerText(ctx, "Tagpu, Mandaon, Masbate", 637, 210, { fontSize: 35, weight: 600, color: "#000000", stroke: "rgba(255, 255, 255, 1)", strokeWidth: 9 });

    const schoolIdText = "School ID: 302120";
    const capsuleFontSize = 35;
    ctx.save();
    ctx.font = `700 ${capsuleFontSize}px Arial, Helvetica, sans-serif`;
    const textWidth = ctx.measureText(schoolIdText).width;
    ctx.restore();
    
    const capsulePadding = 60;
    const capsuleW = textWidth + capsulePadding;
    const capsuleH = 60;
    const capsuleX = (1275 - capsuleW) / 2;
    const capsuleY = 255;
    
    ctx.fillStyle = blueColor;
    ctx.beginPath();
    ctx.roundRect(capsuleX, capsuleY, capsuleW, capsuleH, 30);
    ctx.fill();
    
    centerText(ctx, schoolIdText, 637, capsuleY + 12, { fontSize: capsuleFontSize, weight: 700, color: "#ffffff" });
    
    centerText(ctx, "SY: 2026 - 2027", 637, 345, { fontSize: 45, weight: 600, color: "#000000", stroke: "rgba(255, 255, 255, 1)", strokeWidth: 12 });

    // ✅ PHOTO
    const photoW = 420;
    const photoH = 560;
    const photoX = 152;
    const photoY = 500;

    if (user.photo_url) {
      try {
        const photo = await loadImage(user.photo_url);
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

    // ✅ LOGO
    const logoSize = 505;
    const logoX = 618;
    const logoY = 570;

    try {
      const depedLogo = await loadImage("/deped-logo.png");
      drawImageCover(ctx, depedLogo, logoX, logoY, logoSize, logoSize);
    } catch (e) {}

    // ✅ ID NUMBER
    const idFontSize = 45;
    const idText = user.student_number || user.employee_number || "N/A";
    const idCenterX = logoX + (logoSize / 2);
    const idBoxY = 470;

    ctx.save();
    ctx.font = `700 ${idFontSize}px Arial, Helvetica, sans-serif`;
    const idTextWidth = ctx.measureText(idText).width;
    ctx.restore();

    const idBoxW = idTextWidth + 60;
    const idBoxH = 70;
    const idBoxX = idCenterX - (idBoxW / 2);
    
    const idLabelW = 110;
    const idLabelH = 30;
    const idLabelX = idBoxX + 20;
    const idLabelY = idBoxY - idLabelH;

    ctx.save();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1e3a8a";
    ctx.beginPath();
    ctx.roundRect(idBoxX, idBoxY, idBoxW, idBoxH, 15);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#1e3a8a";
    ctx.beginPath();
    ctx.roundRect(idLabelX, idLabelY, idLabelW, idLabelH, idLabelH / 2);
    ctx.fill();
    centerText(ctx, "LRN", idLabelX + (idLabelW / 2), idLabelY + 12, { fontSize: 20, weight: 700, color: "#ffffff" });

    centerText(ctx, idText, idCenterX, idBoxY + 15, { fontSize: idFontSize, weight: 700 });

    // ✅ NAME BOX
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

    let nameFontSize = 90;
    ctx.font = `900 ${nameFontSize}px Arial, Helvetica, sans-serif`;
    let nameWidth = ctx.measureText(fullName).width;
    while (nameWidth > (1275 - 200) && nameFontSize > 40) {
      nameFontSize -= 2;
      ctx.font = `900 ${nameFontSize}px Arial, Helvetica, sans-serif`;
      nameWidth = ctx.measureText(fullName).width;
    }

    centerText(ctx, fullName, 637, nameBoxY + (nameBoxH - nameFontSize) / 2, { fontSize: nameFontSize, weight: 900, color: "#000000" });

    // ✅ GRADE OR POSITION
    const gradeY = nameBoxY + nameBoxH + 76;
    const gradeFontSize = 50;

    const gradeText = user.role === "teacher" 
      ? clean(user.position, "Teacher II").toUpperCase() 
      : clean(user.course, "Grade 10 - Alab").toUpperCase();

    ctx.save();
    ctx.font = `900 ${gradeFontSize}px Arial, Helvetica, sans-serif`;
    const gradeTextWidth = ctx.measureText(gradeText).width;
    ctx.restore();

    const gradeBoxPadding = 40;
    const gradeBoxW = gradeTextWidth + gradeBoxPadding;
    const gradeBoxH = 80;
    const gradeBoxX = (1275 - gradeBoxW) / 2;
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

    centerText(ctx, gradeText, 637, gradeBoxY + 20, { fontSize: gradeFontSize, weight: 900, color: "#1e3a8a" });

    // ✅ SIGNATURE
    const lineY = 1650;
    const lineStartX = 190;
    const lineEndX = 1085;
    
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lineStartX, lineY);
    ctx.lineTo(lineEndX, lineY);
    ctx.stroke();

    centerText(ctx, "Student's Signature", 637, lineY + 40, { fontSize: 40, weight: 600 });
  }

  // ✅ DRAW BACK
  async function drawBack() {
    if (!backCanvasRef.current) return;
    const canvas = backCanvasRef.current;
    canvas.width = 1275;
    canvas.height = 1800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 1275, 1800);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1275, 1800);

    // ✅ TAMANG TEMPLATE BASE SA ROLE
    const templatePath = user.role === "teacher" 
      ? "/teacher-id-back.png" 
      : "/student-id-back.png";

    try {
      const template = await loadImage(templatePath);
      ctx.drawImage(template, 0, 0, 1275, 1800);
    } catch (e) {}

    const fullName = getFullName(user);
    const school = clean(user.school, "TAGPU NATIONAL HIGH SCHOOL").toUpperCase();
    const schoolAddress = clean(user.school_address, "Tagpu, Mandaon, Masbate");

    // ✅ SCHOOL INFO BOX
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

    centerText(ctx, "SCHOOL INFORMATION", 637, schoolBoxY + 15, { fontSize: 30, weight: 800, color: "#ffffff" });

    const schoolBodyY = schoolBoxY + 70;
    centerText(ctx, school, 637, schoolBodyY, { fontSize: 32, weight: 800, color: "#123f64" });
    centerText(ctx, schoolAddress, 637, schoolBodyY + 45, { fontSize: 28, weight: 600, color: "#263746" });
    centerText(ctx, "School ID: 302120", 637, schoolBodyY + 90, { fontSize: 24, weight: 600, color: "#6b7280" });

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

    centerText(ctx, "EMERGENCY CONTACT", 637, boxY + 15, { fontSize: 30, weight: 800, color: "#ffffff" });

    const bodyY = boxY + 70;
    centerText(ctx, "IN CASE OF EMERGENCY, PLEASE CONTACT:", 637, bodyY, { fontSize: 24, weight: 600, color: "#6b7280" });
    
    centerText(ctx, fullName, 637, bodyY + 50, { fontSize: 36, weight: 800, color: "#123f64" });
    centerText(ctx, "Employee", 637, bodyY + 95, { fontSize: 26, weight: 500, color: "#6b7280", fontStyle: "italic" });

    const rowY = bodyY + 130;
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX + 20, rowY);
    ctx.lineTo(boxX + boxW - 20, rowY);
    ctx.stroke();
    centerText(ctx, `Contact No.: ${user.contact || "0912 345 6789"}`, 637, rowY + 15, { fontSize: 28, weight: 700, color: "#263746" });

    const rowY2 = rowY + 50;
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX + 20, rowY2);
    ctx.lineTo(boxX + boxW - 20, rowY2);
    ctx.stroke();
    centerText(ctx, `Emergency Contact: ${user.emergency_contact_name || "N/A"}`, 637, rowY2 + 15, { fontSize: 28, weight: 700, color: "#263746" });

    // ✅ IMPORTANT REMINDERS
    const remindersY = 850;
    const remindersTitle = "IMPORTANT REMINDERS";

    centerText(ctx, remindersTitle, 637, remindersY, { fontSize: 38, weight: 800, color: "#14527d" });

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
      centerText(ctx, line, 637, lineY, { fontSize: 36, weight: 600, color: "#374151" });
      lineY += 55;
    }

    // ✅ QR CODE
    const qrSize = 330;
    const qrX = (1275 - qrSize) / 2;
    const qrY = 1300 - (qrSize / 2);

    try {
      const qrDataUrl = await QRCode.toDataURL(user.student_number || user.employee_number || "NEXUSPASS-ID");
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
      centerText(ctx, "QR", 637, qrY + 130, { fontSize: 40, weight: 700, color: "#000000" });
    }

    centerText(ctx, "SCAN TO VERIFY ID", 637, qrY + qrSize + 15, { fontSize: 28, weight: 800, color: "#14527d" });
    centerText(ctx, "NEXUSPASS DIGITAL ID", 637, qrY + qrSize + 50, { fontSize: 22, weight: 500, color: "#6b7280" });

    // ✅ SIGNATORIES
    const signY = 1620;
    const adviserName = clean(user.adviser, "MARILOR F. CARMEN").toUpperCase();
    const schoolHeadName = clean(user.school_head, "ANDREW R. ABSALON").toUpperCase();

    const leftX = 250;
    centerText(ctx, adviserName, leftX, signY, { fontSize: 33, weight: 800, color: "#263746" });
    ctx.strokeStyle = "#4b5563";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(leftX - 130, signY + 40);
    ctx.lineTo(leftX + 130, signY + 40);
    ctx.stroke();
    centerText(ctx, "Adviser", leftX, signY + 55, { fontSize: 24, weight: 500, color: "#6b7280" });

    const rightX = 1275 - 250;
    centerText(ctx, schoolHeadName, rightX, signY, { fontSize: 33, weight: 800, color: "#263746" });
    ctx.strokeStyle = "#4b5563";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rightX - 130, signY + 40);
    ctx.lineTo(rightX + 130, signY + 40);
    ctx.stroke();
    centerText(ctx, "School Head", rightX, signY + 55, { fontSize: 24, weight: 500, color: "#6b7280" });
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

  function getFullName(user: User) {
    if (!user) return "";
    const cleaned = (user.middle_name || "").replace(/\./g, "").trim();
    const middleInitial = cleaned ? `${cleaned.charAt(0).toUpperCase()}.` : "";
    return [user.first_name, middleInitial, user.last_name].filter(Boolean).join(" ").toUpperCase();
  }

  function clean(value: string | null | undefined, fallback = "") {
    return value?.trim() || fallback;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="relative w-full max-w-4xl rounded-xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-700"
        >
          ✕ Close
        </button>

        <h2 className="mb-4 text-xl font-bold text-gray-800">
          {user.role === "student" ? "Student" : "Teacher"} ID Preview
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-center text-sm font-semibold text-gray-600">FRONT</h3>
            <canvas
              ref={frontCanvasRef}
              width={1275}
              height={1800}
              className="w-full rounded-lg shadow"
            />
          </div>
          <div>
            <h3 className="mb-2 text-center text-sm font-semibold text-gray-600">BACK</h3>
            <canvas
              ref={backCanvasRef}
              width={1275}
              height={1800}
              className="w-full rounded-lg shadow"
            />
          </div>
        </div>
      </div>
    </div>
  );
}