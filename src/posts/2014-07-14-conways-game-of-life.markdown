---
layout: post.html
title:  "Conway's Game of Life"
date:   2014-07-14
tags: JavaScript Programming
summary: "As I [mentioned previously](/12-07-2014-jsoxford-code-retreat/), last week at the JSOxford Code Retreat we spent a lot of time (all the time) developing [Conway's Game of Life](http://en.wikipedia.org/wiki/Conway's_Game_of_Life) in various ways. As the code retreat was focusing on different coding methods and perfecting code rather than producing something that works I never got a fully working version. So last night I sat down and got to it!"

---

As I [mentioned previously](/12-07-2014-jsoxford-code-retreat/), last week at the JSOxford Code Retreat we spent a lot of time (all the time) developing [Conway's Game of Life](http://en.wikipedia.org/wiki/Conway's_Game_of_Life) in various ways. As the code retreat was focusing on different coding methods and perfecting code rather than producing something that works I never got a fully working version. So last night I sat down and got to it!

# About

Conway's Game of Life is a 0-player turn based simulation of life. The "game" follows some simple rules to update its cells on a board, crudely imitation evolution and life.

# Rules

The rules of the game are as follows:

<blockquote markdown="1">

* Any live cell with fewer than two live neighbours dies, as if caused by under-population.

* Any live cell with two or three live neighbours lives on to the next generation.

* Any live cell with more than three live neighbours dies, as if by overcrowding.

* Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.

<cite>Wikipedia - http://en.wikipedia.org/wiki/Conway's_Game_of_Life</cite>
</blockquote>

# Approach

As we learnt last week, there are two ways to go about storing the game data (the state of the cells). The simple, and possibly naïve, way is to store a 2 dimensional array containing the state of every cell on the game board. The other is to only store a collection of live cells with their X and Y locations.

## 2D array

Storing the cell data in a two dimensional array is pretty simple.

<pre><code class="javascript">
var gameBoard = [
	[true, false, false, true, false],
	[true, false, false, true, false],
	[true, false, false, true, false],
	[true, false, false, true, false],
	[true, false, false, true, false]
];
</code></pre>

The key thing to remember when approaching it this way is that the game board array must be cloned first before updating the cells. This is because all cells must be updated simultaneously so looping over and updating cell-by-cell would cause incorrect updating as you go through.

While this is the simplest approach, and the way we attempted when writing it out on paper, it doesn't scale very well. As the game is supposed to be infinite in size the array could very easily get too large for memory and cause the game to crash. This can be avoided by limiting the array to bounding dimensions.

## Collection of Live Cells

The more scalable approach involves only storing the positions of the live cells. As all rules are based around the presence of live cells, the next iteration of cells can be calculated from this list.

<pre><code class="javascript">
var gameBoard = [
	{ x: 3, y: 5},
	{ x: 8, y: 2},
	{ x: 13, y: 5},
	{ x: 5, y: 9},
	{ x: 9, y: 10}
];
</code></pre>

This is the approach I used last night. I have struggled on effectively calculating new cells to be "born", having resulted in iterating over all cells, checking if they are dead and then counting their live neighbours. This obviously goes against the infinite game board idea so if anyone has some suggestions on how to improve it you can <a href="https://twitter.com/intent/tweet?screen_name=Marcus_Noble_" class="twitter-contact-link" data-related="Marcus_Noble_" data-dnt="true" target="_blank"><i class="icon-twitter"></i>Tweet @Marcus\_Noble_</a> or fork my [gist](https://gist.github.com/AverageMarcus/f5e34825ef89e11443be).

# Final Code

<figure class="center" markdown="1">
<a href="{{ site.url }}/Conways-Game-Of-Life" target="_blank">
  <img src="{{site.url}}/images/conways-game-of-life.PNG" alt="Conway's Game of Life">
</a>
<figcaption>They LIVE!!!</figcaption>
</figure>

<pre><code class="javascript">
var cells = [];
var boardWidth = 20;
var boardHeight = 20;
var intervalID;

function init(){
	var cell = $('<div/>').addClass('cell');
	var row = $('<div/>').addClass('row');
	var board = $('#gameBoard');
	var currentRow, i, j, newCell;

	$('#gameBoard').empty().on('click', function(){
		clearInterval(intervalID);
		init();
	});
	cells = [];

	for(i=0;i<boardHeight;i++){
		currentRow = row.clone();
		board.append(currentRow);
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
	$('.cell').css('background','white');
	for(var i=0; i<cells.length;i++){
		$($($('.row').get(cells[i].y-1)).find('.cell').get(cells[i].x-1)).css('background', 'black');
	}
}

function tick(){
	var neighbourCount = 0;
	var nextIteration = [];
	var deadCell, i, j;

	// All cells are dead, lets restart
	if(cells.length === 0){
		clearInterval(intervalID);
		setTimeout(function(){
			init();
		}, 5000);
		return;
	}

	for(i=0; i<cells.length;i++){
		neighbourCount = countNeighbours(cells[i]);
		if(neighbourCount >= 2 && neighbourCount <= 3){
			nextIteration.push(cells[i]);
		}
	}
	for(i=1;i<=boardHeight;i++){
		for(j=1;j<=boardWidth;j++){
			deadCell = {x:j,y:i};
			if(!isAlive(deadCell) && countNeighbours(deadCell) === 3){
				nextIteration.push(deadCell);
			}
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
</code></pre>


You can check out the [final version](/Conways-Game-Of-Life) or take a look at the [gist](https://gist.github.com/AverageMarcus/f5e34825ef89e11443be).

As always, if you have any comments <a href="https://twitter.com/intent/tweet?screen_name=Marcus_Noble_" class="twitter-contact-link" data-related="Marcus_Noble_" data-dnt="true" target="_blank"><i class="icon-twitter"></i>Tweet @Marcus\_Noble_</a>.

# Updated 2014-07-22

With a little help from [@danielthepope](https://twitter.com/danielthepope/) I have improved the code slightly to remove the fixed universe problem. Cells are now born based on live cells instead of iterating over the game board.

<pre><code class="javascript">
var cells = [];
var boardWidth = 20;
var boardHeight = 20;
var $board = $('#gameBoard');
var intervalID;

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
		init();
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
</code></pre>
