import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 20,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    topSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 200,
        height: 140,
        marginTop: 10,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderColor: '#4B0981',
        borderWidth: 1,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        height: 50,
    },
    phoneInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 8,
        marginBottom: 15,
        borderColor: '#4B0981',
        borderWidth: 1,
    },
    flagContainer: {
        width: 60,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#333',
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        borderRightColor: '#4B0981',
        borderRightWidth: 1,
    },
    flagButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    phoneNumberContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
    },
    callingCodeText: {
        color: '#fff',
        fontSize: 16,
        marginRight: 5,
    },
    phoneInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        paddingHorizontal: 10,
        height: 50,
    },
    signupButton: {
        borderRadius: 10,
        paddingVertical: 15,
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
    },
    fullWidth: {
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginText: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
    },
    loginLink: {
        color: '#00ccff',
        textDecorationLine: 'underline',
    },
    eyeIcon: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
});

export default styles;
