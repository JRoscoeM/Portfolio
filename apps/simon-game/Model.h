/// Authors: Jeniene Saoit and Roscoe Moedl
/// Date: October 28, 2025
/// A6: Qt Simon Game

#ifndef MODEL_H
#define MODEL_H

#include <QObject>
#include <vector>
#include <cstdlib>
#include <QTimer>

using std::vector;
using std::rand;

enum class ButtonColor { BLUE, RED };

class Model : public QObject{

    Q_OBJECT
public:
    /**
     * @brief Model Constructs a Model object to control the logic of the Simon game by initializing member variables
     * and connecting slots that handle the start of the game, the computer's turn, and player's turn.
     */
    Model();

public slots:
    /**
     * @brief statGameSlot Handles the start of the game by signaling the start of the computer's turn.
     */
    void startGame();

    /**
     * @brief performComputerTurn Handle the computer's turn by generating the sequence, signaling to disable the red/blue
     *  buttons, flashing the sequence of buttons to click, and signaling the start of the players turn at the end.
     */
    void performComputerTurn();

    /**
     * @brief displaySequenceFlash Manages the timing and displays the sequence of buttons to flash by toggling
     *  between flash and revert state.
     */
    void displaySequenceFlash();

    /**
     * @brief performPlayerTurn Handles the player's turn by checking if the red/blue buttons were clicked in the sequence order.
     *  This also handles ending the game on an incorrect press, updating the progress on a correct press, and starts the next
     *   round by speeding up the game and signaling the start of the computer turn.
     * @param btnColor
     */
    void performPlayerTurn(ButtonColor btnColor);

    /**
     * @brief resetGameState Resets the state of the game by clearing the sequence and setting the flash duration, player
     *  move index, and round back to their default values.
     */
    void resetGameState();

signals:
    void startComputerTurnSignal();
    void startPlayerTurn();

    // tell the view to do the following in the ui:
    void signalToDisplayFlash(ButtonColor btnColor);
    void signalToRevertFlash(ButtonColor btnColor);

    void signalProgressChanged(int progress);

    void signalRoundEnded();
    void signalToUpdateRound(int currRound);
    void signalGameEnded();

private:
    vector<ButtonColor> sequence; // list of buttons to click

    // for displaying the sequence during computer turn
    QTimer* sequenceIntervalTimer; // controls the timing between button flash and revert
    int flashDisplayDuration; // how long a button flash lasts (game speed)
    int currFlashIndex; // current color in sequence being flashed
    bool isFlashing; // track if timeout signal should flash(true) or revert(false) button

    int playerMoveIndex; // track player's current move check progress through sequence
    int round; // the current round in the game



};

#endif // MODEL_H
