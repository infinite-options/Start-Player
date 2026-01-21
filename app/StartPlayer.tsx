import React, { useEffect, useRef, useState } from "react"; // useEffect lets me run code when things change and useRef lets me reference components
import { Pressable, Text, View } from "react-native";

// These are fixed numbers that won't change I use them in multiple places
const BASE_CIRCLE_SIZE = 100; // Default size for circles when there are few players
const BASE_CIRCLE_RADIUS = 50; // Half of BASE_CIRCLE_SIZE
const BACK_BUTTON_HEIGHT = 80; // How tall the back button is


// This function calculates the circle size based on player count
// More players = smaller circles to prevent overlap
function getCircleSizeForPlayerCount(playerCount) {
  if (playerCount <= 6) {
    return 100; // Full size for 6 or fewer players
  } else if (playerCount === 7) {
    return 90;
  } else if (playerCount === 8) {
    return 80;
  } else if (playerCount === 9) {
    return 70;
  } else if (playerCount === 10) {
    return 65;
  } else if (playerCount === 11) {
    return 58;
  } else {
    return 52; // 12 players
  }
}


// Color mapping from color names to actual color values
const COLOR_MAP = {
  red: "#8B0000",
  blue: "#00008B",
  green: "#006400",
  purple: "#4B0082",
  orange: "#FF8C00",
  pink: "#DB7093",
  yellow: "#FFD700",
  cyan: "#008B8B",
  brown: "#8B4513",
  gray: "#696969",
  black: "#1a1a1a",
  lime: "#32CD32",
};


