require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const logger = require("morgan");

const db = require("./db");

const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth");
const accountsRouter = require("./routes/accounts");
const apiRouter = require("./routes/api");

const eventsService = require("./services/events");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "land and expand",
    resave: false,
    saveUninitialized: false,
    store: new (require("connect-pg-simple")(session))({
      pool: db.pool,
      createTableIfMissing: true,
    }),
  })
);

app.use(passport.authenticate("session"));
app.use(async (req, res, next) => {
  res.locals.user = req.user;

  if (req.user) {
    res.locals.events = await eventsService.findEvents(req.user.id);
  } else {
    res.locals.events = await eventsService.allEvents();
  }

  next();
});

app.use("/", indexRouter);
app.use("/api", apiRouter);
app.use("/auth", authRouter);
app.use("/accounts", accountsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
