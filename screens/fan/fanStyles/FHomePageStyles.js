import { StyleSheet } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        alignItems: 'center',
        paddingVertical: hp('2%'), // Space around the header
    },
    logo: {
        width: wp('15%'), // Adjust to desired size
        height: hp('6%'),
        resizeMode: 'contain',
        top: '-10%',
    },
    cancelButton: {
        marginTop: 20,
        backgroundColor: 'red',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    personalMediaText: {
        color: '#C0C0C0',
        fontSize: wp('5%'), // Font size for "Personal Media"
        fontWeight: 'bold',
        marginTop: hp('-0.9%'),
    },
    inviteItemGradient: {
        marginVertical: hp('1%'),
        borderRadius: wp('2%'),
        marginHorizontal: wp('2%'),
    },
    inviteItem: {
        padding: wp('3%'),
    },
    userInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp('1%'),
    },
    avatar: {
        width: wp('10%'),
        height: wp('10%'),
        borderRadius: wp('5%'),
        marginRight: wp('2%'),
    },
    userName: {
        fontSize: wp('4%'),
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    inviteText: {
        color: '#FFFFFF',
        fontSize: wp('3.5%'),
        marginBottom: hp('1%'),
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: hp('1%'),
    },
    inviteButton: {
        flex: 1,
        paddingVertical: hp('1%'),
        marginHorizontal: wp('1%'),
        borderRadius: wp('2%'),
        alignItems: 'center',
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
    },
    denyButton: {
        backgroundColor: '#f44336',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    countdownText: {
        color: '#fff',
        fontSize: wp('4%'),
        marginTop: hp('1%'),
    },
    // Static Placeholder Image and Text
    staticContainer: {
        position: 'absolute',
        top: hp('20%'),
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: -1,
    },
    staticPlaceholderImage: {
        width: wp('125%'),
        height: hp('100%'),
        resizeMode: 'contain',
        top: '-38.4%',
    },
    staticOverlayText: {
        position: 'absolute',
        top: '1.7%',
        textAlign: 'center',
        color: '#c0c0c0',
        fontSize: wp('5%'),
        fontWeight: 'bold',
    },
    // Fixed Button Styling
    fixedButtonContainer: {
        position: 'absolute',
        bottom: hp('2%'),
        left: wp('0%'),
        right: wp('0%'),
        alignItems: 'center',
    },
    sendButtonGradient: {
        paddingVertical: hp('2%'),
        borderRadius: wp('3%'),
        width: '100%',
        alignItems: 'center',
    },
    sendButtonText: {
        color: 'white',
        fontSize: wp('4.5%'),
        fontWeight: 'bold',
    },
    // Update the patent text style
    patentText: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp('1%'),
    },
    patentLabel: {
        color: '#FFF',
        fontSize: wp('2%'),
        textAlign: 'center',
    },
    patentNumber: {
        color: '#FFF',
        fontSize: wp('1.5%'),
        textAlign: 'center',
    },
});

export default styles;
