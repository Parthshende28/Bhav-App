import API from '../store/api';

// Cloudinary upload service
export const cloudinaryAPI = {
    // Upload single image to Cloudinary
    uploadImage: async (imageUri: string, folder: string, fileName: string) => {
        try {
            // Create form data
            const formData = new FormData();

            // Add the image file
            const imageFile = {
                uri: imageUri,
                type: 'image/jpeg',
                name: fileName
            } as any;

            formData.append('image', imageFile);
            formData.append('folder', folder);

            // Upload to our backend endpoint that handles Cloudinary upload
            const response = await API.post('/upload/cloudinary', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data?.success) {
                return response.data.url;
            } else {
                throw new Error(response.data?.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw error;
        }
    },

    // Upload multiple images to Cloudinary
    uploadMultipleImages: async (imageUris: string[], folder: string) => {
        try {
            const uploadPromises = imageUris.map((uri, index) =>
                cloudinaryAPI.uploadImage(uri, folder, `image_${index}.jpg`)
            );

            const urls = await Promise.all(uploadPromises);
            return urls;
        } catch (error) {
            console.error('Error uploading multiple images:', error);
            throw error;
        }
    }
}; 