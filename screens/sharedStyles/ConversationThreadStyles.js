import { StyleSheet } from "react-native";

const HEADER_BG = '#242424';
const CHAT_BG = '#1D1D1D';
const BUBBLE_RECEIVER = '#2B2B2B';
const INPUT_BG = '#2B2B2B';
const DATE_BUBBLE = '#3B3B3B';
const GRADIENT_START = '#00C6FF';
const GRADIENT_END = '#EE00FF';
const TEXT_WHITE = '#fff';
const TEXT_MUTED = '#999999';
const PLACEHOLDER = '#888888';
const BUTTON_CIRCLE_BG = '#2B2B2B';

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: CHAT_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: HEADER_BG,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BUTTON_CIRCLE_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  profilePicture: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#333',
  },
  username: {
    color: TEXT_WHITE,
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
  },
  menuIcon: {
    marginLeft: 0,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_WHITE,
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
    backgroundColor: '#2B2B2B',
    color: TEXT_WHITE,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    color: TEXT_WHITE,
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
    color: TEXT_WHITE,
    fontSize: 16,
  },

  messageList: {
    flex: 1,
    backgroundColor: CHAT_BG,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  dateSeparator: {
    alignSelf: 'center',
    backgroundColor: DATE_BUBBLE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 16,
  },
  dateSeparatorText: {
    color: TEXT_WHITE,
    fontSize: 14,
    fontWeight: '500',
  },

  messageWrapper: {
    flexDirection: 'column',
    marginBottom: 12,
    maxWidth: '80%',
  },
  senderWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  receiverWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  receiverBubble: {
    alignSelf: 'flex-start',
    backgroundColor: BUBBLE_RECEIVER,
    borderTopLeftRadius: 4,
  },
  senderBubbleTouchable: {
    alignSelf: 'flex-end',
  },
  senderBubbleGradient: {
    borderRadius: 18,
    borderTopRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageText: {
    color: TEXT_WHITE,
    fontSize: 16,
    fontWeight: '400',
  },
  messageTimestamp: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginTop: 4,
  },
  senderTimestamp: {
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  receiverTimestamp: {
    alignSelf: 'flex-start',
    marginLeft: 4,
  },

  messageImage: {
    width: 220,
    maxWidth: '85%',
    borderRadius: 14,
    aspectRatio: 1.5,
    backgroundColor: '#1a1a1a',
  },
  messageVideo: {
    width: 220,
    maxWidth: '85%',
    borderRadius: 14,
    aspectRatio: 1,
    backgroundColor: '#1a1a1a',
  },
  senderMedia: {
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  receiverMedia: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: HEADER_BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 24,
    marginHorizontal: 10,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    minHeight: 44,
  },
  input: {
    flex: 1,
    color: TEXT_WHITE,
    fontSize: 16,
    paddingVertical: 4,
    maxHeight: 100,
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BUTTON_CIRCLE_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginHorizontal: 4,
  },
  iconSpacing: {
    marginRight: 8,
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
  inputWithImage: {
    marginLeft: 4,
  },
});

export default styles;
export { GRADIENT_START, GRADIENT_END };
