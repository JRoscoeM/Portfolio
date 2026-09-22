#include "GameWidget.h"
#include <QVBoxLayout>

GameWidget::GameWidget(GameModel* model, QWidget *parent)
: QWidget(parent)
, model(model)
{
    this->model = model;
    // set the background of the widget to dark gray
    this->setStyleSheet("background-color: rgb(30, 30, 30);");

    // Creating the map hub and different minigame widgets
    mapHub = new WorldHub(this);
    chileMine = new ChileGame(this);
    chinaMine = new ChinaGame(this);
    drcMine = new DRCGame(this);
    slcMine = new SaltLakeGame(this);
    computer = new ConstructComputer(this);

    // Adding the widgets to the stacked widget for displaying
    screenStack = new QStackedWidget();

    screenStack->addWidget(mapHub);
    screenStack->addWidget(chileMine);
    screenStack->addWidget(chinaMine);
    screenStack->addWidget(drcMine);
    screenStack->addWidget(slcMine);
    screenStack->addWidget(computer);

    QVBoxLayout* layout = new QVBoxLayout(this);
    layout->setContentsMargins(0, 0, 0, 0);
    layout->addWidget(screenStack);

    showScreen(GameWidget::MAPHUB);
    // showScreen(GameWidget::CONSTRUCTCOMPUTER);

    // Connecting mine buttons click to display each minigame widget
    connect(mapHub,
            &WorldHub::chileMineButtonClicked,
            this,
            [this]() {
                showScreen(GameWidget::CHILE);
                chileMine->setup();
            });

    connect(mapHub,
            &WorldHub::chinaMineButtonClicked,
            this,
            [this]() {
                showScreen(GameWidget::CHINA);
            });

    connect(mapHub,
            &WorldHub::drcMineButtonClicked,
            this,
            [this]() {
                showScreen(GameWidget::DRC);
                drcMine->setup();
            });
    connect(mapHub,
            &WorldHub::buildComputerButtonClicked,
            this,
            [this]() {
                inBuildPhase      = true;
                pcPartsCompleted  = 0;
                emit progressUpdated(0);
                showScreen(GameWidget::CONSTRUCTCOMPUTER);
            });

    // World hub labels
    connect(mapHub,
            &WorldHub::onInfoTextChanged,
            model,
            &GameModel::passInfoTextToMainWindow);
    connect(mapHub,
            &WorldHub::onInfoTitleTextChanged,
            model,
            &GameModel::passInfoTitleTextToMainWindow);
    connect(mapHub,
            &WorldHub::onGoalTextChanged,
            model,
            &GameModel::passCurrentGoalTextChangedToMainWindow);

    // Salt Lake game
    connect(mapHub,
            &WorldHub::slcMineButtonClicked,
            this,
            [this]() {
                showScreen(GameWidget::SLC);
            });
    connect(slcMine,
            &SaltLakeGame::minigameFinished,
            this,
            &GameWidget::handleSLCFinished);
    connect(slcMine,
            &SaltLakeGame::onInfoTextChanged,
            model,
            &GameModel::passInfoTextToMainWindow);
    connect(slcMine,
            &SaltLakeGame::onInfoTitleTextChanged,
            model,
            &GameModel::passInfoTitleTextToMainWindow);
    connect(slcMine,
            &SaltLakeGame::onGoalTextChanged,
            model,
            &GameModel::passCurrentGoalTextChangedToMainWindow);

    //china mine
    connect(chinaMine,
            &ChinaGame::elementCollected,
            this,
            &GameWidget::handleChinaInventory);
    connect(chinaMine,
            &ChinaGame::returnToMap,
            this,
            [this]() {
                showScreen(GameWidget::MAPHUB);
            }
            );
    connect(chinaMine,
            &ChinaGame::gameCompleted,
            this,
            &GameWidget::handleChinaFinished);
    connect(chinaMine,
            &ChinaGame::onInfoTextChanged,
            model,
            &GameModel::passInfoTextToMainWindow);
    connect(chinaMine,
            &ChinaGame::onInfoTitleTextChanged,
            model,
            &GameModel::passInfoTitleTextToMainWindow);
    connect(chinaMine,
            &ChinaGame::onGoalTextChanged,
            model,
            &GameModel::passCurrentGoalTextChangedToMainWindow);

    // drc mine
    connect(drcMine,
            &DRCGame::onImpactsTextChanged,
            model,
            &GameModel::passImpactsTextToMainWindow);
    connect(drcMine,
            &DRCGame::onInfoTitleTextChanged,
            model,
            &GameModel::passInfoTitleTextToMainWindow);
    connect(drcMine,
            &DRCGame::onInfoTextChanged,
            model,
            &GameModel::passInfoTextToMainWindow);
    connect(drcMine,
            &DRCGame::minigameFinished,
            this,
            &GameWidget::handleDRCFinished);
    connect(drcMine,
            &DRCGame::onGoalTextChanged,
            model,
            &GameModel::passCurrentGoalTextChangedToMainWindow);

    // Chile mine
    connect(chileMine,
            &ChileGame::minigameFinished,
            this,
            &GameWidget::handleChileFinished);
    connect(chileMine,
            &ChileGame::onInfoTextChanged,
            model,
            &GameModel::passInfoTextToMainWindow);
    connect(chileMine,
            &ChileGame::onInfoTitleTextChanged,
            model,
            &GameModel::passInfoTitleTextToMainWindow);
    connect(chileMine,
            &ChileGame::onGoalTextChanged,
            model,
            &GameModel::passCurrentGoalTextChangedToMainWindow);

    // construct computer
    connect(computer,
            &ConstructComputer::onInfoTitleTextChanged,
            model,
            &GameModel::passInfoTitleTextToMainWindow);
    connect(computer,
            &ConstructComputer::onInfoTextChanged,
            model,
            &GameModel::passInfoTextToMainWindow);
    connect(computer,
            &ConstructComputer::onCurrentGoalTextChanged,
            model,
            &GameModel::passCurrentGoalTextChangedToMainWindow);
    connect(computer,
            &ConstructComputer::partAdded,
            this,
            [this](int count) {
                if (!inBuildPhase)
                    return;
                pcPartsCompleted = count;
                int value = qMin(pcPartsCompleted, 4) * 25;
                emit progressUpdated(value);
            });
}

