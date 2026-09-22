#include "SaltLakeGame.h"
#include <QPainter>
#include <QMouseEvent>
#include <QRandomGenerator>
#include <QMessageBox>
#include <QIcon>

SaltLakeGame::SaltLakeGame(QWidget* parent)
    : QWidget(parent)
    , pollutionLevel(0)
    , pollutionLimit(60)
    , flashOn(false)
    , tickCount(0)
    , epaEnforcementActive(false)
    , epaEnforcementSecondsRemaining(0)
    , paperworkProgress(0)
    , isDraggingPaperwork(false)
    , lastDragX(0)
    , paperworkCompleted(false)
    , currentInspectIconIndex(0)
    , canStartPaperwork(false)
    , paperAvailable(false)
    , gameFinished(false)
{
    // Background frames
    frames.append(QPixmap(":/image/saltLakePollution1.jpg"));
    frames.append(QPixmap(":/image/saltLakePollution2.png"));
    frames.append(QPixmap(":/image/saltLakePollution3.png"));
    frames.append(QPixmap(":/image/saltLakePollution4.png"));
    frames.append(QPixmap(":/image/saltLakePollution5.png"));
    frames.append(QPixmap(":/image/saltLakePollution6.png"));

    // Inspection icons (papers)
    inspectionIcons.append(QPixmap(":/image/acidPondSLC.png"));
    inspectionIcons.append(QPixmap(":/image/airPollutionSLC.png"));
    inspectionIcons.append(QPixmap(":/image/linkShrinkSLC.png"));
    inspectionIcons.append(QPixmap(":/image/litterSLC.png"));
    inspectionIcons.append(QPixmap(":/image/waterPolluteSLC.png"));
    inspectionIcons.append(QPixmap(":/image/cityPollutionSLC.png"));

    // Labels
    goalDuringGame = "Report violations to the EPA as they come!";
    goalAfterGame = "Bring your Magnesium back to the hub for building.";
    impactDuringGame = "Industrial operations around the Great Salt Lake (especially US Magnesium and the Chevron Refinery) "
                       "have long contributed to the lake’s decline and to the air quality problems in northern Salt Lake. "
                       "US Magnesium alone is responsible for nearly 25% of the pollution released during winter inversions, "
                       "when cold air traps contaminants close to the ground. Extracting resources like magnesium often comes "
                       "with hidden costs, including toxic byproducts and airborne emissions that harm surrounding communities. "
                       "These companies frequently push production beyond EPA limits, prioritizing output over safety and "
                       "environmental stewardship.";
    impactAfterGame = "Even after collecting the magnesium you need, the real-world impacts of extraction remain. Companies "
                      "such as US Magnesium and the Chevron Refinery have repeatedly violated EPA regulations, releasing "
                      "pollutants that accelerate the shrinking of the Great Salt Lake and worsen air quality during "
                      "winter inversions. These actions compound long-term ecological damage like destroying wildlife habitat, "
                      "increasing toxic dust storms, and threatening public health. The Salt Lake region’s pollution "
                      "problem isn’t just a natural crisis; it’s the result of industrial practices that prioritize "
                      "profit over community well-being and environmental responsibility.";

    // Paper button (clickable inspection icon)
    paperBtn = new QPushButton(this);
    paperBtn->setFlat(true);
    paperBtn->setVisible(false);
    paperBtn->setStyleSheet(
        "QPushButton {"
        "  border: none;"
        "  background: transparent;"
        "}"
        );
    connect(paperBtn, &QPushButton::clicked,
            this, &SaltLakeGame::onClickPaper);

    // Report violation button
    reportBtn = new QPushButton("Report Violation", this);
    reportBtn->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Preferred);
    reportBtn->move(20, 20);
    reportBtn->setEnabled(false);
    connect(reportBtn, &QPushButton::clicked,
            this, &SaltLakeGame::onReportViolation);

    // Timers
    pollutionTimer = new QTimer(this);
    connect(pollutionTimer, &QTimer::timeout,
            this, &SaltLakeGame::raisePollution);

    flashTimer = new QTimer(this);
    connect(flashTimer, &QTimer::timeout,
            this, &SaltLakeGame::updateFlash);
}

// Background helpers
int SaltLakeGame::frameIndexForPollution() const
{
    if (pollutionLevel <= 20) return 0;
    if (pollutionLevel <= 40) return 1;
    if (pollutionLevel <= 60) return 2;
    if (pollutionLevel <= 75) return 3;
    if (pollutionLevel <= 90) return 4;
    return 5;
}

QPixmap SaltLakeGame::currentBackground() const
{
    if (frames.isEmpty())
        return QPixmap();
    return frames.value(frameIndexForPollution(), frames.first());
}

// Flashing warning (for gauge when over limit)
void SaltLakeGame::updateFlash()
{
    flashOn = !flashOn;
    update();
}

