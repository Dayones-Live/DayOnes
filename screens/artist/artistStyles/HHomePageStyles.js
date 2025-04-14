import { StyleSheet } from "react-native";
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#000',
        padding: scale(10),
        alignItems: 'center',
        paddingTop: verticalScale(20), // Add padding to the top
        paddingBottom: verticalScale(40),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: verticalScale(30), // Increased margin below header
        width: '100%',
    },
    headerText: {
        color: 'white',
        fontSize: moderateScale(24),
        fontWeight: 'bold',
    },
    logo: {
        width: scale(50), // Scaled width
        height: verticalScale(50), // Scaled height
        resizeMode: 'contain',
    },
    imageContainer: {
        width: '100%',
        height: verticalScale(150),
        borderRadius: scale(20),
        overflow: 'hidden',
        marginBottom: verticalScale(25), // Increased margin below image
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedImageContainer: {
        position: 'relative',
        width: '100%',
        height: '100%',
    },
    selectedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    clearButton: {
        position: 'absolute',
        top: verticalScale(10), // Scaled top position
        right: scale(10), // Scaled right position
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: scale(5), // Scaled padding
        borderRadius: scale(5),
    },
    pictureContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: verticalScale(30), // Increased margin below picture buttons
    },
    pictureButton: {
        width: '45%',
        height: verticalScale(60), // Adjusted height for scaling
        backgroundColor: '#000',
        borderColor: '#000',
        borderWidth: 1,
        borderRadius: scale(10), // Scaled border radius
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraIcon: {
        marginBottom: verticalScale(1), // Scaled margin
    },
    uploadIcon: {
        marginBottom: verticalScale(1), // Scaled margin
    },
    buttonText: {
        color: '#C0C0C0',
        fontSize: moderateScale(14), // Scaled font size
        fontWeight: 'bold',
    },
    switchContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: verticalScale(25), // Increased margin below switch
    },
    sliderLabel: {
        fontSize: moderateScale(16), // Scaled font size
        color: '#C0C0C0',
        marginBottom: verticalScale(5), // Scaled margin
    },
    sendButtonContainer: {
        width: '100%',
        borderRadius: scale(10),
        overflow: 'hidden',
        marginTop: verticalScale(10), // Added some margin above send button
        marginBottom: verticalScale(25),
    },
    sendButtonGradient: {
        paddingVertical: verticalScale(15), // Slightly increased padding
        borderRadius: scale(10),
        width: '100%',
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#ffffff',
        fontSize: moderateScale(16),
        fontWeight: 'bold',
    },
    patentText: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: verticalScale(1),
        marginBottom: verticalScale(4),
    },
    patentLabel: {
        color: '#FFF',
        fontSize: moderateScale(8),
        textAlign: 'center',
    },
    patentNumber: {
        color: '#FFF',
        fontSize: moderateScale(6),
        textAlign: 'center',
    },
    radioGroup: {
        marginBottom: verticalScale(25), // Increased margin below radio group
        alignItems: 'center',
        color: '#C0C0C0',
        width: '100%', // Ensure it takes full width for alignment
    },
    radioGroupLabel: {
        fontSize: moderateScale(14),
        color: '#C0C0C0',
        marginBottom: verticalScale(10), // Added margin below label
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(5), // Scaled margin
    },
    radioLabel: {
        color: '#C0C0C0',
        marginLeft: scale(10), // Scaled margin
        fontSize: moderateScale(14), // Scaled font size
    },
    personalMediaText: {
        color: '#C0C0C0',
        fontSize: moderateScale(16), // Scaled font size
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: verticalScale(-5), // Scaled margin
        marginBottom: verticalScale(20), // Scaled margin
    },
    placeholderContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    overlayTextContainer: {
        position: 'absolute',
        top: '30%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayText: {
        color: '#C0C0C0',
        top: verticalScale(-37),
        fontSize: moderateScale(18), // Adjusted font size for scaling
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default styles;
