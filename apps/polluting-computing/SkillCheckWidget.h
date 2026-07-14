#ifndef SKILLCHECKWIDGET_H
#define SKILLCHECKWIDGET_H

#include <QDialog>
#include <QTimer>
#include <QPainter>
#include <QKeyEvent>

class SkillCheckWidget : public QDialog
{
    Q_OBJECT
public:
    explicit SkillCheckWidget(QWidget *parent = nullptr);

signals:
    /**
     * @brief emits a signal when they finish the skill check if they hit it or not
     */
    void finished(bool success);

protected:
    /**
     * @brief paints the skill check
     */
    void paintEvent(QPaintEvent*) override;
    /**
     * @brief checks for when the press the space bar is pressed
     */
    void keyPressEvent(QKeyEvent*) override;
private:
    /**
     * @brief timer that moves the bar
     */
    QTimer timer;
    /**
     * @brief the green area of the skill check
     */
    QRect greenArea;
    /**
     * @brief where the current player bar is
     */
    int barPosition;
    /**
     * @brief how fast to make the bar move
     */
    int barSpeed;
    /**
     * @brief checks to see if the players bar is over the correct area
     */
    void checkPosition();
};

#endif // SKILLCHECKWIDGET_H
