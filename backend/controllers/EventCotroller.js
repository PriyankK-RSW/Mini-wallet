const { getEvents } = require("../integration/Eventsapi");

exports.getEvents = async (req, res) => {
  
  const events = await getEvents();
  res.json(events);
};
    