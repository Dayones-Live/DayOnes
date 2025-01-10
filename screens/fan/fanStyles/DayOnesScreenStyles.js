import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 20, // Match the padding in DMsScreen
    },
    pageTitle: {
        fontSize: 24, // Match the font size in DMsScreen header
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20, // Match the margin in DMsScreen
    },
    scrollView: {
        flex: 1,
        marginBottom: 20, // Keep consistent spacing
    },
    noPostsText: {
        fontSize: 16, // Slightly smaller than the page header
        color: '#ffffff',
        textAlign: 'center',
        marginVertical: 20,
    },
    dmContainer: {
        backgroundColor: '#1b0248',
        padding: 15, // Match the padding in DMsScreen
        marginVertical: 8, // Match the margin in DMsScreen
        borderRadius: 10, // Keep consistent rounded corners
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',

    },
    avatar: {
        width: 50, // Match avatar size in DMsScreen
        height: 50, // Match avatar size in DMsScreen
        borderRadius: 25, // Fully rounded avatar
        marginRight: 15, // Match spacing in DMsScreen
    },
    dmText: {
        fontSize: 16, // Match the senderName size in DMsScreen
        color: '#ffffff',
        fontWeight: 'bold',
    },
    messagePreview: {
        fontSize: 12, // Match the lastMessage size in DMsScreen
        color: '#888',
        marginTop: 5,
    },
    loadingIndicator: {
        marginVertical: 20,
    },
});


export default styles;
