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

    const prayerTime = new Date();
    prayerTime.setHours(h);
    prayerTime.setMinutes(m);
    prayerTime.setSeconds(0);

    if (prayerTime > now) {
      const diffMin = Math.floor((prayerTime - now) / 60000);

      return {
        name: p.name,
        minutes: diffMin
      };
    }
  }

  // si toutes les prières sont passées → demain Fajr
  const [h, m] = timings.Fajr.split(":");
  const prayerTime = new Date();
  prayerTime.setDate(prayerTime.getDate() + 1);
  prayerTime.setHours(h);
  prayerTime.setMinutes(m);

  const diffMin = Math.floor((prayerTime - now) / 60000);

  return {
    name: "Fajr",
    minutes: diffMin
  };
}

app.get("/", async (req, res) => {
  const response = await axios.get(
    "https://api.aladhan.com/v1/timingsByCity?city=Tunis&country=Tunisia"
  );

  const timings = response.data.data.timings;

  const next = getNextPrayer(timings);

  res.json({
    frames: [
      {
        text: `🕌 ${next.name}`
      },
      {
        text: `⏳ dans ${next.minutes} min`
      }
    ]
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Serveur démarré sur port " + PORT);
});