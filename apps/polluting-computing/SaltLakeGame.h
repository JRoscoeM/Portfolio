#ifndef SALTLAKEGAME_H
#define SALTLAKEGAME_H

#include <QWidget>
#include <QTimer>
#include <QPushButton>
#include <QVector>
#include <QPixmap>

class SaltLakeGame : public QWidget
{
    Q_OBJECT

public:
    explicit SaltLakeGame(QWidget* parent = nullptr);

    /**
     * @brief stopTimers Helper method to stop the all timers in widget
     */
    void stopTimers();

signals:
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

    /**
     * @brief minigameFinished Emitted when the minigame is done. Connects to a slot in GameWidget.
     */
    void minigameFinished();

protected:
    /**
     * @brief paintEvent Handles painting for slc widget
     */
    void paintEvent(QPaintEvent*) override;

    /**
     * @brief mousePressEvent Handle game logic for mouse presses
     */
    void mousePressEvent(QMouseEvent*) override;

    /**
     * @brief mouseMoveEvent Handle mouse move events for game logic
     */
    void mouseMoveEvent(QMouseEvent*) override;

    /**
     * @brief mouseReleaseEvent Handle mouse release events for game logic
     */
    void mouseReleaseEvent(QMouseEvent*) override;

    /**
     * @brief showEvent Handle logic for showing the widget
     * @param event
     */
    void showEvent(QShowEvent* event) override;

    /**
     * @brief hideEvent Handle logic for hiding the widget
     * @param event
     */
    void hideEvent(QHideEvent* event) override;

private slots:
    /**
     * @brief raisePollution Handle logic for raising the pollution bar in the game
     */
    void raisePollution();

    /**
     * @brief updateFlash Handle logic for updating the flash
     */
    void updateFlash();

    /**
     * @brief onReportViolation Handle logic for clicking the report button
     */
    void onReportViolation();

    /**
     * @brief onClickPaper Handle logic for clicking papers
     */
    void onClickPaper();

private:
    // Background/images
    QVector<QPixmap> frames; // A Vector containing the images for the background
    QPixmap currentBackground() const; // Current backgorund image
    QVector<QPixmap> inspectionIcons; // Vector holding the paper images

    // Buttons
    QPushButton* reportBtn = nullptr; // Button to report/lower pollution
    QPushButton* paperBtn  = nullptr; // Button representing paper violation

    // Timers
    QTimer* pollutionTimer = nullptr; // Timer to increase pollution
    QTimer* flashTimer     = nullptr; // Timer to flash the pollution meter red when above threshold

    // Pollution state
    int  pollutionLevel; // Int representing how high pollution is
    int  pollutionLimit; // Int representing the limit for the pollution
    bool flashOn; // bool for if pollution above threshold
    int  tickCount; // how many pollution ticks have happened
    bool gameFinished ; // bool for if the game is done
    bool epaEnforcementActive; // true when player reduces pollution - slows pollution rate
    int  epaEnforcementSecondsRemaining; // epaEnforcement active for int cycles

    // Paperwork mini-bar
    int  paperworkProgress; // How far the slider/QRect is
    bool isDraggingPaperwork; // Is mouse pressing
    int  lastDragX; // The last drag position for paperworkProgress
    bool paperworkCompleted; // Paperwork successfully dragged 100% = true

    // Paper icon logic
    int  currentInspectIconIndex; // Paper index in QVector
    bool canStartPaperwork; // they clicked paper and can now drag
    bool paperAvailable; // a paper icon is visible on screen

    // Texts
    QString goalDuringGame =
        "Keep pollution as low as you can by filing EPA paperwork when violations pop up.";
    QString goalAfterGame =
        "You’ve finished the Salt Lake mini-game. Take your Magnesium back to the hub!";
    QString impactDuringGame =
        "Pollution around the Great Salt Lake is influenced by industrial activity. This mini-game "
        "is a simplified model, not a precise simulation.";
    QString impactAfterGame =
        "Even with enforcement, pollution and environmental damage can remain significant. "
        "Real-world solutions require systemic change, not just paperwork.";

    /**
     * @brief frameIndexForPollution Index for which frame we are on
     * @return
     */
    int frameIndexForPollution() const;

    // Gauge
    /**
     * @brief drawGauge Handles drawing for the pollution meter
     */
    void drawGauge(QPainter&);

    // Paperwork
    /**
     * @brief paperworkBarRect The rectangle for the paperwork slider
     * @return QRect object that is the paperwork bar
     */
    QRect paperworkBarRect() const;

    /**
     * @brief drawPaperworkBar Handles drawing the paperwork bar
     */
    void drawPaperworkBar(QPainter&);

    /**
     * @brief spawnNextPaperIcon Handles logic and display of the randomized paper violations
     * @param index int index of the papers vector
     */
    void spawnNextPaperIcon(int index);

    /**
     * @brief freezeGame called when pollution hits 100
     */
    void freezeGame();
};

#endif // SALTLAKEGAME_H
