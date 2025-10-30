/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const workerURL ='https://project8-chatbot.myin5.workers.dev/';

const SYSTEM_PROMPT = `
You are L’Oréal’s Beauty Assistant.

SCOPE:
- Answer only questions related to L’Oréal: products (haircare, skincare, makeup, fragrance), routines, ingredients, shade matching, application techniques, product comparisons within L’Oréal portfolio, and shopping guidance (where to find, how to choose).
- It’s fine to discuss general beauty topics when helpful to explain L’Oréal recommendations (e.g., “what does niacinamide do?”), but steer the user back to L’Oréal options.

CONDUCT:
- Be concise, friendly, and practical. Use clear steps or short bullet points when appropriate.
- Always prefer L’Oréal brands and lines in suggestions. If you truly don’t know, say so briefly.
- If the user tells you their name, remember it and use it in future replies in a friendly, natural way.
- Use prior conversation context when answering follow-up questions.
- If unclear, ask clarifying questions rather than making assumptions.

REFUSALS:
- If a request is unrelated to L’Oréal or beauty (e.g., coding, math, politics), politely refuse and say you can help with L’Oréal products and beauty advice instead.
- Do not provide medical diagnoses. For medical concerns, advise consulting a professional.

OUTPUT:
- Keep answers under 6 short paragraphs. Provide product names clearly and, when helpful, routine steps with AM/PM notes.
`;

const messages = [
  { role: "system", content: SYSTEM_PROMPT },
];

// Set initial message
appendMessage("ai", "👋 Hello! I’m the L’Oréal Beauty Assistant. How can I help with products or routine advice today?");


// Handle form submit
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = (userInput.value || "").trim();
  if (!text) return;

  // Show user message
  appendMessage("user", text);
  userInput.value = "";

  // Add to message history
  messages.push({ role: "user", content: text });

  // Typing indicator
  const typingId = appendMessage("system", "…thinking");
  try {
    const reply = await fetchReply(messages);
    removeMessageById(typingId);

    appendMessage("user", text); // ← displays latest question again
    // Keep history and show reply
    messages.push({ role: "assistant", content: reply });appendMessage("ai", reply);
  } catch (err) {
    removeMessageById(typingId);
    console.error(err);
    appendMessage("ai", "Sorry—I'm having trouble right now. Please try again.");
  }
});

// ---- helpers ----
function appendMessage(role, text) {
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  el.textContent = text;
  el.dataset.msgId = cryptoRandomId();
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return el.dataset.msgId;
}

async function fetchReply(messages) {
  const res = await fetch(workerURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      messages
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Worker error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error("No content returned from API.");
  return reply.trim();
}