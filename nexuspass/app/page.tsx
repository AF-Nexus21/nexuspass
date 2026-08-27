"use client";

import { useEffect } from "react";
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";

export default function LandingPage() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 100,
    });
  }, []);

  return (
    <main 
      className="min-h-screen bg-white"
      style={{
        background: "linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)"
      }}
    >
      {/* ===== NAVBAR ===== */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                A
              </div>
              <span className="text-xl font-bold text-gray-800">AF-NEXUS</span>
            </div>

            <div className="hidden items-center gap-6 md:flex">
              <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                Features
              </Link>
              <Link href="#projects" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                Projects
              </Link>
              <Link href="#feedback" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                Feedback
              </Link>
              {/* ✅ LOGIN BUTTON */}
              <Link href="/login" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                Login
              </Link>
              {/* ✅ CREATE YOUR ID BUTTON */}
              <Link
                href="/register"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Create Your ID
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div data-aos="fade-up">
              <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">
                AF-NEXUS: Smarter School Management Starts Here
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Pinapadali ng AF-NEXUS ang pamamahala ng mga paaralan sa pamamagitan ng isang integrated platform para sa student records, school forms, classroom assessments, at administrative workflows—na nakakatipid sa oras at nagpapahusay sa organisasyon ng buong institusyon.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="relative" data-aos="fade-left">
                <div className="absolute -inset-4 rounded-2xl bg-blue-100 blur-2xl opacity-50" />
                <div className="relative rounded-2xl bg-white p-8 shadow-xl">
                  {/* ✅ FLOATING ANIMATION */}
                  <div className="animate-float">
                    <img
                      src="/af-nexus-hero.png"
                      alt="AF-NEXUS Education Management Platform"
                      className="h-auto w-full rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center" data-aos="fade-up">
            <h2 className="text-3xl font-bold text-gray-900">Features</h2>
            <p className="mt-2 text-gray-600">
              Ang AF-NEXUS ay may kumpletong solusyon para sa school management.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-lg" data-aos="fade-up" data-aos-delay="100">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                📥
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Student Records</h3>
              <p className="mt-2 text-sm text-gray-600">
                Pamahalaan ang impormasyon ng mga estudyante nang maayos at secure.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg" data-aos="fade-up" data-aos-delay="200">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                📄
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Student IDs & School Forms</h3>
              <p className="mt-2 text-sm text-gray-600">
                Gumawa ng student IDs at automated school forms (SF1, SF2, SF9, SF10).
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg" data-aos="fade-up" data-aos-delay="300">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                💡
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Classroom Assessments</h3>
              <p className="mt-2 text-sm text-gray-600">
                Magsagawa ng assessments, TOS, at competency-based instructional planning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROJECTS SECTION ===== */}
      <section id="projects" className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center" data-aos="fade-up">
            <h2 className="text-3xl font-bold text-gray-900">Our Projects</h2>
            <p className="mt-2 text-gray-600">
              Explore our latest digital solutions for education.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {/* Project 1 - NEXUSPASS */}
            <div className="overflow-hidden rounded-xl bg-white shadow-lg" data-aos="fade-right">
              {/* ✅ HERO BANNER - GAMIT ANG IMAGE */}
              <div className="relative h-48 w-full overflow-hidden bg-blue-600">
                <img
                  src="/nexuspass-hero.png"
                  alt="NEXUSPASS"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6">
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Active Project</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">NEXUSPASS</h3>
                <p className="mt-2 text-sm">Digital School ID System</p>
                <p className="mt-3 text-sm text-gray-600">
                  A complete digital ID solution for students and teachers. Features include bulk upload, bulk download, QR code verification, and payment system.
                </p>
                <Link href="/login" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                  Visit NEXUSPASS
                </Link>
              </div>
            </div>

            {/* Project 2 - PROJECT LIKHA */}
            <div className="overflow-hidden rounded-xl bg-white shadow-lg" data-aos="fade-left">
              <div className="relative h-48 w-full overflow-hidden bg-green-600">
                <img
                  src="/project-likha.png"
                  alt="PROJECT LIKHA"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6">
                <p className="text-sm font-semibold uppercase tracking-wider text-green-600">Coming Soon</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">PROJECT LIKHA</h3>
                <p className="mt-2 text-sm">An Integrated Learner Information and Assessment Management System</p>
                <p className="mt-3 text-sm text-gray-600">
                  Automates school form generation and competency-based instructional planning. Streamlines learner records, supports competency-based planning, reduces errors, and saves time.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">SF1</span>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">SF2</span>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">SF9</span>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">SF10</span>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">E-Class</span>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">MASK B</span>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">TOS</span>
                </div>
                {/* ✅ PALITAN NATIN ITO: MULA "Coming Soon" PAPUNTA SA LIVE URL */}
                <Link href="https://project-likha.vercel.app" className="mt-4 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700">
                  Visit Project LIKHA
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEEDBACK SECTION ===== */}
      <section id="feedback" className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center" data-aos="fade-up">
            <h2 className="text-3xl font-bold text-gray-900">Feedback</h2>
            <p className="mt-2 text-gray-600">Hear what our users are saying.</p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-lg" data-aos="fade-up" data-aos-delay="100">
              <div className="flex items-center gap-1 text-yellow-400">★★★★★</div>
              <p className="mt-4 text-sm text-gray-600">"NEXUSPASS has made our ID process so much easier. We can now upload and download all student IDs in minutes!"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">M</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Marilor Carmen</p>
                  <p className="text-xs text-gray-500">Adviser</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg" data-aos="fade-up" data-aos-delay="200">
              <div className="flex items-center gap-1 text-yellow-400">★★★★★</div>
              <p className="mt-4 text-sm text-gray-600">"The QR code verification feature is amazing! It makes checking student IDs so much faster."</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 font-semibold">A</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Andrew Absalon</p>
                  <p className="text-xs text-gray-500">School Head</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg" data-aos="fade-up" data-aos-delay="300">
              <div className="flex items-center gap-1 text-yellow-400">★★★★★</div>
              <p className="mt-4 text-sm text-gray-600">"As a student, I can easily download my ID anytime. The payment system is also very convenient!"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-semibold">J</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Juan Dela Cruz</p>
                  <p className="text-xs text-gray-500">Student</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-lg font-bold">AF-NEXUS</h3>
              <p className="mt-2 text-sm text-gray-400">Smarter School Management Starts Here.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold">Quick Links</h3>
              <ul className="mt-2 space-y-2 text-sm text-gray-400">
                <li><Link href="/login" className="hover:text-white">Login</Link></li>
                <li><Link href="/register" className="hover:text-white">Register</Link></li>
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#projects" className="hover:text-white">Projects</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold">Contact</h3>
              <ul className="mt-2 space-y-2 text-sm text-gray-400">
                <li>Argie R. Fenis</li>
                <li>San Pablo, Mandaon, Masbate</li>
                <li>argie.fenis001@deped.gov.ph</li>
                <li>FB Name: RG Fenis</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold">Follow Us</h3>
              <div className="mt-2 flex gap-4">
                <a href="https://www.facebook.com/rg.fenis" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            © 2026 AF-NEXUS. All rights reserved. Developed by Argie R. Fenis
          </div>
        </div>
      </footer>

      {/* ===== CUSTOM CSS FOR FLOATING ANIMATION ===== */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}