import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000', // Black background
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginRight: 50,
    },
    title: {
        fontSize: 24,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    errorText: {
        color: '#FF0000',
        textAlign: 'center',
        marginBottom: 20,
    },
    list: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    signatureContainer: {
        width: '45%',
        marginBottom: 20,
        alignItems: 'center',
        marginHorizontal: 10,
        position: 'relative',
        borderRadius: 10,
        padding: 10,
        backgroundColor: '#FFFFFF', // White background for each signature
        borderWidth: 2,
    },
    signatureImage: {
        width: '100%',
        height: 120,
        borderRadius: 8,
    },
    deleteButton: {
        position: 'absolute',
        top: 5,
        right: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        height: '70%',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white'
    },
    modalCloseButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        zIndex: 1,
        padding: 0,
        backgroundColor: 'red',
    },
    zoomedImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
});

export default styles;
