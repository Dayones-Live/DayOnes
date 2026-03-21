import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 12,
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  balanceOrderCount: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  scheduleNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  scheduleNoteText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 10,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  payoutCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  payoutCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  payoutDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  payoutMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#444',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF0080',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default styles;
