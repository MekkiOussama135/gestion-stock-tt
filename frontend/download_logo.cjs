const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://cdn.worldvectorlogo.com/logos/tunisie-telecom-1.svg';
const dest = path.join(__dirname, 'public', 'logo.svg');

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
    if (res.statusCode !== 200) {
        console.error(`Failed to download: ${res.statusCode}`);
        process.exit(1);
    }
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('Download complete');
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
});
