#ifndef CHILEGAME_H
#define CHILEGAME_H

#include <QWidget>
#include <QPainter>
#include <QPushButton>
#include <QProgressBar>
#include <QTimer>
#include <QMessageBox>
#include <QRandomGenerator>
#include <QLabel>

class ChileGame : public QWidget
{
    Q_OBJECT
public:
    ChileGame(QWidget* parent = nullptr);
    void setup();
protected:
    void paintEvent(QPaintEvent* event) override;
    void resizeEvent(QResizeEvent* event) override;

private:
    /**
     * @brief the image for the background currently being displayed
     */
    QPixmap currentBackground;
    /**
     * @brief if the play is on the home screen of the game screen
     */
    bool onHomeScreen;
    /**
     * @brief a list of all the copper spots on the map
     */
    QVector<QPushButton*> copperSpots;
    /**
     * @brief a button for the first copper button
     */
    QPushButton* copperButton1;
    /**
     * @brief a button for the second copper button
     */
    QPushButton* copperButton2;
    /**
     * @brief a button for the third copper button
     */
    QPushButton* copperButton3;
    /**
     * @brief a button for the fourth copper button
     */
    QPushButton* copperButton4;
    /**
     * @brief if the first copper button is being used
     */
    bool copper1Used = false;
    /**
     * @brief if the second copper button is being used
     */
    bool copper2Used = false;
    /**
     * @brief if the third copper button is being used
     */
    bool copper3Used = false;
    /**
     * @brief if the fourth copper button is being used
     */
    bool copper4Used = false;
    /**
     * @brief the back button to go back to the game map (not world map)
     */
    QPushButton* backButton;
    /**
     * @brief the progress bar for how far the pollution is
     */
    QProgressBar* pollutionBar;
    /**
     * @brief the timer to update the polution bar
     */
    QTimer* pollutionTimer;
    /**
     * @brief the value of pollution bar
     */
    int pollutionValue = 0;
    /**
     * @brief the label showing how much copper the player has collected
     */
    QLabel* copperLabel;
    /**
     * @brief the number of copper collected
     */
    int copperCollected = 0;

    /**
     * @brief sets up the game part (dirt piles w/ skillchecks)
     */
    void setupGame();
    /**
     * @brief sets up the world part of the game (copper bars to clikc on)
     */
    void setupWorld();
    /**
     * @brief adds a copper button to the map at a specific location
     * @param btn: the button being added
     * @param xPox: the x position of the button as a %
     * @param yPox: the y position of the button as a %
     */
    void setupCopperButton(QPushButton* btn, double xPos, double yPos);
    /**
     * @brief sets up the world when the back button is pressed
     */
    void backButtonPressed();
    /**
     * @brief hides eveything for the current part
     */
    void closeCurrentPart();
    /**
     * @brief updates the pollution and checks to see if it at 100
     */
    void updatePollution();
    /**
     * @brief resets the game if the player fails
     */
    void reset();
    /**
     * @brief spawns the dirt piles in random spots on the screen
     */
    void spawnRandomCopperSpots();
    /**
     * @brief runs the skill check when the click a dirt spot
     */
    void copperSpotClicked();
    /**
     * @brief adds 1 to the copper when the complete a skill check
     */
    void addCopper();
    /**
     * @brief ends the game once they get to 10 points
     */
    void endGame();

signals:
    /**
     * @brief minigameFinished Emitted when the minigame is done. Connects to a slot in GameWidget.
     */
    void minigameFinished();

    /**
     * @brief onInfoTextChanged A signal which may be used by any minigame. Is emitted when the impacts section should have updated text.
     * @param text The text which should be displayed in the impacts section.
     */
    void onInfoTextChanged(const QString& text);

    /**
     * @brief onInfoTitleTextChanged A signal which may be used by any minigame. Is emitted when the info title section should have updated text.
     * @param text The text which should be displayed in the info title section.
     */
    void onInfoTitleTextChanged(const QString& text);

    /**
     * @brief onGoalTextChanged A signal which may be used by any minigame. Is emitted when the goal text section should have updated text.
     * @param text The text which should be displayed in the goal text section.
     */
    void onGoalTextChanged(const QString& text);
};
#endif // CHILEGAME_H
