#ifndef MAINWINDOW_H
#define MAINWINDOW_H
#include <QMainWindow>
#include <QGridLayout>
#include "GameModel.h"
#include "GameWidget.h"
#include <QWidget>
#include <QPushButton>
#include <QLabel>
#include <QScrollArea>

QT_BEGIN_NAMESPACE
namespace Ui
{
class MainWindow;
}
QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    MainWindow(QWidget *parent = nullptr);
    ~MainWindow();
    void addItemToInventoryBox(const QString& itemName, const QString& iconImgPath);
protected:
    void resizeEvent(QResizeEvent *event) override;

public slots:
    /**
     * @brief setInfoText A mainwindow method which may be used by any MiniGame. Sets the text of the info section to the text parameter.
     * @param text The text which will be displayed in the info section.
     */
    void setInfoText(const QString& text);
    /**
     * @brief setInfoTitleText A mainwindow method which may be used by any Minigame. Sets the text fo the info title section to the text parameter.
     * @param text The text which will be displayed in the info title section.
     */
    void setInfoTitleText(const QString& text);

    void setCurrentGoalText(const QString& text);

signals:
    void displayItemToUi(QWidget* item);

private slots:
    void startTheGame();

private:
    Ui::MainWindow *ui;
    GameModel *model;
    GameWidget* gameScreen;

    QGridLayout* inventoryLayout;
    int inventoryRow = 0;
    int inventoryCol = 0;
    QWidget* homeScreen = nullptr;
    QPushButton* startButton = nullptr;

    // We have a map in game model holding all the inventory to preview
    QWidget* scrollWidget; // The widget used to scroll when frames are added to the side bar
    QVBoxLayout* scrollLayout; // The layout Q object to hold the section of the scrollable area

    QString gameDescriptionStr =
        "Welcome to Polluting Computing, a game that teaches the player about the ethical impact of manufacturing computer hardware. "
        "In this game, the player travels to several mines across the world to collect the resources needed to manufacture "
        "the parts to build a computer. "
        "\n\n" // new line
        "There are four unique mines (Chile, China, DRC, and SLC), each with its own unique challenge for the user to conquer in "
        "order to collect the resources. As the player explores through the mines, they learn about the various labor and ethical "
        "implications of collecting resources for manufacturing computer parts.";
};
#endif // MAINWINDOW_H
