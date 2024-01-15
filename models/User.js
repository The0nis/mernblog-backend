mongoose = require("mongoose");

const { model, Schema } = mongoose;

const UserSchema = new Schema({
  username: { type: String, min: 3, require: true, unique: true },
  password: { type: String, min: 3, require: true },
});

const UserModel = model("User", UserSchema);

module.exports = UserModel;
