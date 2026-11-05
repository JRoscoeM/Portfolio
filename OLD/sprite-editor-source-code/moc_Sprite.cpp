/****************************************************************************
** Meta object code from reading C++ file 'Sprite.h'
**
** Created by: The Qt Meta Object Compiler version 69 (Qt 6.9.3)
**
** WARNING! All changes made in this file will be lost!
*****************************************************************************/

#include "Sprite.h"
#include <QtCore/qmetatype.h>

#include <QtCore/qtmochelpers.h>

#include <memory>


#include <QtCore/qxptype_traits.h>
#if !defined(Q_MOC_OUTPUT_REVISION)
#error "The header file 'Sprite.h' doesn't include <QObject>."
#elif Q_MOC_OUTPUT_REVISION != 69
#error "This file was generated using the moc from 6.9.3. It"
#error "cannot be used with the include files from this version of Qt."
#error "(The moc has changed too much.)"
#endif

#ifndef Q_CONSTINIT
#define Q_CONSTINIT
#endif

QT_WARNING_PUSH
QT_WARNING_DISABLE_DEPRECATED
QT_WARNING_DISABLE_GCC("-Wuseless-cast")
namespace {
struct qt_meta_tag_ZN6SpriteE_t {};
} // unnamed namespace

template <> constexpr inline auto Sprite::qt_create_metaobjectdata<qt_meta_tag_ZN6SpriteE_t>()
{
    namespace QMC = QtMocConstants;
    QtMocHelpers::StringRefStorage qt_stringData {
        "Sprite",
        "frameAdded",
        "",
        "Frame*",
        "newFrame",
        "frameRemoved",
        "currentFrame",
        "deletedFrameIndex",
        "gridSizeChanged",
        "newSize",
        "activeToolChanged",
        "Tool",
        "newActiveTool",
        "selectedBrushColorChanged",
        "newSelectedBrushColor",
        "toolSizeChanged",
        "newToolSize",
        "unlockCanvas",
        "canvasSize",
        "currentFrameHasChanged",
        "newCurrentFrame",
        "displayPreviewFrame",
        "previewFrame",
        "addFrame",
        "removeFrame",
        "duplicateFrame",
        "goToPreviousFrame",
        "goToNextFrame",
        "onSetSizeClicked",
        "size",
        "save",
        "fileName",
        "load",
        "setActiveTool",
        "newTool",
        "setSelectedBrushColor",
        "newColor",
        "setToolSize",
        "setFrameRate",
        "newFps",
        "nextPreviewFrame"
    };

    QtMocHelpers::UintData qt_methods {
        // Signal 'frameAdded'
        QtMocHelpers::SignalData<void(Frame *)>(1, 2, QMC::AccessPublic, QMetaType::Void, {{
            { 0x80000000 | 3, 4 },
        }}),
        // Signal 'frameRemoved'
        QtMocHelpers::SignalData<void(Frame *, int)>(5, 2, QMC::AccessPublic, QMetaType::Void, {{
            { 0x80000000 | 3, 6 }, { QMetaType::Int, 7 },
        }}),
        // Signal 'gridSizeChanged'
        QtMocHelpers::SignalData<void(int)>(8, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::Int, 9 },
        }}),
        // Signal 'activeToolChanged'
        QtMocHelpers::SignalData<void(Tool)>(10, 2, QMC::AccessPublic, QMetaType::Void, {{
            { 0x80000000 | 11, 12 },
        }}),
        // Signal 'selectedBrushColorChanged'
        QtMocHelpers::SignalData<void(const QColor &)>(13, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::QColor, 14 },
        }}),
        // Signal 'toolSizeChanged'
        QtMocHelpers::SignalData<void(int)>(15, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::Int, 16 },
        }}),
        // Signal 'unlockCanvas'
        QtMocHelpers::SignalData<void(int)>(17, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::Int, 18 },
        }}),
        // Signal 'currentFrameHasChanged'
        QtMocHelpers::SignalData<void(Frame *)>(19, 2, QMC::AccessPublic, QMetaType::Void, {{
            { 0x80000000 | 3, 20 },
        }}),
        // Signal 'displayPreviewFrame'
        QtMocHelpers::SignalData<void(const QImage &)>(21, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::QImage, 22 },
        }}),
        // Slot 'addFrame'
        QtMocHelpers::SlotData<void()>(23, 2, QMC::AccessPublic, QMetaType::Void),
        // Slot 'removeFrame'
        QtMocHelpers::SlotData<void()>(24, 2, QMC::AccessPublic, QMetaType::Void),
        // Slot 'duplicateFrame'
        QtMocHelpers::SlotData<void()>(25, 2, QMC::AccessPublic, QMetaType::Void),
        // Slot 'goToPreviousFrame'
        QtMocHelpers::SlotData<void()>(26, 2, QMC::AccessPublic, QMetaType::Void),
        // Slot 'goToNextFrame'
        QtMocHelpers::SlotData<void()>(27, 2, QMC::AccessPublic, QMetaType::Void),
        // Slot 'onSetSizeClicked'
        QtMocHelpers::SlotData<void(int)>(28, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::Int, 29 },
        }}),
        // Slot 'save'
        QtMocHelpers::SlotData<void(QString)>(30, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::QString, 31 },
        }}),
        // Slot 'load'
        QtMocHelpers::SlotData<void(QString)>(32, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::QString, 31 },
        }}),
        // Slot 'setActiveTool'
        QtMocHelpers::SlotData<void(Tool)>(33, 2, QMC::AccessPublic, QMetaType::Void, {{
            { 0x80000000 | 11, 34 },
        }}),
        // Slot 'setSelectedBrushColor'
        QtMocHelpers::SlotData<void(const QColor &)>(35, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::QColor, 36 },
        }}),
        // Slot 'setToolSize'
        QtMocHelpers::SlotData<void(int)>(37, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::Int, 9 },
        }}),
        // Slot 'setFrameRate'
        QtMocHelpers::SlotData<void(int)>(38, 2, QMC::AccessPublic, QMetaType::Void, {{
            { QMetaType::Int, 39 },
        }}),
        // Slot 'nextPreviewFrame'
        QtMocHelpers::SlotData<void()>(40, 2, QMC::AccessPublic, QMetaType::Void),
    };
    QtMocHelpers::UintData qt_properties {
    };
    QtMocHelpers::UintData qt_enums {
    };
    return QtMocHelpers::metaObjectData<Sprite, qt_meta_tag_ZN6SpriteE_t>(QMC::MetaObjectFlag{}, qt_stringData,
            qt_methods, qt_properties, qt_enums);
}
Q_CONSTINIT const QMetaObject Sprite::staticMetaObject = { {
    QMetaObject::SuperData::link<QWidget::staticMetaObject>(),
    qt_staticMetaObjectStaticContent<qt_meta_tag_ZN6SpriteE_t>.stringdata,
    qt_staticMetaObjectStaticContent<qt_meta_tag_ZN6SpriteE_t>.data,
    qt_static_metacall,
    nullptr,
    qt_staticMetaObjectRelocatingContent<qt_meta_tag_ZN6SpriteE_t>.metaTypes,
    nullptr
} };

