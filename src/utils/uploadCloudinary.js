const cloudinary = require('../config/cloudinary');



const uploadFile = (buffer, publicId, folder, resource_type='auto') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
            folder,
            public_id: publicId,
            resource_type,
            transformation: [
                    { width: 600, height: 600, crop: 'fill', gravity: 'auto' },
                    { quality: 'auto', fetch_format: 'auto' }
                ],
            }, 
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            })
            stream.end(buffer);
    });

};





module.exports =  uploadFile;