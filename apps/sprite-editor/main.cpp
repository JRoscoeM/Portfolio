#ifdef __arm64__
#include <arm_acle.h>
#endif
#include "mainwindow.h"
#include <QApplication>

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    Sprite model;
    MainWindow w(&model);
    w.show();
    return a.exec();
}
