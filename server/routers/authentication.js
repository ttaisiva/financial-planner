import express from "express";
let router = express.Router();
import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client();

// import { connectToDatabase } from "../server.js";
import { createTablesIfNotExist } from "../db_tables.js";
import { pool } from "../utils.js";

// Provided by Google Identity Documentation
async function verify(req) {
  // Verifies the token provided by Google for User sign-in
  const ticket = await client.verifyIdToken({
    idToken: req.body.credential,
    audience:
      "197173313554-n6rm3gerdgdlmqpascna1uosju6jpgms.apps.googleusercontent.com",
  });
  console.log("ticket", ticket);
  const payload = ticket.getPayload();
  console.log("payload", payload);
  return ticket;
}

async function createAccount(payload, names) {
  const newUser = {
    id: payload["sub"],
    name: names.first,
    lastName: names.last,
    email: payload["email"],
  };
  try {
    await createTablesIfNotExist();
    const sql =
      "INSERT INTO users (id, name, lastName, email) VALUES (?, ?, ?, ?)";
    const values = [newUser.id, newUser.name, newUser.lastName, newUser.email];
    await pool.execute(sql, values);
  } catch (err) {
    console.error("Error creating account:", err);
  }
}

router.post("/google/", async (req, res) => {
  const ticket = await verify(req).catch(console.error);

  // Once token is verified; Will create a session for user if account exists; create account then create session otherwise
  // Logic for checking if account exists; Done using id (unique Google ID)
  const sql = "SELECT id FROM users WHERE id=?";
  const params = [ticket.payload["sub"]];
  const [rows] = await pool.execute(sql, params);
  if (rows.length == 0) {
    const userData = {
      name: ticket.payload["given_name"],
      lastName: ticket.payload["family_name"],
      email: ticket.payload["email"],
    };
    res.status(201).json({ status: 201, userdata: userData });
  } else {
    req.session.user = {
      id: ticket.payload["sub"],
      email: ticket.payload["email"],
    };
    res.status(200).json({ status: 200 });
  }
});

router.get("/logout/", async (req, res) => {
  console.log("Logout", req.session.user);
  if (req.session.user) {
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error logging out");
      } else {
        res.send("Logged out");
      }
    });
  } else {
    res.send("");
  }
});

router.post("/createAccount/", async (req, res) => {
  const ticket = await verify(req).catch(console.error);
  const names = { first: req.body.name, last: req.body.lastName };

  // Logic for checking if account exists; Done using id (unique Google ID)
  const sql = "SELECT id FROM users WHERE id=?";
  const params = [ticket.payload["sub"]];
  const [rows] = await pool.execute(sql, params);
  console.log(rows.length == 0, rows);
  if (rows.length == 0) {
    // Valid account creation
    createAccount(ticket.payload, names);
    req.session.user = {
      id: ticket.payload["sub"],
      email: ticket.payload["email"],
    };
    res.status(200).send();
  } else {
    res.status(500).send();
  }
});

router.get("/isAuth/", async (req, res) => {
  console.log("isAuth", req.session.user);
  if (req.session.user == null) {
    res.json({ name: "Guest", lastName: "", email: "" });
  } else {
    console.log("isAuth", req.session.user["id"]);
    const sql = "SELECT * FROM users WHERE id=?";
    const params = [req.session.user["id"]];
    const [rows] = await pool.execute(sql, params);
    console.log("rows", rows);
    const data = {
      name: rows[0].name,
      lastName: rows[0].lastName,
      email: rows[0].email,
    };
    res.json(data);
  }
});

async function authorize(req) {
  // Checks permissions
}

export default router;
