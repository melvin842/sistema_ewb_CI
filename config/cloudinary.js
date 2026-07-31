const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Cloudinary config cargada:', {
    cloud_name: cloudinary.config().cloud_name,
    api_key_presente: !!cloudinary.config().api_key,
    api_secret_presente: !!cloudinary.config().api_secret
});

module.exports = cloudinary;