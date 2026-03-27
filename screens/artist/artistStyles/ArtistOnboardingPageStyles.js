import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
  stepDotActive: {
    backgroundColor: '#FF0080',
    width: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  optionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#FF0080',
    backgroundColor: '#1A0A14',
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionDescription: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  nextButton: {
    backgroundColor: '#FF0080',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  projectionContainer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  projectionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  projectionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 12,
  },
  projectionLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6,
  },
  projectionValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  projectionValueGreen: {
    color: '#10B981',
  },
  projectionNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 10,
    zIndex: 10,
  },
});

export default styles;
