#include "ConstructComputer.h"
#include "ui_ConstructComputer.h"
#include <iostream>
#include <QPushButton>
#include <QFont>
#include <QFontDatabase>

ConstructComputer::ConstructComputer(QWidget *parent)
    : QWidget(parent)
    , ui(new Ui::ConstructComputer)
    , background(":/image/buildBackground.png")
    , computerCase(":/image/computerCase.png")
    , builtComputer(":/image/builtComputer.png")
    , cpuImg(":/image/cpu.png")
    , gpuImg(":/image/gpu.png")
    , ramImg(":/image/ram.png")
    , motherboardImg(":/image/motherboard.png")
{
    ui->setupUi(this);
    QString linen = "color: rgb(236, 231, 223); background: transparent;";
    ui->pcParts->setStyleSheet("background: transparent; border: none;");
    ui->pcParts->viewport()->setStyleSheet(linen);

    int textID = QFontDatabase::addApplicationFont(":/font/Electrolize-Regular.ttf");
    QString familyText = QFontDatabase::applicationFontFamilies(textID).at(0);
    electrolizeFont = QFont(familyText, 15);

    // ---- Styling for the ui widgets ----
    ui->pcParts->setStyleSheet(
        "QScrollArea {" // Style the QScrollArea widget itself
        "  background-color: rgba(23, 22, 20, 170);"
        "  border-radius: 15px;"
        "}"

        "QScrollArea QWidget {" // Targets all QWidgets *inside* the QScrollArea
        "  background-color: transparent;" // Make the internal content transparent
        "}"
        );

    ui->buildArea->setStyleSheet(
        "QWidget#buildArea {"
        "  background-color: rgba(255, 255, 255, 50);"
        "  border-radius: 15px;"
        "}"
        );

    ui->build->setStyleSheet(
        "QLabel#build {"
        "  background-color: transparent;" // Make the QLabel's background fully transparent
        "}"
        );

    // ---- Add parts container to QScrollArea ----
    QWidget* partsContainer = new QWidget();
    QVBoxLayout* partsLayout = new QVBoxLayout(partsContainer);
    partsLayout->setSpacing(5);

    ui->pcParts->setWidget(partsContainer);

    // ---- Display the computer case image to buildArea ----
    QPixmap scaled = computerCase.scaled(
        computerCase.width() * 1.4,
        computerCase.height() * 1.4,
        Qt::KeepAspectRatio,
        Qt::SmoothTransformation
        );

    ui->build->setPixmap(scaled);
    ui->build->setAlignment(Qt::AlignCenter);

    ui->pcParts->setWidget(partsContainer);

    // ---- Creating the pc parts and adding to the pcParts ----
    cpuBtn = new QPushButton();
    gpuBtn = new QPushButton();
    ramBtn = new QPushButton();
    motherboardBtn = new QPushButton();

    partsLayout->addWidget(createPart(motherboardBtn, "Motherboard", motherboardImg), 0, Qt::AlignHCenter);
    partsLayout->addWidget(createPart(cpuBtn, "CPU", cpuImg), 0, Qt::AlignHCenter);
    partsLayout->addWidget(createPart(ramBtn, "RAM", ramImg), 0, Qt::AlignHCenter);
    partsLayout->addWidget(createPart(gpuBtn, "GPU", gpuImg), 0, Qt::AlignHCenter);

    // display the motherboard in the buildArea
    motherboardLabel = new QLabel(ui->buildArea);
    motherboardLabel->setPixmap(motherboardImg.scaled(350, 350, Qt::KeepAspectRatio, Qt::SmoothTransformation));
    motherboardLabel->setAttribute(Qt::WA_TranslucentBackground);
    motherboardLabel->adjustSize();
    motherboardLabel->setVisible(false); // initially hide until user presses motherboard button

    // display the cpu in the buildArea
    cpuLabel = new QLabel(ui->buildArea);
    cpuLabel->setPixmap(cpuImg.scaled(100, 100, Qt::KeepAspectRatio, Qt::SmoothTransformation));
    cpuLabel->setAttribute(Qt::WA_TranslucentBackground);
    cpuLabel->adjustSize();
    cpuLabel->setVisible(false);

    // display the ram in the buildArea
    ramLabel = new QLabel(ui->buildArea);

    QTransform transform;
    // translate to the center of the image, rotate, and translate back
    transform.translate(ramImg.width() / 2.0, ramImg.height() / 2.0);
    transform.rotate(90.0); // Rotate by 90 degrees
    transform.translate(-ramImg.width() / 2.0, -ramImg.height() / 2.0);

    QPixmap rotatedRamImg = ramImg.transformed(transform, Qt::SmoothTransformation);

    ramLabel->setPixmap(rotatedRamImg.scaled(140, 140, Qt::KeepAspectRatio, Qt::SmoothTransformation));
    ramLabel->setAttribute(Qt::WA_TranslucentBackground);
    ramLabel->adjustSize();
    ramLabel->setVisible(false);

    // display the gpu in the buildArea
    gpuLabel = new QLabel(ui->buildArea);
    gpuLabel->setPixmap(gpuImg.scaled(300, 300, Qt::KeepAspectRatio, Qt::SmoothTransformation));
    gpuLabel->setAttribute(Qt::WA_TranslucentBackground);
    gpuLabel->adjustSize();
    gpuLabel->setVisible(false);

    // ---- Connections from the parts buttons to display them in the buildArea ----
    connect(cpuBtn,
            &QPushButton::clicked,
            this,
            [this]() {
                this->cpuLabel->show();
                this->cpuBtn->setDisabled(true);

                checkAllPartsAdded();
            });

    connect(gpuBtn,
            &QPushButton::clicked,
            this,
            [this]() {
                this->gpuLabel->show();
                this->gpuBtn->setDisabled(true);

                checkAllPartsAdded();
            });

    connect(ramBtn,
            &QPushButton::clicked,
            this,
            [this]() {
                this->ramLabel->show();
                this->ramBtn->setDisabled(true);

                checkAllPartsAdded();
            });

    connect(motherboardBtn,
            &QPushButton::clicked,
            this,
            [this]() {
                this->motherboardLabel->show();
                this->motherboardBtn->setDisabled(true);

                checkAllPartsAdded();
            });

    // display the built pc once all the parts have been added
    connect(this,
            &ConstructComputer::allPartsAdded,
            this,
            &ConstructComputer::displayBuiltComputer);

    //Info for each PC part button
    //CPU
    connect(cpuBtn, &QPushButton::clicked, this, [this]() {
        emit onInfoTitleTextChanged("Central processing unit (CPU)");
        emit onInfoTextChanged(
            "The CPU behaves like the computer's brain. It fetches and executes instructions, using internal circuits such as an arithmetic and logic unit and small, fast storage called registers. Its speed is measured in gigahertz, which describes how many cycles of work it can complete each second. "
            "More powerful CPUs can handle demanding tasks like games or video and photo editing, but they also draw more electrical power and create more heat, so they require better cooling and use more energy overall."
            );
    });
    //GPU
    connect(gpuBtn, &QPushButton::clicked, this, [this]() {
        emit onInfoTitleTextChanged("Graphics processing unit (GPU)");
        emit onInfoTextChanged(
            "The GPU is specialized hardware for drawing images, video, and animation. It rapidly performs many small calculations in parallel, which is why it is so important for games and other graphics-heavy applications. "
            "Modern high-end GPUs can use a lot of electricity and produce substantial heat. They enable smooth visuals and 3D worlds, but they also contribute to a computer's overall power use and cooling needs."
            );
    });
    //RAM
    connect(ramBtn, &QPushButton::clicked, this, [this]() {
        emit onInfoTitleTextChanged("Random access memory (RAM)");
        emit onInfoTextChanged(
            "RAM is short-term working memory for the computer. It temporarily holds the data and programs that are currently in use so the CPU can reach them quickly. RAM is much faster than long-term storage, but its contents are lost when the computer is turned off. "
            "Having more RAM lets a computer keep more apps and files open without slowing down. Too little RAM forces the system to swap data to disk, which feels much slower to the user."
            );
    });

    //Motherboard
    connect(motherboardBtn, &QPushButton::clicked, this, [this]() {
        emit onInfoTitleTextChanged("Motherboard");
        emit onInfoTextChanged(
            "The motherboard is the main circuit board that ties the whole computer together. It provides power and communication paths for the CPU, memory, storage, and expansion cards so that all the parts can work as one system. "
            "Desktop motherboards are often designed so parts can be replaced or upgraded, which can extend the life of the computer. In many laptops, more components are permanently attached, which makes repairs and upgrades harder."
            );
    });
}

