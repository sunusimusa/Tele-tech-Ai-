const express = require("express");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================= PAYSTACK ================= */
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

/* ================= HOME ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================= GENERATE IMAGE (FREE) ================= */
/* A nan kana hada AI dinka, yanzu mock ne */
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.json({ error: "Prompt required" });
  }

  // ⚠️ 
  const fakeImage =
    "https://picsum.photos/1024/1024?random=" + Date.now();

  res.json({
    image: fakeImage
  });
});

/* ================= VERIFY PAYMENT ================= */
app.post("/verify-payment", async (req, res) => {
  const { reference } = req.body;

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`
        }
      }
    );

    if (response.data.data.status === "success") {
      return res.json({ success: true });
    } else {
      return res.json({ success: false });
    }
  } catch (err) {
    console.error("VERIFY ERROR:", err.message);
    res.status(500).json({ success: false });
  }
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
