#ifndef CONSTRUCTCOMPUTER_H
#define CONSTRUCTCOMPUTER_H

#include <QWidget>
#include <QPainter>
#include <QRect>
#include <QPushButton>
#include <QPixmap>
#include <QLabel>
#include <QTimer>
#include <QString>
#include <QShowEvent>
#include <QDialog>
#include <QString>


namespace Ui {
class ConstructComputer;
}

class QShowEvent;

class ConstructComputer : public QWidget
{
    Q_OBJECT

public:
    /**
     * @brief ConstructComputer Constructs a 'ConstructComputer' custom Qwidget.
     *          This widget is where the player will build a computer by adding
     *          all of the parts to the computer.
     */
    explicit ConstructComputer(QWidget *parent = nullptr);
    ~ConstructComputer();

public slots:
    // Displays the built computer after adding all the pc parts to the computer
    void displayBuiltComputer();

signals:
    // Signals that all the computer parts have been added to the computer
    void allPartsAdded();
    void partAdded(int count);
    void onInfoTitleTextChanged(const QString& text);
    void onInfoTextChanged(const QString& text);
    void onCurrentGoalTextChanged(const QString& text);

protected:
    /**
     * @brief paintEvent Used to paint the background of the widget.
     */
    void paintEvent(QPaintEvent* event) override;
    void resizeEvent(QResizeEvent* event) override;
    void showEvent(QShowEvent *event) override;

private:
    Ui::ConstructComputer *ui;

    QFont electrolizeFont;

    QPixmap background;
    QPixmap computerCase;
    QPixmap builtComputer;

    // Images, buttons, and labels for the pc parts
    QPixmap cpuImg;
    QPixmap gpuImg;
    QPixmap ramImg;
    QPixmap motherboardImg;

    QPushButton* cpuBtn;
    QPushButton* gpuBtn;
    QPushButton* ramBtn;
    QPushButton* motherboardBtn;

    QLabel* cpuLabel;
    QLabel* gpuLabel;
    QLabel* ramLabel;
    QLabel* motherboardLabel;

    // To track how much parts have been added
    int partsAdded = 0;

    /**
     * @brief createPart A helper method for setting up the pc part with its button and a lebel for the name.
     * @param btn The pc part button.
     * @param name The name of the pc part.
     * @param icon The image icon of the pc part.
     * @return A QWidget* with a vertically layed out part button and a label with its name.
     */
    QWidget* createPart(QPushButton* btn, QString name, QPixmap icon);

    /**
     * @brief checkAllPartsAdded A helper method to check if all parts have been added to the buildArea
     *          whenever the player presses on a part button.
     */
    void checkAllPartsAdded();

    void repositionParts();
};

#endif // CONSTRUCTCOMPUTER_H
