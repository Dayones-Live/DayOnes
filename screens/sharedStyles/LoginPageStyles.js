import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        width: '100%',
        backgroundColor: '#333',
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 40,
    },
    passwordInput: {
        flex: 1,
        color: '#fff',
        fontSize: 18,
        textAlign: 'left',
    },
    eyeIcon: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    topSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        width: 200,
        height: 140,
    },
    middleSection: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    input: {
        height: 50,
        backgroundColor: '#333',
        borderRadius: 8,
        paddingHorizontal: 15,
        color: '#fff',
        marginBottom: 20,
        fontSize: 18,
    },
    loginButton: {
        borderRadius: 10,
        paddingVertical: 15,
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    signupText: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    signupLink: {
        color: '#00ccff',
        textDecorationLine: 'underline',
    },
    bottomSection: {
        alignItems: 'center',
    },
    artistQuestionText: {
        color: '#888',
        fontSize: 16,
        marginBottom: 10,
    },
    signupArtistButton: {
        borderRadius: 10,
        paddingVertical: 15,
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    signupArtistText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default styles;
