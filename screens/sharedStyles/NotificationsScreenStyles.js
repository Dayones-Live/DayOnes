import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingHorizontal: 16,
    },
    text: {
        fontSize: 24,
        color: '#fff',
        marginVertical: 16,
        textAlign: 'center',
    },
    backButton: {
        padding: 8,
    },
    listContent: {
        paddingBottom: 20,
    },
    notificationCard: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        marginBottom: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    defaultAvatar: {
        marginRight: 12,
    },
    senderName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    date: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    dmContent: {
        fontSize: 14,
        color: '#ccc',
        marginTop: 8,
    },
    contentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notificationMessage: {
        fontSize: 14,
        color: '#ccc',
        flex: 1,
    },
    adminText: {
        fontSize: 16,
        color: '#00ff00',
        marginTop: 20,
        textAlign: 'center',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    markReadButton: {
        backgroundColor: '#FF0080',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    markReadText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
    },
    retryButton: {
        padding: 10,
        marginTop: 10,
        backgroundColor: '#007AFF',
        borderRadius: 5,
    },
    retryText: {
        color: 'white',
        fontSize: 16,
    },
});

export default styles;
