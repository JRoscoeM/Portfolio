#include "mainwindow.h"
#include "ui_mainwindow.h"
#include <QLabel>
#include <QPixmap>
#include <QFont>
#include <QFontDatabase>
#include <QApplication>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
    , model(new GameModel(this))
    , gameScreen(new GameWidget(model, this))
{
    ui->setupUi(this);
    // Dark background for window
    this->setStyleSheet("background-color: rgb(23, 22, 20);");
    this->showMaximized();

    //popup should be readable
    qApp->setStyleSheet(
            "QMessageBox QLabel {"
            "  color: rgb(236,231,223);"
            "  font-size: 15px;"
            "  qproperty-alignment: AlignLeft;"
            "}"
            "QMessageBox QPushButton {"
            "  color: rgb(236,231,223);"
            "  background-color: rgba(31,33,34,180);"
            "  border: 2px solid rgb(80,80,80);"
            "  padding: 6px 12px;"
            "  font-size: 14px;"
            "}"
            //button styling
            "DRCGame QPushButton, "
            "SaltLakeGame QPushButton, "
            "ChileGame QPushButton {"
            "  color: rgb(236,231,223);"
            "  background-color: rgba(31,33,34,200);"
            "  border-radius: 8px;"
            "  border: 2px solid rgb(80,80,80);"
            "  padding: 8px 20px;"
            "  font-size: 18px;"
            "}"
            "DRCGame QPushButton:hover, "
            "SaltLakeGame QPushButton:hover, "
            "ChileGame QPushButton:hover {"
            "  background-color: rgba(60,60,60,220);"
            "}"
        );
    // Formatting for Sections containing text
    ui->impact->setWordWrap(true);
    ui->impactTitle->setWordWrap(true);

    // ---- Labels Text Style (font, size, bold) ----
    // title labels
    int titleID = QFontDatabase::addApplicationFont(":/font/Quantico-Regular.ttf");
    QString familyTitle = QFontDatabase::applicationFontFamilies(titleID).at(0);
    QFont quantico(familyTitle, 15, QFont::Bold);
    ui->impactTitle->setFont(quantico);
    ui->goalTitle->setFont(quantico);
    ui->inventoryLabel->setFont(quantico);
    QString linen = "color: rgb(236, 231, 223); background: transparent;";
    ui->impactTitle->setStyleSheet(linen);
    ui->goalTitle->setStyleSheet(linen);
    ui->inventoryLabel->setStyleSheet(linen);
    // text labels
    int textID = QFontDatabase::addApplicationFont(":/font/Electrolize-Regular.ttf");
    QString familyText = QFontDatabase::applicationFontFamilies(textID).at(0);
    QFont electrolize(familyText, 14);
    QString transparentBg = "background-color: rgba(31, 33, 34, 180);";
    ui->impact->setFont(electrolize);
    ui->impact->setWordWrap(true);
    ui->currentGoal->setFont(electrolize);
    ui->currentGoal->setWordWrap(true);
    ui->impact->setStyleSheet(linen + transparentBg);
    ui->currentGoal->setStyleSheet(linen + transparentBg);
    //ui->inventoryItems->viewport()->setStyleSheet("background: transparent;");
    ui->inventoryItems->setStyleSheet(linen + transparentBg);

    //progress bar styling
    ui->progressBar->setFont(electrolize);
    ui->progressBar->setStyleSheet(
        "QProgressBar {"
        "  color: rgb(236,231,223);"
        "  font-size: 16px;"
        "  background-color: rgba(31,33,34,180);"
        "  border: 2px solid rgb(80,80,80);"
        "  border-radius: 5px;"
        "  text-align: center;"
        "}"
        "QProgressBar::chunk {"
        "  background-color: rgb(69, 157, 118);"
        "  border-radius: 5px;"
        "}"
        );


    scrollWidget = new QWidget(this);
    scrollLayout = new QVBoxLayout(scrollWidget);
    scrollLayout->addStretch();

    ui->inventoryItems->setWidget(scrollWidget);
    ui->inventoryItems->setWidgetResizable(true);

    // ---- adding the custom GameWidget to the gameWidget container in the ui ----
    ui->gameWidget->setLayout(new QVBoxLayout());
    ui->gameWidget->layout()->setContentsMargins(0, 0, 0, 0);
    ui->gameWidget->layout()->addWidget(gameScreen);


    // set the layout of the inventory scrollable area
    QWidget* itemsContainer = new QWidget();
    inventoryLayout = new QGridLayout(itemsContainer);
    inventoryLayout->setSpacing(5);
    ui->inventoryItems->setWidget(itemsContainer);

    // ---- Home Screen Overlay (game title, description box, start button) ----
    homeScreen = new QWidget(this);
    homeScreen->setObjectName("homeScreen");

    // semi-transparent -> we can change how much later
    homeScreen->setStyleSheet(
        "#homeScreen { background-color: rgba(0, 0, 0, 220); }"
        );
    homeScreen->setAttribute(Qt::WA_StyledBackground);

    homeScreen->setGeometry(this->rect());   // cover entire window

    QVBoxLayout* homeLayout = new QVBoxLayout(homeScreen);
    homeLayout->setContentsMargins(0, 0, 0, 0);

    // title
    QLabel* title = new QLabel("Polluting Computing", homeScreen);
    title->setAlignment(Qt::AlignCenter);
    title->setFont(quantico);
    title->setStyleSheet("background: transparent; color: rgb(236, 231, 223); font-size: 100px;");

    // game description box
    QLabel* gameDescription = new QLabel(gameDescriptionStr);
    gameDescription->setFixedHeight(230);
    gameDescription->setWordWrap(true);
    gameDescription->setAlignment(Qt::AlignCenter);
    gameDescription->setFont(electrolize);
    gameDescription->setStyleSheet(
        "font-size: 20px; "
        "color: white; "
        "background-color: #3a3a3a; "
        "border: 2px solid gray;"
        "border-radius: 10px;"
        "padding: 20;"
        );

    // start button
    startButton = new QPushButton("Start Game", homeScreen);
    startButton->setFixedSize(300, 100);
    startButton->setFont(electrolize);
    startButton->setStyleSheet(
        "QPushButton {"
        "font-size: 50px;"
        "background-color: #3a3a3a;"
        "color: white;"
        "border: none;"
        "border-radius: 50px;"
        "}"
        "QPushButton:hover {"
        "background-color: #505050;"
        "}"
        "QPushButton:pressed {"
        "background-color: #2a2a2a;"
        "}"
        );

    //quit button
    QPushButton* quitButton = new QPushButton("Quit", homeScreen);
    // adding title, game description, start button to home screen layout
    homeLayout->addStretch();
    homeLayout->addWidget(title, 0, Qt::AlignHCenter);
    homeLayout->addWidget(gameDescription, 0, Qt::AlignCenter);
    homeLayout->addSpacing(15);
    homeLayout->addWidget(startButton, 0, Qt::AlignHCenter);
    homeLayout->addSpacing(10);
    homeLayout->addWidget(quitButton, 0, Qt::AlignHCenter);
    homeLayout->addStretch();

    //connections
    connect(startButton,
            &QPushButton::clicked,
            this,
            &MainWindow::startTheGame);

    connect(quitButton,
            &QPushButton::clicked,
            this,
            &MainWindow::close);

    // ---- Connections ----
    // home screen connections

    //make sure it’s on top
    homeScreen->raise();
    homeScreen->show();

    // ------------------------- General Purpose Connect Calls ------------------------
    connect(model,
            &GameModel::onInfoTextChanged,
            this,
            &MainWindow::setInfoText);
    connect(model,
            &GameModel::onInfoTitleTextChanged,
            this,
            &MainWindow::setInfoTitleText);
    connect(model,
            &GameModel::onCurrentGoalTextChanged,
            this,
            &MainWindow::setCurrentGoalText);

    connect(this,
            &MainWindow::displayItemToUi,
            this,
            [this](QWidget* item) {
                const int ITEMS_PER_ROW = 2;

                inventoryLayout->addWidget(item, inventoryRow, inventoryCol);

                inventoryCol++;
                if (inventoryCol >= ITEMS_PER_ROW) {
                    inventoryCol = 0;
                    inventoryRow++;
                }
            });

    connect(gameScreen,
            &GameWidget::progressUpdated,
            ui->progressBar,
            &QProgressBar::setValue);

    // ------------------------- DRC Connect Calls ------------------------

    // THE COMMENTED STUFF ENDS -------------------

    //Salt Lake connections
    connect(model,
            &GameModel::onInventoryItemAdded,
            this,
            [this](const QString& name, const QString& iconPath) {
                addItemToInventoryBox(name, iconPath);
            });

}

