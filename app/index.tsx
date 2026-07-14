import React, { ReactNode, useEffect, useRef, useState } from "react"; // useEffect lets me run code when things change and useRef lets me reference components
import { GestureResponderEvent, Pressable, StyleProp, Text, View, ViewStyle } from "react-native";
import Animated, { FadeIn, FadeInDown, ZoomIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated"; // for entrance animations, the idle pulse, the claim "pop", and the springy button bounce
import { LinearGradient } from "expo-linear-gradient"; // for the gradient button + circle fills
import { Ionicons } from "@expo/vector-icons"; // for the badge + button icons
import * as Haptics from "expo-haptics"; // for tap feedback
import { useSafeAreaInsets } from "react-native-safe-area-context"; // for spacing around notches/status bars
import { theme } from "@/theme";

// These are fixed numbers that won't change I use them in multiple places
const CIRCLE_SIZE = 100; // How big each circle is
const CIRCLE_RADIUS = 50; // Half of CIRCLE_SIZE (100 / 2 = 50). Radius means half the size of a circle
const ACTION_BUTTON_HEIGHT = 50; // Height of the primary action pill - a comfortable, App-Store-like tap target
const HEADER_CONTROL_SIZE = 40; // The circular back button (and matching progress-chip height) in the game header
const PLAYER_BUTTON_SIZE = 64; // The easy-to-tap player-count tiles on the home screen

// Every primary button and every claimed circle shares this same purple->cyan fill (from the theme),
// aimed diagonally so it reads as one consistent, premium visual language.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// The shape of one circle in the play area.
type CircleData = { id: number; x: number; y: number; touched: boolean; number: number | null };

// A tiny reusable "press me" spring. Buttons scale down a touch on press-in and spring back on
// release - that little bounce is what makes tapping feel tactile and fun (the "toy" half of the
// premium-toy look) while the buttons themselves stay clean (the professional half).
function useBounce() {
  const pressed = useSharedValue(0); // 0 = at rest, 1 = fully pressed
  const animatedStyle = useAnimatedStyle(function() {
    // subtle sink + fade on press, the way a native iOS control responds - not a big cartoon shrink
    return {
      transform: [{ scale: 1 - pressed.value * 0.05 }],
      opacity: 1 - pressed.value * 0.12,
    };
  });
  function onPressIn() {
    pressed.value = withSpring(1, { mass: 0.4, damping: 14, stiffness: 350 });
  }
  function onPressOut() {
    pressed.value = withSpring(0, { mass: 0.5, damping: 11, stiffness: 220 }); // gentle overshoot on release
  }
  return { animatedStyle, onPressIn, onPressOut };
}

// The one primary button used everywhere (player counts, Play Again): rounded gradient fill + bounce.
// Callers pass `style` for size/shape and either a `label` or custom `children` for the content.
function GradientButton({ onPress, style, label, children }: {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  label?: string;
  children?: ReactNode;
}) {
  const { animatedStyle, onPressIn, onPressOut } = useBounce();
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[{ alignItems: "center", justifyContent: "center", overflow: "hidden" }, style, animatedStyle]}
    >
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
      {children !== undefined ? children : (
        <Text style={{ ...theme.font.button, color: theme.textPrimary }}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}

// The quiet button: surface fill + hairline border, same bounce as the primary. Used for anything
// that shouldn't shout - player tiles, the header back button - so the one gradient element per
// screen stays special. Pass `label` for a text button or `children` for custom content.
function SecondaryButton({ onPress, style, label, children }: {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  label?: string;
  children?: ReactNode;
}) {
  const { animatedStyle, onPressIn, onPressOut } = useBounce();
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.surfaceBorder,
        },
        style,
        animatedStyle,
      ]}
    >
      {children !== undefined ? children : (
        <Text style={{ ...theme.font.button, color: theme.textPrimary }}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}

// Each circle is its own component so it can run its own idle-pulse / claim-pop animation (a hook
// can't be called inside .map() directly). Claimed vs. unclaimed is driven purely by the number now
// that colors are gone - a claimed circle gets the accent gradient fill + its number.
function Circle({ x, y, number, index }: {
  x: number;
  y: number;
  number: number | null;
  index: number;
}) {
  const claimed = number !== null;
  const pulse = useSharedValue(0); // 0 to 1, drives the idle pulse on untouched circles
  const claimScale = useSharedValue(1); // drives a quick "pop" the moment a circle gets claimed

  useEffect(function() {
    if (claimed === false) {
      // not claimed yet - gently pulse forever to invite a tap
      pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
    } else {
      // claimed - settle down, no more pulsing
      pulse.value = withTiming(0, { duration: 200 });
      // brief overshoot pop so claiming a circle feels satisfying
      claimScale.value = withSequence(
        withTiming(1.25, { duration: 120 }),
        withTiming(1, { duration: 180 })
      );
    }
  }, [claimed]);

  const animatedStyle = useAnimatedStyle(function() {
    return {
      transform: [{ scale: claimed ? claimScale.value : 1 + pulse.value * 0.04 }],
      shadowOpacity: claimed ? 0.6 : 0.3 + pulse.value * 0.4,
    };
  });

  return (
    // entrance animation (on mount) and the idle pulse both animate "transform", so they're split
    // across an outer wrapper (entrance) and an inner view (pulse) so they don't fight
    <Animated.View
      entering={ZoomIn.delay(index * 80).springify()}
      style={{ position: "absolute", left: x - CIRCLE_RADIUS, top: y - CIRCLE_RADIUS }}
    >
      <Animated.View
        style={[
          {
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: CIRCLE_RADIUS,
            borderWidth: 3,
            // an unclaimed circle is a subtle surface fill with a lighter outline so it's visible
            // against the dark background; a claimed one is filled by the gradient below
            borderColor: claimed ? theme.surfaceBorder : theme.textSecondary,
            backgroundColor: theme.surface,
            overflow: "hidden", // clips the gradient fill to the circle
            justifyContent: "center",
            alignItems: "center",
            shadowColor: theme.accent,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 0 },
            // no "elevation" here on purpose - Android renders elevation shadows on true circles as octagons; shadowOpacity comes from animatedStyle below
          },
          animatedStyle,
        ]}
      >
        {claimed && (
          <LinearGradient
            colors={theme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
          />
        )}
        {number !== null && ( // this shows the number only if it has been assigned
          <Text style={{ fontSize: 34, fontWeight: "800", color: theme.textPrimary }}>
            {number}
          </Text>
        )}
      </Animated.View>
    </Animated.View>
  );
}



export default function Index() {
  const insets = useSafeAreaInsets(); // safe spacing around notches/status bars/gesture bars
  const [playerCount, setPlayerCount] = useState(0); // How many players are playing (0 means we haven't chosen yet - shows the home screen)

  const [circles, setCircles] = useState<CircleData[]>([]); // Array to store all the circles on screen

  const [playAreaSize, setPlayAreaSize] = useState<{ width: number; height: number } | null>(null); // How big the play area is (width and height). This is for avoiding placing circles off screen

  const [playAreaPosition, setPlayAreaPosition] = useState({ x: 0, y: 0 }); // here I'm storing the position of the play area on screen so I can convert touch coordinates to play area coordinates

  const [unusedNumbers, setUnusedNumbers] = useState<number[]>([]); // I did this to make sure each player gets a unique number

  const playAreaRef = useRef<View>(null); // I did this to get the size and position of the play area on screen. use it to get the size and position of the play area on screen

  const possiblePlayerCounts = [2, 3, 4, 5, 6, 7, 8]; // All the possible player counts to choose from

  // slow ambient pulse for the two decorative circles behind the home screen
  const introGlow1 = useSharedValue(0);
  const introGlow2 = useSharedValue(0);
  useEffect(function() {
    introGlow1.value = withRepeat(withTiming(1, { duration: 4000 }), -1, true);
    introGlow2.value = withRepeat(withTiming(1, { duration: 5000 }), -1, true);
  }, []);
  const introGlow1Style = useAnimatedStyle(function() {
    return { opacity: 0.08 + introGlow1.value * 0.08, transform: [{ scale: 1 + introGlow1.value * 0.08 }] };
  });
  const introGlow2Style = useAnimatedStyle(function() {
    return { opacity: 0.08 + introGlow2.value * 0.08, transform: [{ scale: 1 + introGlow2.value * 0.08 }] };
  });

  // this remembers how many numbers were left last render, so we can tell
  // when a circle just got claimed and fire a haptic for it
  const previousUnusedNumbersCount = useRef(0);
  useEffect(function() {
    if (unusedNumbers.length < previousUnusedNumbersCount.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    previousUnusedNumbersCount.current = unusedNumbers.length;
  }, [unusedNumbers]);


  function measurePlayAreaOnScreen() {
    // this function saves the position and size of the play area so we can use it later when placing circles and handling touches
    if (playAreaRef.current === null) { // If we don't have a reference to the play area yet, do nothing. .current is how we access the actual component from the ref
      return;
    }


    playAreaRef.current.measureInWindow(function(xPosition, yPosition, width, height) {
      // This is to get the position and size of the play area
      setPlayAreaPosition({ x: xPosition, y: yPosition }); // Save the position
      setPlayAreaSize({ width: width, height: height }); // Save the size
    });
  }


  function shuffleArray<T>(array: T[]): T[] {
    // this is to shuffle an array using Fisher-Yates shuffle algorithm
    // Make a copy so we don't change the original
    const newArray: T[] = [];
    for (let i = 0; i < array.length; i = i + 1) {
      newArray.push(array[i]); // .push is simply adding a new item to the end of an array
    }

    // I used Fisher-Yates shuffle algorithm. It starts from the end and work backwards
    for (let i = newArray.length - 1; i > 0; i = i - 1) {
      // this picks a random position from 0 to i
      const randomPosition = Math.floor(Math.random() * (i + 1)); // Generate a random number between 0 and i

      // This swaps the items at position i and randomPosition
      const temporary = newArray[i]; // temp is simply a temporary variable to hold one of the items while we swap them
      newArray[i] = newArray[randomPosition];
      newArray[randomPosition] = temporary;
    }

    return newArray; // Returns the shuffled array
  }




  // circles are placed as a fixed evenly-spaced shape (2 = line, 3 = triangle, 4 = square, ...)
  // runs when the game screen first appears and again when "Play Again" is pressed
  function startNewRound() {
    // Check if we have everything we need
    if (playAreaSize === null) { // If we don't have a play area size yet, do nothing
      return;
    }
    if (playerCount === 0) { // If no players selected yet, do nothing
      return;
    }

    // this is the middle of the play area, which is the center of our shape
    const centerX = playAreaSize.width / 2;
    const centerY = playAreaSize.height / 2;

    // this is how far from the center each circle sits, kept inside the play area
    const shapeRadius = Math.min(playAreaSize.width, playAreaSize.height) / 2 - CIRCLE_RADIUS;

    const newCircles: CircleData[] = []; // Create an empty array to store our new circles

    // this loop spreads circles evenly around a circle shape, starting from the top
    // this naturally makes a line for 2 players, a triangle for 3, a square for 4, a pentagon for 5, and so on
    for (let playerIndex = 0; playerIndex < playerCount; playerIndex = playerIndex + 1) {
      const angle = (playerIndex / playerCount) * (2 * Math.PI) - Math.PI / 2; // - PI/2 starts the first circle at the top

      const circleX = centerX + shapeRadius * Math.cos(angle);
      const circleY = centerY + shapeRadius * Math.sin(angle);

      // This is to create the new circle object
      const newCircle = {
        id: playerIndex,
        x: circleX,
        y: circleY,
        touched: false, // Its asking has it been touched yet?
        number: null, // number will be assigned when touched
      };

      newCircles.push(newCircle); // Add it to our list. .push is simply adding a new item to the end of an array
    }

    setCircles(newCircles); // Save all the circles we created

    // this is to create an array of numbers from 1 to playerCount and shuffle them so we can assign them randomly to players when they touch circles
    const numbers: number[] = [];
    for (let i = 1; i <= playerCount; i = i + 1) {
      numbers.push(i);
    }

    const shuffledNumbers = shuffleArray(numbers); // this is simply to shuffle the numbers using Fisher-Yates shuffle algorithm
    setUnusedNumbers(shuffledNumbers); // Save the shuffled numbers
  }




  // useEffect: This runs when playerCount or playAreaSize changes
  // the circle-building code lives in startNewRound() above so the "Play Again" button can reuse it
  useEffect(function() {
    startNewRound();
  }, [playerCount, playAreaSize]); // Run this when these things change




  function handleTouchOnScreen(event: GestureResponderEvent) {
    // this function simply checks if any touches are inside any circles and updates the circles accordingly
    const touches = event.nativeEvent.touches; // event.nativeEvent.touches is an array of all current touch points on the screen

    // this makes a copy of the unused numbers so we can modify it
    let numbersStillAvailable: number[] = [];
    for (let i = 0; i < unusedNumbers.length; i = i + 1) {
      numbersStillAvailable.push(unusedNumbers[i]);
    }


    setCircles(function(currentCircles) {
      // this is for updating the circles based on touches and assigning numbers to touched circles
      const updatedCircles: CircleData[] = []; // this will store the updated circles


      // this loop goes through each circle and checks if it was touched
      for (let i = 0; i < currentCircles.length; i = i + 1) {
        const currentCircle = currentCircles[i];


        // If this circle is already touched or we're out of numbers, leave it as is
        if (currentCircle.touched === true || numbersStillAvailable.length === 0) {
          updatedCircles.push(currentCircle);
          continue; // Skip to next circle
        }

        // this loop checks if any touch point is inside this circle
        let wasTouched = false;



        for (let j = 0; j < touches.length; j = j + 1) {// this takes each touch point and checks if it's inside the current circle
          const touch = touches[j]; // getting the point

          // this converts touch coordinates to play area coordinates
          const touchX = touch.pageX - playAreaPosition.x;
          const touchY = touch.pageY - playAreaPosition.y;




          // this calculates distance between touch point and circle center
          const horizontalDistance = touchX - currentCircle.x;
          const verticalDistance = touchY - currentCircle.y;
          const distance = Math.sqrt(
            horizontalDistance * horizontalDistance +
            verticalDistance * verticalDistance
          );




          // this simply checks if the touch is inside the circle by comparing the distance to the radius
          if (distance <= CIRCLE_RADIUS) {
            wasTouched = true;
            break; // if touched stop checking other touches
          }
        }




        if (wasTouched === true) {
          // Here I'm assigning a number to the circle that was touched


          const assignedNumber = numbersStillAvailable[0]; // Take the first available number


          // it removes from available numbers by creating a new array without the first item
          const newNumbersArray: number[] = [];
          for (let k = 1; k < numbersStillAvailable.length; k = k + 1) {
            newNumbersArray.push(numbersStillAvailable[k]);
          }
          numbersStillAvailable = newNumbersArray; // These variables are to make sure each player gets a unique number


          // this creates the updated circle with assigned number
          const updatedCircle = {
            id: currentCircle.id,
            x: currentCircle.x,
            y: currentCircle.y,
            touched: true,
            number: assignedNumber,
          };

          updatedCircles.push(updatedCircle); // this adds the updated circle to our list
        } else {
          updatedCircles.push(currentCircle); // if not touched leave circle as is
        }
      }




      // this saves the remaining numbers for next time
      setUnusedNumbers(numbersStillAvailable); // this updates the unused numbers for next time


      return updatedCircles; // this returns the updated circles to be saved
    });
  }




  function resetToPlayerSelection() {
    // this goes back to the home screen, i use this when pressing the back button on the game screen
    setPlayerCount(0);
    setCircles([]);
    setPlayAreaSize(null);
    setUnusedNumbers([]);
    setPlayAreaPosition({ x: 0, y: 0 });
  }




  // HOME SCREEN: branding + the player-count picker all in one. This is the first thing you see.
  if (playerCount === 0) {
    return (
      <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: theme.spacing.lg }}>
        {/* two large, soft, slowly-pulsing circles in the background - purely decorative,
            echoes the game's own circles instead of leaving the screen visually flat */}
        <Animated.View
          style={[
            { position: "absolute", top: -80, left: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: theme.accent },
            introGlow1Style,
          ]}
        />
        <Animated.View
          style={[
            { position: "absolute", bottom: -100, right: -60, width: 300, height: 300, borderRadius: 150, backgroundColor: theme.accent2 },
            introGlow2Style,
          ]}
        />

        {/* gradient badge + icon, using the same gradient language as every button */}
        <Animated.View entering={ZoomIn.duration(400).springify()}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: theme.spacing.lg,
              shadowColor: theme.accent,
              shadowOpacity: 0.5,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 0 },
              // no "elevation" here on purpose - Android renders elevation shadows on true circles as octagons
            }}
          >
            <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", width: "100%", height: "100%" }} />
            <Ionicons name="shuffle" size={46} color={theme.textPrimary} />
          </View>
        </Animated.View>

        <Text style={{ ...theme.font.title, fontSize: 34, letterSpacing: 0.5, color: theme.textPrimary, marginBottom: theme.spacing.md }}>Start Player</Text>
        {/* small uppercase micro-label instead of a long sentence - tighter, more deliberate */}
        <Text style={{ ...theme.font.caption, color: theme.textSecondary, marginBottom: theme.spacing.lg }}>
          HOW MANY PLAYERS?
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", maxWidth: 320 }}>
          {possiblePlayerCounts.map(function(playerNumber, index) { // .map creates a tile for each possible player count
            return (
              <Animated.View key={playerNumber} entering={FadeInDown.delay(index * 60).springify()}>
                {/* quiet dark card, not a gradient - the badge above stays the screen's one hero */}
                <SecondaryButton
                  onPress={function() {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPlayerCount(playerNumber); // tapping a number jumps straight to the game
                  }}
                  style={{
                    width: PLAYER_BUTTON_SIZE,
                    height: PLAYER_BUTTON_SIZE,
                    margin: theme.spacing.sm,
                    borderRadius: theme.radius.md,
                    shadowColor: "#000",
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 3, // fine here: these are rounded squares, not true circles
                  }}
                >
                  <Text style={{ fontSize: 28, fontWeight: "700", color: theme.textPrimary }}>{playerNumber}</Text>
                </SecondaryButton>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>
    );
  }




  // true once every circle has been claimed - used to show a short completion banner
  const allClaimed = unusedNumbers.length === 0 && circles.length > 0;

  // GAME SCREEN: it shows circles
  return (
    <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>

      {/* header bar: back chevron on the left, micro-title centered, live claim progress on the
          right. This chrome is what anchors the screen - without it the layout floats. The left
          and right slots share a fixed width so the title stays truly centered. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: theme.spacing.md,
          marginTop: insets.top + theme.spacing.sm, // respects the safe area
          marginBottom: theme.spacing.sm,
        }}
      >
        <View style={{ width: 64, alignItems: "flex-start" }}>
          <SecondaryButton // circular ghost back button - replaces the old bottom "Go Back"
            onPress={function() {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              resetToPlayerSelection();
            }}
            style={{ width: HEADER_CONTROL_SIZE, height: HEADER_CONTROL_SIZE, borderRadius: HEADER_CONTROL_SIZE / 2 }}
          >
            <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
          </SecondaryButton>
        </View>

        <Text style={{ flex: 1, textAlign: "center", ...theme.font.caption, color: theme.textSecondary }}>
          TAP TO CLAIM
        </Text>

        <View style={{ width: 64, alignItems: "flex-end" }}>
          {/* progress chip: counts claimed circles live as players tap */}
          <View
            style={{
              paddingHorizontal: theme.spacing.sm + 2,
              height: 30,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.surfaceBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textPrimary }}>
              {circles.filter(function(circle) { return circle.touched; }).length} / {playerCount}
            </Text>
          </View>
        </View>
      </View>


      <View // This is the play area where circles are shown and touches are detected

        ref={playAreaRef} // ref means reference allows us to get info about this component then what we do is store it in playAreaRef
        style={{ flex: 1 }}
        onLayout={measurePlayAreaOnScreen} // onLayout runs when the component is first shown and whenever its size changes. We use it to measure the play area size and position
        onTouchStart={handleTouchOnScreen} // onTouchStart means when the user touches the screen, run this function
      >

        {circles.map(function(circle, index) { // this shows all the circles
          return (
            <Circle
              key={circle.id}
              x={circle.x}
              y={circle.y}
              number={circle.number}
              index={index}
            />
          );
        })}

        {/* a short banner that fades in once every circle has been claimed.
            This sits INSIDE the play area as an absolutely-positioned overlay on purpose -
            if it were a normal sibling below the play area, it would shrink the play area's
            height, which re-triggers onLayout -> a fresh startNewRound() -> wiping every claim
            right as the game finishes. Positioning it absolute keeps the play area's size stable. */}
        {allClaimed && (
          <Animated.Text
            entering={FadeIn.duration(400)}
            style={{ position: "absolute", bottom: theme.spacing.md, left: 0, right: 0, textAlign: "center", color: theme.accent2, fontSize: 18, fontWeight: "600" }}
          >
            All players ready!
          </Animated.Text>
        )}

      </View>

      {/* footer: one centered, compact primary pill (App-Store style) - "Go Back" lives in the
          header now, so this is the screen's single gradient hero and its only bottom control */}
      <View
        style={{
          alignItems: "center",
          paddingTop: theme.spacing.md,
          paddingBottom: insets.bottom + theme.spacing.lg, // lifts the pill well clear of the bottom edge
        }}
      >
        <GradientButton // this starts a new round: same players, fresh shuffle, all circles cleared
          onPress={function() {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            startNewRound();
          }}
          style={{
            width: 210,
            height: ACTION_BUTTON_HEIGHT,
            borderRadius: theme.radius.pill,
            shadowColor: theme.accent,
            shadowOpacity: 0.4,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
          label="Play Again"
        />
      </View>
    </Animated.View>
  );
}
