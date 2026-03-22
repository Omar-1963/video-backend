const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

// 📁 downloads folder
const downloadPath = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadPath)) {
  fs.mkdirSync(downloadPath);
}

// ✅ test route
app.get("/", (req, res) => {
  res.send("Server is working ✅");
});

// ===============================
// 🔥 GET VIDEO INFO
// ===============================
app.post("/info", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: "No URL provided",
    });
  }

  const command = `yt-dlp --no-playlist -j "${url}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("YT-DLP ERROR:", stderr);

      return res.json({
        success: false,
        message: stderr || "yt-dlp failed",
      });
    }

    try {
      const cleanOutput = stdout.trim().split("\n").pop();
      const data = JSON.parse(cleanOutput);

      res.json({
        success: true,
        title: data.title,
        duration: data.duration_string,
        thumbnail: data.thumbnail,
      });

    } catch (err) {
      console.error("PARSE ERROR:", err);

      res.json({
        success: false,
        message: "Failed to parse video info",
      });
    }
  });
});

// ===============================
// 🔥 DOWNLOAD
// ===============================
app.post("/download", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: "No URL",
    });
  }

  const fileName = `video_${Date.now()}.mp4`;
  const filePath = path.join(downloadPath, fileName);

  const command = `yt-dlp -f best -o "${filePath}" "${url}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("DOWNLOAD ERROR:", stderr);

      return res.json({
        success: false,
        message: stderr || "Download failed",
      });
    }

    res.json({
      success: true,
      file: `https://YOUR-APP.up.railway.app/downloads/${fileName}`,
    });
  });
});

// serve files
app.use("/downloads", express.static(downloadPath));

// PORT مهم جداً
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});