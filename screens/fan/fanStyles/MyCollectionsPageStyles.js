import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#0a0a0a', 
        padding: 20 
    },
    title: { 
        fontSize: 32, 
        color: '#ffffff', 
        textAlign: 'center', 
        marginBottom: 10, 
        fontWeight: '700',
        letterSpacing: 2,
        textShadowColor: 'rgba(255, 255, 255, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4
    },
    subtitle: {
        fontSize: 16,
        color: '#888888',
        textAlign: 'center',
        marginBottom: 30,
        fontWeight: '300',
        letterSpacing: 1
    },
    scrollView: { 
        flex: 1 
    },
    imageGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between',
        paddingHorizontal: 5
    },
    noPostsText: { 
        fontSize: 20, 
        color: '#666666', 
        textAlign: 'center', 
        marginVertical: 60,
        fontStyle: 'italic',
        fontWeight: '300',
        letterSpacing: 1
    },
    imageWrapper: { 
        width: '48%', 
        aspectRatio: 1,
        marginBottom: 25,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    image: { 
        width: '100%', 
        height: '100%',
        backgroundColor: '#1a1a1a',
        resizeMode: 'cover'
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 15,
        padding: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    statItem: {
        alignItems: 'center'
    },
    statNumber: {
        fontSize: 24,
        color: '#ffffff',
        fontWeight: '700'
    },
    statLabel: {
        fontSize: 12,
        color: '#888888',
        marginTop: 4,
        fontWeight: '400'
    },
    // View switcher styles
    viewSwitcherContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 25,
        padding: 4,
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    viewTab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center'
    },
    activeViewTab: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4
    },
    viewTabText: {
        fontSize: 14,
        color: '#888888',
        fontWeight: '500',
        letterSpacing: 0.5
    },
    activeViewTabText: {
        color: '#ffffff',
        fontWeight: '600'
    },
    // Sleek filtered view styles
    filteredContainer: {
        flex: 1,
        backgroundColor: '#0a0a0a'
    },
    filteredHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)'
    },
    backButtonSleek: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)'
    },
    backButtonTextSleek: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '600'
    },
    filteredArtistInfoSleek: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center'
    },
    filteredArtistAvatarSleek: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        marginRight: 15,
        backgroundColor: '#2a2a2a'
    },
    filteredArtistTextSleek: {
        flex: 1
    },
    filteredArtistNameSleek: {
        fontSize: 20,
        color: '#ffffff',
        fontWeight: '700',
        marginBottom: 2,
        letterSpacing: 0.5
    },
    filteredArtistCountSleek: {
        fontSize: 14,
        color: '#888888',
        fontWeight: '400'
    },
    // Cover Flow styles
    coverFlowContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    coverFlowContent: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    coverFlowItemContainer: {
        width: 320,
        height: 448,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 0
    },
    coverFlowGlow: {
        position: 'absolute',
        width: 320,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        bottom: -30,
        shadowColor: '#ffffff',
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 1,
        shadowRadius: 25,
        elevation: 25
    },
    coverFlowCard: {
        width: 320,
        height: 448,
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 15,
        },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 20,
        borderWidth: 3,
        borderColor: '#FFD700' // gold
    },
    coverFlowTouchable: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000'
    },
    coverFlowImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000'
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        width: '90%',
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)'
    },
    modalTitle: {
        fontSize: 24,
        color: '#ffffff',
        fontWeight: '700',
        letterSpacing: 1
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    closeButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600'
    },
    artistList: {
        padding: 20
    },
    artistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)'
    },
    artistAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        backgroundColor: '#2a2a2a'
    },
    artistInfo: {
        flex: 1
    },
    artistName: {
        fontSize: 18,
        color: '#ffffff',
        fontWeight: '600',
        marginBottom: 4
    },
    artistCount: {
        fontSize: 14,
        color: '#888888',
        fontWeight: '400'
    }
});

export default styles;
