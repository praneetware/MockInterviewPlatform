import Template
from "../models/Template";

export const getTemplates =
async (req,res) => {

  const templates =
  await Template.find();

  res.json(templates);

};

export const createTemplate =
async (req,res) => {

  const template =
  await Template.create(req.body);

  res.json(template);

};

export const deleteTemplate =
async (req,res) => {

  await Template.findByIdAndDelete(
    req.params.id
  );

  res.json({
    success:true
  });

};