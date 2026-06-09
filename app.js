const express = require("express");
const axios = require("axios");

const app = express();

/* =========================
   TIMEZONE TUNIS
========================= */
function getTunisNow() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Africa/Tunis"
    })
  );
}

/* =========================
   NEXT PRAYER
========================= */
function getNextPrayer(timings) {

  const now = getTunisNow();

  const prayers = [
    { name: "Fajr", time: timings.Fajr },
    { name: "Dhuhr", time: timings.Dhuhr },
    { name: "Asr", time: timings.Asr },
    { name: "Maghrib", time: timings.Maghrib },
    { name: "Isha", time: timings.Isha }
  ];

  for (const p of prayers) {

    const [h, m] = p.time.split(":");

    const t = getTunisNow();
    t.setHours(parseInt(h));
    t.setMinutes(parseInt(m));
    t.setSeconds(0);
    t.setMilliseconds(0);

    if (t > now) {
      return {
        name: p.name,
        time: p.time,
        minutes: Math.floor((t - now) / 60000)
      };
    }
  }

  // demain Fajr
  const [h, m] = timings.Fajr.split(":");

  const t = getTunisNow();
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
   RAMADAN MODE SIMPLE
========================= */
function isRamadan() {
  const month = new Date().getMonth() + 1;
  return month === 3 || month === 4; // approx
}

function getRamadanEvent(timings) {

  const now = getTunisNow();

  const suhoor = timings.Imsak;
  const iftar = timings.Maghrib;

  const [h1, m1] = suhoor.split(":");
  const [h2, m2] = iftar.split(":");

  let suhoorTime = getTunisNow();
  suhoorTime.setHours(parseInt(h1), parseInt(m1), 0);

  let iftarTime = getTunisNow();
  iftarTime.setHours(parseInt(h2), parseInt(m2), 0);

  if (now < suhoorTime) {
    return {
      name: "Suhoor",
      time: suhoor,
      minutes: Math.floor((suhoorTime - now) / 60000)
    };
  }

  return {
    name: "Iftar",
    time: iftar,
    minutes: Math.floor((iftarTime - now) / 60000)
  };
}

/* =========================
   MAIN ROUTE
========================= */
app.get("/", async (req, res) => {

  try {

    const city = req.query.city || "Tunis";
    const country = req.query.country || "Tunisia";

    const response = await axios.get(
      `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}`
    );

    const timings = response.data.data.timings;

    let next;

    if (isRamadan()) {
      next = getRamadanEvent(timings);
    } else {
      next = getNextPrayer(timings);
    }

    let frames = [];
    let priority = "normal";
    let sound = undefined;

    /* =========================
       🔴 URGENT MODE
    ========================= */
    if (next.minutes <= 0) {

      priority = "critical";
      sound = "notification";

      frames = [
        { icon: "i521", text: `${next.name} NOW` },
        { icon: "i495", text: "Prayer Time" },
        { icon: "i338", text: city }
      ];
    }

    /* =========================
       🟡 SOON MODE
    ========================= */
    else if (next.minutes <= 10) {

      priority = "warning";

      frames = [
        { icon: "i497", text: `${next.name} soon` },
        { icon: "i302", text: `${next.minutes} min` },
        { icon: "i346", text: next.time }
      ];
    }

    /* =========================
       🟢 NORMAL MODE
    ========================= */
    else {

      frames = [
        { icon: "i338", text: city },
        { icon: "i495", text: next.name },
        { icon: "i346", text: next.time },
        { icon: "i302", text: `${next.minutes} min` }
      ];
    }

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
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🕌 Salat Buddy running on port " + PORT);
});