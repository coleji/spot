var BOARD_SIZE = 7;
var AI_MODE = false;

var Global = {
	domNodes : [],
	board : [],
	highlightedCell : [],
	isPlayersTurn : true
};

var uiProcs = {
	paint: function() {
		Global.board.forEach(function(row, i) {
			row.forEach(function(owner, j) {
				Global.domNodes[i][j].className = "cell " + (function() {
					var color = (function() {
						switch(owner) {
						case 'P':
							return "blue";
						case 'C':
							return "red";
						default:
							return "";
						}
					}());
					if (Global.highlightedCell[0] == i && Global.highlightedCell[1] == j) return color + '-selected';
					else return color;
				}());
			})
		})
	},
	doClick : function(row, col, isHuman) {
		if (AI_MODE && isHuman && !Global.isPlayersTurn) return;	// Prevent player from clicking for the AI while thinking
		var makingAMove = false;
		if (Global.highlightedCell.length > 0) {
			// Something is highlighted
			if (Global.highlightedCell[0] == row && Global.highlightedCell[1] == col) {
				// Clicked the thing that is highlighted; unselect
				Global.highlightedCell = [];
			} else if (Global.board[row][col] == Global.board[Global.highlightedCell[0]][Global.highlightedCell[1]]) {
				// Clicked another cell we own, highlight that instead
				Global.highlightedCell = [row, col];
			} else if (null == Global.board[row][col]) {
				// Clicked an empty cell; can we move there?
				makingAMove = true;
				var newBoard = applyMove(Global.board, Global.highlightedCell[0], Global.highlightedCell[1], row, col);
				if (null == newBoard) return;
				else {
					Global.board = newBoard;
					Global.highlightedCell = [];
					Global.isPlayersTurn = !Global.isPlayersTurn;
				}
			}
		} else {
			// just selecting a cell
			var playerUp = (Global.isPlayersTurn ? 'P' : 'C')
			if (Global.board[row][col] != playerUp) return;
			Global.highlightedCell = [row, col];
		}
		uiProcs.paint();
		if (makingAMove && AI_MODE) {
			setTimeout(function() {
				var aiMoveObj = doAITurn();
				Global.board = aiMoveObj.newBoard
				Global.isPlayersTurn = true;
			}, 500)
		}
	},
	reset : function() {
		var boardNode = document.getElementById("board");
		var boardHTML = "<table><tbody>";
		for (var row=0; row < BOARD_SIZE; row++) {
			boardHTML += "<tr>";
			for (var col=0; col < BOARD_SIZE; col++) {
				boardHTML += "<td class='cell' id='cell_" + row + "_" + col + "'>&nbsp;</td>"
			}
			boardHTML += "</tr>";
		}
		boardHTML += "</tbody></table>";
		boardNode.innerHTML = boardHTML;

		for (var row=0; row < BOARD_SIZE; row++) {
			Global.domNodes[row] = [];
			Global.board[row] = [];
			for (var col=0; col < BOARD_SIZE; col++) {
				Global.domNodes[row][col] = document.getElementById("cell_" + row + "_" + col);
				Global.domNodes[row][col].onclick = (function(r, c) {
					// forcing r and c to exist only in this scope and therefore retain their values
					return function() { uiProcs.doClick(r, c, true); };
				}(row, col));
				Global.board[row][col] = null;
			}
		}

		Global.board[0][0] = 'P';
		Global.board[6][6] = 'P';
		Global.board[0][6] = 'C';
		Global.board[6][0] = 'C';
		Global.isPlayersTurn = true;
		uiProcs.paint();
	}
};


// pure function
// determine if two cells are x apart (i.e. is one cell on the edge of the square centered on the other cell, sides 2x+1 long)
function areCellsXApart(row, col, otherRow, otherCol, x) {
	var upRow = row-x;
	var downRow = row+x;
	var leftCol = col-x;
	var rightCol = col+x;
	return (
		(otherRow == upRow && otherCol == rightCol) || // top right corner
		(otherRow == upRow && otherCol == leftCol) || // top left corner
		(otherRow == downRow && otherCol == rightCol) || // bottom right corner
		(otherRow == downRow && otherCol == leftCol) || // bottom left corner
		(otherRow == upRow && otherCol < rightCol && otherCol > leftCol) || // top row
		(otherRow == downRow && otherCol < rightCol && otherCol > leftCol) || // bottom row
		(otherCol == leftCol && otherRow > upRow && otherRow < downRow) || // left side
		(otherCol == rightCol && otherRow > upRow && otherRow < downRow) // right side
	);
}

// pure function
// given an initial boardstate and a move, return the resulting boardstate
function applyMove(initialBoard, fromRow, fromCol, toRow, toCol) {
	if (initialBoard[toRow][toCol] != null) return null;  //cant move there; someone is already there

	var is1Away = areCellsXApart(fromRow, fromCol, toRow, toCol, 1);
	var is2Away = is1Away ? false : areCellsXApart(fromRow, fromCol, toRow, toCol, 2);
	if (!is1Away && !is2Away) return null; // invalid move

	var occupyingPlayer = initialBoard[fromRow][fromCol];
	var opponent = (occupyingPlayer == 'P') ? 'C' : 'P';
	return initialBoard.map(function(rowArr, row) {
		return rowArr.map(function(owner, col) {
			if (is2Away && row == fromRow && col == fromCol) return null;	// this is a jump, giving up my starting square
			else if (row == toRow && col == toCol) return occupyingPlayer;	// square I'm moving into
			else if (owner == opponent && areCellsXApart(toRow, toCol, row, col, 1)) return occupyingPlayer;	// surrounding opponent squares I'm taking
			else return owner;
		})
	})
}

// return an obj of {fromRow, fromCol, toRow, toCol, newBoard}
// so the calling function can slowly apply the move with step by step animations
function doAITurn() {
	console.log("AI Turn!")
	return {
		newBoard : Global.board
	};
}
