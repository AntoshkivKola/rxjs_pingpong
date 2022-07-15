import {
    fromEvent,
    interval,
    merge,

    Subscription
} from "rxjs";
import { filter,  switchMap, takeUntil,  tap, } from "rxjs/operators";

let isGameStarted = false;
const ANIMATION_SPEED = 25;

const RACKET_SPEED = 10;
let playerOnePosition = 0;
let playerOneScore = 0;
let playerTwoPosition = 0;
let playerTwoScore = 0;

const BALL_SPEED = 20;
let ball_positionX = 0;
let ball_positionY = 0;

const RACKET_HEIGHT = 200;
const MAX_TOP_POSITION = 240;
const MAX_BOTTOM_POSITION = -240;
const MAX_LEFT_POSITION = -890;
const MAX_RIGHT_POSITION = 890;
const MAX_BALL_TOP_POSITION = -330;
const MAX_BALL_BOTTOM_POSITION = 330;
const POSITION_PLAYER_TWO = 865;
const POSITION_PLAYER_ONE = -865;

let timerSubscription: Subscription;
let playersMovesSubscription: Subscription;

const playerOneRacket = document.querySelector('.player-1') as HTMLDivElement;
const playerTwoRacket = document.querySelector('.player-2') as HTMLDivElement;
const playerOneScoreContainer = document.querySelector('.player-1-score') as HTMLDivElement;
const playerTwoScoreContainer = document.querySelector('.player-2-score') as HTMLDivElement;
const ball = document.querySelector('.ball') as HTMLDivElement;
const startButton = document.querySelector('.start-button') as HTMLButtonElement;


enum keysPlayerOne {
    upButton = 'w',
    downButton ='s'
}

enum keysPlayerTwo {
    upButton= 'ArrowUp',
    downButton ='ArrowDown'
}



function getBallStartDirection () {
    const isLeft = Math.random() > 0.5;
    const isTop = Math.random() > 0.5;

    const directionX = Math.round(Math.random() * BALL_SPEED);
    const directionY = BALL_SPEED - directionX;

    return {
        left: isLeft ? directionX : directionX  * -1,
        top: isTop ? directionY : directionY  * -1
    }
}
const startBallDirection = getBallStartDirection();
console.log(startBallDirection)

type typeDirection = {
    left: number;
    top: number;
}

function moveBall(ball: HTMLDivElement, direction: typeDirection) {
    ball.style.left = `${ball_positionX += direction.left}px`
    ball.style.top = `${ball_positionY += direction.top}px`
}


const timer$ = interval(ANIMATION_SPEED).pipe(
    tap((v) => {
        moveBall(ball, calculateBallCollision())
    })
);

function setPositionToDefaults() {
    ball_positionY = 0;
    ball_positionX = 0;
    playerOnePosition = 0;
    playerTwoPosition = 0;

    ball.style.left = '0px';
    ball.style.top = '0px';

    playerOneRacket.style.top = '0px';

    playerTwoRacket.style.top = '0px';
}

function calculateBallCollision () {
    const calculatedDirection = startBallDirection;
    if(ball_positionY >= MAX_BALL_BOTTOM_POSITION || ball_positionY <= MAX_BALL_TOP_POSITION) {
        calculatedDirection.top = -startBallDirection.top;
    }

    if (ball_positionX >= POSITION_PLAYER_TWO &&
        ball_positionX <= MAX_RIGHT_POSITION) {

        if ((ball_positionY <= (playerTwoPosition + RACKET_HEIGHT / 2)) &&
            (ball_positionY >= (playerTwoPosition + RACKET_HEIGHT / -2)) ) {
            calculatedDirection.left = -startBallDirection.left
        } else {
            gameOver(++playerOneScore);
            playerOneScoreContainer.innerHTML = `${playerOneScore}`
        }
    }

    if (ball_positionX <= POSITION_PLAYER_ONE &&
        ball_positionX >= MAX_LEFT_POSITION) {
        if ((ball_positionY <= playerOnePosition + RACKET_HEIGHT / 2 ) &&
            (ball_positionY >= playerOnePosition + RACKET_HEIGHT / -2)) {
            calculatedDirection.left = -startBallDirection.left
        } else {
            gameOver(++playerTwoScore);
            playerTwoScoreContainer.innerHTML = `${playerTwoScore}`
        }
    }

    return calculatedDirection
}


const playerOneUp$ = fromEvent<KeyboardEvent>(document, 'keyup').pipe(
    filter((e) => e.key === keysPlayerOne.upButton),
    switchMap((v) => interval(ANIMATION_SPEED).pipe(
        tap((v) => {
            if (playerOnePosition >= MAX_BOTTOM_POSITION) {
                playerOneRacket.style.top = `${playerOnePosition -= RACKET_SPEED}px`;
            }
        }),
        takeUntil(fromEvent<KeyboardEvent>(document, 'keyup').pipe(
            filter((e) => e.key === keysPlayerOne.downButton),
        ))
    ))
);

const playerOneDown$ = fromEvent<KeyboardEvent>(document, 'keyup').pipe(
    filter((e) => e.key === keysPlayerOne.downButton),
    switchMap((v) => interval(ANIMATION_SPEED).pipe(
        tap((v) => {
            if (playerOnePosition <= MAX_TOP_POSITION) {
                playerOneRacket.style.top = `${playerOnePosition += RACKET_SPEED}px`;
            }
        }),
        takeUntil(fromEvent<KeyboardEvent>(document, 'keyup').pipe(
            filter((e) => e.key === keysPlayerOne.upButton),
        ))
    ))
);

const playerTwoUp$ = fromEvent<KeyboardEvent>(document, 'keyup').pipe(
    filter((e) => e.key === keysPlayerTwo.upButton),
    switchMap((v) => interval(ANIMATION_SPEED).pipe(
        tap((v) => {
            if (playerTwoPosition >= MAX_BOTTOM_POSITION) {
                playerTwoRacket.style.top = `${playerTwoPosition -= RACKET_SPEED}px`;
            }
        }),
        takeUntil(fromEvent<KeyboardEvent>(document, 'keyup').pipe(
            filter((e) => e.key === keysPlayerTwo.downButton),
        ))
    ))
);

const playerTwoDown$ = fromEvent<KeyboardEvent>(document, 'keyup').pipe(
    filter((e) => e.key === keysPlayerTwo.downButton),
    switchMap((v) => interval(ANIMATION_SPEED).pipe(
        tap((v) => {
            if (playerTwoPosition <= MAX_TOP_POSITION) {
                playerTwoRacket.style.top = `${playerTwoPosition += RACKET_SPEED}px`;
            }
        }),
        takeUntil(fromEvent<KeyboardEvent>(document, 'keyup').pipe(
            filter((e) => e.key === keysPlayerTwo.upButton),
        ))
    ))
);

const playersMoves$ = merge(
    playerOneUp$,
    playerOneDown$,
    playerTwoUp$,
    playerTwoDown$
);

function gameOver(countOfPints: number) {
    playersMovesSubscription.unsubscribe();
    timerSubscription.unsubscribe()
    isGameStarted = false;


    if (countOfPints === 3){
        console.log('Player WIN')
    }
}


function startGame () {
    if (!isGameStarted) {
        setPositionToDefaults();

        timerSubscription = timer$.subscribe();
        playersMovesSubscription = playersMoves$.subscribe();

        isGameStarted = true;
    }
}

startButton.addEventListener('click', startGame)


