const Parser = require('rss-parser');
const axios = require('axios');

const parser = new Parser();

async function checkStatus() {
  try {
    // Fetch the RSS feed
    const response = await axios.get('https://discordstatus.com/history.rss');
    
    // Sanitize the response by removing control characters and BOM
    let feedData = response.data
      .replace(/^\uFEFF/g, '') // Remove UTF-8 BOM
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
    
    // Parse the cleaned feed
    const feed = await parser.parseString(feedData);
    
    // Rest of your logic here
    console.log('Feed parsed successfully');
    // ... continue with your status check logic
    
  } catch (error) {
    console.error('Error fetching or parsing feed:', error.message);
    process.exit(1);
  }
}

checkStatus();
