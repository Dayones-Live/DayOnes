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
    notificationButton: {
        position: 'absolute',
        top: hp('9.3%'),
        right: wp('4%'),
        padding: wp('2%'),
        zIndex: 1,
    },
    badge: {
        position: 'absolute',
        right: 0,
        top: 0,
        backgroundColor: '#D500F9',
        borderRadius: wp('2%'),
        minWidth: wp('4%'),
        height: wp('4%'),
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: wp('2.5%'),
        fontWeight: 'bold',
    },
    // Invites Header Styles
    invitesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp('4%'),
        paddingVertical: hp('2%'),
        marginBottom: hp('2%'),
    },
    invitesCountText: {
        fontSize: wp('4%'),
        color: '#FFFFFF',
        fontWeight: '600',
    },
    acceptAllButton: {
        borderRadius: wp('2.5%'),
        overflow: 'hidden',
    },
    acceptAllButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp('1.5%'),
        paddingHorizontal: wp('4%'),
        gap: wp('2%'),
    },
    acceptAllButtonText: {
        color: 'white',
        fontSize: wp('3.5%'),
        fontWeight: '600',
    },
    // Modern Invite Card Styles
    inviteCard: {
        marginVertical: hp('1%'),
        marginHorizontal: wp('4%'),
        borderRadius: wp('3%'),
        overflow: 'hidden',
        shadowColor: '#D500F9',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 6,
    },
    inviteCardGradient: {
        padding: wp('3%'),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    inviteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp('1.5%'),
    },
    userInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        flexWrap: 'wrap',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: wp('2.5%'),
    },
    avatar: {
        width: wp('10%'),
        height: wp('10%'),
        borderRadius: wp('5%'),
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: wp('2%'),
        height: wp('2%'),
        borderRadius: wp('1%'),
        backgroundColor: '#4CAF50',
        borderWidth: 1.5,
        borderColor: '#000',
    },

    userName: {
        fontSize: wp('3.8%'),
        color: '#FFFFFF',
        fontWeight: '600',
        marginRight: wp('2%'),
    },
    inviteLabel: {
        fontSize: wp('2.8%'),
        color: '#B0B0B0',
        fontWeight: '400',
    },
    inviteIcon: {
        width: wp('6%'),
        height: wp('6%'),
        borderRadius: wp('3%'),
        backgroundColor: 'rgba(213, 0, 249, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(213, 0, 249, 0.3)',
    },
    inviteDetails: {
        marginBottom: hp('1.5%'),
    },
    validityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingHorizontal: wp('2.5%'),
        paddingVertical: hp('0.8%'),
        borderRadius: wp('1.5%'),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    validityText: {
        fontSize: wp('2.6%'),
        color: '#888',
        marginLeft: wp('1.5%'),
        fontWeight: '400',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: wp('2%'),
    },
    denyButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp('1.5%'),
        paddingHorizontal: wp('0%'),
        borderRadius: wp('2%'),
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
        gap: wp('1.5%'),
    },
    denyButtonText: {
        color: '#FF6B6B',
        fontSize: wp('3%'),
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
        borderRadius: wp('2%'),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    confirmButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp('1.5%'),
        paddingHorizontal: wp('3%'),
        gap: wp('1.5%'),
        borderRadius: wp('2%'),
    },
    confirmButtonText: {
        color: 'white',
        fontSize: wp('3%'),
        fontWeight: '600',
    },
});

export default styles;
