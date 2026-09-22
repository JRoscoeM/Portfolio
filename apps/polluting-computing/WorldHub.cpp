#include "WorldHub.h"

WorldHub::WorldHub(QWidget* parent)
    : QWidget(parent)
    , background(":/image/WorldMap.png")
{
    goalDuringMines = "Build your computer! Go to mines around the world to collect materials.";
    goalAfterMines = "Go to your workbench to build a computer!";
    impactDuringMines = "Computers are built of various materials mined from the earth all across the world.";
    impactAfterMines = "Mining for the materials in electronics is incredibly destructive. For example, getting a "
                       "single ounce of gold out of the earth can create up to 91 tons of waste.";

    // Create the mine buttons and size
    chileMine = new QPushButton(this);
    setupButton(chileMine, .183, .717);

    chinaMine = new QPushButton(this);
    setupButton(chinaMine, .718, .303);

    drcMine = new QPushButton(this);
    setupButton(drcMine, .471, .541);

    slcMine = new QPushButton(this);
    setupButton(slcMine, .065, .239);

    //build computer button
    buildComputerBtn = new QPushButton("Build Computer", this);
    buildComputerBtn->setEnabled(false);
    // Load Quantico title font just for this button
    int titleID = QFontDatabase::addApplicationFont(":/font/Quantico-Regular.ttf");
    QString familyTitle = QFontDatabase::applicationFontFamilies(titleID).at(0);
    QFont quantico(familyTitle, 17, QFont::Bold);
    buildComputerBtn->setFont(quantico);
    buildComputerBtn->setStyleSheet(
        "QPushButton {"
        "  padding: 6px 12px;"
        "  color: rgb(236, 231, 223);"
        "  background-color: rgba(40, 40, 40, 180);"
        "  border: 2px solid rgb(80, 80, 80);"
        "  border-radius: 8px;"
        "  padding: 10px 20px;"
        "}"
        "QPushButton:hover { background-color: rgba(41, 41, 41, 200); }"
        "QPushButton:pressed { background-color: rgba(30, 30, 30, 200); }"
        );
    buildComputerBtn->setMinimumSize(220, 60);
    buildComputerBtn->adjustSize();

    // Connecting the mine buttons
    connect(chileMine,
            &QPushButton::clicked,
            this,
            &WorldHub::chileMineButtonClicked);

    connect(chinaMine,
            &QPushButton::clicked,
            this,
            &WorldHub::chinaMineButtonClicked);

    connect(drcMine,
            &QPushButton::clicked,
            this,
            &WorldHub::drcMineButtonClicked);

    connect(slcMine,
            &QPushButton::clicked,
            this,
            &WorldHub::slcMineButtonClicked);

    connect(buildComputerBtn,
            &QPushButton::clicked,
            this,
            &WorldHub::buildComputerButtonClicked);
}

void WorldHub::setupButton(QPushButton* btn, double xPos, double yPos)
{
    btn->setIcon(QIcon(":/image/miningIcon.png"));
    btn->setStyleSheet("QPushButton { background-color: transparent; border: none; } QPushButton:hover {background-color: rgba(23, 22, 30, 50); border-radius: 5px;} ");
    btn->setIconSize(QSize(50, 50));
    btn->move(xPos * width(), yPos * height());
    btn->setFlat(true);
}

void WorldHub::paintEvent(QPaintEvent* event)
{
    Q_UNUSED(event)
    QPainter painter(this);

    // paint background scaled to widget size
    painter.drawPixmap(rect(), background);

    emit onInfoTextChanged(impactDuringMines);
    emit onGoalTextChanged(goalDuringMines);
    emit onInfoTitleTextChanged("The World");
}

void WorldHub::resizeEvent(QResizeEvent* event)
{
    QWidget::resizeEvent(event);

    int w = width();
    int h = height();

    chileMine->move(w * .183, h * .717);
    chinaMine->move(w * .718, h * .303);
    drcMine->move(w * .471, h * .541);
    slcMine->move(w * .065, h * .239);

    if (buildComputerBtn) {
        int btnW = buildComputerBtn->width();
        int btnH = buildComputerBtn->height();
        buildComputerBtn->move(w - btnW - 20, h - btnH - 20);
    }
}

void WorldHub::setBuildComputerEnabled(bool enabled)
{
    if (buildComputerBtn){
        buildComputerBtn->setEnabled(enabled);
        emit onInfoTextChanged(impactAfterMines);
        emit onGoalTextChanged(goalAfterMines);
    }
}

void WorldHub::disableChileMine() {
    if (chileMine) chileMine->setEnabled(false);
}

void WorldHub::disableChinaMine() {
    if (chinaMine) chinaMine->setEnabled(false);
}

void WorldHub::disableDRCMine() {
    if (drcMine) drcMine->setEnabled(false);
}

void WorldHub::disableSLCMine() {
    if (slcMine) slcMine->setEnabled(false);
}
