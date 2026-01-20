import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  ScrollView,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Helper functions for color conversion
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [255, 255, 255];
};

const rgbToHex = (r, g, b) => {
  return `#${[r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
};

// HSL conversion functions
const hslToRgb = (h, s, l) => {
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255),
  ];
};

const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h, s, l];
};

const RECENT_COLORS_KEY = '@ColorPicker:recentColors';
const RECENT_GRADIENTS_KEY = '@ColorPicker:recentGradients';
const MAX_RECENT_COLORS = 12;
const MAX_RECENT_GRADIENTS = 4;

const ColorPickerModal = ({ visible, onClose, onSelect, initialColor, initialGradient }) => {
  const [mode, setMode] = useState(initialGradient ? 'gradient' : 'solid');
  
  // Recent colors and gradients
  const [recentColors, setRecentColors] = useState([]);
  const [recentGradients, setRecentGradients] = useState([]);
  
  // Solid color mode
  const [solidColorMode, setSolidColorMode] = useState('quick'); // 'quick' or 'custom'
  const [hexInput, setHexInput] = useState('');
  const [selectedSolidColor, setSelectedSolidColor] = useState(initialColor || '#000000');
  
  // HSL values for custom color picker
  const getInitialHSL = () => {
    if (initialColor && initialColor !== 'default' && initialColor.startsWith('#')) {
      const [r, g, b] = hexToRgb(initialColor);
      return rgbToHsl(r, g, b);
    }
    return [0.5, 1, 0.5]; // Default: cyan
  };
  
  const initialHSL = getInitialHSL();
  const [hue, setHue] = useState(initialHSL[0]);
  const [saturation, setSaturation] = useState(initialHSL[1]);
  const [lightness, setLightness] = useState(initialHSL[2]);

  // Gradient mode - handle both old (array) and new (object with colors + direction) formats
  const getInitialGradient = () => {
    if (!initialGradient) return { colors: ['#00FFFF', '#FFA5FF'], direction: 0.5 };
    if (Array.isArray(initialGradient)) {
      return { colors: initialGradient, direction: 0.5 };
    }
    if (initialGradient.colors && Array.isArray(initialGradient.colors)) {
      return { colors: initialGradient.colors, direction: initialGradient.direction !== undefined ? initialGradient.direction : 0.5 };
    }
    return { colors: ['#00FFFF', '#FFA5FF'], direction: 0.5 };
  };
  
  const initialGradientData = getInitialGradient();
  const [gradientColors, setGradientColors] = useState(initialGradientData.colors);
  const [selectedGradientIndex, setSelectedGradientIndex] = useState(0);
  const [gradientPosition, setGradientPosition] = useState(initialGradientData.direction || 0.5); // 0 to 1, controls gradient color position/offset (0 = more left color, 1 = more right color)
  
  // Collapsible section states
  const [recentGradientsCollapsed, setRecentGradientsCollapsed] = useState(false);
  const [quickGradientsCollapsed, setQuickGradientsCollapsed] = useState(false);
  
  // Ref for gradient preview
  const gradientPreviewRef = useRef(null);

  // Load recents from AsyncStorage
  useEffect(() => {
    const loadRecents = async () => {
      try {
        const colorsJson = await AsyncStorage.getItem(RECENT_COLORS_KEY);
        const gradientsJson = await AsyncStorage.getItem(RECENT_GRADIENTS_KEY);
        
        if (colorsJson) {
          const colors = JSON.parse(colorsJson);
          setRecentColors(colors);
        }
        
        if (gradientsJson) {
          const gradients = JSON.parse(gradientsJson);
          // Convert old format (just arrays) to new format with direction
          const formattedGradients = gradients.map(g => {
            if (typeof g === 'object' && g.colors && g.direction !== undefined) {
              return g;
            }
            // Old format - just colors array
            return { colors: g, direction: 0.5 };
          });
          setRecentGradients(formattedGradients);
        }
      } catch (error) {
        console.error('Error loading recent colors:', error);
      }
    };
    
    loadRecents();
  }, []);

  // Save recent color
  const saveRecentColor = async (color) => {
    if (!color || color === 'default' || !color.startsWith('#')) return;
    
    try {
      const newRecents = [color, ...recentColors.filter(c => c !== color)].slice(0, MAX_RECENT_COLORS);
      setRecentColors(newRecents);
      await AsyncStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(newRecents));
    } catch (error) {
      console.error('Error saving recent color:', error);
    }
  };

  // Save recent gradient (with direction)
  const saveRecentGradient = async (gradientColors, direction) => {
    try {
      const gradientData = { colors: gradientColors, direction };
      const gradientStr = JSON.stringify(gradientData);
      // Remove duplicate if exists, add to front, keep only last 4
      const filtered = recentGradients.filter(g => {
        if (typeof g === 'object' && g.colors && g.direction !== undefined) {
          return JSON.stringify(g) !== gradientStr;
        }
        // Handle old format (just colors array)
        return JSON.stringify(g) !== JSON.stringify(gradientColors);
      });
      const newRecents = [gradientData, ...filtered].slice(0, MAX_RECENT_GRADIENTS);
      setRecentGradients(newRecents);
      await AsyncStorage.setItem(RECENT_GRADIENTS_KEY, JSON.stringify(newRecents));
    } catch (error) {
      console.error('Error saving recent gradient:', error);
    }
  };

  // Predefined gradients
  const predefinedGradients = [
    { name: 'Jamaican', colors: ['#000000', '#008000', '#FFD700'] },
    { name: 'American', colors: ['#FF0000', '#FFFFFF', '#0000FF'] },
    { name: 'Rasta', colors: ['#FF0000', '#FFD700', '#008000'] },
    { name: 'Cyan to Pink', colors: ['#00FFFF', '#FFA5FF'] },
    { name: 'Peach to Purple', colors: ['#FFDFA5', '#FF00EE'] },
  ];

  // Solid color swatches
  const solidSwatches = [
    '#FFFFFF', '#FF00FF', '#00FF00', '#00FFFF', '#FFFF00', '#FF0000',
    '#000000', '#808080', '#FFA500', '#800080', '#0000FF', '#FFC0CB',
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'
  ];

  const handleSolidColorSelect = (color) => {
    setSelectedSolidColor(color);
    setHexInput(color.toUpperCase());
    // Update HSL when selecting from swatches
    const [r, g, b] = hexToRgb(color);
    const [h, s, l] = rgbToHsl(r, g, b);
    setHue(h);
    setSaturation(s);
    setLightness(l);
  };

  // Update color from HSL changes
  React.useEffect(() => {
    if (solidColorMode === 'custom') {
      const [r, g, b] = hslToRgb(hue, saturation, lightness);
      const hex = rgbToHex(r, g, b);
      setSelectedSolidColor(hex);
      setHexInput(hex.toUpperCase());
    }
  }, [hue, saturation, lightness, solidColorMode]);

  const handleHexInputChange = (text) => {
    setHexInput(text.toUpperCase());
    if (/^#[0-9A-F]{6}$/i.test(text)) {
      setSelectedSolidColor(text);
      // Update HSL when hex input changes
      const [r, g, b] = hexToRgb(text);
      const [h, s, l] = rgbToHsl(r, g, b);
      setHue(h);
      setSaturation(s);
      setLightness(l);
    }
  };

  // Refs to store element references
  const squareRef = useRef(null);
  const hueRef = useRef(null);
  
  // PanResponder for gradient preview position/offset
  const gradientPreviewPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const { locationX } = evt.nativeEvent;
        const previewWidth = width * 0.8;
        const position = Math.max(0, Math.min(1, locationX / previewWidth));
        setGradientPosition(position);
      },
      onPanResponderMove: (evt) => {
        const { locationX } = evt.nativeEvent;
        const previewWidth = width * 0.8;
        const position = Math.max(0, Math.min(1, locationX / previewWidth));
        setGradientPosition(position);
      },
    })
  ).current;
  
  // Calculate gradient start and end points based on position
  // Position 0 = show more of left color (gradient extends further right)
  // Position 1 = show more of right color (gradient extends further left)
  const getGradientPoints = () => {
    // Shift the gradient by adjusting start/end points
    // When position is 0: start at x=-0.5, end at x=0.5 (more left color visible)
    // When position is 0.5: start at x=0, end at x=1 (balanced)
    // When position is 1: start at x=0.5, end at x=1.5 (more right color visible)
    const offset = (gradientPosition - 0.5) * 1; // Range: -0.5 to 0.5
    return {
      start: { x: Math.max(-0.5, Math.min(0.5, -0.5 + offset)), y: 0 },
      end: { x: Math.max(0.5, Math.min(1.5, 1.5 + offset)), y: 0 }
    };
  };

  // PanResponder for color square (saturation/lightness)
  const squarePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const squareSize = width * 0.7;
        const x = Math.max(0, Math.min(squareSize, locationX)) / squareSize;
        const y = Math.max(0, Math.min(squareSize, locationY)) / squareSize;
        setSaturation(x);
        setLightness(1 - y);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const squareSize = width * 0.7;
        const x = Math.max(0, Math.min(squareSize, locationX)) / squareSize;
        const y = Math.max(0, Math.min(squareSize, locationY)) / squareSize;
        setSaturation(x);
        setLightness(1 - y);
      },
    })
  ).current;

  // PanResponder for hue slider
  const huePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const { locationX } = evt.nativeEvent;
        const sliderWidth = width * 0.7;
        const h = Math.max(0, Math.min(1, locationX / sliderWidth));
        setHue(h);
      },
      onPanResponderMove: (evt) => {
        const { locationX } = evt.nativeEvent;
        const sliderWidth = width * 0.7;
        const h = Math.max(0, Math.min(1, locationX / sliderWidth));
        setHue(h);
      },
    })
  ).current;

  // Generate colors for square and hue slider
  const getSquareColors = () => {
    const [r, g, b] = hslToRgb(hue, 1, 0.5);
    const mainColor = rgbToHex(r, g, b);
    return ['#FFFFFF', mainColor, '#000000', '#000000'];
  };

  const getHueSliderColors = () => {
    const colors = [];
    for (let i = 0; i <= 6; i++) {
      const [r, g, b] = hslToRgb(i / 6, 1, 0.5);
      colors.push(rgbToHex(r, g, b));
    }
    return colors;
  };

  const handleGradientColorSelect = (index, color) => {
    const newColors = [...gradientColors];
    newColors[index] = color;
    setGradientColors(newColors);
  };

  const handleGradientAdd = () => {
    if (gradientColors.length < 5) {
      const lastColor = gradientColors[gradientColors.length - 1];
      setGradientColors([...gradientColors, lastColor]);
      setSelectedGradientIndex(gradientColors.length);
    }
  };

  const handleGradientRemove = () => {
    if (gradientColors.length > 2) {
      const newColors = gradientColors.filter((_, i) => i !== selectedGradientIndex);
      setGradientColors(newColors);
      setSelectedGradientIndex(Math.max(0, selectedGradientIndex - 1));
    }
  };

  const handleSelect = async () => {
    if (mode === 'solid') {
      await saveRecentColor(selectedSolidColor);
      onSelect(selectedSolidColor);
    } else {
      // Store gradient with direction as JSON string
      const gradientData = { colors: gradientColors, direction: gradientPosition };
      await saveRecentGradient(gradientColors, gradientPosition);
      // Update state immediately so UI refreshes
      const gradientStr = JSON.stringify(gradientData);
      const filtered = recentGradients.filter(g => {
        if (typeof g === 'object' && g.colors && g.direction !== undefined) {
          return JSON.stringify(g) !== gradientStr;
        }
        return JSON.stringify(g) !== JSON.stringify(gradientColors);
      });
      setRecentGradients([gradientData, ...filtered].slice(0, MAX_RECENT_GRADIENTS));
      onSelect(JSON.stringify(gradientData));
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Icon name="times" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Pick a Color</Text>
            <TouchableOpacity onPress={handleSelect}>
              <Text style={styles.selectButton}>Select</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            scrollEnabled={solidColorMode !== 'custom'}
            nestedScrollEnabled={false}
            scrollEventThrottle={16}
          >
            {/* Mode Tabs - Simple */}
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'solid' && styles.modeTabActive]}
                onPress={() => setMode('solid')}
              >
                <Text style={[styles.modeTabText, mode === 'solid' && styles.modeTabTextActive]}>
                  Solid Color
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'gradient' && styles.modeTabActive]}
                onPress={() => setMode('gradient')}
              >
                <Text style={[styles.modeTabText, mode === 'gradient' && styles.modeTabTextActive]}>
                  Gradient
                </Text>
              </TouchableOpacity>
            </View>

            {/* Solid Color Mode */}
            {mode === 'solid' && (
              <>
                {/* Pick Mode Tabs */}
                <View style={styles.pickModeTabs}>
                  <TouchableOpacity
                    style={[styles.pickModeTab, solidColorMode === 'quick' && styles.pickModeTabActive]}
                    onPress={() => setSolidColorMode('quick')}
                  >
                    <Text style={[styles.pickModeTabText, solidColorMode === 'quick' && styles.pickModeTabTextActive]}>
                      Quick Pick
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickModeTab, solidColorMode === 'custom' && styles.pickModeTabActive]}
                    onPress={() => setSolidColorMode('custom')}
                  >
                    <Text style={[styles.pickModeTabText, solidColorMode === 'custom' && styles.pickModeTabTextActive]}>
                      Custom Pick
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Hex Input */}
                <View style={styles.inputSection}>
                  <Text style={styles.label}>Hex Code:</Text>
                  <TextInput
                    style={styles.hexInput}
                    value={hexInput}
                    onChangeText={handleHexInputChange}
                    placeholder="#000000"
                    placeholderTextColor="#999"
                    maxLength={7}
                  />
                </View>

                {/* Quick Pick Mode - Swatches */}
                {solidColorMode === 'quick' && (
                  <>
                    {/* Recent Colors */}
                    {recentColors.length > 0 && (
                      <View style={styles.swatchesSection}>
                        <Text style={styles.label}>Recent Colors:</Text>
                        <View style={styles.swatchesContainer}>
                          {recentColors.map((color, index) => (
                            <TouchableOpacity
                              key={`recent-${index}`}
                              style={[
                                styles.swatch,
                                { backgroundColor: color },
                                selectedSolidColor === color && styles.swatchSelected
                              ]}
                              onPress={() => handleSolidColorSelect(color)}
                            />
                          ))}
                        </View>
                      </View>
                    )}
                    
                    {/* Predefined Swatches */}
                    <View style={styles.swatchesSection}>
                      <Text style={styles.label}>Choose a Color:</Text>
                      <View style={styles.swatchesContainer}>
                        {solidSwatches.map((color, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.swatch,
                              { backgroundColor: color },
                              selectedSolidColor === color && styles.swatchSelected
                            ]}
                            onPress={() => handleSolidColorSelect(color)}
                          />
                        ))}
                      </View>
                    </View>
                  </>
                )}

                {/* Custom Pick Mode - Color Square and Hue Slider */}
                {solidColorMode === 'custom' && (
                  <>
                    {/* Color Square for Saturation/Lightness */}
                    <View style={styles.colorSquareSection} collapsable={false}>
                      <Text style={styles.label}>Choose Shade (Drag or Tap):</Text>
                      <View style={styles.colorSquareContainer} collapsable={false}>
                        <View
                          ref={squareRef}
                          style={styles.colorSquare}
                          collapsable={false}
                          {...squarePanResponder.panHandlers}
                        >
                          <LinearGradient
                            colors={getSquareColors()}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFillObject}
                          />
                          <View
                            style={[
                              styles.colorPickerIndicator,
                              {
                                left: saturation * width * 0.7 - 10,
                                top: (1 - lightness) * width * 0.7 - 10,
                              },
                            ]}
                            pointerEvents="none"
                          />
                        </View>
                      </View>
                    </View>

                    {/* Hue Slider */}
                    <View style={styles.hueSliderSection} collapsable={false}>
                      <Text style={styles.label}>Choose Hue (Drag or Tap):</Text>
                      <View style={styles.hueSliderContainer} collapsable={false}>
                        <View
                          ref={hueRef}
                          style={styles.hueSlider}
                          collapsable={false}
                          {...huePanResponder.panHandlers}
                        >
                          <LinearGradient
                            colors={getHueSliderColors()}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFillObject}
                          />
                          <View
                            style={[
                              styles.hueSliderIndicator,
                              { left: hue * width * 0.7 - 12 },
                            ]}
                            pointerEvents="none"
                          />
                        </View>
                      </View>
                    </View>
                  </>
                )}

                {/* Preview */}
                <View style={styles.previewSection}>
                  <Text style={styles.label}>Preview:</Text>
                  <View style={[styles.colorPreview, { backgroundColor: selectedSolidColor }]} />
                </View>
              </>
            )}

            {/* Gradient Mode */}
            {mode === 'gradient' && (
              <>
                {/* Gradient Preview */}
                <View style={styles.gradientPreviewSection}>
                  <Text style={styles.label}>Gradient Preview (Drag to shift colors):</Text>
                  <View
                    ref={gradientPreviewRef}
                    style={styles.gradientPreviewContainer}
                    {...gradientPreviewPanResponder.panHandlers}
                  >
                    <LinearGradient
                      colors={gradientColors}
                      start={getGradientPoints().start}
                      end={getGradientPoints().end}
                      style={styles.gradientPreview}
                    />
                    <View
                      style={[
                        styles.gradientDirectionIndicator,
                        { left: gradientPosition * (width * 0.8) - 10 }
                      ]}
                      pointerEvents="none"
                    />
                  </View>
                </View>

                {/* Recent Gradients - Only show last 4 */}
                {recentGradients.length > 0 && (
                  <View style={styles.predefinedSection}>
                    <TouchableOpacity
                      style={styles.sectionHeader}
                      onPress={() => setRecentGradientsCollapsed(!recentGradientsCollapsed)}
                    >
                      <Text style={styles.label}>Recent Gradients:</Text>
                      <Icon
                        name={recentGradientsCollapsed ? 'chevron-down' : 'chevron-up'}
                        size={18}
                        color="#666"
                      />
                    </TouchableOpacity>
                    {!recentGradientsCollapsed && (
                      <View style={styles.predefinedContainer}>
                      {recentGradients.slice(0, 4).map((gradient, index) => {
                        const gradientData = typeof gradient === 'object' && gradient.colors ? gradient : { colors: gradient, direction: 0.5 };
                        const position = gradientData.direction !== undefined ? gradientData.direction : 0.5;
                        const offset = (position - 0.5) * 1;
                        const points = {
                          start: { x: Math.max(-0.5, Math.min(0.5, -0.5 + offset)), y: 0 },
                          end: { x: Math.max(0.5, Math.min(1.5, 1.5 + offset)), y: 0 }
                        };
                        return (
                          <TouchableOpacity
                            key={`recent-gradient-${index}`}
                            style={styles.predefinedGradient}
                            onPress={() => {
                              setGradientColors(gradientData.colors);
                              setGradientPosition(gradientData.direction !== undefined ? gradientData.direction : 0.5);
                              setSelectedGradientIndex(0);
                            }}
                          >
                            <LinearGradient
                              colors={gradientData.colors}
                              start={points.start}
                              end={points.end}
                              style={styles.predefinedGradientButton}
                            />
                            <Text style={styles.predefinedGradientName}>Recent {index + 1}</Text>
                          </TouchableOpacity>
                        );
                      })}
                      </View>
                    )}
                  </View>
                )}

                {/* Predefined Gradients */}
                <View style={styles.predefinedSection}>
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => setQuickGradientsCollapsed(!quickGradientsCollapsed)}
                  >
                    <Text style={styles.label}>Quick Gradients:</Text>
                    <Icon
                      name={quickGradientsCollapsed ? 'chevron-down' : 'chevron-up'}
                      size={18}
                      color="#666"
                    />
                  </TouchableOpacity>
                  {!quickGradientsCollapsed && (
                    <View style={styles.predefinedContainer}>
                      {predefinedGradients.map((gradient, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.predefinedGradient}
                          onPress={() => {
                            setGradientColors(gradient.colors);
                            setSelectedGradientIndex(0);
                          }}
                        >
                          <LinearGradient
                            colors={gradient.colors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.predefinedGradientButton}
                          />
                          <Text style={styles.predefinedGradientName}>{gradient.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Gradient Color Stops */}
                <View style={styles.gradientStopsSection}>
                  <Text style={styles.label}>Gradient Colors:</Text>
                  <Text style={styles.subLabel}>Tap a color to edit it</Text>
                  <View style={styles.gradientStopsContainer}>
                    {gradientColors.map((color, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.gradientStop,
                          { backgroundColor: color },
                          selectedGradientIndex === index && styles.gradientStopSelected
                        ]}
                        onPress={() => setSelectedGradientIndex(index)}
                      >
                        {selectedGradientIndex === index && (
                          <Icon name="check" size={16} color="#fff" style={styles.gradientStopCheck} />
                        )}
                      </TouchableOpacity>
                    ))}
                    {gradientColors.length < 5 && (
                      <TouchableOpacity
                        style={[styles.gradientStop, styles.gradientStopAdd]}
                        onPress={handleGradientAdd}
                      >
                        <Icon name="plus" size={20} color="#666" />
                      </TouchableOpacity>
                    )}
                    {gradientColors.length > 2 && (
                      <TouchableOpacity
                        style={[styles.gradientStop, styles.gradientStopRemove]}
                        onPress={handleGradientRemove}
                      >
                        <Icon name="minus" size={20} color="#666" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Color Swatches for Selected Stop */}
                <View style={styles.swatchesSection}>
                  <Text style={styles.label}>
                    Edit Color {selectedGradientIndex + 1}:
                  </Text>
                  <View style={styles.swatchesContainer}>
                    {solidSwatches.map((color, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.swatch,
                          { backgroundColor: color },
                          gradientColors[selectedGradientIndex] === color && styles.swatchSelected
                        ]}
                        onPress={() => handleGradientColorSelect(selectedGradientIndex, color)}
                      />
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectButton: {
    fontSize: 16,
    color: '#4FC3F7',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  modeTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    gap: 10,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  modeTabActive: {
    backgroundColor: '#4FC3F7',
  },
  modeTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modeTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  pickModeTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    gap: 10,
  },
  pickModeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  pickModeTabActive: {
    backgroundColor: '#4FC3F7',
  },
  pickModeTabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  pickModeTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  inputSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  subLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  hexInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  swatchesSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  swatchesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  swatch: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: '#4FC3F7',
    transform: [{ scale: 1.1 }],
  },
  previewSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  colorPreview: {
    width: width * 0.8,
    height: 80,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorSquareSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  colorSquareContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  colorSquare: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  colorPickerIndicator: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  hueSliderSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  hueSliderContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  hueSlider: {
    width: width * 0.7,
    height: 40,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  hueSliderIndicator: {
    position: 'absolute',
    width: 24,
    height: 40,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    top: -3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  gradientPreviewSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  gradientPreviewContainer: {
    position: 'relative',
    marginTop: 10,
  },
  gradientPreview: {
    width: width * 0.8,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  gradientDirectionIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 20,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 3,
  },
  predefinedSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  predefinedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  predefinedGradient: {
    width: (width - 60) / 3,
    marginBottom: 40,
  },
  predefinedGradientButton: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  predefinedGradientName: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
  },
  gradientStopsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  gradientStopsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  gradientStop: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientStopSelected: {
    borderColor: '#4FC3F7',
    borderWidth: 4,
    transform: [{ scale: 1.1 }],
  },
  gradientStopCheck: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  gradientStopAdd: {
    backgroundColor: '#f5f5f5',
    borderStyle: 'dashed',
    borderColor: '#999',
  },
  gradientStopRemove: {
    backgroundColor: '#ffebee',
    borderStyle: 'dashed',
    borderColor: '#999',
  },
});

export default ColorPickerModal;
