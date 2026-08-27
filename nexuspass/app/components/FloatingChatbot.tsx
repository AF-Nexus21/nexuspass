"use client";

import { useState } from "react";

type Message = {
  role: "user" | "bot";
  text: string;
};

const quickReplies = [
  "Paano mag-register?",
  "Magkano ang ID?",
  "Paano magbayad?",
  "Ano ang requirements sa photo?",
  "Saan ko makikita ang ID ko?",
];

const botResponses: Record<string, string> = {
  "paano mag-register?": "Pumunta sa Register Page. Piliin kung Student o Teacher ka. Punuan ang lahat ng required fields, sumang-ayon sa Terms & Conditions, at i-click ang 'Create Account'.",
  "magkano ang id?": "Ang ID ay nagkakahalaga ng ₱50.00. Pagkatapos mag-register, pumunta sa Payment page para mag-upload ng proof of payment.",
  "paano magbayad?": "Pumunta sa Payment page. Piliin ang payment method (GCash, Maya, etc.), i-upload ang screenshot ng proof of payment, at hintayin ang admin approval.",
  "ano ang requirements sa photo?": "Kailangan ng passport-size photo (3:4 ratio), nakasuot ng maayos (Barong, Polo, o Collared Shirt). Hindi tatanggapin ang naka-sando o walang pang-itaas.",
  "saan ko makikita ang id ko?": "Pagkatapos ma-approve ang payment, pumunta sa Student/Teacher Dashboard. Makikita mo ang preview ng ID mo at pwedeng i-download bilang PNG.",
  "default": "Pasensya na, hindi ko pa nasasagot yan. Paki-email kami sa support@example.com o mag-iwan ng feedback sa amin."
};

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Kumusta! Ako si NEXUSPASS Assistant. Ano ang gusto mong malaman? 😊" }
  ]);
  const [input, setInput] = useState("");

  function handleQuickReply(question: string) {
    const lower = question.toLowerCase();
    const response = botResponses[lower] || botResponses["default"];
    
    setMessages((prev) => [
      ...prev,
      { role: "user", text: question },
      { role: "bot", text: response }
    ]);
  }

  function handleSend() {
    if (!input.trim()) return;
    const question = input.trim();
    const lower = question.toLowerCase();
    const response = botResponses[lower] || botResponses["default"];
    
    setMessages((prev) => [
      ...prev,
      { role: "user", text: question },
      { role: "bot", text: response }
    ]);
    setInput("");
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
      >
        {isOpen ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-blue-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                N
              </div>
              <div>
                <p className="text-sm font-bold text-white">NEXUSPASS Assistant</p>
                <p className="text-xs text-blue-200">Laging naka-online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-blue-200">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-blue-600 text-white"
                      : "rounded-bl-sm bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Replies */}
          <div className="flex flex-wrap gap-2 border-t border-gray-100 px-3 py-2">
            {quickReplies.map((q) => (
              <button
                key={q}
                onClick={() => handleQuickReply(q)}
                className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600 transition hover:bg-blue-100"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-gray-100 p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Mag-type ng tanong..."
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSend}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}