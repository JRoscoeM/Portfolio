#include "FramePreview.h"

FramePreview::FramePreview(QWidget* parent)
    : QWidget(parent)
{
}

void FramePreview::setImage(const QImage& preview)
{
    // sets previewFrame to the new image to be displayed and triggers a redraw.
    previewFrame = preview;
    update();
}

void FramePreview::frameToDisplay(const QImage& previewImage)
{
    setImage(previewImage);
}

void FramePreview::paintEvent(QPaintEvent *event) {
    Q_UNUSED(event);

    if (previewFrame.isNull())
        return;

    QPainter painter(this);

    // scale the image to fit the widget's size while maintaining aspect ratio
    QImage scaledImage = previewFrame.scaled(size(),
                                             Qt::KeepAspectRatio,
                                             Qt::SmoothTransformation);

    // calculate position to center the image
    int x = (width() - scaledImage.width()) / 2;
    int y = (height() - scaledImage.height()) / 2;

    // draw the scaled down image onto the widget
    painter.drawImage(x, y, scaledImage);

}
