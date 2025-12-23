async function sendMsg() {
  const msg = document.getElementById("msg").value;
  document.getElementById("status").innerText = "Loading...";

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: msg })
  });

  const data = await res.json();

  if (data.error) {
    document.getElementById("status").innerText = data.error;
    return;
  }

  document.getElementById("chat").innerHTML +=
    `<p><b>AI:</b> ${data.reply}</p>`;
  document.getElementById("status").innerText = "✅";
}

function pay(plan, amount) {
  const handler = PaystackPop.setup({
    key: "pk_live_193ec0bed7f25a41f8d9ab473ebfdd4d55db13ba", // 👉 PUBLIC KEY
    email: "user@teleai.com",
    amount: amount * 100,
    currency: "NGN",
    callback: function (res) {
      fetch("/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: res.reference, plan })
      }).then(() => alert("Upgrade successful"));
    }
  });
  handler.openIframe();
}
