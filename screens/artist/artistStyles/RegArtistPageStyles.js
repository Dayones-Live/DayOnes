import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
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
        width: 120,
        height: 120,
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
    connectButton: {
        backgroundColor: 'transparent',
        borderColor: '#00ccff',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    connectButtonText: {
        color: '#00ccff',
        fontSize: 16,
        fontWeight: 'bold',
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
});

export default styles;
