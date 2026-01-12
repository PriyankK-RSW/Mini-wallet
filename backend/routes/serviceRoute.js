const router = require("express").Router();
const Service = require("../models/service");

router.get("/", async (req, res) => {
  const services = await Service.find({ enabled: true });
  res.json(services);
});

module.exports = router;
