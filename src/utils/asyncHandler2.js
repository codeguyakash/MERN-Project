const asyncHandler = (fn) => async (req, res, next) => {
    try {

    } catch (error) {
        res.status(error.code || 5000).json({
            success: false,
            message: error.message
        })
    }
}

export {asyncHandler};


/*
const asyncHandler = () =>{}
const asyncHandler = (func) => () => {}
const asyncHandler = (func) =>async () => {}
*/