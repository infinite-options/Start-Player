import React, { useRef, useState } from 'react';
import { ImageBackground, PanResponder, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';


// Animated is from react native reanimated for smooth animations.
// useSharedValue is for creating shared values that can be used in animations.
// useAnimatedStyle is for creating animated styles that can react to shared values.

// PanResponder is for handling touch gestures. it helps to track touch movements. we use it with the variable panResponder.


// i'm calculating the angle and based on that angle i'm determining which number should be selected.


export default function NumberSelector() {
  
  const [currentNumber, setCurrentNumber] = useState(1);
  const angle = useSharedValue(0); // this shared value will hold the current angle of the small circle
  const circleCenter = useRef({ x: 0, y: 0 });
  const radius = 120; // increased from 80 to make the selector move in a bigger circle
  const dnumber = 12;
  const display = 360 / dnumber;


  const calculateNumber = (angleValue) => { // this function calculates the number based on the angle
    let normalizedAngle = angleValue % 360; // it's 360 because a circle has 360 degrees

    if (normalizedAngle < 0) {
      normalizedAngle = normalizedAngle + 360; 
    }
    
    const index = Math.round(normalizedAngle / display) % dnumber; // this divides the circle into 8 segments (360/8=45) then rounds to the nearest segment
    
    let number;
    if (index === 0) {
      number = 1;
    } else {
      number = index + 1;
    }
    
    setCurrentNumber(number); // update the state with the new number
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.pageX;
        const touchY = evt.nativeEvent.pageY;
        handleTouch(touchX, touchY);
      },
      
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.pageX;
        const touchY = evt.nativeEvent.pageY;
        handleTouch(touchX, touchY);
      },
    })
  ).current;

  const handleTouch = (touchX, touchY) => {
    const dx = touchX - circleCenter.current.x;
    const dy = touchY - circleCenter.current.y;
    
    let newAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90; // this means everything starts from the top (0 degrees at top, 90 at right, 180 at bottom, 270 at left) ai
    
    if (newAngle < 0) {
      newAngle = newAngle + 360;
    } // keep angle positive. the reason positive angles are easier to work with. 
    
    angle.value = newAngle;
    calculateNumber(newAngle);
  };

  const animatedStyle = useAnimatedStyle(() => { // this style will update the position of the small circle based on the angle
    const angleInRadians = (angle.value - 90) * (Math.PI / 180); // this 
    const x = radius * Math.cos(angleInRadians);
    const y = radius * Math.sin(angleInRadians);
    
    return {
      transform: [
        { translateX: x },
        { translateY: y }
      ],
    };
  });

    return (
    <View style={styles.container}> 
    
      <View style={styles.circleContainer}>
        <View // this is the large circle 
          style={styles.largeCircle}
          onLayout={(event) => {
            event.target.measure((x, y, width, height, pageX, pageY) => { //this means we are measuring the position of the large circle on the screen
              circleCenter.current = {
                x: pageX + width / 2,
                y: pageY + height / 2,
              };
            });
          }}
          {...panResponder.panHandlers} // this means the large circle can respond to touch events. 
        >
          {/* Background image for the large circle */}
          <ImageBackground
            source={require('../assets/images/ToolBox-Background.png')}
            style={styles.backgroundImage}
            imageStyle={{ borderRadius: 180 }}
          />

          <Animated.View style={[styles.smallCircleWrapper, animatedStyle]}>
            {/* These are star points around the circle */}
            <View style={styles.starContainer}>
              <View style={[styles.starPoint, { top: 0, left: 22 }]} />
              <View style={[styles.starPoint, { top: 22, right: 0 }]} />
              <View style={[styles.starPoint, { bottom: 0, left: 22 }]} />
              <View style={[styles.starPoint, { top: 22, left: 0 }]} />
            </View>
            
            <View style={styles.smallCircle}>
              <Text style={styles.windowNumber}>{currentNumber}</Text> 
            </View>
          </Animated.View>
        </View> 
        

        <View style={styles.selectedNumberContainer}>
          <Text style={styles.selectedLabel}>Selected: {currentNumber}</Text> 
        </View>
      </View> 
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#757575ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  largeCircle: {
    width: 360,  // increased from 240
    height: 360, // increased from 240
    borderRadius: 180, // half of width/height
    borderWidth: 3,
    borderColor: '#333',
    position: 'relative',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  smallCircleWrapper: {
    position: 'absolute',
    width: 60,
    height: 60,
    left: 150,  // (360 - 60) / 2 = 150 to center the small circle
    top: 150,   // (360 - 60) / 2 = 150 to center the small circle
    justifyContent: 'center',
    alignItems: 'center',
  },

  starContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
  },

  starPoint: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: '#22ff00ff',
    transform: [{ rotate: '45deg' }],
  },

  smallCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(245, 245, 245, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000000ff',
  },

  windowNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000ff',
  },

  selectedNumberContainer: {
    marginTop: 40,
    alignItems: 'center',
  },

  selectedLabel: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
  },
});