// Paper icon spawning
void SaltLakeGame::spawnNextPaperIcon(int index)
{
    if (gameFinished)
        return;

    if (inspectionIcons.isEmpty() || !paperBtn)
        return;

    paperBtn->setEnabled(true);
    paperBtn->show();

    // index normalization
    if (index < 0) index = 0;
    index = index % inspectionIcons.size();
    currentInspectIconIndex = index;

    canStartPaperwork = false;
    paperAvailable    = true;

    QPixmap pix = inspectionIcons[index];
    QPixmap scaled = pix.scaled(180, 180, Qt::KeepAspectRatio, Qt::SmoothTransformation);
    QSize size = scaled.size();

    paperBtn->setIcon(QIcon(scaled));
    paperBtn->setIconSize(size);
    paperBtn->setFixedSize(size);

    // spawn position
    int minX = 50;
    int minY = 50;
    int maxX = width()  - size.width()  - 50;
    int maxY = height() - size.height() - 150;

    int x = QRandomGenerator::global()->bounded(minX, maxX);
    int y = QRandomGenerator::global()->bounded(minY, maxY);

    paperBtn->move(x, y);
}

// When the player clicks the paper icon
void SaltLakeGame::onClickPaper()
{
    if (!paperBtn)
        return;

    paperBtn->hide();
    paperAvailable    = false;
    canStartPaperwork = true;   // now they can drag paperwork

    // Reset paperwork mini-game
    paperworkCompleted = false;
    paperworkProgress  = 0;
    reportBtn->setEnabled(false);

    update();
}

void SaltLakeGame::stopTimers()
{
    if (pollutionTimer) pollutionTimer->stop();
    if (flashTimer)     flashTimer->stop();
}

// Gauge drawing
void SaltLakeGame::drawGauge(QPainter& painter)
{
    int gaugeWidth  = 40;
    int gaugeHeight = height() * 0.6;
    int x = width()  - gaugeWidth - 40;
    int y = height() * 0.2;

    painter.setPen(Qt::white);
    painter.drawRect(x, y, gaugeWidth, gaugeHeight);

    double pct  = pollutionLevel / 100.0;
    int    fillH = int(gaugeHeight * pct);

    QColor color;
    if (pollutionLevel <= pollutionLimit)
        color = QColor(80, 200, 120, 230);
    else
        color = flashOn ? QColor(255, 60, 60, 230)
                        : QColor(180, 30, 30, 220);

    painter.fillRect(QRect(x + 1,
                           y + gaugeHeight - fillH,
                           gaugeWidth - 2,
                           fillH),
                     color);

    // EPA threshold line
    painter.setPen(QPen(Qt::yellow, 3));
    int limitY = y + gaugeHeight - int((pollutionLimit / 100.0) * gaugeHeight);
    painter.drawLine(x, limitY, x + gaugeWidth, limitY);
}

// Paperwork bar
QRect SaltLakeGame::paperworkBarRect() const
{
    int w = width() / 3;
    return QRect((width() - w) / 2, height() - 70, w, 35);
}

void SaltLakeGame::drawPaperworkBar(QPainter& painter)
{
    QRect bar = paperworkBarRect();

    // Visual cue when paperwork is active: glowing border around bar
    if (canStartPaperwork && !paperworkCompleted && pollutionLevel < 100) {
        QPen pen(QColor(255, 255, 0));
        pen.setWidth(3);
        painter.setPen(pen);
        painter.setBrush(Qt::NoBrush);
        QRect glow = bar.adjusted(-4, -4, 4, 4);
        painter.drawRect(glow);
    }

    // Base bar background
    painter.setBrush(QColor(230, 210, 170));
    painter.setPen(Qt::black);
    painter.drawRect(bar);

    // Fill level
    int fillWidth = int(bar.width() * (paperworkProgress / 100.0));
    painter.setBrush(QColor(190, 170, 130));
    painter.setPen(Qt::NoPen);
    painter.drawRect(bar.left(), bar.top(), fillWidth, bar.height());

    // Text
    painter.setPen(Qt::black);
    QString text = paperworkCompleted
                       ? "EPA Paperwork Completed - Click 'Report Violation'"
                       : (canStartPaperwork ? "Drag here to file the violation" : "Click a violation to start paperwork");
    painter.drawText(bar, Qt::AlignCenter, text);

    // Static paper icon to the right of the bar
    QPixmap icon(":/image/paperwork.png");
    if (!icon.isNull()) {
        int iconSize = bar.height();
        QPixmap scaledIcon = icon.scaled(iconSize, iconSize,
                                         Qt::KeepAspectRatio,
                                         Qt::SmoothTransformation);
        int iconX = bar.right() + 10;
        int iconY = bar.top() + (bar.height() - scaledIcon.height()) / 2;
        painter.drawPixmap(iconX, iconY, scaledIcon);
    }
}

// Pollution logic
void SaltLakeGame::freezeGame()
{
    if (pollutionTimer) pollutionTimer->stop();
    if (flashTimer)     flashTimer->stop();

    if (paperBtn) {
        paperBtn->hide();
        paperBtn->setEnabled(false);
    }

    if (reportBtn) {
        reportBtn->setEnabled(false);
    }

    isDraggingPaperwork = false;
    canStartPaperwork   = false;
    paperAvailable      = false;
}

