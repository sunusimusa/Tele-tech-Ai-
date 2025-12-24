const chatBox = document.getElementById("chatBox");
const sendBtn = document.getElementById("sendBtn");
const msgInput = document.getElementById("message");
const statusEl = document.getElementById("status");

/* ======================
   SEND MESSAGE
====================== */
sendBtn.addEventListener("click", async () => {
  const text = msgInput.value.trim();
  if (!text) return;

  addMsg("You", text);
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
      addMsg("AI", data.reply);
      statusEl.innerText = "";
    } else {
      statusEl.innerText = "❌ Error daga AI";
    }
  } catch (err) {
    statusEl.innerText = "❌ Network error";
  }
});

function addMsg(sender, text) {
  const div = document.createElement("div");
  div.innerHTML = `<b>${sender}:</b> ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* ======================
   PAYSTACK UPGRADE
====================== */
document.querySelectorAll(".upgradeBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    const days = btn.dataset.days;
    const amount = btn.dataset.amount;

    payWithPaystack(days, amount);
  });
});

function payWithPaystack(days, amount) {
  const handler = PaystackPop.setup({
    key: "PK_TEST_OR_LIVE_KEY_ANAN", // 🔴 SAKA KEY DINKA
    email: "user@teleai.app",
    amount: amount * 100,
    currency: "NGN",
    callback: function (response) {
      statusEl.innerText = "✅ Payment successful. PRO activated!";
      console.log("Reference:", response.reference);

      // zaka iya kiran /verify-payment anan
    },
    onClose: function () {
      statusEl.innerText = "❌ Payment cancelled";
    }
  });

  handler.openIframe();
}
