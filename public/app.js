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
