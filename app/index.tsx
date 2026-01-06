

import React, { useEffect, useRef, useState } from "react"; // useEffect lets me run code when things change and useRef lets me reference components
import { Pressable, Text, View } from "react-native";

// These are fixed numbers that won't change I use them in multiple places
const CIRCLE_SIZE = 100; // How big each circle is
const CIRCLE_RADIUS = 50; // Half of CIRCLE_SIZE (100 / 2 = 50). Radius means half the size of a circle
const BACK_BUTTON_HEIGHT = 80; // How tall the back button is


const AVAILABLE_COLORS = [ 
  "red", "blue", "green", "orange", 
  "purple", "pink", "yellow", "cyan",
  "brown", "gray", "black", "lime"
];



export default function Index() {
  const [playerCount, setPlayerCount] = useState(0); // How many players are playing (0 means we haven't chosen yet)
  
  const [selectedColors, setSelectedColors] = useState([]); // Which colors did the user pick? This is an array to store multiple colors
  
  const [circles, setCircles] = useState([]); // Array to store all the circles on screen
  
  const [playAreaSize, setPlayAreaSize] = useState(null); // How big the play area is (width and height). This is for avoiding placing circles off screen
  
  const [playAreaPosition, setPlayAreaPosition] = useState({ x: 0, y: 0 }); // here I'm storing the position of the play area on screen so I can convert touch coordinates to play area coordinates
  
  const [unusedNumbers, setUnusedNumbers] = useState([]); // I did this to make sure each player gets a unique number
  
  const [unusedColors, setUnusedColors] = useState([]); // This tracks which colors haven't been given to players yet
  
  const playAreaRef = useRef(null); // I did this to get the size and position of the play area on screen. use it to get the size and position of the play area on screen
  
  const possiblePlayerCounts = [2, 3, 4, 5, 6, 7, 8]; // All the possible player counts to choose from




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




  // I'm checking if two circles would overlap
  function doCirclesOverlap(x1, y1, x2, y2) {
    // I'm calculating distance between two circles. the reason I'm subtracting x and y coordinates is to get the difference in position between the two circles
    const horizontalDistance = x1 - x2; // Calculate horizontal distance
    const verticalDistance = y1 - y2; // Calculate vertical distance
    
    // I used Pythagorean theorem to calculate distance between two points

    const distance = Math.sqrt(
      horizontalDistance * horizontalDistance + 
      verticalDistance * verticalDistance
    );
    
    // If distance is less than CIRCLE_SIZE, they will overlap
    if (distance < CIRCLE_SIZE) {
      return true; 
    } else {
      return false; 
    }
  }








  // useEffect: This runs when playerCount, playAreaSize, or selectedColors changes
  // useEffect means `do this when these things change` and the array at the end tells it what to watch for changes
  useEffect(function() {
    // Check if we have everything we need
    if (playAreaSize === null) { // If we don't have a play area size yet, do nothing
      return;
    }
    if (playerCount === 0) { // If no players selected yet, do nothing
      return;
    }
    if (selectedColors.length === 0) { // If no colors selected yet, do nothing
      return;
    }

   
    const newCircles = []; // Create an empty array to store our new circles
    
    // this loop is to create a circle for each player and place it randomly on the screen
    for (let playerIndex = 0; playerIndex < playerCount; playerIndex = playerIndex + 1) {
      let circleX = 0;
      let circleY = 0;
      let foundGoodPosition = false;
      


      // this loop is to make sure circles don't overlap when we place them
      while (foundGoodPosition === false) {
        // This pics a random X position to make sure circle stays fully on screen
        const minX = CIRCLE_RADIUS;
        const maxX = playAreaSize.width - CIRCLE_RADIUS;
        circleX = minX + Math.random() * (maxX - minX); // this equation means pick a random position between minX and maxX so the circle stays fully on screen
        



        // This picks a random Y position
        const minY = CIRCLE_RADIUS;
        const maxY = playAreaSize.height - CIRCLE_RADIUS;
        circleY = minY + Math.random() * (maxY - minY);
        
        // Check if this position overlaps with any existing circles
        // this is to check the new circle against all existing circles to see if they overlap
        let overlapsWithAny = false;
        for (let i = 0; i < newCircles.length; i = i + 1) {
          const existingCircle = newCircles[i];
          const overlaps = doCirclesOverlap(circleX, circleY, existingCircle.x, existingCircle.y);
          
          if (overlaps === true) { // If circles are too close they overlap
            overlapsWithAny = true;
            break; // It stops checking and we need a new position
          }
        }

        
        // this is to decide if we found a good position
        if (overlapsWithAny === false) {
          foundGoodPosition = true;
        }
      }
      


      // This is to create the new circle object
      const newCircle = {
        id: playerIndex, 
        x: circleX, 
        y: circleY, 
        touched: false, // Its asking has it been touched yet?
        color: null, // color will be assigned when touched
        number: null, // number will be assigned when touched
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


    // this is to shuffle the selected colors so we can assign them randomly to players when they touch circles
    const shuffledColors = shuffleArray(selectedColors);
    setUnusedColors(shuffledColors); // Save the shuffled colors
    
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
          if (distance <= CIRCLE_RADIUS) {
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







  function resetToPlayerSelection() {
    // this goes back to player selection, i use this when pressing the back button on the game screen
    setPlayerCount(0);
    setSelectedColors([]);
    setCircles([]);
    setPlayAreaSize(null);
    setUnusedNumbers([]);
    setUnusedColors([]);
    setPlayAreaPosition({ x: 0, y: 0 });
  }








  function toggleColorSelection(color) {
    // this function lets users select or deselect colors by clicking on them
    
    // this checks if the color is already selected
    let isAlreadySelected = false;
    for (let i = 0; i < selectedColors.length; i = i + 1) {
      if (selectedColors[i] === color) {
        isAlreadySelected = true;
        break; // Found it, stop looking
      }
    }
    

    if (isAlreadySelected === true) {
      // Remove this color from selected colors
      const newSelectedColors = [];
      for (let i = 0; i < selectedColors.length; i = i + 1) {
        if (selectedColors[i] !== color) { // this adds all colors except the one to remove
          newSelectedColors.push(selectedColors[i]);
        }
      }
      setSelectedColors(newSelectedColors);
    } else {
      

      if (selectedColors.length < playerCount) { // this is to prevent selecting more colors than players
        const newSelectedColors = [];
        for (let i = 0; i < selectedColors.length; i = i + 1) {
          newSelectedColors.push(selectedColors[i]);
        }
        newSelectedColors.push(color); // this adds the new color to the end
        setSelectedColors(newSelectedColors);
      }
    }
  }








 
  if (playerCount === 0) { // If no players selected yet show the selection screen

    return (


      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Text style={{ fontSize: 24, marginBottom: 20 }}>Select Number of Players</Text>
        
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>


          {possiblePlayerCounts.map(function(playerNumber) { // .map simply means `for each item in this array, do something and return a new array`. Here I'm creating a Pressable for each possible player count


            return (
              <Pressable
                key={playerNumber} // This is needed when creating lists of components so react can keep track of them
                onPress={function() {
                  setPlayerCount(playerNumber);
                  setSelectedColors([]);
                }}
                style={{
                  width: 60,
                  height: 60,
                  margin: 10,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: "#333",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f0f0f0"
                }}
              >
                <Text style={{ fontSize: 32, fontWeight: "bold" }}>{playerNumber}</Text>
              </Pressable>

              
            );
          })}
        </View>
      </View>


    );
  }


  


  // This lets me select colors
  if (selectedColors.length < playerCount) { // If we haven't selected enough colors yet, show the color selection screen
    return (


      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Text style={{ fontSize: 24, marginBottom: 10 }}>Select Colors</Text>
        <Text style={{ fontSize: 16, marginBottom: 20, color: "#666" }}>
          Choose {playerCount} colors ({selectedColors.length}/{playerCount} selected)
        </Text>
        
        
        <View style={{  // this shows all the available colors to choose 
          flexDirection: "row", 
          flexWrap: "wrap", 
          maxWidth: 400,
          justifyContent: "center",
          marginBottom: 30
        }}>

          {AVAILABLE_COLORS.map(function(color) { // I'm creating a Pressable for each available color
            // this checks if this color is already selected
            let isSelected = false;
            for (let i = 0; i < selectedColors.length; i = i + 1) {
              if (selectedColors[i] === color) {
                isSelected = true;
                break;
              }
            }
            
            return (

              <Pressable
                key={color}
                onPress={function() {
                  toggleColorSelection(color); // when I click this, it toggles selection. it lets me select or deselect colors
                }}
                style={{
                  width: 50,
                  height: 50,
                  margin: 8,
                  borderRadius: 25,
                  backgroundColor: color,
                  borderWidth: isSelected ? 4 : 2, // If selected, make the border thicker
                  borderColor: isSelected ? "#000" : "#999", // If selected, make the border black
                }}
              />
            );
          })}
        </View>


      
        <Pressable // this is the back button on the color selection screen
          onPress={function() {
            setPlayerCount(0); 
            setSelectedColors([]);
          }}
          style={{
            marginTop: 20,
            paddingHorizontal: 30,
            paddingVertical: 10,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: "#333"
          }}
        >
          <Text style={{ fontSize: 16 }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }






  //  This is my game screen, it shows cicles
  return ( // If players and colors are selected, show the game screen
    <View style={{ flex: 1 }}>
      
      <Text
        style={{
          textAlign: "center",
          fontSize: 20,
          marginTop: 40,
          marginBottom: 10,
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

        {circles.map(function(circle) { // this shows all the circles
          return (
            <View
              key={circle.id}
              style={{
                position: "absolute",
                width: CIRCLE_SIZE,
                height: CIRCLE_SIZE,
                borderRadius: CIRCLE_RADIUS,
                borderWidth: 3,
                borderColor: "black",
                backgroundColor: circle.color === null ? "transparent" : circle.color, // if there's no color yet, make it transparent
                left: circle.x - CIRCLE_RADIUS,
                top: circle.y - CIRCLE_RADIUS,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              
              {circle.number !== null && ( // this shows the number only if it has been assigned
                <Text style={{ fontSize: 28, color: "white" }}>
                  {circle.number}
                </Text>
              )}
            </View>

          );
        })}

      </View>



     
      <Pressable  // this is the back button on the game screen
        onPress={resetToPlayerSelection}
        style={{
          height: BACK_BUTTON_HEIGHT,
          alignItems: "center",
          justifyContent: "center",
          borderTopWidth: 1,
          borderColor: "#ccc",
        }}
      >
        <Text style={{ fontSize: 20 }}>Go Back</Text>
      </Pressable>
    </View>
  );
}