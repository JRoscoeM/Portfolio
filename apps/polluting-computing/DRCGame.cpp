#include "DRCGame.h"
#include <QHBoxLayout>

DRCGame::DRCGame(QWidget *parent)
    : QWidget(parent), defaultBackground(":/image/HighResDrcMine.png") {
    currentBackground = defaultBackground;

    // Create elements
    optionA = new QPushButton("Option A", this);
    optionB = new QPushButton("Option B", this);
    continueBtn = new QPushButton("Continue", this);
    profitMarginTitle = new QLabel("Your profit Margin is: ", this);
    profitMarginLabel = new QLabel("37.1", this);

    // Hide and position elements.
    optionA->setEnabled(false);
    optionB->setEnabled(false);
    profitMarginTitle->hide();
    profitMarginLabel->hide();
    profitMarginTitle->move(100, 100);
    profitMarginLabel->move(180, 100);

    // Styling Begins ––––––––––––––––––––––
    QString labelStyle =
        "color: rgb(236,231,223);"
        "background-color: rgb(31,33,34);"
        "font-family: 'Electrolize';"
        "padding: 6px 12px;"
        "border-radius: 6px;";
    profitMarginTitle->setStyleSheet(labelStyle);
    profitMarginLabel->setStyleSheet(labelStyle);

    optionA->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Preferred);
    optionB->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Preferred);
    continueBtn->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Preferred);
    profitMarginTitle->setSizePolicy(QSizePolicy::Expanding,
                                     QSizePolicy::Preferred);
    profitMarginLabel->setSizePolicy(QSizePolicy::Expanding,
                                     QSizePolicy::Preferred);

    profitMarginTitle->setWordWrap(true);
    profitMarginTitle->setFixedHeight(45);
    profitMarginLabel->setFixedHeight(45);
    profitMarginLabel->setMaximumWidth(65);
    // Styling Ends –––––––––––––––––––––––––

    // Handle Layout
    QVBoxLayout *mainLayout = new QVBoxLayout(this);
    mainLayout->addStretch(10);
    QHBoxLayout *options = new QHBoxLayout();
    options->addWidget(optionA);
    options->addWidget(optionB);
    mainLayout->addLayout(options);
    mainLayout->addWidget(continueBtn, 0,
                          Qt::AlignHCenter);
    mainLayout->addStretch(1);

    // Input data for the arrays containing prompts, options, and results.
    prompts[0] =
        "One of your employees-Dany a 15-year-old cobalt miner-approaches you, "
                 "he says \"there is a lot of dust, could you provide me with an N95 "
                 "mask?\" -Amnesty International";
    prompts[1] = "Loïc comes up to you with his sack of ore for the day.";
    prompts[2] =
        "An employee comes up to you and asks for a pay raise to match that of "
                 "his Chinese coworkers.";
    prompts[3] = "Someone calls out sick for the day–remember to fire him "
                 "later–so you need one more person to work this upcoming shift.";
    prompts[4] = "Your geologists approach you with a new planned location for "
                 "an open-pit mine, but a large portion of the proposed site is "
                 "currently occupied by peoples' homes.";

    winningOptions[0] = "Reject his Request.";
    winningOptions[1] = "Don't use your scale to weigh his ore so you can pay "
                        "him less than the agreed-upon amount.";
    winningOptions[2] = "Fire him for being insubordinate.";
    winningOptions[3] = "Make 14-year-old Paul work a double shift.";
    winningOptions[4] =
        "Clear the homes by means of intimidation, forcible eviction, and \n"
                        "misleading people into consenting to derisory settlements.";

    losingOptions[0] = "Provide him with a mask";
    losingOptions[1] = "Weigh his sack of ore with a scale and pay Loïc the "
                       "agreed-upon amount.";
    losingOptions[2] = "Give him a raise to match the same rate as his "
                       "coworkers.";
    losingOptions[3] = "Take the loss by having one fewer person working.";
    losingOptions[4] = "Choose to either find a new mining site or compensate "
                       "those who are displaced fairly.";

    winningResults[0] = "Timmy gets Silicosis, this makes him more susceptible "
                        "to TB and he dies :(.";
    winningResults[1] =
        "Loïc cannot pay for school.";
    winningResults[2] = "He no longer has a job and struggles to pay his bills.";
    winningResults[3] =
        "It is early morning, Paul stumbles out of the exit to "
                        "the mine looking exhausted and hungry. \"[Paul] I often "
                        "spend 24 hours down in the tunnels. I arrived in the "
                        "morning and would leave the following morning.\" -Amnesty International";
    winningResults[4] =
        "The settlements given to those who were displaced are not enough to "
                        "provide an equivalent standard of living elsewhere. \"I had a large "
                        "house, with electricity, water…Now, I have a small house that was all I "
                        "could afford with the compensation…we have to drink water from wells … "
                        "almost no electricity.\"";

    losingResults[0] = "Timmy lives a long and happy life :). Your profit margin "
                       "goes down by 2%";
    losingResults[1] = "Loïc makes enough to help pay for his education. Your "
                       "profit margin decreases by 2%";
    losingResults[2] = "You've set a dangerous precedent of equal pay. Your profit margin suffers as a result.";
    losingResults[3] = "You're not able to mine as much cobalt that day because you didn't have enough people working.";
    losingResults[4] = "It takes 3 more months to find a suitable site.";


    // Input data for the arrays containing the backgrounds.
    for (int i = 0; i < 5; i++ ) {
        winningBackgrounds[i] = QPixmap(":/image/HighResDrcMine.png");
        losingBackgrounds[i] = QPixmap(":/image/HighResDrcMine.png");
    }

    losingBackgrounds[0] = QPixmap(":/image/losingResult0.png");
    losingBackgrounds[1] = QPixmap(":/image/losingResult1.png");
    losingBackgrounds[4] = QPixmap(":/image/losingOption4.png");

    winningBackgrounds[0] = QPixmap(":/image/winningResult0");
    winningBackgrounds[1] = QPixmap(":/image/winningResult1");
    winningBackgrounds[3] = QPixmap(":/image/winningResult3");
    winningBackgrounds[4] = QPixmap(":/image/winningOption4.png");

    connect(continueBtn,
            &QPushButton::clicked,
            this,
            &DRCGame::startNextDRCStep);
    connect(optionA, &QPushButton::clicked,
            this,
            [this]() {
                startNextDRCStep();
                pickWinningOption();
            });
    connect(optionB,
            &QPushButton::clicked,
            this,
            [this]() {
                startNextDRCStep();
                pickLosingOption();
            });
}

