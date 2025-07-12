import React, { useState, useEffect, useRef, useCallback } from "react";

const FishyGame = () => {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const keysRef = useRef({});

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const MIN_FISH_SIZE = 15;
  const MAX_FISH_SIZE = 60;
  const WIN_SIZE = CANVAS_WIDTH * 0.4;
  const FISH_COUNT = 12;

  const [gameState, setGameState] = useState("menu"); // 'menu', 'playing', 'gameOver', 'won'
  const [score, setScore] = useState(0);

  const playerRef = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    size: 20,
    speed: 3,
    color: "#FFD700",
    facingRight: true,
  });

  const fishRef = useRef([]);

  // Initialize fish
  const initializeFish = useCallback(() => {
    const fish = [];
    for (let i = 0; i < FISH_COUNT; i++) {
      const size =
        MIN_FISH_SIZE + Math.random() * (MAX_FISH_SIZE - MIN_FISH_SIZE);
      const startFromLeft = Math.random() > 0.5;
      fish.push({
        x: startFromLeft ? -size : CANVAS_WIDTH + size,
        y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
        size: size,
        speed: (Math.random() * 1.5 + 0.5) * (startFromLeft ? 1 : -1),
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        id: Math.random(),
      });
    }
    fishRef.current = fish;
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Update player position
  const updatePlayer = useCallback(() => {
    const keys = keysRef.current;
    const player = playerRef.current;

    if (keys["w"] || keys["arrowup"]) {
      player.y = Math.max(player.size, player.y - player.speed);
    }
    if (keys["s"] || keys["arrowdown"]) {
      player.y = Math.min(CANVAS_HEIGHT - player.size, player.y + player.speed);
    }
    if (keys["a"] || keys["arrowleft"]) {
      player.x -= player.speed;
      player.facingRight = false;
    }
    if (keys["d"] || keys["arrowright"]) {
      player.x += player.speed;
      player.facingRight = true;
    }

    // Screen wrapping left/right
    if (player.x < -player.size) {
      player.x = CANVAS_WIDTH + player.size;
    } else if (player.x > CANVAS_WIDTH + player.size) {
      player.x = -player.size;
    }
  }, []);

  // Update fish positions
  const updateFish = useCallback(() => {
    fishRef.current.forEach((fish, index) => {
      fish.x += fish.speed;

      // Remove fish that have gone off screen and spawn new ones
      if (fish.x < -fish.size - 50 || fish.x > CANVAS_WIDTH + fish.size + 50) {
        const size =
          MIN_FISH_SIZE + Math.random() * (MAX_FISH_SIZE - MIN_FISH_SIZE);
        const startFromLeft = Math.random() > 0.5;
        fishRef.current[index] = {
          x: startFromLeft ? -size : CANVAS_WIDTH + size,
          y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
          size: size,
          speed: (Math.random() * 1.5 + 0.5) * (startFromLeft ? 1 : -1),
          color: `hsl(${Math.random() * 360}, 70%, 60%)`,
          id: Math.random(),
        };
      }
    });
  }, []);

  // Check collisions
  const checkCollisions = useCallback(() => {
    const player = playerRef.current;

    fishRef.current.forEach((fish, index) => {
      const dx = player.x - fish.x;
      const dy = player.y - fish.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < (player.size + fish.size) * 0.7) {
        if (player.size > fish.size) {
          // Player eats fish
          player.size += fish.size * 0.1;
          setScore(Math.floor(player.size));

          // Check win condition
          if (player.size >= WIN_SIZE) {
            setGameState("won");
            return;
          }

          // Spawn new fish
          const size =
            MIN_FISH_SIZE + Math.random() * (MAX_FISH_SIZE - MIN_FISH_SIZE);
          const startFromLeft = Math.random() > 0.5;
          fishRef.current[index] = {
            x: startFromLeft ? -size : CANVAS_WIDTH + size,
            y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
            size: size,
            speed: (Math.random() * 1.5 + 0.5) * (startFromLeft ? 1 : -1),
            color: `hsl(${Math.random() * 360}, 70%, 60%)`,
            id: Math.random(),
          };
        } else {
          // Fish eats player
          setGameState("gameOver");
        }
      }
    });
  }, []);

  // Draw fish
  const drawFish = useCallback((ctx, fish, isPlayer = false) => {
    ctx.save();
    ctx.translate(fish.x, fish.y);

    // Determine direction
    const facingRight = isPlayer ? fish.facingRight : fish.speed > 0;

    // Flip horizontally if facing left
    if (!facingRight) {
      ctx.scale(-1, 1);
    }

    // Fish body
    ctx.fillStyle = fish.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, fish.size, fish.size * 0.7, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Fish tail
    ctx.beginPath();
    ctx.moveTo(-fish.size * 0.8, 0);
    ctx.lineTo(-fish.size * 1.3, -fish.size * 0.4);
    ctx.lineTo(-fish.size * 1.3, fish.size * 0.4);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(fish.size * 0.3, -fish.size * 0.2, fish.size * 0.2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(
      fish.size * 0.35,
      -fish.size * 0.2,
      fish.size * 0.1,
      0,
      2 * Math.PI,
    );
    ctx.fill();

    ctx.restore();
  }, []);

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState !== "playing") return;

    updatePlayer();
    updateFish();
    checkCollisions();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Clear canvas with ocean background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#4682B4");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw bubbles for effect
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    for (let i = 0; i < 10; i++) {
      const x = (Date.now() * 0.1 + i * 80) % CANVAS_WIDTH;
      const y = (Date.now() * 0.05 + i * 60) % CANVAS_HEIGHT;
      ctx.beginPath();
      ctx.arc(x, y, 3 + Math.sin(Date.now() * 0.01 + i) * 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw other fish
    fishRef.current.forEach((fish) => drawFish(ctx, fish, false));

    // Draw player fish
    drawFish(ctx, playerRef.current, true);

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, updatePlayer, updateFish, checkCollisions, drawFish]);

  // Start game
  const startGame = () => {
    setGameState("playing");
    setScore(20);
    playerRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      size: 20,
      speed: 3,
      color: "#FFD700",
      facingRight: true,
    };
    initializeFish();
  };

  // Reset game
  const resetGame = () => {
    setGameState("menu");
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
  };

  useEffect(() => {
    if (gameState === "playing") {
      gameLoop();
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-900 p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-4 border-blue-300 rounded-lg shadow-2xl"
        />

        {gameState === "menu" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-800 bg-opacity-90 rounded-lg">
            <h1 className="text-6xl font-bold text-yellow-300 mb-4">
              🐠 Fishy Game
            </h1>
            <p className="text-white text-xl mb-2 text-center max-w-md">
              Use WASD or Arrow Keys to move your golden fish
            </p>
            <p className="text-white text-lg mb-6 text-center max-w-md">
              Eat smaller fish to grow, avoid bigger fish!
            </p>
            <button
              onClick={startGame}
              className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold py-3 px-8 rounded-full text-xl transition-colors"
            >
              Start Swimming!
            </button>
          </div>
        )}

        {gameState === "gameOver" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-800 bg-opacity-90 rounded-lg">
            <h2 className="text-5xl font-bold text-white mb-4">Game Over!</h2>
            <p className="text-white text-2xl mb-4">Final Size: {score}</p>
            <p className="text-white text-lg mb-6">
              You got eaten by a bigger fish!
            </p>
            <div className="space-x-4">
              <button
                onClick={startGame}
                className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold py-2 px-6 rounded-full transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={resetGame}
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-6 rounded-full transition-colors"
              >
                Main Menu
              </button>
            </div>
          </div>
        )}

        {gameState === "won" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-800 bg-opacity-90 rounded-lg">
            <h2 className="text-5xl font-bold text-yellow-300 mb-4">
              🏆 You Won!
            </h2>
            <p className="text-white text-2xl mb-4">Final Size: {score}</p>
            <p className="text-white text-lg mb-6">
              You became the biggest fish in the sea!
            </p>
            <div className="space-x-4">
              <button
                onClick={startGame}
                className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold py-2 px-6 rounded-full transition-colors"
              >
                Play Again
              </button>
              <button
                onClick={resetGame}
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-6 rounded-full transition-colors"
              >
                Main Menu
              </button>
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <div className="absolute top-4 left-4 bg-blue-800 bg-opacity-80 text-white p-3 rounded-lg">
            <div className="text-lg font-bold">Size: {score}</div>
            <div className="text-sm">Goal: {Math.floor(WIN_SIZE)}</div>
          </div>
        )}
      </div>

      <div className="mt-4 text-white text-center max-w-2xl">
        <p className="text-sm opacity-75">
          Controls: WASD or Arrow Keys • Your fish wraps around left/right edges
        </p>
      </div>
    </div>
  );
};

export default FishyGame;
