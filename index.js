require('dotenv').config();
const express = require('express')
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


const MONGO_URI = process.env.MONGO_URI;

console.log("MONGO_URI", MONGO_URI);

mongoose.connect(MONGO_URI);


app.use(bodyParser.urlencoded({ extended: false }));           
app.use(bodyParser.json()) 

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  }
})

const exerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  }, 
  userId: {
    type: String, 
    required: true
  },
  duration: {
    type: Number, 
    required: true
  },
  date: {
    type: Date, 
    required: true
  }
})

const User = new mongoose.model("User", userSchema);
const Exercise = new mongoose.model("Exercise", exerciseSchema);



app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", async (_, res) => {
  try {
    const users = await User.find({}).select('-__v');
    return res.json(users);
  } catch(e){
    return res.status(500).json({ message: "Something unexpected happened" });
  }
})

app.post("/api/users", async (req,res) => {

  const user = new User({
    username: req.body.username
  })

  try {
    const data = await user.save();
    return res.status(200).json({ username: data.username, _id: data._id });
  } catch(e){
    return res.status(500).json({ message: "Something unexpected happened" });
  }

})

app.post("/api/users/:_id/exercises", async (req, res) => {

  console.log(req.body);
  const {  description, duration, date } = req.body; 

  const id = req.body[":_id"];

    try {

   const user = await User.findById(id);

  const exercise = new Exercise({
    description,
    duration,
    userId: id,
    date: date ? date : new Date()
  })


    const data = await exercise.save();
    return res.json({
      username: user.username, 
      description: data.description, 
      duration: data.duration,
      date: data.date.toDateString()
    })
  } catch(e){
    console.log(e);
    return res.status(500).json({ message: "Something unexpected happened" });
  }

})

app.get("/api/users/:_id/logs", async (req, res) => {

  const userId = req.params["_id"];
  

  try {

    const from = req.query.from; 
    const to = req.query.to;
    const limit = req.query.limit;
    const user = await User.findById(userId);

    const query = { userId }
    
    if(from || to){
      query.date = {};
      
      if(from) {
        query.date["$gte"] = new Date(from);
      }
      
      if(to){
        query.date["$lte"] = new Date(to);
      }
    }


    let exerciseQuery = Exercise.find(query).select("-__v");

    if(limit){
      exerciseQuery.limit(limit);
    }

    const exercises = await exerciseQuery;

    const log = exercises.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: new Date(ex.date).toDateString(), // You can use toISOString() or another format if preferred
    }));

    return res.json({
      username: user.username,
      _id: user._id, 
      count: exercises.length,
      log
    })
  } catch(e){
    console.error(e);
    return res.status(500).json({ message: "Something unexpected happened" });
  }

})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
