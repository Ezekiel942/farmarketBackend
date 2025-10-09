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


const deleteSingleFile = async(publicId, resource_type = 'image') => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, { resource_type }, (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        })
    })
};


module.exports = { deleteFile, deleteSingleFile };