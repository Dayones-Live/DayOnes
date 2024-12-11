import RNFS from 'react-native-fs';

export const convertToTemporaryFile = async (contentUri, extension) => {
    try {
        const fileName = `${Date.now()}.${extension}`;
        const tempFilePath = `${RNFS.TemporaryDirectoryPath}/${fileName}`;
        await RNFS.copyFile(contentUri, tempFilePath);
        return tempFilePath;
    } catch (error) {
        console.error('Failed to convert content URI to file path:', error);
        throw error;
    }
};