void SaltLakeGame::raisePollution()
{
    if (gameFinished)
        return;

    tickCount++;

    // Pollution accelerates with time
    int base = 2 + tickCount / 30;
    base = qMin(base, 12);

    int delta = epaEnforcementActive ? qMax(1, base / 2) : base;
    pollutionLevel = qBound(0, pollutionLevel + delta, 100);

    // Game Over condition
    if (pollutionLevel >= 100)
    {
        pollutionLevel = 100;
        gameFinished = true;

        // Stop timers and disable everything visually/logically
        stopTimers();
        freezeGame();

        if (paperBtn) {
            paperBtn->hide();
            paperBtn->setEnabled(false);
        }

        if (reportBtn) {
            reportBtn->setEnabled(false);
        }

        emit onGoalTextChanged(goalAfterGame);
        emit onInfoTextChanged(impactAfterGame);

        // Show end message
        QMessageBox msg(this);
        msg.setWindowTitle("US Magnesium Investigated");
        msg.setText("There's a lot of pollution in the air..\n But now you have enough Magnesium.");
        msg.setIcon(QMessageBox::Information);
        msg.setStandardButtons(QMessageBox::Ok);
        msg.exec();

        // Give Qt time to flush queued paint/mouse/timer events
        QTimer::singleShot(150, this, [this]() {
            emit minigameFinished();
        });

        return;
    }

    // Random paper spawning
    if (!paperAvailable && !canStartPaperwork)
    {
        int roll = QRandomGenerator::global()->bounded(15);
        if (roll == 0)
        {
            int nextIndex = (currentInspectIconIndex + 1) % qMax(1, inspectionIcons.size());
            spawnNextPaperIcon(nextIndex);
        }
    }

    // Epa enforcement timer
    if (epaEnforcementActive)
    {
        epaEnforcementSecondsRemaining--;
        if (epaEnforcementSecondsRemaining <= 0)
            epaEnforcementActive = false;
    }

    // Final update only when not finished
    update();
}

//Report Violation
void SaltLakeGame::onReportViolation()
{
    if (!paperworkCompleted)
        return;

    if (pollutionLevel > 0) {
        pollutionLevel = qMax(0, pollutionLevel - 20);
        epaEnforcementActive = true;
        epaEnforcementSecondsRemaining = 7;
    }

    // Reset paperwork cycle
    canStartPaperwork   = false;
    paperworkCompleted  = false;
    paperworkProgress   = 0;
    reportBtn->setEnabled(false);

    // Allow new papers to spawn again
    paperAvailable = false;

    update();
}

// Mouse events
void SaltLakeGame::mousePressEvent(QMouseEvent* e)
{
    if (pollutionLevel >= 100)
        return;  // frozen on game over

    // Must click a paper first before paperwork becomes active
    if (!canStartPaperwork)
        return;

    if (paperworkBarRect().contains(e->pos())) {
        isDraggingPaperwork = true;
        lastDragX = e->pos().x();
    }
}

void SaltLakeGame::mouseMoveEvent(QMouseEvent* e)
{
    if (!isDraggingPaperwork || paperworkCompleted)
        return;

    int delta = e->pos().x() - lastDragX;
    if (delta > 0) {
        paperworkProgress = qBound(
            0,
            int(paperworkProgress + delta * 0.5),
            100
            );
        if (paperworkProgress >= 100) {
            paperworkCompleted = true;
            paperworkProgress  = 100;
            reportBtn->setEnabled(true);
        }
    }

    lastDragX = e->pos().x();
    update();
}

void SaltLakeGame::mouseReleaseEvent(QMouseEvent*)
{
    isDraggingPaperwork = false;
}

//Paint games
void SaltLakeGame::paintEvent(QPaintEvent*)
{
    if (gameFinished)
        return;

    QPainter painter(this);
    painter.setRenderHint(QPainter::Antialiasing);

    QPixmap bg = currentBackground();
    if (!bg.isNull()) {
        QPixmap scaled = bg.scaled(size(),
                                   Qt::KeepAspectRatioByExpanding,
                                   Qt::SmoothTransformation);
        painter.drawPixmap(
            (width()  - scaled.width())  / 2,
            (height() - scaled.height()) / 2,
            scaled
            );
    }

    drawGauge(painter);
    drawPaperworkBar(painter);
}

void SaltLakeGame::showEvent(QShowEvent* event)
{
    QWidget::showEvent(event);

    if (gameFinished)
        return;

    if (pollutionTimer && !pollutionTimer->isActive())
        pollutionTimer->start(400);

    if (flashTimer && !flashTimer->isActive())
        flashTimer->start(300);

    // Only spawn initial paper once, and not after finish
    if (!paperAvailable && !canStartPaperwork && !inspectionIcons.isEmpty()) {
        spawnNextPaperIcon(currentInspectIconIndex);
    }

    emit onInfoTitleTextChanged("Salt Lake City");
    emit onGoalTextChanged(goalDuringGame);
    emit onInfoTextChanged(impactDuringGame);
}

void SaltLakeGame::hideEvent(QHideEvent* event)
{
    QWidget::hideEvent(event);

    if (pollutionTimer) pollutionTimer->stop();
    if (flashTimer)     flashTimer->stop();
}
