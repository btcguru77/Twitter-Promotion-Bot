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
const ScheduleModel = require("./models/ScheduleModel");
const ContentModel = require("./models/ContentsModel");
const axios = require('axios');
const moment = require('moment-timezone');

dotenv.config();

// Set timezone to UTC
process.env.TZ = 'UTC';

const whitelist = ["http://localhost:5173", "https://shicat.vercel.app", "https://demo.shicat.xyz", "https://shicat.xyz"];

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
app.use(cors(corsOptions));

connectMongoDB();

app.get("/", (req, res, next) => {
  res.send("Hello world!");
});

const getCurrentTimeUTC = () => {
  return moment().tz('UTC').toDate();
};

const getTweets = async (target_id, callNum) => {
  console.log(`Fetching tweets for call number ${callNum}`);
  try {
    const query = `from:${target_id}`;

    const response = await axios.get(
      "https://api.twitter.com/2/tweets/search/recent",
      {
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_TOKEN}`,
        },
        params: {
          query: query,
          max_results: 10
        },
      }
    );

    for (let i = 0; i < response.data.data.length; i++) {
      const element = response.data.data[i];
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

    const rateLimit = response.rateLimit;
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

    await TweetModel.findOneAndUpdate({ tweet_id: tweet_id })
    return true
  } catch (error) {
    console.log("like and tweet error => ", error);
    return false
  }
}

function truncateSentence(sentence, maxLength = 100) {
  if (sentence.length <= maxLength) {
    return sentence;
  }
  return sentence.substring(0, maxLength);
}

const postTweet = async (contents) => {
  console.log('tweeting ===> ')
  const users = await UserModel.find();

  if (users) {
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const randomIndex = Math.floor(Math.random() * contents.length);
      console.log("--------------->", contents[randomIndex].tweet)
      request.post(
        {
          url: `https://api.twitter.com/2/tweets`,
          oauth: {
            consumer_key: process.env.consumerKey,
            consumer_secret: process.env.consumerSecret,
            token: user.access_token,
            token_secret: user.access_token_secret,
          },
          json: true,
          body: {
            text: truncateSentence(contents[randomIndex].tweet)
          }
        },
        function (err1, r1, body1) {
          console.log("post tweet err1 => ", err1);
          console.log("post tweet body1 => ", body1);
          if (err1) {
            console.log("There was an error through post tweet");
            res
              .status(404)
              .json({ msg: "There was an error through post tweet" });
          } else {
            console.log("post success!");
          }
        }
      );
    }
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

// cron job for schedule post
cron.schedule('* * * * *', async () => {
  console.log('first ==> ');
  const now = getCurrentTimeUTC();
  const eightMinsAgo = moment(now).subtract(8, 'minutes').toDate();
  const schedule = await ScheduleModel.findOne({ schedule: { $gte: eightMinsAgo, $lte: now }, done: false });
  console.log('schedule => ', schedule)
  if (!schedule) return
  console.log('second ==> ')
  await postTweet(schedule.contents)
  await ScheduleModel.findOneAndUpdate({ _id: schedule.id }, { done: true });
})

// app.post('/addcontent', async (req, res) => {
//   const { content } = req.body;

//   try {
//     const newContentSchema = new ContentModel({
//       content: content
//     })

//     const newContent = await newContentSchema.save();

//     res.json({ newContent })
//   } catch (error) {
//     res.status(500).json({ err: error })
//   }

// })

app.get('/getSchedule', async (req, res) => {
  const schedules = await ScheduleModel.find();
  res.json({ schedules: schedules.map(schedule => ({
    ...schedule.toObject(),
    schedule: moment(schedule.schedule).tz('UTC').format(),
  })) });
})

app.post('/addSchedule', async (req, res) => {
  const { timelater, contents } = req.body;

  try {
    const now = getCurrentTimeUTC();
    const newScheduleSchema = new ScheduleModel({
      schedule: moment(now).add(timelater, 'minutes').toDate(),
      contents: contents,
    });

    const newSchedule = await newScheduleSchema.save();
    res.json({ newSchedule });
  } catch (error) {
    res.status(500).json({ err: error });
  }
})

app.get('/getSchedule/:id', async (req, res) => {
  const { id } = req.params;
  const schedule = await ScheduleModel.findOne({ _id: id });
  if (!schedule) return res.status(500).json({ err: "This schedule does not exist!" });

  res.json({
    schedule: {
      ...schedule.toObject(),
      schedule: moment(schedule.schedule).tz('UTC').format(),
    }
  });
})

const PORT = process.env.PORT || 2088;
app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
