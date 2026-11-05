#include "mainwindow.h"
#include "ui_mainwindow.h"
#include "FrameEditor.h"
#include "Sprite.h"

MainWindow::MainWindow(Sprite* model, QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
    , frameEditor(new FrameEditor(model, this))
    , framePreview(new FramePreview(this))
{
    ui->setupUi(this);

    scrollWidget = new QWidget(this); // Widget to hold frames in container
    scrollWidget->setStyleSheet("background-color: transparent");
    scrollLayout = new QVBoxLayout(scrollWidget);
    QScrollArea = ui->Frames;
    QScrollArea->setWidget(scrollWidget);
    QScrollArea->setWidgetResizable(true);
    framePreviews = QVector<FrameWidget>();

    ui->frameBox->setLayout(new QVBoxLayout());
    ui->frameBox->layout()->setContentsMargins(0, 0, 0, 0);
    ui->frameBox->layout()->addWidget(frameEditor);

    ui->previewWidget->setLayout(new QVBoxLayout());
    ui->previewWidget->layout()->setContentsMargins(0, 0, 0, 0);
    ui->previewWidget->layout()->addWidget(framePreview);

    connect(model,
            &Sprite::displayPreviewFrame,
            framePreview,
            &FramePreview::frameToDisplay);

    // Set the colors for the color pallette buttons.
    ui->redButton->setStyleSheet(QString("QPushButton {background-color: rgb(255, 0, 0);} "));
    ui->orangeButton->setStyleSheet(QString("QPushButton {background-color: rgb(255, 125, 0);} "));
    ui->yellowButton->setStyleSheet(QString("QPushButton {background-color: rgb(255, 255, 0);} "));
    ui->greenButton->setStyleSheet(QString("QPushButton {background-color: rgb(0, 255, 0);} "));
    ui->blueButton->setStyleSheet(QString("QPushButton {background-color: rgb(0, 0, 255);} "));
    ui->purpleButton->setStyleSheet(QString("QPushButton {background-color: rgb(125, 0, 255);} "));
    ui->blackButton->setStyleSheet(QString("QPushButton {background-color: rgb(0, 0, 0);} "));
    ui->whiteButton->setStyleSheet(QString("QPushButton {background-color: rgb(255, 255, 255);} "));

    ui->toolSizeAdjuster->setMinimum(1);
    ui->toolSizeAdjuster->setMaximum(16);
    frameEditor->setCursor(QCursor(QPixmap(":/images/brush.png"), 0, 32));

    // connect the color palette button press to set the brush's selected color
    connect(ui->redButton,
            &QPushButton::clicked,
            this,
            [model]()
            {
                model->setSelectedBrushColor(Qt::red);
            });

    connect(ui->orangeButton,
            &QPushButton::clicked,
            this,
            [model]()
            {
                model->setSelectedBrushColor(QColor(255, 125, 0));
            });

    connect(ui->yellowButton,
            &QPushButton::clicked,
            this,
            [model]()
            {
                model->setSelectedBrushColor(Qt::yellow);
            });

    connect(ui->greenButton,
            &QPushButton::clicked,
            this,
            [model]()
            {
            model->setSelectedBrushColor(Qt::green);
            });

    connect(ui->blueButton,
            &QPushButton::clicked,
            this,
            [model]()
            {
                model->setSelectedBrushColor(Qt::blue);
            });

    connect(ui->purpleButton,
            &QPushButton::clicked,
            this,
            [model]()
            {
                model->setSelectedBrushColor(QColor(125, 0, 255));
            });

    connect(ui->blackButton,
            &QPushButton::clicked,
            this,
            [model]()
            {
                model->setSelectedBrushColor(Qt::black);
            });

    connect(ui->whiteButton,
            &QPushButton::clicked,
            this,
            [model]()
            {
                model->setSelectedBrushColor(Qt::white);
            });

    // change the label as the slider values change
    connect(ui->toolSizeAdjuster,
            &QSlider::valueChanged,
            this,
            [this](int toolSize)
            {
                QString toolSizeStr = QString::number(toolSize);
                ui->toolSizeLabel->setText(toolSizeStr + "px");
            });

    connect(ui->fpsAdjuster,
            &QSlider::valueChanged,
            this,
            [this] (int fps)
            {
                QString fpsStr = QString::number(fps);
                ui->fpsLabel->setText(fpsStr + " fps");
            });

    // connect the colorSelector to the QColorDialog
    connect(ui->colorButton,
            &QPushButton::clicked,
            this,
            [this, model]()
            {
                QColor selectedColor = QColorDialog::getColor(Qt::white,
                                                              this,
                                                              tr("Select Color"),
                                                              QColorDialog::ShowAlphaChannel);
                if (selectedColor.isValid())
                {
                    model->setSelectedBrushColor(selectedColor);
                }
            });

    connect(ui->canvasSizePushButton,
            &QPushButton::clicked,
            this,
            [this, model]()
            {
                bool ok = false;
                int size = ui->canvasSizeComboBox->currentText().toInt(&ok);
                if (ok)
                {
                    model->onSetSizeClicked(size);

                    // Tell the editor to draw and allow painting
                    frameEditor->drawGrid(size);
                    frameEditor->isDrawingEnabled = true;

                    // Disable controls now that grid is set
                    ui->canvasSizePushButton->setEnabled(false);
                    ui->canvasSizeComboBox->setEnabled(false);
                    ui->canvasSizeWarningLabel->hide();
                }
            });

    // connect the fileSelector to the save and load methods
    connect(ui->saveButton,
            &QPushButton::clicked,
            this,
            [this, &model]()
            {
                QString fileName = QFileDialog::getSaveFileName(this, tr("Save File"), QDir::homePath(), tr("Text Files (*.txt);;All Files (*)"));
                if (!fileName.isEmpty())
                {
                    model->save(fileName);
                }
            });

    connect(model,
            &Sprite::frameAdded,
            frameEditor,
            &FrameEditor::loadFrame);

    connect(model,
            &Sprite::frameRemoved,
            frameEditor,
            &FrameEditor::loadFrame);

    connect(model,
            &Sprite::frameAdded,
            this,
            [this, model](Frame* frame)
            {
                // Create a frame container widget
                QWidget* frameContainer = new QWidget();
                QHBoxLayout* frameLayout = new QHBoxLayout(frameContainer);

                // Image Preview
                QLabel* imageLabel = new QLabel();
                QPixmap pixmap = QPixmap::fromImage(frame->getImage());

                // Set to a fixed square thumbnail size
                int thumbSize = 64;
                imageLabel->setFixedSize(thumbSize, thumbSize);

                // Scale the pixmap proportionally to fit in the square
                imageLabel->setPixmap(pixmap.scaled(thumbSize, thumbSize, Qt::KeepAspectRatio, Qt::SmoothTransformation));

                // Add a border box
                imageLabel->setFrameStyle(QFrame::Box | QFrame::Plain);
                imageLabel->setLineWidth(2);
                imageLabel->setStyleSheet("border: 2px solid gray; background-color: transparent;");

                // Frame number and thumbnail labels
                int frameIndex = model->getAmountOfFrames();
                QLabel* textLabel = new QLabel(QString("Frame %1").arg(frameIndex));
                FrameWidget currentFrameWidget;
                currentFrameWidget.thumbnail = imageLabel;
                currentFrameWidget.label = textLabel;
                framePreviews.append(currentFrameWidget);
                textLabel->setAlignment(Qt::AlignCenter);

                // Layout
                frameLayout->addWidget(imageLabel);
                frameLayout->addWidget(textLabel);
                frameLayout->setAlignment(Qt::AlignLeft);
                frameLayout->setSpacing(10);

                // Add to scroll area
                scrollLayout->addWidget(frameContainer);
                ui->Frames->setWidget(scrollWidget);
            });

    // unlocks the canvas so you can start drawing, is for the json so when you load it removes the restructions if they are there
    connect(model,
            &Sprite::unlockCanvas,
            [this](int size)
            {
                // Tell the editor to draw and allow painting
                frameEditor->drawGrid(size);
                frameEditor->isDrawingEnabled = true;

                // Disable controls now that grid is set
                ui->canvasSizePushButton->setEnabled(false);
                ui->canvasSizeComboBox->setEnabled(false);
                ui->canvasSizeWarningLabel->hide();
            });

    connect(frameEditor,
            &FrameEditor::frameEdited,
            this,
            [this, model](Frame* frame)
            {
                int index = model->getCurrentFrameIndex();
                if (index < 0 || index >= framePreviews.size()) return;

                QLabel* imageLabel = framePreviews[index].thumbnail;

                // Generate new thumbnail
                QPixmap pixmap = QPixmap::fromImage(frame->getImage());
                imageLabel->setPixmap(
                    pixmap.scaled(64, 64, Qt::KeepAspectRatio, Qt::SmoothTransformation)
                    );
            });

    connect(ui->loadButton,
            &QPushButton::clicked,
            this,
            [this, &model]()
            {
                QString fileName = QFileDialog::getOpenFileName(this, tr("Load File"), QDir::homePath(), tr("Text Files (*.txt);;All Files (*)"));
                if (!fileName.isEmpty())
                {
                    model->load(fileName);
                }
            });

    // Brush / Eraser buttons
    connect(ui->brushButton,
            &QPushButton::clicked,
            this,
            [this, model]
            {
                model->setActiveTool(Tool::Brush);
                QCursor brush(QPixmap(":/images/brush.png"), 0, 32);
                frameEditor->setCursor(brush);
            });

    connect(ui->eraseButton,
            &QPushButton::clicked,
            this,
            [this, model]
            {
                model->setActiveTool(Tool::Eraser);
                QCursor eraser(QPixmap(":/images/eraser.png"), 12, 32);
                frameEditor->setCursor(eraser);
            });

    connect(ui->brushButton,
            &QPushButton::clicked,
            this,
            [this, model]
            {
                model->setActiveTool(Tool::Brush);
                QCursor brush(QPixmap(":/images/brush.png"), 0, 32);
                frameEditor->setCursor(brush);
            });

    connect(ui->eraseButton,
            &QPushButton::clicked,
            this,
            [this, model]
            {
                model->setActiveTool(Tool::Eraser);
                QCursor eraser(QPixmap(":/images/eraser.png"), 12, 32);
                frameEditor->setCursor(eraser);
            });

    connect(ui->addFrameButton,
            &QPushButton::clicked,
            model,
            &Sprite::addFrame);

    connect(ui->deleteFrameButton,
            &QPushButton::clicked,
            model,
            &Sprite::removeFrame);

    connect(ui->previousFrame,
            &QPushButton::clicked,
            model,
            &Sprite::goToPreviousFrame);

    connect(ui->nextFrame,
            &QPushButton::clicked,
            model,
            &Sprite::goToNextFrame);

    connect(model,
            &Sprite::currentFrameHasChanged,
            frameEditor,
            &FrameEditor::loadFrame);

    connect(model, &Sprite::frameRemoved,
            this,
            [this](Frame* currentFrame, int deletedFrameIndex)
            {
                if (deletedFrameIndex >= 0 && deletedFrameIndex < scrollLayout->count())
                {
                    QLayoutItem* item = scrollLayout->takeAt(deletedFrameIndex);
                    if (item)
                    {
                        QWidget* widget = item->widget();
                        if (widget)
                            widget->deleteLater();
                        delete item;
                        framePreviews.removeAt(deletedFrameIndex);
                    }
                }

                // Renumber remaining labels
                for (int i = 0; i < framePreviews.size(); ++i) {
                    framePreviews[i].label->setText(QString("Frame %1").arg(i + 1));
            }
            });

    connect(ui->undoButton,
            &QPushButton::clicked,
            this,
            [this]()
            {
                frameEditor-> undoFrame();
            });

    connect(ui->redoButton,
            &QPushButton::clicked,
            this,
            [this]()
            {
                frameEditor-> redoFrame();
            });

    connect(ui->undoButton,
            &QPushButton::clicked,
            this,
            [this]()
            {
                frameEditor-> undoFrame();
            });

    connect(ui->redoButton,
            &QPushButton::clicked,
            this,
            [this]()
            {
                frameEditor-> redoFrame();
            });

    // chanve the value of the tool size and fps data members in the Sprite model as the slider values change
    connect(ui->toolSizeAdjuster,
            &QSlider::valueChanged,
            this,
            [model](int width)
            {
                model->setToolSize(width);
            });

    connect(ui->fpsAdjuster,
            &QSlider::valueChanged,
            this,
            [model] (int fps)
            {
                model->setFrameRate(fps);
            });

    connect(ui->clearFrameButton,
            &QPushButton::clicked,
            this, [this] ()
            {
                frameEditor->clearFrame();
            });

    connect(ui->duplicateFrameButton,
            &QPushButton::clicked,
            model,
            &Sprite::duplicateFrame);
}

MainWindow::~MainWindow()
{
    delete ui;
}
