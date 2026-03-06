/**
 * @file mainwindow.h
 *
 * @author Vi Cao, Bianca Ravago, Jeniene Saoit, Cheyenne Strongo, Josh Burrup, Roscoe Moedl
 * Reviewed by: Roscoe Moedl and Bianca Ravago
 * @date 2025-11-13
 */
#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QColorDialog>
#include <QFileDialog>
#include <QColor>
#include <QPalette>
#include <QLabel>
#include <QVBoxLayout>
#include <QScrollArea>
#include "Sprite.h"
#include "FrameEditor.h"
#include "FramePreview.h"

/**
 * @brief The FrameWidget Widget to hold the Frame.
 */
struct FrameWidget {
    QLabel* thumbnail; // A preview image of what drawing this frame contains
    QLabel* label; // The label stating which frame it is on
};

QT_BEGIN_NAMESPACE
namespace Ui
{
class MainWindow;
}
QT_END_NAMESPACE

/**
 * @brief This Sprite Editor follows the Model-View development model. This MainWindow class is the implementation of the View.
 */
class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    /**
     * @brief Constructs an instance of the MainWindow type and sets the necessary ui-related values for elements of MainWindow.
     * @param parent Allows this MainWindow class to be a part of the Qt hierarchy for the purposes of event handling and automatic memory management.
     */
    MainWindow(Sprite* model, QWidget *parent = nullptr);

    /**
     * Destructs an instance of MainWindow.
     */
    ~MainWindow();

private:
    Ui::MainWindow *ui; // Accesses the ui buttons and other elements
    FrameEditor* frameEditor; // FrameEditor object to access methods and variables
    QVector<FrameWidget> framePreviews; // A vector holding all the frames to preview
    QWidget* scrollWidget; // The widget used to scroll when frames are added to the side bar
    QVBoxLayout* scrollLayout; // The layout Q object to hold the section of the scrollable area
    QScrollArea* QScrollArea; // QObject that holds the scrollable area
    FramePreview* framePreview; // Used to access framePreview variables and methods

signals:
    /**
     * @brief gridSizeChanged signals to change the size of the grid based on the newSize parameter
     * @param newSize the desired new size to change the grid to.
     */
    void gridSizeChanged(int newSize);
};
#endif // MAINWINDOW_H