void Sprite::qt_static_metacall(QObject *_o, QMetaObject::Call _c, int _id, void **_a)
{
    auto *_t = static_cast<Sprite *>(_o);
    if (_c == QMetaObject::InvokeMetaMethod) {
        switch (_id) {
        case 0: _t->frameAdded((*reinterpret_cast< std::add_pointer_t<Frame*>>(_a[1]))); break;
        case 1: _t->frameRemoved((*reinterpret_cast< std::add_pointer_t<Frame*>>(_a[1])),(*reinterpret_cast< std::add_pointer_t<int>>(_a[2]))); break;
        case 2: _t->gridSizeChanged((*reinterpret_cast< std::add_pointer_t<int>>(_a[1]))); break;
        case 3: _t->activeToolChanged((*reinterpret_cast< std::add_pointer_t<Tool>>(_a[1]))); break;
        case 4: _t->selectedBrushColorChanged((*reinterpret_cast< std::add_pointer_t<QColor>>(_a[1]))); break;
        case 5: _t->toolSizeChanged((*reinterpret_cast< std::add_pointer_t<int>>(_a[1]))); break;
        case 6: _t->unlockCanvas((*reinterpret_cast< std::add_pointer_t<int>>(_a[1]))); break;
        case 7: _t->currentFrameHasChanged((*reinterpret_cast< std::add_pointer_t<Frame*>>(_a[1]))); break;
        case 8: _t->displayPreviewFrame((*reinterpret_cast< std::add_pointer_t<QImage>>(_a[1]))); break;
        case 9: _t->addFrame(); break;
        case 10: _t->removeFrame(); break;
        case 11: _t->duplicateFrame(); break;
        case 12: _t->goToPreviousFrame(); break;
        case 13: _t->goToNextFrame(); break;
        case 14: _t->onSetSizeClicked((*reinterpret_cast< std::add_pointer_t<int>>(_a[1]))); break;
        case 15: _t->save((*reinterpret_cast< std::add_pointer_t<QString>>(_a[1]))); break;
        case 16: _t->load((*reinterpret_cast< std::add_pointer_t<QString>>(_a[1]))); break;
        case 17: _t->setActiveTool((*reinterpret_cast< std::add_pointer_t<Tool>>(_a[1]))); break;
        case 18: _t->setSelectedBrushColor((*reinterpret_cast< std::add_pointer_t<QColor>>(_a[1]))); break;
        case 19: _t->setToolSize((*reinterpret_cast< std::add_pointer_t<int>>(_a[1]))); break;
        case 20: _t->setFrameRate((*reinterpret_cast< std::add_pointer_t<int>>(_a[1]))); break;
        case 21: _t->nextPreviewFrame(); break;
        default: ;
        }
    }
    if (_c == QMetaObject::IndexOfMethod) {
        if (QtMocHelpers::indexOfMethod<void (Sprite::*)(Frame * )>(_a, &Sprite::frameAdded, 0))
            return;
        if (QtMocHelpers::indexOfMethod<void (Sprite::*)(Frame * , int )>(_a, &Sprite::frameRemoved, 1))
            return;
        if (QtMocHelpers::indexOfMethod<void (Sprite::*)(int )>(_a, &Sprite::gridSizeChanged, 2))
            return;
        if (QtMocHelpers::indexOfMethod<void (Sprite::*)(Tool )>(_a, &Sprite::activeToolChanged, 3))
            return;
        if (QtMocHelpers::indexOfMethod<void (Sprite::*)(const QColor & )>(_a, &Sprite::selectedBrushColorChanged, 4))
            return;
        if (QtMocHelpers::indexOfMethod<void (Sprite::*)(int )>(_a, &Sprite::toolSizeChanged, 5))
            return;
        if (QtMocHelpers::indexOfMethod<void (Sprite::*)(int )>(_a, &Sprite::unlockCanvas, 6))
            return;
        if (QtMocHelpers::indexOfMethod<void (Sprite::*)(Frame * )>(_a, &Sprite::currentFrameHasChanged, 7))
            return;
        if (QtMocHelpers::indexOfMethod<void (Sprite::*)(const QImage & )>(_a, &Sprite::displayPreviewFrame, 8))
            return;
    }
}

