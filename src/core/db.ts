import mongoose from 'mongoose';
mongoose.connect('mongodb://mongo:27017/chat', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
},
 (err:any)=>{
  if (err) {
    throw Error(err);
  }
});