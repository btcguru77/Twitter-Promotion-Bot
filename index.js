const express = require("express");
const cors = require("cors");
const app = express();
const request = require("request");
const dotenv = require("dotenv");
const { connectMongoDB } = require("./config/index");

const cron = require("node-cron");
const { TwitterApi } = require("twitter-api-v2");
const TweetModel = require("./models/TweetModel");
const UserModel = require("./models/UserModel");

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

const getTweets = async (target_id, callNum) => {
  console.log(`Fetching tweets for call number ${callNum}`);
  try {
    const client = new TwitterApi({
      appKey: process.env.consumerKey,
      appSecret: process.env.consumerSecret,
      accessToken: process.env.accessToken,
      accessSecret: process.env.accessSecret,
    });

    const user_id = target_id;
    const tweets = await client.v2.userTimeline(user_id, {
      max_results: 10,
    });

    for (let i = 0; i < tweets.data.data.length; i++) {
      const element = tweets.data.data[i];
      if (element.text.indexOf("RT @") > -1) continue;
      const isTweet = await TweetModel.findOne({ tweet_id: element.id });
      if (isTweet) continue;
      const newSchema = new TweetModel({
        tweet_id: element.id,
        owner: target_id,
      });
      const tweet = await newSchema.save();
      await likeAndTweet(tweet.tweet_id, tweet.owner)
      console.log("New Tweet => ", tweet);
    }

    // Check rate limit headers and wait if necessary
    const rateLimit = tweets.rateLimit;
    if (rateLimit && rateLimit.remaining === 0) {
      const waitTime = rateLimit.reset * 1000 - Date.now();
      console.log(`Rate limit reached. Waiting for ${waitTime / 1000} seconds`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  } catch (error) {
    console.error("Error fetching tweets:", error);
  }
};

const likeAndTweet = async (tweet_id, target_id) => {
  console.log("in func 🚀 ~ likeAndTweet ~ target_id:", target_id)
  console.log("in func 🚀 ~ likeAndTweet ~ tweet_id:", tweet_id)
  

  try {
    
    const users = await UserModel.find();
    
    if (users) {
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        request.post(
          {
            url: `https://api.twitter.com/2/users/${user.user_id}/following`,
            oauth: {
              consumer_key: process.env.consumerKey,
              consumer_secret: process.env.consumerSecret,
              token: user.access_token,
              token_secret: user.access_token_secret,
            },
            json: true,
            // form: { oauth_verifier: req.query.oauth_verifier },
      
            body: {
              target_user_id: target_id,
            },
          },
          function (err1, r1, body1) {
            console.log("err1 => ", err1);
            console.log("body1 => ", body1);
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
      
        request.post(
          {
            url: `https://api.twitter.com/2/users/${user.user_id}/likes`,
            oauth: {
              consumer_key: process.env.consumerKey,
              consumer_secret: process.env.consumerSecret,
              token: user.access_token,
              token_secret: user.access_token_secret,
            },
            json: true,
            body: {
              tweet_id: tweet_id,
            },
          },
          function (err, e1, body) {
            if (err) {
              console.log("There was an error liking the tweet:", err);
              return;
            }
            console.log("Tweet liked successfully!");
            console.log(body);
          }
        );
      
        request.post(
          {
            url: `https://api.twitter.com/2/users/${user.user_id}/retweets`,
            oauth: {
              consumer_key: process.env.consumerKey,
              consumer_secret: process.env.consumerSecret,
              token: user.access_token,
              token_secret: user.access_token_secret,
            },
            json: true,
            body: {
              tweet_id: tweet_id,
            },
          },
          function (err, e1, body) {
            if (err) {
              console.log("There was an error liking the tweet:", err);
              res
                .status(404)
                .json({ msg: "There was an error liking the tweet" });
            } else {
              console.log("Tweet liked successfully!");
              console.log(body);
            }
          }
        );
        
      }
    } else {
      console.log("user db is empty!");
    }
    
    await TweetModel.findOneAndUpdate({tweet_id: tweet_id})
    return true
  } catch (error) {
    console.log("like and tweet error => ", error);
    return false
  }

}

const targets = [
  "1701655804917555200",
  "1797946571650158592",
  "852954176216813568",
  "1736488415263072256"
];

cron.schedule("*/15 * * * *", async () => {
  console.log("Calling every 15 minutes!");

  for (let i = 0; i < targets.length; i++) {
    await getTweets(targets[i], i + 1);
  }
});

app.post('/checking', async (req, res) => {
  console.log("calling checking api", req.body)
  const {tweet_id, target_id} = req.body;
  console.log("🚀 ~ app.post ~ target_id:", target_id)
  console.log("🚀 ~ app.post ~ tweet_id:", tweet_id)
  await likeAndTweet(tweet_id, target_id);
  res.json("success");
})

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

      const bodyString =
        '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
      const parsedBody = JSON.parse(bodyString);

      const isUser = await UserModel.findOne({ user_id: parsedBody.user_id });

      if (isUser) {
        await UserModel.findOneAndUpdate(
          { user_id: parsedBody.user_id },
          {
            access_token: parsedBody.oauth_token,
            access_token_secret: parsedBody.oauth_token_secret,
          }
        );
      } else {
        const newUserSchema = new UserModel({
          user_id: parsedBody.user_id,
          access_token: parsedBody.oauth_token,
          access_token_secret: parsedBody.oauth_token_secret,
        });
        await newUserSchema.save()
      }

      res.json('Success')

    }
  );
});

const port = 2088;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
