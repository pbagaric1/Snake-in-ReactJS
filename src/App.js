import { useEffect, useState, useCallback, useRef } from "react";
import "./App.css";
import { produce } from "immer";
import tractor from "./tractor.png";
// import { throttle } from "lodash";

const App = () => {
  const DIRECTIONS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
  };

  const DIFFICULY = {
    EASY: 200,
    MEDIUM: 150,
    HARD: 100,
  };

  const gridSize = 20;

  const [snakeSpeed, setSnakeSpeed] = useState(DIFFICULY.MEDIUM);

  const [grid, setGrid] = useState(
    Array.from(Array(gridSize), () => new Array(gridSize).fill(0))
  );
  const [headStateX, setHeadX] = useState();
  const [headStateY, setHeadY] = useState();

  const headX = useRef();
  const headY = useRef();

  const [gameOver, setGameOver] = useState(false);

  const currentDirection = useRef(DIRECTIONS.RIGHT);

  const [scoreState, setScoreState] = useState(0);
  const score = useRef(scoreState);

  const moveInterval = useRef();

  const getInitialPosition = useCallback((g) => {
    const startPositionX = Math.floor(Math.random() * gridSize);
    const startPositionY = Math.floor(Math.random() * gridSize);
    let overlap = false;
    for (let i = 0; i < gridSize; i++)
      for (let j = 0; j < gridSize; j++) {
        if (g[startPositionX][startPositionX] > 0) {
          overlap = true;
          return;
        }
      }
    // console.log("hrana", startPositionX, startPositionY);
    // console.log("g", g);
    return overlap ? getInitialPosition(g) : { startPositionX, startPositionY };
  }, []);

  const getRandNum = useCallback((allowed) => {
    return allowed[Math.floor(Math.random() * allowed.length)];
    // console.log(excluded);
    // let num = Math.floor(
    //   Math.random() * (max - min + 1 - excluded.length) + min
    // );
    // excluded
    //   .sort((a, b) => a - b)
    //   .every((exeption) => exeption <= num && (num++, true));
    // return num;
  }, []);

  const setStartingGrid = useCallback(() => {
    setGrid((g) =>
      produce(g, (gridCopy) => {
        for (let i = 0; i < gridSize; i++)
          for (let j = 0; j < gridSize; j++) {
            gridCopy[i][j] = 0;
          }

        const headPositionX = parseInt(gridSize / 2);
        const headPositionY = parseInt(gridSize / 2 + 1);
        gridCopy[headPositionX][headPositionY] = 3;
        gridCopy[headPositionX][headPositionY - 1] = 2;
        gridCopy[headPositionX][headPositionY - 2] = 1;
        const {
          startPositionX: foodStartX,
          startPositionY: foodStartY,
        } = getInitialPosition(g);
        gridCopy[foodStartX][foodStartY] = -1;
        setHeadX(headPositionX);
        setHeadY(headPositionY);
      })
    );
  }, [getInitialPosition]);

  // const generateFood = useCallback(() => {
  //   setGrid((g) =>
  //     produce(g, (gridCopy) => {
  //       const {
  //         startPositionX: foodStartX,
  //         startPositionY: foodStartY,
  //       } = getInitialPosition();
  //       gridCopy[foodStartX][foodStartY] = -1;
  //     })
  //   );
  // }, [getInitialPosition]);

  useEffect(() => {
    headX.current = headStateX;
  }, [headStateX]);

  useEffect(() => {
    headY.current = headStateY;
  }, [headStateY]);

  useEffect(() => {
    score.current = scoreState;
  }, [scoreState]);

  const getAllowedDirections = useCallback(
    (direction) => {
      if (direction === DIRECTIONS.LEFT || direction === DIRECTIONS.RIGHT)
        return [DIRECTIONS.UP, DIRECTIONS.DOWN];
      else return [DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
    },
    [DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT, DIRECTIONS.UP]
  );

  const changeDirection = useCallback(
    (event) => {
      if (
        !getAllowedDirections(currentDirection.current).includes(event.keyCode)
      )
        return;
      currentDirection.current = event.keyCode;
    },
    [getAllowedDirections]
  );

  useEffect(() => {
    window.addEventListener("keydown", changeDirection, false);
  }, [changeDirection]);

  // const subtractByOne = (g) => {
  //   console.log("prije", g);
  //   return produce(g, (gridCopy) => {
  //     for (let i = 0; i < gridSize; i++)
  //       for (let j = 0; j < gridSize; j++) {
  //         if (gridCopy[i][j] > 0) gridCopy[i][j] = gridCopy[i][j] - 1;
  //       }
  //   });
  // };

  // const removeTail = (g) => {
  //   return produce(g, (gridCopy) => {
  //     for (let i = 0; i < gridSize; i++)
  //       for (let j = 0; j < gridSize; j++) {
  //         if (gridCopy[i][j] === 1) gridCopy[i][j] = 0;
  //       }
  //   });
  // };

  const eatFood = useCallback(() => {
    setScoreState(score.current + 5);
    setGrid((g) => {
      return produce(g, (gridCopy) => {
        let allowedPairs = [];
        for (let i = 0; i < gridSize; i++)
          for (let j = 0; j < gridSize; j++) {
            if (g[i][j] === 0) {
              allowedPairs.push([i, j]);
            }
          }
        // const foodStartX = 5;
        // const foodStartY = 10;
        const [foodStartX, foodStartY] = getRandNum(allowedPairs);

        gridCopy[foodStartX][foodStartY] = -1;

        for (let i = 0; i < gridSize; i++)
          for (let j = 0; j < gridSize; j++) {
            if (g[i][j] > 0) gridCopy[i][j]++;
          }
      });
    });
  }, [getRandNum]);

  useEffect(() => {
    if (gameOver) {
      return;
    }
    moveInterval.current = setInterval(() => {
      setGrid((g) => {
        return produce(g, (gridCopy) => {
          for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
              if (i === headX.current && j === headY.current) {
                switch (currentDirection.current) {
                  case DIRECTIONS.LEFT:
                    if (g[i][j - 1] > 0 || j - 1 < 0) {
                      setGameOver(true);
                      return;
                    }
                    gridCopy[i][j - 1] = g[i][j] + 1;
                    if (g[i][j - 1] === -1) eatFood();
                    setHeadX(i);
                    setHeadY(j - 1);
                    break;
                  case DIRECTIONS.UP:
                    if (i - 1 < 0) {
                      setGameOver(true);
                      return;
                    }
                    if (g[i - 1][j] > 0) {
                      setGameOver(true);
                      return;
                    }
                    gridCopy[i - 1][j] = g[i][j] + 1;
                    if (g[i - 1][j] === -1) eatFood();
                    setHeadX(i - 1);
                    setHeadY(j);
                    break;
                  case DIRECTIONS.RIGHT:
                    if (g[i][j + 1] > 0 || j + 1 === gridSize) {
                      setGameOver(true);
                      return;
                    }
                    gridCopy[i][j + 1] = g[i][j] + 1;
                    if (g[i][j + 1] === -1) eatFood();
                    setHeadX(i);
                    setHeadY(j + 1);
                    break;
                  case DIRECTIONS.DOWN:
                    if (i + 1 > gridSize - 1) {
                      setGameOver(true);
                      return;
                    }
                    if (g[i + 1][j] > 0) {
                      setGameOver(true);
                      return;
                    }
                    gridCopy[i + 1][j] = g[i][j] + 1;
                    if (g[i + 1][j] === -1) eatFood();
                    setHeadX(i + 1);
                    setHeadY(j);
                    break;
                  default:
                    break;
                }
              }
            }
          }

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
    gameOver,
    snakeSpeed,
  ]);

  useEffect(() => {
    setStartingGrid();
  }, [setStartingGrid]);

  useEffect(() => {
    if (gameOver) clearInterval(moveInterval.current);
  }, [gameOver]);

  const restartGame = () => {
    setGameOver(false);
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
            snakeSpeed === DIFFICULY.EASY ? "selected" : ""
          }`}
          onClick={() => setSnakeSpeed(DIFFICULY.EASY)}
        >
          EASY
        </h3>
        <h3
          className={`difficulty-item ${
            snakeSpeed === DIFFICULY.MEDIUM ? "selected" : ""
          }`}
          onClick={() => setSnakeSpeed(DIFFICULY.MEDIUM)}
        >
          MEDIUM
        </h3>
        <h3
          c
          className={`difficulty-item ${
            snakeSpeed === DIFFICULY.HARD ? "selected" : ""
          }`}
          onClick={() => setSnakeSpeed(DIFFICULY.HARD)}
        >
          HARD
        </h3>
      </div>
    );
  };

  return (
    <div className="main">
      <div className="asd">
        <h3>SCORE: {score.current}</h3>
        <div className="grid-container">
          <div className="grid" style={{ opacity: gameOver ? 0.5 : 1 }}>
            {grid.map((row, i) =>
              row.map((col, j) => (
                <div key={`${i}.${j}`} className={getClass(grid[i][j])}>
                  {grid[i][j] === -1 &&
                    (snakeSpeed === DIFFICULY.HARD ? (
                      <img className="tractor" src={tractor} alt="" />
                    ) : (
                      <span
                        className="emoji"
                        aria-label="a rocket blasting off"
                        role="img"
                      >
                        🍎
                      </span>
                    ))}
                </div>
              ))
            )}
          </div>
        </div>
        {gameOver && (
          <div className="game-over">
            <h1>GAME OVER</h1>
            <h2 className="play-again" onClick={restartGame}>
              PLAY AGAIN
            </h2>
            {difficultyPicker()}
          </div>
        )}
      </div>
      )
    </div>
  );
};

export default App;
