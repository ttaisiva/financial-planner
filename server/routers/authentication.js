import express from "express";
let router = express.Router();
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client();

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

async function createAccount(ticket) {
    
}

router.post("/google/", async (req, res) => {
    const ticket = await verify(req).catch(console.error);
    
    // Once token is verified; Will create a session for user if account exists; create account then create session otherwise
    if (false) {
        createAccount(ticket)
    }
    req.session.user = { id: ticket.payload['sub'], email: ticket.payload['email'], name: ticket.payload['given_name']}
    res.send('Logged in!');
})

router.get("/test/", async (req, res) => {
    console.log("Test", req.session.user);
    if (req.session.user) {
        res.send(`Hello, ${req.session.user.name}`);
    } else {
        res.send('Please log in first.');
    }
})

async function authorize(req) {
    // Checks permissions
}

export default router;