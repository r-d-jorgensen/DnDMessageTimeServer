require('dotenv').config({ path: '.env' });
const express = require('express');
const socketio = require('socket.io');
const mysql = require('mysql');
const http = require('http');
const cors = require('cors');
const chat = require('./chat');

const app = express();
const server = http.createServer(app);
app.use(express.json({ limit: '50mb' }));
app.use(cors());

const dbConnection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
});

// TODO: May need to open and close the connection for each call
dbConnection.connect((err) => {
  if (err) {
    console.error(`Database connection failed:\n ${err.stack}`);
    return;
  }
  console.log('Connected to database.');
});

function authentication(data) {
  // TODO: replace stub with actual auth system
  console.log(`creating authentication using user data from ${data.username}`);
  return {
    isAuthenticated: true,
    token: 'tokenData',
    userType: data.userType,
    username: data.username,
    userid: data.userid,
  };
}
// TODO: combine queries into one 'SELECT * FROM users where userid = ? AND passwrd = ?', [value, value, value]
app.get('/login', (req, res) => {
  // TODO: Hack change nested queries to promises
  if (req.query.username && req.query.password) {
    dbConnection.query('select username from users', (err, result) => {
      if (err) {
        console.error(`Failed to check usernames: ${err.stack}\n`);
        res.status(500);
        return;
      }
      if (JSON.stringify(result).includes(`"username":"${req.query.username}"`)) {
        console.log(`Username ${req.query.username} found`);
        dbConnection.query('select passwrd, userid from users where username = ?', [req.query.username], (err2, result2) => {
          if (err2) {
            console.error(`Failed to check password: ${err2.stack}\n`);
            res.status(500);
            return;
          }
          if (JSON.stringify(result2).includes(`"passwrd":"${req.query.password}"`)) {
            console.log('User Confirmed');
            dbConnection.query(`select usertype from users where username = '${req.query.username}'`, (err3, result3) => {
              if (err3) {
                console.error(`Failed to find user type: ${err3.stack}\n`);
                res.status(500);
                return;
              }
              // TODO: This is unsafe should have more checks in case of failure on result3 and other userTypes... switch statment would be best with ENUMS
              res.json(authentication(Object.assign(
                req.query,
                { userid: result2[0].userid },
                { userType: result3[0].usertype === 1 ? 'admin' : 'member' },
              ))).status(300);
            });
          } else {
            console.log('Bad Password');
            res.json({}).status(300);
          }
        });
      } else {
        console.log('Login Error');
        res.json({}).status(300);
      }
    });
  } else {
    console.log('Error: Credentials not recieved from client');
    res.json({}).status(300); // TODO: should respond with isAuth as false and null for token
  }
});

app.post('/register', (req, res) => {
  // TODO: Hack change nested queries to promises
  if (req.body.username && req.body.password && req.body.userType) {
    dbConnection.query('select username from users', (err, result) => {
      if (err) {
        console.error(`Failed to check usernames: ${err.stack}\n`);
        res.status(500);
        return;
      }
      if (JSON.stringify(result).includes(`"username":"${req.body.username}"`)) {
        console.log(`Error: Username ${req.body.username} already exists in database`);
        res.json({}).status(300);
      } else if (req.body.userType === 'admin') {
        dbConnection.query('select usertype from users', (err2, result2) => {
          if (err2) {
            console.error(`Failed to check admin: ${err.stack}\n`);
            res.status(500);
            return;
          }
          if (JSON.stringify(result2).includes('"usertype":0')) {
            console.log('Error: Admin already exists');
            res.json({}).status(300);
          } else {
            dbConnection.query(
              'insert into users values ( default, ?, ?, ? )',
              [req.body.username, req.body.password, req.body.userType === 'admin' ? 1 : 0], // TODO: This ternary should be done with ENUMS
              (err3, result3) => {
                if (err3) {
                  console.error(`Failed to write to DB: ${err3.stack}\n`);
                  return;
                }
                console.log('User info recorded to database');
                console.log(`user, ${req.body.username} registered`);
                res.json(authentication(Object.assign(
                  req.body,
                  { userid: result3.insertId },
                  { userType: 'admin' },
                ))).status(200);
              },
            );
          }
        });
      } else {
        dbConnection.query(
          'insert into users values ( default, ?, ?, ? )',
          [req.body.username, req.body.password, req.body.userType === 'admin' ? 1 : 0], // TODO: This ternary should be done with ENUMS
          (err3, result3) => {
            if (err3) {
              console.error(`Failed to write to DB: ${err3.stack}\n`);
              return;
            }
            console.log('User info recorded to database');
            console.log(`user, ${req.body.username} registered`);
            res.json(authentication(Object.assign(
              req.body,
              { userid: result3.insertId },
              { userType: 'member' },
            ))).status(200);
          },
        );
      }
    });
  } else {
    console.log('Error: Credentials not recieved from client');
    res.json({}).status(200);
  }
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
