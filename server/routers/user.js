import express from "express";
let router = express.Router();
import fs from "fs";
import multer from "multer";
import path from "path";

// ChatGPT; __dirname is not available; prompt below
import { fileURLToPath } from "url";
import { dirname } from "path";
import { pool } from "../utils.js";

// Get the current file's path
const __filename = fileURLToPath(import.meta.url);

// Get the current directory
const __dirname = dirname(__filename);

// import { connectToDatabase } from "../server.js";

// ChatGPT
/*
    Prompt 1:
    how can i upload a file received from a client into the directory "upload" in the hierarchy
    Server
        Routers
            user.js (called from here)
        Upload (upload files here)

    Prompt 2:
        I am receiving an error that says __dirname is not defined, why is this happening
*/

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "..", "upload"); // Directory where files will be saved
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir); // Save to 'uploads' directory
  },
  filename: function (req, file, cb) {
    // Preserve original filename or generate a new one
    const originalName = file.originalname;
    const extname = path.extname(originalName).toLowerCase();
    if (extname === ".yaml" || extname === ".yml") {
      cb(null, file.originalname); // Use the original file name
    } else {
      // If it's not a YAML file, you can give it a .yaml extension or handle it differently
      cb(null, file.originalname.split(".")[0] + ".yaml");
    }
  },
});

// Set up multer upload
const upload = multer({ storage: storage });

router.post("/upload/statetax/", upload.single("file"), async (req, res) => {
  console.log("body", req.body, "file", req.file);
  if (req.session.user && req.file) {
    const oldFileName = path.join(__dirname, "..", "upload", req.file.filename);

    let sql = "SELECT * FROM user_tax_brackets WHERE id=?";
    let params = [req.session.user["id"]];
    const [rows] = await pool.execute(sql, params);

    // ChatGPT
    /*
            i would like to rename this file using fs
            i want the new file name to be req.session.user['id'] + "-taxbracket-" + (rows.length + 1) + ".yaml"
        */
    const uniqueFileName =
      req.session.user["id"] + "-taxbracket-" + (rows.length + 1) + ".yaml";
    const newFileName = path.join(__dirname, "..", "upload", uniqueFileName);

    console.log("NEW FILE NAME", newFileName);

    fs.rename(oldFileName, newFileName, function (err) {
      if (err) throw err;
      console.log("File renamed successfully");
    });

    sql =
      "INSERT INTO user_tax_brackets (id, file_name, file_path) VALUES (?, ?, ?)";
    params = [
      req.session.user["id"],
      uniqueFileName,
      "server/upload/" + uniqueFileName,
    ];
    await pool.execute(sql, params);
    res.status(200).send();
  } else {
    res.status(500).send();
  }
});

router.get("/download/taxbrackets", async (req, res) => {
  console.log("download router");
  if (!req.session.user) {
    res.status(500).send();
  }

  const query = "SELECT file_name FROM user_tax_brackets WHERE id = ?";

  const [file_names] = await pool.execute(query, [req.session.user["id"]]);
  console.log("file_name", file_names);

  // ChatGPT
  /*
        Prompt 1:
        im in a router, give me code that will retrieve all the files from file_paths and return it to client

        Prompt 2:
        can you do it without using promise.all

        Prompt 3:
        (copy pasted an error message regarding cb in fs.readFile)

        At this point it was giving me more and more broken code when the only problem was i needed to change fs.readFile to fs.readFileSync
    */
  const fileContents = [];

  for (const file of file_names) {
    try {
      const filePath = path.join(__dirname, "..", "upload", file.file_name);
      console.log("File path", filePath);
      const content = fs.readFileSync(filePath);
      fileContents.push({ filename: file.file_name, content: content });
    } catch (err) {
      console.error(`Error reading file ${file.file_name}:`, err);
      fileContents.push({
        filename: file.file_name,
        error: "Could not read file",
      });
    }
  }

  res.json(fileContents);
});

router.post("/upload/scenario/", async (req, res) => {});

router.get("/download/scenario", async (req, res) => {});

export default router;
