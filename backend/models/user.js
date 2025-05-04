import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user"
    },
    password: {
        type: String,
        required: true
    },
    companyPhone: {
        type: String
    },
    companyHandling: {
        type: String
    },
    homeAddress: {
        type: String
    },
    designation: {
        type: String
    },
    confirmPassword: {
        type: String
    },
    contactInformation: {
        type: String
    },
    dateOfJoining: {
        type: Date
    },
    profilePicture: {
        type: String,
        required: true,

    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    }
}, {timestamps: true});

const UserModel = mongoose.model('user', userSchema);

export default UserModel;
