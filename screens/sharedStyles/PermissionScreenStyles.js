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
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    permissionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionContent: {
        flex: 1,
        marginLeft: 15,
        marginRight: 10,
    },
    permissionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    mandatoryText: {
        fontSize: 12,
        color: '#aaa',
        fontWeight: 'normal',
    },
    permissionDescription: {
        color: '#aaa',
        fontSize: 13,
        lineHeight: 18,
    },
    toggleContainer: {
        justifyContent: 'center',
        paddingLeft: 10,
    },
    toggleButton: {
        width: 44,
        height: 24,
        borderRadius: 12,
        padding: 2,
        justifyContent: 'center',
    },
    toggleCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    continueButton: {
        borderRadius: 12,
        paddingVertical: 16,
        width: '100%',
        alignItems: 'center',
        marginTop: 30,
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
