import {BASE_URL} from '../config/config';

async function getBlob(fileUri) {
  const resp = await fetch(fileUri);
  const imageBody = await resp.blob();
  return imageBody;
}

export const uploadImageToBucket = async (uri, keyPath, accessToken) => {
  console.log('Starting image upload process...');
  console.log('URI:', uri);
  console.log('Key Path:', keyPath);
  
  const fileName = new Date().getTime() + '.png';
  try {
    console.log('Getting blob from URI...');
    const imageBody = await getBlob(uri);
    console.log('Blob obtained successfully');
    
    const file = {
      uri: uri,
      name: fileName,
      type: imageBody['type'],
    };

    const path = `${keyPath}/${file.name}`;
    console.log('Preparing to get signed URL for path:', path);

    try {
      const awsData = await getAWSsignedUrl(path, file.type, accessToken);
      console.log('Received AWS signed URL data:', awsData);
      
      if (!awsData?.data?.signedUrl) {
        throw new Error('No signed URL received from server');
      }
      
      const signedUrl = awsData.data.signedUrl;
      console.log('Attempting to upload to S3 with signed URL...');
      
      const res = await uploadImageToS3(signedUrl, file.uri, file);
      console.log('S3 upload response:', res);
      
      if (!res) {
        throw new Error('Failed to get upload response from S3');
      }
      
      return res;
    } catch (error) {
      console.error('Error in S3 upload process:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status:', error.response.status);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in image upload process:', error);
    throw error;
  }
};

const getAWSsignedUrl = async (path, fileMimeType, accessToken) => {
  console.log('Requesting signed URL...');
  console.log('Path:', path);
  console.log('MIME Type:', fileMimeType);
  
  try {
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

    console.log('Signed URL response status:', response.status);
    const data = await response.json();
    console.log('Signed URL response data:', data);
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
};

const uploadImageToS3 = async (signedUrl, imageType, file) => {
  console.log('Uploading to S3...');
  console.log('Signed URL:', signedUrl);
  
  try {
    var myHeaders = new Headers();
    myHeaders.append('Content-Type', imageType);

    const requestOptions = {
      method: 'PUT',
      headers: myHeaders,
      body: file,
      redirect: 'follow',
    };

    console.log('Sending PUT request to S3...');
    const response = await fetch(signedUrl, requestOptions);
    console.log('S3 response status:', response.status);

    if (response.ok) {
      const uploadedUrl = signedUrl.split('?X-Amz-Algorithm')[0];
      console.log('Upload successful. URL:', uploadedUrl);
      return uploadedUrl;
    } else {
      const errorText = await response.text();
      console.error('S3 upload failed:', errorText);
      throw new Error(`S3 upload failed with status ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};

export const uploadSignatureFile = async (accessToken, uri) => {
  const formData = new FormData();
  const fileName = new Date().getTime() + '.png';

  const imageBody = await getBlob(uri);
  const file = {
    uri: uri,
    name: fileName,
    type: imageBody['type'],
  };

  formData.append('file', file);

  try {
    const response = await fetch(`${BASE_URL}/api/v1/signature/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json(); // Parse the JSON response

    console.log('Signature file uploaded', data);
    return data.data; // Return the parsed data
  } catch (error) {
    console.error('Error uploading file:', error); // Handle the error
  }
};
