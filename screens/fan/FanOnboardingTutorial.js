import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 60;

const FanOnboardingTutorial = ({ navigation, isVisible, onComplete }) => {
  const [step, setStep] = useState(0);
  const [spotlight] = useState(new Animated.Value(0));
  const [bounce] = useState(new Animated.Value(0));
  const [fade] = useState(new Animated.Value(0));
  const [canProgress, setCanProgress] = useState(true);

  const steps = [
    {
      title: "Welcome to DayOnes!",
      description: "You're on the Home Screen. Wait for an artist to send out an Invite then you will press the 'Get Invites' button to start your personal connection with them.",
      target: 'home',
      requiresNavigation: false
    },
    {
      title: "My Collections",
      description: "Next, let's check out My Collections. Tap the star icon to see where your exclusive autographs and collectibles will be stored!",
      target: 'collections',
      requiresNavigation: true,
      position: { bottom: 0, left: width * 0.25 }
    },
    {
      title: "Dayones Messages",
      description: "This is where you'll receive special updates and messages from artists. Tap the message icon to take a look!",
      target: 'messages',
      requiresNavigation: true,
      position: { bottom: 0, left: width * 0.5 }
    },
    {
      title: "Direct Messages",
      description: "Finally, here's your DMs section. This is your private space for one-on-one conversations with artists. Tap the envelope icon to explore!",
      target: 'dms',
      requiresNavigation: true,
      position: { bottom: 0, left: width * 0.75 }
    }
  ];

  useEffect(() => {
    if (isVisible) {
      setCanProgress(step === 0);
      animateArrow();
    }
  }, [step, isVisible]);

  const animateArrow = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleTabPress = async (targetName) => {
    if (steps[step].target === targetName) {
      switch (targetName) {
        case 'collections':
          navigation.navigate('My Collections');
          break;
        case 'messages':
          navigation.navigate('DayOnes');
          break;
        case 'dms':
          navigation.navigate("DM's");
          break;
      }
      setCanProgress(true);
    }
  };

  const handleNext = async () => {
    if (!canProgress) return;
    
    if (step < steps.length - 1) {
      setStep(step + 1);
      setCanProgress(!steps[step + 1].requiresNavigation);
    } else {
      await AsyncStorage.setItem('fanTutorialComplete', 'true');
      onComplete();
    }
  };

  const ArrowOverlay = () => {
    if (step === 0) return null;

    const arrowPosition = {
      bottom: TAB_BAR_HEIGHT + 8,
      left: steps[step].position.left + (width * 0.125),
    };

    return (
      <Animated.View
        style={[
          styles.arrow,
          arrowPosition,
          {
            transform: [
              { 
                translateY: bounce.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 6]
                })
              }
            ]
          }
        ]}
      >
        <Icon 
          name="arrow-down" 
          size={25}
          color="#FFD700"
        />
      </Animated.View>
    );
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <ArrowOverlay />
      <TouchableOpacity
        style={[
          styles.touchableArea,
          steps[step].position,
          { width: width * 0.25, height: TAB_BAR_HEIGHT }
        ]}
        onPress={() => handleTabPress(steps[step].target)}
      />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{steps[step].title}</Text>
        <Text style={styles.description}>{steps[step].description}</Text>
        <TouchableOpacity 
          style={[styles.nextButton, !canProgress && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!canProgress}
        >
          <Text style={styles.nextButtonText}>
            {step === steps.length - 1 ? "Got it!" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  
    justifyContent: 'center',
    alignItems: 'center',
    bottom: "-1%",
  },
  arrow: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: "50%",
    left:"20%"
  },
  touchableArea: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  contentContainer: {
    position: 'absolute',
    bottom: TAB_BAR_HEIGHT + 100,
    padding: 20,
    width: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#FF0080',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  nextButtonDisabled: {
    backgroundColor: '#666',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default FanOnboardingTutorial; 