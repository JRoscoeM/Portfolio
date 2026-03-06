#include "Frame.h"
#include <QMouseEvent>
#include <QPaintEvent>
#include <QPainter>

Frame::Frame(int size)
    : gridSize(size),
    frame(size, size, QImage::Format_ARGB32)
{
    frame.fill(Qt::transparent);
}

Frame::Frame(const QJsonObject &json, int size)
    : gridSize(size),
    frame(size, size, QImage::Format_ARGB32)
{
    QByteArray byteArray = QByteArray::fromBase64(json["image"].toString().toLatin1());
    frame.loadFromData(byteArray, "PNG");
}

Frame::Frame(const Frame& other)
{
    gridSize = other.getGridSize();
    frame = other.getImage();
}

void Frame::undoFrame()
{
    if (!history.isEmpty())
    {
        redoHistory.push(frame);

        //sets the frame to the previous state stored in history pop
        frame = history.pop();
    }
}

void Frame::redoFrame()
{
    if (!redoHistory.isEmpty())
    {
        // Push the current frame back into history first
        history.push(frame);

        // Restore the redone frame
        frame = redoHistory.pop();
    }
}

void Frame::saveToHistory()
{
    history.push(frame);
    redoHistory.clear(); // once you draw again, redo history resets
}

QJsonObject Frame::toJson()
{
    QJsonObject json;
    QByteArray byteArray;
    QBuffer buffer(&byteArray);
    buffer.open(QIODevice::WriteOnly);
    frame.save(&buffer, "PNG");
    buffer.close();
    QString base64String = QString::fromLatin1(byteArray.toBase64());
    json["image"] = base64String;
    return json;
}
