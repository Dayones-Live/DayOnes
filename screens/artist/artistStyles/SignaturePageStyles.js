import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 20,
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    backButton: {
        padding: 10,
    },
    topRightButton: {
        width: '45%',
        alignItems: 'center',
    },
    topRightButtonGradient: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    topRightButtonText: {
        color: '#ffffff',
        fontSize: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 20,
    },
    imageContainer: {
        width: '100%',
        height: 180,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageText: {
        color: '#C0C0C0',
        fontSize: 18,
        fontWeight: 'bold',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
    },
    pictureButton: {
        width: '45%',
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        marginBottom: 10,
    },
    buttonText: {
        color: '#C0C0C0',
        fontSize: 16,
        fontWeight: 'bold',
    },
    createButton: {
        width: '100%',
        borderRadius: 10,
        overflow: 'hidden',
    },
    createButtonGradient: {
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    loadingText: {
        marginTop: 10,
        color: '#ffffff',
        fontSize: 16,
    },

});

export default styles;
