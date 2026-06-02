const express = require("express");
const axios = require("axios");

const app = express();

app.get("/", async (req, res) => {

  const response = await axios.get(
    "https://api.aladhan.com/v1/timingsByCity?city=Tunis&country=Tunisia"
  );

  const timings = response.data.data.timings;

  res.json({
    frames: [
      {
        text: `🕌 Fajr ${timings.Fajr}`
      }
    ]
  });

});

// IMPORTANT Render utilise process.env.PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Serveur démarré sur port " + PORT);
});