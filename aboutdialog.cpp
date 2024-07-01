#include "aboutdialog.h"
#include "ui_aboutdialog.h"
#include <QtGlobal>

AboutDialog::AboutDialog(QWidget *parent)
    : QDialog(parent)
    , ui(new Ui::AboutDialog)
{
    ui->setupUi(this);
    ui->qt_version->setText(QString("%1").arg(QT_VERSION_STR));
}

AboutDialog::~AboutDialog()
{
    delete ui;
}
