#include "ChinaGame.h"
#include <QPainter>
#include <QDebug>
#include <QtMath>

ChinaGame::ChinaGame(QWidget* parent)
    : QWidget(parent)
    , backgroundImage(":/image/chinamine.png")
    , minerCursor(":/image/miningman.png")
    , gameActive(true)
    , rocksHit(0)
    , elementFound(false)
    // 240, 238, 241
    , whiteColor(qRgb(163, 156, 164))
    , blackColor(qRgb(0, 0, 0))
    , eraserRadius(40)
{
    setMouseTracking(true);
    setCursor(Qt::BlankCursor);

    // make the default mining screen brown (the dirt to mine through)
    maskImage = QImage(backgroundImage.size(), QImage::Format_ARGB32);
    maskImage.fill(QColor(87, 52, 21, 253));
}

void ChinaGame::paintEvent(QPaintEvent* event) {
    Q_UNUSED(event)
    QPainter painter(this);

    // Scale the background image
    scaledBackground = backgroundImage.scaled(
        this->size(),
        Qt::KeepAspectRatio,
        Qt::SmoothTransformation
        );

    // Center the scaled image
    int x = (width() - scaledBackground.width()) / 2;
    int y = (height() - scaledBackground.height()) / 2;
    backgroundRect = QRect(x, y, scaledBackground.width(), scaledBackground.height());

    // Draw the background
    painter.drawPixmap(x, y, scaledBackground);

    // Scale and draw the mask overlay
    QImage scaledMask = maskImage.scaled(
        scaledBackground.size(),
        Qt::IgnoreAspectRatio,
        Qt::SmoothTransformation
        );
    QPixmap maskPixmap = QPixmap::fromImage(scaledMask);
    painter.drawPixmap(x, y, maskPixmap);

    // Draw the mining man cursor
    if (!cursorPos.isNull()) {
        QPixmap scaledMiner = minerCursor.scaled(50, 50, Qt::KeepAspectRatio, Qt::SmoothTransformation);
        painter.drawPixmap(
            cursorPos.x() - scaledMiner.width() / 2,
            cursorPos.y() - scaledMiner.height() / 2,
            scaledMiner
            );
    }

    // Display rocks hit counter
    painter.setPen(Qt::white);
    painter.setFont(QFont("Arial", 14, QFont::Bold));
    painter.drawText(10, 25, QString("Rocks Hit: %1/2").arg(rocksHit));
}

void ChinaGame::mouseMoveEvent(QMouseEvent* event) {
    if (!gameActive) return;

    cursorPos = event->pos();

    // makes sure it only erases in the frame
    if (backgroundRect.contains(cursorPos)) {
        eraseAtPosition(cursorPos);
        checkForCollisions(cursorPos);
    }

    update();
}

void ChinaGame::enterEvent(QEnterEvent* event) {
    Q_UNUSED(event)
    setCursor(Qt::BlankCursor);
    emit onInfoTextChanged("Mine in China");
    emit onGoalTextChanged("Move your cursor to find Neodmyium in the cursor... but watch out for rocks! The mine could collapse!");
    emit onInfoTextChanged("The Bayan Obo Mine in Inner Mongolia, China, is the world's largest rare earth element deposit, holding"
                           " an estimated 70-80% of global reserves, making it crucial for the manufacturing of modern technologies"
                           " like EVs, wind turbines, and electronics. This massive open-pit mine has been in operation for 200 years"
                           " and is the primary source of REEs (particularly light rare earths like cerium and neodymium) and also "
                           "yields significant iron and niobium. The ongoing changes, mainly center on managing the severe environmental "
                           "costs, which include massive tailings ponds of toxic and radioactive waste and extensive water contamination,"
                           " as China seeks to improve its deeply impacted surrounding ecosystem while also consolidating control.");
}

void ChinaGame::eraseAtPosition(const QPoint& pos) {
    // Convert widget coordinates to mask image coordinates
    QPoint imagePos = pos - backgroundRect.topLeft();

    // Scale to original mask size
    float scaleX = (float)maskImage.width() / scaledBackground.width();
    float scaleY = (float)maskImage.height() / scaledBackground.height();

    int maskX = imagePos.x() * scaleX;
    int maskY = imagePos.y() * scaleY;
    int maskRadius = eraserRadius * scaleX; // Scale eraser radius too

    // Erase circular area by making it transparent
    QPainter maskPainter(&maskImage);
    maskPainter.setCompositionMode(QPainter::CompositionMode_Clear);
    maskPainter.setBrush(Qt::transparent);
    maskPainter.setPen(Qt::NoPen);
    maskPainter.drawEllipse(QPoint(maskX, maskY), maskRadius, maskRadius);
}

void ChinaGame::checkForCollisions(const QPoint& center) {
    // Check if white (neodymium) is revealed
    if (!elementFound && hasPixelInErasedArea(center, whiteColor)) {
        elementFound = true;
        gameActive = false;
        endGame(true); // Won!
        return;
    }

    // Check if black (rock) is revealed
    if (hasPixelInErasedArea(center, blackColor)) {
        rocksHit++;

        if (rocksHit >= 2) {
            gameActive = false;
            endGame(false); // Lost!
            resetGame();
        } else {
            // Just hit first rock, keep playing but show warning
            update();
        }
    }
}

