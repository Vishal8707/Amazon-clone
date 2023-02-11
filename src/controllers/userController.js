const userModel = require("../models/userModel");
const { uploadFile } = require("../AWS/awsConfig");
const {
  validateName,
  validateEmail,
  validatePassword,
  validateMobileNo,
  validatePincode,
  validatePlace,
} = require("../validation/validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { isValidObjectId } = require("mongoose");





//================================= Register User ================================================//



const register = async function (req, res) {
  try {
    let files = req.files;
    let data = req.body;

    if (data.address) {
      data.address = JSON.parse(data.address);
    }

    let { fname, lname, email, phone, password, address } = data;

    if (Object.keys(data).length == 0 && (!files || files.length == 0))
      return res
        .status(400)
        .send({ status: false, message: "Body can't be empty" });

    if (!fname || !fname.trim())
      return res
        .status(400)
        .send({
          status: false,
          message: "Please provide fname or it can't be empty",
        });

    if (!validateName(fname))
      return res
        .status(400)
        .send({ status: false, message: "Please provide valid  fname" });

    if (!lname)
      return res
        .status(400)
        .send({ status: false, messsage: "Please provide lname" });

    if (!validateName(lname))
      return res
        .status(400)
        .send({ status: false, message: "Please provide valid  lname" });

    if (!email)
      return res
        .status(400)
        .send({ status: false, messsage: "Email is mandatory" });

    if (!validateEmail(email))
      return res
        .status(400)
        .send({ status: false, messsage: "Please provide valid email" });

    let checkEmailId = await userModel.findOne({ email: email });

    if (checkEmailId) {
      return res
        .status(400)
        .send({ status: false, message: "This email Id is already in use." });
    }

    if (!phone)
      return res
        .status(400)
        .send({ status: false, messsage: "Phone is mandatory" });

    if (!validateMobileNo(phone))
      return res
        .status(400)
        .send({ status: false, messsage: "Please provide valid phone Number" });

    let checkphone = await userModel.findOne({ phone: phone });

    if (checkphone) {
      return res
        .status(400)
        .send({
          status: false,
          message: "This mobile number is already in use.",
        });
    }

    if (!password)
      return res
        .status(400)
        .send({ status: false, messsage: "Paasword is mandatory" });

    if (!validatePassword(password))
      return res
        .status(400)
        .send({
          status: false,
          messsage:
            "Please provide valid password,it should contain uppercase,number and special character and 8-15 length",
        });

    let hashing = bcrypt.hashSync(password, 8);
    data.password = hashing;

    if (address) {
      if (typeof address != "object") {
        return res
          .status(400)
          .send({
            status: false,
            message: "Value of address must be in json format",
          });
      }

      if (!address.shipping)
        return res
          .status(400)
          .send({ status: false, messsage: "Shipping is mandatory" });

      if (!address.shipping.street)
        return res
          .status(400)
          .send({ status: false, messsage: "Please provide street" });

      if (!address.shipping.city)
        return res
          .status(400)
          .send({ status: false, messsage: "Please provide city" });

      if (!validatePlace(address.shipping.city))
        return res
          .status(400)
          .send({ status: false, messsage: "Please provide city" });

      if (!address.shipping.pincode)
        return res
          .status(400)
          .send({ status: false, messsage: "Please provide pincode" });

      if (!address.billing)
        return res
          .status(400)
          .send({ status: false, messsage: "Please provide billing" });

      if (!address.billing.street)
        return res
          .status(400)
          .send({ status: false, messsage: "Please provide street" });

      if (!address.billing.city)
        return res
          .status(400)
          .send({ status: false, messsage: "Please provide city" });

      if (!validatePlace(address.billing.city))
        return res
          .status(400)
          .send({ status: false, messsage: "Please provide valid city" });

      if (!address.billing.pincode)
        return res
          .status(400)
          .send({ status: false, messsage: "Please provide pincode" });
    } else {
      return res
        .status(400)
        .send({ status: false, messsage: "Please provide address" });
    }

    if (files && files.length > 0) {
      if (files.length > 1) {
        return res
          .status(400)
          .send({
            status: false,
            message: "You can't enter more than one file for create ",
          });
      }

      let uploadFileURL = await uploadFile(files[0]);
      data.profileImage = uploadFileURL;
    } else {
      return res
        .status(400)
        .send({ status: false, message: "Profile Image is Mandatory" });
    }
    
    
    let savedata = await userModel.create(data);

    return res.status(201).send({
      status: true,
      message: "User created successfully",
      data: savedata,
    });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};



//==================================== Login User ============================================//


const userLogin = async function (req, res) {
  try {
    let { email, password } = req.body;

    if (Object.keys(req.body).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please input user Details" });
    }

    if (!email) {
      return res
        .status(400)
        .send({ status: false, message: "EmailId is mandatory" });
    }

    if (!validateEmail(email)) {
      return res
        .status(400)
        .send({ status: false, message: "EmailId should be Valid" });
    }

    if (!password) {
      return res
        .status(400)
        .send({ status: false, message: "Password is mandatory" });
    }

    let verifyUser = await userModel.findOne({ email: email });
    if (!verifyUser) {
      return res
      .status(400)
      .send({ status: false, message: "user not found" });
    }

    let hash = verifyUser.password;

    let isCorrect = bcrypt.compareSync(password, hash);
    if (!isCorrect)
      return res
        .status(400)
        .send({ status: false, message: "Password is incorrect" });

    let payload = { userId: verifyUser["_id"], iat: Date.now() };
    let token = jwt.sign(payload, "group-13-project", { expiresIn: "1h" });

    res.setHeader("x-api-key", token);
    return res.status(200).send({
      status: true,
      message: "User login successfull",
      data: { userId: verifyUser["_id"], token },
    });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};


//======================================== Get User ==========================================//


const getUsers = async function (req, res) {
  try {
    let userId = req.params.userId;

    if (!isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, message: "User is invalid" });

    let getData = await userModel.findOne({ _id: userId });

    if (!getData)
      return res.status(404).send({ status: false, message: "user not found" });
      
    return res
      .status(200)
      .send({ status: true, message: "User profile details", data: getData });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//======================================== Update User ==========================================//

const updateUser = async function (req, res) {
  try {
    let userId = req.params.userId;

    if (!isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, message: "User Id is invalid." });

    let getUserId = await userModel.findOne({ _id: userId });
    if (!getUserId)
      return res
        .status(404)
        .send({ status: false, message: "User Id not found." });

    let data = req.body;

    let files = req.files;

    let { fname, lname, email, phone, password, address } = data;

    if (Object.keys(data).length == 0 && (!files || files.length == 0))
      return res
        .status(400)
        .send({ status: false, message: "At least one field is mendatory." });

    let updatedData = {};

    if (fname) {
      if (!validateName(fname)) {
        return res
          .status(400)
          .send({ status: false, message: "First name must be string." });
      }
      if (!fname.trim()) {
        return res
          .status(400)
          .send({ status: false, message: "First name can not be empty." });
      }
      fname = fname.trim();
      updatedData.fname = fname;
    }

    if (lname) {
      if (!validateName(lname)) {
        return res
          .status(400)
          .send({ status: false, message: "Last name must be string." });
      }
      if (!lname.trim()) {
        return res
          .status(400)
          .send({ status: false, message: "Last name can not be empty." });
      }
      lname = lname.trim();
      updatedData.lname = lname;
    }

    if (email) {
      if (!validateEmail(email)) {
        return res
          .status(400)
          .send({ status: false, message: "Email id must be proper syntax." });
      }
      if (!email.trim()) {
        return res
          .status(400)
          .send({ status: false, message: "Email can not be empty." });
      }

      let checkEmailId = await userModel.findOne({ email: email });
      if (checkEmailId) {
        return res
          .status(400)
          .send({
            status: false,
            message:
              "This Email id is already used ,Please provide another Email Id.",
          });
      }
      email = email.trim();
      updatedData.email = email;
    }
    if (phone) {
      if (!validateMobileNo(phone)) {
        return res
          .status(400)
          .send({
            status: false,
            message: "Mobile number must be Indian format.",
          });
      }
      if (!phone.trim()) {
        return res
          .status(400)
          .send({ status: false, message: "Phone number can not be empty." });
      }
      let checkphone = await userModel.findOne({ phone: phone });
      if (checkphone) {
        return res
          .status(400)
          .send({
            status: false,
            message:
              "This phone number is already used ,Please provide another phone number.",
          });
      }
      phone = phone.trim();
      updatedData.phone = phone;
    }
    if (password) {
      if (!validatePassword(password)) {
        return res
          .status(400)
          .send({ status: false, messsage: "Please provide valid password." });
      }
      if (!password.trim()) {
        return res
          .status(400)
          .send({ status: false, message: "Password can not be empty." });
      }
      password = password.trim();
      let hashing = bcrypt.hashSync("password", 8);
      updatedData.password = hashing;
    }
    if (address) {
      address = JSON.parse(data.address);

      if (typeof address != "object") {
        return res
          .status(400)
          .send({ status: false, message: "Address must be Object." });
      }

      let { shipping, billing } = address;
      if (shipping) {
        if (typeof shipping != "object") {
          return res
            .status(400)
            .send({ status: false, message: "Shipping  must be Object." });
        }

        let { street, city, pincode } = shipping;
        if (street) {
          if (!street.trim()) {
            return res
              .status(400)
              .send({ status: false, message: "Street  can not be empty." });
          }
        }
        if (city) {
          if (!validatePlace(city)) {
            return res
              .status(400)
              .send({ status: false, message: "Please enter valid city." });
          }
          if (!city.trim()) {
            return res
              .status(400)
              .send({ status: false, message: "City  can not be empty." });
          }
        }
        if (pincode) {
          if (!validatePincode(pincode)) {
            return res
              .status(400)
              .send({
                status: false,
                message: "Pincode must be in numbers only.",
              });
          }
        }
      }
      if (billing) {
        if (typeof billing != "object") {
          return res
            .status(400)
            .send({ status: false, message: "Billing  must be Otring." });
        }

        let { street, city, pincode } = billing;
        if (street) {
          if (!street.trim()) {
            return res
              .status(400)
              .send({ status: false, message: "Street  can not be empty." });
          }
        }
        if (city) {
          if (!validatePlace(city)) {
            return res
              .status(400)
              .send({ status: false, message: "Please enter valid city." });
          }
          if (!city.trim()) {
            return res
              .status(400)
              .send({ status: false, message: "City  can not be empty." });
          }
        }
        if (pincode) {
          if (!validatePincode(pincode)) {
            return res
              .status(400)
              .send({
                status: false,
                message: "Pincode must be in numbers only.",
              });
          }
        }
      }
      updatedData.address = address;
    }

    if (files && files.length > 0) {
      let uploadFileURL = await uploadFile(files[0]);

      updatedData.profileImage = uploadFileURL;
    }

    let updateUserData = await userModel.findOneAndUpdate(
      { _id: userId },
      updatedData,
      { new: true }
    );

    return res
      .status(200)
      .send({
        status: true,
        message: "User profile updated",
        data: updateUserData,
      });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { register, getUsers, userLogin, updateUser };
