#include "ChileGame.h"
#include "SkillCheckWidget.h"

ChileGame::ChileGame(QWidget* parent)
    : QWidget(parent)
{
    currentBackground = QPixmap(":/image/chileMine.png");
    onHomeScreen = true;
    //setup copper buttons
    copperButton1 = new QPushButton(this);
    setupCopperButton(copperButton1, .17, .68);

    copperButton2 = new QPushButton(this);
    setupCopperButton(copperButton2, .5, .55);

    copperButton3 = new QPushButton(this);
    setupCopperButton(copperButton3, .85, .38);

    copperButton4 = new QPushButton(this);
    setupCopperButton(copperButton4, .3, .35);

    backButton = new QPushButton("Back", this);
    backButton->setStyleSheet("QPushButton {"
                              "   font-size: 15pt;"
                              "}");
    backButton->move(0.03 * width(), 0.05 * height());
    backButton->move(0.03 * width(), 0.01 * height());
    connect(backButton, &QPushButton::clicked, this, &ChileGame::setupWorld);

    pollutionBar = new QProgressBar(this);
    pollutionBar->setRange(0, 100);
    pollutionBar->setValue(0);
    pollutionBar->setFormat("Pollution: %p%");
    pollutionBar->setStyleSheet(
        "QProgressBar {"
        "    border: 2px solid black;"
        "    border-radius: 5px;"
        "    text-align: center;"
        "    background-color: #333;"
        "    color: white;"
        "    width: 100px;"
        "}"
        "QProgressBar::chunk {"
        "    background-color: #ff4d4d;"
        "    width: 1px;"
        "}"
        );
    pollutionTimer = new QTimer(this);
    connect(pollutionTimer, &QTimer::timeout, this, &ChileGame::updatePollution);
    pollutionBar->move(0.475 * width(), 0.01 * height());

    copperLabel = new QLabel("Copper: 0", this);
    copperLabel->setStyleSheet("QLabel { font-size: 20pt; color: white; padding: 2px;}");
    copperLabel->move(0.8 * width(), 0.01 * height());
    copperLabel->show();

    // close both parts, then open the world
    onHomeScreen = false;
    closeCurrentPart();
    onHomeScreen = true;
}

void ChileGame::setup()
{
    emit onGoalTextChanged("Mine Copper before the pollution gets too high!");
    emit onInfoTextChanged("Chile is the largest producer of copper, specifically the city of Calama, which has multiple mines around it. "
                           "But mining large ammounts of ore has its downsides. "
                           "It produces a lot of emissions and air pollutants "
                           "that has caused the area to have a lung cancer rate that is 3x the national average.");
    emit onInfoTitleTextChanged("Escondida Copper Mine, Chile");
    QMessageBox msg(this);
    msg.setWindowTitle("How to Play");
    msg.setText("In this game, you must collect 10 pieces of copper from different areas of the mine. But be wary, pollution levels are rising, and you can’t stay for too long.\n"
                "Click on the copper icons on the map to travel to different parts of the mine. Once there, click on dirt piles and try to extract copper. Collect all 10 pieces before pollution reaches dangerous levels.");
    msg.setIcon(QMessageBox::Information);
    msg.setStandardButtons(QMessageBox::Ok);
    msg.exec();

    // Notify GameWidget AFTER the dialog closes
    QTimer::singleShot(0, this, [this]() {
        pollutionTimer->start(400);
    });
}

void ChileGame::setupCopperButton(QPushButton* btn, double xPos, double yPos)
{
    btn->setIcon(QIcon(":/image/copperBar.png"));
    btn->setIconSize(QSize(60, 60));
    btn->move(xPos * width(), yPos * height());
    btn->setFlat(true);
    btn->setStyleSheet("QPushButton {"
                       "   background-color: transparent;"
                       "   border: none;"
                       "}"
                       "QPushButton:hover {"
                       "   background-color: rgba(0, 0, 0, 30);"
                       "}");
    connect(btn, &QPushButton::clicked, this, &ChileGame::setupGame);
}

void ChileGame::setupWorld()
{
    closeCurrentPart();
    // hide all game parts and show world parts
    onHomeScreen = true;
    currentBackground = QPixmap(":/image/chileMine.png");
    if (!copper1Used) copperButton1->show();
    if (!copper2Used) copperButton2->show();
    if (!copper3Used) copperButton3->show();
    if (!copper4Used) copperButton4->show();
    update();
}

void ChileGame::setupGame()
{
    QPushButton* source = qobject_cast<QPushButton*>(sender());
    if (source) {
        source->hide();

        if (source == copperButton1) copper1Used = true;
        else if (source == copperButton2) copper2Used = true;
        else if (source == copperButton3) copper3Used = true;
        else if (source == copperButton4) copper4Used = true;
    }
    closeCurrentPart();
    currentBackground = QPixmap(":/image/dirtBG.jpg");
    backButton->show();
    onHomeScreen = false;
    spawnRandomCopperSpots();
    update();
}