bool ChinaGame::hasPixelInErasedArea(const QPoint& center, QRgb targetColor) {
    // Convert widget coordinates to image coordinates
    QPoint imagePos = center - backgroundRect.topLeft();

    float scaleX = (float)backgroundImage.width() / scaledBackground.width();
    float scaleY = (float)backgroundImage.height() / scaledBackground.height();

    int imgCenterX = imagePos.x() * scaleX;
    int imgCenterY = imagePos.y() * scaleY;
    int imgRadius = eraserRadius * scaleX;

    QImage bgImage = backgroundImage.toImage();

    // checks the pixels in the radius around the cursor in the erased part
    for (int dx = -imgRadius; dx <= imgRadius; dx++) {
        for (int dy = -imgRadius; dy <= imgRadius; dy++) {
            // Check if point is within circle
            if (dx*dx + dy*dy > imgRadius*imgRadius) continue;

            int checkX = imgCenterX + dx;
            int checkY = imgCenterY + dy;

            // Bounds check
            if (checkX < 0 || checkY < 0 ||
                checkX >= bgImage.width() || checkY >= bgImage.height()) {
                continue;
            }

            // Check if this pixel is erased (transparent in mask)
            QRgb maskPixel = maskImage.pixel(checkX, checkY);
            if (qAlpha(maskPixel) < 128) { // Pixel is erased
                // Check if background pixel matches target color
                QRgb bgPixel = bgImage.pixel(checkX, checkY);
                if (bgPixel == targetColor) {
                    return true;
                }
            }
        }
    }

    return false;
}

void ChinaGame::endGame(bool won) {
    setCursor(Qt::ArrowCursor);

    if (won) {
        showVictoryMessage();
    } else {
        showDefeatMessage();
    }
}

void ChinaGame::showVictoryMessage() {
    emit onGoalTextChanged("Take your Neodmyium back to the world hub!");
    emit onInfoTextChanged( "Workers suffer from PNEUMOCONIOSIS, SILICOSIS, and RADIATION RELATED ILLNESSES. "
                           "The dust you created while mining will affect GENERATIONS to come.....\n\n"
                           "Neodymium added to inventory.");
    QMessageBox msgBox(this);
    msgBox.setWindowTitle("Neodymium Collected");
    msgBox.setText("You successfully extracted Neodymium!");
    msgBox.setInformativeText(
        "But at what cost?\n\n"
        "ENVIRONMENTAL & HEALTH IMPACT:\n\n"
        "The dust created during mining operations at Bayan Obo contains RADIOACTIVE "
        "THORIUM and other toxic particles. This airborne contamination:\n\n"
        "• Causes SEVERE RESPIRATORY DISEASES in miners and nearby residents\n"
        "• Leads to increased CANCER rates in surrounding communities\n"
        "• Contaminates crops and livestock, POISONNIG the food supply\n"
        "• Spreads radioactive particles across a 50-mile radius\n"
        "• Results in birth defects and developmental issues in CHILDREN\n\n"
        "Local villages report cancer rates 7 TIMES FASTER than the national average. "
        "Workers suffer from PNEUMOCONIOSIS, SILICOSIS, and RADIATION RELATED ILLNESSES. "
        "The dust you created while mining will affect GENERATIONS to come.....\n\n"
        "Returning to map..."
        );
    msgBox.setStandardButtons(QMessageBox::Ok);
    msgBox.exec();

    emit elementCollected();
    //should reset the screen
    emit gameCompleted();
    resetGame();
    emit returnToMap();
}

//change later to show up on screen
void ChinaGame::showDefeatMessage() {
    QMessageBox msgBox(this);
    msgBox.setWindowTitle("Mine Collapsed");
    msgBox.setText("You hit too many support rocks and collapsed the mine!");
    msgBox.setInformativeText(
        "MINING DISASTERS:\n\n"
        "Mine collapses in Chinese rare earth mines are tragically common:\n\n"
        "• Hundreds of miners die annually in rare earth mining accidents\n"
        "• Collapsed tunnels trap workers underground for days\n"
        "• Inadequate safety measures prioritize production over human life\n"
        "• Many accidents go unreported to avoid scrutiny\n"
        "• Migrant workers face the most dangerous conditions with minimal protection\n\n"
        "The pursuit of rare earth elements comes at the cost of human lives, "
        "environmental destruction, and the suffering of local communities.\n\n"
        );
    msgBox.setStandardButtons(QMessageBox::Ok);
    msgBox.exec();

    emit resetGame();
}

void ChinaGame::resetGame() {
    gameActive = true;
    rocksHit = 0;
    elementFound = false;
    cursorPos = QPoint();

    // Reset mask to solid brown
    maskImage.fill(QColor(139, 90, 43, 255));

    setCursor(Qt::BlankCursor);
    update();
}
