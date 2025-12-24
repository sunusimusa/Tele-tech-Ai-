// =====================
// ELEMENTS
// =====================
const chatBox  = document.getElementById("chatBox");
const sendBtn  = document.getElementById("sendBtn");
const msgInput = document.getElementById("message");
const statusEl = document.getElementById("status");

// =====================
// FREE LIMIT (12)
// =====================
const FREE_LIMIT = 12;

let usage = JSON.parse(localStorage.getItem("usage") || "{}");
const today = new Date().toDateString();

if (usage.date !== today) {
  usage = { count: 0, date: today };
  localStorage.setItem("usage", JSON.stringify(usage));
}

// =====================
// CHAT SEND
// =====================
sendBtn.addEventListener("click", async () => {
  const text = msgInput.value.trim();
  if (!text) return;

  // ❌ FREE LIMIT CHECK
  if (usage.count >= FREE_LIMIT) {
    statusEl.innerText =
      "❌ Free limit (12 messages) ya cika. Don Allah ka upgrade zuwa PRO.";
    return;
  }

  // SHOW USER MSG
  chatBox.innerHTML += `<p><b>You:</b> ${text}</p>`;
  msgInput.value = "";
  statusEl.innerText = "⏳ AI na tunani...";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    if (data.reply) {
      chatBox.innerHTML += `<p><b>AI:</b> ${data.reply}</p>`;
      chatBox.scrollTop = chatBox.scrollHeight;

      usage.count++;
      localStorage.setItem("usage", JSON.stringify(usage));

      statusEl.innerText =
        `✅ ${FREE_LIMIT - usage.count} free messages saura`;
    } else {
      statusEl.innerText = "❌ Error daga AI";
    }
  } catch (err) {
    statusEl.innerText = "❌ Network error";
  }
});

// =====================
// PAYSTACK PRO UPGRADE
// =====================
function upgrade(days, amount) {
  const handler = PaystackPop.setup({
    key: "pk_live_193ec0bed7f25a41f8d9ab473ebfdd4d55db13ba", // 🔴 SAKA NAKA
    email: "user@teleai.app",
    amount: amount * 100,
    currency: "NGN",
    callback: function (response) {
      alert("🎉 Payment successful! PRO activated.");

      // PRO → unlimited
      usage.count = -9999;
      localStorage.setItem("usage", JSON.stringify(usage));
      statusEl.innerText = "🚀 PRO user – unlimited chat!";
    }
  });

  handler.openIframe();
}

// =====================
// PRO BUTTONS
// =====================
document.getElementById("pro7").onclick  = () => upgrade(7, 500);
document.getElementById("pro14").onclick = () => upgrade(14, 900);
document.getElementById("pro30").onclick = () => upgrade(30, 1500);
