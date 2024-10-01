const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);


app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});





server.listen(3000, () => {
  console.log('Server listening on *:3000');
});