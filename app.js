const express = require("express");
const axios = require("axios");

const app = express();

function getNextPrayer(timings) {
  const now = new Date();

  const prayers = [
    { name: "Fajr", time: timings.Fajr },
    { name: "Dhuhr", time: timings.Dhuhr },
    { name: "Asr", time: timings.Asr },
    { name: "Maghrib", time: timings.Maghrib },
    { name: "Isha", time: timings.Isha },
  ];

  for (let p of prayers) {
    const [h, m] = p.time.split(":");

    const t = new Date();
    t.setHours(h);
    t.setMinutes(m);
    t.setSeconds(0);

    if (t > now) {
      const diff = Math.floor((t - now) / 60000);
      return {
        name: p.name,
        minutes: diff
      };
    }
  }

  // si tout est passé → demain Fajr
  const [h, m] = timings.Fajr.split(":");
  const t = new Date();
  t.setDate(t.getDate() + 1);
  t.setHours(h);
  t.setMinutes(m);

  const diff = Math.floor((t - now) / 60000);

  return {
    name: "Fajr",
    minutes: diff
  };
}

function getSmartMode(next) {
  if (next.minutes <= 0) return "NOW";
  if (next.minutes <= 10) return "URGENT";
  if (next.minutes <= 60) return "SOON";
  return "NORMAL";
}

app.get("/", async (req, res) => {

  const city = req.query.city || "Tunis";
  const country = req.query.country || "Tunisia";

  const response = await axios.get(
    `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}`
  );

  const timings = response.data.data.timings;

  const next = getNextPrayer(timings);
  const mode = getSmartMode(next);

  let frames = [];

  // 🟢 MODE NORMAL
  if (mode === "NORMAL") {
    frames = [
      { text: `${city}` },
      { text: `${next.name}` },
      { text: `dans ${next.minutes} min` }
    ];
  }

  // 🟡 MODE PROCHE
  else if (mode === "SOON") {
    frames = [
      { text: `${next.name} bientôt` },
      { text: `${next.minutes} min` },
      { text: `${city}` }
    ];
  }

  // 🔴 MODE URGENT
  else if (mode === "URGENT") {
    frames = [
      { text: `${next.name} proche` },
      { text: `${next.minutes} min` }
    ];
  }

  // ⚫ MODE NOW
  else {
    frames = [
      { text: `${next.name} maintenant` },
      { text: `Pray Time` }
    ];
  }

  res.json({ frames });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Smart Prayer App running on port " + PORT);
});