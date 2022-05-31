const express = require("express");
const mysql = require("mysql2");
const { createServer } = require("http");

require("dotenv").config();

const app = express();
const httpServer = createServer(app);

const conn = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DB,
});

// Retrieve all products
app.get("/api/products/", (req, res) => {
  // Non prepared statement.
  conn.execute("SELECT * FROM `products`;", (err, results) => {
    if (err) {
      res.sendStatus(500);
    } else {
      res.send(results);
    }
  });
});

// Retrieve specific product by name
app.get("/api/products/:name", (req, res) => {
  let name = req.params.name;

  // Prepared statement execution.
  conn.execute(
    "SELECT * FROM `products` WHERE `name` = ?;",
    [name],
    (err, results) => {
      if (err) {
        res.sendStatus(500);
      } else {
        res.send(results);
      }
    }
  );
});

httpServer.listen(process.env.PORT, () => {
  console.log("Application is served at port: " + process.env.PORT);

  conn.connect((err) => {
    if (err) throw err;

    console.log(
      "Application has successfully connected itself to MySQL Server."
    );
  });
});
