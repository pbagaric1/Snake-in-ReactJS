import { useEffect, useState, useCallback, useRef } from "react";
import "./App.css";
import { produce } from "immer";
import tractor from "./tractor.png";
import apple from "./images.jpg";

const App = () => {
  //Set directions related to keyboard codes
  const DIRECTIONS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
  };

  //Difficulty is time for move interval in miliseconds
  const DIFFICULY = {
    NORMAL: 150,
    HARD: 100,
    BORBAS: 50,
  };

  const gridSize = 20;

  //Create 20x20 grid with 0 as values and store it in state
  const [grid, setGrid] = useState(
    Array.from(Array(gridSize), () => new Array(gridSize).fill(0))
  );

  const [snakeSpeed, setSnakeSpeed] = useState();

  //Had to use combination of states and refs cause react
  const [headState, setHead] = useState({ x: 0, y: 0 });
  const head = useRef(headState);

  const [isRunning, setIsRunning] = useState(false);
  const currentDirection = useRef(DIRECTIONS.RIGHT);

  const [scoreState, setScoreState] = useState(0);
  const score = useRef(scoreState);

  const moveInterval = useRef();

  //Fn that takes a 2d array and gets a random coordinate from it in [x,y] format
  const getRandomCoordinates = useCallback((allowedCoordinates) => {
    return allowedCoordinates[
      Math.floor(Math.random() * allowedCoordinates.length)
    ];
  }, []);

  const setStartingGrid = useCallback(() => {
    setGrid((g) =>
      //Produce is function from lib called immer, first argument is current state, second is "draft" state which
      //is a function where we define what we will do with current state and result is new state based on mutations
      //to the draft state
      produce(g, (gridCopy) => {
        //Set snake head position in the middle of the board, but since it have a length of 3, move head one square
        //to the right so its exactly in the center
        const headPositionX = parseInt(gridSize / 2);
        const headPositionY = parseInt(gridSize / 2 + 1);

        const allowedCoordinatesToSpawnFood = [];

        for (let i = 0; i < gridSize; i++)
          for (let j = 0; j < gridSize; j++) {
            //Set all values in grid to 0
            gridCopy[i][j] = 0;

            //Push all coordinates to allowed coordinates array which is used for generating food, but exclude
            //starting coordinates of the snake
            if (
              !(
                i === headPositionX &&
                (j === headPositionY ||
                  j === headPositionY - 1 ||
                  j === headPositionY - 2)
              )
            )
              allowedCoordinatesToSpawnFood.push([i, j]);
          }

        //Set snake values, largest number is always head of the snake
        gridCopy[headPositionX][headPositionY] = 3;
        gridCopy[headPositionX][headPositionY - 1] = 2;
        gridCopy[headPositionX][headPositionY - 2] = 1;

        //Get coordinates for starting food
        const [foodPositionX, foodPositionY] = getRandomCoordinates(
          allowedCoordinatesToSpawnFood
        );

        //Food will always have a value of -1
        gridCopy[foodPositionX][foodPositionY] = -1;

        //Keep track of snake's head with a state
        setHead({ x: headPositionX, y: headPositionY });
      })
    );
  }, [getRandomCoordinates]);

  useEffect(() => {
    setStartingGrid();
  }, [setStartingGrid]);

  //Update refs with state values
  useEffect(() => {
    head.current = headState;
  }, [headState]);

  useEffect(() => {
    score.current = scoreState;
  }, [scoreState]);

  //Get allowed directions related to the current one, for example if current one is
  //right then we cant move right again or left
  const getAllowedDirections = useCallback(
    (direction) => {
      if (direction === DIRECTIONS.LEFT || direction === DIRECTIONS.RIGHT)
        return [DIRECTIONS.UP, DIRECTIONS.DOWN];
      else return [DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
    },
    [DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT, DIRECTIONS.UP]
  );

  //Fn that triggers every time we use the keyboard arrows for changing the direction
  const changeDirection = useCallback(
    (event) => {
      if (
        !getAllowedDirections(currentDirection.current).includes(event.keyCode)
      )
        //If the pressed key is not allowed direction or any other key than the defined ones simply return
        return;
      currentDirection.current = event.keyCode;
    },
    [getAllowedDirections]
  );

  useEffect(() => {
    window.addEventListener("keydown", changeDirection, false);
  }, [changeDirection]);

  const eatFood = useCallback(() => {
    setScoreState(score.current + 5);
    setGrid((g) => {
      return produce(g, (gridCopy) => {
        let allowedCoordinatesToSpawnFood = [];
        for (let i = 0; i < gridSize; i++)
          for (let j = 0; j < gridSize; j++) {
            if (g[i][j] === 0) {
              allowedCoordinatesToSpawnFood.push([i, j]);
            }
          }

        //Generate new food position and place it on the grid
        const [foodPositionX, foodPositionY] = getRandomCoordinates(
          allowedCoordinatesToSpawnFood
        );

        gridCopy[foodPositionX][foodPositionY] = -1;

        //Increase snake's size by increasing each value in grid thats higher than 0, meaning
        //that's where snake is
        for (let i = 0; i < gridSize; i++)
          for (let j = 0; j < gridSize; j++) {
            if (g[i][j] > 0) gridCopy[i][j]++;
          }
      });
    });
  }, [getRandomCoordinates]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    moveInterval.current = setInterval(() => {
      setGrid((g) => {
        return produce(g, (gridCopy) => {
          for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
              if (i === head.current.x && j === head.current.y) {
                switch (currentDirection.current) {
                  case DIRECTIONS.LEFT:
                    //If snake hits the wall anounce game over
                    if (g[i][j - 1] > 0 || j - 1 < 0) {
                      setIsRunning(false);
                      return;
                    }
                    //Increase next square in the direction snake is moving by the current head value + 1
                    //meaning that square will become new head
                    gridCopy[i][j - 1] = g[i][j] + 1;
                    //If the next square in the direction snake is moving has a value of -1 that means
                    //food is there and eatFood fn is called
                    if (g[i][j - 1] === -1) eatFood();
                    //Update head state with new head position
                    setHead({ x: i, y: j - 1 });
                    break;
                  case DIRECTIONS.UP:
                    if (i - 1 < 0) {
                      setIsRunning(false);
                      return;
                    }
                    if (g[i - 1][j] > 0) {
                      setIsRunning(false);
                      return;
                    }
                    gridCopy[i - 1][j] = g[i][j] + 1;
                    if (g[i - 1][j] === -1) eatFood();
                    setHead({ x: i - 1, y: j });
                    break;
                  case DIRECTIONS.RIGHT:
                    if (g[i][j + 1] > 0 || j + 1 === gridSize) {
                      setIsRunning(false);
                      return;
                    }
                    gridCopy[i][j + 1] = g[i][j] + 1;
                    if (g[i][j + 1] === -1) eatFood();
                    setHead({ x: i, y: j + 1 });
                    break;
                  case DIRECTIONS.DOWN:
                    if (i + 1 > gridSize - 1) {
                      setIsRunning(false);
                      return;
                    }
                    if (g[i + 1][j] > 0) {
                      setIsRunning(false);
                      return;
                    }
                    gridCopy[i + 1][j] = g[i][j] + 1;
                    if (g[i + 1][j] === -1) eatFood();
                    setHead({ x: i + 1, y: j });
                    break;
                  default:
                    break;
                }
              }
            }
          }

          //Subtract all snake values by 1, which removes the tail and makes
          //the snake size consistent
          for (let i = 0; i < gridSize; i++)
            for (let j = 0; j < gridSize; j++) {
              if (gridCopy[i][j] > 0) gridCopy[i][j] = gridCopy[i][j] - 1;
            }
        });
      });
    }, snakeSpeed);
  }, [
    DIRECTIONS.DOWN,
    DIRECTIONS.LEFT,
    DIRECTIONS.RIGHT,
    DIRECTIONS.UP,
    eatFood,
    isRunning,
    snakeSpeed,
  ]);

  //Stop the move interval when game is over
  useEffect(() => {
    if (!isRunning) clearInterval(moveInterval.current);
  }, [isRunning]);

  const restartGame = () => {
    setIsRunning(true);
    setStartingGrid();
    setScoreState(0);
    currentDirection.current = DIRECTIONS.RIGHT;
  };

  const getClass = (value) => {
    if (value === 0) return "square";
    else if (value > 0) return "snake";
    else return "food";
  };

  const difficultyPicker = () => {
    return (
      <div className="difficulty-picker">
        <h3
          className={`difficulty-item ${
            snakeSpeed === DIFFICULY.NORMAL ? "selected" : ""
          }`}
          onClick={() => {
            setSnakeSpeed(DIFFICULY.NORMAL);
            restartGame();
          }}
        >
          NORMAL
        </h3>
        <h3
          className={`difficulty-item ${
            snakeSpeed === DIFFICULY.HARD ? "selected" : ""
          }`}
          onClick={() => {
            setSnakeSpeed(DIFFICULY.HARD);
            restartGame();
          }}
        >
          HARD
        </h3>
        <h3
          className={`difficulty-item ${
            snakeSpeed === DIFFICULY.BORBAS ? "selected" : ""
          }`}
          onClick={() => {
            setSnakeSpeed(DIFFICULY.BORBAS);
            restartGame();
          }}
        >
          BORBAS
        </h3>
      </div>
    );
  };

  return (
    <div className="main">
      <div className="content">
        <h3>SCORE: {score.current}</h3>
        <div className="grid-container">
          {isRunning ? (
            <div className="grid">
              {grid.map((row, i) =>
                row.map((col, j) => (
                  <div key={`${i}.${j}`} className={getClass(grid[i][j])}>
                    {grid[i][j] === -1 &&
                      (snakeSpeed === DIFFICULY.BORBAS ? (
                        <img className="tractor" src={tractor} alt="" />
                      ) : (
                        <img className="apple" src={apple} alt="" />
                      ))}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="modal">
              <h1>~ SNAKE ~</h1>
              <h2 className="play-again">DIFFICULTY:</h2>
              {difficultyPicker()}
            </div>
          )}
        </div>
      </div>
      )
    </div>
  );
};

export default App;
