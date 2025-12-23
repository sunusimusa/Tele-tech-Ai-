const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("message");
const statusEl = document.getElementById("status");

/* ================= CHAT ================= */
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  addMessage("You", text);
  messageInput.value = "";
  statusEl.innerText = "⏳ AI na tunani...";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    if (data.reply) {
      addMessage("AI", data.reply);
      statusEl.innerText = "";
    } else {
      statusEl.innerText = "❌ Error daga AI";
    }
  } catch (err) {
    statusEl.innerText = "❌ Network error";
  }
}

function addMessage(sender, text) {
  const div = document.createElement("div");
  div.innerHTML = `<b>${sender}:</b> ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* ================= PAYSTACK ================= */
function upgrade(days, amount) {
  const handler = PaystackPop.setup({
    key: "pk_live_193ec0bed7f25a41f8d9ab473ebfdd4d55db13ba", // 🔴 SAKA NAKA
    email: "user@teleai.app",
    amount: amount * 100,
    currency: "NGN",
    callback: function (response) {
      statusEl.innerText = "✅ Payment successful!";
      // daga baya zaka kira /verify-payment
    },
    onClose: function () {
      statusEl.innerText = "❌ Payment cancelled";
    }
  });

  handler.openIframe();
}
