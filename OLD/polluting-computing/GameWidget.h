#ifndef GAMEWIDGET_H
#define GAMEWIDGET_H
#include <QWidget>
#include <QStackedWidget>
#include "WorldHub.h"
#include "ChileGame.h"
#include "ChinaGame.h"
#include "DRCGame.h"
#include "SaltLakeGame.h"
#include "GameModel.h"
#include "ConstructComputer.h"

//This class is similar to our FrameEditor class from A7.
class GameWidget : public QWidget
{
    Q_OBJECT
public:
    GameWidget(GameModel* model, QWidget* parent = nullptr);

    enum Screen {
        MAPHUB,
        CHILE,
        CHINA,
        DRC,
        SLC,
        CONSTRUCTCOMPUTER
    };

    /**
     * @brief showScreen Changes the current screen of the game widget.
     * @param screen The map or level to be displayed on the widget.
     */
    void showScreen(Screen screen);
public slots:

signals:
    void progressUpdated(int value);

private:
    GameModel* model;
    QStackedWidget* screenStack;

    WorldHub* mapHub;
    ChileGame* chileMine;
    ChinaGame* chinaMine;
    /**
     * @brief drcMine The only instance of DRCGame in PollutingComputing.
     */
    DRCGame* drcMine;
    SaltLakeGame* slcMine;
    ConstructComputer* computer;

    //for progress bar
    bool inBuildPhase = false;
    bool chileDone = false;
    bool chinaDone = false;
    bool drcDone   = false;
    bool slcDone   = false;

    int minesCompleted    = 0;
    int pcPartsCompleted  = 0;

private slots:
    void handleSLCFinished();
    void handleDRCFinished();
    void handleChileFinished();
    void handleChinaInventory();
    void handleChinaFinished();
};

#endif // GAMEWIDGET_H
