/**
 * @file FrameEditor.h
 *
 * @author Vi Cao, Bianca Ravago, Jeniene Saoit, Cheyenne Strongo, Josh Burrup, Roscoe Moedl
 * Reviewed by: Roscoe Moedl and Jeniene Saoit
 * @date 2025-11-13
 */
#ifndef FRAMEEDITOR_H
#define FRAMEEDITOR_H

#include "Sprite.h"
#include "Frame.h"
#include <QWidget>
#include <QImage>
#include <QMouseEvent>
#include <QPainter>
#include <QPoint>
#include <QGraphicsScene>

/**
 * @brief The FrameEditor class This custom widget allows the user to draw on a single frame.
 */
class FrameEditor : public QWidget
{
    Q_OBJECT

private:
    int lastGridX = -1; // Represents the most recent gridSize. Initialized to -1 until changed.
    int lastGridY = -1; // Represents the most recent gridSize. Initialized to -1 until changed.

    Sprite* m = nullptr; // A pointer to our model that holds frame data
    Frame* currentFrame = nullptr; // Points to the Frame currently being edited
    bool isDrawing = false; // A flag to track if a drawing is in progress
    QPoint lastPoint; // The last mouse position during a stroke
    QColor myToolColor; // The current tool color
    int myToolSize; // The current tool size
    int gridSize;  // Permanent nxn pixel size for entire sprite

    /**
     * @brief fillCellAt A helper method for mouse events to scale and translate the pixel grid
     * @param pos Position of the mouse on the panel
     */
    void fillCellAt(const QPoint &pos);

public:
    bool isDrawingEnabled = false; // False until user accepts a grid size. Also cannot load until grid size chosen

    /**
     * @brief FrameEditor Constructs a FrameEditor widget.
     * @param model A pointer to the Sprite model for accessing data from the current displayed frame.
     * @param parent Inherited from QWidget.
     */
    explicit FrameEditor(Sprite* model, QWidget* parent = nullptr);

    /**
     * @brief clearFrame Clears the frame by making all pixels in grid transparent
     */
    void clearFrame();

    /**
     * @brief undoFrame Undoes the current drawing to the most previous edits
     */
    void undoFrame();

    /**
     * @brief redoFrame sets the frame to the frame you had before redoing
     */
    void redoFrame();

public slots:
    /**
     * @brief loadFrame loads the frame into view
     * @param frame
     */
    void loadFrame(Frame* frame);

    /**
     * @brief drawGrid Slot to draw the Grid in the Frame Editor. Not apart of Frame.
     * @param n int representing the nxn grid size
     */
    void drawGrid(int n);

signals:
    /**
     * @brief frameEdited A signal emitted when a frame is edited
     * @param frameEdited The edited frame
     */
    void frameEdited(Frame* frameEdited);

protected:
    /**
     * @brief mousePressEvent Handles when left mouse button is pressed. Used to start a drawing stroke.
     * @param event
     */
    void mousePressEvent(QMouseEvent *event) override;

    /**
     * @brief mouseMoveEvent Handles when the mouse moves while the left mouse button is held down. Used
     *                       to draw a line segment if drawing is in progress.
     * @param event
     */
    void mouseMoveEvent(QMouseEvent *event) override;
    /**
     * @brief mouseReleaseEvent Handles when the left mouse button is released. Used to finish a drawing stroke.
     * @param event
     */
    void mouseReleaseEvent(QMouseEvent *event) override;

    /**
     * @brief paintEvent Draws the current Frame after edits and overlays a black grid over it
     * @param event Unused in implemntation
     */
    void paintEvent(QPaintEvent *event) override;

    /**
     * @brief sizeHint Sets up a default nxn grid size for the editing panel
     * @return Qsize Default size (400x400)
     */
    QSize sizeHint() const override;

    /**
     * @brief minimumSizeHint Returns the smallest the nxn grid can get on screen
     * @return Qsize (128x128)
     */
    QSize minimumSizeHint() const override;

    /**
     * @brief resizeEvent Handles resizing the window
     * @param event
     */
    void resizeEvent(QResizeEvent *event) override;
};

#endif // FRAMEEDITOR_H
