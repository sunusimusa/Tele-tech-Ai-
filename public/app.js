const LIMIT_HOURS = 8;

function canChat() {
  const start = localStorage.getItem("chatStart");
  if (!start) {
    localStorage.setItem("chatStart", Date.now());
    return true;
  }
  const diff = (Date.now() - Number(start)) / (1000 * 60 * 60);
  return diff < LIMIT_HOURS;
}

async function send() {
  const box = document.getElementById("reply");
  box.innerHTML = "";

  if (!canChat()) {
    box.innerHTML = "⛔ Free limit reached. Watch ad or upgrade to Pro.";
    return;
  }

  const msg = document.getElementById("msg").value;
  if (!msg) return;

  box.innerHTML = "⏳ Thinking...";

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: msg })
  });

  const data = await res.json();

  if (data.reply) {
    box.innerHTML = data.reply;
  } else {
    box.innerHTML = "<span class='error'>AI error</span>";
  }
}
