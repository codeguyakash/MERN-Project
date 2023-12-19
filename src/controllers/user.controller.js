import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloud } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went Wrong while generating token")
    }
}
const registerUser = asyncHandler(async (req, res) => {

    const { fullName, email, username, password } = req.body;
    // console.log("console.log", fullName, email, username, password)

    if (
        [fullName, email, password, username].some((field) =>
            field?.trim() == "")
    ) {
        throw new ApiError(400, "Fields required");
    }
    //check for existing user
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "user already exists")
    }
    //check for localPath 
    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar Required")
    }
    //Upload file on cloud 
    const avatar = await uploadOnCloud(avatarLocalPath)
    const coverImage = await uploadOnCloud(coverImageLocalPath)
    console.log("000000", avatar)
    if (!avatar) {
        throw new ApiError(400, "Avatar Required")
    }
    //create new user 
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    //check user and and give response 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something Went Wrong")
    }
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User Created Success")
    )

})
const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    // return console.log(email, username, password)s
    if (!(email || username)) {
        throw new ApiError(400, "username or email is required")
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(401, "User does not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user Credentials")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged In Successfully"))

})
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } }, { new: true })
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))


})
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request ")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token ")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }
        const options = { httpOnly: true, secure: true }
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
        return res.status(200).cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken },
                "Access token Refreshed Success"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})
const changeCurrentUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Incorrect password")
    }
    user.password = newPassword;
    user.save({ validateBeforeSave: false })
    return res.status(200)
        .json(new ApiResponse(200, {}, "Password Changed Success"))
})
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(200, req.user, "Current User Fetch Success")

})
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, username } = req.body;
    if (!(fullName || username)) {
        throw new ApiError(400, "Fields are required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullName: fullName,
            username: username
        }
    }, { new: true }).select("-password")
    return res.status(200).json(new ApiResponse(200, user, "Updated Success!"))




})
const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar Required")
    }
    const avatar = await uploadOnCloud(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400, "Error While file Uploading")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, { new: true }).select("-password")
    return res.status(200).json(new ApiResponse(200, user, "Avatar Updated Success!"))


})
const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Avatar Required")
    }
    const coverImage = await uploadOnCloud(avatarLocalPath);
    if (!coverImage.url) {
        throw new ApiError(400, "Error While file Uploading")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: coverImage.url
        }
    }, { new: true }).select("-password")
    return res.status(200).json(new ApiResponse(200, user, "Cover Image Updated Success!"))
})
export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentUserPassword, getCurrentUser, updateAccountDetails, updateAvatar, updateCoverImage }