// var db = require('./db');

// Middleware
// var morgan = require('morgan');  // this is for logging things.
// var parser = require('body-parser');

// Router
// var router = require('./routes.js');

// var app = express();
// module.exports.app = app;

// Set what we are listening on.
// app.set("port", 3000);

// Logging and parsing
// app.use(morgan('dev'));
// app.use(parser.json());

// Set up our routes
// app.use("/classes", router);

// Serve the client files
// app.use(express.static(__dirname + "/../client"));

// If we are being run directly, run the server.
// if (!module.parent) {
//   app.listen(app.get("port"));
//   console.log("Listening on", app.get("port"));
// }

var mysql = require('mysql');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('client'));
var fs = require('fs');

var server = app.listen(3000, function(){
  var host = server.address().address;
  var port = server.address().port;

  console.log('listening', host, port);
});

var headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10, // Seconds.
  "Content-type": "application/json"
};

var msgBody = {
  results: []
};


app.options('/classes/messages', function(req, res){
  res.set(headers);
  res.status(200).end();
});


app.get('/index.html', function(req, res){
  var staticHeaders = headers;
  staticHeaders['Content-type'] = "text/html";
  res.set(staticHeaders);
  res.status(200).end();
});


app.get('/classes/messages', function(req, res){
  res.set(headers);

  var dbConnection = mysql.createConnection({
    user: "root",
    password: "",
    database: "chat"
  });
  dbConnection.connect();

  var queryString = "SELECT messages.id as objectId, messages.text, rooms.name as roomname, users.name as username from messages " +
                    "inner join rooms on rooms.id = messages.roomId " +
                    "inner join users on users.id = messages.userId";
  dbConnection.query(queryString, function(err, results) {
    if (err) {
      throw err;
    }
    msgBody.results = results;
    res.status(200).send(JSON.stringify(msgBody));
    dbConnection.end();
  });
});


app.post('/classes/users', function(req, res){
  res.set(headers);
  var username = req.body.username;

  var dbConnection = mysql.createConnection({
    user: "root",
    password: "",
    database: "chat"
  });
  dbConnection.connect();

  var queryString = "SELECT id FROM users WHERE name = " + "'" + username + "'";
  dbConnection.query(queryString, function(err, results) {
    if (err) {
      throw err;
    }
    if (results.length > 0) {
      res.status(201).send();
      dbConnection.end();
    } else {
      var queryString = "INSERT into users (name) values (" + "'" + username + "'" + ")";
      dbConnection.query(queryString, function(err, results) {
        if (err) {
          throw err;
        }
        res.status(201).send();
        dbConnection.end();
      });
    }
  });
});


app.post('/classes/messages', function(req, res){
  res.set(headers);

  var username = req.body.username;
  var roomname = req.body.roomname;
  var text = req.body.text;

  var dbConnection = mysql.createConnection({
    user: "root",
    password: "",
    database: "chat"
  });
  dbConnection.connect();

  // if user exists
  var queryString = "SELECT id FROM users WHERE name = " + "'" +username + "'";
  dbConnection.query(queryString, function(err, results) {
    if (err) {
      throw err;
    }
    if (results.length > 0) {
      // save user ID
      var userId = results[0].id;
      // look for room ID
      var queryString = "SELECT id FROM rooms WHERE name = " + "'" + roomname + "'";
      dbConnection.query(queryString, function(err, results) {
        if (err) {
          throw err;
        }
        if (results.length > 0) {
          // save room ID
          var roomId = results[0].id;
          // save message to database
          var queryString = "INSERT into messages (text, roomId, userId) " +
                            "values (" + "'" + text + "'" + "," + roomId + "," + userId + ")";
          dbConnection.query(queryString, function(err, results) {
            if (err) {
              throw err;
            }
            res.status(201).send();
            dbConnection.end();
          });
        }
        else { // if room doesn't exist, create it
          var queryString = "INSERT into rooms (name) values (" + "'" + roomname + "'" + ")";
          dbConnection.query(queryString, function(err, results) {
            if (err) {
              throw err;
            }
            // look for room ID
            var queryString = "SELECT id FROM rooms WHERE name = " + "'" + roomname + "'";
            dbConnection.query(queryString, function(err, results) {
              if (err) {
                throw err;
              }
              if (results.length > 0) {
                // save room ID
                var roomId = results[0].id;
                // save message to database
                var queryString = "INSERT into messages (text, roomId, userId) " +
                                  "values (" + "'" + text + "'" + "," + roomId + "," + userId + ")";
                dbConnection.query(queryString, function(err, results) {
                  if (err) {
                    throw err;
                  }
                  res.status(201).send();
                  dbConnection.end();
                });
              }
            });
          });
        }
      });
    }
    else {
      // user doesn't exist, create user
      var queryString = "INSERT into users (name) values (" + "'" + username + "'" + ")";
      dbConnection.query(queryString, function(err, results) {
        if (err) {
          throw err;
        }
        // get userId
        var queryString = "SELECT id FROM users WHERE name = " + "'" + username + "'";
        dbConnection.query(queryString, function(err, results) {
          if (err) {
            throw err;
          }
          if (results.length > 0) {
            // save user ID
            var userId = results[0].id;
          }
          // look for room ID
          var queryString = "SELECT id FROM rooms WHERE name = " + "'" + roomname + "'";
          dbConnection.query(queryString, function(err, results) {
            if (err) {
              throw err;
            }
            if (results.length > 0) {
              // save room ID
              var roomId = results[0].id;
              // save message to database
              var queryString = "INSERT into messages (text, roomId, userId) " +
                                "values (" + "'" + text + "'" + "," + roomId + "," + userId + ")";
              dbConnection.query(queryString, function(err, results) {
                if (err) {
                  throw err;
                }
                res.status(201).send();
                dbConnection.end();
              });
            }
            else { // if room doesn't exist, create it
              var queryString = "INSERT into rooms (name) values (" + "'" + roomname + "'" + ")";
              dbConnection.query(queryString, function(err, results) {
                if (err) {
                  throw err;
                }
                // look for room ID
                var queryString = "SELECT id FROM rooms WHERE name = " + "'" + roomname + "'";
                dbConnection.query(queryString, function(err, results) {
                  if (err) {
                    throw err;
                  }
                  if (results.length > 0) {
                    // save room ID
                    var roomId = results[0].id;
                    // save message to database
                    var queryString = "INSERT into messages (text, roomId, userId) " +
                                      "values (" + "'" + text + "'" + "," + roomId + "," + userId + ")";
                    dbConnection.query(queryString, function(err, results) {
                      if (err) {
                        throw err;
                      }
                      res.status(201).send();
                      dbConnection.end();
                    });
                  }
                });
              });
            }
          });
        });
      });
    }
  });
});
