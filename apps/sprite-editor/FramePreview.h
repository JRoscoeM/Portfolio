/**
 * @file FramePreview.h
 *
 * @author Vi Cao, Bianca Ravago, Jeniene Saoit, Cheyenne Strongo, Josh Burrup, Roscoe Moedl
 * Reviewed by: Vi Cao and Josh Burrup
 */
#ifndef FRAMEPREVIEW_H
#define FRAMEPREVIEW_H

#include <QWidget>
#include <QTimer>
#include <QPainter>

/**
 * @brief Declares the FramePreview class for displaying sprite frame previews in the UI.
 *
 * The FramePreview widget provides a visual representation of a sprite's current frame.
 * It listens for frame updates from the Sprite model and repaints the preview area accordingly.
 * The class handles image scaling and rendering to maintain consistent frame display size.
 */
class FramePreview : public QWidget
{
    Q_OBJECT

private:
    QImage previewFrame; // The image of the frame being displayed on the widget

    /**
     * @brief setImage Helper method for setting the image being displayed on the widget.
     *        This sets the frame to be displayed to the 'previewFrame' and calls to update
     *        the image.
     * @param preview The image to be displayed on the preview widget.
     */
    void setImage(const QImage& preview);

public:
    /**
     * @brief FramePreview Constructor for the FramePreview, used to create the custom widget..
     * @param parent The window that contains the FramePreview widget.
     */
    FramePreview(QWidget* parent = nullptr);

public slots:
    /**
     * @brief frameToDisplay A slot used to retrieve the image to be displayed from the model
     *        and update the image shown in the preview with the retrieved image (frame).
     * @param preview
     */
    void frameToDisplay(const QImage& preview);

protected:
    /**
     * @brief paintEvent Overridden method used to draw the pixels onto the QImage 'previewFrame'
     *                   This gets the 'previewFrame' and scales it down to the size of the widget,
     *                   and then draws the image from the center of the widget.
     * @param event
     */
    void paintEvent(QPaintEvent *event) override;
};

#endif // FRAMEPREVIEW_H