const QMetaObject *Sprite::metaObject() const
{
    return QObject::d_ptr->metaObject ? QObject::d_ptr->dynamicMetaObject() : &staticMetaObject;
}

void *Sprite::qt_metacast(const char *_clname)
{
    if (!_clname) return nullptr;
    if (!strcmp(_clname, qt_staticMetaObjectStaticContent<qt_meta_tag_ZN6SpriteE_t>.strings))
        return static_cast<void*>(this);
    return QWidget::qt_metacast(_clname);
}

int Sprite::qt_metacall(QMetaObject::Call _c, int _id, void **_a)
{
    _id = QWidget::qt_metacall(_c, _id, _a);
    if (_id < 0)
        return _id;
    if (_c == QMetaObject::InvokeMetaMethod) {
        if (_id < 22)
            qt_static_metacall(this, _c, _id, _a);
        _id -= 22;
    }
    if (_c == QMetaObject::RegisterMethodArgumentMetaType) {
        if (_id < 22)
            *reinterpret_cast<QMetaType *>(_a[0]) = QMetaType();
        _id -= 22;
    }
    return _id;
}

// SIGNAL 0
void Sprite::frameAdded(Frame * _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 0, nullptr, _t1);
}

// SIGNAL 1
void Sprite::frameRemoved(Frame * _t1, int _t2)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 1, nullptr, _t1, _t2);
}

// SIGNAL 2
void Sprite::gridSizeChanged(int _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 2, nullptr, _t1);
}

// SIGNAL 3
void Sprite::activeToolChanged(Tool _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 3, nullptr, _t1);
}

// SIGNAL 4
void Sprite::selectedBrushColorChanged(const QColor & _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 4, nullptr, _t1);
}

// SIGNAL 5
void Sprite::toolSizeChanged(int _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 5, nullptr, _t1);
}

// SIGNAL 6
void Sprite::unlockCanvas(int _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 6, nullptr, _t1);
}

// SIGNAL 7
void Sprite::currentFrameHasChanged(Frame * _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 7, nullptr, _t1);
}

// SIGNAL 8
void Sprite::displayPreviewFrame(const QImage & _t1)
{
    QMetaObject::activate<void>(this, &staticMetaObject, 8, nullptr, _t1);
}
QT_WARNING_POP
