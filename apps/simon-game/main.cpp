/// Authors: Jeniene Saoit and Roscoe Moedl
/// GitHub Usernames: jeniene_saoit, JRoscoeM
/// Date: October 28, 2025
/// A6: Qt Simon Game

/// Creative Element:
/// Using right and left arrow keys to press the red and blue buttons.
/// A round counter, which displays "Simon Game" when the game is inactive.


#include "mainwindow.h"

#include <QApplication>

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);

    Model m;
    MainWindow w(m);

    w.show();
    return a.exec();
}
