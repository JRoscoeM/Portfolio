#ifndef GAMEMODEL_H
#define GAMEMODEL_H
#include <QObject>
#include <QString>
#include <QMap>

class GameModel : public QObject
{
    Q_OBJECT
public:
    explicit GameModel(QObject *parent = nullptr);
    bool hasItem(const QString& name) const;

public slots:
    void addInventoryItem(const QString& name, const QString& iconPath);

    void passInfoTitleTextToMainWindow(const QString& text);
    void passInfoTextToMainWindow(const QString& text);
    void passImpactsTextToMainWindow(const QString& text);
    void passCurrentGoalTextChangedToMainWindow(const QString& text);

signals:
    /**
     * @brief onImpactsTextChanged A signal which may be used by any minigame. Is emitted when the impacts section should have updated text.
     * @param text The text which should be displayed in the impacts section.
     */
    void onImpactsTextChanged(const QString& text);

    /**
     * @brief onInfoTitleTextChanged A signal which may be used by any minigame. Is emitted when the info title section should have updated text.
     * @param text The text which should be displayed in the info title section.
     */
    void onInfoTitleTextChanged(const QString& text);
    /**
     * @brief onInfoTextChanged A signal which may be used by any minigame. Is emitted when the info text section should have updated text.
     * @param text The text which should be displayed in the info text section.
     */
    void onInfoTextChanged(const QString& text);

    void onCurrentGoalTextChanged(const QString& text);

    void onInventoryItemAdded(const QString& name, const QString& iconPath);
private:
    /**
     * @brief inventory Key is the name of the item in inventory, Value is the path to the icon in our resources as a string
     */
    QMap<QString, QString> inventory;
};

#endif // GAMEMODEL_H
