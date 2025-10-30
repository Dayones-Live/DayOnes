import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 60;

const FanOnboardingTutorial = ({ navigation, isVisible, onComplete }) => {
  const [step, setStep] = useState(0);
  const [spotlight] = useState(new Animated.Value(0));
  const [bounce] = useState(new Animated.Value(0));
  const [fade] = useState(new Animated.Value(0));

  const steps = [
    {
      title: "Welcome to DayOnes!",
      description: "You're on the Home Screen. Be in attendance when an artist sends out an Invite, then press the 'Get Invites' button to join their exclusive DayOnes group AND get an awesome autograph!",
      target: 'home',
      position: { bottom: 0, left: width * 0 }
    },
    {
      title: "My Collections",
      description: "Next, let's check out My Collections. Every DayOnes invite comes with an exclusive autograph which is stored here! Start collecting today!",
      target: 'collections',
      position: { bottom: 0, left: width * 0.25 }
    },
    {
      title: "Dayones Messages",
      description: "This is where you will receive messages from them personally! You can even message them back for closer-than-ever interactions! Get cool perks like early tickets and merch access! Remember, you have to be in attendance when the artist sends the invite to join! This is only for their DayOnes!",
      target: 'messages',
      position: { bottom: 0, left: width * 0.5 }
    },
    {
      title: "Direct Messages",
      description: "Finally, here's your DMs section. This is your private space for one-on-one conversations with artists. Be sure to show them love in the DayOnes messages for a chance to get a DM!",
      target: 'dms',
      position: { bottom: 0, left: width * 0.75 }
    }
  ];

  useEffect(() => {
    if (isVisible) {
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

  const handlePrevious = () => {
    if (step > 0) {
      switch (step) {
        case 1:
          navigation.navigate('Home');
          break;
        case 2:
          navigation.navigate('My Collections');
          break;
        case 3:
          navigation.navigate('DayOnes');
          break;
      }
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleNext = async () => {
    if (step < steps.length - 1) {
      switch (step) {
        case 0:
          navigation.navigate('My Collections');
          break;
        case 1:
          navigation.navigate('DayOnes');
          break;
        case 2:
          navigation.navigate("DM's");
          break;
      }
      setStep(step + 1);
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
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{steps[step].title}</Text>
        <Text style={styles.description}>{steps[step].description}</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.navigationButton, styles.previousButton]}
            onPress={handlePrevious}
          >
            <Icon name="chevron-left" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navigationButton}
            onPress={handleNext}
          >
            <Text style={styles.buttonText}>
              {step === steps.length - 1 ? "Got it!" : "Next"}
            </Text>
            <Icon name="chevron-right" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0080',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    minWidth: 120,
    justifyContent: 'center',
  },
  previousButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 5,
  },
});

export default FanOnboardingTutorial;