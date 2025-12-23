// public/app.js

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");

/* ADD MESSAGE TO UI */
function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = sender === "user" ? "msg user" : "msg ai";
  div.innerText = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* SEND MESSAGE */
sendBtn.onclick = async () => {
  const text = input.value.trim();
  if (!text) return;

  // (N) USER MESSAGE
  addMessage(text, "user");
  input.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    if (data.reply) {
      // (A) AI MESSAGE
      addMessage("AI: " + data.reply, "ai");
    } else {
      addMessage("❌ AI error", "ai");
    }

  } catch (err) {
    addMessage("❌ Server error", "ai");
  }
};
