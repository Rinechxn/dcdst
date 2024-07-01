#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include "logstatus.h"
#include <QProcess>

QT_BEGIN_NAMESPACE
namespace Ui {
class MainWindow;
}
QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    MainWindow(QWidget *parent = nullptr);
    ~MainWindow();

private slots:
    void saveConfig();

    void on_startBtn_clicked();

    void on_pushButton_clicked();

    void on_actionAbout_triggered();

    void on_actionExit_triggered();

    void on_clrBtn_clicked();

private:
    Ui::MainWindow *ui;
    static const QString OBS_BINARY_PATH;
    LogStatus *logStatusDialog;
};
#endif // MAINWINDOW_H
