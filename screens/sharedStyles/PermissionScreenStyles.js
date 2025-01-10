import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 50,
    },
    container: {
        width: '100%',
        alignItems: 'center',
    },
    logo: {
        width: 140,
        height: 140,
        marginBottom: 20,
    },
    headerText: {
        color: '#fff',
        fontSize: 28,
        textAlign: 'center',
        marginBottom: 30,
        fontWeight: 'bold',
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 10,
        marginBottom: 20,
    },
    permissionText: {
        color: '#fff',
        fontSize: 18,
    },
    permissionDescription: {
        color: '#aaa',
        fontSize: 14,
        marginTop: 5,
    },
    permissionButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    continueButton: {
        borderRadius: 10,
        paddingVertical: 15,
        width: '100%',
        alignItems: 'center',
        marginTop: 50,
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
});

export default styles
