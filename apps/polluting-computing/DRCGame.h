/**
 * @file DRCMine.h
 * @brief This class handles the logic for the cobalt mine mini-game in the
 * Democratic Republic of the Congo.
 * @author Roscoe Moedl
 * @date 2025-11-24
 */

#ifndef DRCGAME_H
#define DRCGAME_H

#include <QPainter>
#include <QPushButton>
#include <QStack>
#include <QWidget>
#include <QLabel>

/**
 * @brief This class handles the logic for the cobalt mine mini-game in the
 * Democratic Republic of the Congo.
 */
class DRCGame : public QWidget {
    Q_OBJECT
public:
    /**
   * @brief DRCGame The default constructor, constructs an instance of DRCGame
   * with all members initialized and setup completed.
   */
    DRCGame(QWidget *parent = nullptr);

    // Arrays which contain the game's prompts, options, and results.
    QString prompts[5];
    QString winningResults[5];
    QString losingResults[5];
    QString winningOptions[5];
    QString losingOptions[5];

    bool currentIsPrompt = false; // True when the games is waiting for the player to make a decision.

    /**
     * @brief setup Pops the initial text emits the signal to change it.
     */
    void setup();

public slots:
    /**
     * @brief startNextDRCStep Called when the player either makes a decision or clicks next. Handles which buttons should be enabled, updates drc game state.
     */
    void startNextDRCStep();

    /**
     * @brief pickWinningOption Called when the player picks the winning option (+profit). Pops both option stacks and passes the appropriate pop to mainwindow.
     */
    void pickWinningOption();

    /**
     * @brief pickLosingOption Called when the player picks the losing option (+humanity). Pops both option stacks and passes the appropriate pop to mainwindow.
     */
    void pickLosingOption();
signals:
    /**
     * @brief onImpactsTextChanged A signal which may be used by any minigame. Is emitted when the impacts section should have updated text.
     * @param text The text which should be displayed in the impacts section.
     */
    void onImpactsTextChanged(const QString& text);

    /**
     * @brief onInfoTitleTextChanged A signal which may be used by any minigame. Is emitted when the info title section should have updated text.
     * @param text The text which should be displayed in the info title section.
     */
    void onInfoTitleTextChanged(const QString& text);

    /**
     * @brief onInfoTextChanged A signal which may be used by any minigame. Is emitted when the info text section should have updated text.
     * @param text The text which should be displayed in the info text section.
     */
    void onInfoTextChanged(const QString& text);

    /**
     * @brief onGoalTextChanged A signal which may be used by any minigame. Is emitted when the goal text section should have updated text.
     * @param text The text which should be displayed in the goal text section.
     */
    void onGoalTextChanged(const QString& text);

    /**
     * @brief minigameFinished Emitted when the minigame is done. Connects to a slot in GameWidget.
     */
    void minigameFinished();
protected:
    /**
     * @brief paintEvent handles painting for the background image.
     */
    void paintEvent(QPaintEvent*) override;
private:
    QPixmap defaultBackground;
    QPixmap currentBackground;

    // Elements that are displayed on the QWidget.
    QPushButton *optionA;
    QPushButton *optionB;
    QPushButton *continueBtn;
    QLabel* profitMarginTitle;
    QLabel* profitMarginLabel;

    // Arrays that contains background images that will be displayed when the player makes a choice.
    QPixmap winningBackgrounds[5];
    QPixmap losingBackgrounds[5];

    int currentStep = 0; // The index of the current level of the game.

    /**
     * @brief handleEndGame Checks whether the game is over and whether it has been won. Handles what should be done as a result.
     * @return An empty string if the game is not ready. Returns a restart string in the game is over and not won. A Gameover string if the game is over and won.
     */
    QString handleEndGame();

    /**
     * @brief enableDRCOptionButtons Shows the option buttons if they are hidden, enables them, and sets their text to the method parameters.
     * @param optionA The text which optionA button will display.
     * @param optionB The text which optionB button will display.
     */
    void enableDRCOptionButtons(const QString& optionA, const QString& optionB);

    /**
     * @brief disableDRCOptionButtons Disables and hides the option buttons.
     */
    void disableDRCOptionButtons();

    /**
    * @brief profitMargin This double represents the player's profit margin as a
    * percent, if it drops below 47.1, then the player loses.
    */
    double profitMargin = 37.1;
};
#endif // DRCGAME_H
