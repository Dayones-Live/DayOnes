import {BASE_URL} from '../config/config';

async function getBlob(fileUri) {
  const resp = await fetch(fileUri);
  const imageBody = await resp.blob();
  return imageBody;
}

export const uploadImageToBucket = async (uri, keyPath, accessToken) => {
  const fileName = new Date().getTime() + '.png';
  const imageBody = await getBlob(uri);
  const file = {
    uri: uri,
    name: fileName,
    type: imageBody['type'],
  };

  const path = `${keyPath}/${file.name}`;

  try {
    const awsData = await getAWSsignedUrl(path, file.type, accessToken);
    const signedUrl = awsData?.data?.signedUrl;
    const res = await uploadImageToS3(signedUrl, file.uri, file);
    console.log('res', res);
    return res;
  } catch (error) {
    console.log(error);
  }
};

const getAWSsignedUrl = async (path, fileMimeType, accessToken) => {
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

    const data = await response.json(); // Parse the JSON response
    return data;
  } catch (error) {
    console.error(error); // Handle the error as needed
  }
};

const uploadImageToS3 = async (signedUrl, imageType, file) => {
  try {
    var myHeaders = new Headers();
    myHeaders.append('Content-Type', imageType);

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
    }
  } catch (error) {
    console.log(error);
  }
};
