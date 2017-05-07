var BOARD_SIZE = 7;
var AI_MODE = true;

var gameState = new function() {
	var self = this;
	this.isPlayersTurn = true;
	this.selectedCell = null;
	this.board = [];

	this.occupy = function(target, is2Jump) {
		var occupyingPlayer = self.selectedCell.state.owner;
		var opponent = (occupyingPlayer == 'P') ? 'C' : 'P';
		target.state.owner = occupyingPlayer;
		for (var row=0; row<self.board.length; row++) {
			for (var col=0; col<self.board[row].length; col++) {
				if (self.board[row][col].isOtherCellXAway(target.row, target.col, 1) && self.board[row][col].state.owner == opponent) {
					self.board[row][col].state.owner = occupyingPlayer;
					self.board[row][col].draw();
				}
			}
		}
		target.draw();
		self.selectedCell.state.highlighted = false;
		if (is2Jump) self.selectedCell.state.owner = null;
		self.selectedCell.draw();
		self.selectedCell = null;
		this.isPlayersTurn = !this.isPlayersTurn;
		if (AI_MODE && !this.isPlayersTurn) setTimeout(function() { doAITurn(this.board) }, 500);
	}
}

function Cell(node, row, col) {
	var self = this;
	this.state = {};
	this.row = row;
	this.col = col;

	this.isOtherCellXAway = function(otherRow, otherCol, x) {
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


	this.draw = function() {
		var colorClass = (function() {
			if (self.state.owner == 'P') {
				if (self.state.highlighted) return 'blue-selected'
				else return 'blue';
			} else if (self.state.owner == 'C') {
				if (self.state.highlighted) return 'red-selected'
				else return 'red';
			} else return "";
		}());
		node.className = "cell " + colorClass
	};

	this.giveToPlayer = function() {
		self.state.owner = 'P';
		this.draw();
	};
	this.giveToComputer = function() {
		self.state.owner = 'C';
		this.draw();
	};

	this.doClick = function(isHuman) {
		if (AI_MODE && !gameState.isPlayersTurn && isHuman) return;	// dont let the player be able to click red squares while computer is thinking
		if (gameState.selectedCell) {		// Something is highlighted
			if (self.state.highlighted) {				// Clicked the thing that is highlighted; unselect
				self.state.highlighted = false;
				gameState.selectedCell = null;
				self.draw();
			} else if (self.state.owner == gameState.selectedCell.state.owner) {	// Clicked another cell we own, highlight that instead
				gameState.selectedCell.state.highlighted = false;
				gameState.selectedCell.draw();
				gameState.selectedCell = self;
				self.state.highlighted = true;
				self.draw();
			} else if (self.state.owner == null) {	// Clicked an empty cell; can we move there?
				if (self.isOtherCellXAway(gameState.selectedCell.row, gameState.selectedCell.col, 1)) {
					gameState.occupy(self, false);
				} else if (self.isOtherCellXAway(gameState.selectedCell.row, gameState.selectedCell.col, 2)) {
					gameState.occupy(self, true);
				}
			} // else NOOP
		} else {
			var canClick = (function() {
				if (self.state.owner == 'P') return gameState.isPlayersTurn
				else if (self.state.owner == 'C') return !gameState.isPlayersTurn
			  	else return false
			}());
			if (!canClick) return; //NOOP
			self.state.highlighted = true;
			gameState.selectedCell = self;
			self.draw();
		}
	};

	// Construct
	(function() {
		self.state = {
			owner : null,
			highlighted : false
		};
		self.draw();
		node.onclick = function() { self.doClick(true) };
	}());
}

function getCell(row, col) {
	return document.getElementById("cell_" + row + "_" + col);
}

function reset() {
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

	gameState.board = [];
	for (var row=0; row < BOARD_SIZE; row++) {
		gameState.board[row] = [];
		for (var col=0; col < BOARD_SIZE; col++) {
			gameState.board[row][col] = new Cell(document.getElementById("cell_" + row + "_" + col), row, col);
		}
	}

	gameState.board[0][0].giveToPlayer();
	gameState.board[6][6].giveToPlayer();
	gameState.board[0][6].giveToComputer();
	gameState.board[6][0].giveToComputer();
}



function doAITurn(board) {
	console.log("AI Turn!")
}
