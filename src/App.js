import { useEffect, useState, useCallback, useRef } from "react";
import "./App.css";
import { produce } from "immer";
// import { throttle } from "lodash";

const App = () => {
  const DIRECTIONS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
  };

  const gridSize = 15;
  const snakeSpeed = 300;
  const [grid, setGrid] = useState(
    Array.from(Array(gridSize), () => new Array(gridSize).fill(0))
  );
  const [headStateX, setHeadX] = useState();
  const [headStateY, setHeadY] = useState();
  const headX = useRef();
  const headY = useRef();

  const [gameOver, setGameOver] = useState(false);
  const isGameOver = useRef(gameOver);

  const currentDirection = useRef(DIRECTIONS.RIGHT);

  const getInitialPosition = useCallback(() => {
    const startPositionX = Math.floor(Math.random() * gridSize);
    const startPositionY = Math.floor(Math.random() * gridSize);
    return { startPositionX, startPositionY };
  }, []);

  const [score, setScore] = useState(0);

  const setStartingGrid = useCallback(() => {
    setGrid((g) =>
      produce(g, (gridCopy) => {
        const { startPositionX, startPositionY } = getInitialPosition();
        const {
          startPositionX: foodStartX,
          startPositionY: foodStartY,
        } = getInitialPosition();
        console.log("start", startPositionX, startPositionY);
        gridCopy[startPositionX][startPositionY] = 1;
        gridCopy[foodStartX][foodStartY] = -1;
        setHeadX(startPositionX);
        setHeadY(startPositionY);
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
    isGameOver.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    headX.current = headStateX;
  }, [headStateX]);

  useEffect(() => {
    headY.current = headStateY;
  }, [headStateY]);

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
    console.log("asd");
    setScore((prevScore) => prevScore + 1);
    setGrid((g) => {
      return produce(g, (gridCopy) => {
        const {
          startPositionX: foodStartX,
          startPositionY: foodStartY,
        } = getInitialPosition();
        gridCopy[foodStartX][foodStartY] = -1;

        for (let i = 0; i < gridSize; i++)
          for (let j = 0; j < gridSize; j++) {
            if (g[i][j] > 0) gridCopy[i][j]++;
          }
      });
    });
  }, [getInitialPosition]);

  useEffect(() => {
    setInterval(() => {
      setGrid((g) => {
        return produce(g, (gridCopy) => {
          for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
              if (i === headX.current && j === headY.current) {
                switch (currentDirection.current) {
                  case DIRECTIONS.LEFT:
                    if (g[i][j - 1] > 0 || j - 1 < 0) setGameOver(true);
                    gridCopy[i][j - 1] = g[i][j] + 1;
                    if (g[i][j - 1] === -1) eatFood();
                    setHeadX(i);
                    setHeadY(j - 1);
                    break;
                  case DIRECTIONS.UP:
                    if (i - 1 < 0) {
                      setGameOver(true);
                      break;
                    }
                    if (g[i - 1][j] > 0) setGameOver(true);
                    gridCopy[i - 1][j] = g[i][j] + 1;
                    if (g[i - 1][j] === -1) eatFood();
                    setHeadX(i - 1);
                    setHeadY(j);
                    break;
                  case DIRECTIONS.RIGHT:
                    if (g[i][j + 1] > 0 || j + 1 === gridSize)
                      setGameOver(true);
                    gridCopy[i][j + 1] = g[i][j] + 1;
                    if (g[i][j + 1] === -1) eatFood();
                    setHeadX(i);
                    setHeadY(j + 1);
                    break;
                  case DIRECTIONS.DOWN:
                    if (i + 1 > gridSize - 1) {
                      setGameOver(true);
                      break;
                    }
                    if (g[i + 1][j] > 0) setGameOver(true);
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
  ]);

  useEffect(() => {
    setStartingGrid();
  }, [setStartingGrid]);

  const getClass = (value) => {
    if (value === 0) return "square";
    else if (value > 0) return "snake";
    else return "food";
  };

  return (
    <div className="main">
      {!gameOver ? (
        <div className="asd">
          <h3>SCORE: {score}</h3>
          <div className="grid">
            {grid.map((row, i) =>
              row.map((col, j) => (
                <div key={`${i}.${j}`} className={getClass(grid[i][j])} />
              ))
            )}
          </div>
          <button onClick={() => setScore((prev) => prev + 5)}>TEST</button>
          {/* <button onClick={() => (isPaused.current = true)}>Pause</button> */}
        </div>
      ) : (
        <h1>GAME OVER</h1>
      )}
    </div>
  );
};

export default App;
