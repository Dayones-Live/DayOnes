import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#000000' 
    },
    container: { 
        flex: 1, 
        backgroundColor: '#000000',
        paddingHorizontal: 16,
    },
    
    // Header Section
    headerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    headerTagline: {
        fontSize: 14,
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 4,
        opacity: 0.8,
    },
    headerProfileContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#FFFFFF',
    },
    headerProfileImage: {
        width: '100%',
        height: '100%',
    },
    
    // Plus Button
    plusButton: { 
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // Post Container
    postContainer: { 
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    
    // Post Header
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    profileImageContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#FFFFFF',
    },
    genericPostProfileContainer: {
        borderWidth: 0,
        borderColor: 'transparent',
        borderRadius: 0,
        overflow: 'visible',
        width: 40,
        height: 48, // 40 + 4px up + 4px down for animation
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 4, // Allow space for upward movement
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    genericPostProfileImage: {
        width: 40,
        height: 40,
    },
    userInfoContainer: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    timeAgo: {
        fontSize: 12,
        color: '#888888',
    },
    locationAndTime: {
        fontSize: 12,
        color: '#888888',
    },
    
    // Post Content
    postText: {
        fontSize: 14,
        color: '#FFFFFF',
        lineHeight: 20,
        marginBottom: 12,
    },
    postImage: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        marginBottom: 12,
    },
    
    // Engagement Metrics
    engagementContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    engagementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    engagementText: {
        fontSize: 14,
        color: '#FFFFFF',
        marginLeft: 6,
    },
    
    // Modal Styles
    modalBackground: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0, 0, 0, 0.7)' 
    },
    modalContainer: { 
        width: '90%', 
        backgroundColor: 'white', 
        borderRadius: 10, 
        padding: 20, 
        alignItems: 'center' 
    },
    modalTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        marginBottom: 15 
    },
    textInput: { 
        width: '100%', 
        minHeight: 80, 
        borderColor: '#ccc', 
        borderWidth: 1, 
        borderRadius: 10, 
        padding: 10, 
        marginBottom: 20, 
        fontSize: 16 
    },
    iconRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        width: '100%', 
        marginBottom: 20 
    },
    postButton: { 
        backgroundColor: '#FF0080', 
        padding: 10, 
        borderRadius: 10, 
        width: '100%', 
        alignItems: 'center', 
        marginBottom: 10 
    },
    postButtonText: { 
        color: 'white', 
        fontWeight: 'bold' 
    },
    closeButton: { 
        marginTop: 10 
    },
    closeButtonText: { 
        color: 'blue', 
        fontWeight: 'bold' 
    },
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
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // Footer
    footer: {
        padding: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    noMorePosts: {
        padding: 10,
        color: '#666',
        textAlign: 'center',
        fontSize: 14,
    },
    flatListContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    flatListContentEnded: {
        paddingBottom: 20,
        flexGrow: 0,
    },
});

export default styles;