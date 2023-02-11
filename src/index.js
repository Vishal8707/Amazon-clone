const express = require("express");
const mongoose = require("mongoose");
const route = require("./routes/route");
const app = express();

const multer = require('multer');

app.use(express.json());
app.use(multer().any());

mongoose.set("strictQuery", true);
mongoose.connect("mongodb+srv://vishal:8423354673@cluster0.ilmyjln.mongodb.net/product-Mangement",
    { useNewUrlParser: true }
)
    .then(() => console.log("mongoDB is connected."))
    .catch((err) => console.log(err));

app.use("/", route);


app.listen(3000, function () {
    console.log('Express app running on port ' + 3000);
});