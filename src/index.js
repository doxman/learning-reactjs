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
      <div>
        {[0,1,2].map(i => {
          return (
            <div key={i} className="board-row">
              {[0,1,2].map(j => {
                const squareNumber = i * 3 + j;
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
      reverseMoveOrder: false
    };
  }

  handleClick(i) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? 'X' : 'O';
    this.setState({
      history: history.concat([{
        squares: squares,
        col: i % 3,
        row: Math.floor(i / 3),
      }]),
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext
    });
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
    const winner = calculateWinner(current.squares);
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
        <div className="game-board">
          <Board
            squares={current.squares}
            winningLine={winner ? winner.winningLine : null}
            onClick={(i) => this.handleClick(i)}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <ol>{moves}</ol>
          <label htmlFor="move-order-toggle">Reverse display order: </label>
          <input type="checkbox" name="move-order-toggle"
                 onClick={() => this.setState({reverseMoveOrder: !this.state.reverseMoveOrder})}/>
        </div>
      </div>
    );
  }
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return {
        winner: squares[a],
        winningLine: lines[i]
      };
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