void ConstructComputer::paintEvent(QPaintEvent* event) {
    Q_UNUSED(event);

    QPainter painter(this);

    // paint background scaled to widget size
    painter.drawPixmap(rect(), background);
}

QWidget* ConstructComputer::createPart(QPushButton* btn, QString partName, QPixmap partImg)
{
    QWidget* part = new QWidget();
    QVBoxLayout* partLayout = new QVBoxLayout(part);

    // create the button icon
    btn->setIcon(QIcon(partImg));
    btn->setIconSize(QSize(120, 120));
    btn->setFixedSize(120, 120);

    // create the label
    QLabel* lbl = new QLabel(partName);
    lbl->setFont(electrolizeFont);
    lbl->setStyleSheet("color: rgb(236, 231, 223); background: transparent;");
    lbl->setFixedWidth(120); // match the label width to the button width
    lbl->setAlignment(Qt::AlignCenter);

    // add button and label to partLayout
    partLayout->addWidget(btn);
    partLayout->addWidget(lbl);

    return part;
}

void ConstructComputer::checkAllPartsAdded() {
    partsAdded++;
    emit partAdded(partsAdded);
    if (partsAdded == 4) {
        QTimer::singleShot(1500, this, &ConstructComputer::allPartsAdded);
    }
}

void ConstructComputer::displayBuiltComputer()
{
    cpuLabel->hide();
    gpuLabel->hide();
    ramLabel->hide();
    motherboardLabel->hide();

    QPixmap img = builtComputer.scaled(
        computerCase.width() * 1.4,
        computerCase.height() * 1.4,
        Qt::KeepAspectRatio,
        Qt::SmoothTransformation
        );

    // display the built computer in the buildArea
    ui->build->setPixmap(img);
}

void ConstructComputer::resizeEvent(QResizeEvent* event)
{
    QWidget::resizeEvent(event);
    repositionParts();
}

void ConstructComputer::showEvent(QShowEvent *event)
{
    QWidget::showEvent(event);
    QTimer::singleShot(0, this, [this]() {
        repositionParts();
    });

    emit onCurrentGoalTextChanged("Build the computer: Click each component to learn what it does and add it to your computer.");
}

void ConstructComputer::repositionParts()
{
    int w = ui->build->width();
    int h = ui->build->height();

    motherboardLabel->move(w * 0.337, h * 0.165);
    cpuLabel->move(w * 0.479, h * 0.281);
    ramLabel->move(w * 0.563, h * 0.231);
    gpuLabel->move(w * 0.357, h * 0.363);
}

ConstructComputer::~ConstructComputer()
{
    delete ui;
}



