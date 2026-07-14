/**
 * @file Sprite.h
 *
 * @author Vi Cao, Bianca Ravago, Jeniene Saoit, Cheyenne Strongo, Josh Burrup, Roscoe Moedl
 * Reviewed by: Roscoe Moedl and Bianca Ravago
 * @date 2025-11-13
 */
#ifndef SPRITE_H
#define SPRITE_H

#include <QWidget>
#include <QTimer>
#include <QVector>
#include <QColor>
#include <QImage>
#include <QPoint>
#include <QCursor>
#include <QJsonArray>
#include <QJsonObject>
#include <QJsonDocument>
#include <QFile>
#include <QByteArray>
#include <QBuffer>
#include "Frame.h"

enum Tool
{
    Eraser, Brush
};

/**
 * @brief This Sprite Editor follows the model-view development model. The Sprite class is the implementation of the model. It contains the
 *          the project's data members and logic.
 */
class Sprite : public QWidget
{
    Q_OBJECT

private:
    QVector<Frame*> frames;  // Vector to hold the current frames
    int gridSize; // An int representing the gridSize

    // a bunch of text like RGB number values, or a binary string with values, compressed string
    QCursor brushCursor; // Cursor to hold brushIcon when brush chosen
    QCursor eraserCursor; // Cursor to hold eraserIcon when eraser chosen

    Tool activeTool; // The current selected tool - brush or eraser
    QColor selectedBrushColor; // The selected culor for the brush tool
    QColor activeToolColor; // The current color of the active tool - transparent (eraser), selectedBrushColor (brush)
    int toolSize; // The current size of the tool

    // Data members for the preview widget
    int fps = 12; // Default fps is 12
    QTimer* previewTimer; // The timer used to display the preview at the desired frame rate
    int fpsInterval = 1000 / 12; // Used to set the interval of the timer based on the frame rate
    int previewFrameIndex = 0; // To keep track of the current frame to display

public:
    /**
     * @brief Sprite Constructs an instance of the Sprite class.
     * @param parent Allows this MainWindow class to be a part of the Qt hierarchy for the purposes of event handling and automatic memory management.
     */
    Sprite(QWidget *parent = nullptr);

    /**
     * @brief getGridSize A Getter for the size of the nxn grid of pixels
     * @return an int representing the nxn pixels of the grid
     */
    int getGridSize() const;

    /**
     * @brief getCurrentFrameIndex Getter for current frame's index in frame vector
     * @return int for index
     */
    int getCurrentFrameIndex() const { return frames.indexOf(currentFrame); }

    /**
     * @brief getAmountOfFrames Getter for how many active frames there are (frame vector size)
     * @return int for size
     */
    int getAmountOfFrames() const { return frames.size(); }

    /**
     * @brief getActiveToolColor Getter for the tool color being used currently
     * @return QColor. Transparent if eraser, any other color for brush
     */
    QColor getActiveToolColor() const { return activeToolColor; }

    /**
     * @brief getToolSize Getter for the current size of the tool (nxn)
     * @return an int representing the size of the tool
     */
    int getToolSize() const { return toolSize; }

private:
    Frame* currentFrame = nullptr; // Frame representing the current Frame being edited

signals:
    /**
     * @brief Emitted whenever a new Frame is added.
     * @param newFrame A pointer to the newly created frame.
     */
    void frameAdded(Frame* newFrame);

    /**
     * @brief frameRemoved Emitted when a Frame is deleted. Takes in a pointer to the first Frame so that it can be set
     *          as the active frame of FrameEditor.
     * @param firstFrame A pointer to the current frame in Frames.
     */
    void frameRemoved(Frame* currentFrame, int deletedFrameIndex);

    /**
     * @brief gridSizeChanged Signal emitted when the grid size gets chosen
     * @param newSize The new grid size as an int
     */
    void gridSizeChanged(int newSize);

