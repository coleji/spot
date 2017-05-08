var BOARD_SIZE = 7;
var AI_MODE = true;
var AI_PAIR_DEPTH = 4;

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
		});
		document.getElementById("score").innerHTML = (function() {
			var scores = getScores(Global.board);
			return "<table cellpadding=5><tbody><tr><td>Dockstaff:</td><td>" + scores.P + "</td><td></td><td>Database:</td><td>" + scores.C +"</td></tr></tbody></table>";
		}());
	},
	doClick : function(row, col, isHuman) {
		if (AI_MODE && isHuman && !Global.isPlayersTurn) return;	// Prevent player from clicking for the AI while thinking
		var makingAMove = false;
		var activePlayer = (Global.isPlayersTurn ? 'P' : 'C')
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
				var newBoard = applyMove(activePlayer, Global.board, Global.highlightedCell[0], Global.highlightedCell[1], row, col);
				if (null == newBoard) return;
				else {
					Global.board = newBoard;
					Global.highlightedCell = [];
					Global.isPlayersTurn = !Global.isPlayersTurn;
				}
			}
		} else {
			// just selecting a cell
			if (Global.board[row][col] != activePlayer) return;
			Global.highlightedCell = [row, col];
		}
		uiProcs.paint();
		if (makingAMove && AI_MODE) {
			setTimeout(function() {
				var aiMoveObj = doAITurn();
				Global.board = aiMoveObj.newBoard
				Global.isPlayersTurn = true;
				uiProcs.paint();
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
		boardHTML += "</tbody></table><div id=score></div>";
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
function applyMove(player, initialBoard, fromRow, fromCol, toRow, toCol) {
	if (initialBoard[fromRow][fromCol] != player) return null;  //cant move that; it's not mine
	if (initialBoard[toRow][toCol] != null) return null;  //cant move there; someone is already there

	var is1Away = areCellsXApart(fromRow, fromCol, toRow, toCol, 1);
	var is2Away = is1Away ? false : areCellsXApart(fromRow, fromCol, toRow, toCol, 2);
	if (!is1Away && !is2Away) return null; // invalid move (too far away)

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

function getScores(board) {
	return board.reduce(function(agg, rowArr) {
		var rowAgg = rowArr.reduce(function(rowAgg, owner) {
			rowAgg[owner] = (rowAgg[owner] || 0) + 1
			return rowAgg
		}, {});
		for (var player in rowAgg) {
			agg[player] = (agg[player] || 0) + rowAgg[player];
		}
		return agg;
	}, {});
}

// return an obj of {fromRow, fromCol, toRow, toCol, newBoard}
// (i.e. not just the new board)
// so the calling function can slowly apply the move with step by step animations
function doAITurn() {
	// Number of forPlayer's pieces, minus number of opponent's
	function rankBoard(board, forPlayer) {
		var scores = getScores(board);
		var result = 0;
		for (var player in scores) {
			if (player == forPlayer) result += scores[player];
			else result -= scores[player]
		}
		return result;
	}
	// input is an array of {fromRow, fromCol, toRow, toCol, newBoard}
	function getBestBoard(boardObjs, player) {
		return boardObjs.reduce(function(best, boardObj) {
			if (null == best) return Object.assign(boardObj, {score: rankBoard(boardObj.newBoard, player)});
			else {
				var newScore = rankBoard(boardObj.newBoard, player);
				if (newScore > best.score) return Object.assign(boardObj, {score: newScore});
				else return best;
			}
		}, null);
	}

	function getAllMoves(initialBoard, player) {
		var moveList = [];
		for (var fromRow=0; fromRow < initialBoard.length; fromRow++) {
			for (var fromCol=0; fromCol < initialBoard[fromRow].length; fromCol++) {
				for (var toRow=0; toRow < initialBoard.length; toRow++) {
					for (var toCol=0; toCol < initialBoard[toRow].length; toCol++) {
						var newBoard = applyMove(player, initialBoard, fromRow, fromCol, toRow, toCol);
						if (null != newBoard) moveList.push({
							fromRow : fromRow,
							fromCol : fromCol,
							toRow : toRow,
							toCol : toCol,
							newBoard : newBoard,
							score : rankBoard(newBoard, player)
						})
					}
				}
			}
		}
		return moveList;
	}

	// The smallest meaningful decision tree is me - opp - me.
	// Make a list of all my moves from initialBoard,
	// then for each one assume the opponent will make the best single move for him
	// i.e. assume the opponent will make the move that results in the best boardScore of the board right after he moves
	// Then get the best score from all our moves based on his presumptive move
	// Finally take the best first move that results in the best score after out opponents presumed move and our calculated followup
	function getBestSingleMove(initialBoard, player) {
		var initialMoves = getAllMoves(initialBoard, player);
		var opponent = (player == 'C') ? 'P' : 'C';
		initialMoves.forEach(function(move) {
			move.nextMove = getBestBoard(getAllMoves(move.newBoard, opponent));
			move.mySecondMove = getBestBoard(getAllMoves(move.nextMove.newBoard, player));
		});
		return initialMoves.reduce(function(best, move) {
			if (best == null) return move;
			else return (move.mySecondMove.score > best.mySecondMove.score) ? move : best;
		}, null);
	}

	return getBestSingleMove(Global.board, 'C')
}
