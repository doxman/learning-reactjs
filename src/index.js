import React from 'react';
import ReactDOM from 'react-dom';
import * as shortid from 'shortid';
import './index.css';

function Square(props) {
  return (
    <button className={"tictactoe-square tictactoe-no-outline tictactoe-no-select " + (props.highlighted ? "tictactoe-highlighted" : "")}
            onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  renderSquare(i, isHighlightedSquare) {
    const squareID = shortid.generate();

    return (
      <Square
        key={squareID}
        id={squareID}
        value={this.props.squares[i]}
        onClick={this.props.onClick.bind(this, i)}
        highlighted={isHighlightedSquare}
      />
    );
  }

  render() {
    const boardSize = this.props.boardSize;
    const winningSquares = this.props.winningSquares;
    const lineNumbers = Array.from(Array(boardSize).keys());

    // For boardSize N, render N rows of N squares
    return (
      <div className="tictactoe-board tictactoe-centered tictactoe-flex-container tictactoe-bottom-gap-normal">
        {lineNumbers.map(i => {
          const rowID = shortid.generate();

          return (
            <div key={rowID} className="tictactoe-flex-container">
              {lineNumbers.map(j => {
                const squareNumber = i * boardSize + j;
                const isHighlightedSquare = winningSquares ? winningSquares.includes(squareNumber): false; // Highlight winning lines

                return this.renderSquare(squareNumber, isHighlightedSquare);
              })}
            </div>
          );
        })}
      </div>
    );
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [{
        squares: Array(9).fill(null),
      }],
      stepNumber: 0,
      xIsNext: true,
      boardSize: 3
    };
  }

  _checkIfBoardIsFull(squares) {
    for (let i = 0; i < squares.length; i++) {
      if (!squares[i]) { // Square is empty
        return false;
      }
    }
    return true;
  }

  _calculateWinner(squares) {
    const lines = [];
    const boardSize = this.state.boardSize;
    const lineNumbers = Array.from(Array(boardSize).keys());

    let winner = null;
    let winningSquares = [];

    // Push rows and cols
    for (let i = 0; i < boardSize; i++) {
      lines.push(lineNumbers.map(val => val + boardSize * i));
      lines.push(lineNumbers.map(val => val * boardSize + i));
    }

    // The diagonals have convenient formulas
    lines.push(lineNumbers.map(val => val * (boardSize + 1))); // Push first diagonal
    lines.push(lineNumbers.map(val => (val + 1) * (boardSize - 1))); // Push second diagonal


    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const squareController = squares[line[0]];
      if (!squareController || (winner != null && squareController !== winner)) {
        continue; // Skip if first square not taken, or if it doesn't match some other winning line
      }

      // This is a winning line if all the other squares are controlled by the same player as the first
      let isWinningLine = true;
      for (let j = 1; j < line.length; j++) {
        if (squares[line[j]] !== squareController) {
          isWinningLine = false;
          break;
        }
      }
      if (isWinningLine) {
        winner = squareController;
        winningSquares = winningSquares.concat(line);
      }
    }

    if (!winner) {
      return null;
    }

    winningSquares = [...new Set(winningSquares)]; // Easy way to remove duplicates

    return winner != null ? { winner: winner, winningSquares: winningSquares } : null;
  }

  _jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0,
    });
  }

  handleBoardClick(i) {
    const history = this.state.history;
    const stepNumber = this.state.stepNumber;
    const boardSize = this.state.boardSize;

    const currentSquares = history[stepNumber].squares.slice();

    // Ignore the click if the game was already won or the square was already taken
    if (this._calculateWinner(currentSquares) || currentSquares[i]) {
      return;
    }
    currentSquares[i] = this.state.xIsNext ? 'X' : 'O';

    if (history.length <= stepNumber + 1 ||
        history[stepNumber + 1].squares[i] !== currentSquares[i]) {
      // If this click is a new step, concat it to all previous steps
      // Else, this step will overwrite any previous history after this point
      // However, if the step was the same as the history, we don't overwrite
      this.setState({
        history: history.slice(0, stepNumber + 1).concat([{
          squares: currentSquares,
          col: i % boardSize,
          row: Math.floor(i / boardSize),
        }]),
      });
    }

    // Jump to the appropriate state
    this._jumpTo(stepNumber + 1);
  }

  handleBoardSizeChange(event) {
    let newSize = event.target.value;

    if (isNaN(newSize) || newSize.length !== 1) { // Validation
      return;
    }

    newSize = parseInt(newSize, 10);

    // Validation part 2
    if (newSize < 3) {
      newSize = 3;
    } else if (newSize > 9) {
      newSize = 9;
    }


    const boardSize = this.state.boardSize;
    if (boardSize !== newSize) {
      this.setState({
        history: [{
          squares: Array(newSize * newSize).fill(null),
        }],
        stepNumber: 0,
        xIsNext: true,
        boardSize: newSize
      });
    }
  }

  render() {
    const history = this.state.history;
    const stepNumber = this.state.stepNumber;
    const boardSize = this.state.boardSize;

    const currentSquares = history[stepNumber].squares;

    const isFirstMove = (stepNumber === 0);
    const isLastMove = (stepNumber === history.length - 1);

    const winner = this._calculateWinner(currentSquares);
    const boardIsFull = this._checkIfBoardIsFull(currentSquares);

    // UI for all moves except the first, for which there is a separate UI element
    let moves = history
      .slice(1)
      .reduce((acc, val, ind, arr) => {
        if (ind % 2 === 0) {
          acc.push(arr.slice(ind, ind + 2));
        }
        return acc;
      }, [])
      .map((stepPair, idx) => {
        const firstMove = idx * 2 + 1;
        const secondMove = firstMove + 1;

        const movePairID = shortid.generate();

        return (
          <li key={movePairID} className={"tictactoe-move-pair tictactoe-flex-container tictactoe-bottom-gap-small " + (idx < 9 ? "tictactoe-single-digit-pair" : "")}>
            <div className="left-indented-btn">
              <button className={firstMove === stepNumber ? "tictactoe-current-step" : ""}
                      onClick={() => this._jumpTo(firstMove)}>
                {`(${stepPair[0].col}, ${stepPair[0].row})`}
              </button>
            </div>
            {stepPair.length > 1 &&
              <div className="tictactoe-left-indented-btn tictactoe-right-move-column">
                <button className={secondMove === stepNumber ? "tictactoe-current-step" : ""}
                        onClick={() => this._jumpTo(secondMove)}>
                  {`(${stepPair[1].col}, ${stepPair[1].row})`}
                </button>
              </div>
            }
          </li>
        );
    });

    let status = {};
    if (winner) {
      status.txt = 'Winner: ' + winner.winner;
      status.bg = 'win';
    } else if (boardIsFull) {
      status.txt = 'Tie game';
      status.bg = 'tie';
    } else {
      status.txt = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
    }

    return (
      <div>
        <div className="tictactoe-centered tictactoe-bottom-gap-large">
          <label htmlFor="tictactoe-board-size" className="tictactoe-text-component tictactoe-centered tictactoe-bottom-gap-small tictactoe-no-select">Board size</label>
          <input className="tictactoe-text-component tictactoe-centered tictactoe-rounded-input tictactoe-no-outline" type="number" name="tictactoe-board-size"
                 min="3" max="9" value={boardSize}
                 onChange={this.handleBoardSizeChange.bind(this)}
          />
        </div>
        <Board
          squares={currentSquares}
          boardSize={boardSize}
          winningSquares={winner ? winner.winningSquares : null}
          onClick={this.handleBoardClick.bind(this)}
        />
        <div className={"tictactoe-game-status tictactoe-centered tictactoe-text-component tictactoe-bottom-gap-normal tictactoe-no-select " + (status.bg != null ? `tictactoe-${status.bg}-status` : "")}>{status.txt}</div>
        <div className="tictactoe-centered tictactoe-bottom-gap-large">
          <button className="tictactoe-move-shift-btn tictactoe-left-indented-btn tictactoe-rounded-input tictactoe-no-outline tictactoe-prev"
                  disabled={isFirstMove}
                  onClick={() => this._jumpTo(stepNumber - 1)}
          ></button>
          <button className="tictactoe-move-shift-btn tictactoe-left-indented-btn tictactoe-rounded-input tictactoe-no-outline tictactoe-next"
                  disabled={isLastMove}
                  onClick={() => this._jumpTo(stepNumber + 1)}
          ></button>
        </div>
        {moves.length > 0 &&
          <div>
            <button className={"tictactoe-centered tictactoe-text-component tictactoe-bottom-gap-normal tictactoe-no-select " + (0 === stepNumber ? "tictactoe-current-step" : "")}
                    onClick={() => this._jumpTo(0)}>Start</button>
            <ol className="tictactoe-game-moves tictactoe-centered tictactoe-text-component tictactoe-no-select">{moves}</ol>
          </div>
        }
        <p className="tictactoe-footer-text tictactoe-centered tictactoe-no-select">Button icons made by <a href="https://www.flaticon.com/authors/lyolya">Lyolya</a> from <a href="https://www.flaticon.com">www.flaticon.com</a>
        </p>
        <p className="tictactoe-footer-text tictactoe-centered tictactoe-no-select">Web app tested in latest Chrome and FireFox for Linux Mint 18.2</p>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);
