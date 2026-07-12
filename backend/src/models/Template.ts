import mongoose from "mongoose";

const TemplateSchema =
new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  description: String,

  category: String,

  difficulty: String,

  questions: [String]

});

export default mongoose.model(
  "Template",
  TemplateSchema
);