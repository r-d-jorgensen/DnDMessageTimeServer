require('dotenv').config({ path: '.env' });
const express = require('express');
const socketio = require('socket.io');
const os = require('os');
const http = require('http');
const cors = require('cors');
const fs = require('fs');
const chat = require('./chat');

const app = express();
const server = http.createServer(app);
app.use(express.json({ limit: '50mb' }));
app.use(cors());

function writeToFile(data) {
  fs.appendFile('demo.txt', data + os.EOL, 'utf8', (error) => {
    console.log('Write complete');
    console.log('Error: %s', error);
    console.log('Data written: %s', data);
  });
}

/* function readFromFile() {
  fs.readFile('demo.txt', 'utf8', (error, data) => {
    console.log('Read complete');
    console.log(error);
    console.log(data);
    return data;
  });
}

function adminFileCheck(sstring) {
  let found = false;
  fs.readFile('demo.txt', 'utf8', (error, data) => {
    if (data.startsWith(sstring)) {
      found = true;
    }
    return found;
  });
}

function scanFileFor(sstring) {
  let found = false;
  console.log(sstring);
  fs.readFile('demo.txt', 'utf8', (error, data) => {
    if (data.includes(sstring + os.EOL)) {
      found = true;
    }
    return found;
  });
}
*/

function authentication(data) {
  // TODO: replace stub with actual auth system
  console.log(`creating authentication using user data form ${data.username}`);
  return {
    isAuthenticated: true,
    token: 'tokenData',
    userType: 'member',
    username: data.username,
  }; // TODO: If admin send that back
}

app.get('/login', (req, res) => {
  // Check that user data was sent
  console.log(req.query);
  if (req) {
    // TODO: Check that there is a username and password in query object and query object exits
    // TODO: Check file system for check group has user
    // TODO: Check file system for user with those username and password combo
    console.log(`user, ${req.query.username} logged in`);
    res.json(authentication(req.query)).status(200);
  } else {
    console.log('Error: Credentials not recieved from client');
    res.json(authentication(req.query)).status(300); // TODO: should respond with isAuth as false and null for token
  }
});

app.post('/register', (req, res) => {
  console.log(req.body);
  // Order of Operations: "GroupName|UserType|UserName|password"
  // TODO: Check that user data was sent
  // Create user String for file
  // TODO: If username exists respond with bad authentication
  // TODO: Register user with the group or create group if user is admin... there can only be one admin
  let adminCheckString = req.body.groupName;
  adminCheckString += '|';
  adminCheckString += req.body.userType;
  let textLine = adminCheckString;
  textLine += '|';
  textLine += req.body.username;
  textLine += '|';
  textLine += req.body.password;
  writeToFile(textLine);
  console.log(`user, ${req.body.username} registered`);
  res.json(authentication(req.body)).status(200);
});

const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
chat(io);

server.listen(process.env.WEB_PORT, () => {
  console.log(`Server is listning on port ${process.env.WEB_PORT}.`);
});
