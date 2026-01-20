import React, { useState, useEffect, useRef } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Dimensions, FlatList, Alert, PanResponder, Animated, Easing, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
// import { useSelector, useDispatch } from 'react-redux';
// import { setSignatureColor, setSignatureSize } from '../../assets/redux/actions';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import { useSignatures } from '../../assets/hooks/useSignatures';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

const { width, height } = Dimensions.get('window');

// Base width reference for scaling signature sizes
const baseWidth = 375;  // Adjust according to the base device

// Utility function to scale signature size relative to screen width
const scaleValue = (size) => {
  return (size * width) / baseWidth;
}

// Color button size - 6 columns, with small side padding
const HORIZONTAL_PADDING = 8;
const GAP_SIZE = 4;
// Calculate available height for color grid (bottom ~38% of screen)
const AVAILABLE_HEIGHT = height * 0.38;
// For 4 rows: 4 * buttonHeight + 3 * rowGap + padding = available height
// buttonHeight = (availableHeight - padding - 3*rowGap) / 4
const ROW_GAP = 8;
const VERTICAL_PADDING = 24;
const MAX_BUTTON_HEIGHT = (AVAILABLE_HEIGHT - VERTICAL_PADDING - (3 * ROW_GAP)) / 4;
// For 6 buttons per row: 6 * buttonWidth + 5 * gap = available width (with small padding)
const AVAILABLE_WIDTH = width - (HORIZONTAL_PADDING * 2);
const BUTTON_WIDTH_CALC = (AVAILABLE_WIDTH - (5 * GAP_SIZE)) / 6;
// Use the smaller dimension to ensure squares fit both width and height constraints
// Making slightly smaller to ensure no overflow
const COLOR_BUTTON_SIZE = Math.min(BUTTON_WIDTH_CALC, MAX_BUTTON_HEIGHT) * 0.82;

