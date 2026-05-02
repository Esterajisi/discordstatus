const fs = require('fs');
const axios = require('axios');
const Parser = require('rss-parser');
const parser = new Parser();

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;
const CACHE_FILE = 'last_id.txt';

async function checkStatus() {
    try {
        const feed = await parser.parseURL('https://discordstatus.com/history.rss');
        if (feed.items.length === 0) return;

        const latestItem = feed.items[0];
        const lastId = fs.existsSync(CACHE_FILE) ? fs.readFileSync(CACHE_FILE, 'utf8') : '';

        // Only send if the ID is different from the last one we saved
        if (latestItem.guid !== lastId) {
            await axios.post(WEBHOOK_URL, {
                username: "Discord Status Monitor",
                avatar_url: "https://discord.com/assets/2c21aeda16de354ba5334551a883b481.png",
                embeds: [{
                    title: latestItem.title,
                    description: latestItem.contentSnippet,
                    url: latestItem.link,
                    color: 5814783, // Discord Blurple
                    timestamp: new Date(latestItem.pubDate)
                }]
            });

            // Save the new ID
            fs.writeFileSync(CACHE_FILE, latestItem.guid);
            console.log("Sent new update: " + latestItem.title);
        } else {
            console.log("No new updates.");
        }
    } catch (error) {
        console.error("Error fetching status:", error);
    }
}

checkStatus();
