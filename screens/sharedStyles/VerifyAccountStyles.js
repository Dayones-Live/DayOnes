import { StyleSheet } from 'react-native';


const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 15,
        left: 15,
        padding: 10,
        zIndex: 1,
    },
    logo: {
        width: 100,
        height: 100,
        alignSelf: 'center',
        marginBottom: 30,
        marginTop: -50,
    },
    header: {
        fontSize: 32,
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 12,
        fontWeight: 'bold',
    },
    subHeader: {
        fontSize: 18,
        color: '#aaaaaa',
        textAlign: 'center',
        marginBottom: 50,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        width: '100%',
        marginBottom: 40,
    },
    otpInput: {
        width: 55,
        height: 65,
        backgroundColor: '#1c1c1c',
        textAlign: 'center',
        fontSize: 24,
        borderRadius: 8,
        color: '#ffffff',
        borderWidth: 1,
        borderColor: '#444444',
        marginHorizontal: 6,
    },
    button: {
        backgroundColor: '#007bff',
        paddingVertical: 16,
        paddingHorizontal: 70,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    resendButton: {
        marginTop: 10,
    },
    resendText: {
        fontSize: 16,
        textAlign: 'center',
    },
});

export default styles
