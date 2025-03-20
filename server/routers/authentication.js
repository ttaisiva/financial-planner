import express from "express";
let router = express.Router();
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client();

import { connectToDatabase } from "../server.js";

async function verify(req) {
    // Verifies the token provided by Google for User sign-in
    const ticket = await client.verifyIdToken({
        idToken: req.body.credential,
        audience: "197173313554-n6rm3gerdgdlmqpascna1uosju6jpgms.apps.googleusercontent.com",   
    });
    console.log("ticket", ticket);
    const payload = ticket.getPayload();
    console.log("payload", payload);
    return ticket;
}

async function createAccount(connection, payload) {
    const newUser = {
        id: payload['sub'],
        name: payload['given_name'],
        lastName: payload['family_name'],
        email: payload['email']
    }
    const sql = "INSERT INTO users VALUES ('" + newUser.id + "','" + newUser.name + "','" + newUser.lastName + "','" + newUser.email + "')";
    const cmd = await connection.execute(sql);
}

router.post("/google/", async (req, res) => {
    const ticket = await verify(req).catch(console.error);
    
    // Once token is verified; Will create a session for user if account exists; create account then create session otherwise
    const connection = await connectToDatabase();
    // Logic for checking if account exists; Done using id (unique Google ID)
    const sql = "SELECT id FROM users WHERE id=?";
    const params = [ticket.payload['sub']];
    const [rows] = await connection.execute(sql, params);
    if (!rows.length == 0) {
        await connection.end();
        const userData = {
            name: ticket.payload['given_name'],
            lastName: ticket.payload['family_name'],
            email: ticket.payload['email']
        };
        res.status(201).json({status: 201, userdata: userData})
    }
    else {
        await connection.end();    
        req.session.user = { id: ticket.payload['sub'], email: ticket.payload['email']}
        res.status(201).json({status: 201});
    }
})

router.get("/logout/", async (req, res) => {
    console.log("Logout", req.session.user);
    req.session.destroy((err) => {
        if(err) {
            console.error(err);
            res.status(500).send('Error logging out');
        } else {
            res.send('Logged out');
        }
    })
})

/*
router.get("/createAccount/", async (req, res) => {
    const connection = await connectToDatabase();
    const sql = "SELECT id FROM users WHERE id=?";
    const params = [req.session.user.id];
    console.log(params);
})
    */

async function authorize(req) {
    // Checks permissions
}

export default router;