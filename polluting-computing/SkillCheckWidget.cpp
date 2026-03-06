#include "SkillCheckWidget.h"

SkillCheckWidget::SkillCheckWidget(QWidget *parent)
    : QDialog{parent}
    , barPosition(0)
    , barSpeed(6)
{
    setFixedSize(300, 80);
    setModal(true);
    setWindowTitle("Skill Check");
    greenArea = QRect(120, 20, 40, 40);
    connect(&timer, &QTimer::timeout, [&](){
        barPosition += barSpeed;
        if(barPosition < 0 || barPosition + 20 > width()){
            barSpeed = -barSpeed;
        }
        update();
    });
    timer.start(10);
}

void SkillCheckWidget::paintEvent(QPaintEvent*){
    QPainter painter(this);
    painter.fillRect(rect(), QColor(40,40,40));
    painter.fillRect(greenArea, QColor(0,200,0));
    QRect bar(barPosition, 20, 20 , 40);
    painter.fillRect(bar, QColor(200,200,0));

    painter.setPen(Qt::white);
    painter.setFont(QFont("Arial", 10));
    painter.drawText(rect(), Qt::AlignTop | Qt::AlignHCenter,
                     "Press SPACE when the bar is in the green area");
}

void SkillCheckWidget::keyPressEvent(QKeyEvent *event){
    if (event->key() == Qt::Key_Space) {
        checkPosition();
        event->accept();
        return;
    }
    QWidget::keyPressEvent(event);
}

void SkillCheckWidget::checkPosition(){
    QRect bar(barPosition, 20, 20 , 40);
    if(greenArea.intersects(bar)){
        emit finished(true);
    } else {
        emit finished(false);
    }
    close();
}
