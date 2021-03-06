---
layout: page.html
title: "Conways Game Of Life"
---
<style type="text/css">
	* {
		box-sizing:border;
	}
	body{
		text-align:center;
	}
	#gameBoard {
		margin: 0 auto;
		border:2px solid #ccc;
		line-height:10px;
		display:table;
	}

	.cell {
		width:10px;
		height:10px;
		display:inline-block;
		border:1px solid #ccc;
	}

	.row {
		display:block;
		margin:0;
	}
</style>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<div id="gameBoard"></div>
<p>
	Read my blog post regarding <a href="/2014-07-14-conway-s-game-of-life/">Conway's Game of Life</a>
</p>

<script type="text/javascript">
(function(){
	var cells = [];
	var boardWidth = 20;
	var boardHeight = 20;
	var $board = $('#gameBoard');
	var intervalID;
	var gameOverBoard = [
		{x:2,y:4},
		{x:2,y:5},
		{x:2,y:6},
		{x:3,y:3},
		{x:4,y:3},
		{x:3,y:7},
		{x:4,y:7},
		{x:4,y:5},
		{x:5,y:5},
		{x:5,y:6},
		{x:7,y:4},
		{x:7,y:5},
		{x:7,y:6},
		{x:7,y:7},
		{x:8,y:3},
		{x:9,y:3},
		{x:8,y:5},
		{x:9,y:5},
		{x:10,y:4},
		{x:10,y:5},
		{x:10,y:6},
		{x:10,y:7},
		{x:12,y:4},
		{x:12,y:5},
		{x:12,y:6},
		{x:12,y:7},
		{x:13,y:3},
		{x:14,y:4},
		{x:15,y:3},
		{x:16,y:4},
		{x:16,y:5},
		{x:16,y:6},
		{x:16,y:7},
		{x:18,y:3},
		{x:18,y:4},
		{x:18,y:5},
		{x:18,y:6},
		{x:18,y:7},
		{x:19,y:3},
		{x:19,y:5},
		{x:19,y:7},
		{x:3,y:9},
		{x:4,y:9},
		{x:2,y:10},
		{x:2,y:11},
		{x:2,y:12},
		{x:3,y:13},
		{x:4,y:13},
		{x:5,y:10},
		{x:5,y:11},
		{x:5,y:12},
		{x:7,y:9},
		{x:7,y:10},
		{x:8,y:11},
		{x:8,y:12},
		{x:9,y:13},
		{x:10,y:12},
		{x:10,y:11},
		{x:11,y:10},
		{x:11,y:9},
		{x:13,y:9},
		{x:13,y:10},
		{x:13,y:11},
		{x:13,y:12},
		{x:13,y:13},
		{x:14,y:9},
		{x:14,y:11},
		{x:14,y:13},
		{x:16,y:9},
		{x:16,y:10},
		{x:16,y:11},
		{x:16,y:12},
		{x:16,y:13},
		{x:17,y:9},
		{x:17,y:11},
		{x:18,y:9},
		{x:18,y:11},
		{x:18,y:12},
		{x:19,y:10},
		{x:19,y:13}
	];

	function init(){
		var cell = $('<div/>').addClass('cell');
		var row = $('<div/>').addClass('row');
		var currentRow, i, j, newCell;

		$('#gameBoard').empty().on('click', function(){
			clearInterval(intervalID);
			init();
		});
		cells = [];

		for(i=0;i<boardHeight;i++){
			currentRow = row.clone();
			$board.append(currentRow);
			for(j=0;j<boardHeight;j++){
				currentRow.append(cell.clone());
			}
		}

		for(i=0;i<50;i++){
			newCell = {
				x: (Math.floor(Math.random() * (boardWidth - 1) + 1)),
				y: (Math.floor(Math.random() * (boardHeight - 1) + 1))
			};
			cells.push(newCell)
		}

		render();

		intervalID = setInterval(function(){
			tick();
		}, 1000);
	}

	function render(){
		$board.find('.cell').css('background','white');
		for(var i=0; i<cells.length;i++){
			$($($('.row').get(cells[i].y-1)).find('.cell').get(cells[i].x-1)).css('background', 'black');
		}
	}

	function tick(){
		var neighbourCount = 0;
		var nextIteration = [];
		var candidates = [];
		var neighbours, i, j,
			cellX, cellY,
			cellLength, neighbourLength, candidateLength;

		// All cells are dead, lets restart
		if(cells.length === 0){
			clearInterval(intervalID);
			//Game over, restart in 5sec
			cells = gameOverBoard;
			render();
			setTimeout(function(){
				init();
			}, 5000);
			return;
		}

		for(i=0, cellLength=cells.length; i<cellLength; i++){
			neighbourCount = countNeighbours(cells[i]);
			if(neighbourCount >= 2 && neighbourCount <= 3){
				nextIteration.push(cells[i]);
			}
			// For each cell that is alive, find its neighbours
			cellX = cells[i].x;
			cellY = cells[i].y;
			neighbours = [];
			neighbours.push({x:(cellX-1),y:(cellY-1)});
			neighbours.push({x:(cellX-1),y:cellY});
			neighbours.push({x:(cellX-1),y:(cellY+1)});
			neighbours.push({x:cellX,y:(cellY-1)});
			neighbours.push({x:cellX,y:(cellY+1)});
			neighbours.push({x:(cellX+1),y:(cellY-1)});
			neighbours.push({x:(cellX+1),y:cellY});
			neighbours.push({x:(cellX+1),y:(cellY+1)});
			for(j=0, neighbourLength=neighbours.length; j<neighbourLength; j++){
				// Keep the neighbour cells if they are dead
				// We don't want to keep multiple copies of the neighbour cell
				if(!isAlive(neighbours[j]) && candidates.filter(function(currentCell){
					return (currentCell.x === neighbours[j].x && currentCell.y == neighbours[j].y);
				}).length === 0) {
					candidates.push(neighbours[j]);
				}
			}
		}
		// Now we have a list of dead neighbours of at least 1 live neighbour (candidates)
		// Bring the cell to life if we find that each neighbour has 3 other live neighbouring cells
		for(i=0, candidateLength=candidates.length; i<candidateLength; i++){
			if(countNeighbours(candidates[i]) === 3){
				nextIteration.push(candidates[i]);
			}
		}
		cells = nextIteration;
		render();
	}

	function isAlive(cell){
		return (cells.filter(function(currentCell){
			return (currentCell.x === cell.x && currentCell.y === cell.y);
		}).length > 0);
	}

	function countNeighbours(cell){
		var x1 = cell.x-1,
			x2 = cell.x+1,
			y1 = cell.y-1,
			y2 = cell.y+1;

		var neighbours = cells.filter(function(possibleNeighbour){
			if(possibleNeighbour.x === cell.x && possibleNeighbour.y === cell.y){
				return false;
			}
			return (possibleNeighbour.x >= x1 && possibleNeighbour.x <= x2 && possibleNeighbour.y >= y1 && possibleNeighbour.y <= y2);
		});
		return neighbours.length;
	}

	init();
}());
</script>
