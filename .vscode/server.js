const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Routes
const questionRoutes = require('./routes/questionRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Constitution Wheel Game API');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