// This component now receives playerCount, selectedColors, onBack, and onContinue as props from index.tsx
export default function StartPlayer({ playerCount, selectedColors, onBack, onContinue }) {
  
  const [circles, setCircles] = useState([]); // Array to store all the circles on screen
  
  const [playAreaSize, setPlayAreaSize] = useState(null); // How big the play area is (width and height). This is for avoiding placing circles off screen
  
  const [playAreaPosition, setPlayAreaPosition] = useState({ x: 0, y: 0 }); // here I'm storing the position of the play area on screen so I can convert touch coordinates to play area coordinates
  
  const [unusedNumbers, setUnusedNumbers] = useState([]); // I did this to make sure each player gets a unique number
  
  const [unusedColors, setUnusedColors] = useState([]); // This tracks which colors haven't been given to players yet
  
  const playAreaRef = useRef(null); // I did this to get the size and position of the play area on screen. use it to get the size and position of the play area on screen




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

  
  function shuffleArray(array) {   
    // this is to shuffle an array using Fisher-Yates shuffle algorithm
    // Make a copy so we don't change the original
    const newArray = [];
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








  // useEffect: This runs when playerCount, playAreaSize, or selectedColors changes
  // useEffect means `do this when these things change` and the array at the end tells it what to watch for changes
  useEffect(function() {
    // Check if we have everything we need
    if (playAreaSize === null) { // If we don't have a play area size yet, do nothing
      return;
    }
    if (playerCount === 0 || playerCount === null) { // If no players selected yet, do nothing
      return;
    }
    if (selectedColors.length === 0) { // If no colors selected yet, do nothing
      return;
    }

    // Get the circle size based on how many players there are
    const circleSize = getCircleSizeForPlayerCount(playerCount);
    const circleRadius = circleSize / 2;
   
    const newCircles = []; // Create an empty array to store our new circles
    
    // Calculate the center of the play area
    const centerX = playAreaSize.width / 2;
    const centerY = playAreaSize.height / 2;
    
    // Calculate the radius of the big circle that player circles will sit on
    // We use the smaller of width or height to make sure it fits, then subtract padding
    const bigCircleRadius = Math.min(centerX, centerY) - circleRadius - 20; // -20 for extra padding from edges
    
    // this loop is to create a circle for each player and place it around the big circle
    for (let playerIndex = 0; playerIndex < playerCount; playerIndex = playerIndex + 1) {
      
      // Calculate the angle for this circle
      // We divide 360 degrees by the number of players to get even spacing
      // We subtract 90 so the first circle starts at the top (12 o'clock position)
      // Without -90, it would start at the right (3 o'clock position)
      const angleInDegrees = (360 / playerCount) * playerIndex - 90;
      
      // Convert degrees to radians because Math.cos and Math.sin use radians
      // The formula is: radians = degrees * (PI / 180)
      const angleInRadians = angleInDegrees * (Math.PI / 180);
      
      // Calculate x and y position using trigonometry
      // cos gives us the x offset, sin gives us the y offset
      // We multiply by the radius to scale it to the right size
      // Then add centerX/centerY to position it relative to the center
      const circleX = centerX + bigCircleRadius * Math.cos(angleInRadians);
      const circleY = centerY + bigCircleRadius * Math.sin(angleInRadians);


      // This is to create the new circle object
      const newCircle = {
        id: playerIndex, 
        x: circleX, 
        y: circleY, 
        touched: false, // Its asking has it been touched yet?
        color: null, // color will be assigned when touched
        number: null, // number will be assigned when touched
        size: circleSize, // Store the size for this circle
      };
      
      newCircles.push(newCircle); // Add it to our list. .push is simply adding a new item to the end of an array
    }
    
    setCircles(newCircles); // Save all the circles we created






    // this is to create an array of numbers from 1 to playerCount and shuffle them so we can assign them randomly to players when they touch circles
    const numbers = [];
    for (let i = 1; i <= playerCount; i = i + 1) {
      numbers.push(i);
    }


    const shuffledNumbers = shuffleArray(numbers); // this is simply to shuffle the numbers using Fisher-Yates shuffle algorithm
    setUnusedNumbers(shuffledNumbers); // Save the shuffled numbers


    // Check if user selected "continue without color" - if so, create array of nulls for colors
    // Otherwise shuffle the selected colors normally
    if (selectedColors[0] === "none") {
      // Create an array of nulls for each player (no colors will be assigned)
      const noColors = [];
      for (let i = 0; i < playerCount; i = i + 1) {
        noColors.push(null);
      }
      setUnusedColors(noColors);
    } else {
      // this is to shuffle the selected colors so we can assign them randomly to players when they touch circles
      const shuffledColors = shuffleArray(selectedColors);
      setUnusedColors(shuffledColors); // Save the shuffled colors
    }
    
  }, [playerCount, playAreaSize, selectedColors]); // Run this when these things change









  function handleTouchOnScreen(event) {
    // this function simply checks if any touches are inside any circles and updates the circles accordingly
    const touches = event.nativeEvent.touches; // event.nativeEvent.touches is an array of all current touch points on the screen
    
    // this makes copies and numbers of the unused numbers and colors so we can modify them
    let numbersStillAvailable = [];
    for (let i = 0; i < unusedNumbers.length; i = i + 1) {
      numbersStillAvailable.push(unusedNumbers[i]);
    }
    
    let colorsStillAvailable = [];
    for (let i = 0; i < unusedColors.length; i = i + 1) {
      colorsStillAvailable.push(unusedColors[i]);
    }




  
    setCircles(function(currentCircles) {
      // this is for updating the circles based on touches and assigning numbers and colors to touched circles
      const updatedCircles = []; // this will store the updated circles
      

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
          const circleRadius = currentCircle.size / 2; // Get the radius from the circle's size
          if (distance <= circleRadius) {
            wasTouched = true;
            break; // if touched stop checking other touches
          }
        }




        
      
        if (wasTouched === true) {
          // Here I'm assigning a number and color to the circle that was touched
          
          
          const assignedNumber = numbersStillAvailable[0]; // Take the first available number
          

          // it removes from available numbers by creating a new array without the first item
          const newNumbersArray = [];
          for (let k = 1; k < numbersStillAvailable.length; k = k + 1) {
            newNumbersArray.push(numbersStillAvailable[k]);
          }
          numbersStillAvailable = newNumbersArray; // These variables are to make sure each player gets a unique number
          

          
          
          const assignedColor = colorsStillAvailable[0]; // Take the first available color
          

          // Remove it from available colors by creating a new array without the first item
          const newColorsArray = [];
          for (let k = 1; k < colorsStillAvailable.length; k = k + 1) {
            newColorsArray.push(colorsStillAvailable[k]);
          }
          colorsStillAvailable = newColorsArray; // This makes sure each player gets a unique color
          


          // this creates the updated circle with assigned number and color
          const updatedCircle = {
            id: currentCircle.id,
            x: currentCircle.x,
            y: currentCircle.y,
            touched: true,
            color: assignedColor,
            number: assignedNumber,
            size: currentCircle.size, // Keep the same size when touched
          };
          
          updatedCircles.push(updatedCircle); // this adds the updated circle to our list
        } else {
          updatedCircles.push(currentCircle); // if not touched leave circle as is
        }
      }
      



      // this saves the remaining numbers and colors for next time
      setUnusedNumbers(numbersStillAvailable); // this updates the unused numbers for next time
      setUnusedColors(colorsStillAvailable); // it's the same for colors
      

      return updatedCircles; // this returns the updated circles to be saved
    });
  }







  // Helper function to get the actual color value from a color name
  function getColorValue(colorName) {
    if (colorName === null) {
      return "transparent";
    }
    // Check if the color exists in our COLOR_MAP
    if (COLOR_MAP[colorName]) {
      return COLOR_MAP[colorName];
    }
    // If not in map, return the color name itself (fallback)
    return colorName;
  }








  //  This is my game screen, it shows cicles
  return ( // Show the game screen with circles
    <View style={{ flex: 1 }}>
      
      <Text
        style={{
          textAlign: "center",
          fontSize: 20,
          marginTop: 40,
          marginBottom: 10,
          color: "white",
        }}
      >
        Touch the circles to get your number and color
      </Text>

      
      <View // This is the play area where circles are shown and touches are detected

        ref={playAreaRef} // ref means reference allows us to get info about this component then what we do is store it in playAreaRef
        style={{ flex: 1 }}
        onLayout={measurePlayAreaOnScreen} // onLayout runs when the component is first shown and whenever its size changes. We use it to measure the play area size and position
        onTouchStart={handleTouchOnScreen} // onTouchStart means when the user touches the screen, run this function
      >

        {/* This is the big circle outline that player circles sit on */}
        {playAreaSize !== null && (
          <View
            style={{
              position: "absolute",
              // Calculate the size of the big circle (same formula as in useEffect)
              // Use dynamic circle size based on player count
              width: (Math.min(playAreaSize.width / 2, playAreaSize.height / 2) - getCircleSizeForPlayerCount(playerCount) / 2 - 20) * 2,
              height: (Math.min(playAreaSize.width / 2, playAreaSize.height / 2) - getCircleSizeForPlayerCount(playerCount) / 2 - 20) * 2,
              borderRadius: Math.min(playAreaSize.width / 2, playAreaSize.height / 2) - getCircleSizeForPlayerCount(playerCount) / 2 - 20,
              borderWidth: 2,
              borderColor: "#444", // Gray color for the outline
              backgroundColor: "transparent",
              // Center it in the play area
              left: playAreaSize.width / 2 - (Math.min(playAreaSize.width / 2, playAreaSize.height / 2) - getCircleSizeForPlayerCount(playerCount) / 2 - 20),
              top: playAreaSize.height / 2 - (Math.min(playAreaSize.width / 2, playAreaSize.height / 2) - getCircleSizeForPlayerCount(playerCount) / 2 - 20),
            }}
          />
        )}

        {/* Show Continue button below the big circle when all circles have been touched */}
        {playAreaSize !== null && circles.length > 0 && circles.every(function(circle) { return circle.touched === true; }) && (
          <Pressable
            onPress={onContinue} // Call the onContinue prop function passed from index.tsx
            style={{
              position: "absolute",
              // Position it below the big circle but above the Go Back button
              bottom: 100, // Fixed position from bottom to avoid overlap with Go Back button
              left: playAreaSize.width / 2 - 60, // Center horizontally (button is 120 wide)
              width: 120,
              height: 40,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#444",
              backgroundColor: "#1a1a1a",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 16, color: "white" }}>Continue</Text>
          </Pressable>
        )}

        {circles.map(function(circle) { // this shows all the circles
          const circleSize = circle.size || 100; // Get the size from the circle, default to 100
          const circleRadius = circleSize / 2;
          const fontSize = circleSize > 70 ? 28 : circleSize > 55 ? 22 : 18; // Smaller font for smaller circles
          
          return (
            <View
              key={circle.id}
              style={{
                position: "absolute",
                width: circleSize,
                height: circleSize,
                borderRadius: circleRadius,
                borderWidth: 3,
                borderColor: "white",
                backgroundColor: getColorValue(circle.color), // use helper function to get color value
                left: circle.x - circleRadius,
                top: circle.y - circleRadius,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              
              {circle.number !== null && ( // this shows the number only if it has been assigned
                <Text style={{ fontSize: fontSize, color: "white", fontWeight: "bold" }}>
                  {circle.number}
                </Text>
              )}
            </View>

          );
        })}

      </View>



     
      <Pressable  // this is the back button on the game screen
        onPress={onBack} // Call the onBack prop function passed from index.tsx
        style={{
          position: "absolute",
          bottom: 40,
          alignSelf: "center",
          width: 150,
          height: 40,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#444",
          backgroundColor: "#1a1a1a",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 16, color: "white" }}>Go Back</Text>
      </Pressable>
    </View>
  );
}
