const http = require('http');

const postData = JSON.stringify({
    name: 'Verification Room',
    topic: 'Testing'
});

const postOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/rooms',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log("1. Creating Room...");
const req = http.request(postOptions, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('BODY:', data);

        console.log("\n2. Listing Rooms...");
        http.get('http://localhost:5000/api/rooms', (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            let listData = '';
            res.on('data', (chunk) => { listData += chunk; });
            res.on('end', () => {
                console.log('BODY:', listData);
            });
        });
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
