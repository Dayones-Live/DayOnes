import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#1e1e1e',
    },
    menuIcon: {
        marginLeft: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    inputBox: {
        width: '100%',
        height: 100,
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
        backgroundColor: '#222',
        color: '#fff',
        fontSize: 16,
        textAlignVertical: 'top', // Ensures text starts at the top
    },

    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dimmed background
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#333',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
        width: '100%',
    },
    modalItemIcon: {
        marginRight: 10,
    },
    modalText: {
        fontSize: 18,
        color: '#fff',
    },
    modalCloseButton: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#444',
        borderRadius: 5,
        width: '50%',
        alignItems: 'center',
    },
    modalCloseText: {
        color: '#fff',
        fontSize: 16,
    },

    backButton: {
        marginRight: 10,
    },
    profilePicture: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    username: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    blockButton: {
        color: '#ff4444',
        fontSize: 14,
        fontWeight: 'bold',
    },
    messageList: {
        flex: 1,
    },
    messageWrapper: {
        flexDirection: 'column',
        marginVertical: 10,
        paddingHorizontal: 5,
    },
    senderWrapper: {
        justifyContent: 'flex-end',
        alignSelf: 'flex-end',
    },
    receiverWrapper: {
        justifyContent: 'flex-start',
        alignSelf: 'flex-start',
    },
    messageBubble: {
        maxWidth: '75%',
        padding: 10,
        borderRadius: 20,
        marginVertical: 5,
    },
    senderBubble: {
        backgroundColor: '#4e9af1',
        alignSelf: 'flex-end',
    },
    receiverBubble: {
        backgroundColor: '#333',
        alignSelf: 'flex-start',
    },
    messageText: {
        color: '#fff',
        fontSize: 16,
    },
    messageTimestamp: {
        color: '#aaa',
        fontSize: 12,
        textAlign: 'right',
        marginTop: 5,
    },
    messageImage: {
        width: '85%', // Larger width for better display
        borderRadius: 10,
        alignSelf: 'flex-start', // Dynamic alignment for receiver
        marginBottom: 10,
        aspectRatio: 1.5, // Adjust aspect ratio for consistent sizing
        backgroundColor: '#000',
        marginLeft: '12%',
    },
    messageVideo: {
        width: '85%', // Larger width for better display
        borderRadius: 10,
        marginRight: '11%',
        alignSelf: 'flex-start', // Dynamic alignment for receiver
        aspectRatio: 1,
        backgroundColor: '#000',
    },
    senderMedia: {
        alignItems: 'flex-end',
        alignSelf: 'flex-end', // Ensure it aligns to the right for sender
        right: '-6%',
        marginVertical: 5,
    },
    receiverMedia: {
        alignItems: 'flex-start',
        left: '-2%',
        alignSelf: 'flex-start', // Ensure it aligns to the left for receiver
        marginVertical: 5,

    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#1e1e1e',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    input: {
        flex: 1,
        backgroundColor: '#333',
        color: '#fff',
        padding: 10,
        borderRadius: 20,
        fontSize: 16,
        marginHorizontal: 10,
    },
    inputWithImage: {
        marginLeft: 10,
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
    sendButton: {
        backgroundColor: '#4e9af1',
        padding: 10,
        borderRadius: 50,
        marginLeft: 5,
    },
    icon: {
        marginHorizontal: 5,
    },
    iconSpacing: {
        marginRight: 10,
    },
});


export default styles;
