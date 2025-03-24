import express from "express";
let router = express.Router();
import fs from "fs";
import multer from 'multer';
import path from 'path';

// ChatGPT; __dirname is not available
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current file's path
const __filename = fileURLToPath(import.meta.url);

// Get the current directory
const __dirname = dirname(__filename);

import { connectToDatabase } from "../server.js";

// ChatGPT

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, '..', 'upload'); // Directory where files will be saved
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      cb(null, uploadDir); // Save to 'uploads' directory
    },
    filename: function (req, file, cb) {
      // Preserve original filename or generate a new one
      const originalName = file.originalname;
      const extname = path.extname(originalName).toLowerCase();
      if (extname === '.yaml' || extname === '.yml') {
        cb(null, file.originalname); // Use the original file name
      } else {
        // If it's not a YAML file, you can give it a .yaml extension or handle it differently
        cb(null, file.originalname.split('.')[0] + '.yaml');
      }
    }
});
  
  // Set up multer upload
const upload = multer({ storage: storage });

router.post("/upload/statetax/",  upload.single('file'), async (req, res) => {
    console.log("body", req.body, "file", req.file);
    if (req.session.user && req.file) {
        const oldFileName =  path.join(__dirname, '..', 'upload', req.file.filename);

        const connection = await connectToDatabase();
        let sql = "SELECT * FROM user_tax_brackets WHERE id=?";
        let params = [req.session.user['id']];
        const [rows] = await connection.execute(sql, params);
       
        // ChatGPT
        const uniqueFileName = req.session.user['id'] + "-taxbracket-" + (rows.length + 1) + ".yaml"
        const newFileName = path.join(__dirname, '..', 'upload', uniqueFileName);

        console.log("NEW FILE NAME", newFileName)

        // ChatGPT
        fs.rename(oldFileName, newFileName, function(err) {
            if (err) throw err;
            console.log('File renamed successfully');
        });

        sql = "INSERT INTO user_tax_brackets (id, file_name, file_path) VALUES (?, ?, ?)";
        params = [req.session.user['id'], uniqueFileName, "server/upload/" + uniqueFileName];
        await connection.execute(sql, params);
        await connection.end();
        res.status(200).send();
    }
    else {
        res.status(500).send();
    }
})

router.get("/download/taxbrackets", async (req, res) => {
    console.log("download router");
    if (!req.session.user) {
        res.status(500).send();
    }
    
    const connection = await connectToDatabase();
    const query = 'SELECT file_name FROM user_tax_brackets WHERE id = ?';

    const [file_names] = await connection.execute(query, [req.session.user['id']]);
    await connection.end();
    console.log("file_name", file_names);

    const fileContents = [];

        // Read files sequentially (one by one)
    for (const file of file_names) {
        try {
            const filePath = path.join(__dirname, '..', 'upload', file.file_name);
            console.log("File path", filePath);
            const content = fs.readFileSync(filePath);
            fileContents.push({ filename: file.file_name, content: content });
        } catch (err) {
            console.error(`Error reading file ${file.file_name}:`, err);
            fileContents.push({ filename: file.file_name, error: "Could not read file" });
        }
    }

    res.json(fileContents);
})

router.post("/upload/scenario/", async (req, res) => {
    
})

router.get("/download/scenario", async (req, res) => {
    
})

export default router;