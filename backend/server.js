
const app = require("./app");
const connectDB = require("./config/db");
const redis = require("./config/redis");


connectDB(); 
redis.set("testkey", "hello");
redis.get("testkey").then(console.log);

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on port", process.env.PORT || 5000);
});
