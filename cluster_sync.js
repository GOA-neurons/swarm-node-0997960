const { Octokit } = require("@octokit/rest");
const admin = require('firebase-admin');
const axios = require('axios');
const octokit = new Octokit({ auth: process.env.GH_TOKEN });
const REPO_OWNER = "GOA-neurons";
const REPO_NAME = process.env.GITHUB_REPOSITORY.split('/')[1];

if (!admin.apps.length) { 
    try {
        admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_KEY)) }); 
    } catch(e) { console.error("❌ Firebase Init Failed:", e.message); process.exit(1); }
}
const db = admin.firestore();

async function run() {
    console.log("🚀 Starting Sub-node Sync Process...");
    try {
        const start = Date.now();
        
        console.log("📡 Fetching instruction.json from Master...");
        const { data: inst } = await axios.get(`https://raw.githubusercontent.com/${REPO_OWNER}/delta-brain-sync/main/instruction.json`);
        
        console.log("📊 Checking GitHub Rate Limit...");
        const { data: rate } = await octokit.rateLimit.get();
        
        console.log("☁️ Updating Firestore Status for " + REPO_NAME + "...");
        await db.collection('cluster_nodes').doc(REPO_NAME).set({
            status: 'ACTIVE', 
            latency: `${Date.now() - start}ms`,
            api_remaining: rate.rate.remaining, 
            command: inst.command,
            last_ping: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // သင်၏ မူလ Replication Logic Call
        if (inst.replicate) { 
            console.log("🧬 Replication signal detected from Master.");
            /* Replication Logic call via Core */ 
        }

        console.log("✅ SUCCESS: Node Synchronized.");
        console.log("🏁 MISSION ACCOMPLISHED.");
    } catch (e) { 
        console.error("❌ CRITICAL ERROR:", e.message); 
        process.exit(1); // GitHub Action အနီရောင်ပြစေရန်
    }
}
run();