const cloudinary = require('../config/cloudinary');



const deleteFile = async (publicIds) => {
    if (!Array.isArray(publicIds) || publicIds.length === 0) {
        return null;
    };

    try {
        const result = await cloudinary.api.delete_resources(publicIds);
        return result;

    } catch(error) {
        console.error(error);
        throw error;
    }
};


module.exports = deleteFile;