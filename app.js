const express = require("express");
const axios = require("axios");

const app = express();

/* =========================
   TIME TUNIS
========================= */
function getNowTunis() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Africa/Tunis"
    })
  );
}

/* =========================
   NEXT PRAYER CALC
========================= */
function getNextPrayer(timings) {

  const now = getNowTunis();

  const prayers = [
    { name: "Fajr", time: timings.Fajr },
    { name: "Dhuhr", time: timings.Dhuhr },
    { name: "Asr", time: timings.Asr },
    { name: "Maghrib", time: timings.Maghrib },
    { name: "Isha", time: timings.Isha }
  ];

  for (let p of prayers) {

    const [h, m] = p.time.split(":");

    const t = getNowTunis();
    t.setHours(parseInt(h));
    t.setMinutes(parseInt(m));
    t.setSeconds(0);

    if (t > now) {
      return {
        name: p.name,
        time: p.time,
        minutes: Math.floor((t - now) / 60000)
      };
    }
  }

  // next day Fajr
  const [h, m] = timings.Fajr.split(":");

  const t = getNowTunis();
  t.setDate(t.getDate() + 1);
  t.setHours(parseInt(h));
  t.setMinutes(parseInt(m));

  return {
    name: "Fajr",
    time: timings.Fajr,
    minutes: Math.floor((t - now) / 60000)
  };
}

/* =========================
   ROUTE
========================= */
app.get("/", async (req, res) => {

  try {

    // 📍 LaMetric settings (city selection)
    const city = req.query.city || "Tunis";
    const country = req.query.country || "Tunisia";

    // 🌐 API
    const response = await axios.get(
      `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}`
    );

    const timings = response.data.data.timings;
    const next = getNextPrayer(timings);

    let frames = [];
    let priority = "normal";
    let sound = undefined;

    /* =========================
       🔴 URGENT MODE (PRAYER NOW)
    ========================= */
    if (next.minutes <= 0) {

      priority = "critical";
      sound = "notification";

      frames = [
        { icon: "28895", text: next.name + " NOW" },
        { icon: "1609", text: "Prayer Time" },
        { icon: "27335", text: city }
      ];
    }

    /* =========================
       🟡 SOON MODE
    ========================= */
    else if (next.minutes <= 10) {

      priority = "warning";

      frames = [
        { icon: "28895", text: next.name + " soon" },
        { icon: "42893", text: next.minutes + " min" },
        { icon: "1609", text: next.time }
      ];
    }

    /* =========================
       🟢 NORMAL MODE
    ========================= */
    else {

      frames = [
        { icon: "27335", text: city },
        { icon: "28895", text: next.name },
        { icon: "1609", text: next.time },
        { icon: "42893", text: next.minutes + " min" }
      ];
    }

    // 📤 RESPONSE LAMETRIC
    res.json({
      frames,
      priority,
      sound
    });

  } catch (err) {

    res.json({
      frames: [
        { icon: "i521", text: "Error" },
        { icon: "i495", text: "Prayer App" }
      ]
    });

  }

});

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🕌 Salat Buddy running on port " + PORT);
});