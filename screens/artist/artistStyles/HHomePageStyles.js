import { StyleSheet, Platform, Dimensions } from "react-native";
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    backgroundImageStyle: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    container: {
        flex: 1,
        paddingHorizontal: scale(12),
        justifyContent: 'space-between',
    },
    // Header Section
    headerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: verticalScale(24),
        paddingHorizontal: scale(5),
    },
    logoContainer: {
        width: scale(50),
        height: scale(50),
        borderRadius: scale(25),
        overflow: 'hidden',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: moderateScale(20),
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    headerTagline: {
        fontSize: moderateScale(12),
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: verticalScale(4),
        opacity: 0.8,
    },
    profileContainer: {
        width: scale(50),
        height: scale(50),
    },
    profileGradientBorder: {
        width: scale(50),
        height: scale(50),
        borderRadius: scale(25),
        padding: scale(2),
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImageContainer: {
        width: '100%',
        height: '100%',
        borderRadius: scale(23),
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    // Choose Your Content Card
    contentCard: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: scale(16),
        padding: scale(20),
        marginBottom: verticalScale(16),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardTitle: {
        fontSize: moderateScale(18),
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: verticalScale(16),
    },
    contentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    contentButton: {
        width: '48%',
        height: verticalScale(56),
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: scale(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: verticalScale(12),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        flexDirection: 'row',
    },
    contentButtonSelected: {
        borderWidth: 0,
        overflow: 'hidden',
    },
    contentButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: scale(12),
    },
    contentButtonText: {
        fontSize: moderateScale(14),
        color: '#FFFFFF',
        fontWeight: '500',
        marginLeft: scale(8),
    },
    contentButtonTextSelected: {
        fontSize: moderateScale(14),
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    contentButtonIcon: {
        marginRight: scale(8),
    },
    // Set Invite Radius Card
    radiusCard: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: scale(16),
        padding: scale(20),
        marginBottom: verticalScale(16),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    radiusOptionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: scale(12),
    },
    radiusButton: {
        flex: 1,
        height: verticalScale(80),
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: scale(12),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    radiusButtonSelected: {
        borderWidth: 0,
        overflow: 'hidden',
    },
    radiusButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: scale(12),
        paddingVertical: verticalScale(12),
        paddingHorizontal: scale(8),
    },
    radiusButtonIcon: {
        marginBottom: verticalScale(8),
    },
    radiusButtonTextContainer: {
        alignItems: 'center',
    },
    radiusButtonText: {
        fontSize: moderateScale(16),
        color: '#FFFFFF',
        fontWeight: '600',
        marginTop: verticalScale(4),
    },
    radiusButtonTextSelected: {
        fontSize: moderateScale(18),
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginTop: verticalScale(4),
    },
    radiusButtonSubtext: {
        fontSize: moderateScale(11),
        color: '#FFFFFF',
        fontWeight: '400',
        marginTop: verticalScale(2),
        opacity: 0.9,
    },
    radiusButtonSubtextUnselected: {
        fontSize: moderateScale(11),
        color: '#FFFFFF',
        fontWeight: '400',
        marginTop: verticalScale(2),
        opacity: 0.7,
    },
    // Send Button
    sendButtonContainer: {
        width: '100%',
        borderRadius: scale(12),
        overflow: 'hidden',
        marginBottom: verticalScale(30),
        bottom: 11,
    },
    sendButtonGradient: {
        paddingVertical: verticalScale(16),
        borderRadius: scale(12),
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: moderateScale(16),
        fontWeight: 'bold',
    },
});

export default styles;
