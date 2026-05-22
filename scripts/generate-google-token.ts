import { google } from "googleapis";
import * as readline from "readline";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000"
);

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("====================================================");
console.log("             Google OAuth Token Generator           ");
console.log("====================================================");

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent", // Force to get refresh token
  scope: SCOPES,
});

console.log("\n1️⃣  Please open the following URL in your browser:\n");
console.log(authUrl);
console.log("\n2️⃣  Log in with your Google account and grant permissions.");
console.log("3️⃣  You will be redirected to your redirect URI with a ?code= parameter.");
console.log("   (If it says localhost refused to connect, that's fine. Just copy the code from the URL)");

rl.question("\n4️⃣  Paste the code here: ", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("\n✅ Successfully retrieved tokens!");
    console.log("\n====================================================");
    console.log("Add this REFRESH TOKEN to your .env file:");
    console.log("GOOGLE_REFRESH_TOKEN=" + tokens.refresh_token);
    console.log("====================================================\n");
  } catch (error: any) {
    console.error("\n❌ Error retrieving token:", error.message);
  }
  rl.close();
});
