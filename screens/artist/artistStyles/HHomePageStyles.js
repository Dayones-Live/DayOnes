import { StyleSheet } from "react-native";
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#000',
        paddingHorizontal: scale(10),
        alignItems: 'center',
        paddingTop: verticalScale(15),
        paddingBottom: verticalScale(20),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: verticalScale(20),
        width: '100%',
    },
    headerText: {
        color: 'white',
        fontSize: moderateScale(24),
        fontWeight: 'bold',
    },
    logo: {
        width: scale(50),
        height: verticalScale(50),
        resizeMode: 'contain',
    },
    imageContainer: {
        width: '100%',
        height: verticalScale(150),
        borderRadius: scale(20),
        overflow: 'hidden',
        marginBottom: verticalScale(15),
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
        top: verticalScale(10),
        right: scale(10),
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: scale(5),
        borderRadius: scale(5),
    },
    pictureContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: verticalScale(20),
    },
    pictureButton: {
        width: '45%',
        height: verticalScale(60),
        backgroundColor: '#000',
        borderColor: '#000',
        borderWidth: 1,
        borderRadius: scale(10),
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraIcon: {
        marginBottom: verticalScale(1),
    },
    uploadIcon: {
        marginBottom: verticalScale(1),
    },
    buttonText: {
        color: '#C0C0C0',
        fontSize: moderateScale(14),
        fontWeight: 'bold',
    },
    switchContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: verticalScale(45),
    },
    sliderLabel: {
        fontSize: moderateScale(16),
        color: '#C0C0C0',
        marginBottom: verticalScale(5),
    },
    sendButtonContainer: {
        width: '100%',
        borderRadius: scale(10),
        overflow: 'hidden',
        marginTop: verticalScale(5),
        marginBottom: verticalScale(15),
    },
    sendButtonGradient: {
        paddingVertical: verticalScale(15),
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
        marginBottom: verticalScale(15),
        alignItems: 'center',
        color: '#C0C0C0',
        width: '100%',
    },
    radioGroupLabel: {
        fontSize: moderateScale(14),
        color: '#C0C0C0',
        marginBottom: verticalScale(8),
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(5),
    },
    radioLabel: {
        color: '#C0C0C0',
        marginLeft: scale(10),
        fontSize: moderateScale(14),
    },
    personalMediaText: {
        color: '#C0C0C0',
        fontSize: moderateScale(16),
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: verticalScale(-5),
        marginBottom: verticalScale(20),
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
        fontSize: moderateScale(18),
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default styles;
