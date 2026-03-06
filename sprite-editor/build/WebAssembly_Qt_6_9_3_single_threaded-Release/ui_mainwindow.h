/********************************************************************************
** Form generated from reading UI file 'mainwindow.ui'
**
** Created by: Qt User Interface Compiler version 6.9.3
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_MAINWINDOW_H
#define UI_MAINWINDOW_H

#include <QtCore/QVariant>
#include <QtGui/QAction>
#include <QtWidgets/QApplication>
#include <QtWidgets/QComboBox>
#include <QtWidgets/QFrame>
#include <QtWidgets/QGridLayout>
#include <QtWidgets/QGroupBox>
#include <QtWidgets/QHBoxLayout>
#include <QtWidgets/QLabel>
#include <QtWidgets/QMainWindow>
#include <QtWidgets/QMenu>
#include <QtWidgets/QMenuBar>
#include <QtWidgets/QPushButton>
#include <QtWidgets/QScrollArea>
#include <QtWidgets/QSlider>
#include <QtWidgets/QSpacerItem>
#include <QtWidgets/QStatusBar>
#include <QtWidgets/QVBoxLayout>
#include <QtWidgets/QWidget>

QT_BEGIN_NAMESPACE

class Ui_MainWindow
{
public:
    QWidget *centralwidget;
    QVBoxLayout *verticalLayout;
    QHBoxLayout *MenuBar;
    QPushButton *saveButton;
    QPushButton *loadButton;
    QSpacerItem *horizontalSpacer_2;
    QLabel *title;
    QSpacerItem *horizontalSpacer_3;
    QFrame *line;
    QHBoxLayout *MainPanel;
    QVBoxLayout *ToolPanel;
    QLabel *ToolPanelLabel;
    QFrame *line_5;
    QGroupBox *DrawingTools;
    QVBoxLayout *verticalLayout_4;
    QHBoxLayout *horizontalLayout;
    QSlider *toolSizeAdjuster;
    QLabel *toolSizeLabel;
    QPushButton *brushButton;
    QPushButton *eraseButton;
    QFrame *line_4;
    QGroupBox *colorPaletteBox;
    QGridLayout *gridLayout;
    QPushButton *purpleButton;
    QPushButton *greenButton;
    QPushButton *blueButton;
    QPushButton *orangeButton;
    QPushButton *blackButton;
    QPushButton *redButton;
    QPushButton *whiteButton;
    QPushButton *yellowButton;
    QPushButton *colorButton;
    QFrame *line_2;
    QGroupBox *canvasSizeGroupBox;
    QVBoxLayout *verticalLayout_2;
    QLabel *canvasSizeLabel;
    QComboBox *canvasSizeComboBox;
    QPushButton *canvasSizePushButton;
    QFrame *line_7;
    QSpacerItem *verticalSpacer;
    QFrame *line_8;
    QHBoxLayout *UndoRedo;
    QPushButton *undoButton;
    QPushButton *redoButton;
    QWidget *frameBox;
    QLabel *canvasSizeWarningLabel;
    QVBoxLayout *PreviewPanel;
    QLabel *Preview;
    QFrame *line_6;
    QWidget *previewWidget;
    QHBoxLayout *horizontalLayout_2;
    QSlider *fpsAdjuster;
    QLabel *fpsLabel;
    QFrame *line_3;
    QGroupBox *FrameControl;
    QVBoxLayout *verticalLayout_5;
    QHBoxLayout *AddDeleteFrames;
    QPushButton *deleteFrameButton;
    QPushButton *addFrameButton;
    QScrollArea *Frames;
    QWidget *FramesPreview;
    QHBoxLayout *horizontalLayout_3;
    QPushButton *previousFrame;
    QPushButton *nextFrame;
    QPushButton *duplicateFrameButton;
    QPushButton *clearFrameButton;
    QMenuBar *menubar;
    QMenu *menuSprite_Editor;
    QStatusBar *statusbar;

    void setupUi(QMainWindow *MainWindow)
    {
        if (MainWindow->objectName().isEmpty())
            MainWindow->setObjectName("MainWindow");
        MainWindow->resize(1101, 726);
        centralwidget = new QWidget(MainWindow);
        centralwidget->setObjectName("centralwidget");
        verticalLayout = new QVBoxLayout(centralwidget);
        verticalLayout->setObjectName("verticalLayout");
        MenuBar = new QHBoxLayout();
        MenuBar->setObjectName("MenuBar");
        saveButton = new QPushButton(centralwidget);
        saveButton->setObjectName("saveButton");

        MenuBar->addWidget(saveButton);

        loadButton = new QPushButton(centralwidget);
        loadButton->setObjectName("loadButton");

        MenuBar->addWidget(loadButton);

        horizontalSpacer_2 = new QSpacerItem(40, 20, QSizePolicy::Policy::Expanding, QSizePolicy::Policy::Minimum);

        MenuBar->addItem(horizontalSpacer_2);

        title = new QLabel(centralwidget);
        title->setObjectName("title");

        MenuBar->addWidget(title);

        horizontalSpacer_3 = new QSpacerItem(40, 20, QSizePolicy::Policy::Expanding, QSizePolicy::Policy::Minimum);

        MenuBar->addItem(horizontalSpacer_3);

        MenuBar->setStretch(2, 2);
        MenuBar->setStretch(4, 3);

        verticalLayout->addLayout(MenuBar);

        line = new QFrame(centralwidget);
        line->setObjectName("line");
        line->setFrameShape(QFrame::Shape::HLine);
        line->setFrameShadow(QFrame::Shadow::Sunken);

        verticalLayout->addWidget(line);

        MainPanel = new QHBoxLayout();
        MainPanel->setObjectName("MainPanel");
        ToolPanel = new QVBoxLayout();
        ToolPanel->setSpacing(7);
        ToolPanel->setObjectName("ToolPanel");
        ToolPanelLabel = new QLabel(centralwidget);
        ToolPanelLabel->setObjectName("ToolPanelLabel");
        ToolPanelLabel->setAlignment(Qt::AlignmentFlag::AlignCenter);

        ToolPanel->addWidget(ToolPanelLabel);

        line_5 = new QFrame(centralwidget);
        line_5->setObjectName("line_5");
        line_5->setFrameShape(QFrame::Shape::HLine);
        line_5->setFrameShadow(QFrame::Shadow::Sunken);

        ToolPanel->addWidget(line_5);

        DrawingTools = new QGroupBox(centralwidget);
        DrawingTools->setObjectName("DrawingTools");
        verticalLayout_4 = new QVBoxLayout(DrawingTools);
        verticalLayout_4->setSpacing(2);
        verticalLayout_4->setObjectName("verticalLayout_4");
        verticalLayout_4->setContentsMargins(5, 5, 5, 5);
        horizontalLayout = new QHBoxLayout();
        horizontalLayout->setObjectName("horizontalLayout");
        toolSizeAdjuster = new QSlider(DrawingTools);
        toolSizeAdjuster->setObjectName("toolSizeAdjuster");
        toolSizeAdjuster->setMinimum(1);
        toolSizeAdjuster->setMaximum(16);
        toolSizeAdjuster->setValue(1);
        toolSizeAdjuster->setOrientation(Qt::Orientation::Horizontal);

        horizontalLayout->addWidget(toolSizeAdjuster);

        toolSizeLabel = new QLabel(DrawingTools);
        toolSizeLabel->setObjectName("toolSizeLabel");

        horizontalLayout->addWidget(toolSizeLabel);


        verticalLayout_4->addLayout(horizontalLayout);

        brushButton = new QPushButton(DrawingTools);
        brushButton->setObjectName("brushButton");

        verticalLayout_4->addWidget(brushButton);

        eraseButton = new QPushButton(DrawingTools);
        eraseButton->setObjectName("eraseButton");

        verticalLayout_4->addWidget(eraseButton);


        ToolPanel->addWidget(DrawingTools);

        line_4 = new QFrame(centralwidget);
        line_4->setObjectName("line_4");
        line_4->setFrameShape(QFrame::Shape::HLine);
        line_4->setFrameShadow(QFrame::Shadow::Sunken);

        ToolPanel->addWidget(line_4);

        colorPaletteBox = new QGroupBox(centralwidget);
        colorPaletteBox->setObjectName("colorPaletteBox");
        gridLayout = new QGridLayout(colorPaletteBox);
        gridLayout->setSpacing(1);
        gridLayout->setObjectName("gridLayout");
        gridLayout->setContentsMargins(0, 0, 0, 0);
        purpleButton = new QPushButton(colorPaletteBox);
        purpleButton->setObjectName("purpleButton");

        gridLayout->addWidget(purpleButton, 1, 2, 1, 1);

        greenButton = new QPushButton(colorPaletteBox);
        greenButton->setObjectName("greenButton");

        gridLayout->addWidget(greenButton, 1, 0, 1, 1);

        blueButton = new QPushButton(colorPaletteBox);
        blueButton->setObjectName("blueButton");

        gridLayout->addWidget(blueButton, 1, 1, 1, 1);

        orangeButton = new QPushButton(colorPaletteBox);
        orangeButton->setObjectName("orangeButton");

        gridLayout->addWidget(orangeButton, 0, 1, 1, 1);

        blackButton = new QPushButton(colorPaletteBox);
        blackButton->setObjectName("blackButton");

        gridLayout->addWidget(blackButton, 0, 3, 1, 1);

        redButton = new QPushButton(colorPaletteBox);
        redButton->setObjectName("redButton");

        gridLayout->addWidget(redButton, 0, 0, 1, 1);

        whiteButton = new QPushButton(colorPaletteBox);
        whiteButton->setObjectName("whiteButton");

        gridLayout->addWidget(whiteButton, 1, 3, 1, 1);

        yellowButton = new QPushButton(colorPaletteBox);
        yellowButton->setObjectName("yellowButton");

        gridLayout->addWidget(yellowButton, 0, 2, 1, 1);


        ToolPanel->addWidget(colorPaletteBox);

        colorButton = new QPushButton(centralwidget);
        colorButton->setObjectName("colorButton");

        ToolPanel->addWidget(colorButton);

        line_2 = new QFrame(centralwidget);
        line_2->setObjectName("line_2");
        line_2->setFrameShape(QFrame::Shape::HLine);
        line_2->setFrameShadow(QFrame::Shadow::Sunken);

        ToolPanel->addWidget(line_2);

        canvasSizeGroupBox = new QGroupBox(centralwidget);
        canvasSizeGroupBox->setObjectName("canvasSizeGroupBox");
        canvasSizeGroupBox->setMinimumSize(QSize(32, 50));
        verticalLayout_2 = new QVBoxLayout(canvasSizeGroupBox);
        verticalLayout_2->setObjectName("verticalLayout_2");
        canvasSizeLabel = new QLabel(canvasSizeGroupBox);
        canvasSizeLabel->setObjectName("canvasSizeLabel");

        verticalLayout_2->addWidget(canvasSizeLabel);

        canvasSizeComboBox = new QComboBox(canvasSizeGroupBox);
        canvasSizeComboBox->addItem(QString());
        canvasSizeComboBox->addItem(QString());
        canvasSizeComboBox->addItem(QString());
        canvasSizeComboBox->setObjectName("canvasSizeComboBox");

        verticalLayout_2->addWidget(canvasSizeComboBox);

        canvasSizePushButton = new QPushButton(canvasSizeGroupBox);
        canvasSizePushButton->setObjectName("canvasSizePushButton");

        verticalLayout_2->addWidget(canvasSizePushButton);


        ToolPanel->addWidget(canvasSizeGroupBox);

        line_7 = new QFrame(centralwidget);
        line_7->setObjectName("line_7");
        line_7->setFrameShape(QFrame::Shape::HLine);
        line_7->setFrameShadow(QFrame::Shadow::Sunken);

        ToolPanel->addWidget(line_7);

        verticalSpacer = new QSpacerItem(20, 40, QSizePolicy::Policy::Minimum, QSizePolicy::Policy::Expanding);

        ToolPanel->addItem(verticalSpacer);

        line_8 = new QFrame(centralwidget);
        line_8->setObjectName("line_8");
        line_8->setFrameShape(QFrame::Shape::HLine);
        line_8->setFrameShadow(QFrame::Shadow::Sunken);

        ToolPanel->addWidget(line_8);

        UndoRedo = new QHBoxLayout();
        UndoRedo->setObjectName("UndoRedo");
        undoButton = new QPushButton(centralwidget);
        undoButton->setObjectName("undoButton");

        UndoRedo->addWidget(undoButton);

        redoButton = new QPushButton(centralwidget);
        redoButton->setObjectName("redoButton");

        UndoRedo->addWidget(redoButton);


        ToolPanel->addLayout(UndoRedo);


        MainPanel->addLayout(ToolPanel);

        frameBox = new QWidget(centralwidget);
        frameBox->setObjectName("frameBox");
        QSizePolicy sizePolicy(QSizePolicy::Policy::Preferred, QSizePolicy::Policy::Preferred);
        sizePolicy.setHorizontalStretch(4);
        sizePolicy.setVerticalStretch(4);
        sizePolicy.setHeightForWidth(frameBox->sizePolicy().hasHeightForWidth());
        frameBox->setSizePolicy(sizePolicy);
        canvasSizeWarningLabel = new QLabel(frameBox);
        canvasSizeWarningLabel->setObjectName("canvasSizeWarningLabel");
        canvasSizeWarningLabel->setGeometry(QRect(120, 270, 371, 20));
        QFont font;
        font.setPointSize(14);
        font.setBold(false);
        canvasSizeWarningLabel->setFont(font);
        canvasSizeWarningLabel->setAlignment(Qt::AlignmentFlag::AlignCenter);

        MainPanel->addWidget(frameBox);

        PreviewPanel = new QVBoxLayout();
        PreviewPanel->setObjectName("PreviewPanel");
        Preview = new QLabel(centralwidget);
        Preview->setObjectName("Preview");
        Preview->setAlignment(Qt::AlignmentFlag::AlignCenter);

        PreviewPanel->addWidget(Preview);

        line_6 = new QFrame(centralwidget);
        line_6->setObjectName("line_6");
        line_6->setFrameShape(QFrame::Shape::HLine);
        line_6->setFrameShadow(QFrame::Shadow::Sunken);

        PreviewPanel->addWidget(line_6);

        previewWidget = new QWidget(centralwidget);
        previewWidget->setObjectName("previewWidget");

        PreviewPanel->addWidget(previewWidget);

        horizontalLayout_2 = new QHBoxLayout();
        horizontalLayout_2->setObjectName("horizontalLayout_2");
        fpsAdjuster = new QSlider(centralwidget);
        fpsAdjuster->setObjectName("fpsAdjuster");
        fpsAdjuster->setMinimum(1);
        fpsAdjuster->setMaximum(24);
        fpsAdjuster->setValue(12);
        fpsAdjuster->setOrientation(Qt::Orientation::Horizontal);

        horizontalLayout_2->addWidget(fpsAdjuster);

        fpsLabel = new QLabel(centralwidget);
        fpsLabel->setObjectName("fpsLabel");

        horizontalLayout_2->addWidget(fpsLabel);


        PreviewPanel->addLayout(horizontalLayout_2);

        line_3 = new QFrame(centralwidget);
        line_3->setObjectName("line_3");
        line_3->setFrameShape(QFrame::Shape::HLine);
        line_3->setFrameShadow(QFrame::Shadow::Sunken);

        PreviewPanel->addWidget(line_3);

        FrameControl = new QGroupBox(centralwidget);
        FrameControl->setObjectName("FrameControl");
        verticalLayout_5 = new QVBoxLayout(FrameControl);
        verticalLayout_5->setSpacing(2);
        verticalLayout_5->setObjectName("verticalLayout_5");
        verticalLayout_5->setContentsMargins(5, 5, 5, 5);
        AddDeleteFrames = new QHBoxLayout();
        AddDeleteFrames->setObjectName("AddDeleteFrames");
        deleteFrameButton = new QPushButton(FrameControl);
        deleteFrameButton->setObjectName("deleteFrameButton");

        AddDeleteFrames->addWidget(deleteFrameButton);

        addFrameButton = new QPushButton(FrameControl);
        addFrameButton->setObjectName("addFrameButton");

        AddDeleteFrames->addWidget(addFrameButton);


        verticalLayout_5->addLayout(AddDeleteFrames);

        Frames = new QScrollArea(FrameControl);
        Frames->setObjectName("Frames");
        Frames->setHorizontalScrollBarPolicy(Qt::ScrollBarPolicy::ScrollBarAlwaysOff);
        Frames->setWidgetResizable(true);
        FramesPreview = new QWidget();
        FramesPreview->setObjectName("FramesPreview");
        FramesPreview->setGeometry(QRect(0, 0, 204, 172));
        Frames->setWidget(FramesPreview);

        verticalLayout_5->addWidget(Frames);

        horizontalLayout_3 = new QHBoxLayout();
        horizontalLayout_3->setSpacing(7);
        horizontalLayout_3->setObjectName("horizontalLayout_3");
        previousFrame = new QPushButton(FrameControl);
        previousFrame->setObjectName("previousFrame");
        QSizePolicy sizePolicy1(QSizePolicy::Policy::Expanding, QSizePolicy::Policy::Fixed);
        sizePolicy1.setHorizontalStretch(0);
        sizePolicy1.setVerticalStretch(0);
        sizePolicy1.setHeightForWidth(previousFrame->sizePolicy().hasHeightForWidth());
        previousFrame->setSizePolicy(sizePolicy1);
        previousFrame->setMinimumSize(QSize(0, 0));
        previousFrame->setMaximumSize(QSize(80, 16777215));

        horizontalLayout_3->addWidget(previousFrame);

        nextFrame = new QPushButton(FrameControl);
        nextFrame->setObjectName("nextFrame");
        sizePolicy1.setHeightForWidth(nextFrame->sizePolicy().hasHeightForWidth());
        nextFrame->setSizePolicy(sizePolicy1);
        nextFrame->setMaximumSize(QSize(80, 16777215));

        horizontalLayout_3->addWidget(nextFrame);


        verticalLayout_5->addLayout(horizontalLayout_3);

        duplicateFrameButton = new QPushButton(FrameControl);
        duplicateFrameButton->setObjectName("duplicateFrameButton");

        verticalLayout_5->addWidget(duplicateFrameButton);

        clearFrameButton = new QPushButton(FrameControl);
        clearFrameButton->setObjectName("clearFrameButton");

        verticalLayout_5->addWidget(clearFrameButton);


        PreviewPanel->addWidget(FrameControl);

        PreviewPanel->setStretch(2, 1);
        PreviewPanel->setStretch(5, 2);

        MainPanel->addLayout(PreviewPanel);

        MainPanel->setStretch(0, 1);
        MainPanel->setStretch(1, 5);
        MainPanel->setStretch(2, 2);

        verticalLayout->addLayout(MainPanel);

        MainWindow->setCentralWidget(centralwidget);
        menubar = new QMenuBar(MainWindow);
        menubar->setObjectName("menubar");
        menubar->setGeometry(QRect(0, 0, 1101, 39));
        menuSprite_Editor = new QMenu(menubar);
        menuSprite_Editor->setObjectName("menuSprite_Editor");
        MainWindow->setMenuBar(menubar);
        statusbar = new QStatusBar(MainWindow);
        statusbar->setObjectName("statusbar");
        MainWindow->setStatusBar(statusbar);

        menubar->addAction(menuSprite_Editor->menuAction());

        retranslateUi(MainWindow);

        QMetaObject::connectSlotsByName(MainWindow);
    } // setupUi

    void retranslateUi(QMainWindow *MainWindow)
    {
        MainWindow->setWindowTitle(QCoreApplication::translate("MainWindow", "MainWindow", nullptr));
        saveButton->setText(QCoreApplication::translate("MainWindow", "Save", nullptr));
        loadButton->setText(QCoreApplication::translate("MainWindow", "Load", nullptr));
        title->setText(QCoreApplication::translate("MainWindow", "Sprite Editor", nullptr));
        ToolPanelLabel->setText(QCoreApplication::translate("MainWindow", "Tool Panel", nullptr));
        DrawingTools->setTitle(QCoreApplication::translate("MainWindow", "Drawing Tools", nullptr));
#if QT_CONFIG(tooltip)
        toolSizeAdjuster->setToolTip(QCoreApplication::translate("MainWindow", "Brush width; Drag to change size (1\342\200\22316 px).", nullptr));
#endif // QT_CONFIG(tooltip)
        toolSizeLabel->setText(QCoreApplication::translate("MainWindow", "1 px", nullptr));
#if QT_CONFIG(tooltip)
        brushButton->setToolTip(QCoreApplication::translate("MainWindow", "Brush tool; Paint using the selected color.", nullptr));
#endif // QT_CONFIG(tooltip)
        brushButton->setText(QCoreApplication::translate("MainWindow", "Brush", nullptr));
#if QT_CONFIG(tooltip)
        eraseButton->setToolTip(QCoreApplication::translate("MainWindow", "Eraser tool; Removes pixels (draws transparent).", nullptr));
#endif // QT_CONFIG(tooltip)
        eraseButton->setText(QCoreApplication::translate("MainWindow", "Erase", nullptr));
#if QT_CONFIG(tooltip)
        colorPaletteBox->setToolTip(QCoreApplication::translate("MainWindow", "Color Picker; Choose a color from the pallete here.", nullptr));
#endif // QT_CONFIG(tooltip)
        colorPaletteBox->setTitle(QCoreApplication::translate("MainWindow", "Color Picker", nullptr));
        purpleButton->setText(QString());
        greenButton->setText(QString());
        blueButton->setText(QString());
        orangeButton->setText(QString());
        blackButton->setText(QString());
        redButton->setText(QString());
        whiteButton->setText(QString());
        yellowButton->setText(QString());
#if QT_CONFIG(tooltip)
        colorButton->setToolTip(QCoreApplication::translate("MainWindow", "Pick a custom color for the brush", nullptr));
#endif // QT_CONFIG(tooltip)
        colorButton->setText(QCoreApplication::translate("MainWindow", "Change Color", nullptr));
        canvasSizeGroupBox->setTitle(QString());
        canvasSizeLabel->setText(QCoreApplication::translate("MainWindow", "Set the Canvas Size", nullptr));
        canvasSizeComboBox->setItemText(0, QCoreApplication::translate("MainWindow", "16", nullptr));
        canvasSizeComboBox->setItemText(1, QCoreApplication::translate("MainWindow", "32", nullptr));
        canvasSizeComboBox->setItemText(2, QCoreApplication::translate("MainWindow", "64", nullptr));

#if QT_CONFIG(tooltip)
        canvasSizePushButton->setToolTip(QCoreApplication::translate("MainWindow", "Confirm canvas size", nullptr));
#endif // QT_CONFIG(tooltip)
        canvasSizePushButton->setText(QCoreApplication::translate("MainWindow", "OK", nullptr));
#if QT_CONFIG(tooltip)
        undoButton->setToolTip(QCoreApplication::translate("MainWindow", "Undo last action.", nullptr));
#endif // QT_CONFIG(tooltip)
        undoButton->setText(QCoreApplication::translate("MainWindow", "Undo", nullptr));
#if QT_CONFIG(tooltip)
        redoButton->setToolTip(QCoreApplication::translate("MainWindow", "Redo last undone action.", nullptr));
#endif // QT_CONFIG(tooltip)
        redoButton->setText(QCoreApplication::translate("MainWindow", "Redo", nullptr));
        canvasSizeWarningLabel->setText(QCoreApplication::translate("MainWindow", "CHOOSE A CANVAS SIZE TO DRAW", nullptr));
        Preview->setText(QCoreApplication::translate("MainWindow", "Preview", nullptr));
#if QT_CONFIG(tooltip)
        fpsAdjuster->setToolTip(QCoreApplication::translate("MainWindow", "Current playback speed for the animation.", nullptr));
#endif // QT_CONFIG(tooltip)
#if QT_CONFIG(tooltip)
        fpsLabel->setToolTip(QCoreApplication::translate("MainWindow", "Adjust animation speed in frames per second.", nullptr));
#endif // QT_CONFIG(tooltip)
        fpsLabel->setText(QCoreApplication::translate("MainWindow", "12 fps", nullptr));
        FrameControl->setTitle(QCoreApplication::translate("MainWindow", "Frame Control", nullptr));
#if QT_CONFIG(tooltip)
        deleteFrameButton->setToolTip(QCoreApplication::translate("MainWindow", "Delete the currently selected frame.", nullptr));
#endif // QT_CONFIG(tooltip)
        deleteFrameButton->setText(QCoreApplication::translate("MainWindow", "-", nullptr));
#if QT_CONFIG(tooltip)
        addFrameButton->setToolTip(QCoreApplication::translate("MainWindow", "Add a new blank frame to the animation.", nullptr));
#endif // QT_CONFIG(tooltip)
        addFrameButton->setText(QCoreApplication::translate("MainWindow", "+", nullptr));
#if QT_CONFIG(tooltip)
        Frames->setToolTip(QCoreApplication::translate("MainWindow", "Shows all frames in the animation. Click a frame to edit it.", nullptr));
#endif // QT_CONFIG(tooltip)
#if QT_CONFIG(tooltip)
        previousFrame->setToolTip(QCoreApplication::translate("MainWindow", "<html><head/><body><p>Go to previous frame</p></body></html>", nullptr));
#endif // QT_CONFIG(tooltip)
        previousFrame->setText(QCoreApplication::translate("MainWindow", "Previous", nullptr));
#if QT_CONFIG(tooltip)
        nextFrame->setToolTip(QCoreApplication::translate("MainWindow", "<html><head/><body><p>Go to next frame</p></body></html>", nullptr));
#endif // QT_CONFIG(tooltip)
        nextFrame->setText(QCoreApplication::translate("MainWindow", "Next", nullptr));
#if QT_CONFIG(tooltip)
        duplicateFrameButton->setToolTip(QCoreApplication::translate("MainWindow", "Copy the current frame and add it as a new one.", nullptr));
#endif // QT_CONFIG(tooltip)
        duplicateFrameButton->setText(QCoreApplication::translate("MainWindow", "Duplicate Frame", nullptr));
#if QT_CONFIG(tooltip)
        clearFrameButton->setToolTip(QCoreApplication::translate("MainWindow", "Erase all pixels in the current frame.", nullptr));
#endif // QT_CONFIG(tooltip)
        clearFrameButton->setText(QCoreApplication::translate("MainWindow", "Clear Frame", nullptr));
        menuSprite_Editor->setTitle(QCoreApplication::translate("MainWindow", "Sprite Editor", nullptr));
    } // retranslateUi

};

namespace Ui {
    class MainWindow: public Ui_MainWindow {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_MAINWINDOW_H
