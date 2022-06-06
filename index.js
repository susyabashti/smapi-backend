const express = require("express");
const mysql = require("mysql2/promise");
const { createServer } = require("http");
const { validationResult, checkSchema } = require("express-validator");
const bodyParser = require("body-parser");
const cors = require("cors");

// ENV CONFIGURATION
require("dotenv").config();

// CORE APP CONFIGURATION
const app = express();
const httpServer = createServer(app);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    cors({
        origin: process.env.ORIGIN_URL,
    })
);

const pool = mysql.createPool(process.env.DATABASE_URL);

/* TABLE STRUCTURE

id - auto incremented int.
name - string 64size
price - float 24

*/

const schema = {
    name: {
        in: ["body"],
        errorMessage: "The name you entered is not valid.",
        escape: true,
        trim: true,
        custom: {
            options: (value) => value.match(/^[A-Za-z \d]+$/),
        },
    },
    price: {
        in: ["body"],
        errorMessage: "The price you entered is not valid.",
        isNumeric: true,
        toFloat: true,
    },
    // key_auth: {
    //     in: ["headers"],
    //     errorMessage: "Invalid authorization key.",
    //     custom: {
    //         options: (value) => value == process.env.SECRET_AUTH,
    //     },
    // },
};

// Retrieve all products
app.get("/api/products/", (req, res) => {
    pool.execute("SELECT * FROM `products`;")
        .then(([rows]) => res.status(200).send(rows))
        .catch(() =>
            res.status(202).json({
                msg: "An error occured while trying to fetch products.",
                status: 202,
            })
        );
});

// Retrieve specific product
app.get("/api/products/:name", (req, res) => {
    const name = req.params.name;

    pool.execute(
        "SELECT * FROM `products` WHERE `name` like CONCAT( '%', ?, '%');",
        [name]
    )
        .then(([rows]) => res.status(200).json(rows))
        .catch(() =>
            res.status(202).json({
                msg: "An error occured while trying to fetch products.",
                status: 202,
            })
        );
});

// Add Product
app.post("/api/products/", checkSchema(schema), (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(202).json({
            msg: result.errors[0].msg,
            status: 202,
        });
    }

    const name = req.body.name;
    const price = req.body.price;

    pool.execute("INSERT INTO `products` (name, price) VALUES (?, ?);", [
        name,
        price,
    ])
        .then(() =>
            res.status(200).json({
                msg: "Product added successfully.",
                status: 200,
            })
        )
        .catch((err) => {
            if (err.code == "ER_DUP_ENTRY") {
                res.status(202).json({
                    msg: "A product already exists with that name.",
                    status: 202,
                });
            } else {
                res.status(202).json({
                    msg: "An error occured while trying to add a new product.",
                    status: 202,
                });
            }
        });
});

httpServer.listen(process.env.PORT, () => {
    console.log("Application is served at port: " + process.env.PORT);
});
