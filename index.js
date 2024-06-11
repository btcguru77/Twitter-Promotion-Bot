const express = require("express");
const cors = require("cors");
const app = express();
const request = require("request");
const dotenv = require("dotenv");
const { connectMongoDB } = require("./config/index");


dotenv.config();

const whitelist = ["http://localhost:5173"];

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(express.json());
// { extended: false }
app.use(cors(corsOptions));

connectMongoDB();

app.get("/", (req, res, next) => {
  res.send("Hello world!");
});

app.post("/api/v1/auth/twitter/reverse", (req, res, next) => {
  console.log("consumer key => ", process.env.consumerKey);
  console.log("consumer secret => ", process.env.consumerSecret);
  request.post(
    {
      url: "https://api.twitter.com/oauth/request_token",
      oauth: {
        // oauth_callback: `${process.env.CLIENT_URI}/callback`,
        consumer_key: process.env.consumerKey,
        consumer_secret: process.env.consumerSecret,
      },
    },
    function (err, r, body) {
      if (err) {
        console.log("twitter app access denied", err);
        return res.send(500, { message: err.message });
      }

      try {
        var jsonStr =
          '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';

        console.log("jsonStr => ", jsonStr);
        res.send(JSON.parse(jsonStr));
      } catch (error) {
        console.log("jsonstr err => ", error);
      }
    }
  );
});

// verify
app.post("/api/v1/auth/twitter", async (req, res, next) => {
  request.post(
    {
      url: "https://api.twitter.com/oauth/access_token",
      oauth: {
        consumer_key: process.env.consumerKey,
        consumer_secret: process.env.consumerSecret,
        token: req.query.oauth_token,
        verifier: req.query.oauth_verifier,
      },
      // form: { oauth_verifier: req.query.oauth_verifier },
    },
    async function (err, r, body) {
      if (err) {
        console.log("oauth verify err", err);
        return res.send(500, { message: err.message });
      }

      const queryString = body;

    }
  );
});

const port = 2088;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