void MainWindow::resizeEvent(QResizeEvent *event)
{
    QMainWindow::resizeEvent(event);

    if (homeScreen)
        homeScreen->setGeometry(this->rect());
}

MainWindow::~MainWindow()
{
    delete ui;
}

void MainWindow::setInfoText(const QString& text) {// maybe replace these with lambdas.
    ui->impact->setText(text);
}

void MainWindow::setInfoTitleText(const QString& text) {
    ui->impactTitle->setText(text);
}

void MainWindow::setCurrentGoalText(const QString& text) {
    ui->currentGoal->setText(text);
}
void MainWindow::startTheGame() {
    if (homeScreen)
        homeScreen->hide();
}

void MainWindow::addItemToInventoryBox(const QString& itemName, const QString& iconImgPath)
{
    QWidget* item = new QWidget();
    QVBoxLayout* itemLayout = new QVBoxLayout(item);

    itemLayout->setSpacing(0);
    itemLayout->setContentsMargins(0, 0, 0, 0);

    QPushButton* btn = new QPushButton();
    btn->setIcon(QIcon(iconImgPath));
    btn->setIconSize(QSize(85, 85));
    btn->setFixedSize(100, 100);

    QLabel* lbl = new QLabel(itemName);
    lbl->setStyleSheet("font-size: 14px;");
    lbl->setFixedWidth(100);
    lbl->setAlignment(Qt::AlignCenter);

    itemLayout->addWidget(btn, 0, Qt::AlignCenter);
    itemLayout->addWidget(lbl, 0, Qt::AlignCenter);

    const int ITEMS_PER_ROW = 2;
    inventoryLayout->addWidget(item, inventoryRow, inventoryCol, Qt::AlignCenter);

    inventoryCol++;
    if (inventoryCol >= ITEMS_PER_ROW) {
        inventoryCol = 0;
        inventoryRow++;
    }
}



