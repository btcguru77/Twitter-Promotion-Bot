const express = require("express");
const cors = require("cors");
const app = express();
const request = require("request");
const dotenv = require("dotenv");
// const { connectMongoDB } = require("./config/index");

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

// connectMongoDB();

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

      const bodyString = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
      const parsedBody = JSON.parse(bodyString);

      console.log("following => ")

      request.post(
        {
          url: `https://api.twitter.com/2/users/${parsedBody.user_id}/following`,
          oauth: {
            consumer_key: process.env.consumerKey,
            consumer_secret: process.env.consumerSecret,
            token: parsedBody.oauth_token,
            token_secret: parsedBody.oauth_token_secret,
          },
          json: true,
          // form: { oauth_verifier: req.query.oauth_verifier },

          body: {
            target_user_id: "1435213798135193606",
          },
        },
        function (err1, r1, body1) {
          console.log("err1 => ", err1);
          console.log("body1 => ", body1)
          if (err1) {
            console.log("There was an error through following");
            res
              .status(404)
              .json({ msg: "There was an error through following" });
          } else {
            console.log("follow success!");
            // res.json("Success");
          }
        }
      );

      const tweetId = "1790072484059856986"

      request.post(
        {
          url: `https://api.twitter.com/2/users/${parsedBody.user_id}/likes`,
          oauth: {
            consumer_key: process.env.consumerKey,
            consumer_secret: process.env.consumerSecret,
            token: parsedBody.oauth_token,
            token_secret: parsedBody.oauth_token_secret,
          },
          json: true,
          body: {
            tweet_id: tweetId,
          },
        },
        function (err, e1, body) {
          if (err) {
            console.log('There was an error liking the tweet:', err);
            return;
          }
          console.log('Tweet liked successfully!');
          console.log(body);
        }
      );

      request.post(
        {
          url: `https://api.twitter.com/2/users/${parsedBody.user_id}/retweets`,
          oauth: {
            consumer_key: process.env.consumerKey,
            consumer_secret: process.env.consumerSecret,
            token: parsedBody.oauth_token,
            token_secret: parsedBody.oauth_token_secret,
          },
          json: true,
          body: {
            tweet_id: tweetId,
          },
        },
        function (err, e1, body) {
          if (err) {
            console.log('There was an error liking the tweet:', err);
            res.status(404).json({ msg: 'There was an error liking the tweet' });
          } else {
            console.log('Tweet liked successfully!');
            console.log(body);
            res.json('Success');
          }
        }
      );
    }
  );
});

const port = 2088;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
