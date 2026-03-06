#ifndef CHINAGAME_H
#define CHINAGAME_H

#include <QWidget>
#include <QPainter>
#include <QMouseEvent>
#include <QMessageBox>
#include <QImage>
#include <QPainterPath>

class ChinaGame: public QWidget
{
    Q_OBJECT
public:
    ChinaGame(QWidget* parent = nullptr);
    void resetGame();

signals:
    void elementCollected();
    void gameCompleted();
    void returnToMap();

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

protected:
    void paintEvent(QPaintEvent* event) override;
    void mouseMoveEvent(QMouseEvent* event) override;
    void enterEvent(QEnterEvent* event) override;

private:
    // Images
    QPixmap backgroundImage;  // chinamine.png
    QPixmap minerCursor;      // miningman.png
    QImage maskImage;         // Brown overlay mask

    // Game state
    QPoint cursorPos;
    bool gameActive;
    int rocksHit;             // Count of black rocks hit (lose at 2)
    bool elementFound;        // Found white-bordered neodymium

    // Colors for detection
    QRgb whiteColor;          // White border of neodymium
    QRgb blackColor;          // Black rocks

    // Eraser settings
    int eraserRadius;

    // Scaled rendering
    QPixmap scaledBackground;
    QRect backgroundRect;

    // Methods
    void eraseAtPosition(const QPoint& pos);
    void checkForCollisions(const QPoint& center);
    bool hasPixelInErasedArea(const QPoint& center, QRgb targetColor);
    void showVictoryMessage();
    void showDefeatMessage();
    void endGame(bool won);
};

#endif // CHINAGAME_H
