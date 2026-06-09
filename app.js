const express = require("express");
const axios = require("axios");

const app = express();

function getTunisTime() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Africa/Tunis"
    })
  );
}

function getNextPrayer(timings) {

  const now = getTunisTime();

  const prayers = [
    { name: "Fajr", time: timings.Fajr },
    { name: "Dhuhr", time: timings.Dhuhr },
    { name: "Asr", time: timings.Asr },
    { name: "Maghrib", time: timings.Maghrib },
    { name: "Isha", time: timings.Isha }
  ];

  for (const prayer of prayers) {

    const [h, m] = prayer.time.split(":");

    const prayerTime = getTunisTime();

    prayerTime.setHours(parseInt(h));
    prayerTime.setMinutes(parseInt(m));
    prayerTime.setSeconds(0);
    prayerTime.setMilliseconds(0);

    if (prayerTime > now) {

      const diffMinutes = Math.floor(
        (prayerTime - now) / 60000
      );

      return {
        name: prayer.name,
        time: prayer.time,
        minutes: diffMinutes
      };
    }
  }

  // Toutes les prières du jour sont passées
  const [h, m] = timings.Fajr.split(":");

  const tomorrowFajr = getTunisTime();

  tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
  tomorrowFajr.setHours(parseInt(h));
  tomorrowFajr.setMinutes(parseInt(m));
  tomorrowFajr.setSeconds(0);
  tomorrowFajr.setMilliseconds(0);

  const diffMinutes = Math.floor(
    (tomorrowFajr - now) / 60000
  );

  return {
    name: "Fajr",
    time: timings.Fajr,
    minutes: diffMinutes
  };
}

app.get("/", async (req, res) => {

  try {

    const city = req.query.city || "Tunis";
    const country = req.query.country || "Tunisia";

    const response = await axios.get(
      `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}`
    );

    const timings = response.data.data.timings;

    const next = getNextPrayer(timings);

    res.json({
      frames: [
        {
          text: city
        },
        {
          text: next.name
        },
        {
          text: next.time
        },
        {
          text: `${next.minutes} min`
        }
      ]
    });

  } catch (error) {

    res.json({
      frames: [
        {
          text: "Prayer Error"
        }
      ]
    });

  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Smart Prayer App running on port ${PORT}`);
});