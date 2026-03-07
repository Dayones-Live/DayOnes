import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 16 },
    scrollViewContainer: { flexGrow: 1, paddingBottom: 100 },
    userInfoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    userAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
    userName: { fontSize: 18, color: '#ffffff' },
    postImage: { width: '100%', height: 300, borderRadius: 10, marginBottom: 10 },
    interactionContainer: { flexDirection: 'row', marginTop: 10, marginBottom: 20, justifyContent: 'center' },
    commentsContainer: { marginTop: 20 },
    artistCommentContainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#000', padding: 10, borderRadius: 8, maxWidth: '75%' },
    fanCommentContainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#333', padding: 10, borderRadius: 8, marginVertical: 5, alignSelf: 'flex-end', maxWidth: '75%' },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
    commentTextContainer: { flexShrink: 1 },
    commentAuthor: { fontSize: 14, color: '#FFF', fontWeight: 'bold' },
    commentText: { fontSize: 16, color: '#FFFFFF', marginRight: 10 },
    heartIconOutside: { marginTop: 0, alignSelf: 'center', },
    commentCard: { backgroundColor: '#1e1e1e', borderRadius: 10, padding: 15, marginVertical: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5, maxWidth: '75%', paddingBottom: 20 },
    largeMedia: { width: 200, height: 250, borderRadius: 10, marginTop: 5 }, // Increased media size
    commentInputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'rgba(0, 0, 0, 0.4)', width: '100%' },
    commentInput: { flex: 1, color: '#ffffff', paddingHorizontal: 15, paddingVertical: 10, borderWidth: 1, borderColor: '#555', borderRadius: 25, backgroundColor: 'rgba(51, 51, 51, 0.6)', fontSize: 16 },
    characterCounter: { color: '#aaa', marginLeft: 10, fontSize: 12 },
    sendButton: { marginLeft: 10, padding: 10, borderRadius: 25, backgroundColor: '#FF0080' },
    icon: { marginLeft: 10, padding: 10, borderRadius: 25, },
    warning: { right: "-100%", alignItems: 'flex-end', marginRight: '30%' },
    menuIcon: {
        marginLeft: '50%',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginRight: 10,
        padding: 5,
    },
    menuContainer: {
        backgroundColor: 'black',
        borderRadius: 10,
        width: 140,
        alignItems: 'flex-start',
        marginBottom: '100%',
        marginLeft: '69%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        right: "50%",

    },
    reportButton: {
        marginLeft: 10,
        padding: 5,
    },

    commentActions: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    },


    menuText: {
        marginLeft: 11,
        fontSize: 16,
        color: '#FFF',

    },
    previewContainer: {
        position: 'relative',
        marginRight: 10,
    },
    previewImage: {
        width: 50,
        height: 50,
        borderRadius: 10,
    },
    previewVideo: {
        width: 50,
        height: 50,
        borderRadius: 10,
    },
    removeMediaButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#000',
        borderRadius: 10,
        padding: 2,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        bottom: "5%",
        backgroundColor: "rgba(0, 0, 0, .96)", // Dimmed background

    },
    reportModal: {
        backgroundColor: "#222", // Modal background
        borderRadius: 12,
        padding: 20,
        width: "90%",
        alignSelf: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 10,
    },
    descriptionInput: {
        backgroundColor: "#333",
        color: "#FFF",
        padding: 15,
        borderRadius: 10,
        height: 120,
        marginBottom: 20,
        textAlignVertical: "top", // Ensures text starts at the top of the box
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    modalTitle: {
        bottom: "5%",
        color: "#c0c0c0"
    },
    cancelButton: {
        backgroundColor: "#555",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        marginRight: 10,
    },
    submitButton: {
        backgroundColor: "#FF0080",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        marginLeft: 10,
    },
    buttonText: {
        color: "#FFF",
        fontSize: 16,
        textAlign: "center",
        fontWeight: "bold",
    },
    postMessageText: {
        color: '#FFF',
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'left',
    },
    postMessageContainer: {
        marginTop: 5,
        marginBottom: 10, // Add spacing between the message and the image
        paddingHorizontal: 10, // Align text with the padding of other elements
    },
    artistCommentText: {
        color: '#FFFFFF', // White text for artist comments
    },
    fanCommentText: {
        color: '#FFFFFF', // White text for fan comments
    },
    linkText: {
        color: '#3498db', // Keep links blue
        textDecorationLine: 'underline',
    },
    shopMerchButton: {
        backgroundColor: '#FF0080',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginHorizontal: 16,
        marginVertical: 12,
        alignItems: 'center',
    },
    shopMerchText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});


export default styles;
