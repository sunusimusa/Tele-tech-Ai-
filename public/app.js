const userId = localStorage.getItem("uid") || crypto.randomUUID();
localStorage.setItem("uid", userId);

async function send() {
  const msg = document.getElementById("msg").value;
  document.getElementById("status").innerText = "⏳";

  const r = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, message: msg })
  });

  const data = await r.json();

  if (data.error === "LIMIT_REACHED") {
    document.getElementById("status").innerText = "❌ Free time finished";
    return;
  }

  if (data.reply) {
    document.getElementById("reply").innerText = data.reply;
    document.getElementById("status").innerText = "✅";
  } else {
    document.getElementById("status").innerText = "❌ AI error";
  }
}

function pay(plan, amount) {
  PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY, // injected by server
    email: "user@tele.ai",
    amount: amount * 100,
    callback: function (res) {
      fetch("/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: res.reference,
          userId,
          plan
        })
      }).then(() => alert("✅ Pro activated"));
    }
  }).openIframe();
}
