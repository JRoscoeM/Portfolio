/// Authors: Jeniene Saoit and Roscoe Moedl
/// Date: October 28, 2025
/// A6: Qt Simon Game

#include "mainwindow.h"
#include "./ui_mainwindow.h"
#include <QTimer>
#include <QKeyEvent>

#include <iostream>

MainWindow::MainWindow(Model& model, QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    isPlayerTurn = false;

    ui->startButton->setStyleSheet(activeStart);
    ui->blueButton->setStyleSheet(inactiveBlue);
    ui->redButton->setStyleSheet(inactiveRed);

    connect(ui->startButton,
            &QPushButton::clicked,
            this,
            &MainWindow::setStartGameUiState);

    connect (ui->startButton,
            &QPushButton::clicked,
            &model,
            &Model::startGame);

    connect(&model,
            &Model::signalToDisplayFlash,
            this,
            &MainWindow::setButtonFlash);

    connect(&model,
            &Model::startPlayerTurn,
            this,
            [this] () { enableRedBlueButtons(); });

    connect(ui->blueButton,
            &QPushButton::clicked,
            this,
            [this]() {
                emit buttonClicked(ButtonColor::BLUE);
            });

    connect(ui->redButton,
            &QPushButton::clicked,
            this,
            [this]() {
                emit buttonClicked(ButtonColor::RED);
            });

    connect(this,
            &MainWindow::buttonClicked,
            &model,
            &Model::performPlayerTurn);

    connect(&model,
            &Model::signalProgressChanged,
            this,
            [this] (int progress) {
                ui->progressBar->setValue(progress);
            });

    connect(&model,
            &Model::startComputerTurnSignal,
            this,
            &MainWindow::setComputerTurnUiState);

    connect(&model,
            &Model::signalGameEnded,
            this,
            &MainWindow::setGameOverUiState);

    connect(&model,
            &Model::signalProgressChanged,
            this,
            [this](int progress) {
                QString myStr = QString::number(progress);
                ui->progressPercent->setText(myStr + "%");
            });

    connect(&model,
            &Model::signalRoundEnded,
            this,
            [this] () { disableRedBlueButtons(); });

    connect(&model,
            &Model::signalToRevertFlash,
            this,
            &MainWindow::revertButtonFlash);

    connect(&model,
            &Model::signalToUpdateRound,
            this,
            [this] (int round) {
                QString roundStr = QString::number(round);
                ui->round->setText("Round: " + roundStr);
            });
}

void MainWindow::setButtonFlash(ButtonColor btnColor) {
    if (btnColor == ButtonColor::BLUE) {
        ui->blueButton->setStyleSheet(flashBlue);
    } else {
        ui->redButton->setStyleSheet(flashRed);
    }
}
void MainWindow::revertButtonFlash(ButtonColor btnColor) {
    if (btnColor == ButtonColor::BLUE) {
        ui->blueButton->setStyleSheet(inactiveBlue);
    } else {
        ui->redButton->setStyleSheet(inactiveRed);
    }
}
void MainWindow::setStartGameUiState(){
    ui->startButton->setEnabled(false);
    ui->startButton->setStyleSheet(inactiveStart);

    ui->gameStatus->setText(QString("Game in Progress"));
}
void MainWindow::setComputerTurnUiState(){
    disableRedBlueButtons();

    ui->progressBar->setValue(0);
    ui->progressPercent->setText("0%");
}

void MainWindow::setGameOverUiState() {
    disableRedBlueButtons();
    ui->startButton->setEnabled(true);
    ui->startButton->setStyleSheet(activeStart);

    ui->gameStatus->setText("Game Over. Press start to try again.");
    ui->round->setText("Simon Game");
}

// private helper methods
void MainWindow::enableRedBlueButtons() {
    ui->blueButton->setEnabled(true);
    ui->redButton->setEnabled(true);

    ui->blueButton->setStyleSheet(activeBlue);
    ui->redButton->setStyleSheet(activeRed);

    isPlayerTurn = true;
}

void MainWindow::disableRedBlueButtons() {
    ui->blueButton->setEnabled(false);
    ui->redButton->setEnabled(false);

    ui->redButton->setStyleSheet(inactiveRed);
    ui->blueButton->setStyleSheet(inactiveBlue);

    isPlayerTurn = false;
}

void MainWindow::keyPressEvent(QKeyEvent *event) {
    if (isPlayerTurn) {
        if (event->key() == Qt::Key_Left) {
            emit MainWindow::buttonClicked(ButtonColor::RED);
        }
        if (event->key() == Qt::Key_Right) {
            emit MainWindow::buttonClicked(ButtonColor::BLUE);
        }
    }
    else {
        // ignore key press when it is not the player's turn
        event->ignore();
    }
}

MainWindow::~MainWindow()
{
    delete ui;
}
