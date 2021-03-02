"Use Strict"
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pg = require('pg');
const { RateLimiter, second, minute } = require("./rateLimiter");
const rateLimiterArray = [];

// clean cache every 1 minue
setInterval(() => {
  rateLimiterArray.forEach(ob => {
    ob.clean_cache(new Date().getTime);
  })
}, 1*minute)

const app = express()
app.use(cors());
// configs come from standard PostgreSQL env vars
// https://www.postgresql.org/docs/9.6/static/libpq-envars.html
const pool = new pg.Pool()

const queryHandler = (req, res, next) => {
  pool.query(req.sqlQuery).then((r) => {
    return res.json(r.rows || [])
  }).catch(next)
}

function getRateLimitHandler () {
  const rateLimiter = new RateLimiter(5*second, 5);
  rateLimiterArray.push(rateLimiter);
  const rateLimitHandler = (req, res, next) => {
    const userToken = req.get("userToken")
    if (!userToken) {
      res.status(401).send("Please provide a userToken.");
    } else {
      if (rateLimiter.check_limit(userToken, new Date().getTime())) {
        return next()
      } else {
        res.status(429).send("Too Many Requests.");
      }
    }
  }
  return rateLimitHandler;
}



app.get('/', (req, res) => {
  console.log(req.get("userToken"));
  res.send('Welcome to EQ Works 😎')
})


app.get('/events/hourly', getRateLimitHandler(), (req, res, next) => {
  req.sqlQuery = `
    SELECT date, hour, events
    FROM public.hourly_events
    ORDER BY date, hour
    LIMIT 168;
  `
  return next()
}, queryHandler)

app.get('/events/daily', getRateLimitHandler(), (req, res, next) => {
  req.sqlQuery = `
    SELECT date, SUM(events) AS events
    FROM public.hourly_events
    GROUP BY date
    ORDER BY date
    LIMIT 7;
  `
  return next()
}, queryHandler)

app.get('/stats/hourly', getRateLimitHandler(), (req, res, next) => {
  req.sqlQuery = `
    SELECT date, hour, impressions, clicks, revenue
    FROM public.hourly_stats
    ORDER BY date, hour
    LIMIT 168;
  `
  return next()
}, queryHandler)

app.get('/stats/daily', getRateLimitHandler(), (req, res, next) => {
  req.sqlQuery = `
    SELECT date,
        SUM(impressions) AS impressions,
        SUM(clicks) AS clicks,
        SUM(revenue) AS revenue
    FROM public.hourly_stats
    GROUP BY date
    ORDER BY date
    LIMIT 7;
  `
  return next()
}, queryHandler)

app.get('/poi', getRateLimitHandler(), (req, res, next) => {
  req.sqlQuery = `
    SELECT *
    FROM public.poi;
  `
  return next()
}, queryHandler)

app.listen(process.env.PORT || 5555, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  } else {
    console.log(`Running on ${process.env.PORT || 5555}`)
  }
})

// last resorts
process.on('uncaughtException', (err) => {
  console.log(`Caught exception: ${err}`)
  process.exit(1)
})
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  process.exit(1)
})