    /**
     * @brief activeToolChanged Signal emitted when the active tool changes (from brush to eraser or vice versa).
     * @param newActiveTool Tool type wither eraser or brush
     */
    void activeToolChanged(Tool newActiveTool);

    /**
     * @brief selectedBrushColorChanged Signal emitted when the selectedBrushColorChanges (When any color is chosen other than transparent)
     * @param newSelectedBrushColor QColor representing the color
     */
    void selectedBrushColorChanged(const QColor& newSelectedBrushColor);

    /**
     * @brief toolSizeChanged A signal emitted when the toolSize changes in the ui slider
     * @param newToolSize An int representing the nxn tool size
     */
    void toolSizeChanged(int newToolSize);

    /**
     * @brief unlockCanvas Unlocks the canvas for loading when grid size is chosen
     * @param canvasSize int representing the nxn size
     */
    void unlockCanvas(int canvasSize);

    /**
     * @brief currentFrameHasChanged Used by previous and next frame functionality. Notifies the FrameEditor that it should change
     *          the frame currently being displayed to the param 'newCurrentFrame'.
     * @param newCurrentFrame The new Frame which FrameEditor should display.
     */
    void currentFrameHasChanged(Frame* newCurrentFrame);

    /**
     * @brief displayPreviewFrame Signal emitted to tell the FramePreview widget what image to display for the preview.
     * @param previewFrame The image being displayed on the widget.
     */
    void displayPreviewFrame(const QImage& previewFrame);

public slots:
    // slots for adding/removing frames
    /**
     * @brief This function is called when a user clicks add a new frame. It then adds a new frame.
     */
    void addFrame();
    /**
     * @brief Called when the user clicks the delete frame button. It removes the active Frame from frames and sets
     *          the active frame to the first Frame in frames.
     */
    void removeFrame();
    /**
     * @brief This function is called when a user clicks the duplicate frame button. It takes the current frame and makes a copy of it.
     */
    void duplicateFrame();

    // slots for going to previous or next frame
    /**
     * @brief goToPreviousFrame sets the frame which comes before the current frame as the new current Frame.
     */
    void goToPreviousFrame();

    /**
     * @brief goToNextFrame sets the frame which comes after the current frame as the new current Frame.
     */
    void goToNextFrame();

    // slot for setting the size of the frame
    /**
     * @brief onSetSizeClickedSlot Called when the user first sets the size. Replaces the placeholder frame with a newly created one of the correct dimensions.
     *          Emits FrameAdded and GridSizeChanged. Sets the current gridSize and current Frame for the Sprite Class.
     * @param size The size of the new frame.
     */
    void onSetSizeClicked(int size);

    // slots for saving/loading a sprite file
    /**
     * @brief Saves our current Sprite.
     */
    void save(QString fileName);
    /**
     * @brief Loads our current Sprite.
     */
    void load(QString fileName);

    // slots for setting the active tool, and tool color/size
    /**
     * @brief setActiveTool Slot to change the active (selected) tool.
     * @param newTool The new tool selected, either eraser or brush.
     */
    void setActiveTool(Tool newTool);
    /**
     * @brief setSelectedBrushColor Slot to change the brush tool's current color.
     * @param newColor The new color for the brush.
     */
    void setSelectedBrushColor(const QColor& newColor);
    /**
     * @brief setToolSize Slot to change the current tool size.
     * @param newSize The new size for the tool.
     */
    void setToolSize(int newSize);

    // slots for setting preview fps and sending frame to display
    /**
     * @brief setFrameRate Slot to set the 'fps' to the 'newFps' when the value is changed by the fps slider.
     * @param newFps The new fps for the preview.
     */
    void setFrameRate(int newFps);

    /**
     * @brief nextPreviewFrame This slot loops through the list of frames and gets the current frame, which is
     *        then sent to the FramePreview widget to be displayed.
     */
    void nextPreviewFrame();
};

#endif // SPRITE_H
