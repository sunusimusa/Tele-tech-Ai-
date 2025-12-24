const chatBox = document.getElementById("chatBox");
const sendBtn = document.getElementById("sendBtn");
const msgInput = document.getElementById("message");
const statusEl = document.getElementById("status");

// CHAT
sendBtn.addEventListener("click", async () => {
  const text = msgInput.value.trim();
  if (!text) return;

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
      statusEl.innerText = "";
    } else {
      statusEl.innerText = "❌ Error daga AI";
    }
  } catch (e) {
    statusEl.innerText = "❌ Network error";
  }
});

// PAYSTACK FUNCTION
function upgrade(days, amount) {
  const handler = PaystackPop.setup({
    key: "pk_live_193ec0bed7f25a41f8d9ab473ebfdd4d55db13ba", // 🔴 saka naka
    email: "user@teleai.app",
    amount: amount * 100,
    currency: "NGN",
    callback: function (response) {
      alert("Payment success!");
      console.log("Ref:", response.reference);
    }
  });
  handler.openIframe();
}

// PRO BUTTONS
document.getElementById("pro7").onclick  = () => upgrade(7, 500);
document.getElementById("pro14").onclick = () => upgrade(14, 900);
document.getElementById("pro30").onclick = () => upgrade(30, 1500);
