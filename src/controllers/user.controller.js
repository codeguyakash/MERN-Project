import { asyncHandler } from '../utils/asyncHandler.js';

const signUp = asyncHandler(async (req, res) => {
    res.status(201).json({ message: "Created" })
})
const signIn = asyncHandler(async (req, res) => {
    res.status(200).json({ message: "Login Success" })
})

export { signUp, signIn }