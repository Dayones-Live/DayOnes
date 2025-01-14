import { StyleSheet } from "react-native";
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#000',
        padding: scale(10), // Adjusted padding for consistency
        alignItems: 'center',
        paddingBottom: verticalScale(40), // Scaled bottom padding
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(10), // Scaled margin
    },
    headerText: {
        color: '#C0C0C0',
        fontSize: moderateScale(18), // Adjusted font size for scaling
        fontWeight: 'bold',
        marginHorizontal: scale(5), // Scaled margin
        marginVertical: verticalScale(10), // Scaled margin
    },
    logo: {
        width: scale(50), // Scaled width
        height: verticalScale(50), // Scaled height
        resizeMode: 'contain',
    },
    imageContainer: {
        width: '100%',
        height: verticalScale(150), // Adjusted height for scaling
        borderRadius: scale(20), // Scaled border radius
        overflow: 'hidden',
        marginBottom: verticalScale(10), // Scaled margin
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
        marginBottom: verticalScale(20), // Scaled margin
    },
    pictureButton: {
        width: '45%',
        height: verticalScale(100), // Adjusted height for scaling
        backgroundColor: '#000',
        borderColor: '#000',
        borderWidth: 1,
        borderRadius: scale(10), // Scaled border radius
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraIcon: {
        marginBottom: verticalScale(5), // Scaled margin
    },
    uploadIcon: {
        marginBottom: verticalScale(5), // Scaled margin
    },
    buttonText: {
        color: '#C0C0C0',
        fontSize: moderateScale(14), // Scaled font size
        fontWeight: 'bold',
    },
    switchContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: verticalScale(10), // Scaled margin
    },
    sliderLabel: {
        fontSize: moderateScale(16), // Scaled font size
        color: '#C0C0C0',
        marginBottom: verticalScale(5), // Scaled margin
    },
    sendButtonContainer: {
        width: '100%',
        borderRadius: scale(10), // Scaled border radius
        overflow: 'hidden',
        marginVertical: verticalScale(15), // Scaled margin
    },
    sendButtonGradient: {
        paddingVertical: verticalScale(10), // Scaled padding
        borderRadius: scale(10),
        width: '100%',
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#ffffff',
        fontSize: moderateScale(16), // Scaled font size
        fontWeight: 'bold',
    },
    radioGroup: {
        marginBottom: verticalScale(15), // Scaled margin
        alignItems: 'center',
        color: '#C0C0C0',
    },
    radioGroupLabel: {
        fontSize: moderateScale(14), // Scaled font size
        color: '#C0C0C0',
        marginBottom: verticalScale(5), // Scaled margin
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
