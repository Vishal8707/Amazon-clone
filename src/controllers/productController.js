const productModel = require("../models/productModel");
const mongoose = require("mongoose");

let product = async function (req, res) {
  try {

    let createProduct = await productModel.create(data);

    return res
      .status(201)
      .send({ status: true, message: "Success", data: createProduct });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { product };