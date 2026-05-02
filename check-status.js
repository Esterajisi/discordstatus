const fs = require('fs');
const axios = require('axios');
const Parser = require('rss-parser');
const parser = new Parser();

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;
const CACHE_FILE = 'last_id.txt';

async function checkStatus() {
    try {
        console.log("Fetching RSS feed...");
        const feed = await parser.parseURL('https://discordstatus.com/history.rss');
        
        if (!feed.items || feed.items.length === 0) {
            console.log("No items found in feed.");
            return;
        }

        const latestItem = feed.items[0];
        const latestId = latestItem.guid || latestItem.link;
        
        console.log("Latest ID from Feed: " + latestId);

        let lastId = '';
        if (fs.existsSync(CACHE_FILE)) {
            lastId = fs.readFileSync(CACHE_FILE, 'utf8').trim();
        }
        console.log("Stored ID in file: '" + lastId + "'");

        if (latestId !== lastId) {
            console.log("New update detected! Sending to Discord...");
            
            await axios.post(WEBHOOK_URL, {
                username: "Drocsid Status Monitor",
                embeds: [{
                    title: latestItem.title,
                    description: latestItem.contentSnippet ? latestItem.contentSnippet.substring(0, 2000) : "No description",
                    url: latestItem.link,
                    color: 5814783,
                    timestamp: new Date(latestItem.pubDate)
                }]
            });

            fs.writeFileSync(CACHE_FILE, latestId);
            console.log("Success: last_id.txt updated.");
        } else {
            console.log("No change detected. Skipping Discord post.");
        }
    } catch (error) {
        console.error("ERROR:");
        console.error(error.message);
        if (error.response) console.error(error.response.data);
        process.exit(1); // Force GitHub to show a Red X if it fails
    }
}

checkStatus();
