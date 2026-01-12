const router = require("express").Router();
const { getEvents } = require("../controllers/EventCotroller");

router.get("/events", getEvents);

module.exports = router;


