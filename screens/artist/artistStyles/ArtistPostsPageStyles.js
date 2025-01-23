import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#000' },
    container: { flex: 1, backgroundColor: '#000', padding: 16 },
    pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 20 },
    scrollView: { flex: 1, marginBottom: 20 },
    postContainer: { marginBottom: 20, alignItems: 'center' },
    postUser: { fontSize: 16, color: '#ffffff', marginBottom: 5, fontWeight: 'bold' },
    postImage: { width: '100%', height: 200, borderRadius: 10 },
    interactionContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 },
    interactionText: { fontSize: 16, color: '#FF0080' },
    postDate: { fontSize: 14, color: '#888', marginTop: 5 },
    plusButton: { position: 'absolute', top: 8, right: 5, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 25, zIndex: 10 },
    loadingText: { color: '#FFFFFF', textAlign: 'center', marginVertical: 10 },
    modalBackground: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)' },
    modalContainer: { width: '90%', backgroundColor: 'white', borderRadius: 10, padding: 20, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    textInput: { width: '100%', minHeight: 80, borderColor: '#ccc', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 20, fontSize: 16 },
    iconRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 },
    postButton: { backgroundColor: '#FF0080', padding: 10, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 10 },
    postButtonText: { color: 'white', fontWeight: 'bold' },
    closeButton: { marginTop: 10 },
    closeButtonText: { color: 'blue', fontWeight: 'bold' },
    mediaContainer: {
        position: 'relative',
        width: 150,
        height: 150,
        marginBottom: 20,
    },
    mediaPreview: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
        backgroundColor: '#000',
    },
    clearButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },

    headerContainer: {
        position: 'relative', // Allows absolute positioning for children
        marginBottom: 5,
        justifyContent: 'center',
        alignItems: 'center', // Centers the location text
    },
    postUser: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center', // Ensures location is centered
    },
    fanCountContainer: {
        position: 'absolute', // Position the icon and count independently
        right: '-25%', // Distance from the right edge
        top: 0, // Align with the top of the header
        flexDirection: 'row',
        alignItems: 'center',
    },
    fanCountText: {
        marginLeft: 5, // Space between icon and text
        fontSize: 16,
        color: '#FFF',
        fontWeight: 'bold',
    },
    postContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
    },
    interactionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 10,
    },
    interactionText: {
        fontSize: 16,
        color: '#FF0080',
    },
    postDate: {
        fontSize: 14,
        color: '#888',
        marginTop: 5,
    },
    fanCountCorner: {
        position: 'absolute',
        top: '-4%',
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 15,
        paddingHorizontal: 10,
        paddingVertical: 8,
        zIndex: 1, // Ensure it stays on top of the image
    },
    fanCountText: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: 'bold', // Make the text bolder for readability
        marginLeft: 5,
    },
});

export default styles;
