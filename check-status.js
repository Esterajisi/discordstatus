const fs = require('fs');
const axios = require('axios');
const Parser = require('rss-parser');
const parser = new Parser();

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;
const CACHE_FILE = 'last_id.txt';

async function checkStatus() {
  try {
    console.log("Fetching RSS feed via Axios...");
    
    // Using Axios bypasses 405 errors and automatically handles gzip/deflate compression smoothly
    const response = await axios.get('https://discordstatus.com/history.rss', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });
    
    // Sanitize the response data stream
    let feedData = response.data
      .replace(/^\uFEFF/g, '') 
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); 
    
    // Parse the cleaned string data
    const feed = await parser.parseString(feedData);
    
    if (!feed.items || feed.items.length === 0) {
        console.log("No items found in feed.");
        return;
    }

    const latestItem = feed.items[0];
    const latestId = (latestItem.id || latestItem.guid || latestItem.link).toString().trim();
    
    console.log("Latest ID from Feed: " + latestId);

    let lastId = '';
    if (fs.existsSync(CACHE_FILE)) {
        lastId = fs.readFileSync(CACHE_FILE, 'utf8').trim();
    }
    console.log("Stored ID in file: '" + lastId + "'");

    if (latestId !== lastId) {
        console.log("New update detected! Sending to Discord...");
        
        await axios.post(WEBHOOK_URL, {
            username: "D_i_s_c_o_r_d Status Monitor",
            embeds: [{
                title: latestItem.title,
                description: latestItem.contentSnippet ? latestItem.contentSnippet.substring(0, 2000) : "No description",
                url: latestItem.link,
                color: 5793010,
                timestamp: new Date(latestItem.pubDate || new Date())
            }]
        });

        fs.writeFileSync(CACHE_FILE, latestId);
        console.log("Success: last_id.txt updated.");
    } else {
        console.log("No change detected. Skipping Discord post.");
    }
    
  } catch (error) {
    console.error('Error fetching or parsing feed:', error.message);
    process.exit(1);
  }
}

checkStatus();
