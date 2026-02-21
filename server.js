const express = require("express");
const multer = require("multer");
const unzipper = require("unzipper");
const simpleGit = require("simple-git");
const fs = require("fs-extra");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Absolute paths
const UPLOAD_DIR = path.join(__dirname, "uploads");
const DEPLOY_DIR = path.join(__dirname, "deployments");

// Safely create folders if they don't exist
try {
  fs.ensureDirSync(UPLOAD_DIR);
  fs.ensureDirSync(DEPLOY_DIR);
} catch (err) {
  if (err.code !== "EEXIST") throw err;
}

// Multer upload using absolute path
const upload = multer({ dest: UPLOAD_DIR });

// CREATE PANEL
app.post("/deploy", upload.single("zipFile"), async (req, res) => {
  try {
    const { panelName, type, repoUrl } = req.body;
    if (!panelName) return res.status(400).json({ error: "Panel name required" });

    const panelPath = path.join(DEPLOY_DIR, panelName);
    await fs.remove(panelPath);
    await fs.ensureDir(panelPath);

    if (req.file) {
      await fs.createReadStream(req.file.path)
        .pipe(unzipper.Extract({ path: panelPath }))
        .promise();
      await fs.remove(req.file.path);
    } else if (repoUrl) {
      await simpleGit().clone(repoUrl, panelPath);
    } else {
      return res.status(400).json({ error: "Provide Git URL or ZIP" });
    }

    res.json({ message: "Deployment successful", panelName, type });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Deployment failed" });
  }
});

// LIST PANELS
app.get("/panels", async (req, res) => {
  const folders = await fs.readdir(DEPLOY_DIR);
  res.json(folders);
});

// DELETE PANEL
app.delete("/panel/:name", async (req, res) => {
  const panelPath = path.join(DEPLOY_DIR, req.params.name);
  await fs.remove(panelPath);
  res.json({ message: "Deleted" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Mr Emmanuel Deployment Site running on port ${PORT}`)
);
