import { BASE_URL } from '../config/config';
import { Alert } from 'react-native';

// Helper function to get the Blob from a file URI
async function getBlob(fileUri) {
    const resp = await fetch(fileUri);
    const videoBody = await resp.blob();
    return videoBody;
}

// Function to upload a video to the S3 bucket
export const uploadVideoToBucket = async (uri, keyPath, accessToken, mimeType) => {
    const fileName = new Date().getTime() + '.mp4';
    const videoBody = await getBlob(uri);
    const file = {
        uri: uri,
        name: fileName,
        type: 'VIDEO',
    };

    const path = `${keyPath}/${file.name}`;

    try {
        console.log(`Requesting signed URL for path: ${path} with MIME type: ${mimeType}`);
        const awsData = await getAWSsignedUrl(path, file.type, accessToken);
        const signedUrl = awsData?.data?.signedUrl;
        const res = await uploadVideoToS3(signedUrl, file.uri, file);
        console.log('Uploaded URL:', res);
        return res;
    } catch (error) {
        console.error('Error during video upload:', error);
    }
};



// Helper function to get a signed URL from the server for S3 upload
const getAWSsignedUrl = async (path, fileMimeType, accessToken) => {
    try {
        console.log(`Requesting signed URL for path: ${path} with MIME type: ${fileMimeType}`);
        const response = await fetch(`${BASE_URL}/api/v1/s3`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                path: path,
                fileMimeType: fileMimeType,
                isUpload: true,
            }),
        });

        const data = await response.json(); // Parse the JSON response
        console.log('Signed URL response:', data); // Log the complete response
        return data;
    } catch (error) {
        console.error('Error fetching signed URL:', error); // Handle the error as needed
    }
};


// Function to upload the video file to S3 using the signed URL
const uploadVideoToS3 = async (signedUrl, file) => {
    try {
        const myHeaders = new Headers();
        myHeaders.append('Content-Type', file.type);

        const requestOptions = {
            method: 'PUT',
            headers: myHeaders,
            body: file,
            redirect: 'follow',
        };

        const response = await fetch(signedUrl, requestOptions);

        if (response.ok) {
            const uploadedUrl = signedUrl.split('?X-Amz-Algorithm')[0];
            return uploadedUrl;
        } else {
            throw new Error('Failed to upload video to S3');
        }
    } catch (error) {
        console.error('Error uploading video to S3:', error);
    }
};
