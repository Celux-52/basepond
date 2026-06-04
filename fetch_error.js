const http = require('http');

http.get('http://localhost:3000/dashboard', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    // If it's a 500 error in Next.js development, the RSC payload or HTML will contain the error message.
    console.log('Status:', res.statusCode);
    const errMatch = data.match(/Error: (.*?)</);
    if (errMatch) {
      console.log('Error found in HTML:', errMatch[1]);
    } else {
      console.log('No obvious error in HTML. Showing first 1000 chars:');
      console.log(data.substring(0, 1000));
    }
  });
}).on('error', (err) => {
  console.error('Request error:', err);
});
