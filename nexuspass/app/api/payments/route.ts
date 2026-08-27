import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// SERVER-SIDE CLIENT (May buong access, hindi apektado ng RLS)
const serverSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 1. FUNCTION PARA I-VALIDATE ANG AMOUNT
function validateAmount(amount: number): string | null {
  if (isNaN(amount) || amount < 1 || amount > 500) {
    return "Amount must be between 1 and 500 PHP.";
  }
  return null;
}

// 2. FUNCTION PARA I-VALIDATE ANG EMAIL
function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format.";
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.json();
    const { user_id, user_name, user_email, amount, payment_method, proof_url, reference_number } = formData;

    // 3. VALIDATION: LAHAT NG FIELD AY DAPAT MAY LAMAN
    if (!user_id || !user_name || !user_email || !amount || !payment_method || !proof_url || !reference_number) {
      return NextResponse.json({ error: "Please fill out all required fields." }, { status: 400 });
    }

    // 4. VALIDATE ANG AMOUNT (SERVER-SIDE)
    const amountError = validateAmount(amount);
    if (amountError) {
      return NextResponse.json({ error: amountError }, { status: 400 });
    }

    // 5. VALIDATE ANG EMAIL (SERVER-SIDE)
    const emailError = validateEmail(user_email);
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }

    // 6. I-SAVE ANG PAYMENT SA DATABASE
    const { error: paymentError } = await serverSupabase
      .from("payments")
      .insert({
        profile_id: user_id,
        user_name: user_name,
        user_email: user_email,
        amount: amount,
        payment_method: payment_method,
        status: "pending",
        proof_url: proof_url,
        reference_number: reference_number,
      });

    if (paymentError) {
      return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Payment submitted successfully!" });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}