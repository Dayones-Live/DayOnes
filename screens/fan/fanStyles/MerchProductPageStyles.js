import { StyleSheet, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  productImage: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.6,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 16,
  },
  sizePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizePill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: 'transparent',
  },
  sizePillSelected: {
    backgroundColor: '#FF0080',
    borderColor: '#FF0080',
  },
  sizePillText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  sizePillTextSelected: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#333',
  },
  colorSwatchSelected: {
    borderColor: '#FF0080',
    borderWidth: 3,
  },
  priceText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginHorizontal: 20,
  },
  buyNowButton: {
    backgroundColor: '#FF0080',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  buyNowButtonDisabled: {
    opacity: 0.5,
  },
  buyNowText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default styles;
