import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginVertical: 20,
    },
    scrollView: {
        flex: 1,
    },
    noPostsText: {
        fontSize: 16,
        color: '#ffffff',
        textAlign: 'center',
        marginVertical: 20,
    },
    artistGroup: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    artistHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    artistInfo: {
        flex: 1,
        marginLeft: 15,
    },
    nameLocationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    artistName: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
    },
    locationText: {
        fontSize: 14,
        color: '#888',
        marginLeft: 4,
    },
    postCount: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    postsContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    postContainer: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    postContent: {
        flex: 1,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    postInfo: {
        flex: 1,
    },
    postArtistName: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '600',
    },
    postLocation: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    postTime: {
        fontSize: 12,
        color: '#888',
        marginLeft: 8,
    },
    postMessage: {
        fontSize: 14,
        color: '#fff',
        marginBottom: 8,
        lineHeight: 20,
    },
    postImageContainer: {
        marginTop: 8,
        borderRadius: 8,
        overflow: 'hidden',
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    postStats: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 12,
    },
    postStatText: {
        fontSize: 12,
        color: '#888',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    loadingIndicator: {
        marginVertical: 20,
    },
});

export default styles;
