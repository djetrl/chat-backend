import mongoose from 'mongoose';
mongoose.connect('mongodb://0.0.0.0:27017/chat', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
});