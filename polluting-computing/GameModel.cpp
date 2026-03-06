#include "GameModel.h"

GameModel::GameModel(QObject *parent)
    : QObject(parent)
{

}

bool GameModel::hasItem(const QString& name) const
{
    return inventory.contains(name);
}

void GameModel::passInfoTitleTextToMainWindow(const QString& text)
{
    emit onInfoTitleTextChanged(text);
}

void GameModel::passInfoTextToMainWindow(const QString& text)
{
    emit onInfoTextChanged(text);
}

void GameModel::passImpactsTextToMainWindow(const QString& text)
{
    emit onImpactsTextChanged(text);
}

void GameModel::passCurrentGoalTextChangedToMainWindow(const QString& text)
{
    emit onCurrentGoalTextChanged(text);
}

void GameModel::addInventoryItem(const QString& name, const QString& iconPath)
{
    if (!inventory.contains(name)) {
        inventory.insert(name, iconPath);
        emit onInventoryItemAdded(name, iconPath);
    }
}
