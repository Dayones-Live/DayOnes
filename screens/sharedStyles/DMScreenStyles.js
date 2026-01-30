import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerSection: {
    marginBottom: 20,
  },
  header: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#AAAAAA',
    fontWeight: '400',
    textAlign: 'left',
  },
  listContent: {
    paddingBottom: 24,
  },
  conversationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2DD4BF',
    zIndex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    backgroundColor: '#333',
  },
  messageInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  messagePreview: {
    fontSize: 15,
    color: '#B0B0B0',
    fontWeight: '400',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 13,
    color: '#AAAAAA',
    fontWeight: '400',
  },
});

export default styles;
