/// Authors: Jeniene Saoit and Roscoe Moedl
/// Date: October 28, 2025
/// A6: Qt Simon Game

#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include "Model.h"

QT_BEGIN_NAMESPACE
namespace Ui {
class MainWindow;
}
QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    /**
     * @brief MainWindow Constructs an instance of MainWindow and handles the view of the Simon Game by displaying
     * the ui and setting the state of the ui components.
     * @param model A reference to the model.
     * @param parent Default parameter for MainWindow.
     */
    MainWindow(Model& model, QWidget *parent = nullptr);
    ~MainWindow();
signals:
    // to signal to the model what button the player clicked
    void buttonClicked(ButtonColor btnColor);
public slots:
    /**
     * @brief setStartGameUiState Handles when the game starts in the view by disabling the start button and updating
     *  the game status label indicate that the game is in progress.
     */
    void setStartGameUiState();

    /**
     * @brief setComputerTurnUiState Handles the state of the ui when it is the computer's turn by disabling the red and
     *  blue buttons and resetting the progress back to 0% (to indicate the start of a round).
     */
    void setComputerTurnUiState();

    /**
     * @brief setButtonFlash Flashes the button of the specified "btnColor" (red or blue) by changing
     *  the color to a lighter version, indicating the button is flashed.
     * @param btnColor The color of the button to flash.
     */
    void setButtonFlash(ButtonColor btnColor);

    /**
     * @brief revertButtonFlash Reverts the specified buttons from "flashed color" to original color.
     * @param btnColor The color of the button to flash.
     */
    void revertButtonFlash(ButtonColor btnColor);

    /**
     * @brief setGameOverUiState Handles when the game ends by changing the game status to indicate the game is over,
     *  disabling the red and blue buttons and allowing the user to restart by enabling the start button.
     */
    void setGameOverUiState();

private:
    Ui::MainWindow *ui;

    // color values for the buttons in the ui - to set button color
    QString activeStart = "QPushButton {background-color: rgb(0, 128, 0);} QPushButton:pressed {background-color: rgb(45, 65, 38);}";
    QString inactiveStart = "QPushButton {background-color: rgb(30);} QPushButton:pressed {background-color: rgb(30);}";

    QString activeBlue = "QPushButton {background-color: rgb(0, 0, 255);} QPushButton:pressed {background-color: rgb(255, 255, 255);}";
    QString inactiveBlue = "QPushButton {background-color: rgb(29, 46, 61);}";
    QString flashBlue = "QPushButton {background-color: rgb(212, 212, 255);}";

    QString activeRed = "QPushButton {background-color: rgb(255, 0, 0);} QPushButton:pressed {background-color: rgb(255, 255, 255);}";
    QString inactiveRed = "QPushButton {background-color: rgb(73, 25, 25);}";
    QString flashRed = "QPushButton {background-color: rgb(255, 212, 212);}";

    bool isPlayerTurn; // used to disable key press event when it's not the players turn

    /**
     * @brief enableRedBlueButtons A helper method to enable the red and blue buttons and signify buttons are enabled
     *  by setting them to active colors.
     */
    void enableRedBlueButtons();

    /**
     * @brief disableRedBlueButtons A helper method to disable the red and blue buttons and signify buttons are disabled
     *  by setting them to inactive colors
     */
    void disableRedBlueButtons();

    /**
     * @brief keyPressEvent Captures left and right arrows to use as controls for pressing the red and blue buttons.
     * @param event When any key is press.
     */
    void keyPressEvent(QKeyEvent *event) override;
};
#endif // MAINWINDOW_H