void ChileGame::closeCurrentPart()
{
    if(onHomeScreen){
        copperButton1->hide();
        copperButton2->hide();
        copperButton3->hide();
        copperButton4->hide();
    } else {
        backButton->hide();
        for (QPushButton* btn : copperSpots) {
            btn->hide();
        }
    }
}

void ChileGame::updatePollution()
{
    pollutionValue++;
    pollutionBar->setValue(pollutionValue);
    if (pollutionValue >= 100)
    {
        pollutionTimer->stop();
        QMessageBox msgBox(this);
        msgBox.setWindowTitle("Pollution's at 100%");
        msgBox.setText("You Lose\n"
                       "The area became to poluted to keep looking for copper.");
        msgBox.setStandardButtons(QMessageBox::Retry);
        msgBox.setDefaultButton(QMessageBox::Retry);

        int ret = msgBox.exec();

        if (ret == QMessageBox::Retry)
        {
            reset();
        }
    }
}

void ChileGame::backButtonPressed()
{
    setupWorld();
}

void ChileGame::reset()
{
    onHomeScreen = true;
    pollutionValue = 0;
    copperCollected = 0;
    copperLabel->setText("Copper: " + QString::number(copperCollected));
    copperLabel->adjustSize();
    currentBackground = QPixmap(":/image/chileMine.png");

    copper1Used = copper2Used = copper3Used = copper4Used = false;
    copperButton1->show();
    copperButton2->show();
    copperButton3->show();
    copperButton4->show();

    pollutionTimer->stop();
    pollutionBar->setValue(0);

    backButton->hide();

    for (QPushButton* btn : copperSpots) {
        btn->hide();
    }

    update();
    setup();
}

void::ChileGame::spawnRandomCopperSpots()
{
    for (QPushButton* btn : copperSpots) {
        btn->deleteLater();
    }
    copperSpots.clear();

    for (int i = 0; i < 4; i++) {
        QPushButton* btn = new QPushButton(this);
        btn->setIcon(QIcon(":/image/dirtPile.png"));
        btn->setIconSize(QSize(100, 100));
        btn->setFlat(true);
        btn->setStyleSheet("QPushButton {"
                           "   background-color: transparent;"
                           "   border: none;"
                           "}"
                           "QPushButton:hover {"
                           "   background-color: rgba(0, 0, 0, 30);"
                           "}");

        int maxX = width() - 120;
        int maxY = height() - 120;

        int x = QRandomGenerator::global()->bounded(20, maxX);
        int y = QRandomGenerator::global()->bounded(20, maxY);

        btn->move(x, y);
        btn->show();

        // Connect click to be processed
        connect(btn, &QPushButton::clicked,
                this, &ChileGame::copperSpotClicked);

        copperSpots.push_back(btn);
    }
}

void::ChileGame::copperSpotClicked()
{
    // get the button they clicked so we can remove it later
    QPushButton* btn = qobject_cast<QPushButton*>(sender());
    if (!btn) return;

    SkillCheckWidget* skillCheck = new SkillCheckWidget(this);
    connect(skillCheck,
            &SkillCheckWidget::finished,
            this,
            [this, btn](bool success)
            {
                btn->hide();
                if(success){
                    addCopper();
                    update();
                }
    });
    skillCheck->show();
}

void ChileGame::addCopper(){
    copperCollected++;
    copperLabel->setText("Copper: " + QString::number(copperCollected));
    copperLabel->adjustSize();
    if(copperCollected >= 10){
        endGame();
    }
}

void ChileGame::endGame(){
    pollutionTimer->stop();
    emit onInfoTextChanged("You've succeeded in collecting enough copper, but the pollution doesn't fade. "
                           "The communities living there face the risks that mining operations bring. "
                           "The increased cancer rates are a result of pritorizing profit over health of people and the environment. "
                           "The Chilean goverment is getting sued over the envorimental impact the mine brings.");
    emit onGoalTextChanged("Take your copper back to the main hub!");
    QMessageBox msg(this);
    msg.setWindowTitle("Copper Collected!");
    msg.setText("You collected enough copper before the pollution got to you, but not everyone is so lucky.");
    msg.setIcon(QMessageBox::Information);
    msg.setStandardButtons(QMessageBox::Ok);
    msg.exec();

    QTimer::singleShot(0, this, [this]() {
        emit minigameFinished();
    });
}

void ChileGame::paintEvent(QPaintEvent*)
{
    QPainter painter(this);

    painter.drawPixmap(rect(), currentBackground);
}

void ChileGame::resizeEvent(QResizeEvent* event)
{

    QWidget::resizeEvent(event);

    int w = width();
    int h = height();
    backButton->move(w * 0.03, h * 0.01);
    pollutionBar->move(0.475 * w, 0.01 * h);
    copperLabel->move(0.8 * w, 0.01 * h);
    if(onHomeScreen){
        copperButton1->move(w * .17, h * .68);
        copperButton2->move(w * .5, h * .55);
        copperButton3->move(w * .85, h * .38);
        copperButton4->move(w * .3, h * .35);
    }
}
