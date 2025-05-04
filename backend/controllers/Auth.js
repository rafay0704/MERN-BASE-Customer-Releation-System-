import UserModel from "../models/user.js";
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';

const register = async (req, res) => {
  try {
      const { name, email, password, confirmPassword, companyPhone, companyHandling, homeAddress, designation, contactInformation, dateOfJoining } = req.body;

      if (password !== confirmPassword) {
          return res.status(400).json({ success: false, message: "Passwords do not match" });
      }

      const existUser = await UserModel.findOne({ email });

      if (existUser) {
          return res.status(401).json({ success: false, message: "User already exists" });
      }

      const hashpassword = await bcryptjs.hash(password, 10);
      const profilePicture = req.file ? `/uploads/profile/${req.file.filename}` : null;

      const newUser = new UserModel({
          name,
          email,
          password: hashpassword,
          companyPhone,
          companyHandling,
          homeAddress,
          designation,
          contactInformation,
          dateOfJoining,
          profilePicture,
      });

      await newUser.save();

      res.status(201).json({ success: true, message: "User registered", user: newUser });
  } catch (error) {
      res.status(500).json({ success: false, message: "Internal Server Error" });
      console.error(error);
  }
};





const login = async (req, res) => {
  try {
      const { email, password } = req.body;
      const user = await UserModel.findOne({ email });

      if (!user) {
          return res.status(404).json({ success: false, message: "Invalid Credentials" });
      }
 // Check if the user is active
 if (user.status !== "active") {
  return res.status(403).json({ success: false, message: "This user has been deactivated by the system" });
}
      const isPasswordValid = await bcryptjs.compare(password, user.password);
      if (!isPasswordValid) {
          return res.status(401).json({ success: false, message: "Password Incorrect" });
      }

      // JWT without expiration
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET); // No `expiresIn` option

      res.cookie('token', token, {
          httpOnly: true,
          secure: false, // Set to `true` if you're using HTTPS
      });


        // JWT expires in 8 hours
        // const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '10h' });

        // res.cookie('token', token, {
        //     httpOnly: true,
        //     secure: false, // Set to `true` if you're using HTTPS
        //     maxAge: 10 * 60 * 60 * 1000, // 10 hours in milliseconds
        // });

      res.status(200).json({ success: true, message: "Login successful", user, token });
  } catch (error) {
      res.status(500).json({ success: false, message: "Internal Server Error" });
      console.log(error);
  }
};

const logout = async (req, res) => {
  try {
      res.clearCookie('token');
      res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
      res.status(500).json({ success: false, message: "Internal Server Error" });
      console.log(error);
  }
};



const CheckUser = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(404).json({ message: 'User not found' });
    }
    
        
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
    console.log(error);
  }
};


const getProfilePictureByName = async (req, res) => {
  const { name } = req.params;


  try {
    const user = await UserModel.findOne({ name });

    if (!user) {
      // console.log('User not found'); // Debug log
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // console.log('User found:', user); // Debug log
    res.status(200).json({ success: true, profilePicture: user.profilePicture });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
    console.error(error);
  }
};

// const addStatusField = async (req, res) => {
//   try {
//       const result = await UserModel.updateMany(
//           { status: { $exists: false } }, // Find users without the "status" field
//           { $set: { status: "active" } } // Set the "status" field to "active"
//       );

//       res.status(200).json({
//           success: true,
//           message: `${result.modifiedCount} users updated with the 'status' field set to 'active'.`,
//       });
//   } catch (error) {
//       res.status(500).json({
//           success: false,
//           message: "Failed to update users",
//           error: error.message,
//       });
//       console.error(error);
//   }
// };
const toggleUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if the user role is admin or designation is Software Engineer
    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Admin users cannot have their status changed" });
    }

    if (user.designation === "Software Engineer") {
      return res.status(403).json({ success: false, message: "Software Engineers cannot have their status changed" });
    }

    // Proceed with status change
    user.status = status;
    await user.save();

    res.status(200).json({ success: true, message: "User status updated", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
    console.error(error);
  }
};

export { register, login, logout, CheckUser , getProfilePictureByName, toggleUserStatus};
