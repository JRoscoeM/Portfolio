#ifndef WORLDHUB_H
#define WORLDHUB_H

#include <QWidget>
#include <QPainter>
#include <QPushButton>
#include <QPixmap>
#include <QGridLayout>
#include <QFont>
#include <QFontDatabase>

class WorldHub : public QWidget
{
    Q_OBJECT
public:
    WorldHub(QWidget* parent);
    void setBuildComputerEnabled(bool enabled);

protected:
    void paintEvent(QPaintEvent* event) override;
    void resizeEvent(QResizeEvent* event) override;

public slots:
    void disableChileMine();
    void disableChinaMine();
    void disableDRCMine();
    void disableSLCMine();

signals:
    void chileMineButtonClicked();
    void chinaMineButtonClicked();
    void drcMineButtonClicked();
    void slcMineButtonClicked();
    void buildComputerButtonClicked();

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

private:
    QPixmap background;
    QPushButton* chileMine;
    QPushButton* chinaMine;
    QPushButton* drcMine;
    QPushButton* slcMine;
    QPushButton* buildComputerBtn;
    QGridLayout *grid;

    // helper method to setup button settings for the map hub
    void setupButton(QPushButton* btn, double xPos, double yPos);

    QString goalDuringMines;
    QString goalAfterMines;
    QString impactDuringMines;
    QString impactAfterMines;
};

#endif // WORLDHUB_H
