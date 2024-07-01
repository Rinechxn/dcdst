#ifndef LOGSTATUS_H
#define LOGSTATUS_H

#include <QDialog>

namespace Ui {
class LogStatus;
}

class LogStatus : public QDialog
{
    Q_OBJECT

public:
    explicit LogStatus(QWidget *parent = nullptr);
    ~LogStatus();

    // Method to append log messages
    void appendLog(const QString &message);

private:
    Ui::LogStatus *ui;
};

#endif // LOGSTATUS_H