const EditScreen = ({ route, navigation }) => {
  const { selectedImage } = route.params;
  // Multiple signatures on canvas
  const [canvasSignatures, setCanvasSignatures] = useState([]);
  const [activeSignatureId, setActiveSignatureId] = useState(null);
  const [editingSignatureId, setEditingSignatureId] = useState(null);
  const lastTapMapRef = useRef({});
  const [activeTab, setActiveTab] = useState(0);
  const viewShotRef = useRef(null);
  const bottomBarAnim = useRef(new Animated.Value(0)).current; // 0 hidden, 1 visible
  
  // Define sizes at the component level so they're accessible
  const sizes = {
    extraSmall: { width: scaleValue(100), height: scaleValue(100) },
    tiny: { width: scaleValue(150), height: scaleValue(150) },
    small: { width: scaleValue(200), height: scaleValue(200) },
    medium: { width: scaleValue(350), height: scaleValue(350) },
    large: { width: scaleValue(500), height: scaleValue(500) }
  };

  const { data: signatures, isLoading, isError } = useSignatures();

  useEffect(() => {
    console.log("Signatures loaded:", signatures);
  }, [signatures]);

  // Animate bottom toolbar in/out on edit mode toggle
  useEffect(() => {
    const toValue = editingSignatureId ? 1 : 0;
    Animated.timing(bottomBarAnim, {
      toValue,
      duration: editingSignatureId ? 220 : 180,
      easing: editingSignatureId ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [editingSignatureId, bottomBarAnim]);

  const createPanResponder = (sigId) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setActiveSignatureId(sigId);
        bringSignatureToFront(sigId);
        setCanvasSignatures(prev => prev.map(s => {
          if (s.id !== sigId) return s;
          s.position.setOffset({ x: s.lastPos.x, y: s.lastPos.y });
          s.position.setValue({ x: 0, y: 0 });
          return s;
        }));
      },
      onPanResponderMove: (event, gestureState) => {
        setCanvasSignatures(prev => prev.map(s => {
          if (s.id !== sigId) return s;
          s.position.x.setValue(gestureState.dx);
          s.position.y.setValue(gestureState.dy);
          return s;
        }));
      },
      onPanResponderRelease: () => {
        setCanvasSignatures(prev => prev.map(s => {
          if (s.id !== sigId) return s;
          s.position.flattenOffset();
          s.lastPos = { x: s.position.x._value, y: s.position.y._value };
          return s;
        }));
      },
    });
  };

  const handleSignatureSelect = (item) => {
    const id = `${item.id}_${Date.now()}`;
    const defaultSize = sizes.small;
    const startX = (width - defaultSize.width) / 2;
    const startY = (height * 0.62 - defaultSize.height) / 2;
    const position = new Animated.ValueXY({ x: startX, y: startY });
    const newSig = {
      id,
      url: item.url,
      position,
      lastPos: { x: startX, y: startY },
      size: defaultSize,
      color: 'default',
      panResponder: null,
      naturalSize: null,
    };
    newSig.panResponder = createPanResponder(id);
    setCanvasSignatures(prev => [...prev, newSig]);
    setActiveSignatureId(id);
    setActiveTab(2);
    // Newest is already at front due to array push

    // Fetch intrinsic image size to compute tight display bounds for border
    Image.getSize(
      item.url,
      (w, h) => {
        setCanvasSignatures(prev => prev.map(s => s.id === id ? { ...s, naturalSize: { width: w, height: h } } : s));
      },
      () => {
        // Ignore failures; we'll fallback to full box
      }
    );
  };

  const cycleActiveSignatureSize = (sigId) => {
    setCanvasSignatures(prev => prev.map(s => {
      if (s.id !== sigId) return s;
      const currentX = s.position.x._value;
      const currentY = s.position.y._value;
      let nextSize = s.size;
      if (s.size.width === sizes.extraSmall.width) {
        nextSize = sizes.tiny;
        const xOffset = (sizes.tiny.width - sizes.extraSmall.width) / 2;
        const yOffset = (sizes.tiny.height - sizes.extraSmall.height) / 2;
        s.position.setValue({ x: currentX - xOffset, y: currentY - yOffset });
      } else if (s.size.width === sizes.tiny.width) {
        nextSize = sizes.small;
        const xOffset = (sizes.small.width - sizes.tiny.width) / 2;
        const yOffset = (sizes.small.height - sizes.tiny.height) / 2;
        s.position.setValue({ x: currentX - xOffset, y: currentY - yOffset });
      } else if (s.size.width === sizes.small.width) {
        nextSize = sizes.medium;
        const xOffset = (sizes.medium.width - sizes.small.width) / 2;
        const yOffset = (sizes.medium.height - sizes.small.height) / 2;
        s.position.setValue({ x: currentX - xOffset, y: currentY - yOffset });
      } else if (s.size.width === sizes.medium.width) {
        nextSize = sizes.large;
        const xOffset = (sizes.large.width - sizes.medium.width) / 2;
        const yOffset = (sizes.large.height - sizes.medium.height) / 2;
        s.position.setValue({ x: currentX - xOffset, y: currentY - yOffset });
      } else {
        nextSize = sizes.extraSmall;
        const xOffset = (sizes.extraSmall.width - sizes.large.width) / 2;
        const yOffset = (sizes.extraSmall.height - sizes.large.height) / 2;
        s.position.setValue({ x: currentX - xOffset, y: currentY - yOffset });
      }
      s.size = nextSize;
      s.lastPos = { x: s.position.x._value, y: s.position.y._value };
      return s;
    }));
  };

  const handleTap = (sigId) => {
    const now = Date.now();
    const prev = lastTapMapRef.current[sigId];
    setActiveSignatureId(sigId);
    if (prev && (now - prev) < 300) {
      cycleActiveSignatureSize(sigId);
    }
    lastTapMapRef.current[sigId] = now;
  };

  const applyColorToSignature = (color) => {
    if (!activeSignatureId) return;
    setCanvasSignatures(prev => prev.map(s => s.id === activeSignatureId ? { ...s, color } : s));
  };

  const deleteActiveSignature = () => {
    if (!activeSignatureId) return;
    setCanvasSignatures(prev => prev.filter(s => s.id !== activeSignatureId));
    setActiveSignatureId(null);
  };

  const deleteSignature = (sigId) => {
    setCanvasSignatures(prev => prev.filter(s => s.id !== sigId));
    if (activeSignatureId === sigId) setActiveSignatureId(null);
    if (editingSignatureId === sigId) setEditingSignatureId(null);
  };

  const bringSignatureToFront = (sigId) => {
    setCanvasSignatures(prev => {
      const idx = prev.findIndex(s => s.id === sigId);
      if (idx === -1) return prev;
      const next = prev.slice();
      const [item] = next.splice(idx, 1);
      next.push(item);
      return next;
    });
  };

  const increaseSignatureSize = () => {
    if (!editingSignatureId) return;
    setCanvasSignatures(prev => prev.map(s => {
      if (s.id !== editingSignatureId) return s;
      const currentX = s.position.x._value;
      const currentY = s.position.y._value;
      let nextSize = s.size;
      if (s.size.width === sizes.extraSmall.width) {
        nextSize = sizes.tiny;
        const xOffset = (sizes.tiny.width - sizes.extraSmall.width) / 2;
        const yOffset = (sizes.tiny.height - sizes.extraSmall.height) / 2;
        s.position.setValue({ x: currentX - xOffset, y: currentY - yOffset });
      } else if (s.size.width === sizes.tiny.width) {
        nextSize = sizes.small;
        const xOffset = (sizes.small.width - sizes.tiny.width) / 2;
        const yOffset = (sizes.small.height - sizes.tiny.height) / 2;
        s.position.setValue({ x: currentX - xOffset, y: currentY - yOffset });
      } else if (s.size.width === sizes.small.width) {
        nextSize = sizes.medium;
        const xOffset = (sizes.medium.width - sizes.small.width) / 2;
        const yOffset = (sizes.medium.height - sizes.small.height) / 2;
        s.position.setValue({ x: currentX - xOffset, y: currentY - yOffset });
      } else if (s.size.width === sizes.medium.width) {
        nextSize = sizes.large;
        const xOffset = (sizes.large.width - sizes.medium.width) / 2;
        const yOffset = (sizes.large.height - sizes.medium.height) / 2;
        s.position.setValue({ x: currentX - xOffset, y: currentY - yOffset });
      } else {
        // Already at largest size, do nothing
        return s;
      }
      s.size = nextSize;
      s.lastPos = { x: s.position.x._value, y: s.position.y._value };
      return s;
    }));
  };

  const decreaseSignatureSize = () => {
    if (!editingSignatureId) return;
    setCanvasSignatures(prev => prev.map(s => {
      if (s.id !== editingSignatureId) return s;
      const currentX = s.position.x._value;
      const currentY = s.position.y._value;
      let nextSize = s.size;
      if (s.size.width === sizes.large.width) {
        nextSize = sizes.medium;
        const xOffset = (sizes.medium.width - sizes.large.width) / 2;
        const yOffset = (sizes.medium.height - sizes.large.height) / 2;
        s.position.setValue({ x: currentX - xOffset, y: currentY - yOffset });
      } else if (s.size.width === sizes.medium.width) {
        nextSize = sizes.small;
        const xOffset = (sizes.small.width - sizes.medium.width) / 2;
        const yOffset = (sizes.small.height - sizes.medium.height) / 2;
        s.position.setValue({ x: currentX - xOffset, y: currentY - yOffset });
      } else if (s.size.width === sizes.small.width) {
        nextSize = sizes.tiny;
        const xOffset = (sizes.tiny.width - sizes.small.width) / 2;
        const yOffset = (sizes.tiny.height - sizes.small.height) / 2;
        s.position.setValue({ x: currentX - xOffset, y: currentY - yOffset });
      } else if (s.size.width === sizes.tiny.width) {
        nextSize = sizes.extraSmall;
        const xOffset = (sizes.extraSmall.width - sizes.tiny.width) / 2;
        const yOffset = (sizes.extraSmall.height - sizes.tiny.height) / 2;
        s.position.setValue({ x: currentX - xOffset, y: currentY - yOffset });
      } else {
        // Already at smallest size, do nothing
        return s;
      }
      s.size = nextSize;
      s.lastPos = { x: s.position.x._value, y: s.position.y._value };
      return s;
    }));
  };

  const navigateToPreviousSignature = () => {
    if (!editingSignatureId || canvasSignatures.length <= 1) return;
    const currentIndex = canvasSignatures.findIndex(s => s.id === editingSignatureId);
    const prevIndex = currentIndex === 0 ? canvasSignatures.length - 1 : currentIndex - 1;
    const prevSignature = canvasSignatures[prevIndex];
    setEditingSignatureId(prevSignature.id);
    setActiveSignatureId(prevSignature.id);
    bringSignatureToFront(prevSignature.id);
  };

  const navigateToNextSignature = () => {
    if (!editingSignatureId || canvasSignatures.length <= 1) return;
    const currentIndex = canvasSignatures.findIndex(s => s.id === editingSignatureId);
    const nextIndex = currentIndex === canvasSignatures.length - 1 ? 0 : currentIndex + 1;
    const nextSignature = canvasSignatures[nextIndex];
    setEditingSignatureId(nextSignature.id);
    setActiveSignatureId(nextSignature.id);
    bringSignatureToFront(nextSignature.id);
  };

  const isPointInsideVisibleSignature = (sig, localX, localY) => {
    const boxW = sig.size.width;
    const boxH = sig.size.height;
    // Compute visible content (contain) rect
    let contentW = boxW;
    let contentH = boxH;
    if (sig.naturalSize && sig.naturalSize.width && sig.naturalSize.height) {
      const scale = Math.min(boxW / sig.naturalSize.width, boxH / sig.naturalSize.height);
      contentW = sig.naturalSize.width * scale;
      contentH = sig.naturalSize.height * scale;
    } else {
      // Fallback heuristic: assume 85% area is visible content
      contentW = boxW * 0.85;
      contentH = boxH * 0.85;
    }
    const left = (boxW - contentW) / 2;
    const top = (boxH - contentH) / 2;
    const right = left + contentW;
    const bottom = top + contentH;
    return localX >= left && localX <= right && localY >= top && localY <= bottom;
  };

  const handleLongPressSignature = (sig, e) => {
    const { locationX, locationY } = e.nativeEvent || {};
    if (locationX == null || locationY == null) return;
    if (!isPointInsideVisibleSignature(sig, locationX, locationY)) {
      return; // ignore long-press if outside visible content box
    }
    setActiveSignatureId(sig.id);
    setEditingSignatureId(sig.id);
    bringSignatureToFront(sig.id);
  };

  const captureAndSaveImage = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      console.log("Captured image URI:", uri);
      const newFilePath = `${RNFS.DocumentDirectoryPath}/edited_image_${Date.now()}.jpg`;

      await RNFS.moveFile(uri, newFilePath);
      console.log("File moved to:", newFilePath);

      const base64Data = await RNFS.readFile(newFilePath, 'base64');
      console.log("Base64 data generated.");

      Alert.alert('Success', 'Image saved successfully!');
      // Navigate back to the main tabs and then to the home screen with the edited image
      navigation.navigate('MainTabs', {
        screen: 'Main',
        params: { editedImage: { uri: `file://${newFilePath}`, base64: base64Data } }
      });
    } catch (error) {
      console.error('Error capturing and saving image:', error);
      Alert.alert('Error', 'Failed to save the image. Please try again.');
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const renderTabContent = () => {
    if (isLoading) {
      return <Text>Loading...</Text>;
    }

    if (isError) {
      return <Text>Error loading signatures. Please try again later.</Text>;
    }

    return (
      <View style={styles.tabContentOverlay}>
        <View style={[styles.tabContent, { display: activeTab === 0 ? 'flex' : 'none' }]}>
          <FlatList
            horizontal
            data={signatures}
            renderItem={renderSignature}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.signaturesList}
            showsHorizontalScrollIndicator={false}
          />
        </View>
        <View style={[styles.tabContent, { display: activeTab === 1 ? 'flex' : 'none' }]}>
          <ScrollView 
            style={styles.colorScrollView}
            contentContainerStyle={styles.colorOptionsContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.colorOptions}>
              {/* Color Palette Grid - 6 columns x 4 rows layout */}
            {/* Row 1: Gallery Icon, Bright Yellow, Bright Orange, Deep Red, Light Purple, Dark Violet */}
            <TouchableOpacity onPress={() => applyColorToSignature('default')} style={[styles.colorButton, styles.defaultColorButton]}>
              <View style={styles.defaultColorIconContainer}>
                <Icon name="image" size={20} color="#333" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#FFEB3B' }]} onPress={() => applyColorToSignature('#FFEB3B')} />
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#FF9800' }]} onPress={() => applyColorToSignature('#FF9800')} />
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#D32F2F' }]} onPress={() => applyColorToSignature('#D32F2F')} />
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#E1BEE7' }]} onPress={() => applyColorToSignature('#E1BEE7')} />
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#673AB7' }]} onPress={() => applyColorToSignature('#673AB7')} />

            {/* Row 2: Fuchsia, Light Pink, Sky Blue, Royal Blue, Dark Teal, Teal Green */}
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#E91E63' }]} onPress={() => applyColorToSignature('#E91E63')} />
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#F8BBD0' }]} onPress={() => applyColorToSignature('#F8BBD0')} />
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#87CEEB' }]} onPress={() => applyColorToSignature('#87CEEB')} />
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#2196F3' }]} onPress={() => applyColorToSignature('#2196F3')} />
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#00796B' }]} onPress={() => applyColorToSignature('#00796B')} />
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#009688' }]} onPress={() => applyColorToSignature('#009688')} />

            {/* Row 3: Navy Blue, Burnt Orange/Brown, Olive Green, Forest Green, Jamaican Gradient, American Gradient */}
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#0D47A1' }]} onPress={() => applyColorToSignature('#0D47A1')} />
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#8D6E63' }]} onPress={() => applyColorToSignature('#8D6E63')} />
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#827717' }]} onPress={() => applyColorToSignature('#827717')} />
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#1B5E20' }]} onPress={() => applyColorToSignature('#1B5E20')} />
            
            {/* Jamaican Gradient - Black, Green, Gold */}
            <TouchableOpacity onPress={() => applyColorToSignature('jamaicanGradient')} style={styles.colorButtonContainer}>
              <LinearGradient
                colors={['#000000', '#008000', '#FFD700']}
                style={styles.colorButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </TouchableOpacity>

            {/* American Gradient - Red, White, Blue */}
            <TouchableOpacity onPress={() => applyColorToSignature('americanGradient')} style={styles.colorButtonContainer}>
              <LinearGradient
                colors={['#FF0000', '#FFFFFF', '#0000FF']}
                style={styles.colorButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </TouchableOpacity>

            {/* Row 4: White, Bubblegum Gradient, Dark Grey, Gradient 1 (Cyan to Pink), Gradient 2 (Peach to Magenta), Rasta Gradient */}
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CCCCCC' }]} onPress={() => applyColorToSignature('#FFFFFF')} />
            
            {/* Bubblegum Gradient - Blue, Pink, White */}
            <TouchableOpacity onPress={() => applyColorToSignature('bubblegumGradient')} style={styles.colorButtonContainer}>
              <LinearGradient
                colors={['#4FC3F7', '#FF69B4', '#FFFFFF']}
                style={styles.colorButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.colorButton, { backgroundColor: '#424242' }]} onPress={() => applyColorToSignature('#424242')} />
            
            {/* Gradient 1 - Cyan to Pink */}
            <TouchableOpacity onPress={() => applyColorToSignature('gradient1')} style={styles.colorButtonContainer}>
              <LinearGradient
                colors={['#00FFFF', '#FFA5FF']}
                style={styles.colorButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </TouchableOpacity>

            {/* Gradient 2 - Peach to Magenta */}
            <TouchableOpacity onPress={() => applyColorToSignature('gradient2')} style={styles.colorButtonContainer}>
              <LinearGradient
                colors={['#FFDFA5', '#FF00EE']}
                style={styles.colorButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </TouchableOpacity>
            
            {/* Rasta Gradient - Black, Gold, Green */}
            <TouchableOpacity onPress={() => applyColorToSignature('rastaGradient')} style={styles.colorButtonContainer}>
              <LinearGradient
                colors={['#000000', '#FFD700', '#008000']}
                style={styles.colorButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
        <View style={[styles.tabContent, { display: activeTab === 2 ? 'flex' : 'none', justifyContent: 'center' }]}>
          <View style={styles.saveContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={captureAndSaveImage} activeOpacity={0.8}>
              <Icon name="check-circle" size={22} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Picture</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderSignature = ({ item }) => (
    <TouchableOpacity onPress={() => handleSignatureSelect(item)} style={styles.signatureThumbnailContainer}>
      <Image 
        source={{ uri: item.url }} 
        style={styles.signatureThumbnail}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
  
  // Per-signature styles computed at render time

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Icon name="times" size={24} color="#fff" />
      </TouchableOpacity>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }} style={styles.viewShot}>
        <View style={styles.canvasClip}>
          <Image source={{ uri: selectedImage.uri }} style={styles.image} resizeMode="contain" />
          {canvasSignatures.map(sig => {
          const signatureStyleInst = {
            position: 'absolute',
            transform: [
              { translateX: sig.position.x },
              { translateY: sig.position.y },
            ]
          };
          const isActive = sig.id === activeSignatureId;
          return (
            <Animated.View
              key={sig.id}
              style={[styles.signatureContainer, signatureStyleInst]}
              {...(sig.panResponder ? sig.panResponder.panHandlers : {})}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => handleTap(sig.id)}
                onLongPress={(e) => handleLongPressSignature(sig, e)}
                delayLongPress={300}
              >
                {editingSignatureId === sig.id && (() => {
                  const boxW = sig.size.width;
                  const boxH = sig.size.height;
                  const PADDING_RATIO = 0.06; // expand ~6% around visible content
                  // Start from visible content (contain fit)
                  let contentW = boxW;
                  let contentH = boxH;
                  if (sig.naturalSize && sig.naturalSize.width && sig.naturalSize.height) {
                    const scale = Math.min(boxW / sig.naturalSize.width, boxH / sig.naturalSize.height);
                    contentW = sig.naturalSize.width * scale;
                    contentH = sig.naturalSize.height * scale;
                  }
                  // Expand with small padding, but do not exceed box
                  const targetW = Math.min(boxW, contentW * (1 + PADDING_RATIO));
                  const targetHBase = Math.min(boxH, contentH * (1 + PADDING_RATIO));
                  // Reduce bottom more to counter extra transparent baseline in many signatures
                  const BOTTOM_BIAS = 0.8; // keep 80% of height, trims ~20% from bottom
                  const targetH = targetHBase * BOTTOM_BIAS;
                  const left = (boxW - targetW) / 2;
                  const top = (boxH - targetHBase) / 2 - (targetHBase - targetH) / 2;
                  return (
                    <View style={{ position: 'absolute', left, top, width: targetW, height: targetH, borderWidth: 2, borderColor: '#4FC3F7', borderRadius: 8, opacity: 0.9, pointerEvents: 'none' }} />
                  );
                })()}
                {sig.color === 'default' ? (
                  // Render original image without color overlay
                  [0, 1, 2, 3].map((_, index) => (
                    <Image
                      key={index}
                      source={{ uri: sig.url }}
                      style={[
                        sig.size,
                        {
                          position: 'absolute',
                          left: index * 0.1,
                          top: index * 0.1,
                          resizeMode: 'contain',
                          opacity: isActive ? 1 : 0.95
                        }
                      ]}
                    />
                  ))
                ) : (
                  // Render with color overlay using MaskedView
                  [0, 1, 2, 3].map((_, index) => (
                    <MaskedView
                      key={index}
                      style={[
                        sig.size,
                        {
                          position: 'absolute',
                          left: index * 0.1,
                          top: index * 0.1,
                          transformOrigin: 'center',
                          opacity: isActive ? 1 : 0.95
                        }
                      ]}
                      maskElement={
                        <Image
                          source={{ uri: sig.url }}
                          style={[sig.size, { resizeMode: 'contain' }]}
                        />
                      }
                    >
                    {(
                      typeof sig.color === 'string' && (
                        sig.color.startsWith('gradient') ||
                        sig.color === 'jamaicanGradient' ||
                        sig.color === 'americanGradient' ||
                        sig.color === 'rastaGradient' ||
                        sig.color === 'bubblegumGradient'
                      )
                    ) ? (
                      <LinearGradient
                        colors={
                          sig.color === 'gradient1'
                            ? ['#00FFFF', '#FFA5FF']
                            : sig.color === 'gradient2'
                            ? ['#FFDFA5', '#FF00EE']
                            : sig.color === 'jamaicanGradient'
                            ? ['#000000', '#008000', '#FFD700']
                            : sig.color === 'americanGradient'
                            ? ['#FF0000', '#FFFFFF', '#0000FF']
                            : sig.color === 'rastaGradient'
                            ? ['#000000', '#FFD700', '#008000']
                            : sig.color === 'bubblegumGradient'
                            ? ['#4FC3F7', '#FF69B4', '#FFFFFF']
                            : ['#4FC3F7', '#FF69B4', '#FFFFFF']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={sig.size}
                      />
                    ) : (
                      <View style={[sig.size, { backgroundColor: sig.color }]} />
                    )}
                    </MaskedView>
                  ))
                )}
              </TouchableOpacity>
              {/* inline toolbar removed in favor of global bottom toolbar */}
            </Animated.View>
          );
          })}
        </View>
      </ViewShot>
      <Animated.View
        style={[
          styles.bottomToolbar,
          {
            opacity: bottomBarAnim,
            transform: [
              {
                translateY: bottomBarAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
              },
            ],
          },
        ]}
        pointerEvents={editingSignatureId ? 'auto' : 'none'}
      >
        {canvasSignatures.length > 1 && (
          <TouchableOpacity onPress={navigateToPreviousSignature} style={[styles.toolbarButton, { backgroundColor: '#9E9E9E' }]}>
            <Icon name="chevron-left" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        {canvasSignatures.length > 1 && (
          <TouchableOpacity onPress={navigateToNextSignature} style={[styles.toolbarButton, { backgroundColor: '#9E9E9E' }]}>
            <Icon name="chevron-right" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={decreaseSignatureSize} style={[styles.toolbarButton, { backgroundColor: '#FF9800' }]}>
          <Icon name="minus" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { if (editingSignatureId) { setActiveSignatureId(editingSignatureId); setActiveTab(1); } }} style={[styles.toolbarButton, { backgroundColor: '#1976D2' }]}>
          <Icon name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={increaseSignatureSize} style={[styles.toolbarButton, { backgroundColor: '#FF9800' }]}>
          <Icon name="plus" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setEditingSignatureId(null)} style={[styles.toolbarButton, { backgroundColor: '#2E7D32' }]}>
          <Icon name="check" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { if (editingSignatureId) deleteSignature(editingSignatureId); }} style={[styles.toolbarButton, { backgroundColor: '#D32F2F' }]}>
          <Icon name="times" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
  
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 0 && styles.activeTab]} onPress={() => setActiveTab(0)}>
          {activeTab === 0 ? (
            <Text style={[styles.tabText, styles.activeTabText]}>Signatures</Text>
          ) : (
            <Text style={styles.tabText}>Signatures</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 1 && styles.activeTab]} onPress={() => setActiveTab(1)}>
          {activeTab === 1 ? (
            <Text style={[styles.tabText, styles.activeTabText]}>Color</Text>
          ) : (
            <Text style={styles.tabText}>Color</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 2 && styles.activeTab]} onPress={() => setActiveTab(2)}>
          {activeTab === 2 ? (
            <Text style={[styles.tabText, styles.activeTabText]}>Save</Text>
          ) : (
            <Text style={styles.tabText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
  
      {renderTabContent()}
    </View>
  );
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    position: 'absolute',
    top: '3.2%',
    left: 10,
    zIndex: 100, // Ensure it appears above other elements
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 20,
  },
  viewShot: {
    width: width,
    height: height * 0.62,
  },
  canvasClip: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    backgroundColor: 'transparent',
    minHeight: 40,
  },
  activeTab: {
    backgroundColor: '#2C2C2E',
    borderColor: '#3A3A3C',
  },
  tabButtonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tabContentOverlay: {
    position: 'relative',
    width: '100%',
    flex: 1,
    backgroundColor: '#000000',
    paddingBottom: 20,
  },
  tabContent: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: 0,
  },
  colorScrollView: {
    width: '100%',
    flex: 1,
  },
  colorOptionsContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: width,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
    paddingBottom: 12,
  },
  colorButton: {
    width: COLOR_BUTTON_SIZE,
    height: COLOR_BUTTON_SIZE,
    borderRadius: 8,
    marginRight: GAP_SIZE,
    marginBottom: ROW_GAP,
  },
  colorButtonContainer: {
    width: COLOR_BUTTON_SIZE,
    height: COLOR_BUTTON_SIZE,
    borderRadius: 8,
    marginRight: GAP_SIZE,
    marginBottom: ROW_GAP,
    overflow: 'hidden',
  },
  defaultColorButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultColorIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveContainer: {
    width: '90%',
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  signaturesList: {
    paddingLeft: 10,
    paddingTop: 15
  },
  signatureThumbnailContainer: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  signatureThumbnail: {
    width: '95%',
    height: '95%',
    resizeMode: 'contain',
  },
  signatureContainer: {
    position: 'absolute',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureImage: {
    shadowOffset: { width: 0, height: 0 },
  },
  toolbarContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toolbarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  bottomToolbar: {
    width: '94%',
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(28,28,30,0.88)',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    // Android
    elevation: 6,
  },
});

export default EditScreen;
