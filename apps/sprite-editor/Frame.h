/**
 * @file Frame.h
 *
 * @author Vi Cao, Bianca Ravago, Jeniene Saoit, Cheyenne Strongo, Josh Burrup, Roscoe Moedl
 * Reviewed by: Cheyenne Strongo and Bianca Ravago
 * @date 2025-11-13
 */
#ifndef FRAME_H
#define FRAME_H

#include <QWidget>
#include <QColor>
#include <QImage>
#include <QPoint>
#include <QStack>
#include <QJsonObject>
#include <QBuffer>
#include <QByteArray>

/**
 * @brief The Frame class represents a single frame of a Sprite. A Sprite may contain multiple frames for the purpose of animating the Sprite.
 *          The Frame class tracks it's recent previous states which may be used for the undo/redo functionality. The Frame class has bools which
 *          track it's state and overrides several QEvents.
 */
class Frame
{
    int gridSize; // Represents the size of the frame editor in our own pixels. Default is 32, can be 16, 32, or 64
    QImage frame; // Stores the frame being drawn by the user
    QStack<QImage> history; // stores all the rpevious edits
    QStack<QImage> redoHistory; //the stack that holds the frames for redoing

public:
    /**
     * @brief Frame Constructor for making the QImage frame (canvas) that takes in the size of the Frame.
     * @param size int representing size of the frame in n x n pixels. To be set to gridSize
     */
    Frame(int size);
    Frame(const QJsonObject &json, int size);
    Frame(const Frame& other);

    /**
     * @brief undoFrame Undoes the most recent tool changes to the current frame
     */
    void undoFrame();

    /**
     * @brief redoFrame Sets the frame back to the previous frame state
     */
    void redoFrame();

    /**
     * @brief getImage Gets the image to use
     *
     * @return the image to be used
     */
     QImage& getImage() { return frame; };

     /**
     * @brief getImage Gets the image to use, uses frame above
     *
     * @return the image to be used
     */
     const QImage& getImage() const { return frame; }

    /**
     * @brief getGridSize
     * @return Returns the gridsize
     */
     int getGridSize() const { return gridSize; };

    /**
     * @brief saveToHistory method to update the history storage for undo and redo
     */
    void saveToHistory();

    /**
     * @brief toJson converts the frame to JSON
     * @return returns the frame as a Json object
     */
    QJsonObject toJson();
};

#endif // FRAME_H
