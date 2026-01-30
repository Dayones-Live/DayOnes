import { StyleSheet } from 'react-native';

const colors = {
  background: '#1A1A1A',
  cardBackground: '#282828',
  cardBackgroundUnread: '#303030',
  white: '#FFFFFF',
  grey: '#AAAAAA',
  greyDark: '#555555',
  accentBlue: '#66B0F0',
  gradientStart: '#66B0F0',
  gradientEnd: '#A066F0',
  inactiveButtonBg: '#252525',
  inactiveButtonBorder: 'rgba(255, 255, 255, 0.1)',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.grey,
    fontWeight: '400',
  },
  clearAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  clearAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accentBlue,
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.inactiveButtonBorder,
    backgroundColor: colors.inactiveButtonBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    borderWidth: 0,
    overflow: 'hidden',
  },
  filterButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  notificationItem: {
    backgroundColor: colors.cardBackground,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  notificationItemUnread: {
    backgroundColor: colors.cardBackgroundUnread,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 14,
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accentBlue,
    borderWidth: 2,
    borderColor: colors.cardBackgroundUnread,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 15,
    color: colors.white,
    fontWeight: '400',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 13,
    color: colors.grey,
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  emptyText: {
    fontSize: 18,
    color: colors.grey,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#E57373',
    textAlign: 'center',
    marginTop: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
    backgroundColor: colors.accentBlue,
    borderRadius: 12,
  },
  retryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.grey,
    marginTop: 12,
  },
});

export default styles;
export { colors };