void DRCGame::paintEvent(QPaintEvent*) {
    QPainter painter(this);

    // scale the image to keep it's aspect ratio
    QPixmap scaledImg = currentBackground.scaled(this->size(), Qt::KeepAspectRatio,
                                                               Qt::SmoothTransformation);

    // center the scaled image inside the widget
    int x = (width() - scaledImg.width()) / 2;
    int y = (height() - scaledImg.height()) / 2;

    painter.drawPixmap(x, y, scaledImg);
}

void DRCGame::enableDRCOptionButtons(const QString &optionAText,
                                     const QString &optionBText) {
    // These four lines will not change behavior if the buttons are already enabled.
    optionA->show();
    optionB->show();
    optionA->setEnabled(true);
    optionB->setEnabled(true);

    optionA->setText(optionAText);
    optionB->setText(optionBText);
}

void DRCGame::disableDRCOptionButtons() {
    optionA->hide();
    optionB->hide();
    optionA->setEnabled(false);
    optionB->setEnabled(false);
}

void DRCGame::startNextDRCStep() {
    currentBackground = defaultBackground;
    update();
    // When the player is going to see the results of their decision.
    if (currentIsPrompt) {
        continueBtn->setEnabled(true);

        disableDRCOptionButtons();

        currentIsPrompt = false;
    }
    // When the player is going to make a decision.
    else {
        continueBtn->setEnabled(false);
        profitMarginTitle->show();
        profitMarginLabel->show();
        emit onInfoTextChanged(prompts[currentStep]);

        enableDRCOptionButtons(winningOptions[currentStep],
                               losingOptions[currentStep]);

        currentIsPrompt = true;
        currentStep++;
    }
}

void DRCGame::setup() {
    emit onGoalTextChanged("Make decisions to keep your profit margin above 47.1%");
    emit onInfoTitleTextChanged("Welcome to the Tenke Furungume mine!");
    emit onInfoTextChanged(
        "You are a Chinese cobalt mining company operating in the Democratic "
        "Republic of the Congo. Maintain at least a 47.1% profit margin or the "
        "CCP will nationalize your company. If that happens, you will be fired "
        "and lose the game. Note: The events in this game are based on credible "
        "accounts, but cannot be taken as being 100% accurate.");
}

void DRCGame::pickWinningOption() {
    currentBackground = winningBackgrounds[currentStep - 1].scaled(this->size(), Qt::KeepAspectRatio,
                                           Qt::SmoothTransformation);
    update();
    profitMargin += 2;
    profitMarginLabel->setText(QString::number(profitMargin));
    emit onInfoTextChanged(winningResults[currentStep - 1] + handleEndGame());
}

void DRCGame::pickLosingOption() {
    currentBackground = losingBackgrounds[currentStep - 1].scaled(this->size(), Qt::KeepAspectRatio,
                                          Qt::SmoothTransformation);
    update();
    profitMargin -= 2;
    profitMarginLabel->setText(QString::number(profitMargin));
    emit onInfoTextChanged(losingResults[currentStep - 1] + handleEndGame());
}
QString DRCGame::handleEndGame() {
    // Greater than five because handleEndGame is called from the pick Option slots. When the pickOption slots are called, the index has already been incremented.
    if (currentStep > 4) {
        if (profitMargin >= 47.1) {
            emit minigameFinished();
            emit onGoalTextChanged("Take your materials back to the world hub!");

            return "\nYou completed the minigame";
        }
        else {
            // Reset the game;
            continueBtn->setEnabled(true);
            disableDRCOptionButtons();
            currentIsPrompt = true;
            currentStep = 0;
            profitMargin = 37.1;

            return "\nYou failed to end the game with a 47.1% profit margin. Try Again";
        }
    }
    return "";
}
