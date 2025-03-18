import express from "express";
let router = express.Router();
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client();

router.post("/google/", async (req, res) => {
    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: req.body.credential,
            audience: "197173313554-n6rm3gerdgdlmqpascna1uosju6jpgms.apps.googleusercontent.com",   
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        console.log("payload", ticket, payload);
    }
    verify().catch(console.error);
})

export default router;