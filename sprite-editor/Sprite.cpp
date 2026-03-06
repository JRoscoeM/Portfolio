#include <QPainter>
#include <QMouseEvent>
#include <QPixmap>
#include <algorithm>
#include "Sprite.h"
#include "Frame.h"

Sprite::Sprite(QWidget* parent)
{
    Q_UNUSED(parent);

    Sprite::frames = {};
    gridSize = 32; // default size, doesn't matter yet

    QPixmap brushImg(":/icons/Resources/images/brush.png");
    QPixmap eraserImg(":/icons/Resources/images/eraser.png");

    //scaling the image to be as small as the cursor
    brushImg = brushImg.scaled(32, 32, Qt::KeepAspectRatio, Qt::SmoothTransformation);
    eraserImg = eraserImg.scaled(32, 32, Qt::KeepAspectRatio, Qt::SmoothTransformation);

    //create cursor from the img
    brushCursor  = QCursor(brushImg, 0, 32); // start from tip?
    eraserCursor = QCursor(eraserImg, 16, 16); // start from center?

    setCursor(brushCursor);

    // Create the placeholder
    Frame* placeholder = new Frame(gridSize);
    frames.append(placeholder);
    currentFrame = placeholder; // store it (see below)

    activeTool = Tool::Brush; // the current tool color - brush by default
    selectedBrushColor = Qt::black; // the current brush color - black by default
    activeToolColor = selectedBrushColor; // the tool color, either set to the selected color (brush) or transparent (eraser).
    toolSize = 1;

    // timer setup
    previewTimer = new QTimer(this);
    connect(previewTimer, &QTimer::timeout, this, &Sprite::nextPreviewFrame);

    previewTimer->start(fpsInterval);
}

int Sprite::getGridSize() const
{
    return gridSize;
}

void Sprite::addFrame()
{
    Frame* newFrame = new Frame(gridSize);
    frames.append(newFrame);

    currentFrame = newFrame;
    emit frameAdded(currentFrame);
}

void Sprite::duplicateFrame()
{
    Frame* newFrame = new Frame(*currentFrame);
    frames.append(newFrame);
    currentFrame = newFrame;
    emit frameAdded(currentFrame);
}

void Sprite::removeFrame()
{
    if (frames.size() <= 1)
        return;

    int deletedFrameIndex = frames.indexOf(currentFrame);
    // Remove moves the value(s) to be deleted to the end, and erase deletes all values between the iterator returned by remove and frames.end().
    frames.erase(std::remove(frames.begin(), frames.end(), currentFrame), frames.end());
    currentFrame = frames[deletedFrameIndex - 1];
    emit frameRemoved(currentFrame, deletedFrameIndex);
}

void Sprite::goToPreviousFrame()
{
    int indexOfCurrent = std::distance(frames.begin(), std::find(frames.begin(), frames.end(), currentFrame));

    if (indexOfCurrent > 0) {
        Frame* previousFrame = frames[indexOfCurrent - 1];
        currentFrame = previousFrame;

        emit currentFrameHasChanged(previousFrame);
    }
}

void Sprite::goToNextFrame()
{
    int indexOfCurrent = std::distance(frames.begin(), std::find(frames.begin(), frames.end(), currentFrame));
    if (indexOfCurrent + 1 < frames.size()) {
        Frame* nextFrame = frames[indexOfCurrent + 1];
        currentFrame = nextFrame;

        emit currentFrameHasChanged(nextFrame);
    }
}

void Sprite::onSetSizeClicked(int size)
{
    gridSize = size;

    frames.pop_front(); // Remove the placeholder Frame before adding for the first time.

    Frame* newFrame = new Frame(size);
    frames.append(newFrame);
    currentFrame = newFrame; // track currently displayed frame

    emit frameAdded(newFrame);
    emit gridSizeChanged(size);
}

// for each frame in frames, add it to a json array and then save it all and save to file
void Sprite::setActiveTool(Tool newTool)
{
    if (activeTool == newTool)
        return;

    activeTool = newTool;

    if (activeTool == Tool::Brush)
    {
        activeToolColor = selectedBrushColor;
        setCursor(brushCursor);
    } else if (activeTool == Tool::Eraser)
    {
        activeToolColor = Qt::transparent;
        setCursor(eraserCursor);
    }
    emit activeToolChanged(activeTool);
}

void Sprite::setSelectedBrushColor(const QColor& newColor)
{
    if (selectedBrushColor == newColor)
        return;

    selectedBrushColor = newColor;

    if (activeTool == Tool::Brush)
        activeToolColor = selectedBrushColor;

    emit selectedBrushColorChanged(selectedBrushColor);
}

void Sprite::setToolSize(int newSize)
{
    if (toolSize == newSize || newSize < 1)
        return;

    toolSize = newSize;
    emit toolSizeChanged(toolSize);
}

void Sprite::setFrameRate(int newFps)
{
    if (fps == newFps || newFps < 1)
        return;

    fps = newFps;
    fpsInterval = 1000 / fps;
    previewTimer->setInterval(fpsInterval);
}

void Sprite::nextPreviewFrame()
{
    if (frames.isEmpty())
        return;

    if (previewFrameIndex >= frames.size())
        previewFrameIndex = 0;

    Frame* frameToDisplay = frames[previewFrameIndex];
    if (frameToDisplay)
        emit displayPreviewFrame(frameToDisplay->getImage());

    previewFrameIndex++;
    if (previewFrameIndex >= frames.size())
        previewFrameIndex = 0; // Reset loop

}

void Sprite::save(QString fileName)
{
    QJsonObject json;
    QJsonArray frameArray;
    for(Frame* f : frames)
    {
        QJsonObject frameJson = f->toJson();
        frameArray.append(frameJson);
    }
    json["size"] = getGridSize();
    json["frames"] = frameArray;
    QJsonDocument doc(json);
    QFile file(fileName);
    if (!file.open(QIODevice::WriteOnly))
    {
        return;
    }

    file.write(doc.toJson());
    file.close();
}

void Sprite::load(QString fileName)
{
    QFile file(fileName);
    if (!file.open(QIODevice::ReadOnly))
    {
        return;
    }
    QByteArray byteArray = file.readAll();
    file.close();
    QJsonDocument doc = QJsonDocument::fromJson(byteArray);
    QJsonObject json = doc.object();
    if(getGridSize() != json["size"].toInt())
    {
        return;
    }
    QJsonArray frameArray = json["frames"].toArray();
    for (const QJsonValue &val : frameArray)
    {
        QJsonObject frameObject = val.toObject();
        Frame *frame = new Frame(frameObject, getGridSize());
        frames.append(frame);
        currentFrame = frame;
        emit frameAdded(currentFrame);
        emit unlockCanvas(getGridSize());
    }
}