void GameWidget::showScreen(GameWidget::Screen screen)
{
    screenStack->setCurrentIndex(static_cast<int>(screen));
}

void GameWidget::handleChinaInventory()
{
    model -> addInventoryItem("Neodymium", ":/image/neodymium.png");
}

void GameWidget::handleDRCFinished() {
    model->addInventoryItem("Cobalt", ":/image/cobalt.png");
    if (!inBuildPhase && !drcDone) {
        drcDone = true;
        minesCompleted++;
        emit progressUpdated(minesCompleted * 25);
    }
    if (minesCompleted >= 4) {
        mapHub->setBuildComputerEnabled(true);
    }
    QPushButton* returnBtn = new QPushButton("Return to World Map", this);
    returnBtn->setStyleSheet("font-size: 32px; background: #404040; color: white;");
    returnBtn->setGeometry(width()/2 - 200, height()/2 - 40, 400, 80);
    returnBtn->show();
    returnBtn->raise();

    drcMine->setEnabled(false);
    mapHub->disableDRCMine();

    // Return to map when clicked
    connect(returnBtn, &QPushButton::clicked,
            this,
            [this, returnBtn]() {
                returnBtn->deleteLater();
                showScreen(MAPHUB);
            });
}

void GameWidget::handleSLCFinished()
{
    // Progress bar and build computer unlock
    if (!inBuildPhase && !slcDone) {
        slcDone = true;
        minesCompleted++;
        emit progressUpdated(minesCompleted * 25);
    }

    if (minesCompleted >= 4) {
        mapHub->setBuildComputerEnabled(true);
    }

    // Add Magnesium to inventory once
    if (!model->hasItem("Magnesium")) {
        model->addInventoryItem("Magnesium", ":/image/magnesium.png");
    }

    // Disable the slc game
    if (slcMine) {
        slcMine->stopTimers();
        slcMine->setEnabled(false);
    }

    // Return to World Map button
    QPushButton* returnBtn = new QPushButton("Return to World Map", this);
    returnBtn->setStyleSheet(
        "font-size: 32px; background: #404040; color: white;"
        "border-radius: 10px; padding: 10px;"
        );
    returnBtn->setGeometry(width()/2 - 200, height()/2 - 40, 400, 80);
    returnBtn->raise();
    returnBtn->show();
    mapHub->disableSLCMine();

    connect(returnBtn, &QPushButton::clicked,
            this,
            [this, returnBtn]() {
                returnBtn->deleteLater();
                showScreen(MAPHUB);
            });
}

void GameWidget::handleChileFinished()
{
    // it looks like this part of the code crashes the game
    model->addInventoryItem("Copper", ":/image/copperBar.png");
    if (!inBuildPhase && !chileDone) {
        chileDone = true;
        minesCompleted++;
        emit progressUpdated(minesCompleted * 25);
    }
    if (minesCompleted >= 4) {
        mapHub->setBuildComputerEnabled(true);
    }
    // Disable the game permanently
    chileMine->setEnabled(false);

    QPushButton* returnBtn = new QPushButton("Return to World Map", this);
    returnBtn->setStyleSheet(
        "font-size: 32px; background: #404040; color: white;"
        "border-radius: 10px; padding: 10px;"
        );
    returnBtn->setGeometry(width()/2 - 200, height()/2 - 40, 400, 80);
    returnBtn->raise();
    returnBtn->show();
    mapHub->disableChileMine();

    connect(returnBtn, &QPushButton::clicked, this, [this, returnBtn]() {
        returnBtn->deleteLater();
        showScreen(MAPHUB);
    });
}

void GameWidget::handleChinaFinished()
{
    if (!inBuildPhase && !chinaDone) {
        chinaDone = true;
        minesCompleted++;
        emit progressUpdated(minesCompleted * 25);
    }
    if (minesCompleted >= 4) {
        mapHub->setBuildComputerEnabled(true);
    }
    mapHub->disableChinaMine();
    showScreen(MAPHUB);
}
