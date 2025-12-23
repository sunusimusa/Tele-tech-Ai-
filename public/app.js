const chatBox = document.getElementById("chat");
const input = document.getElementById("msg");
const status = document.getElementById("status");

const email =
  localStorage.getItem("email") ||
  prompt("Enter your email");

localStorage.setItem("email", email);

async function sendMsg() {
  const text = input.value.trim();
  if (!text) return;

  chatBox.innerHTML += `<p><b>You:</b> ${text}</p>`;
  input.value = "";

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, message: text })
  });

  const data = await res.json();

  if (data.locked) {
    status.innerText = "🔒 Free time finished. Upgrade to PRO.";
    return;
  }

  chatBox.innerHTML += `<p><b>AI:</b> ${data.reply}</p>`;
  status.innerText = "⏳ " + data.remaining;
}
function pay(amount, days) {
  let handler = PaystackPop.setup({
    key: "pk_live_193ec0bed7f25a41f8d9ab473ebfdd4d55db13ba",
    email: "user@example.com",
    amount: amount * 100,
    currency: "NGN",
    callback: function (response) {
      fetch("/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: response.reference,
          days: days
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("PRO ya kunna na kwanaki " + data.proDays);
        } else {
          alert("Biyan bai yi nasara ba");
        }
      });
    },
    onClose: function () {
      alert("An rufe biya");
    }
  });

  handler.openIframe();
}
