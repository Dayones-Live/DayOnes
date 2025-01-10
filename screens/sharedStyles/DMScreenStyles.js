import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 20,
    },
    header: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    conversationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'black',
        padding: 15,
        marginVertical: 8,
        borderRadius: 10,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    messageInfo: {
        flex: 1,
    },
    senderName: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    lastMessage: {
        fontSize: 12,
        color: '#888',
        marginTop: 5,
    },
});

export default styles;
