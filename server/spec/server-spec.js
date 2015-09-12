/* You'll need to have MySQL running and your Node server running
 * for these tests to pass. */

var mysql = require('mysql');
var request = require("request"); // You might need to npm install the request module!
var expect = require('../../node_modules/chai/chai').expect;

describe("Persistent Node Chat Server", function() {
  var dbConnection;

  beforeEach(function(done) {
    dbConnection = mysql.createConnection({
      user: "root",
      password: "",
      database: "chat"
    });
    dbConnection.connect();

       var tablename = "messages"; // TODO: fill this out

    /* Empty the db table before each test so that multiple tests
     * (or repeated runs of the tests) won't screw each other up: */
    dbConnection.query("truncate " + tablename, done);
  });

  afterEach(function() {
    dbConnection.end();
  });

  it("Should insert posted messages to the DB", function(done) {
    // Post the user to the chat server.
    request({ method: "POST",
              uri: "http://127.0.0.1:3000/classes/users",
              json: { username: "Valjean" }
    }, function () {
      // Post a message to the node chat server:
      request({ method: "POST",
              uri: "http://127.0.0.1:3000/classes/messages",
              json: {
                username: "Valjean",
                text: "In mercys name, three days is all I need.",
                roomname: "Hello"
              }
      }, function () {
        // Now if we look in the database, we should find the
        // posted message there.

        // TODO: You might have to change this test to get all the data from
        // your message table, since this is schema-dependent.
        var queryString = "SELECT * FROM messages";
        var queryArgs = [];

        dbConnection.query(queryString, queryArgs, function(err, results) {
          // Should have one result:
          expect(results.length).to.equal(1);

          // TODO: If you don't have a column named text, change this test.
          expect(results[0].text).to.equal("In mercys name, three days is all I need.");

          done();
        });
      });
    });
  });

  it("Should output all messages from the DB", function(done) {
    // Let's insert a message into the db
/*       var queryString = "START TRANSACTION;" +
                          "INSERT into rooms (name) values ('main');" +
                          "INSERT into users (name) values ('test');" +
                          "COMMIT;";
*/
    var roomString = "INSERT into rooms (name) values ('main')";
    var roomArgs = [];
    dbConnection.query(roomString, roomArgs, function(err) {
      if (err) { throw err; }
      var userString = "INSERT into users (name) values ('testspec')";
      var userArgs = [];
      dbConnection.query(userString, userArgs, function(err) {
        if (err) { throw err; }
        var roomIdString = "SELECT id FROM rooms WHERE name='main'";
        var roomIdArgs = [];
        dbConnection.query(roomIdString, roomIdArgs, function(err, results) {
          if (err) { throw err; }
          var roomId = results[0].id;
          var userIdString = "SELECT id FROM users WHERE name='testspec'";
          var userIdArgs = [];
          dbConnection.query(userIdString, userIdArgs, function(err, results) {
            if (err) { throw err; }
            var userId = results[0].id;
            var messageString = "INSERT into messages (text, roomId, userId) " +
                                "values ('Men like you can never change!'," + roomId +
                                "," + userId + ")";
            var messageArgs = [];
            dbConnection.query(messageString, messageArgs, function(err) {
              if (err) { throw err; }

              // Now query the Node chat server and see if it returns
              // the message we just inserted:
              request("http://127.0.0.1:3000/classes/messages", function(error, response, body) {
                var messageLog = JSON.parse(body);
                expect(messageLog.results[0].text).to.equal("Men like you can never change!");
                expect(messageLog.results[0].roomname).to.equal("main");
                done();
              });
            });
          });
        });
      });
    });
  });
});
