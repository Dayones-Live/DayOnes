import { StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#000',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    menuIcon: {
        padding: 8,
    },
    profileImageContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    imageWrapper: {
        position: 'relative',
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#2C2C2E',
    },
    editImageButton: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: '#2C2C2E',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#000',
    },
    infoSection: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 16,
    },
    infoItem: {
        marginBottom: 16,
    },
    label: {
        color: '#8E8E93',
        fontSize: 13,
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#1C1C1E',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 17,
    },
    actionsSection: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    actionButton: {
        backgroundColor: '#1C1C1E',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    actionButtonText: {
        color: '#0A84FF',
        fontSize: 17,
        fontWeight: '600',
    },
    submitButton: {
        marginTop: 16,
    },
    logoutButton: {
        marginTop: 8,
    },
    logoutButtonText: {
        color: '#FF453A',
        fontSize: 17,
        fontWeight: '600',
    },
    deleteAccountLink: {
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 32,
    },
    deleteAccountText: {
        color: '#8E8E93',
        fontSize: 13,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    modalContent: {
        backgroundColor: '#1C1C1E',
        borderRadius: 14,
        padding: 20,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalMessage: {
        color: '#8E8E93',
        fontSize: 13,
        marginBottom: 16,
        textAlign: 'center',
    },
    modalInput: {
        backgroundColor: '#2C2C2E',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 17,
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#2C2C2E',
        marginRight: 8,
    },
    cancelButtonText: {
        color: '#0A84FF',
        fontSize: 17,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#2C2C2E',
        marginLeft: 8,
    },
    deleteButtonText: {
        color: '#FF453A',
        fontSize: 17,
        fontWeight: '600',
    },
    optionsModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    optionsBox: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        padding: 16,
    },
    optionButton: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    deleteOptionButton: {
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    lastOptionButton: {
        borderBottomWidth: 0,
    },
    optionText: {
        color: '#fff',
        fontSize: 17,
        textAlign: 'center',
    },
    deleteOptionText: {
        color: '#FF453A',
        fontSize: 17,
        textAlign: 'center',
    },
    passwordForm: {
        marginTop: 16,
    },
    blockedUserAvatar: {
        width: scale(40),
        height: verticalScale(40),
        borderRadius: scale(20),
        marginRight: scale(8),
        borderWidth: scale(1),
        borderColor: '#D500F9',
    },
    blockedUserContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: verticalScale(8),
        padding: scale(8),
        backgroundColor: '#1C1C1E',
        borderRadius: scale(6),
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: verticalScale(10),
    },
    logo: {
        width: scale(75),
        height: verticalScale(75),
        resizeMode: 'contain',
        marginTop: verticalScale(5),
    },
    profileSection: {
        backgroundColor: '#1C1C1E',
        borderRadius: scale(10),
        padding: verticalScale(15),
        alignItems: 'center',
        width: '100%',
        alignSelf: 'stretch',
    },
    modalButtonText: {
        color: '#FFF',
        fontWeight: '400',
        fontSize: moderateScale(16),
        paddingLeft: 60,
    },
});

export default styles
