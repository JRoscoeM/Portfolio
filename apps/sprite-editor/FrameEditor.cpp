#include "FrameEditor.h"
#include <iostream>
using std::cout;
using std::endl;

FrameEditor::FrameEditor(Sprite* model, QWidget* parent)
    : QWidget(parent), m(model)
{
}

void FrameEditor::loadFrame(Frame* frame)//should only load frame if that is what is being displayed
{
    currentFrame = frame; // store the pointer, not the QImage
    update();
}

void FrameEditor::drawGrid(int n)
{
    gridSize = n;
    update(); // trigger repaint
}

void FrameEditor::clearFrame()
{
    currentFrame->getImage().fill(Qt::transparent); // set background to transparent
    update();
}

void FrameEditor::undoFrame()
{
    if (currentFrame)
    {
        //calls undo frame from the frame class
        currentFrame->undoFrame();
        update();
    }
}

void FrameEditor::redoFrame()
{
    if (currentFrame)
    {
        currentFrame->redoFrame();
        update();
    }
}

void FrameEditor::mousePressEvent(QMouseEvent *event)
{
    if (!isDrawingEnabled || !currentFrame) return;
    currentFrame->saveToHistory();
    if (event->button() == Qt::LeftButton)
    {
        currentFrame->saveToHistory();
        isDrawing = true;
        fillCellAt(event->pos());
    }
}

void FrameEditor::mouseMoveEvent(QMouseEvent *event)
{
    if (!isDrawingEnabled || !currentFrame) return;
    if ((event->buttons() & Qt::LeftButton) && isDrawing)
    {
        fillCellAt(event->pos());
    }
}

void FrameEditor::mouseReleaseEvent(QMouseEvent *event)
{
    if (!isDrawingEnabled || !currentFrame) return;
    if (event->button() == Qt::LeftButton && isDrawing)
    {
        isDrawing = false;
    }
}

// Helper method, not a slot
void FrameEditor::fillCellAt(const QPoint &pos)
{
    if (!currentFrame || gridSize <= 0) return;

    int gridX = static_cast<int>(pos.x() * gridSize / static_cast<double>(width()));
    int gridY = static_cast<int>(pos.y() * gridSize / static_cast<double>(height()));

    gridX = std::clamp(gridX, 0, gridSize - 1);
    gridY = std::clamp(gridY, 0, gridSize - 1);

    if (gridX == lastGridX && gridY == lastGridY) return;
    lastGridX = gridX;
    lastGridY = gridY;

    QImage &image = currentFrame->getImage();
    QPainter painter(&image);

    QColor drawColor = m->getActiveToolColor();
    int toolSize = m->getToolSize();
    painter.setCompositionMode(QPainter::CompositionMode_Source);
    painter.fillRect(gridX, gridY, toolSize, toolSize, drawColor);

    update();
}

void FrameEditor::paintEvent(QPaintEvent* event)
{
    if (!currentFrame) return;
    QPainter painter(this);

    // target = widget rect, source = full image rect
    const QRect target = this->rect();
    const QRect source = currentFrame->getImage().rect();
    painter.drawImage(target, currentFrame->getImage(), source);

    // draw grid lines on top (use the SAME target rect dims)
    if (gridSize > 0)
    {
        const double cellW = static_cast<double>(target.width())  / gridSize;
        const double cellH = static_cast<double>(target.height()) / gridSize;
        painter.setPen(Qt::black); //Color of the grid overlay
        for (int i = 0; i <= gridSize; ++i)
        {
            int x = static_cast<int>(target.left() + i * cellW);
            int y = static_cast<int>(target.top()  + i * cellH);
            painter.drawLine(x, target.top(), x, target.bottom());
            painter.drawLine(target.left(), y, target.right(), y);
        }
    }
    emit frameEdited(currentFrame);
}

QSize FrameEditor::sizeHint() const
{
    int side = 400; // default square size
    return QSize(side, side);
}

QSize FrameEditor::minimumSizeHint() const
{
    return QSize(128, 128); // smallest allowed square
}

void FrameEditor::resizeEvent(QResizeEvent *event)
{
    // Force square shape
    int side = qMin(width(), height());
    resize(side, side);

    update();
    QWidget::resizeEvent(event);
}
