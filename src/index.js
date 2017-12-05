import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function Square(props) {
  return (
    <button className={"square " + (props.highlighted ? "highlighted" : "")} onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  renderSquare(i, isHighlightedSquare) {
    return (
      <Square
        key={i}
        value={this.props.squares[i]}
        onClick={() => this.props.onClick(i)}
        highlighted={isHighlightedSquare}
      />
    );
  }

  render() {
    return (
      <div className="board">
        {Array.from(Array(this.props.boardSize).keys()).map(i => {
          return (
            <div key={i} className="board-row">
              {Array.from(Array(this.props.boardSize).keys()).map(j => {
                const squareNumber = i * this.props.boardSize + j;
                const isHighlightedSquare = this.props.winningLine ? this.props.winningLine.includes(squareNumber): false;
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
      reverseMoveOrder: false,
      boardSize: 3
    };

    this.handleChange = this.handleChange.bind(this);
  }

  handleClick(i) {
    const current = this.state.history[this.state.stepNumber];
    const squares = current.squares.slice();
    if (calculateWinner(squares, this.state.boardSize) || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? 'X' : 'O';

    if (this.state.history.length <= this.state.stepNumber + 1 ||
        this.state.history[this.state.stepNumber + 1].squares[i] !== squares[i]) {
      // If this is a new step, concat
      // If this step overrides a previous move, clobber the old timeline
      // If the step is the same as it was previously, keep our history
      this.setState({
        history: this.state.history.slice(0, this.state.stepNumber + 1).concat([{
          squares: squares,
          col: i % this.state.boardSize,
          row: Math.floor(i / this.state.boardSize),
        }]),
      });
    }

    // Jump to the appropriate state
    this.jumpTo(this.state.stepNumber + 1);
  }

  handleChange(event) {
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

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0,
    });
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const isFirstMove = (this.state.stepNumber === 0);
    const isLastMove = (this.state.stepNumber === history.length - 1);

    const winner = calculateWinner(current.squares, this.state.boardSize);
    const boardIsFull = checkIfBoardIsFull(current.squares);

    let moves = history.map((step, move) => {
      const desc = move ?
        `Go to move #${move} (${step.col}, ${step.row})` :
        'Go to game start';
      return (
        <li key={move}>
          <button className={move === this.state.stepNumber ? "current-step" : ""}
                  onClick={() => this.jumpTo(move)}>
            {desc}
          </button>
        </li>
      );
    });

    if (this.state.reverseMoveOrder) {
      moves = moves.reverse();
    }

    let status;
    if (winner) {
      status = 'Winner: ' + winner.winner;
    } else if (boardIsFull) {
      status = 'Tie game';
    } else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
    }

    return (
      <div className="game">
        <div className="board-size-selector">
          <label htmlFor="board-size">Board size</label>
          <input type="number" name="board-size"
                 min="3" max="9" value={this.state.boardSize}
                 onChange={this.handleChange}
          />
        </div>
        <Board
          squares={current.squares}
          boardSize={this.state.boardSize}
          winningLine={winner ? winner.winningLine : null}
          onClick={(i) => this.handleClick(i)}
        />
        <div className="game-status">{status}</div>
        <div className="move-shift-buttons">
          <button className="prev-move" disabled={isFirstMove}
                  onClick={() => this.jumpTo(this.state.stepNumber - 1)}
          ></button>
          <button className="next-move" disabled={isLastMove}
                  onClick={() => this.jumpTo(this.state.stepNumber + 1)}
          ></button>
        </div>
        <ol className="game-moves">{moves}</ol>
        <label htmlFor="move-order-toggle">Reverse display order: </label>
        <input type="checkbox" name="move-order-toggle"
               onClick={() => this.setState({reverseMoveOrder: !this.state.reverseMoveOrder})}/>
        <p className="footer-text">Button icons made by <a href="https://www.flaticon.com/authors/lyolya">Lyolya</a> from <a href="www.flaticon.com">www.flaticon.com</a></p>
        <p className="footer-text">Web app tested in latest Chrome and FireFox for Linux Mint 18.2</p>
      </div>
    );
  }
}

function calculateWinner(squares, boardSize) {
  const lines = [];

  // push rows and cols
  for (let i = 0; i < boardSize; i++) {
    lines.push(Array.from(Array(boardSize).keys()).map(val => val + boardSize * i));
    lines.push(Array.from(Array(boardSize).keys()).map(val => val * boardSize + i));
  }

  // The diagonals have convenient formulas
  lines.push(Array.from(Array(boardSize).keys()).map(val => val * (boardSize + 1))); // Push first diagonal
  lines.push(Array.from(Array(boardSize).keys()).map(val => (val + 1) * (boardSize - 1))); // Push second diagonal


  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let isWinningLine = true;
    const squareController = squares[line[0]];
    if (!squareController) {
      continue; // Skip if first square not taken
    }
    for (let j = 1; j < line.length; j++) {
      if (squares[line[j]] !== squareController) {
        isWinningLine = false;
        break;
      }
    }
    if (isWinningLine) { // Whole line was controlled by one player
      return {
        winner: squareController,
        winningLine: line
      }
    }
  }
  return null;
}

function checkIfBoardIsFull(squares) {
  for (let i = 0; i < squares.length; i++) {
    if (!squares[i]) {
      return false;
    }
  }
  return true;
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);
