import React, { useState } from "react";
import { ImageBackground, Pressable, ScrollView, Text, View } from "react-native"; // scrollview is used to allow for smaller screens 
import NumberSelector from "./NumberSelector";
import StartPlayer from "./StartPlayer";

const AVAILABLE_COLORS = [
  { name: "red", color: "#8B0000" },
  { name: "blue", color: "#00008B" },
  { name: "green", color: "#006400" },
  { name: "purple", color: "#4B0082" },
  { name: "orange", color: "#FF8C00" },
  { name: "pink", color: "#DB7093" },
  { name: "yellow", color: "#FFD700" },
  { name: "cyan", color: "#008B8B" },
  { name: "brown", color: "#8B4513" },
  { name: "gray", color: "#696969" },
  { name: "black", color: "#1a1a1a" },
  { name: "lime", color: "#32CD32" },
];

const PLAYER_COUNTS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function Index() { 
  const [activeTool, setActiveTool] = useState(null); // this tracks which tool is currently selected
  const [playerCount, setPlayerCount] = useState(null); // this tracks how many players are playing
  const [selectedColors, setSelectedColors] = useState([]);// this tracks which colors have been selected
  const [gameStarted, setGameStarted] = useState(false);//  this tracks if the game has started

  // this is used to select/deselect tools from the main menu
  function selectTool(tool) {
    if (activeTool === tool) {
      // Clicking same tool again deselects it
      setActiveTool(null);
      setPlayerCount(null);
      setSelectedColors([]);
      setGameStarted(false);
    } else {
      setActiveTool(tool);
      setPlayerCount(null);
      setSelectedColors([]);
      setGameStarted(false);
    }
  }

  function selectPlayerCount(count) { // this sets how many players will play
    setPlayerCount(count);
    setSelectedColors([]); // Reset colors when changing player count
  }

  function toggleColor(colorName) { // this adds or removes colors from the selected colors array
    if (selectedColors.includes(colorName)) {
      // Remove color
      setSelectedColors(selectedColors.filter(c => c !== colorName));
    } else if (selectedColors.length < playerCount) {
      // Add color if we haven't reached the limit
      setSelectedColors([...selectedColors, colorName]);
    }
  }

  function handleContinue() { // this continues to the start player game screen
    setGameStarted(true);
  }

  function handleContinueToWheel() { // 
    // After the start player game, go to the voting wheel
    setActiveTool("wheel");
    setGameStarted(false);
  }

  function resetGame() { // this resets everything to initial state
    setPlayerCount(null);
    setSelectedColors([]);
    setGameStarted(false);
  }

 // if voting tool is selected, show the NumberSelector component
  if (activeTool === "wheel") {
    return (
      <View style={{ flex: 1, backgroundColor: "#757575" }}>
        <NumberSelector />
        <Pressable
          onPress={() => setActiveTool(null)}
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
          <Text style={{ color: "white", fontSize: 16 }}>Back to Menu</Text>
        </Pressable>
      </View>
    );
  }

  // If game has started, show the StartPlayer game screen
  if (activeTool === "startPlayer" && gameStarted) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
        <StartPlayer 
          playerCount={playerCount} 
          selectedColors={selectedColors} 
          onBack={resetGame}
          onContinue={handleContinueToWheel}
        />
      </View>
    );
  }

  return (
    //this is the main menu screen
    <ImageBackground 
      source={require('../assets/images/ToolBox-Background.png')} 
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ paddingTop: 60, alignItems: "center" }}>
          <Text style={{ 
            fontSize: 32, 
            fontWeight: "bold", 
            color: "white", 
            marginBottom: 30,
            textShadowColor: "rgba(0, 0, 0, 0.8)",
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 4,
          }}>
            Game Toolbox
          </Text>

          {/* Tool Buttons */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 30, marginBottom: 40 }}>
            {/* Start Player Button */}
            <Pressable
              onPress={() => selectTool("startPlayer")}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 3,
                borderColor: activeTool === "startPlayer" ? "#6B8E23" : "white",
                backgroundColor: activeTool === "startPlayer" ? "rgba(45, 58, 45, 0.9)" : "rgba(0, 0, 0, 0.6)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontSize: 14, fontWeight: "bold", textAlign: "center" }}>
                Start{"\n"}Player
              </Text>
            </Pressable>

            {/* Voting Tool Button */}
            <Pressable
              onPress={() => selectTool("wheel")}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 3,
                borderColor: activeTool === "wheel" ? "#6B8E23" : "white",
                backgroundColor: activeTool === "wheel" ? "rgba(45, 58, 45, 0.9)" : "rgba(0, 0, 0, 0.6)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontSize: 14, fontWeight: "bold", textAlign: "center" }}>
                Voting{"\n"}Tool
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Start Player Flow */}
        {activeTool === "startPlayer" && (
          <View style={{ paddingHorizontal: 20 }}>
            {/* Player Count Section */}
            <Text style={{ color: "white", fontSize: 16, marginBottom: 15, textAlign: "center" }}>
              Select # of Players
            </Text>

            
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10, marginBottom: 30 }}>
              {PLAYER_COUNTS.map((count) => (
                <Pressable
                  key={count}
                  onPress={() => selectPlayerCount(count)}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: playerCount === count ? "#6B8E23" : "#444",
                    backgroundColor: playerCount === count ? "#3d4a3d" : "#1a1a1a",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 18 }}>{count}</Text>
                </Pressable>
              ))}
            </View>

            {/* Color Selection  this only shows after player count selected */}
            {playerCount !== null && (
              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                  <Text style={{ color: "white", fontSize: 16 }}>
                    Select Colors
                  </Text>
                  <Pressable
                    onPress={() => setSelectedColors(["none"])} // Set special value to indicate no colors
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 4,
                      backgroundColor: "#1a1a1a",
                      borderWidth: 1,
                      borderColor: "#444",
                    }}
                  >
                    <Text style={{ color: "#888", fontSize: 12 }}>No Colors Required</Text>
                  </Pressable>
                </View>

                <Text style={{ color: "#000000", fontSize: 12, marginBottom: 10, textAlign: "center" }}>
                  {selectedColors.length}/{playerCount} selected
                </Text>
                  
                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10, marginBottom: 30 }}>
                  {AVAILABLE_COLORS.map((item) => (
                    <Pressable
                      key={item.name}
                      onPress={() => toggleColor(item.name)}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: selectedColors.includes(item.name) ? "white" : "#333",
                        backgroundColor: item.color,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    />
                  ))}
                </View>

                {/* Continue Button  only shows when enough colors selected OR when "continue without color" is clicked */}
                {(selectedColors.length === playerCount || selectedColors[0] === "none") && (
                  <Pressable
                    onPress={handleContinue}
                    style={{
                      backgroundColor: "#2a2a2a",
                      paddingVertical: 15,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#444",
                      alignItems: "center",
                      marginTop: 10,
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 16 }}>Continue</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}
