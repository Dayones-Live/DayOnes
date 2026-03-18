import React, { useState, useMemo } from 'react';
import { SafeAreaView, View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import styles from './fanStyles/MerchProductPageStyles';

const PRODUCT_TYPE_LABELS = {
  HOODIE: 'Hoodie',
  TSHIRT: 'T-Shirt',
  TANK: 'Tank Top',
  POSTER: 'Poster',
};

const MerchProductPage = ({ route }) => {
  const { dropId, productType, products } = route.params;
  const navigation = useNavigation();

  const isPoster = productType?.toUpperCase() === 'POSTER';

  const sizes = useMemo(
    () => [...new Set(products.map(p => p.size).filter(Boolean))],
    [products],
  );

  const colors = useMemo(() => {
    const seen = new Set();
    return products
      .filter(p => {
        if (!p.color_code || seen.has(p.color_code)) return false;
        seen.add(p.color_code);
        return true;
      })
      .map(p => ({ color: p.color, color_code: p.color_code }));
  }, [products]);

  const [selectedSize, setSelectedSize] = useState(sizes[0] || null);
  const [selectedColor, setSelectedColor] = useState(colors[0]?.color_code || null);
  const [quantity, setQuantity] = useState(1);

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    const match = products.find(p => p.size === size && p.color_code === selectedColor);
    if (!match) {
      const fallback = products.find(p => p.size === size);
      if (fallback) setSelectedColor(fallback.color_code);
    }
  };

  const handleColorChange = (colorCode) => {
    setSelectedColor(colorCode);
    const match = products.find(p => p.size === selectedSize && p.color_code === colorCode);
    if (!match) {
      const fallback = products.find(p => p.color_code === colorCode);
      if (fallback) setSelectedSize(fallback.size);
    }
  };

  const selectedProduct = isPoster
    ? products[0]
    : products.find(p => p.size === selectedSize && p.color_code === selectedColor) || null;

  const imageUri = selectedProduct?.mockup_url || selectedProduct?.image_url;

  const handleBuyNow = () => {
    if (!selectedProduct) return;
    navigation.navigate('MerchCheckoutPage', {
      dropId,
      product: selectedProduct,
      quantity,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{PRODUCT_TYPE_LABELS[productType] || productType || 'Product'}</Text>
      </View>

      <ScrollView>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={64} color="#555" />
          </View>
        )}

        <View style={styles.detailsContainer}>
          {!isPoster && sizes.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Size</Text>
              <View style={styles.sizePicker}>
                {sizes.map(size => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizePill,
                      selectedSize === size && styles.sizePillSelected,
                    ]}
                    onPress={() => handleSizeChange(size)}
                  >
                    <Text
                      style={
                        selectedSize === size
                          ? styles.sizePillTextSelected
                          : styles.sizePillText
                      }
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {!isPoster && colors.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Color</Text>
              <View style={styles.colorPicker}>
                {colors.map(c => (
                  <TouchableOpacity
                    key={c.color_code}
                    style={styles.colorSwatchTouchable}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    onPress={() => handleColorChange(c.color_code)}
                  >
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c.color_code },
                        selectedColor === c.color_code && styles.colorSwatchSelected,
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {selectedColor && (
                <Text style={styles.selectedColorName}>
                  {colors.find(c => c.color_code === selectedColor)?.color || ''}
                </Text>
              )}
            </>
          )}

          <Text style={styles.priceText}>
            {selectedProduct
              ? `$${Number(selectedProduct.retail_price).toFixed(2)}`
              : '—'}
          </Text>

          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(q => Math.max(1, q - 1))}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(q => Math.min(10, q + 1))}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.buyNowButton,
              !selectedProduct && styles.buyNowButtonDisabled,
            ]}
            onPress={handleBuyNow}
            disabled={!selectedProduct}
          >
            <Text style={styles.buyNowText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MerchProductPage;
