import { StyleSheet } from "react-native";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#000',
        padding: wp('1%'), // 5% of screen width for padding
        alignItems: 'center',
        paddingBottom: hp('10%'), // 10% of screen height for bottom padding
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp('1%'), // 2% of screen height
    },
    headerText: {
        color: '#C0C0C0',
        fontSize: wp('4%'), // 4% of screen width
        fontWeight: 'bold',
        marginHorizontal: wp('0.5%'), // 0.5% of screen width
        marginVertical: hp('1%'), // 1% of screen height
    },
    logo: {
        width: wp('12%'), // 12% of screen width
        height: hp('6%'), // 6% of screen height
        resizeMode: 'contain',
        left: wp('0%'),
    },
    imageContainer: {
        width: '100%',
        height: hp('22%'), // 22% of screen height
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: hp('0%'), // 3% of screen height
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
        top: hp('1%'), // 1% of screen height
        right: wp('2%'), // 2% of screen width
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: wp('1%'),
        borderRadius: 5,
    },
    pictureContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: hp('3%'), // 3% of screen height
    },
    pictureButton: {
        width: '45%',
        height: hp('13%'), // 13% of screen height
        backgroundColor: '#000',
        borderColor: '#000',
        borderWidth: 1,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraIcon: {
        marginBottom: hp('1%'), // 1% of screen height
    },
    uploadIcon: {
        marginBottom: hp('1%'), // 1% of screen height
    },
    buttonText: {
        color: '#C0C0C0',
        fontSize: wp('4%'), // 4% of screen width
        fontWeight: 'bold',
    },
    switchContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: hp('1%'), // 3% of screen height
    },
    sliderLabel: {
        fontSize: wp('4%'), // 4% of screen width
        color: '#C0C0C0',
        marginBottom: hp('1%'), // 1% of screen height
    },
    sendButtonContainer: {
        width: '100%',
        borderRadius: 10,
        overflow: 'hidden',
        marginVertical: hp('3%'), // 3% of screen height
    },
    sendButtonGradient: {
        paddingVertical: hp('2%'), // 2% of screen height
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    sendButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonText: {
        color: '#ffffff',
        fontSize: wp('4.5%'), // 4.5% of screen width
        fontWeight: 'bold',
    },
    radioGroup: {
        marginBottom: hp('3%'), // 3% of screen height
        alignItems: 'center',
        color: '#C0C0C0',
    },
    radioGroupLabel: {
        fontSize: wp('4%'), // 4% of screen width
        color: '#C0C0C0',
        marginBottom: hp('1%'), // 1% of screen height
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp('1%'), // 1% of screen height
        color: '#C0C0C0',
    },
    radioLabel: {
        color: '#C0C0C0',
        marginLeft: wp('2%'), // 2% of screen width
        fontSize: wp('4%'), // 4% of screen width
    },
    personalMediaText: {
        color: '#C0C0C0',
        fontSize: wp('4.5%'), // 4.5% of screen width
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: hp('-1%'), // -1% of screen height
        marginBottom: hp('4%'), // 4% of screen height
    },
    placeholderContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    overlayTextContainer: {
        position: 'absolute',
        top: '30%',
        left: '38%',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayText: {
        color: '#C0C0C0',
        fontSize: wp('5%'), // Adjust font size as needed
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default styles;
