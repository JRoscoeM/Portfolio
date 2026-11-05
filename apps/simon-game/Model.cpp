/// Authors: Jeniene Saoit and Roscoe Moedl
/// Date: October 28, 2025
/// A6: Qt Simon Game

#include "Model.h"
#include <vector>
#include <cstdlib>
#include <QTimer>

using std::vector;
using std::rand;

Model::Model(){
    // initialized values for data members
    std::srand(time(nullptr));

    playerMoveIndex = 0;
    round = 1;

    sequenceIntervalTimer = new QTimer(this);
    flashDisplayDuration = 1000;
    currFlashIndex = 0;
    isFlashing = true;

    connect(this,
            &Model::startComputerTurnSignal,
            this,
            &Model::performComputerTurn);

    connect(this,
            &Model::signalGameEnded,
            this,
            &Model::resetGameState);

    // connect the timer to sequence display state handler
    connect(sequenceIntervalTimer,
            &QTimer::timeout,
            this,
            &Model::displaySequenceFlash);
}

void Model::startGame() {
    emit startComputerTurnSignal();
}

void Model::performComputerTurn() {
    emit signalToUpdateRound(round);

    // add a buton to click to the sequence
    ButtonColor nextBtnToClick = (rand() % 2 == 0) ? ButtonColor::BLUE : ButtonColor::RED;
    sequence.push_back(nextBtnToClick);

    // reset flash display state variables
    currFlashIndex = 0;
    isFlashing = true;

    // set timer to do button flashing by setting interval to flash duration
    sequenceIntervalTimer->setInterval(flashDisplayDuration);

    // start continuous timer (loop sequence) to display the buttons to flash
    sequenceIntervalTimer->start();
}

void Model::displaySequenceFlash() {
    int flashGap = flashDisplayDuration / 2; // time between each button flash

    // stop the timer once iterated through whole sequence
    if (currFlashIndex >= sequence.size()) {
        sequenceIntervalTimer->stop();

        // marks end of computer turn once all buttons flashed
        emit startPlayerTurn();
        return; // exit slot to stop displaying sequence
    }

    ButtonColor colorToFlash = sequence[currFlashIndex];

    if (isFlashing) {
        emit signalToDisplayFlash(colorToFlash);

        isFlashing = false; // next time revert
        sequenceIntervalTimer->setInterval(flashGap); // set timer interval to flash gap to revert color
    } else {
        emit signalToRevertFlash(colorToFlash); // revert button flash

        currFlashIndex++; // iterate for next button in sequence

        isFlashing = true; // next time flash
        sequenceIntervalTimer->setInterval(flashDisplayDuration); // set timer interval to flash duration to flash color
    }
}

void Model::resetGameState() {
    // reset data members back to initial values
    sequence.clear();
    flashDisplayDuration = 1000;
    playerMoveIndex = 0;
    round = 1;
}

void Model::performPlayerTurn(ButtonColor btnColor) {
    // correct press
    if (sequence[playerMoveIndex] == btnColor) {
        playerMoveIndex++;

        // update progress
        int progress = (int)(((float)playerMoveIndex / sequence.size()) * 100.0f); // multiply by 100 to get percent
        emit signalProgressChanged(progress);

        // check if pressed all buttons in the sequence
        if (progress == 100) {
            emit signalRoundEnded();
            // So that the player can see that they have completed all the moves.
            QTimer::singleShot(1000, this, [this]() { emit startComputerTurnSignal(); });

            playerMoveIndex = 0;

            // speed up the game by reducing the flash duration
            if (flashDisplayDuration > 75) { // to prevent flash duration from becoming negative
                flashDisplayDuration -= 75;
            }

            round++;
        }
    }
    // wrong press
    else {
        emit signalGameEnded();
    }
}

